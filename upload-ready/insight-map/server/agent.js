'use strict';
/* 洞见 · Agent 接口（零依赖版，和 Next.js 的 /api/agent 同契约）
 *
 * 为什么要它：Next.js 那套是正式后端；这个零依赖实现保证「clone 下来 node server.js 就能跑」，
 * 现场没有 npm install 也能演示 Agent 链路。两边输入输出完全一致，前端不用区分。
 */

const fs = require('fs');
const path = require('path');

function mask(k) {
  const s = String(k || '');
  if (!s) { return ''; }
  if (s.length <= 8) { return '****'; }
  return s.slice(0, 4) + '…' + s.slice(-4);
}

function createAgent(opts) {
  const CONFIG_FILE = opts.configFile || path.join(process.cwd(), '.agent-config.json');

  /* 密钥只存在后端：优先环境变量，其次本地配置文件（前端永远拿不到明文） */
  let fileCfg = {};
  try { fileCfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (e) { fileCfg = {}; }

  let baseUrl = String(opts.baseUrl || fileCfg.baseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
  let apiKey = opts.apiKey || fileCfg.apiKey || '';
  let model = opts.model || fileCfg.model || 'deepseek-chat';
  const timeoutMs = Number(opts.timeoutMs || 25000);

  function buildPrompt(input, cands) {
    const lines = cands.map(c =>
      '  - ' + c.id + '｜' + c.label + '｜' + c.code + '｜' + (c.level === 'uni' ? '大学' : '高中')
    ).join('\n');
    return [
      '你是一名跨学段（高中→大学）数学错题诊断助教。',
      '',
      '系统已用关键词召回下列候选知识点，你只能从中选一个 nodeId，禁止自创：',
      lines || '  （无候选）',
      '',
      '错因 errorType 只能取：符号错误 / 概念混淆 / 分类讨论不全 / 换元不当 / 运算跳步 / 条件遗漏 / 定理误用 / 极限判错。',
      '',
      '【学生题目】', input.question || '（未提供）',
      '',
      '【学生自己的写法】', input.work || '（未提供）',
      '',
      '只输出 JSON：{"nodeId":"","errorType":"","confidence":0.0,"vernict":"wrong","diagnosis":"","steps":["",""],"trap":"","next":[""]}',
      'verdict 只能取 right / wrong / unclear；steps 2-6 条，每步一句人话并写清算式；next 最多 3 条。'
    ].join('\n');
  }

  async function post(messages) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: messages
        }),
        signal: ctl.signal
      });
      if (!res.ok) { throw new Error('upstream ' + res.status + ' ' + (await res.text()).slice(0, 160)); }
      const j = await res.json();
      const content = j?.choices?.[0]?.message?.content;
      if (!content) { throw new Error('empty completion'); }
      let s = String(content).trim().replace(/^\`\`\`(?:json)?/i, '').replace(/\`\`\`$/, '').trim();
      const a = s.indexOf('{'), b = s.lastIndexOf('}');
      if (a >= 0 && b > a) { s = s.slice(a, b + 1); }
      return JSON.parse(s);
    } finally { clearTimeout(timer); }
  }

  /* 没有 key / 模型挂了：用本地引擎给出「真实可用的诊断」，而不是占位文本 */
  function fallback(input, cands, why) {
    const D = opts.data;
    if (!D || !D.diagnoseLocal) {
      return {
        ok: true, source: 'fallback', reason: why,
        data: {
          nodeId: cands[0] ? cands[0].id : '', errorType: '概念混淆', confidence: 0.3, verdict: 'unclear',
          diagnosis: '后端没有模型 key，本地引擎也不可用。',
          steps: ['先把题目里的已知和所求分开写', '再对照这个知识点的定义式，一步步验'],
          trap: '没有模型时最容易直接代公式，先别急。'
        }
      };
    }
    const text = input.question + ' ' + (input.work || '');
    const local = D.diagnoseLocal(text);

    /* 候选集是硬边界：若本地判定不在候选内，就在候选里按同一套评分重新选一个，
       保证「nodeId 与讲解文本」永远指向同一个知识点。 */
    let nodeId = local.nodeId;
    if (cands.length && !cands.some(c => c.id === nodeId)) {
      let best = null, bestScore = -1;
      cands.forEach(c => {
        const n = D.NODE_MAP[c.id];
        const s = (n && D.scoreNode) ? D.scoreNode(text, n) : 0;
        if (s > bestScore) { bestScore = s; best = c.id; }
      });
      nodeId = best || cands[0].id;
    }

    const node = D.NODE_MAP[nodeId] || null;
    const intro = D.introFor ? D.introFor(nodeId) : null;
    const same = nodeId === local.nodeId;
    const steps = (intro && intro.pts ? intro.pts.slice(0, 4) : []);
    const prefix = why === 'no_api_key' ? '（本地引擎）' : '（模型没给出结果，已回落本地引擎）';
    const diag = same
      ? local.diagnosis
      : (intro && intro.one ? intro.one : ('这道题卡在「' + (node ? node.label : nodeId) + '」，先把这一节的定式过一遍。'));

    return {
      ok: true,
      source: why === 'no_api_key' ? 'local-engine' : 'fallback',
      reason: why,
      adjusted: !same,
      data: {
        nodeId: nodeId,
        errorType: same ? local.errorType : '概念混淆',
        confidence: Math.round((same ? (local.confidence || 0.6) : Math.min(0.72, (local.confidence || 0.6))) * 100) / 100,
        verdict: 'unclear',
        diagnosis: prefix + diag,
        steps: steps.length ? steps : ['先写清题目里的已知与所求', '再对照这个知识点的定义式逐步验算'],
        trap: (intro && intro.trap) ? intro.trap : '最容易直接代公式，先别急。',
        next: node && node.prereq && D.NODE_MAP[node.prereq]
          ? ['先确认前置「' + D.NODE_MAP[node.prereq].label + '」是否通了']
          : []
      }
    };
  }

  /* 流式讲解的正文：有 key 用模型，没 key 用本地引擎拼一段人话 */
  async function explain(input) {
    const cands = Array.isArray(input.candidates) ? input.candidates.slice(0, 12) : [];
    if (apiKey) {
      try {
        const res = await postText([
          { role: 'system', content: '你是一名耐心的数学助教。用最直白的话讲，先给结论，再分步，每步一句人话并写算式，最后提醒一个最常见的坑。不要 markdown 标记。' },
          { role: 'user', content: '题目：' + input.question + '\n我的写法：' + (input.work || '（没写）') }
        ]);
        if (res) { return res; }
      } catch (e) { /* 落到本地 */ }
    }
    const d = fallback(input, cands, apiKey ? 'model_failed' : 'no_api_key').data;
    const lines = [d.diagnosis, ''];
    (d.steps || []).forEach((s, i) => lines.push((i + 1) + '. ' + s));
    if (d.trap) { lines.push('', '最容易错：' + d.trap); }
    if (d.next && d.next.length) { lines.push('', '下一步：' + d.next.join('；')); }
    return lines.join('\n');
  }

  /* 多轮追问：把最近几轮对话和当前题目一起喂给模型 */
  async function chat(input) {
    const hist = Array.isArray(input.messages) ? input.messages.slice(-8) : [];
    const cands = Array.isArray(input.candidates) ? input.candidates.slice(0, 12) : [];
    const lastUser = hist.length && hist[hist.length - 1].role === 'user' ? hist[hist.length - 1].content : '';

    if (apiKey) {
      const sys = [
        '你是耐心中文数学助教，正在和一个学生一问一答。',
        '规则：只讲这一道题和它涉及的知识点；用最直白的话；每一步都写出算式；不确定就说不确定，不要编。',
        '当前题目：' + (input.question || '（无）'),
        '学生当时的写法：' + (input.work || '（无）'),
        cands.length ? '可涉及的知识点（只能在这些里）：' + cands.map(c => c.id + '=' + c.label).join('、') : '',
        '回答控制在 240 字以内，不要 markdown 标题。'
      ].filter(Boolean).join('\n');
      try {
        const text = await postText([{ role: 'system', content: sys }].concat(hist));
        if (text) { return text; }
      } catch (e) { /* 落到本地 */ }
    }

    /* 没 key：用本地引擎回答，并老实说明 */
    const D = opts.data;
    const text = input.question + ' ' + (input.work || '') + ' ' + lastUser;
    const local = D ? D.diagnoseLocal(text) : null;
    const node = local ? D.NODE_MAP[local.nodeId] : null;
    const intro = (D && local && D.introFor) ? D.introFor(local.nodeId) : null;
    const out = [];
    out.push('（本地引擎 · 没有模型 key，先给你能立刻用的部分）');
    if (node) {
      out.push('你现在这道题落在「' + node.code + ' ' + node.label + '」这一节。');
      if (intro && intro.pts) { intro.pts.slice(0, 3).forEach((s, i) => out.push((i + 1) + '. ' + s)); }
      if (intro && intro.trap) { out.push('最容易错：' + intro.trap); }
      if (node.prereq && D.NODE_MAP[node.prereq]) {
        out.push('如果上面这些还是看不懂，先回前置「' + D.NODE_MAP[node.prereq].label + '」，它才是地基。');
      }
    } else {
      out.push('我这边没有拿到题目，把题干贴到左边再试一次。');
    }
    if (lastUser) { out.push('（你问的是：' + lastUser.slice(0, 40) + '）'); }
    return out.join('\n');
  }

  async function postText(messages) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({ model: model, temperature: 0.4, messages: messages }),
        signal: ctl.signal
      });
      if (!res.ok) { throw new Error('upstream ' + res.status); }
      const j = await res.json();
      return j?.choices?.[0]?.message?.content || '';
    } finally { clearTimeout(timer); }
  }

  async function diagnose(input) {
    const cands = Array.isArray(input.candidates) ? input.candidates.slice(0, 12) : [];
    if (!apiKey) { return fallback(input, cands, 'no_api_key'); }
    try {
      const out = await post([
        { role: 'system', content: buildPrompt(input, cands) },
        { role: 'user', content: '题目与写法已给出，请输出 JSON。' }
      ]);
      if (cands.length && !cands.some(c => c.id === out.nodeId)) {
        return { ok: false, error: 'nodeId 不在候选集', got: out.nodeId };
      }
      return { ok: true, source: 'model', model: model, data: out };
    } catch (e) {
      return fallback(input, cands, 'model_failed');
    }
  }

  /* 运行时设置密钥：只允许本机调用（路由层再校验一次来源） */
  function setConfig(cfg) {
    if (cfg && typeof cfg.apiKey === 'string' && cfg.apiKey.trim()) { apiKey = cfg.apiKey.trim(); }
    if (cfg && typeof cfg.baseUrl === 'string' && cfg.baseUrl.trim()) { baseUrl = cfg.baseUrl.trim().replace(/\/+$/, ''); }
    if (cfg && typeof cfg.model === 'string' && cfg.model.trim()) { model = cfg.model.trim(); }
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        apiKey: apiKey, baseUrl: baseUrl, model: model, savedAt: new Date().toISOString()
      }, null, 2), 'utf8');
    } catch (e) { /* 只读盘就算了，内存里已生效 */ }
    return status();
  }

  function status() {
    return {
      ok: true,
      mode: apiKey ? 'live' : 'no-key',
      masked: mask(apiKey),
      model: apiKey ? model : null,
      host: baseUrl.replace(/^https?:\/\//, '').split('/')[0],
      runtime: 'zero-dep'
    };
  }

  return {
    diagnose, explain, chat, setConfig, status,
    get hasKey() { return !!apiKey; },
    get model() { return model; },
    get baseUrl() { return baseUrl; }
  };
}

module.exports = { createAgent };
