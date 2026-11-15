'use strict';
/* 一次诊断的编排：缓存 → 模型（含一次修复重试）→ 本地兜底。
 * 任何一条路失败都往回退，接口永远有结果返回。
 */

const { validate } = require('./validate');
const { buildPrompt } = require('./prompt');

function createDiagnoser(opts) {
  const data = opts.data;
  const llm = opts.llm;
  const cache = opts.cache;

  const ctxBase = {
    nodeIds: data.NODES.map(n => n.id),
    nodeMap: data.NODE_MAP,
    errorTypes: data.ERROR_TYPES
  };

  async function diagnoseWithModel(text, cands) {
    const messages = [
      { role: 'system', content: buildPrompt(data, cands) },
      { role: 'user', content: '题目与学生写法：\n' + text }
    ];

    const first = await llm.callModel(messages);
    if (validate(first, { ...ctxBase, candidates: cands }).length === 0) {
      return { data: first, repaired: false };
    }

    messages.push({ role: 'assistant', content: JSON.stringify(first) });
    messages.push({
      role: 'user',
      content: '你的输出不符合 schema：' + validate(first, { ...ctxBase, candidates: cands }).join('；') +
               '。只输出合法 JSON，nodeId 必须来自候选集，errorType 必须符合该学段枚举，不要任何解释。'
    });

    const second = await llm.callModel(messages);
    const errs = validate(second, { ...ctxBase, candidates: cands });
    if (errs.length) {
      const e = new Error('schema failed after retry: ' + errs.join('；'));
      e.schemaErrors = errs;
      throw e;
    }
    return { data: second, repaired: true };
  }

  async function run(text, candsIn) {
    let cands = Array.isArray(candsIn) ? candsIn.filter(id => data.NODE_MAP[id]).slice(0, 12) : [];
    if (!cands.length) { cands = data.recallCandidates(text, 10); }

    const key = cache.keyOf(text);
    const hit = cache.get(key);
    if (hit) { return { ok: true, source: 'cache', candidates: cands, data: hit }; }

    if (!llm.hasKey) {
      return { ok: true, source: 'fallback', reason: 'no_api_key', candidates: cands, data: data.diagnoseLocal(text) };
    }

    try {
      const out = await diagnoseWithModel(text, cands);
      cache.set(key, out.data);
      return { ok: true, source: 'model', model: llm.model, repaired: out.repaired, candidates: cands, data: out.data };
    } catch (e) {
      return {
        ok: true, source: 'fallback', reason: 'model_failed',
        detail: String(e.message || e).slice(0, 200),
        candidates: cands, data: data.diagnoseLocal(text)
      };
    }
  }

  return { run, ctxBase };
}

module.exports = { createDiagnoser };
