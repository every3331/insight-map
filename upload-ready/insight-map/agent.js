/* 洞见 · AI 助教（Agent 前端）
 *
 * 一个角色：诊断助教。职责边界非常清楚 ——
 *   模型只负责「读懂学生的写法 + 说清卡在哪 + 给分步讲解」，
 *   它不能改图谱、不能算答案、不能选候选之外的知识点。
 *
 * 闭环：诊断结果里的 4 个动作全部接到已有模块上
 *   ① 去地图看断点 → DJ.openNode  ② 记进错题本 → DJ.addWrong
 *   ③ 做同类题 → 刷题页           ④ 按断点组卷 → 试卷页
 *
 * 离线也能用：后端没起 / 没配 key 时，自动回落到本地引擎，界面照常。
 */
(function (root) {
  'use strict';

  var EP_KEY = 'dj.agent.endpoint';
  /* 端点优先级：手动保存 > 同源的零依赖后端 > Next.js 开发服务器 */
  function candidates404() {
    var list = [];
    var saved = localStorage.getItem(EP_KEY);
    if (saved) { list.push(saved); }
    if (location.protocol !== 'file:') { list.push(location.origin + '/api/agent'); }
    list.push('http://127.0.0.1:5173/api/agent');
    list.push('http://127.0.0.1:3100/api/agent');
    var seen = {};
    return list.filter(function (u) { if (!u || seen[u]) { return false; } seen[u] = 1; return true; });
  }
  var EPS = candidates404();
  var EP = EPS[0];

  var st = { open: false, online: null, busy: false, data: null, stream: '', nodeId: null, errorType: '', role: 'diag' };

  var ROLE = {
    diag: { tip: '我会先读懂你的写法，指出卡在哪一步，再一步步讲。知识点只能在候选里选，选不到就回落到本地引擎。', btn: '诊断这道题', stream: true },
    plan: { tip: '规划不看模型：直接读你的错题本和图谱，排出一条从地基到断点的最短补课链，每一步都能点走。', btn: '排一条补课路线', stream: false },
    grade: { tip: '阅卷把标准解法拆成得分点：你对着勾，分就按勾出来的算，不再靠"我觉得我行"。', btn: '看这道题的得分点', stream: false }
  };
  var el = {};

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function data() { return root.APP_DATA; }

  /* ───────── 挂载 ───────── */
  var POS_KEY = 'dj.agent.pos';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function applyFabPos(x, y) {
    var w = el.fab.offsetWidth || 48, h = el.fab.offsetHeight || 120;
    var nx = clamp(x, 6, window.innerWidth - w - 6);
    var ny = clamp(y, 6, window.innerHeight - h - 6);
    el.fab.style.left = nx + 'px';
    el.fab.style.top = ny + 'px';
    el.fab.style.right = 'auto';
    el.fab.style.bottom = 'auto';
    el.fab.style.transform = 'none';
    try { localStorage.setItem(POS_KEY, JSON.stringify({ x: nx, y: ny })); } catch (e) {}
    return { x: nx, y: ny };
  }

  function placePanel() {
    if (!el.panel || el.panel.hidden) { return; }
    var f = el.fab.getBoundingClientRect();
    var pw = el.panel.offsetWidth || 400;
    var ph = el.panel.offsetHeight || 520;
    var left = f.left - pw - 14;
    if (left < 10) { left = f.right + 14; }
    if (left + pw > window.innerWidth - 10) { left = window.innerWidth - pw - 10; }
    var top = f.top + f.height / 2 - ph / 2;
    top = clamp(top, 10, Math.max(10, window.innerHeight - ph - 10));
    el.panel.style.left = left + 'px';
    el.panel.style.top = top + 'px';
    el.panel.style.right = 'auto';
    el.panel.style.bottom = 'auto';
    el.panel.style.transform = 'none';
  }

  var STATIC_HOST = /\.(github|gitee)\.io$/i.test(location.hostname) || location.protocol === 'file:';

  function staticBanner() {
    if (document.getElementById('staticBanner')) { return; }
    var bar = document.createElement('div');
    bar.id = 'staticBanner';
    bar.className = 'static-banner';
    bar.innerHTML =
      '<b>在线体验版</b>' +
      '<span>AI 助教使用<b>内置诊断引擎</b>（离线可用）；完整模型能力见演示视频，或本地 <code>node server.js</code> 运行。</span>' +
      '<button type="button" aria-label="关闭提示">×</button>';
    document.body.appendChild(bar);
    bar.querySelector('button').addEventListener('click', function () { bar.remove(); });
  }

  function openPanel(autoRun) {
    st.open = true;
    el.panel.hidden = false;
    placePanel();
    refreshCtx();
    ping();
    if (autoRun) { setTimeout(function () { run('diagnose'); }, 150); }
  }

  function mount() {
    /* 幂等：重复加载本脚本时不重复挂载（否则会出现两套面板，点了没反应） */
    if (document.getElementById('agFab') || document.getElementById('agPanel')) { return; }
    var wrap = document.createElement('div');
    wrap.className = 'agent';
    wrap.innerHTML =
      '<button class="agent-fab" id="agFab" type="button" title="AI 助教（可拖动，Ctrl+K 打开）" aria-label="打开 AI 助教">助教</button>' +
      '<section class="agent-panel" id="agPanel" hidden>' +
        '<header class="ag-head">' +
          '<span class="ag-title">AI 助教 · 诊断</span>' +
          '<i class="ag-dot" id="agDot" title="后端状态"></i>' +
          '<button class="ag-x" id="agClose" type="button" aria-label="关闭助教面板">×</button>' +
        '</header>' +
        '<div class="ag-body" id="agBody">' +
          '<div class="ag-roles" id="agRoles">' +
            '<button class="ag-role on" data-role="diag" type="button">诊断助教</button>' +
            '<button class="ag-role" data-role="plan" type="button">规划助教</button>' +
            '<button class="ag-role" data-role="grade" type="button">阅卷助教</button>' +
          '</div>' +
          '<div class="ag-ctx" id="agCtx">当前：诊断页</div>' +
          '<p class="ag-tip">我会先读懂你的写法，指出卡在哪一步，再一步步讲。知识点只能在候选里选，选不到就回落到本地引擎。</p>' +
          '<div class="ag-actions">' +
            '<button class="btn btn-primary btn-sm" id="agRun" type="button">诊断这道题</button>' +
            '<button class="btn btn-ghost btn-sm" id="agStream" type="button">边讲边看</button>' +
          '</div>' +
          '<div class="ag-out" id="agOut"></div>' +
        '</div>' +
        '<footer class="ag-foot">' +
          '<div class="ag-quick" id="agQuick">' +
            '<button class="ag-q" data-q="这一步为什么要这样做？" type="button">这步为什么</button>' +
            '<button class="ag-q" data-q="能再举一个同类型但更简单的例子吗？" type="button">举个更简单的</button>' +
            '<button class="ag-q" data-q="我最容易在哪一步出错？" type="button">我容易错哪</button>' +
          '</div>' +
          '<div class="ag-ask">' +
            '<input class="ag-askin" id="agAsk" placeholder="接着问：为什么第三步要那样做？" autocomplete="off" />' +
            '<button class="ag-send" id="agSend" type="button">发送</button>' +
            '<button class="ag-send ghost" id="agStop" type="button" hidden>停止</button>' +
          '</div>' +
          '<div class="ag-set" id="agSet" hidden>' +
            '<div class="ag-set-row"><span>API Key</span><input id="agKeyIn" type="password" placeholder="sk-…（只发给本机后端，前端不保存）" autocomplete="off" /></div>' +
            '<div class="ag-set-row"><span>网关</span><input id="agBase" placeholder="https://api.deepseek.com/v1" autocomplete="off" /></div>' +
            '<div class="ag-set-row"><span>模型</span><input id="agModel" placeholder="deepseek-chat" autocomplete="off" /></div>' +
            '<div class="ag-set-act"><button class="ag-send" id="agKeySave" type="button">保存到后端</button>' +
              '<em id="agKeyMsg"></em></div>' +
          '</div>' +
          '<div class="ag-utils">' +
            '<button class="ag-mini" id="agCopy" type="button">复制讲解</button>' +
            '<button class="ag-mini" id="agHist" type="button">历史</button>' +
            '<button class="ag-mini" id="agKey" type="button">密钥</button>' +
            '<input class="ag-ep" id="agEp" value="' + esc(EP) + '" spellcheck="false" />' +
            '<button class="ag-save" id="agSaveEp" type="button">保存</button>' +
          '</div>' +
        '</footer>' +
      '</section>';
    document.body.appendChild(wrap);

    el.fab = $('#agFab'); el.panel = $('#agPanel'); el.body = $('#agBody');
    el.out = $('#agOut'); el.dot = $('#agDot'); el.ep = $('#agEp');
    el.ask = $('#agAsk'); el.chatLog = null; el.lastText = '';
    el.ctx = $('#agCtx');
    document.addEventListener('click', function (e) {
      if (!st.open) { return; }
      var t = e.target;
      if (t && t.closest && t.closest('.nav-btn, .teach-item, .pq, .star-node, .pp-item, .ptab')) {
        setTimeout(refreshCtx, 30);
      }
    });

    /* 可拖动：拖动超过 4px 就不当成点击 */
    var drag = null;
    el.fab.addEventListener('pointerdown', function (e) {
      var r = el.fab.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false, x: r.left, y: r.top };
      el.fab.setPointerCapture && el.fab.setPointerCapture(e.pointerId);
      el.fab.classList.add('dragging');
    });
    el.fab.addEventListener('pointermove', function (e) {
      if (!drag) { return; }
      if (Math.abs(e.clientX - drag.dx - drag.x) > 4 || Math.abs(e.clientY - drag.dy - drag.y) > 4) { drag.moved = true; }
      if (!drag.moved) { return; }
      applyFabPos(e.clientX - drag.dx, e.clientY - drag.dy);
    });
    el.fab.addEventListener('pointerup', function (e) {
      el.fab.classList.remove('dragging');
      var moved = drag && drag.moved;
      drag = null;
      if (moved) { placePanel(); ping(); return; }
      st.lastPointerAt = Date.now();
      if (st.open) { st.open = false; el.panel.hidden = true; return; }
      openPanel(false);
    });

    /* 键盘（Enter/Space）与老浏览器只发 click，不 pointerup —— 这里兜底 */
    el.fab.addEventListener('click', function () {
      if (Date.now() - (st.lastPointerAt || 0) < 800) { return; }
      if (st.open) { st.open = false; el.panel.hidden = true; return; }
      openPanel(false);
    });
    el.fab.addEventListener('pointercancel', function () { drag = null; el.fab.classList.remove('dragging'); });

    /* 恢复上次的位置；没存过就用默认（右侧居中） */
    try {
      var saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (saved && typeof saved.x === 'number') {
        applyFabPos(saved.x, saved.y);
      } else {
        var w = el.fab.offsetWidth || 48, h = el.fab.offsetHeight || 120;
        applyFabPos(window.innerWidth - w - 20, window.innerHeight / 2 - h / 2);
      }
    } catch (e) { /* ignore */ }

    window.addEventListener('resize', function () {
      var r = el.fab.getBoundingClientRect();
      applyFabPos(r.left, r.top);
      placePanel();
    });

    if (STATIC_HOST) { staticBanner(); }
    var entry = document.getElementById('agentEntry');
    if (entry) { entry.addEventListener('click', function () { openPanel(true); }); }
    var navAgent = document.getElementById('navAgent');
    if (navAgent) {
      navAgent.addEventListener('click', function () {
        openPanel(false);
        setTimeout(function () { if (el.ask) { el.ask.focus(); } }, 60);
      });
    }
    root.Agent = {
      open: openPanel,
      run: run,
      ping: ping,
      askTopic: function (id) {
        var D = data();
        var n = D && D.NODE_MAP ? D.NODE_MAP[id] : null;
        var label = n ? n.label : id;
        openPanel(false);
        setTimeout(function () {
          askQuestion('请讲一下「' + label + '」这个知识点：它是什么、最典型的用法、最常见的错误各是什么，分点讲清楚。', [id]);
        }, 160);
      }
    };
    $('#agClose').addEventListener('click', function () { st.open = false; el.panel.hidden = true; });
    el.out.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
      if (t) {
        if (t.dataset.act === 'gradeAsk') {
          askQuestion('这道大题里，哪一步最容易丢分？为什么？');
          return;
        }
        doAct(t, t.dataset.act);
        return;
      }
      var p = e.target && e.target.closest ? e.target.closest('[data-plan]') : null;
      if (!p) { return; }
      var id = p.dataset.id;
      if (p.dataset.plan === 'map' && root.DJ) { root.DJ.openNode(id); closePanel(); }
      if (p.dataset.plan === 'teach' && root.DJ && root.DJ.openTeach) { root.DJ.openTeach(id); closePanel(); }
      if (p.dataset.plan === 'ask') { askQuestion('请讲一下「' + ((data().NODE_MAP[id] || {}).label || id) + '」这个知识点：它是什么、典型用法、最常见的错误。', [id]); }
    });
    var roles = document.getElementById('agRoles');
    if (roles) {
      roles.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.ag-role') : null;
        if (t) { setRole(t.dataset.role); }
      });
    }

    $('#agRun').addEventListener('click', function () {
      if (st.role === 'plan') { return runPlan(); }
      if (st.role === 'grade') { return runGrade(); }
      run('diagnose');
    });
    $('#agStream').addEventListener('click', function () { run('stream'); });
    function ensureChatLog() {
      if (el.chatLog && el.chatLog.parentNode) { return el.chatLog; }
      var box = document.createElement('div');
      box.className = 'ag-chat';
      el.out.appendChild(box);
      el.chatLog = box;
      return box;
    }

    function appendMsg(role, text) {
      var box = ensureChatLog();
      var row = document.createElement('div');
      row.className = 'ag-msg ' + role;
      row.textContent = text;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
      return row;
    }

    function sendAsk() {
      var v = String(el.ask.value || '').trim();
      if (!v || st.busy) { return; }
      el.ask.value = '';
      askQuestion(v);
    }

    function askQuestion(v, candHint) {
      if (!v || st.busy) { return; }
      if (!el.panel || el.panel.hidden) { openPanel(false); }
      st.hist = st.hist || [];
      st.hist.push({ role: 'user', content: v });
      appendMsg('user', v);

      var bot = appendMsg('bot', '');
      st.busy = true;
      var stopBtn = $('#agStop');
      if (stopBtn) { stopBtn.hidden = false; }
      var ctl = new AbortController();
      st.ctl = ctl;
      st.lastText = '';
      var started = Date.now();

      fetch(EP, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          question: currentInput().question,
          work: currentInput().work,
          candidates: candHint && candHint.length
            ? candHint.map(function (id) {
                var n = data().NODE_MAP[id] || {};
                return { id: id, label: n.label || id, code: n.code || '', level: n.level || 'uni', prereq: n.prereq || '' };
              })
            : candidatesOf(currentInput().question + ' ' + currentInput().work),
          messages: st.hist.slice(-8)
        }),
        signal: ctl.signal
      }).then(function (res) {
        if (!res.ok || !res.body) { throw new Error('HTTP ' + res.status); }
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        (function pump() {
          reader.read().then(function (x) {
            if (x.done) {
              st.busy = false;
              if (stopBtn) { stopBtn.hidden = true; }
              st.hist.push({ role: 'assistant', content: st.lastText });
              var t = Math.round((Date.now() - started) / 100) / 10;
              var tag = document.createElement('div');
              tag.className = 'ag-meta2';
              tag.textContent = '耗时 ' + t + 's · 追问 ' + (st.hist.filter(function (m) { return m.role === 'user'; }).length) + ' 轮';
              bot.appendChild(tag);
              return;
            }
            st.lastText += dec.decode(x.value, { stream: true });
            bot.textContent = st.lastText;
            ensureChatLog().scrollTop = 1e6;
            pump();
          });
        })();
      }).catch(function (err) {
        st.busy = false;
        if (stopBtn) { stopBtn.hidden = true; }
        if (err && err.name === 'AbortError') { bot.textContent = st.lastText + '\n（已停止）'; return; }
        bot.textContent = '追问失败：后端没连上或返回异常。可以先看上面的卡片，它已经把关键步骤写全了。';
      });
    }

    var quick = document.getElementById('agQuick');
    if (quick) {
      quick.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.ag-q') : null;
        if (!t) { return; }
        if (el.ask) { el.ask.value = t.dataset.q || ''; }
        sendAsk();
      });
    }

    $('#agSend').addEventListener('click', sendAsk);
    if (el.ask) {
      el.ask.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sendAsk(); }
      });
    }
    $('#agStop').addEventListener('click', function () {
      if (st.ctl) { try { st.ctl.abort(); } catch (e) {} }
      st.busy = false;
      this.hidden = true;
    });
    $('#agCopy').addEventListener('click', function () {
      var txt = (el.out.querySelector('.ag-card') ? el.out.innerText : '') || '';
      if (!txt) { return; }
      var ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      this.textContent = '已复制 ✓';
      var btn = this;
      setTimeout(function () { btn.textContent = '复制讲解'; }, 1600);
    });
    var keyBtn = document.getElementById('agKey');
    var keySet = document.getElementById('agSet');
    if (keyBtn) {
      keyBtn.addEventListener('click', function () {
        if (keySet) { keySet.hidden = !keySet.hidden; }
        if (keySet && !keySet.hidden) {
          var inp = document.getElementById('agKeyIn');
          if (inp) { inp.focus(); }
        }
      });
    }
    var keySave = document.getElementById('agKeySave');
    if (keySave) {
      keySave.addEventListener('click', function () {
        var msg = document.getElementById('agKeyMsg');
        var cfg = {
          apiKey: (document.getElementById('agKeyIn') || {}).value || '',
          baseUrl: (document.getElementById('agBase') || {}).value || '',
          model: (document.getElementById('agModel') || {}).value || ''
        };
        if (!cfg.apiKey) { if (msg) { msg.textContent = '先填 Key'; msg.className = 'ag-keymsg err'; } return; }
        if (msg) { msg.textContent = '保存中…'; msg.className = 'ag-keymsg'; }
        fetch(EP.replace(/\/api\/agent$/, '/api/agent/config'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(cfg)
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (!j || !j.ok) { throw new Error((j && j.error) || '保存失败'); }
          if (msg) { msg.textContent = '已保存到后端：' + (j.masked || '') + ' · ' + (j.model || ''); msg.className = 'ag-keymsg ok'; }
          var k = document.getElementById('agKeyIn');
          if (k) { k.value = ''; }
          ping();
        }).catch(function (err) {
          if (msg) { msg.textContent = '保存失败：' + String(err.message || err).slice(0, 60); msg.className = 'ag-keymsg err'; }
        });
      });
    }

    $('#agHist').addEventListener('click', function () {
      var hs = [];
      try { hs = JSON.parse(localStorage.getItem('dj.agent.history') || '[]'); } catch (e) {}
      var old = document.getElementById('agHistList');
      if (old) { old.parentNode.removeChild(old); }

      var box = document.createElement('div');
      box.id = 'agHistList';
      box.className = 'ag-hist';
      box.innerHTML =
        '<div class="ah-head"><b>最近诊断</b>' +
          '<button class="ag-mini" id="agHistClear" type="button">清空</button>' +
          '<button class="ag-mini" id="agHistClose" type="button">收起</button>' +
        '</div>' +
        (hs.length
          ? hs.slice(-8).reverse().map(function (h, i) {
              return '<button class="ah-row" data-i="' + i + '" type="button">' +
                '<b>' + esc(h.title || '') + '</b>' +
                '<span>' + esc(h.body || '') + '</span>' +
                '<em>' + new Date(h.t || Date.now()).toLocaleTimeString() + '</em>' +
              '</button>';
            }).join('')
          : '<div class="ah-empty">还没有记录：诊断一次之后这里会留下痕迹。</div>');

      el.panel.insertBefore(box, el.body);
      placePanel();

      box.querySelector('#agHistClose').addEventListener('click', function () { box.remove(); });
      box.querySelector('#agHistClear').addEventListener('click', function () {
        try { localStorage.removeItem('dj.agent.history'); } catch (e) {}
        box.remove();
      });
      Array.prototype.forEach.call(box.querySelectorAll('.ah-row'), function (row) {
        row.addEventListener('click', function () {
          var idx = Number(row.dataset.i);
          var item = hs.slice(-8).reverse()[idx];
          if (!item) { return; }
          if (el.ask) { el.ask.value = '再讲讲：' + (item.title || ''); el.ask.focus(); }
          box.remove();
        });
      });
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (!st.open) { openPanel(false); }
        setTimeout(function () { if (el.ask) { el.ask.focus(); } }, 60);
      }
    });

    $('#agSaveEp').addEventListener('click', function () {
      var v = String(el.ep.value || '').trim();
      if (!v) { return; }
      EP = v;
      EPS = [v].concat(EPS.filter(function (u) { return u !== v; }));
      localStorage.setItem(EP_KEY, v);
      ping();
    });
  }

  /* ───────── 取当前题目 ───────── */
  function currentInput() {
    var q = $('#qInput'), a = $('#aInput');
    var question = q ? q.value.trim() : '';
    var work = a ? a.value.trim() : '';
    return { question: question, work: work };
  }

  function ctx() {
    var DJ = root.DJ, P = root.Paper;
    var c = (DJ && DJ.context) ? DJ.context() : { view: 'diagnose' };
    if (c.view === 'paper' && P && P.context) {
      var pc = P.context();
      var q = pc && pc.question;
      if (q) { return { view: 'paper', kind: '题', desc: pc.year + ' 年第 ' + q.no + ' 题', text: q.stem, nodeId: q.nodeId || null }; }
      return { view: 'paper', kind: '卷', desc: (pc ? pc.year + ' 年卷' : '试卷'), text: '', nodeId: null };
    }
    if (c.nodeId) {
      return { view: c.view, kind: '知识点', desc: (c.code ? c.code + ' ' : '') + c.label, text: '', nodeId: c.nodeId };
    }
    return { view: c.view || 'diagnose', kind: '题', desc: '诊断页', text: '', nodeId: null };
  }

  function refreshCtx() {
    var c = ctx();
    if (el.ctx) { el.ctx.textContent = '当前：' + c.desc + (c.kind === '知识点' ? '（知识点）' : ''); }
    var run = $('#agRun');
    var R = ROLE[st.role] || ROLE.diag;
    if (run) {
      run.textContent = st.role === 'diag'
        ? (c.kind === '知识点' ? '讲这个知识点' : (c.view === 'paper' ? '讲这道题' : '诊断这道题'))
        : R.btn;
    }
    var tip = document.querySelector('.ag-tip');
    if (tip) { tip.textContent = R.tip; }
    var stBtn = $('#agStream');
    if (stBtn) { stBtn.hidden = !R.stream; }
  }

  function setRole(role) {
    st.role = ROLE[role] ? role : 'diag';
    Array.prototype.forEach.call(document.querySelectorAll('.ag-role'), function (b) {
      b.classList.toggle('on', b.dataset.role === st.role);
    });
    refreshCtx();
    if (st.role === 'plan') { el.out.innerHTML = ''; }
    if (st.role === 'grade') { el.out.innerHTML = ''; }
    if (st.role === 'diag') { el.out.innerHTML = ''; }
  }

  function candidatesOf(text) {
    var D = data();
    if (!D || !D.recallCandidates) { return []; }
    return D.recallCandidates(text, 10).map(function (id) {
      var n = D.NODE_MAP[id];
      return { id: id, label: n.label, code: n.code, level: n.level, prereq: n.prereq || '' };
    });
  }

  /* ───────── 后端连通性 ───────── */
  function ping() {
    el.dot.className = 'ag-dot';
    el.dot.title = '正在检测后端…';
    if (STATIC_HOST && !localStorage.getItem(EP_KEY)) {
      st.online = false;
      el.dot.className = 'ag-dot nokey';
      el.dot.title = '静态托管：AI 助教走内置引擎（无后端）';
      if (el.ctx) { el.ctx.title = '在线体验版：诊断/讲解由本地引擎生成，不调用外部模型'; }
      return;
    }
    var i = 0;
    function tryNext() {
      if (i >= EPS.length) {
        st.online = false;
        el.dot.className = 'ag-dot off';
        el.dot.title = '后端未启动。先 node server.js，或 cd web && npm run dev';
        return;
      }
      var url = EPS[i++];
      var ctl = new AbortController();
      var t = setTimeout(function () { ctl.abort(); }, 1800);
      fetch(url, { method: 'GET', signal: ctl.signal })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          clearTimeout(t);
          if (!j || !j.ok) { throw new Error('bad'); }
          EP = url;
          if (el.ep) { el.ep.value = url; }
          st.online = true;
          el.dot.className = 'ag-dot ' + (j.mode === 'live' ? 'live' : 'nokey');
          if (el.ctx) {
            el.ctx.title = j.mode === 'live'
              ? ('已配置密钥 ' + (j.masked || '') + ' · ' + (j.model || '') + ' · ' + (j.host || ''))
              : '后端在线但没有密钥：当前走本地引擎';
          }
          el.dot.title = j.mode === 'live'
            ? ('在线 · ' + j.model + (j.runtime ? ' · ' + j.runtime : ''))
            : '后端在，但没配模型 key（会返回占位诊断）';
        })
        .catch(function () { clearTimeout(t); tryNext(); });
    }
    tryNext();
  }

  function closePanel() { st.open = false; if (el.panel) { el.panel.hidden = true; } }

  function doAct(btn, act) {
    var DJ = root.DJ;
    if (act === 'map') {
      if (DJ && DJ.openNode && st.nodeId) { DJ.openNode(st.nodeId); closePanel(); }
      return;
    }
    if (act === 'book') {
      if (DJ && DJ.addWrong && st.nodeId) {
        DJ.addWrong(st.nodeId, st.errorType || '概念混淆');
        btn.textContent = '已记入错题本 ✓';
        btn.disabled = true;
      }
      return;
    }
    if (act === 'drill') { if (DJ && DJ.go) { DJ.go('drill'); closePanel(); } return; }
    if (act === 'paper') { if (DJ && DJ.go) { DJ.go('paper'); closePanel(); } return; }
  }

  /* ───────── 角色：规划（纯算法） ───────── */
  function runPlan() {
    var P = root.Planner;
    if (!P || !P.compute) { el.out.innerHTML = '<div class="ag-err">规划模块没加载（planner.js）。</div>'; return; }
    var r = P.compute();
    if (!r || !r.steps || !r.steps.length) {
      el.out.innerHTML = '<div class="ag-card"><p class="ag-diag">现在还没有待修复的知识点：先诊断一道题，或刷题答错一道。</p>' +
        '<div class="ag-acts"><button class="btn btn-ghost btn-sm" data-act="book" type="button">去错题本</button></div></div>';
      return;
    }
    el.out.innerHTML = '<div class="ag-card">' +
      '<div class="ag-line"><b class="ag-node">' + r.pending + ' 个断点</b>' +
        '<span class="ag-errtype">收敛成 ' + r.steps.length + ' 步</span>' +
        '<span class="ag-src">纯算法 · 不经模型</span></div>' +
      r.steps.map(function (s) {
        return '<div class="ag-planstep">' +
          '<div class="ag-ps-no">' + s.order + '</div>' +
          '<div class="ag-ps-main">' +
            '<div class="ag-ps-t"><b>' + esc(s.code + ' ' + s.label) + '</b>' +
              '<span>' + (typeof s.mastery === 'number' ? s.mastery : '—') + '% · 证据 ' + s.evOk + '/' + s.evN + '</span></div>' +
            '<div class="ag-ps-w">' + esc(s.why) + '</div>' +
            '<div class="ag-ps-a">' +
              '<button class="ag-mini" data-plan="map" data-id="' + esc(s.id) + '" type="button">地图</button>' +
              '<button class="ag-mini" data-plan="teach" data-id="' + esc(s.id) + '" type="button">看课</button>' +
              '<button class="ag-mini" data-plan="ask" data-id="' + esc(s.id) + '" type="button">讲一下</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
      '<div class="ag-acts"><button class="btn btn-primary btn-sm" data-act="book" type="button">去错题本看完整路线</button></div>' +
    '</div>';
  }

  /* ───────── 角色：阅卷（得分点） ───────── */
  function runGrade() {
    var P = root.Paper;
    var pc = (P && P.context) ? P.context() : null;
    var q = pc && pc.question;
    if (!q) {
      el.out.innerHTML = '<div class="ag-card"><p class="ag-diag">先去「试卷」点开一道大题，我再按它的得分点陪你过一遍。</p>' +
        '<div class="ag-acts"><button class="btn btn-primary btn-sm" data-act="paper" type="button">去试卷</button></div></div>';
      return;
    }
    var paper = (root.PAPERS || []).filter(function (p) { return p.year === pc.year; })[0];
    var big = (paper && paper.big) ? paper.big.filter(function (x) { return x.no === q.no; })[0] : null;
    var pts = (big && big.steps) ? big.steps : [];
    var per = pts.length && big ? (big.score / pts.length) : 0;

    el.out.innerHTML = '<div class="ag-card">' +
      '<div class="ag-line"><b class="ag-node">' + pc.year + ' 年第 ' + q.no + ' 题</b>' +
        '<span class="ag-errtype">满分 ' + (big ? big.score : q.score) + ' 分</span>' +
        '<span class="ag-src">按标准解法拆点</span></div>' +
      '<p class="ag-diag">' + esc(big ? big.stem : q.stem) + '</p>' +
      (pts.length
        ? '<div class="ag-next"><b>得分点（每点 ' + (Math.round(per * 10) / 10) + ' 分）</b><ol class="ag-steps">' +
            pts.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>'
        : '<div class="ag-err">这道题还没拆出得分点。</div>') +
      (big && big.answer ? '<div class="ag-meta">参考答案：' + esc(big.answer) + '</div>' : '') +
      '<div class="ag-acts">' +
        '<button class="btn btn-primary btn-sm" data-act="paper" type="button">去试卷按点打分</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="gradeAsk" type="button">问：哪步最容易丢分</button>' +
      '</div>' +
    '</div>';
  }

  /* ───────── 主流程 ───────── */
  function run(mode) {
    if (st.busy) { return; }
    var c = ctx();
    var input = currentInput();
    if (!input.question && c.view === 'paper' && c.text) { input.question = c.text; }
    if (!input.question && c.nodeId) {
      /* 没有题目但站在某个知识点上：改成"讲这个知识点" */
      var D = data();
      var n = D && D.NODE_MAP[c.nodeId];
      var ask = '请讲一下「' + (n ? n.label : c.nodeId) + '」这个知识点：它是什么、最典型的用法、最常见的错误各是什么，分点讲清楚。';
      return askQuestion(ask, [c.nodeId]);
    }
    if (!input.question) {
      el.out.innerHTML = '<div class="ag-err">先在左边把题目贴进来，或者在地图/试卷里选中一道题再点我。</div>';
      return;
    }
    st.busy = true;
    var cands = candidatesOf(input.question + ' ' + input.work);
    var payload = {
      mode: mode,
      question: input.question,
      work: input.work,
      candidates: cands
    };

    if (mode === 'stream') {
      el.out.innerHTML = '<div class="ag-loading">正在组织讲解…</div><pre class="ag-pre" id="agPre"></pre>';
      var pre = $('#agPre');
      var preCtl = new AbortController();
      fetch(EP, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: preCtl.signal
      }).then(function (res) {
        if (!res.ok || !res.body) { throw new Error('HTTP ' + res.status); }
        var reader = res.body.getReader();
        var dec = new TextDecoder();
        var acc = '';
        (function pump() {
          reader.read().then(function (x) {
            if (x.done) {
              st.busy = false;
              var s = acc.trim();
              if (s.charAt(0) === '{') {
                try {
                  var j = JSON.parse(s);
                  if (j && j.ok && j.data) { render(j, cands, input); return; }
                } catch (e) { /* 不是 JSON，按文本处理 */ }
              }
              if (!s) { el.out.innerHTML = '<div class="ag-err">后端返回了空内容。</div>'; }
              return;
            }
            acc += dec.decode(x.value, { stream: true });
            pre.textContent = acc;
            pre.scrollTop = pre.scrollHeight;
            pump();
          });
        })();
      }).catch(function () {
        st.busy = false;
        el.out.innerHTML = localFallback(input, cands, '后端没连上');
      });
      return;
    }

    var runBtn = $('#agRun');
    if (runBtn) { runBtn.disabled = true; runBtn.dataset.txt = runBtn.textContent; runBtn.textContent = '诊断中…'; }
    el.out.innerHTML = '<div class="ag-loading">正在诊断（候选 ' + cands.length + ' 个）…</div>';
    fetch(EP, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (j) {
      st.busy = false;
      if (runBtn) { runBtn.disabled = false; runBtn.textContent = runBtn.dataset.txt || '诊断这道题'; }
      if (!j || !j.ok || !j.data) {
        el.out.innerHTML = localFallback(input, cands, (j && j.error) || '返回格式不对');
        return;
      }
      render(j, cands, input);
    }).catch(function () {
      st.busy = false;
      if (runBtn) { runBtn.disabled = false; runBtn.textContent = runBtn.dataset.txt || '诊断这道题'; }
      el.out.innerHTML = localFallback(input, cands, '后端没连上');
      ping();
    });
  }

  /* ───────── 渲染结构化结果 ───────── */
  function render(res, cands, input) {
    var d = res.data;
    var node = data().NODE_MAP[d.nodeId] || null;
    var conf = Math.round((Number(d.confidence) || 0) * 100);
    var hitIdx = cands.findIndex(function (c) { return c.id === d.nodeId; });

    var steps = (d.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    var next = (d.next || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');

    el.out.innerHTML =
      '<div class="ag-card">' +
        '<div class="ag-line"><b class="ag-node">' + esc(d.nodeId || '—') + '</b>' +
          '<span class="ag-errtype">' + esc(d.errorType || '—') + '</span>' +
          '<span class="ag-verdict ' + (d.verdict || 'unclear') + '">' +
            (d.verdict === 'right' ? '答对' : d.verdict === 'wrong' ? '答错' : '待判') + '</span>' +
          '<span class="ag-conf">置信 ' + conf + '%</span>' +
          '<span class="ag-src">' + (res.source === 'no-key' ? '后端无 key（占位）' : '模型') + '</span>' +
        '</div>' +
        '<p class="ag-diag">' + esc(d.diagnosis || '') + '</p>' +
        (node ? '<div class="ag-meta">' + esc(node.book) + ' · ' + esc(node.code) + ' ' + esc(node.label) +
          (node.prereq && data().NODE_MAP[node.prereq] ? ' · 前置 ' + esc(data().NODE_MAP[node.prereq].label) : '') + '</div>' : '') +
        (steps ? '<ol class="ag-steps">' + steps + '</ol>' : '') +
        (d.trap ? '<div class="ag-trap"><b>最容易错</b><span>' + esc(d.trap) + '</span></div>' : '') +
        (next ? '<div class="ag-next"><b>下一步</b><ul>' + next + '</ul></div>' : '') +
        '<div class="ag-cands">候选 ' + cands.length + ' 个' +
          (hitIdx >= 0 ? '，命中第 ' + (hitIdx + 1) + ' 位' : '') + '：' +
          cands.map(function (c, i) {
            return '<span class="' + (c.id === d.nodeId ? 'on' : '') + '">' + esc(c.id) + '</span>';
          }).join('') +
        '</div>' +
        '<div class="ag-acts">' +
          '<button class="btn btn-primary btn-sm" data-act="map" type="button">去地图看断点</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="book" type="button">记进错题本</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="drill" type="button">做同类题</button>' +
          '<button class="btn btn-ghost btn-sm" data-act="paper" type="button">按断点组卷</button>' +
        '</div>' +
      '</div>';

    st.nodeId = d.nodeId || null;
    st.errorType = d.errorType || '概念混淆';
    st.hist = [];

    try {
      var hs = JSON.parse(localStorage.getItem('dj.agent.history') || '[]');
      hs.push({
        t: Date.now(),
        title: (node ? node.code + ' ' + node.label : (d.nodeId || '')) + ' · ' + (d.errorType || ''),
        body: String(d.diagnosis || '').slice(0, 70)
      });
      localStorage.setItem('dj.agent.history', JSON.stringify(hs.slice(-20)));
    } catch (e) {}
  }

  /* ───────── 离线兜底：用本地引擎，不给空白 ───────── */
  function localFallback(input, cands, why) {
    var D = data();
    if (!D) { return '<div class="ag-err">' + esc(why) + '，本地引擎也没加载。</div>'; }
    var d = D.diagnoseLocal(input.question + ' ' + input.work);
    st.nodeId = d.nodeId;
    st.errorType = d.errorType;
    var node = D.NODE_MAP[d.nodeId];
    var intro = D.introFor ? D.introFor(d.nodeId) : null;
    var steps = (intro && intro.pts ? intro.pts : []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    return '<div class="ag-card local">' +
      '<div class="ag-line"><b class="ag-node">' + esc(d.nodeId) + '</b>' +
        '<span class="ag-errtype">' + esc(d.errorType) + '</span>' +
        '<span class="ag-src">本地引擎（' + esc(why) + '）</span></div>' +
      '<p class="ag-diag">' + esc(d.diagnosis) + '</p>' +
      (node ? '<div class="ag-meta">' + esc(node.book) + ' · ' + esc(node.code) + ' ' + esc(node.label) + '</div>' : '') +
      (steps ? '<ol class="ag-steps">' + steps + '</ol>' : '') +
      '<div class="ag-acts">' +
        '<button class="btn btn-primary btn-sm" data-act="map" type="button">去地图看断点</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="book" type="button">记进错题本</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="drill" type="button">做同类题</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="paper" type="button">按断点组卷</button>' +
      '</div>' +
    '</div>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
