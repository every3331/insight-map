/* 洞见 · 规划助教（学习路径）
 *
 * 这一步不靠模型：路径必须由「图谱 + 证据」算出来，模型只能改写措辞。
 * 算法：
 *   1. 取待修复节点（错题本里 state !== 'done'）
 *   2. 对每个断点，沿 prereq 向上走到根，保留「掌握度 < 70 或本身是断点」的节点
 *   3. 合并去重，按拓扑深度（根→叶）排序，深度相同则按「被几个断点依赖」降序
 *   4. 取前 6 步，给每步一句「为什么先做它」
 * 产出落到错题本页：一张可执行的路线卡，每步三个入口（地图 / 看课 / 让助教讲）。
 */
(function (root) {
  'use strict';

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function data() { return root.APP_DATA; }

  function depthOf(id, map, memo) {
    if (memo[id] !== undefined) { return memo[id]; }
    var n = map[id];
    if (!n || !n.prereq || !map[n.prereq]) { return (memo[id] = 0); }
    return (memo[id] = depthOf(n.prereq, map, memo) + 1);
  }

  /* 纯函数：给一批断点，算出最小补课链 */
  function plan(pendingIds, hooks, maxSteps) {
    var D = data();
    if (!D) { return { steps: [], pending: 0, reason: 'no-data' }; }
    var map = D.NODE_MAP;
    var pend = (pendingIds || []).filter(function (id) { return !!map[id]; });
    if (!pend.length) { return { steps: [], pending: 0, reason: 'empty' }; }

    var need = {};
    pend.forEach(function (id) {
      var cur = id, guard = 0;
      while (cur && map[cur] && guard++ < 14) {
        var n = map[cur];
        var m = hooks.masteryOf(cur);
        var isBroken = pend.indexOf(cur) >= 0;
        if (isBroken || (typeof m === 'number' && m < 70)) {
          if (!need[cur]) { need[cur] = { id: cur, count: 0, broken: false }; }
          need[cur].count++;
          if (isBroken) { need[cur].broken = true; }
        }
        cur = n.prereq;
      }
    });

    var memo = {};
    var list = Object.keys(need).map(function (id) {
      return { id: id, depth: depthOf(id, map, memo), count: need[id].count, broken: need[id].broken };
    }).sort(function (a, b) {
      return a.depth - b.depth || b.count - a.count;
    }).slice(0, maxSteps || 6);

    return {
      pending: pend.length,
      reason: 'ok',
      steps: list.map(function (x, i) {
        var n = map[x.id];
        var m = hooks.masteryOf(x.id);
        var ev = hooks.evidenceOf(x.id) || { ok: 0, n: 0 };
        var why;
        if (i === 0 && x.depth === 0) { why = '这条链的地基，先把它的定义过一遍'; }
        else if (x.count >= 2) { why = '它同时是 ' + x.count + ' 个断点的前置，补它最划算'; }
        else if (x.broken) { why = '你在这条链上确实断过，必须回补'; }
        else { why = '它是后续内容的前置，掌握度还差一截'; }
        return {
          order: i + 1, id: x.id, code: n.code, label: n.label, level: n.level,
          book: n.book, mastery: m, evOk: ev.ok, evN: ev.n, why: why, broken: x.broken
        };
      })
    };
  }

  function renderPlan(result) {
    var box = document.getElementById('planBox');
    if (!box) { return; }
    if (!result || !result.steps || !result.steps.length) {
      box.hidden = false;
      box.innerHTML = '<div class="pl-head"><b>补课路线</b><span>暂时没有待修复的知识点</span></div>' +
        '<div class="pl-empty">去诊断一道题，或刷题答错一道，这里就会出现一条从地基到断点的最短补课链。</div>';
      return;
    }
    box.hidden = false;
    box.innerHTML =
      '<div class="pl-head"><b>补课路线</b>' +
        '<span>' + result.pending + ' 个断点 → 收敛成 ' + result.steps.length + ' 步</span>' +
        '<button class="ag-mini" id="plAgain" type="button">重新计算</button>' +
        '<button class="ag-mini" id="plClose" type="button">收起</button>' +
      '</div>' +
      '<div class="pl-steps">' +
        result.steps.map(function (s) {
          return '<div class="pl-step">' +
            '<div class="pl-no">' + s.order + '</div>' +
            '<div class="pl-main">' +
              '<div class="pl-title"><b>' + esc(s.code + ' ' + s.label) + '</b>' +
                '<i class="pl-lv ' + s.level + '">' + (s.level === 'sen' ? '高中' : '大学') + '</i>' +
                (s.broken ? '<i class="pl-broken">断点</i>' : '') +
                '<span class="pl-m">掌握 ' + (typeof s.mastery === 'number' ? s.mastery : '—') + '% · 证据 ' + s.evOk + '/' + s.evN + '</span>' +
              '</div>' +
              '<div class="pl-why">' + esc(s.why) + '</div>' +
              '<div class="pl-acts">' +
                '<button class="btn btn-ghost btn-sm" data-pl="map" data-id="' + esc(s.id) + '" type="button">地图定位</button>' +
                '<button class="btn btn-ghost btn-sm" data-pl="teach" data-id="' + esc(s.id) + '" type="button">看这个课</button>' +
                '<button class="btn btn-primary btn-sm" data-pl="ask" data-id="' + esc(s.id) + '" type="button">让助教讲</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="pl-foot">路线由「前置关系 + 掌握度 + 证据数」算出，不经过模型；模型只负责把话说明白。</div>';
    bindPlan();
  }

  function bindPlan() {
    var box = document.getElementById('planBox');
    if (!box) { return; }
    box.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-pl]') : null;
      if (!t) { return; }
      var id = t.dataset.id;
      var DJ = root.DJ;
      if (t.dataset.pl === 'map' && DJ && DJ.openNode) { DJ.openNode(id); }
      if (t.dataset.pl === 'teach' && DJ && DJ.openTeach) { DJ.openTeach(id); }
      if (t.dataset.pl === 'ask' && root.Agent) {
        root.Agent.open(false);
        root.Agent.askTopic(id);
      }
    }, { once: false });
  }

  function compute() {
    var DJ = root.DJ;
    var pend = DJ && DJ.pendingDetail ? DJ.pendingDetail().map(function (x) { return x.nodeId; }) : [];
    return plan(pend, {
      masteryOf: function (id) { return DJ ? DJ.masteryOf(id) : 60; },
      evidenceOf: function (id) { return DJ && DJ.evidenceOf ? DJ.evidenceOf(id) : { ok: 0, n: 0 }; }
    }, 6);
  }

  function mount() {
    var bar = document.getElementById('bookBar');
    if (!bar || document.getElementById('planBtn')) { return; }
    var btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.id = 'planBtn';
    btn.type = 'button';
    btn.textContent = '生成补课路线';
    bar.insertBefore(btn, bar.firstChild);

    var box = document.createElement('div');
    box.id = 'planBox';
    box.className = 'plan';
    box.hidden = true;
    bar.parentNode.insertBefore(box, bar);

    btn.addEventListener('click', function () { renderPlan(compute()); });
    box.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('#plAgain, #plClose') : null;
      if (t && t.id === 'plAgain') { renderPlan(compute()); }
      if (t && t.id === 'plClose') { box.hidden = true; }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }

  root.Planner = { plan: plan, compute: compute, render: renderPlan, mount: mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
