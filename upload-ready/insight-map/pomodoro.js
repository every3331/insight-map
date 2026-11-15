/* 洞见 · 番茄钟 / 计时器（零依赖，自挂载，不依赖 HTML 改动） */
(function () {
  'use strict';
  var KEY = 'dongjian.pomo';
  var card = document.querySelector('.input-card');
  if (!card || document.getElementById('pomoBox')) { return; }
  var box = document.createElement('div');
  box.className = 'pomo';
  box.id = 'pomoBox';
  var head = card.querySelector('.card-head');
  if (head && head.nextSibling) { card.insertBefore(box, head.nextSibling); } else { card.appendChild(box); }

  var savedAll = {};
  try { savedAll = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var customMin = Math.min(180, Math.max(1, Math.round(Number(savedAll.customMin) || 40)));
  var MODES = [
    { key: 'focus', label: '专注 25', sec: 1500 },
    { key: 'long', label: '长休 15', sec: 900 },
    { key: 'custom', label: '自定义 ' + customMin, sec: customMin * 60 },
    { key: 'up', label: '正计时', sec: 0 }
  ];
  var st = { mode: 'focus', left: 1500, running: false, endAt: 0, tick: null, count: 0, day: new Date().toDateString() };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.day === st.day) { st.count = saved.count || 0; }
  } catch (e) {}

  function save() { try { localStorage.setItem(KEY, JSON.stringify({ day: st.day, count: st.count, customMin: customMin })); } catch (e) {} }
  function fmt(s) { s = Math.max(0, Math.floor(s)); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
  function modeOf(k) { for (var i = 0; i < MODES.length; i++) { if (MODES[i].key === k) { return MODES[i]; } } return MODES[0]; }

  box.innerHTML =
    '<div class="pomo-head"><span class="pomo-title">番茄钟 · 计时器</span><span class="pomo-count" id="pomoCount">今日 ' + st.count + ' 个</span></div>' +
    '<div class="pomo-row"><div class="pomo-time" id="pomoTime">25:00</div>' +
    '<div class="pomo-ctrl"><button class="btn btn-primary btn-sm" id="pomoBtn" type="button">开始</button>' +
    '<button class="btn btn-text btn-sm" id="pomoReset" type="button">重置</button></div></div>' +
    '<div class="pomo-modes" id="pomoModes">' + MODES.map(function (m) {
      return '<button class="pomo-chip' + (m.key === st.mode ? ' on' : '') + '" data-m="' + m.key + '" type="button">' + m.label + '</button>';
    }).join('') + '</div>' +
    '<div class="pomo-set"><span class="ps-label">自定义</span>' +
    '<input id="pomoCustom" type="number" min="1" max="180" step="1" value="' + customMin + '" />' +
    '<span class="ps-unit">分钟</span>' +
    '<button class="pomo-chip" id="pomoApply" type="button">设定</button></div>';

  var $t = box.querySelector('#pomoTime'), $b = box.querySelector('#pomoBtn'),
      $r = box.querySelector('#pomoReset'), $c = box.querySelector('#pomoCount'), $m = box.querySelector('#pomoModes');

  function paint() {
    $t.textContent = fmt(st.left);
    $b.textContent = st.running ? '暂停' : '开始';
    box.classList.toggle('running', st.running);
    box.classList.toggle('done', !st.running && st.mode !== 'up' && st.left === 0);
  }
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { return; }
      var ac = new AC(), o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = 0.08;
      o.start(); setTimeout(function () { o.stop(); ac.close(); }, 260);
    } catch (e) {}
  }
  function halt() { st.running = false; if (st.tick) { clearInterval(st.tick); st.tick = null; } }
  function tickFn() {
    st.left = Math.max(0, st.mode === 'up' ? (Date.now() - st.endAt) / 1000 : (st.endAt - Date.now()) / 1000);
    paint();
    if (st.mode !== 'up' && st.left <= 0) {
      halt(); beep();
      if (st.mode === 'focus') { st.count++; st.day = new Date().toDateString(); $c.textContent = '今日 ' + st.count + ' 个'; save(); }
      paint();
    }
  }
  $b.addEventListener('click', function () {
    if (st.running) { halt(); paint(); return; }
    if (st.mode !== 'up' && st.left <= 0) { st.left = modeOf(st.mode).sec; }
    st.running = true;
    st.endAt = st.mode === 'up' ? Date.now() : Date.now() + st.left * 1000;
    st.tick = setInterval(tickFn, 250);
    paint();
  });
  $r.addEventListener('click', function () { halt(); st.left = modeOf(st.mode).sec; paint(); });
  $m.addEventListener('click', function (e) {
    if (!e.target || !e.target.dataset || !e.target.dataset.m) { return; }
    halt(); st.mode = e.target.dataset.m; st.left = modeOf(st.mode).sec;
    Array.prototype.forEach.call($m.querySelectorAll('.pomo-chip'), function (c) { c.classList.toggle('on', c.dataset.m === st.mode); });
    paint();
  });
  var $ci = box.querySelector('#pomoCustom'), $ap = box.querySelector('#pomoApply');
  if ($ap) {
    $ap.addEventListener('click', function () {
      var v = Math.round(Number($ci.value));
      if (!isFinite(v)) { v = 25; }
      v = Math.min(180, Math.max(1, v));
      $ci.value = v;
      customMin = v;
      MODES.forEach(function (m) { if (m.key === 'custom') { m.sec = v * 60; m.label = '自定义 ' + v; } });
      halt();
      st.mode = 'custom';
      st.left = v * 60;
      Array.prototype.forEach.call($m.querySelectorAll('.pomo-chip'), function (c) {
        c.classList.toggle('on', c.dataset.m === 'custom');
        if (c.dataset.m === 'custom') { c.textContent = '自定义 ' + v; }
      });
      save();
      paint();
    });
    $ci.addEventListener('keydown', function (e) { if (e.key === 'Enter') { $ap.click(); } });
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden && st.running) { tickFn(); } });
  paint();
})();
