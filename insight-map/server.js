#!/usr/bin/env node
/* 洞见 · 最小后端（零依赖）
 *
 * 做三件事：
 *   1. 托管静态文件，让前端能以 http:// 打开（file:// 下无法调接口）
 *   2. POST /api/diagnose —— 调模型 + schema 校验 + 失败重试一次 + 落盘缓存
 *   3. 任何一步失败都退回本地规则引擎，接口永远有结果返回
 *
 * 启动：
 *   node server.js
 *   # 想接真模型再加环境变量
 *   $env:LLM_API_KEY="sk-..."          # PowerShell
 *   $env:LLM_MODEL="gpt-4o-mini"
 *   $env:LLM_BASE_URL="https://api.openai.com/v1"
 *
 * 任何 OpenAI 兼容网关都能用（DeepSeek、通义、vLLM、one-api 等），改 BASE_URL 即可。
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = require('./data.js');

const PORT = Number(process.env.PORT || 5173);
const BASE_URL = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const API_KEY = process.env.LLM_API_KEY || '';
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 12000);
const ROOT = __dirname;
const CACHE_FILE = path.join(ROOT, 'cache.json');

const NODE_IDS = DATA.NODES.map(n => n.id);
const ERRORS = DATA.ERROR_TYPES;

/* ───────────── 缓存 ───────────── */

let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch (e) { cache = {}; }

function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8'); } catch (e) { /* 只读盘就算了 */ }
}

function keyOf(text) {
  return crypto.createHash('sha256').update(String(text).replace(/\s+/g, '')).digest('hex').slice(0, 16);
}

/* ───────────── schema 校验 ─────────────
 * 模型输出不可信。四条规则，一条不满足就算失败。
 * 第二段精判的候选集是硬边界：nodeId 必须落在候选里。
 */
function validate(d, cands) {
  const errs = [];
  if (!d || typeof d !== 'object') { return ['not an object']; }

  const allowed = (cands && cands.length) ? cands : NODE_IDS;

  if (typeof d.nodeId !== 'string' || allowed.indexOf(d.nodeId) < 0) {
    errs.push('nodeId 不在候选集：' + JSON.stringify(d.nodeId));
  }
  const node = DATA.NODE_MAP[d.nodeId];
  const types = node ? DATA.ERROR_TYPES[node.level] : null;
  if (typeof d.errorType !== 'string' || (types && types.indexOf(d.errorType) < 0)) {
    errs.push('errorType 不符合该学段枚举：' + JSON.stringify(d.errorType));
  }
  if (typeof d.confidence !== 'number' || !isFinite(d.confidence) || d.confidence < 0 || d.confidence > 1) {
    errs.push('confidence 必须是 0–1 的数字');
  }
  if (typeof d.diagnosis !== 'string' || d.diagnosis.trim().length < 4 || d.diagnosis.length > 160) {
    errs.push('diagnosis 长度必须在 4–160 之间');
  }
  if (d.answer !== undefined && (typeof d.answer !== 'string' || d.answer.length > 120)) {
    errs.push('answer 必须是 120 字以内的字符串');
  }
  if (d.steps !== undefined) {
    if (!Array.isArray(d.steps) || d.steps.length < 2 || d.steps.length > 6 ||
        d.steps.some(s => typeof s !== 'string' || s.length > 120)) {
      errs.push('steps 必须是 2–6 条、每条 120 字以内的字符串数组');
    }
  }
  if (d.pitfall !== undefined && (typeof d.pitfall !== 'string' || d.pitfall.length > 120)) {
    errs.push('pitfall 必须是 120 字以内的字符串');
  }
  return errs;
}

/* ───────────── 提示词（按候选集动态生成） ───────────── */

function buildPrompt(cands) {
  const lvName = { jun: '初中', sen: '高中', uni: '大学' };

  const lines = cands.map(id => {
    const n = DATA.NODE_MAP[id];
    const pre = n.prereq && DATA.NODE_MAP[n.prereq] ? DATA.NODE_MAP[n.prereq].label : '—';
    return `  - ${n.id}｜${n.label}｜${n.code}｜${lvName[n.level]}｜前置：${pre}`;
  }).join('\n');

  const typeLines = ['jun', 'sen', 'uni']
    .map(lv => `  ${lvName[lv]}：` + DATA.ERROR_TYPES[lv].join(' / '))
    .join('\n');

  return [
    '你是初中→高中→高等数学一贯制的错题诊断引擎，学生可能是任何一个学段。',
    '',
    '第一步已经做完了：系统用关键词把这题召回成下面这 10 个候选节点。',
    '你只能在这 10 个里选一个，禁止自创、禁止拼错、禁止选候选之外的：',
    lines,
    '',
    '错因类型按命中节点的学段选，各学段枚举不同：',
    typeLines,
    '',
    '任务：判断学生真正卡住的知识点、错因类型、置信度，并用一句中文说清楚错在哪。',
    '不要讲整道题，不要输出 markdown。',
    '',
    '如果能确定这道题的答案，再补三个字段；不确定就整体省略，绝对不要编：',
    '  answer   参考答案，一行，120 字以内',
    '  steps    2–6 条关键步骤，每条 120 字以内',
    '  pitfall  这一步最常见的错误，一句',
    '',
    '只输出 JSON，字段固定：',
    '{"nodeId":"...","errorType":"...","confidence":0.85,"diagnosis":"...",',
    ' "answer":"...","steps":["...","..."],"pitfall":"..."}'
  ].join('\n');
}

/* ───────────── 调模型 ───────────── */

async function callModel(messages) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages
      }),
      signal: ctl.signal
    });
    if (!res.ok) {
      throw new Error('upstream ' + res.status + ' ' + (await res.text()).slice(0, 200));
    }
    const j = await res.json();
    const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) { throw new Error('empty completion'); }
    return parseJson(content);
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(raw) {
  let s = String(raw).trim();
  // 有些网关会带 ```json 围栏
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { s = s.slice(a, b + 1); }
  return JSON.parse(s);
}

async function diagnoseWithModel(text, cands) {
  const messages = [
    { role: 'system', content: buildPrompt(cands) },
    { role: 'user', content: '题目与学生写法：\n' + text }
  ];

  const first = await callModel(messages);
  if (validate(first, cands).length === 0) { return { data: first, repaired: false }; }

  // 失败重试一次：把错误回给模型，要求只修格式
  messages.push({ role: 'assistant', content: JSON.stringify(first) });
  messages.push({
    role: 'user',
    content: '你的输出不符合 schema：' + validate(first, cands).join('；') +
             '。只输出合法 JSON，nodeId 必须来自候选集，errorType 必须符合该学段枚举，不要任何解释。'
  });

  const second = await callModel(messages);
  const errs = validate(second, cands);
  if (errs.length) {
    const e = new Error('schema failed after retry: ' + errs.join('；'));
    e.schemaErrors = errs;
    throw e;
  }
  return { data: second, repaired: true };
}

/* ───────────── 静态文件 ───────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') { p = '/index.html'; }

  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!file.startsWith(ROOT)) { return send(res, 403, 'text/plain', 'forbidden'); }

  fs.readFile(file, (err, buf) => {
    if (err) { return send(res, 404, 'text/plain; charset=utf-8', 'not found'); }
    const ext = path.extname(file).toLowerCase();
    send(res, 200, MIME[ext] || 'application/octet-stream', buf);
  });
}

function send(res, code, type, body) {
  res.writeHead(code, {
    'content-type': type,
    'cache-control': 'no-store',
    'access-control-allow-origin': '*'
  });
  res.end(body);
}

function sendJson(res, code, obj) {
  send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj));
}

/* ───────────── 接口 ───────────── */

async function handleDiagnose(req, res) {
  let raw = '';
  req.on('data', c => {
    raw += c;
    if (raw.length > 64 * 1024) { req.destroy(); }
  });
  req.on('end', async () => {
    let text = '';
    let cands = null;
    try {
      const body = JSON.parse(raw || '{}');
      text = String(body.text || '').trim();
      if (Array.isArray(body.candidates)) {
        cands = body.candidates.filter(id => DATA.NODE_MAP[id]).slice(0, 12);
      }
    } catch (e) { /* ignore */ }

    if (text.length < 4) { return sendJson(res, 400, { ok: false, error: 'text too short' }); }
    if (text.length > 1200) { text = text.slice(0, 1200); }

    // 第一段：粗筛（前端已算过就沿用，保证两端一致）
    if (!cands || !cands.length) { cands = DATA.recallCandidates(text, 10); }

    const key = keyOf(text);

    // 1. 缓存命中 —— 演示现场最稳的一条路
    if (cache[key]) {
      return sendJson(res, 200, { ok: true, source: 'cache', candidates: cands, data: cache[key] });
    }

    // 2. 没有 key，直接本地兜底，不假装调用了模型
    if (!API_KEY) {
      return sendJson(res, 200, {
        ok: true,
        source: 'fallback',
        reason: 'no_api_key',
        candidates: cands,
        data: DATA.diagnoseLocal(text)
      });
    }

    // 3. 调模型（只喂候选集）
    try {
      const out = await diagnoseWithModel(text, cands);
      cache[key] = out.data;
      saveCache();
      return sendJson(res, 200, {
        ok: true,
        source: 'model',
        model: MODEL,
        repaired: out.repaired,
        candidates: cands,
        data: out.data
      });
    } catch (e) {
      return sendJson(res, 200, {
        ok: true,
        source: 'fallback',
        reason: 'model_failed',
        detail: String(e.message || e).slice(0, 200),
        candidates: cands,
        data: DATA.diagnoseLocal(text)
      });
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET,POST,OPTIONS'
    });
    return res.end();
  }

  if (req.url.startsWith('/api/health')) {
    return sendJson(res, 200, {
      ok: true,
      model: API_KEY ? MODEL : null,
      hasKey: !!API_KEY,
      cache: Object.keys(cache).length,
      nodes: NODE_IDS.length
    });
  }

  if (req.url.startsWith('/api/diagnose') && req.method === 'POST') {
    return handleDiagnose(req, res);
  }

  if (req.method === 'GET') { return serveStatic(req, res); }

  send(res, 405, 'text/plain', 'method not allowed');
});

server.listen(PORT, () => {
  console.log('洞见 · 知识地图  →  http://127.0.0.1:' + PORT);
  console.log('  模型：' + (API_KEY ? MODEL + ' @ ' + BASE_URL : '未配置 LLM_API_KEY（走本地兜底）'));
  console.log('  缓存：' + Object.keys(cache).length + ' 条  (' + CACHE_FILE + ')');
});
