'use strict';
/* HTTP 层：路由 + CORS + 请求体读取。业务在 diagnose.js，契约在 validate.js。 */

const http = require('http');
const { createStatic, send, sendJson } = require('./static');

function readBody(req, limitBytes) {
  return new Promise((resolve) => {
    req.setEncoding('utf8');   // 按 UTF-8 解码，避免中文被 chunk 边界劈成乱码
    let raw = '';
    let tooBig = false;
    req.on('data', c => {
      if (tooBig) { return; }
      raw += c;
      if (raw.length > limitBytes) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => resolve(tooBig ? null : raw));
    req.on('error', () => resolve(null));
  });
}

function createApp(opts) {
  const data = opts.data;
  const agent = opts.agent || null;
  const diagnoser = opts.diagnoser;
  const llm = opts.llm;
  const cache = opts.cache;
  const serveStatic = createStatic(opts.root);

  async function handleDiagnose(req, res) {
    const raw = await readBody(req, 64 * 1024);
    if (raw === null) { return sendJson(res, 413, { ok: false, error: 'body too large' }); }

    let text = '';
    let cands = null;
    try {
      const body = JSON.parse(raw || '{}');
      text = String(body.text || '').trim();
      if (Array.isArray(body.candidates)) {
        cands = body.candidates.filter(id => data.NODE_MAP[id]).slice(0, 12);
      }
    } catch (e) { /* ignore */ }

    if (text.length < 4) { return sendJson(res, 400, { ok: false, error: 'text too short' }); }
    if (text.length > 1200) { text = text.slice(0, 1200); }

    const out = await diagnoser.run(text, cands);
    return sendJson(res, 200, out);
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
        model: llm.hasKey ? llm.model : null,
        hasKey: llm.hasKey,
        cache: cache.size(),
        nodes: data.NODES.length,
        variants: Object.keys(data.VARIANTS).length,
        probes: Object.keys(data.PROBES).length,
        evalSet: (data.EVAL_SET || []).length
      });
    }

    /* Agent 接口：与 Next.js 版同契约（GET 健康检查 / POST 诊断） */
    if (req.url.startsWith('/api/agent')) {
      if (!agent) { return sendJson(res, 503, { ok: false, error: 'agent 未启用' }); }
      if (req.method === 'GET') {
        return sendJson(res, 200, agent.status ? agent.status() : {
          ok: true, mode: agent.hasKey ? 'live' : 'no-key', model: agent.hasKey ? agent.model : null, runtime: 'zero-dep'
        });
      }

      /* 设置密钥：只接受本机回环地址，避免别人远程写入你的 key */
      if (req.method === 'POST' && req.url.startsWith('/api/agent/config')) {
        const ip = String((req.socket && req.socket.remoteAddress) || '').replace('::ffff:', '');
        const local = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
        if (!local) { return sendJson(res, 403, { ok: false, error: '只允许本机设置密钥' }); }
        if (!agent.setConfig) { return sendJson(res, 501, { ok: false, error: '当前后端不支持运行时设置' }); }
        return readBody(req, 8 * 1024).then((raw) => {
          let body = {};
          try { body = JSON.parse(raw || '{}'); } catch (e) { /* ignore */ }
          const st = agent.setConfig({
            apiKey: body.apiKey, baseUrl: body.baseUrl, model: body.model
          });
          return sendJson(res, 200, Object.assign({ saved: true }, st));
        }).catch((e) => sendJson(res, 500, { ok: false, error: String(e.message || e) }));
      }
      if (req.method === 'POST') {
        readBody(req, 128 * 1024).then(async (raw) => {
          if (raw === null) { return sendJson(res, 413, { ok: false, error: 'body too large' }); }
          let body = {};
          try { body = JSON.parse(raw || '{}'); } catch (e) { /* ignore */ }
          const question = String(body.question || '').trim();
          const isChat = body.mode === 'chat';
          if (!isChat && question.length < 4) { return sendJson(res, 400, { ok: false, error: '题目太短' }); }
          const payload = {
            question: question,
            work: String(body.work || ''),
            candidates: body.candidates || []
          };

          const isStream = (body.mode === 'stream' && agent.explain) || (body.mode === 'chat' && agent.chat);
          if (isStream) {
            let text = '';
            try {
              text = body.mode === 'chat'
                ? await agent.chat({ question: payload.question, work: payload.work, candidates: payload.candidates, messages: body.messages || [] })
                : await agent.explain(payload);
            } catch (e) { text = '生成失败：' + String(e.message || e); }
            res.writeHead(200, {
              'content-type': 'text/plain; charset=utf-8',
              'cache-control': 'no-store',
              'access-control-allow-origin': '*',
              'x-accel-buffering': 'no'
            });
            const chunks = String(text).match(/[\s\S]{1,26}/g) || [String(text)];
            let i = 0;
            const timer = setInterval(() => {
              if (i >= chunks.length) { clearInterval(timer); res.end(); return; }
              res.write(chunks[i++]);
            }, 16);
            return;
          }

          const out = await agent.diagnose(payload);
          sendJson(res, 200, out);
        }).catch(e => sendJson(res, 500, { ok: false, error: String(e.message || e) }));
        return;
      }
    }

    if (req.url.startsWith('/api/diagnose') && req.method === 'POST') {
      handleDiagnose(req, res).catch(e => sendJson(res, 500, { ok: false, error: String(e.message || e) }));
      return;
    }

    if (req.method === 'GET') { return serveStatic(req, res); }

    send(res, 405, 'text/plain', 'method not allowed');
  });

  return { server, handleDiagnose };
}

module.exports = { createApp };
