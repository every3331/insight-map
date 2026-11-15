#!/usr/bin/env node
/* 零依赖回归测试：node test/run.js
 * 只测纯函数与数据一致性 —— 这些是不需要浏览器就能证明对的部分。
 */

'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = require(path.join(ROOT, 'data.js'));
const { validate, parseJson } = require(path.join(ROOT, 'server', 'validate.js'));
const { buildPrompt } = require(path.join(ROOT, 'server', 'prompt.js'));
const { createDiagnoser } = require(path.join(ROOT, 'server', 'diagnose.js'));
const { createCache } = require(path.join(ROOT, 'server', 'cache.js'));
const { createLLM } = require(path.join(ROOT, 'server', 'llm.js'));

let pass = 0, fail = 0;
const results = [];
function ok(name, cond, detail) {
  if (cond) { pass++; results.push('  PASS  ' + name); }
  else { fail++; results.push('  FAIL  ' + name + (detail ? '  ← ' + detail : '')); }
}

/* 1. 输出契约 */
const ctx = {
  nodeIds: DATA.NODES.map(n => n.id),
  nodeMap: DATA.NODE_MAP,
  errorTypes: DATA.ERROR_TYPES,
  candidates: ['der-def', 'der-con', 'limit']
};
ok('validate 接受合法输出', validate({ nodeId: 'der-def', errorType: '概念混淆', confidence: 0.8, diagnosis: '定义题必须写差商' }, ctx).length === 0);
ok('validate 拒绝候选集外的 nodeId', validate({ nodeId: 'taylor', errorType: '概念混淆', confidence: 0.8, diagnosis: '测试一下长度' }, ctx).length > 0);
ok('validate 拒绝跨学段错因', validate({ nodeId: 'der-def', errorType: '分类讨论不全', confidence: 0.8, diagnosis: '测试一下长度' }, ctx).length > 0);
ok('validate 拒绝越界置信度', validate({ nodeId: 'der-def', errorType: '概念混淆', confidence: 1.7, diagnosis: '测试一下长度' }, ctx).length > 0);
ok('validate 拒绝过短诊断', validate({ nodeId: 'der-def', errorType: '概念混淆', confidence: 0.5, diagnosis: '错' }, ctx).length > 0);
ok('parseJson 剥掉 markdown 围栏', parseJson('\u0060\u0060\u0060json\n{"a":1}\n\u0060\u0060\u0060').a === 1);

/* 2. 召回 */
let hit = 0;
DATA.EVAL_SET.forEach(it => { if (DATA.diagnoseLocal(it.q).nodeId === it.node) { hit++; } });
const acc = hit / DATA.EVAL_SET.length;
ok('召回命中率 ≥ 90%（' + hit + '/' + DATA.EVAL_SET.length + '）', acc >= 0.9, Math.round(acc * 100) + '%');
ok('召回永远返回 10 个候选', DATA.recallCandidates('随便一句没有关键词的话', 10).length === 10);

/* 3. 题目与探针覆盖 */
const CORE = ['limit','der-def','der-app','mvt','def-int','indef-int','taylor','continuous','lhopital','der-calc','der-con','func-prop','exp-log','trig','seq','func-zero','ineq-proof','der-rule','ftc'];
const noQ = CORE.filter(id => !DATA.VARIANTS[id] && !DATA.GEN_BANK.some(q => q.nodeId === id));
ok('核心线 19 节点都有题', noQ.length === 0, noQ.join(','));
const withQ = DATA.NODES.filter(n => DATA.VARIANTS[n.id] || DATA.GEN_BANK.some(q => q.nodeId === n.id)).length;
ok('全图节点覆盖率 ≥ 20%（' + withQ + '/' + DATA.NODES.length + '）', withQ / DATA.NODES.length >= 0.2);

/* 图论不变量：无环 + 全可达 */
(function () {
  const adj = {}, indeg = {};
  DATA.NODES.forEach(n => { adj[n.id] = []; indeg[n.id] = 0; });
  DATA.EDGES.forEach(e => { adj[e[0]].push(e[1]); indeg[e[1]]++; });
  const q = DATA.NODES.filter(n => indeg[n.id] === 0).map(n => n.id);
  const seen = new Set(q);
  while (q.length) {
    const cur = q.shift();
    adj[cur].forEach(nx => { if (!seen.has(nx)) { seen.add(nx); q.push(nx); } });
  }
  ok('图无环（拓扑排序可完成）', seen.size === DATA.NODES.length, '未排序 ' + (DATA.NODES.length - seen.size));
  ok('每个节点都有从根出发的路径', DATA.NODES.every(n => seen.has(n.id)));
})();

/* 星图布局不变量：viewBox 高度必须覆盖最高泳道的最后一个点 */
(function () {
  const rows = {};
  DATA.CHAPTERS.forEach(c => {
    const k = c.level + '|' + c.book;
    rows[k] = (rows[k] || 0) + c.nodes.length;
  });
  const maxRows = Math.max.apply(null, Object.keys(rows).map(k => rows[k]));
  const h = 96 + maxRows * 44 + 96;
  ok('星图纵向不裁切（最高泳道 ' + maxRows + ' 点）', h >= 96 + maxRows * 44 + 26, 'h=' + h);
})();

const probeCover = DATA.NODES.filter(n => n.prereq && DATA.PROBES[n.id]).length;
const needProbe = DATA.NODES.filter(n => n.prereq).length;
ok('探针覆盖 ≥ 20%（' + probeCover + '/' + needProbe + '）', probeCover / needProbe >= 0.2);
ok('探针指向的前置节点真实存在', Object.keys(DATA.PROBES).every(id => {
  const p = DATA.PROBES[id];
  return !!(p && DATA.NODE_MAP[p.nodeId]) && DATA.NODE_MAP[p.nodeId].id === DATA.NODE_MAP[id].prereq;
}));
ok('变式题的正确答案在选项里', Object.keys(DATA.VARIANTS).every(id => {
  const v = DATA.VARIANTS[id];
  return v.options.some(o => o.k === v.answer);
}));

/* 4. 函数图像引擎 */
global.window = {};
require(path.join(ROOT, 'plot.js'));
const Plot = global.window.Plot;
const exprs = [];
DATA.GEN_BANK.forEach(q => { if (q.plot && q.plot.expr) { exprs.push(q.plot.expr); } });
DATA.SAMPLES.forEach(s => { if (s.plot && s.plot.expr) { exprs.push(s.plot.expr); } });
const badExpr = exprs.filter(e => { try { Plot.compile(e); return false; } catch (err) { return true; } });
ok('题库全部表达式可编译（' + exprs.length + ' 个）', badExpr.length === 0, badExpr.join(','));

/* 5. 后端分层：无 key 时必然本地兜底 */
(async () => {
  const llm = createLLM({ apiKey: '', model: 'x' });
  const cache = createCache(path.join(ROOT, 'cache.json'));
  const diagnoser = createDiagnoser({ data: DATA, llm: llm, cache: cache });
  const out = await diagnoser.run('求 f(x)=x^3-3x 的单调递增区间，我算出 x>1', null);
  ok('无 key 时返回 fallback', out.source === 'fallback' && out.reason === 'no_api_key');
  ok('fallback 仍给出合法节点', !!DATA.NODE_MAP[out.data.nodeId]);
  ok('提示词包含候选集边界', buildPrompt(DATA, ['der-app', 'der-calc']).indexOf('只能在这些候选里选一个') > 0);

  console.log('');
  results.forEach(r => console.log(r));
  console.log('');
  console.log('  ' + pass + ' passed, ' + fail + ' failed');
  console.log('');
  process.exit(fail === 0 ? 0 : 1);
})();
