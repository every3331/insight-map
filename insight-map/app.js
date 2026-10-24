/* 洞见 · 跨学段错题地图
 *
 * 流程：诊断（判对错 + 函数图 + 解析 + 错因）→ 在知识地图中定位 → 前置探针 → 变式题 → 愈合
 *
 * 诊断两段式：本地 recallCandidates 召回 10 个 → 只喂这 10 个给模型 → 校验 → 兜底
 */
(function () {
  'use strict';

  var DATA = window.APP_DATA;
  var NODES = DATA.NODES;
  var EDGES = DATA.EDGES;
  var SAMPLES = DATA.SAMPLES;
  var VARIANTS = DATA.VARIANTS;
  var PROBES = DATA.PROBES;
  var GEN = DATA.GEN_BANK || [];
  var FALLBACK = DATA.FALLBACK_VARIANT;
  var NODE_MAP = DATA.NODE_MAP;
  var LEVELS = DATA.LEVELS;

  var USE_API = location.protocol !== 'file:' &&
                new URLSearchParams(location.search).get('mock') !== '1';

  var NS = 'http://www.w3.org/2000/svg';
  var RING_R = 20;
  var CIRC = 2 * Math.PI * RING_R;
  var CRACK = 'M-9.5,-8.5 L-3.5,-3 L-5.5,1 L0.5,3.5 L-1.5,9.5 L5.5,7.5';

  var CX = 280, CY = 330, R1X = 118, R1Y = 176, R2X = 208, R2Y = 318, MAX_NODES = 15;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) { for (var k in attrs) { e.setAttribute(k, attrs[k]); } }
    return e;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function mf(el, text) {
    if (!el) { return; }
    if (window.MathFmt) { el.innerHTML = window.MathFmt.fmt(String(text)); }
    else { el.textContent = text; }
  }
  function replay(node, cls) {
    node.classList.remove(cls);
    node.getBoundingClientRect();
    node.classList.add(cls);
  }
  function labelOf(id) { var n = NODE_MAP[id]; return n ? n.label : id; }
  function fullOf(id) { var n = NODE_MAP[id]; return n ? n.code + ' ' + n.label : id; }
  function levelOf(id) { var n = NODE_MAP[id]; return n ? n.level : 'sen'; }

  var S = {
    mastery: {}, before: {}, nodeEls: {}, edgeEls: [],
    broken: {}, activeId: null, focusId: 'der-def',
    quizNode: null, selected: null, probeSel: null,
    locked: false, plot: null, history: [],
    lastGen: -1, practice: null,
    teachId: null,
    healedOnce: {},
    streak: {}
  };

  var LS_KEY = 'dongjian.v1';

  function persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        mastery: S.mastery,
        history: S.history.map(function (h) {
          return { nodeId: h.nodeId, errorType: h.errorType, at: +h.at, state: h.state };
        })
      }));
    } catch (e) { /* 无痕模式等忽略 */ }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) { return false; }
      var d = JSON.parse(raw);
      if (d.mastery) {
        Object.keys(d.mastery).forEach(function (k) {
          if (S.mastery[k] !== undefined && typeof d.mastery[k] === 'number') { S.mastery[k] = d.mastery[k]; }
        });
      }
      if (d.history && d.history.length) {
        S.history = d.history
          .filter(function (h) { return NODE_MAP[h.nodeId]; })
          .map(function (h) {
            return { nodeId: h.nodeId, errorType: h.errorType, at: new Date(h.at), state: h.state };
          });
      }
      return true;
    } catch (e) { return false; }
  }

  var drillPlot = null;
  var DR = { order: [], i: 0, done: 0, ok: 0, bad: 0, picked: null, q: null };

  /* ───────────── 视图 ───────────── */

  function switchView(name) {
    $$('.nav-btn').forEach(function (b) { b.classList.toggle('on', b.dataset.view === name); });
    $$('.view').forEach(function (v) { v.classList.toggle('on', v.id === 'view-' + name); });
    if (name === 'map') { setTimeout(renderMap, 20); }
    if (name === 'drill' && !DR.q) { startDrill(); }
    if (name === 'teach') { renderTeachList(); if (!S.teachId) { selectTeach(NODES[0].id); } }
  }

  /* ───────────── 图工具 ───────────── */

  function neighborsOf(id) {
    var out = [];
    EDGES.forEach(function (e) {
      if (e[0] === id) { out.push(e[1]); }
      else if (e[1] === id) { out.push(e[0]); }
    });
    return out;
  }
  function curve(ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var mx = ax + dx / 2, my = ay + dy / 2;
    var nx = -dy / len, ny = dx / len;
    var off = Math.min(22, len * 0.11);
    return 'M' + ax + ',' + ay + ' Q' + (mx + nx * off).toFixed(1) + ',' + (my + ny * off).toFixed(1) +
           ' ' + bx + ',' + by;
  }

  /* ───────────── 焦点布局 ───────────── */

  function layoutFocus(focusId) {
    var dist = {}, order = [];
    dist[focusId] = 0; order.push(focusId);
    var q = [focusId];
    while (q.length) {
      var cur = q.shift();
      if (dist[cur] >= 2) { continue; }
      neighborsOf(cur).forEach(function (n) {
        if (dist[n] === undefined) { dist[n] = dist[cur] + 1; order.push(n); q.push(n); }
      });
    }

    var d1 = order.filter(function (id) { return dist[id] === 1; });
    var d2 = order.filter(function (id) { return dist[id] === 2; });
    if (1 + d1.length + d2.length > MAX_NODES) {
      d2 = d2.slice(0, Math.max(0, MAX_NODES - 1 - d1.length));
    }

    var pos = {};
    pos[focusId] = { x: CX, y: CY };
    var n1 = Math.max(1, d1.length);

    d1.forEach(function (id, i) {
      var a = (-90 + (360 / n1) * i) * Math.PI / 180;
      pos[id] = { x: CX + R1X * Math.cos(a), y: CY + R1Y * Math.sin(a) };
    });

    function parentIdx(id) {
      var nbs = neighborsOf(id);
      for (var i = 0; i < nbs.length; i++) {
        if (dist[nbs[i]] === 1 && pos[nbs[i]]) { return d1.indexOf(nbs[i]); }
      }
      return 0;
    }
    var d2sorted = d2.slice().sort(function (x, y) {
      var px = parentIdx(x), py = parentIdx(y);
      if (px !== py) { return px - py; }
      return x < y ? -1 : 1;
    });
    var n2 = Math.max(1, d2sorted.length);
    d2sorted.forEach(function (id, i) {
      var a = (-90 + (360 / n2) * (i + 0.5)) * Math.PI / 180;
      pos[id] = { x: CX + R2X * Math.cos(a), y: CY + R2Y * Math.sin(a) };
    });

    var ids = Object.keys(pos);
    var edges = EDGES.filter(function (e) { return pos[e[0]] && pos[e[1]]; });

    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    ids.forEach(function (id) {
      var p = pos[id];
      if (p.x < minX) { minX = p.x; }
      if (p.x > maxX) { maxX = p.x; }
      if (p.y < minY) { minY = p.y; }
      if (p.y > maxY) { maxY = p.y; }
    });

    return { pos: pos, ids: ids, edges: edges, dist: dist,
             bbox: { minX: minX, minY: minY, maxX: maxX, maxY: maxY } };
  }

  /* ───────────── 画图 ───────────── */

  function colorFor(m) {
    if (m >= 70) { return '#34D399'; }
    if (m >= 40) { return '#FBBF24'; }
    return '#FB923C';
  }

  function buildNode(n, p, isFocus, isFar) {
    var g = el('g', {
      'class': 'node' + (isFocus ? ' focus' : '') + (isFar ? ' far' : ''),
      'data-id': n.id, 'data-lv': n.level,
      transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')'
    });
    var inner = el('g', { 'class': 'node-inner' });
    var rr = isFocus ? 25 : (isFar ? 17 : 20);
    var pulse = el('circle', { 'class': 'pulse', r: rr });
    var ring  = el('circle', { 'class': 'ring', r: rr, transform: 'rotate(-90)' });
    var disc  = el('circle', { 'class': 'disc', r: isFocus ? 17 : (isFar ? 11.5 : 13.5) });
    var crack = el('path', { 'class': 'crack', d: CRACK });
    var lbl   = el('text', { 'class': 'lbl', y: isFocus ? 41 : (isFar ? 31 : 34), 'text-anchor': 'middle' });
    lbl.textContent = n.label;

    inner.appendChild(pulse);
    inner.appendChild(ring);
    inner.appendChild(disc);
    inner.appendChild(crack);
    inner.appendChild(lbl);
    g.appendChild(inner);

    g.addEventListener('click', function () { onNodeClick(n.id); });
    g.addEventListener('mouseenter', function () {
      if (!S.broken[n.id]) { $('#mapHint').textContent = fullOf(n.id) + ' · 掌握度 ' + S.mastery[n.id] + '%'; }
    });
    g.addEventListener('mouseleave', function () { $('#mapHint').textContent = '点击节点切换焦点'; });
    return g;
  }

  function renderMap() {
    var map = $('#map');
    if (!map) { return; }
    map.textContent = '';
    S.nodeEls = {}; S.edgeEls = [];

    var lay = layoutFocus(S.focusId);
    var b = lay.bbox, padX = 92, padTop = 76, padBot = 80;
    map.setAttribute('viewBox',
      (b.minX - padX).toFixed(0) + ' ' + (b.minY - padTop).toFixed(0) + ' ' +
      (b.maxX - b.minX + padX * 2).toFixed(0) + ' ' + (b.maxY - b.minY + padTop + padBot).toFixed(0));

    var gGuide = el('g', {});
    var gEdges = el('g', {});
    var gNodes = el('g', {});
    map.appendChild(gGuide); map.appendChild(gEdges); map.appendChild(gNodes);

    var hasR1 = false, hasR2 = false;
    Object.keys(lay.dist).forEach(function (k) {
      if (lay.dist[k] === 1) { hasR1 = true; }
      if (lay.dist[k] === 2) { hasR2 = true; }
    });
    if (hasR1) { gGuide.appendChild(el('ellipse', { class: 'guide-ring', cx: CX, cy: CY, rx: R1X, ry: R1Y })); }
    if (hasR2) { gGuide.appendChild(el('ellipse', { class: 'guide-ring r2', cx: CX, cy: CY, rx: R2X, ry: R2Y })); }

    lay.edges.forEach(function (e) {
      var a = lay.pos[e[0]], b2 = lay.pos[e[1]];
      var p = el('path', { 'class': 'edge' + (e[2] ? ' cross' : '') });
      p.setAttribute('d', curve(a.x, a.y, b2.x, b2.y));
      p.dataset.a = e[0]; p.dataset.b = e[1];
      gEdges.appendChild(p);
      S.edgeEls.push(p);
    });

    lay.ids.forEach(function (id) {
      var g = buildNode(NODE_MAP[id], lay.pos[id], id === S.focusId, lay.dist[id] === 2);
      S.nodeEls[id] = g;
      if (S.broken[id]) { g.classList.add('broken'); }
      gNodes.appendChild(g);
    });

    paintAll();
    updateCrumbs();
    updateLevels();
  }

  function paintNode(id) {
    var g = S.nodeEls[id];
    if (!g) { return; }
    var m = Math.max(0, Math.min(100, S.mastery[id]));
    var ring = g.querySelector('.ring');
    var arc = (m / 100) * CIRC;
    ring.setAttribute('stroke-dasharray', arc.toFixed(1) + ' ' + CIRC.toFixed(1));
    ring.setAttribute('stroke', colorFor(m));
  }
  function paintAll() { Object.keys(S.nodeEls).forEach(paintNode); }

  function updateCrumbs() {
    var n = NODE_MAP[S.focusId];
    var box = $('#crumbs');
    box.textContent = '';
    if (!n) { return; }
    [n.book, n.chapter, n.label].forEach(function (t, i) {
      if (i) {
        var sep = document.createElement('span');
        sep.className = 'crumb-sep'; sep.textContent = '›';
        box.appendChild(sep);
      }
      var s = document.createElement('span');
      s.className = 'crumb' + (i === 2 ? ' cur' : '');
      s.textContent = t;
      box.appendChild(s);
    });
    if (S.activeId && S.activeId !== S.focusId) {
      var back = document.createElement('button');
      back.type = 'button'; back.className = 'crumb-back'; back.textContent = '回到断点';
      back.addEventListener('click', function () { setFocus(S.activeId); });
      box.appendChild(back);
    }
  }

  function updateLevels() {
    var box = $('#levels');
    box.textContent = '';
    var cur = levelOf(S.focusId);
    LEVELS.forEach(function (lv) {
      var span = document.createElement('span');
      span.className = 'lv' + (lv.key === cur ? ' on' : '');
      var dot = document.createElement('i'); dot.className = 'lv-dot';
      var name = document.createElement('span'); name.textContent = lv.name;
      var cnt = document.createElement('b');
      cnt.textContent = NODES.filter(function (n) { return n.level === lv.key; }).length;
      span.appendChild(dot); span.appendChild(name); span.appendChild(cnt);
      box.appendChild(span);
    });
  }

  function setFocus(id) {
    if (!NODE_MAP[id]) { return; }
    S.focusId = id;
    renderMap();
  }

  /* ───────────── 诊断取数 ───────────── */

  function validDiag(d) {
    return d && typeof d === 'object' &&
      typeof d.nodeId === 'string' && !!NODE_MAP[d.nodeId] &&
      typeof d.errorType === 'string' && DATA.ALL_TYPES.indexOf(d.errorType) >= 0 &&
      typeof d.confidence === 'number' && isFinite(d.confidence) && d.confidence >= 0 && d.confidence <= 1 &&
      typeof d.diagnosis === 'string' && d.diagnosis.trim().length >= 4 && d.diagnosis.length <= 200;
  }

  async function askServer(text) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 15000);
    try {
      var r = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text, candidates: DATA.recallCandidates(text, 10) }),
        signal: ctl.signal
      });
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      var j = await r.json();
      if (!j.ok) { throw new Error(j.error || 'bad'); }
      return j;
    } finally { clearTimeout(timer); }
  }

  async function getDiagnosis(text) {
    if (!USE_API) { return { data: DATA.diagnoseLocal(text), source: 'local' }; }
    try {
      var j = await askServer(text);
      if (validDiag(j.data)) { return { data: j.data, source: j.source, model: j.model }; }
      return { data: DATA.diagnoseLocal(text), source: 'fallback' };
    } catch (e) {
      return { data: DATA.diagnoseLocal(text), source: 'fallback' };
    }
  }

  function srcText(res) {
    if (res.source === 'model') { return '模型 · ' + (res.model || 'LLM'); }
    if (res.source === 'cache') { return '缓存命中'; }
    if (res.source === 'local') { return '离线演示'; }
    return '本地兜底';
  }

  function findSample(text) {
    var t = String(text).replace(/\s+/g, '');
    for (var i = 0; i < SAMPLES.length; i++) {
      if (String(SAMPLES[i].text).replace(/\s+/g, '') === t) { return SAMPLES[i]; }
    }
    return null;
  }

  function extractFunction(text) {
    var t = String(text).replace(/\r/g, '');
    var m = t.match(/(?:y|f\s*\(\s*x\s*\))\s*[=＝]\s*([^\n。，；;]+)/i);
    if (!m) { return null; }
    var s = m[1].replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef].*$/, '');
    s = s.replace(/[\s,、]+$/, '').trim();
    if (!s || !/x/i.test(s)) { return null; }
    try { window.Plot.compile(s); } catch (e) { return null; }
    return s;
  }

  /* 图像：跟着这道题变 */
  function applyPlot(cfg, nodeId, text) {
    if (!S.plot) { return; }
    cfg = cfg || {};
    var node = NODE_MAP[nodeId] || {};
    var expr = cfg.expr || extractFunction(text) || node.fn || 'x^2';

    var r = S.plot.setExpression(expr);
    if (!r.ok) { r = S.plot.setExpression(node.fn || 'x^2'); }
    if (!r.ok) { return; }

    var range = cfg.range || node.fnx || null;
    if (range) { S.plot.setRange(range[0], range[1]); }
    S.plot.setDeriv(!!cfg.deriv);
    S.plot.setTangent(cfg.tangent || null);
    S.plot.setMarks(cfg.marks || []);

    $('#fxDeriv').classList.toggle('on', !!cfg.deriv);
    $('#plotExpr').textContent = 'y = ' + (r.source || expr);
    $('#plotNote').textContent = cfg.deriv ? '紫虚线是 f′，正负决定单调' : '';
    setTimeout(function () { S.plot.redraw(); }, 30);
  }

  /* ───────────── 结果渲染 ───────────── */

  function renderResult(diag, item, res) {
    var node = NODE_MAP[diag.nodeId];
    var wrong = item.right === false;

    var banner = $('#vBanner');
    banner.className = 'verdict-banner' + (item.right === true ? ' ok' : '');
    $('#vbIcon').textContent = wrong ? '✕' : (item.right ? '✓' : '◎');
    $('#vbTitle').textContent = wrong ? '答案不对' : (item.right ? '答案正确' : '定位完成');
    $('#vbSub').textContent = '命中 ' + node.code + ' ' + node.label + ' · ' + diag.errorType;
    $('#vConf').textContent = '置信度 ' + diag.confidence.toFixed(2);

    var row = $('#answerRow');
    if (item.yourAnswer) {
      row.hidden = false;
      mf($('#aYou'), item.yourAnswer);
      mf($('#aRight'), item.rightAnswer || '—');
      row.querySelector('.ans-box.bad').classList.toggle('good', item.right === true);
    } else {
      row.hidden = true;
    }

    $('#reasonTitle').textContent = wrong ? '为什么错' : (item.right ? '这一步的关键' : '为什么卡住');
    mf($('#reasonText'), item.reason || diag.diagnosis);

    var steps = item.steps && item.steps.length ? item.steps : DATA.tipsOf(diag.nodeId);
    var ol = $('#stepsList');
    ol.textContent = '';
    steps.forEach(function (s) {
      var li = document.createElement('li');
      mf(li, s);
      ol.appendChild(li);
    });

    $('#placeholder').hidden = true;
    $('#practiceCard').hidden = true;
    var card = $('#resultCard');
    card.hidden = false;
    card.style.animation = 'none';
    card.getBoundingClientRect();
    card.style.animation = '';

    $('#srcBadge').hidden = false;
    $('#srcBadge').textContent = srcText(res || { source: 'local' });

    var pf = item.pitfall || '';
    $('#pitfallBlock').hidden = !pf;
    if (pf) { mf($('#pitfallText'), pf); }

    applyPlot(item.plot, diag.nodeId, item.text || '');
  }

  function pushHistory(nodeId, errorType) {
    S.history.unshift({ nodeId: nodeId, errorType: errorType, at: new Date(), state: 'open' });
    renderBook();
    persist();
  }

  async function diagnose() {
    if (S.locked) { return; }
    var input = $('#qInput');
    var text = input.value.trim();
    if (!text) {
      replay(input, 'flash');
      setTimeout(function () { input.classList.remove('flash'); }, 600);
      input.focus();
      return;
    }

    S.locked = true;
    var btn = $('#diagnoseBtn');
    btn.disabled = true;
    btn.textContent = '诊断中…';
    $('#guide').hidden = true;

    var res = await getDiagnosis(text);
    var diag = res.data;
    var sample = findSample(text);

    S.activeId = diag.nodeId;
    pushHistory(diag.nodeId, diag.errorType);

    var item;
    if (sample) {
      item = {
        right: sample.right, yourAnswer: sample.yourAnswer, rightAnswer: sample.rightAnswer,
        reason: sample.reason, steps: sample.steps, plot: sample.plot, text: text
      };
    } else {
      var intro0 = DATA.introFor(diag.nodeId);
      item = {
        right: null,
        reason: diag.diagnosis,
        steps: diag.steps && diag.steps.length ? diag.steps
             : (intro0 ? intro0.pts : DATA.tipsOf(diag.nodeId)),
        pitfall: diag.pitfall || (intro0 ? intro0.trap : ''),
        plot: { expr: extractFunction(text) || (NODE_MAP[diag.nodeId] && NODE_MAP[diag.nodeId].fn) },
        text: text
      };
    }

    await wait(200);
    renderResult(diag, item, res);

    S.locked = false;
    btn.disabled = false;
    btn.textContent = '诊断这道题';
  }

  /* ───────────── 自行出题 ───────────── */

  function startPractice() {
    if (!GEN.length) { return; }
    var idx = Math.floor(Math.random() * GEN.length);
    if (GEN.length > 1 && idx === S.lastGen) { idx = (idx + 1) % GEN.length; }
    S.lastGen = idx;

    var q = GEN[idx];
    S.practice = { item: q, picked: null };

    $('#placeholder').hidden = true;
    $('#resultCard').hidden = true;
    $('#practiceCard').hidden = false;
    $('#pqTag').textContent = '题库 · ' + (idx + 1) + '/' + GEN.length;
    $('#pqNode').textContent = fullOf(q.nodeId) + ' · ' + NODE_MAP[q.nodeId].book;
    mf($('#pqStem'), q.stem);

    var box = $('#pqOptions');
    box.textContent = '';
    q.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.k = o.k;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      var t = document.createElement('span'); t.className = 't'; mf(t, o.t);
      b.appendChild(k); b.appendChild(t);
      b.addEventListener('click', function () {
        $$('#pqOptions .opt').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        S.practice.picked = o.k;
        $('#pqSubmit').disabled = false;
      });
      box.appendChild(b);
    });
    $('#pqSubmit').disabled = true;
    switchView('diagnose');
  }

  async function submitPractice() {
    if (!S.practice || !S.practice.picked) { return; }
    var q = S.practice.item;
    var picked = S.practice.picked;
    var ok = picked === q.answer;

    var rightText = q.options.filter(function (o) { return o.k === q.answer; })[0];
    var yourText = q.options.filter(function (o) { return o.k === picked; })[0];

    $$('#pqOptions .opt').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('sel');
      if (b.dataset.k === q.answer) { b.classList.add('correct'); }
      else if (b.dataset.k === picked) { b.classList.add('wrong'); }
    });

    var errType = ok ? '概念混淆' : q.errorType;
    if (DATA.ALL_TYPES.indexOf(errType) < 0) { errType = '概念混淆'; }

    var diag = {
      nodeId: q.nodeId,
      errorType: errType,
      confidence: 0.88,
      diagnosis: ok ? '这一步没问题，继续往下。' : (q.why[picked] || '这一步的思路偏离了本题要求。')
    };

    S.activeId = q.nodeId;
    pushHistory(q.nodeId, errType);

    var item = {
      right: ok,
      yourAnswer: yourText ? yourText.t : picked,
      rightAnswer: rightText ? rightText.t : q.answer,
      reason: ok ? ('方向和步骤都对。' + (q.steps[0] || '')) : (q.why[picked] || '这一步的思路偏离了本题要求。'),
      steps: q.steps,
      plot: q.plot,
      text: q.stem
    };

    await wait(160);
    renderResult(diag, item, { source: 'local' });
    $('#srcBadge').textContent = '自定义出题';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ───────────── 定位 ───────────── */

  function goLocate() {
    if (!S.activeId) { return; }
    switchView('map');
    S.focusId = S.activeId;
    renderMap();
    setTimeout(function () {
      breakNode(S.activeId, false);
      fillSide(S.activeId);
    }, 80);
  }

  function updateSideMeta(id) {
    if ($('#sideBody').hidden) { return; }
    var n = NODE_MAP[id];
    if (!n) { return; }
    var pre = n.prereq ? NODE_MAP[n.prereq] : null;
    $('#snFill').style.width = S.mastery[id] + '%';
    $('#snMeta').textContent = '掌握度 ' + S.mastery[id] + '%' +
      (pre ? ' · 上游 ' + pre.code + ' ' + pre.label : ' · 主线起点');
  }

  function fillSide(id) {
    $('#sideEmpty').hidden = true;
    $('#sideBody').hidden = false;

    var n = NODE_MAP[id];
    var pre = n.prereq ? NODE_MAP[n.prereq] : null;

    $('#snCode').textContent = n.code + ' · ' + n.book;
    $('#snName').textContent = n.label;
    $('#snFill').style.width = S.mastery[id] + '%';
    $('#snMeta').textContent = '掌握度 ' + S.mastery[id] + '%' +
      (pre ? ' · 上游 ' + pre.code + ' ' + pre.label : ' · 主线起点');

    // 知识点介绍
    var intro = DATA.introFor(id);
    var ic = $('#introCard');
    if (intro) {
      ic.hidden = false;
      mf($('#icOne'), intro.one);
      var ul = $('#icPts');
      ul.textContent = '';
      intro.pts.forEach(function (pt) {
        var li = document.createElement('li');
        mf(li, pt);
        ul.appendChild(li);
      });
      $('#icTrap').textContent = intro.trap;
    } else {
      ic.hidden = true;
    }

    var probe = PROBES[id];
    var depRow = $('#depRow');
    if (probe && id === S.activeId) {
      depRow.hidden = false;
      $('#depNode').textContent = fullOf(probe.nodeId);
      var pn = NODE_MAP[probe.nodeId];
      $('#depCross').hidden = !(pn && pn.level !== n.level);
    } else {
      depRow.hidden = true;
    }
    $('#probe').hidden = true;
    openVariant(id);
  }

  /* ───────────── 断点 / 愈合 ───────────── */

  function markEdges(id, on) {
    S.edgeEls.forEach(function (p) {
      if (p.dataset.a === id || p.dataset.b === id) { p.classList.toggle('hot', !!on); }
    });
  }

  function breakNode(id, secondary) {
    if (S.broken[id]) { return; }
    if (!S.nodeEls[id]) { setFocus(id); }
    var g = S.nodeEls[id];
    if (!g) { return; }

    S.broken[id] = true;
    S.before[id] = S.mastery[id];
    S.mastery[id] = Math.max(5, Math.round(S.mastery[id] - (secondary ? 8 : 15)));

    replay(g, 'breaking');
    setTimeout(function () { g.classList.remove('breaking'); }, 560);
    g.classList.add('broken');
    replay(g, 'burst-red');
    setTimeout(function () { g.classList.remove('burst-red'); }, 900);

    paintNode(id);
    updateMastery();
    markEdges(id, true);
    persist();

    if (!secondary) {
      neighborsOf(id).forEach(function (nid) {
        var e = S.nodeEls[nid];
        if (!e) { return; }
        e.classList.add('touch');
        setTimeout(function () { e.classList.remove('touch'); }, 2800);
      });
      setTimeout(function () { markEdges(id, false); }, 2800);
    }
    updateSideMeta(id);
  }

  function healNode(id) {
    if (!S.broken[id]) { return; }
    var g = S.nodeEls[id];
    delete S.broken[id];
    if (g) {
      g.classList.remove('broken');
      replay(g, 'burst-green');
      setTimeout(function () { g.classList.remove('burst-green'); }, 1000);
    }
    var base = (typeof S.before[id] === 'number') ? S.before[id] : S.mastery[id];
    var firstFix = !S.healedOnce[id];
    var gain = 35 + (firstFix ? 20 : 0);
    S.mastery[id] = Math.min(100, Math.max(base + 8, S.mastery[id] + gain));
    S.healedOnce[id] = true;
    paintNode(id);
    updateMastery();
    markEdges(id, false);

    S.history.forEach(function (h) { if (h.nodeId === id) { h.state = 'done'; } });
    renderBook();
    updateSideMeta(id);
    persist();
  }

  function updateMastery() {
    var sum = 0;
    NODES.forEach(function (n) { sum += S.mastery[n.id]; });
    var avg = Math.round(sum / NODES.length);
    $('#masteryFill').style.width = avg + '%';
    $('#masteryNum').textContent = avg + '%';
  }

  /* ───────────── 前置探针 ───────────── */

  function openProbe() {
    var probe = PROBES[S.activeId];
    if (!probe) { return; }
    S.probeSel = null;
    $('#probeNodeName').textContent = fullOf(probe.nodeId);
    var pn = NODE_MAP[probe.nodeId];
    $('#probeCross').hidden = !(pn && pn.level !== NODE_MAP[S.activeId].level);
    $('#probeWhy').textContent = probe.why;
    $('#probeStem').textContent = probe.stem;

    var box = $('#probeOptions');
    box.textContent = '';
    probe.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.k = o.k;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      var t = document.createElement('span'); t.className = 't'; mf(t, o.t);
      b.appendChild(k); b.appendChild(t);
      b.addEventListener('click', function () {
        $$('#probeOptions .opt').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        S.probeSel = o.k;
        $('#probeSubmit').disabled = false;
      });
      box.appendChild(b);
    });

    $('#probeSubmit').disabled = true;
    $('#probeFb').hidden = true;
    $('#probe').hidden = false;
    $('#depRow').hidden = true;
  }

  function submitProbe() {
    var probe = PROBES[S.activeId];
    if (!probe || !S.probeSel) { return; }
    var ok = S.probeSel === probe.answer;

    $$('#probeOptions .opt').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('sel');
      if (b.dataset.k === probe.answer) { b.classList.add('correct'); }
      else if (b.dataset.k === S.probeSel) { b.classList.add('wrong'); }
    });
    $('#probeSubmit').hidden = true;

    var fb = $('#probeFb');
    fb.hidden = false; fb.textContent = '';
    fb.className = 'feedback ' + (ok ? 'ok' : 'no');

    var h = document.createElement('strong');
    var p = document.createElement('span');
    var act = document.createElement('button');
    act.className = 'btn btn-primary btn-sm fb-act';

    if (ok) {
      h.textContent = '前置稳固 —— 地基没问题。';
      p.textContent = '「' + fullOf(probe.nodeId) + '」这一步是通的，问题确实只在「' +
        fullOf(S.activeId) + '」，直接补它。';
      act.textContent = '去补 ' + fullOf(S.activeId) + ' →';
      act.addEventListener('click', function () { openVariant(S.activeId); });
      fb.appendChild(h); fb.appendChild(p); fb.appendChild(act);
      return;
    }

    h.textContent = '地基在这里。';
    p.textContent = '「' + fullOf(probe.nodeId) + '」也没通。这种情况下直接刷当前知识点，等于在漏的地基上砌墙。';
    var hint = document.createElement('span');
    hint.className = 'hint'; hint.textContent = probe.hint;
    act.textContent = '先补 ' + fullOf(probe.nodeId) + ' →';
    act.addEventListener('click', function () { openVariant(probe.nodeId); });

    fb.appendChild(h); fb.appendChild(p); fb.appendChild(hint); fb.appendChild(act);
    breakNode(probe.nodeId, true);
  }

  /* ───────────── 变式题 ───────────── */

  function secondVariant(nodeId) {
    var fromBank = GEN.filter(function (q) { return q.nodeId === nodeId; })[0];
    if (fromBank) {
      return { nodeId: nodeId, v: { stem: fromBank.stem, options: fromBank.options, answer: fromBank.answer, hint: fromBank.why ? (fromBank.why[Object.keys(fromBank.why)[0]] || '') : '', steps: fromBank.steps } };
    }
    var f = VARIANTS[nodeId];
    if (f) { return { nodeId: nodeId, v: f }; }
    return { nodeId: nodeId, v: FALLBACK };
  }

  function renderVariant(v) {
    S.selected = null;
    mf($('#qStem'), v.stem);
    $('#qNode').textContent = fullOf(S.quizNode);
    var box = $('#qOptions');
    box.textContent = '';
    v.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.k = o.k;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      var t = document.createElement('span'); t.className = 't'; mf(t, o.t);
      b.appendChild(k); b.appendChild(t);
      b.addEventListener('click', function () {
        if (b.disabled) { return; }
        $$('#qOptions .opt').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        S.selected = o.k;
        $('#submitAnswer').disabled = false;
      });
      box.appendChild(b);
    });
    $('#submitAnswer').disabled = true;
    $('#submitAnswer').hidden = false;
    $('#retryAnswer').hidden = true;
    $('#feedback').hidden = true;
    $('#qSolution').hidden = true;
  }

  function openVariant(nodeId) {
    var v = VARIANTS[nodeId] || FALLBACK;
    S.quizNode = nodeId;
    S.selected = null;

    $('#qNode').textContent = fullOf(nodeId);
    mf($('#qStem'), v.stem);

    var box = $('#qOptions');
    box.textContent = '';
    v.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.k = o.k;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      var t = document.createElement('span'); t.className = 't'; mf(t, o.t);
      b.appendChild(k); b.appendChild(t);
      b.addEventListener('click', function () {
        if (b.disabled) { return; }
        $$('#qOptions .opt').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        S.selected = o.k;
        $('#submitAnswer').disabled = false;
      });
      box.appendChild(b);
    });

    $('#submitAnswer').disabled = true;
    $('#submitAnswer').hidden = false;
    $('#retryAnswer').hidden = true;
    $('#feedback').hidden = true;
    $('#qSolution').hidden = true;
    var icEl = $('#introCard');
    if (icEl) { icEl.classList.remove('compact'); }
  }

  function submitAnswer() {
    if (!S.quizNode || !S.selected) { return; }
    var v = VARIANTS[S.quizNode] || FALLBACK;
    var ok = S.selected === v.answer;

    $$('#qOptions .opt').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('sel');
      if (b.dataset.k === v.answer) { b.classList.add('correct'); }
      else if (b.dataset.k === S.selected) { b.classList.add('wrong'); }
    });

    var fb = $('#feedback');
    fb.hidden = false; fb.textContent = '';
    fb.className = 'feedback ' + (ok ? 'ok' : 'no');

    var h = document.createElement('strong');
    var p = document.createElement('span');

    if (ok) {
      S.streak[S.quizNode] = (S.streak[S.quizNode] || 0) + 1;
      if (S.streak[S.quizNode] < 2) {
        h.textContent = '对了 —— 还差一道。';
        p.textContent = '补一个知识点要连做两道同类题才算过。再来一道「' + fullOf(S.quizNode) + '」的。';
        var nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-primary btn-sm fb-act';
        nextBtn.textContent = '下一道 →';
        nextBtn.addEventListener('click', function () {
          var q2 = secondVariant(S.quizNode);
          S.quizNode = q2.nodeId || S.quizNode;
          renderVariant(q2.v);
          fb.hidden = true;
        });
        fb.appendChild(h); fb.appendChild(p); fb.appendChild(nextBtn);
        $('#submitAnswer').hidden = true;
        $('#retryAnswer').hidden = true;
        $('#qSolution').hidden = true;
        return;
      }
      h.textContent = '正确 —— 这个节点补上了。';
      p.textContent = '「' + fullOf(S.quizNode) + '」掌握度上升，地图上这个洞正在愈合。';
      fb.appendChild(h); fb.appendChild(p);
      healNode(S.quizNode);
      $('#submitAnswer').hidden = true;
      $('#retryAnswer').hidden = true;
      $('#qSolution').hidden = true;
    } else {
      h.textContent = '不对 —— 错因还在。';
      p.textContent = '正确答案是 ' + v.answer + '。';
      var hint = document.createElement('span');
      hint.className = 'hint'; hint.textContent = v.hint || '';
      fb.appendChild(h); fb.appendChild(p); fb.appendChild(hint);
      $('#submitAnswer').hidden = true;
      $('#retryAnswer').hidden = false;

      // 解析
      var steps = (v.steps && v.steps.length) ? v.steps : DATA.tipsOf(S.quizNode);
      var ol = $('#qSteps');
      ol.textContent = '';
      steps.forEach(function (s) {
        var li = document.createElement('li');
        mf(li, s);
        ol.appendChild(li);
      });
      $('#qSolution').hidden = false;
      var ic2 = $('#introCard');
      if (ic2) { ic2.classList.add('compact'); }
      setTimeout(function () { scrollSideTo($('#qSolution')); }, 80);

      if (S.quizNode !== S.activeId && !S.broken[S.quizNode]) { breakNode(S.quizNode, true); }
    }
  }

  function scrollSideTo(el) {
    var panel = $('#sideCol');
    if (!panel || !el) { return; }
    var top = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop - 16;
    panel.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function retryAnswer() {
    $$('#qOptions .opt').forEach(function (b) {
      b.disabled = false;
      b.classList.remove('correct', 'wrong', 'sel');
    });
    S.selected = null;
    $('#feedback').hidden = true;
    $('#submitAnswer').hidden = false;
    $('#submitAnswer').disabled = true;
    $('#retryAnswer').hidden = true;
  }

  function onNodeClick(id) {
    setFocus(id);
    fillSide(id);
  }

  /* ───────────── 错题本 ───────────── */

  function renderBook() {
    var list = $('#bookList');
    list.textContent = '';
    $('#bookEmpty').hidden = S.history.length > 0;

    S.history.forEach(function (h) {
      var n = NODE_MAP[h.nodeId];
      if (!n) { return; }
      var lvName = ({ sen: '高', uni: '大' })[n.level];

      var row = document.createElement('div');
      row.className = 'book-item';

      var badge = document.createElement('div');
      badge.className = 'bi-badge ' + n.level;
      badge.textContent = lvName;

      var main = document.createElement('div');
      main.className = 'bi-main';
      var t = document.createElement('div');
      t.className = 'bi-title';
      t.textContent = n.code + ' ' + n.label;
      var s = document.createElement('div');
      s.className = 'bi-sub';
      s.textContent = n.book + ' · ' + h.errorType;
      main.appendChild(t); main.appendChild(s);

      var tm = document.createElement('div');
      tm.className = 'bi-time';
      tm.textContent = ('0' + h.at.getHours()).slice(-2) + ':' + ('0' + h.at.getMinutes()).slice(-2);

      var st = document.createElement('div');
      st.className = 'bi-state' + (h.state === 'done' ? ' done' : '');
      st.textContent = h.state === 'done' ? '已修复' : '待修复';

      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'btn btn-grad btn-sm bi-act';
      go.textContent = '重做';
      go.addEventListener('click', function (e) {
        e.stopPropagation();
        S.activeId = h.nodeId;
        switchView('map');
        setFocus(h.nodeId);
        setTimeout(function () {
          if (!S.broken[h.nodeId]) { breakNode(h.nodeId, false); }
          fillSide(h.nodeId);
          scrollSideTo($('#quizBox'));
        }, 90);
      });

      var vid = document.createElement('button');
      vid.type = 'button';
      vid.className = 'btn btn-ghost btn-sm bi-act';
      vid.textContent = '视频';
      vid.addEventListener('click', function (e) {
        e.stopPropagation();
        openTeachFor(h.nodeId);
      });

      row.appendChild(badge); row.appendChild(main); row.appendChild(tm); row.appendChild(st); row.appendChild(vid); row.appendChild(go);
      row.addEventListener('click', function () {
        S.activeId = h.nodeId;
        switchView('map');
        setFocus(h.nodeId);
        setTimeout(function () { fillSide(h.nodeId); }, 40);
      });
      list.appendChild(row);
    });

    // 左栏「最近诊断」
    var rec = $('#recent');
    var rl = $('#recentList');
    rl.textContent = '';
    var top = S.history.slice(0, 3);
    rec.hidden = top.length === 0;
    top.forEach(function (h) {
      var nn = NODE_MAP[h.nodeId];
      if (!nn) { return; }
      var li = document.createElement('li');
      var a = document.createElement('span');
      a.className = 'rc-name';
      a.textContent = nn.code + ' ' + nn.label;
      var b = document.createElement('span');
      b.className = 'rc-st' + (h.state === 'done' ? ' done' : '');
      b.textContent = h.state === 'done' ? '已修复' : '待修复';
      li.appendChild(a); li.appendChild(b);
      li.addEventListener('click', function () {
        S.activeId = h.nodeId;
        switchView('map');
        setFocus(h.nodeId);
        setTimeout(function () {
          if (!S.broken[h.nodeId]) { breakNode(h.nodeId, false); }
          fillSide(h.nodeId);
        }, 80);
      });
      rl.appendChild(li);
    });
  }

  /* ───────────── 刷题 ───────────── */

  function shuffled(n) {
    var a = [], i, j, t;
    for (i = 0; i < n; i++) { a.push(i); }
    for (i = n - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function updateDrillStats() {
    $('#drillDone').textContent = DR.done;
    $('#drillOk').textContent = DR.ok;
    $('#drillBad').textContent = DR.bad;
    var pct = GEN.length ? Math.round(DR.done / GEN.length * 100) : 0;
    $('#drillBar').style.width = Math.min(100, pct) + '%';
  }

  function startDrill() {
    DR.order = shuffled(GEN.length);
    DR.i = 0; DR.done = 0; DR.ok = 0; DR.bad = 0;
    updateDrillStats();
    showDrillQuestion();
  }

  function showDrillQuestion() {
    if (DR.done >= GEN.length) { startDrill(); return; }
    var q = GEN[DR.order[DR.i % GEN.length]];
    DR.q = q;
    DR.picked = null;

    $('#drillResult').hidden = true;
    $('#drillCard').hidden = false;
    $('#dqNode').textContent = fullOf(q.nodeId) + ' · ' + NODE_MAP[q.nodeId].book;
    $('#dqIdx').textContent = '第 ' + (DR.done + 1) + ' / ' + GEN.length + ' 题';
    mf($('#dqStem'), q.stem);

    var box = $('#dqOptions');
    box.textContent = '';
    q.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.dataset.k = o.k;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = o.k;
      var t = document.createElement('span'); t.className = 't'; mf(t, o.t);
      b.appendChild(k); b.appendChild(t);
      b.addEventListener('click', function () {
        $$('#dqOptions .opt').forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel');
        DR.picked = o.k;
        $('#dqSubmit').disabled = false;
      });
      box.appendChild(b);
    });
    $('#dqSubmit').disabled = true;
    $('#dqSubmit').hidden = false;
  }

  function submitDrill() {
    if (!DR.q || !DR.picked) { return; }
    var q = DR.q;
    var ok = DR.picked === q.answer;
    var rightText = q.options.filter(function (o) { return o.k === q.answer; })[0];
    var youText = q.options.filter(function (o) { return o.k === DR.picked; })[0];

    $$('#dqOptions .opt').forEach(function (b) {
      b.disabled = true;
      b.classList.remove('sel');
      if (b.dataset.k === q.answer) { b.classList.add('correct'); }
      else if (b.dataset.k === DR.picked) { b.classList.add('wrong'); }
    });
    $('#dqSubmit').hidden = true;

    DR.done++;
    if (ok) {
      DR.ok++;
      S.mastery[q.nodeId] = Math.min(100, S.mastery[q.nodeId] + 5);
    } else {
      DR.bad++;
      S.mastery[q.nodeId] = Math.max(5, S.mastery[q.nodeId] - 8);
    }
    updateMastery();
    persist();
    updateDrillStats();

    var banner = $('#drBanner');
    banner.className = 'verdict-banner' + (ok ? ' ok' : '');
    $('#drIcon').textContent = ok ? '✓' : '✕';
    $('#drTitle').textContent = ok ? '答对了' : '答错了';
    $('#drSub').textContent = '命中 ' + fullOf(q.nodeId) + ' · ' + (ok ? '无错误' : q.errorType);

    if (ok) {
      $('#drTag').textContent = '已计入';
      $('#drYouBox').className = 'ans-box good';
    } else {
      $('#drTag').textContent = '已加入错题本';
      $('#drYouBox').className = 'ans-box bad';
      pushHistory(q.nodeId, q.errorType);
      S.activeId = q.nodeId;
    }

    mf($('#drYou'), youText ? youText.t : DR.picked);
    mf($('#drRight'), rightText ? rightText.t : q.answer);

    var ol = $('#drSteps');
    ol.textContent = '';
    q.steps.forEach(function (s) {
      var li = document.createElement('li');
      mf(li, s);
      ol.appendChild(li);
    });

    // 图
    var card = $('#drPlotCard');
    if (q.plot && window.Plot && $('#drPlot')) {
      card.hidden = false;
      if (!drillPlot) { drillPlot = window.Plot.create($('#drPlot')); }
      var r = drillPlot.setExpression(q.plot.expr);
      if (r.ok) {
        if (q.plot.range) { drillPlot.setRange(q.plot.range[0], q.plot.range[1]); }
        drillPlot.setDeriv(!!q.plot.deriv);
        drillPlot.setTangent(q.plot.tangent || null);
        drillPlot.setMarks(q.plot.marks || []);
        $('#drPlotExpr').textContent = 'y = ' + r.source;
        setTimeout(function () { drillPlot.redraw(); }, 40);
      } else {
        card.hidden = true;
      }
    } else {
      card.hidden = true;
    }

    $('#drillCard').hidden = true;
    $('#drillResult').hidden = false;
  }

  function nextDrill() {
    DR.i++;
    if (DR.done >= GEN.length) {
      $('#drillResult').hidden = true;
      startDrill();
      return;
    }
    showDrillQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ───────────── 教学（一数 · B 站） ───────────── */

  function openTeachFor(id) {
    S.teachId = id;
    switchView('teach');
    renderTeachList();
    selectTeach(id);
  }

  function biliSearch(q) {
    return 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q);
  }

  function renderTeachList() {
    var box = $('#teachList');
    box.textContent = '';
    NODES.forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'teach-item' + (n.id === S.teachId ? ' on' : '');
      b.dataset.id = n.id;
      var lv = document.createElement('span');
      lv.className = 'ti-lv';
      lv.textContent = n.level === 'sen' ? '高' : '大';
      var nm = document.createElement('span');
      nm.textContent = n.label;
      b.appendChild(lv); b.appendChild(nm);
      b.addEventListener('click', function () { selectTeach(n.id); });
      box.appendChild(b);
    });
  }

  function selectTeach(id) {
    S.teachId = id;
    var n = NODE_MAP[id];
    if (!n) { return; }

    $$('.teach-item').forEach(function (x) { x.classList.toggle('on', x.dataset.id === id); });

    $('#thCode').textContent = n.code + ' · ' + n.book;
    $('#thName').textContent = n.label;
    $('#thSub').textContent = n.chapter + ' · ' + (n.prereq ? ('前置 ' + fullOf(n.prereq)) : '主线起点');
    $('#thSpace').href = biliSearch('一数');

    var list = $('#videoList');
    list.textContent = '';
    var META = {
      '概念': { dur: '12 分钟', lvl: '入门' },
      '基础': { dur: '10 分钟', lvl: '入门' },
      '题型': { dur: '18 分钟', lvl: '进阶' },
      '技巧': { dur: '16 分钟', lvl: '进阶' },
      '易错': { dur: '14 分钟', lvl: '进阶' },
      '压轴': { dur: '25 分钟', lvl: '挑战' }
    };

    DATA.teachFor(id).forEach(function (v) {
      var meta = META[v.tag] || { dur: '15 分钟', lvl: '进阶' };

      var card = document.createElement('div');
      card.className = 'video-card';

      var top = document.createElement('div');
      top.className = 'vc-top';

      var cover = document.createElement('span');
      cover.className = 'vc-cover';
      cover.textContent = n.code;

      var metaBox = document.createElement('div');
      metaBox.className = 'vc-meta';

      var tag = document.createElement('span');
      tag.className = 'vc-tag';
      tag.textContent = v.tag;

      var dur = document.createElement('span');
      dur.className = 'vc-dur';
      dur.textContent = meta.dur + ' · ' + meta.lvl;

      metaBox.appendChild(tag); metaBox.appendChild(dur);
      top.appendChild(cover); top.appendChild(metaBox);

      var t = document.createElement('div');
      t.className = 'vc-title';
      t.textContent = v.t;

      var d = document.createElement('div');
      d.className = 'vc-desc';
      d.textContent = v.d;

      var a = document.createElement('a');
      a.className = 'vc-go';
      a.href = biliSearch(v.q);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '一数 · 在 B 站打开 →';

      card.appendChild(top); card.appendChild(t); card.appendChild(d); card.appendChild(a);
      list.appendChild(card);
    });
  }
  /* ───────────── 初始化 ───────────── */

  function reset() {
    if (!window.confirm('重置会清空掌握度和错题本，确定吗？')) { return; }
    NODES.forEach(function (n) { S.mastery[n.id] = n.m; S.before[n.id] = n.m; });
    S.broken = {};
    S.activeId = null;
    S.quizNode = null;
    S.selected = null;
    S.probeSel = null;
    S.locked = false;
    S.history = [];
    S.focusId = 'der-def';

    renderMap();
    updateMastery();
    renderBook();

    $('#qInput').value = '';
    $('#resultCard').hidden = true;
    $('#practiceCard').hidden = true;
    $('#placeholder').hidden = false;
    $('#guide').hidden = false;
    $('#srcBadge').hidden = true;
    $('#sideBody').hidden = true;
    $('#sideEmpty').hidden = false;
    $('#diagnoseBtn').disabled = false;
    $('#diagnoseBtn').textContent = '诊断这道题';
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    switchView('diagnose');
  }

  function init() {
    var params = new URLSearchParams(location.search);
    if (params.get('fx') === '0') { document.documentElement.classList.add('no-fx'); }

    NODES.forEach(function (n) { S.mastery[n.id] = n.m; S.before[n.id] = n.m; });
    restore();

    renderMap();
    updateMastery();
    renderBook();

    $$('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.dataset.view); });
    });

    var box = $('#samples');
    SAMPLES.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = s.chip;
      b.addEventListener('click', function () { $('#qInput').value = s.text; $('#qInput').focus(); });
      box.appendChild(b);
    });

    $('#diagnoseBtn').addEventListener('click', diagnose);
    $('#qInput').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); diagnose(); }
    });
    $('#toMap').addEventListener('click', goLocate);
    $('#resetBtn').addEventListener('click', reset);

    $('#dqSubmit').addEventListener('click', submitDrill);
    $('#dqSkip').addEventListener('click', function () { DR.i++; showDrillQuestion(); });
    $('#drNext').addEventListener('click', nextDrill);
    $('#drToBook').addEventListener('click', function () { switchView('book'); });

    $('#practiceStart').addEventListener('click', startPractice);
    $('#pqAgain').addEventListener('click', startPractice);
    $('#pqSubmit').addEventListener('click', submitPractice);

    $('#probeBtn').addEventListener('click', openProbe);
    $('#probeSubmit').addEventListener('click', submitProbe);
    $('#submitAnswer').addEventListener('click', submitAnswer);
    $('#retryAnswer').addEventListener('click', retryAnswer);
    $('#qVideo').addEventListener('click', function () {
      if (S.quizNode) { openTeachFor(S.quizNode); }
    });

    if (window.Plot && $('#plot')) {
      S.plot = window.Plot.create($('#plot'));
      $('#fxDeriv').addEventListener('click', function () {
        var on = this.classList.toggle('on');
        S.plot.setDeriv(on);
      });
    }

    var demo = params.get('demo');
    if (demo) {
      setTimeout(async function () {
        if (demo === '20') {
          var custom = '求 lim(x→0) (tanx − sinx) / x³ 的值。' + String.fromCharCode(10) + '我觉得分子趋于 0，所以极限是 0。';
          document.querySelector('#qInput').value = custom;
          await diagnose();
          return;
        }
        if (demo === '7') { startPractice(); return; }
        if (demo === '10') { switchView('drill'); return; }
        if (demo === '11') { switchView('teach'); return; }
        if (demo === '12' || demo === '13') {
          switchView('drill');
          setTimeout(function () {
            var q = DR.q;
            var wrong = q.options.filter(function (o) { return o.k !== q.answer; })[0];
            var b = document.querySelector('#dqOptions .opt[data-k=' + JSON.stringify(wrong.k) + ']');
            if (b) { b.click(); submitDrill(); }
            if (demo === '13') { setTimeout(function () { switchView('book'); }, 600); }
          }, 350);
          return;
        }
        if (demo === '8') {
          startPractice();
          setTimeout(function () {
            var q = S.practice.item;
            var wrong = q.options.filter(function (o) { return o.k !== q.answer; })[0];
            var b = document.querySelector('#pqOptions .opt[data-k=' + JSON.stringify(wrong.k) + ']');
            if (b) { b.click(); submitPractice(); }
          }, 500);
          return;
        }
        var idx = demo === '6' ? 2 : 0;
        $('#qInput').value = SAMPLES[idx].text;
        await diagnose();
        if (demo === '2' || demo === '3' || demo === '4' || demo === '5' || demo === '14' || demo === '15') { goLocate(); }
        if (demo === '3') {
          setTimeout(function () {
            var v = VARIANTS[S.activeId] || FALLBACK;
            var b = document.querySelector('#qOptions .opt[data-k="' + v.answer + '"]');
            if (b) { b.click(); submitAnswer(); }
          }, 900);
        }
        if (demo === '14' || demo === '15') {
          setTimeout(function () {
            var v = VARIANTS[S.activeId] || FALLBACK;
            var wrong = v.options.filter(function (o) { return o.k !== v.answer; })[0];
            var b = document.querySelector('#qOptions .opt[data-k=' + JSON.stringify(wrong.k) + ']');
            if (b) { b.click(); submitAnswer(); }
            if (demo === '15') { setTimeout(function () { $('#qVideo').click(); }, 900); }
          }, 1300);
        }
        if (demo === '4' || demo === '5') {
          setTimeout(function () {
            openProbe();
            var probe = PROBES[S.activeId];
            var want = demo === '4' ? probe.answer
                                    : probe.options.filter(function (o) { return o.k !== probe.answer; })[0].k;
            var b = document.querySelector('#probeOptions .opt[data-k="' + want + '"]');
            if (b) { b.click(); submitProbe(); }
          }, 900);
        }
      }, 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();


















