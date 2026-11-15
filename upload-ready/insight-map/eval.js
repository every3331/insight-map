#!/usr/bin/env node
/* 召回评测：把 v1（纯关键词累加）和 v2（素材信号 + 题型信号 + 排斥）放在同一套题上对比。
 *
 *   node eval.js
 *
 * 评测集是 data.js 里的 EVAL_SET（30 条），题面与期望节点都在源码里，可改可扩。
 * 这不是「模型准确率」，是「第一段召回命中率」——模型只在召回的 10 个里选，召回错了模型也救不回来。
 */

'use strict';

const DATA = require('./data.js');

/* ── v1 复刻：保留在这里只作为对照组，业务代码已不用 ── */
function normalize(s) { return String(s).replace(/\s+/g, ''); }
function v1Score(text, n) {
  const t = normalize(text);
  let s = 0;
  n.kw.forEach(k => {
    const weak = k.charAt(0) === '#';
    const kk = normalize(weak ? k.slice(1) : k);
    if (kk && t.indexOf(kk) >= 0) { s += (1 + kk.length / 8) * (weak ? 0.4 : 1); }
  });
  if (t.indexOf(normalize(n.label)) >= 0) { s += 2; }
  return s;
}
function v1Recall(text, k) {
  const scored = DATA.NODES.map(n => ({ id: n.id, s: v1Score(text, n) }))
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const out = scored.slice(0, k).map(x => x.id);
  if (out.length < k) {
    const byDeg = DATA.NODES.slice()
      .sort((a, b) => degree(b.id) - degree(a.id)).map(n => n.id);
    for (const id of byDeg) { if (out.length >= k) { break; } if (out.indexOf(id) < 0) { out.push(id); } }
  }
  return out;
}
function degree(id) {
  let d = 0;
  DATA.EDGES.forEach(e => { if (e[0] === id || e[1] === id) { d++; } });
  return d;
}
function v1Diagnose(text) {
  const cands = v1Recall(text, 10);
  let best = null, bestScore = -1;
  cands.forEach(id => {
    const s = v1Score(text, DATA.NODE_MAP[id]);
    if (s > bestScore) { bestScore = s; best = DATA.NODE_MAP[id]; }
  });
  return best ? best.id : null;
}

/* ── 跑分 ── */
function run(engine, label) {
  const miss = [];
  let hit = 0;
  for (const it of DATA.EVAL_SET) {
    const got = engine(it.q);
    if (got === it.node) { hit++; } else { miss.push({ q: it.q, want: it.node, got: got }); }
  }
  const pct = Math.round(hit / DATA.EVAL_SET.length * 100);
  console.log('  ' + label.padEnd(18) + hit + '/' + DATA.EVAL_SET.length + '  ' + pct + '%');
  return { hit, miss, pct };
}

console.log('');
console.log('洞见 · 召回评测（EVAL_SET ' + DATA.EVAL_SET.length + ' 条）');
console.log('  ' + '-'.repeat(40));
const v2 = run(q => DATA.diagnoseLocal(q).nodeId, 'v2 当前引擎');
const v1 = run(v1Diagnose, 'v1 对照组');

if (v2.miss.length) {
  console.log('');
  console.log('  v2 未命中明细：');
  v2.miss.forEach(m => console.log('    ' + m.q + '\n      期望 ' + m.want + '，得到 ' + m.got));
}

const gain = v2.hit - v1.hit;
console.log('');
console.log('  提升：' + (gain >= 0 ? '+' : '') + gain + ' 题 / ' + DATA.EVAL_SET.length + ' 题');

const nodeCover = DATA.NODES.filter(n => DATA.VARIANTS[n.id] || DATA.GEN_BANK.some(q => q.nodeId === n.id)).length;
const roots = DATA.NODES.filter(n => !n.prereq).length;
const probeCover = DATA.NODES.filter(n => n.prereq && DATA.PROBES[n.id]).length;
console.log('');
console.log('  内容覆盖：节点带题 ' + nodeCover + '/' + DATA.NODES.length +
            ' · 探针 ' + probeCover + '/' + (DATA.NODES.length - roots) + '（主线起点 ' + roots + ' 个无前置）');
console.log('');

process.exit(v2.pct >= 90 ? 0 : 1);
