/* 洞见 · 试卷模块（广东省普通专升本 · 高等数学）
 * 独立自挂载，不依赖 app.js 的内部状态；只读 window.PAPERS。
 * 两块能力：① 做题（选择题即时判 / 大题看分步）② 组卷打印（跨卷自由加题 → A4 打印版）
 */
(function (root) {
  'use strict';
  var host = document.getElementById('paperApp');
  if (!host || !root.PAPERS) { return; }

  /* 把「题 → 知识点」标签并到题目对象上（标签单独一个文件维护） */
  var TAGS = root.PAPER_TAGS || {};
  root.PAPERS.forEach(function (p) {
    var t = TAGS[p.id];
    if (!t) { return; }
    /* 按「题目在数组里的位置」对齐，而不是按题号 —— 大题题号是 11..15 */
    p.choice.forEach(function (q, i) { q.nodeId = (t.c && t.c[i]) || null; });
    p.big.forEach(function (q, i) { q.nodeId = (t.b && t.b[i]) || null; });
  });

  /* 多解法 + 常见错解：单独一个文件维护，按「卷id:题号」挂上去 */
  var METH = root.PAPER_METHODS || {};
  root.PAPERS.forEach(function (p) {
    p.big.concat(p.choice).forEach(function (q) {
      var m = METH[p.id + ':' + q.no];
      if (m) { q.methods = m.methods; q.wrong = m.wrong; }
    });
  });

  var K = 'dongjian.paper';
  var st = {
    paper: 0,
    mode: 'choice',
    picked: {},                 // "pid:c:no" -> 'A'
    openAnswer: {},             // "pid:b:no" -> true
    sel: {},                    // 选入组卷的题："pid:c:1" -> true
    sent: {},                   // 已推送进错题本的题（防重复）
    temp: {},                   // 多选题的暂选（提交前）
    lastQ: null,                // 当前正在看的题（给 AI 助教做上下文）
    self: {},                   // 大题自评得分（由评分点算出）
    rub: {},                    // 大题评分点勾选情况
    onlySelected: false
  };
  try {
    var saved = JSON.parse(localStorage.getItem(K) || '{}');
    if (saved && typeof saved === 'object') {
      st.picked = saved.picked || {};
      st.sel = saved.sel || {};
      st.sent = saved.sent || {};
      st.self = saved.self || {};
      st.rub = saved.rub || {};
    }
  } catch (e) {}

  function save() {
    try { localStorage.setItem(K, JSON.stringify({ picked: st.picked, sel: st.sel, sent: st.sent, self: st.self, rub: st.rub })); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function keyOf(pid, type, no) { return pid + ':' + type + ':' + no; }
  function fmtQ(q, type) {
    return type === 'c' ? (q.no + '. ' + q.stem) : (q.no + '. ' + q.stem + '（' + q.score + ' 分）');
  }

  /* 宝宝式解析：先说你被问什么，再说为什么想到这招，再一步步算，最后点出坑 */
  function babyHtml(b, fallbackSteps) {
    if (!b) { return ''; }
    var steps = (b.steps && b.steps.length) ? b.steps : (fallbackSteps || []);
    return '<div class="baby">' +
      '<div class="baby-row"><i>这题在问</i><span>' + esc(b.ask) + '</span></div>' +
      '<div class="baby-row"><i>怎么想到</i><span>' + esc(b.idea) + '</span></div>' +
      (steps.length ? '<ol class="baby-steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') +
      (b.trap ? '<div class="baby-trap"><b>最容易错</b><span>' + esc(b.trap) + '</span></div>' : '') +
    '</div>';
  }

  /* ───────── 渲染 ───────── */
  function render() {
    var papers = root.PAPERS;
    var p = papers[st.paper] || papers[0];
    var selCount = Object.keys(st.sel).filter(function (k) { return st.sel[k]; }).length;

    var listHtml = papers.map(function (x, i) {
      return '<button class="pp-item' + (i === st.paper ? ' on' : '') + '" data-i="' + i + '" type="button">' +
        '<span class="pp-year">' + x.year + '</span>' +
        '<span class="pp-name">' + esc(x.subject) + '</span>' +
        '<em>' + esc(x.region) + ' · ' + x.choice.length + ' 选择 + ' + x.big.length + ' 大题</em>' +
      '</button>';
    }).join('');

    var qHtml = '';
    if (st.mode === 'choice') {
      qHtml = p.choice.map(function (q, i) {
        var k = keyOf(p.id, 'c', q.no);
        var picked = st.picked[k];
        var done = !!picked;
        var ok = done && picked === q.answer;
        var opts = q.options.map(function (o) {
          var cls = 'popt';
          if (done && o.k === q.answer) { cls += ' correct'; }
          if (done && o.k === picked && picked !== q.answer) { cls += ' wrong'; }
          return '<button class="' + cls + '" data-no="' + q.no + '" data-k="' + o.k + '" type="button"' + (done ? ' disabled' : '') + '>' +
            '<i>' + o.k + '</i><span>' + esc(o.t) + '</span></button>';
        }).join('');
        return '<article class="pq" id="' + p.id + '-c' + q.no + '">' +
          '<div class="pq-head"><span class="pq-no">' + q.no + '</span><span class="pq-score">' + q.score + ' 分</span>' +
            (q.nodeId ? '<span class="pq-node">' + esc(q.nodeId) + '</span>' : '') +
            '<label class="pq-pick"><input type="checkbox" data-pick="' + k + '"' + (st.sel[k] ? ' checked' : '') + '> 加题</label>' +
          '</div>' +
          '<p class="pq-stem">' + esc(q.stem) + '</p>' +
          '<div class="popt-row">' + opts + '</div>' +
          (done ? '<div class="pq-exp ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? '✓ 答对' : '✕ 答错，正确答案是 ' + q.answer) + '</b></div>' +
          babyHtml(q.baby) +
          (!q.baby && q.explain ? '<p class="pq-old">' + esc(q.explain) + '</p>' : '') : '') +
        '</article>';
      }).join('') + renderTyped(p, 'multi');
    } else if (st.mode === 'fill' || st.mode === 'judge') {
      qHtml = renderTyped(p, st.mode);
    } else {
      qHtml = p.big.map(function (q) {
        var k = keyOf(p.id, 'b', q.no);
        var open = !!st.openAnswer[k];
        return '<article class="pq">' +
          '<div class="pq-head"><span class="pq-no">' + q.no + '</span><span class="pq-score">' + q.score + ' 分</span>' +
            (q.nodeId ? '<span class="pq-node">' + esc(q.nodeId) + '</span>' : '') +
            '<label class="pq-pick"><input type="checkbox" data-pick="' + k + '"' + (st.sel[k] ? ' checked' : '') + '> 加题</label>' +
          '</div>' +
          '<p class="pq-stem">' + esc(q.stem) + '</p>' +
          (function () {
            var pts = (q.steps && q.steps.length) ? q.steps : [];
            var per = pts.length ? q.score / pts.length : q.score;
            var chosen = st.rub[k] || {};
            var got = 0;
            pts.forEach(function (_, i) { if (chosen[i]) { got += per; } });
            got = Math.min(q.score, Math.round(got));
            return '<div class="self">' +
              '<div class="self-head">按得分点自评：做到哪几步就勾哪几步<em>（每步 ' +
                (Math.round(per * 10) / 10) + ' 分，勾选后自动算分；≥60% 记一次正确证据，&lt;40% 进错题本）</em></div>' +
              '<div class="rubric">' + (pts.length
                ? pts.map(function (s, i) {
                    return '<label class="rub-row"><input type="checkbox" data-rub="' + k + '" data-i="' + i + '"' +
                      (chosen[i] ? ' checked' : '') + ' /><span>' + esc(s) + '</span></label>';
                  }).join('')
                : '<div class="rub-empty">这道题还没拆出得分点，先看下面的完整解答。</div>') + '</div>' +
              '<div class="self-row"><b class="self-num" data-selfnum="' + k + '">' + got + '</b>' +
                '<span class="self-max">/ ' + q.score + ' 分</span>' +
                '<button class="ag-mini" data-selfq="' + k + '" data-v="' + q.score + '" type="button">全勾</button>' +
                '<button class="ag-mini" data-selfq="' + k + '" data-v="0" type="button">全清</button>' +
              '</div>' +
            '</div>';
          })() +
          '<button class="btn btn-ghost btn-sm pq-toggle" data-open="' + k + '" type="button">' + (open ? '收起答案' : '先自己做，再看答案') + '</button>' +
          (open ? '<div class="pq-answer"><div class="pa-ans"><b>答案：</b>' + esc(q.answer) + '</div>' +
            (q.methods && q.methods.length
              ? q.methods.map(function (m, mi) {
                  return '<details class="pm" ' + (mi === 0 ? 'open' : '') + '>' +
                    '<summary>' + esc(m.name) + '</summary>' +
                    '<ol class="pa-steps">' + (m.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
                  '</details>';
                }).join('')
              : '<ol class="pa-steps">' + (q.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>') +
            (q.wrong && q.wrong.length
              ? '<div class="pw"><b>常见错解</b>' + q.wrong.map(function (w) {
                  return '<div class="pw-row"><span class="pw-ans">' + esc(w.ans) + '</span><span class="pw-why">' + esc(w.why) + '</span></div>';
                }).join('') + '</div>'
              : '') +
            babyHtml(q.baby) + '</div>' : '') +
        '</article>';
      }).join('');
    }

    host.innerHTML =
      '<div class="paper-layout">' +
        '<aside class="paper-side">' +
          '<div class="ps-title">广东省普通专升本<em>近两年示例卷</em></div>' +
          '<div class="pp-list">' + listHtml + '</div>' +
          '<div class="ps-note">真题替换：改 <code>papers.js</code> 里的 source 与题目即可，界面不用动。</div>' +
        '</aside>' +
        '<div class="paper-main">' +
          '<div class="paper-head">' +
            '<div class="ph-info"><h2>' + esc(p.title) + '</h2>' +
              '<p class="ph-src">' + esc(p.source) + ' · 满分 ' + p.total + ' · ' + p.minutes + ' 分钟</p>' +
              '<p class="ph-stat">共 ' + papers.length + ' 套卷 · ' +
                papers.reduce(function (a, x) { return a + x.choice.length + x.big.length; }, 0) + ' 道题 · ' +
                papers.map(function (x) { return x.year; }).join(' / ') + '</p></div>' +
            '<div class="ph-tools">' +
              '<span class="ph-sel">已选 <b id="selCount">' + selCount + '</b> 题</span>' +
              '<button class="btn btn-ghost btn-sm" id="pickPending" type="button">按断点抽题</button>' +
              '<button class="btn btn-ghost btn-sm" id="paperClear" type="button">清空勾选</button>' +
              '<button class="btn btn-ghost btn-sm" id="paperReset" type="button">重置作答</button>' +
              '<button class="btn btn-primary btn-sm" id="paperPrintSel" type="button">组卷打印</button>' +
              '<button class="btn btn-text btn-sm" id="paperPrintAll" type="button">整卷打印</button>' +
            '</div>' +
          '</div>' +
          '<div class="paper-tabs">' +
            '<button class="ptab' + (st.mode === 'choice' ? ' on' : '') + '" data-m="choice" type="button">选择题 · ' + (p.choice.length + countType(p, 'multi')) + '</button>' +
            '<button class="ptab' + (st.mode === 'fill' ? ' on' : '') + '" data-m="fill" type="button">填空题 · ' + countType(p, 'fill') + '</button>' +
            '<button class="ptab' + (st.mode === 'judge' ? ' on' : '') + '" data-m="judge" type="button">判断题 · ' + countType(p, 'judge') + '</button>' +
            '<button class="ptab' + (st.mode === 'big' ? ' on' : '') + '" data-m="big" type="button">大题 · ' + p.big.length + '</button>' +
            (st.mode === 'choice' ? '<button class="btn btn-primary btn-sm" id="paperSubmit" type="button">交卷判分</button>' : '') +
            '<span class="ptab-hint">勾选右上角「加题」即可跨卷组卷；错题交卷后自动进错题本</span>' +
          '</div>' +
          '<div id="paperScore"></div>' +
          '<div class="paper-list">' + qHtml + '</div>' +
        '</div>' +
      '</div>';

    bind();
  }

  /* ───────── 打印文档 ───────── */
  function buildDoc(title, items) {
    var papers = root.PAPERS;
    var byPaper = {};
    items.forEach(function (it) {
      var p = papers.filter(function (x) { return x.id === it.pid; })[0];
      if (!p) { return; }
      var s = null;
      if (it.type === 'c') { s = p.choice.filter(function (q) { return q.no === it.no; })[0]; }
      else if (it.type === 'b') { s = p.big.filter(function (q) { return q.no === it.no; })[0]; }
      else { s = (p.objective || []).filter(function (q) { return q.no === it.no; })[0]; }
      if (!s) { return; }
      (byPaper[it.pid] = byPaper[it.pid] || []).push({ type: it.type, q: s, paper: p });
    });

    var n = 0, totalScore = 0;
    var choiceHtml = '', multiHtml = '', fillHtml = '', judgeHtml = '', bigHtml = '', answerHtml = '';
    Object.keys(byPaper).forEach(function (pid) {
      var arr = byPaper[pid];
      arr.sort(function (a, b) { return a.type === b.type ? a.q.no - b.q.no : (a.type === 'c' ? -1 : 1); });
      arr.forEach(function (it) {
        n++;
        totalScore += it.q.score || 0;
        if (it.type === 'c') {
          choiceHtml += '<div class="q"><p>' + n + '．' + esc(it.q.stem) + '（' + it.q.score + ' 分）</p>' +
            '<div class="opts">' + it.q.options.map(function (o) {
              return '<span class="opt">' + o.k + '．' + esc(o.t) + '</span>';
            }).join('') + '</div></div>';
          answerHtml += '<li><b>' + n + '．' + it.q.answer + '</b>　' + esc(it.q.explain || '') + '</li>';
        } else if (it.type === 'b') {
          bigHtml += '<div class="q"><p>' + n + '．' + esc(it.q.stem) + '（' + it.q.score + ' 分）</p>' +
            '<div class="blank"></div><div class="blank"></div><div class="blank"></div></div>';
          answerHtml += '<li><b>' + n + '．</b>' + esc(it.q.answer) + '<ol class="steps">' +
            (it.q.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></li>';
        } else if (it.type === 'f') {
          fillHtml += '<div class="q"><p>' + n + '．' + esc(it.q.stem) + '（' + it.q.score + ' 分）</p></div>';
          answerHtml += '<li><b>' + n + '．</b>' + esc(it.q.answer) + '</li>';
        } else if (it.type === 'j') {
          judgeHtml += '<div class="q"><p>' + n + '．' + esc(it.q.stem) + '（　　）（' + it.q.score + ' 分）</p></div>';
          answerHtml += '<li><b>' + n + '．' + (it.q.answer === 'T' ? '正确' : '错误') + '</b></li>';
        } else {
          multiHtml += '<div class="q"><p>' + n + '．（多选）' + esc(it.q.stem) + '（' + it.q.score + ' 分）</p>' +
            '<div class="opts">' + it.q.options.map(function (o) { return '<span class="opt">' + o.k + '．' + esc(o.t) + '</span>'; }).join('') + '</div></div>';
          answerHtml += '<li><b>' + n + '．' + esc(it.q.answer) + '</b></li>';
        }
      });
    });

    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' +
      '@page{size:A4;margin:18mm 16mm}' +
      'body{font:14px/1.9 "Songti SC","SimSun",serif;color:#111;margin:0}' +
      'h1{font-size:20px;text-align:center;margin:0 0 4px}' +
      '.sub{text-align:center;font-size:12px;color:#555;margin-bottom:10px}' +
      '.meta{display:flex;justify-content:space-between;font-size:12.5px;border-bottom:1.5px solid #111;padding-bottom:6px;margin-bottom:14px}' +
      '.sec{font-size:14px;font-weight:700;margin:16px 0 8px}' +
      '.q{margin:0 0 14px;page-break-inside:avoid}' +
      '.q p{margin:0 0 4px}' +
      '.opts{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13.5px}' +
      '.blank{border-bottom:1px dotted #999;height:26px}' +
      '.answers{page-break-before:always}' +
      '.answers h2{font-size:16px;margin:0 0 8px;border-bottom:1px solid #111;padding-bottom:4px}' +
      '.answers li{margin:0 0 8px}' +
      '.steps{margin:4px 0 0 18px;padding:0}' +
      '@media print{.noprint{display:none}}' +
      '</style></head><body>' +
      '<h1>' + esc(title) + '</h1>' +
      '<div class="sub">广东省普通高校专升本 · 高等数学（组卷练习卷）</div>' +
      '<div class="meta"><span>姓名：____________</span><span>准考证号：________________</span><span>日期：____________</span></div>' +
      '<div class="meta"><span>题量：' + n + ' 题</span><span>总分：' + totalScore + ' 分</span><span>建议用时：' + Math.max(30, n * 6) + ' 分钟</span></div>' +
      (choiceHtml ? '<div class="sec">一、单项选择题</div>' + choiceHtml : '') +
      (multiHtml ? '<div class="sec">二、多项选择题</div>' + multiHtml : '') +
      (fillHtml ? '<div class="sec">三、填空题</div>' + fillHtml : '') +
      (judgeHtml ? '<div class="sec">四、判断题</div>' + judgeHtml : '') +
      (bigHtml ? '<div class="sec">五、解答题</div>' + bigHtml : '') +
      '<div class="answers"><h2>参考答案与解析（另页，便于对折）</h2><ol>' + answerHtml + '</ol></div>' +
      '<p class="noprint" style="margin-top:18px;color:#888;font-size:12px">若未自动弹出打印框，按 Ctrl+P 打印；建议勾选「背景图形」为关、纸张 A4。</p>' +
      '</body></html>';
  }

  function openPrint(title, items) {
    if (!items.length) { alert('还没有勾选题目：先点每题右上角的「加题」。'); return; }
    var html = buildDoc(title, items);
    var w = window.open('', '_blank');
    if (!w) { alert('浏览器拦截了弹窗，请允许本站弹窗后重试。'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 350);
  }

  function collectSelected() {
    var out = [];
    Object.keys(st.sel).forEach(function (k) {
      if (!st.sel[k]) { return; }
      var parts = k.split(':');
      out.push({ pid: parts[0], type: parts[1], no: Number(parts[2]) });
    });
    return out;
  }
  function collectPaper(p) {
    var out = [];
    p.choice.forEach(function (q) { out.push({ pid: p.id, type: 'c', no: q.no }); });
    (p.objective || []).forEach(function (q) {
      out.push({ pid: p.id, type: LETTER[q.type], no: q.no });
    });
    p.big.forEach(function (q) { out.push({ pid: p.id, type: 'b', no: q.no }); });
    return out;
  }

  /* ───────── 题型：填空 / 判断 / 多选 ───────── */
  function countType(p, type) {
    return (p.objective || []).filter(function (q) { return q.type === type; }).length;
  }
  var LETTER = { fill: 'f', judge: 'j', multi: 'm' };
  function normFill(v) {
    return String(v == null ? '' : v).replace(/\s+/g, '').replace(/×/g, '*').replace(/＋/g, '+').toLowerCase();
  }
  function fillRight(got, accept) {
    var g = normFill(got);
    return (accept || []).some(function (a) { return normFill(a) === g; });
  }

  function renderTyped(p, type) {
    var list = (p.objective || []).filter(function (q) { return q.type === type; });
    return list.map(function (q) {
      var k = keyOf(p.id, LETTER[type], q.no);
      var got = st.picked[k];
      var done = got !== undefined;
      var right = false;
      if (done) { right = type === 'fill' ? fillRight(got, q.accept) : got === q.answer; }

      var body = '';
      if (type === 'fill') {
        body = '<div class="fill-row">' +
          '<input class="fill-input" data-fill="' + k + '" value="' + (done ? esc(got) : '') + '"' +
            (done ? ' disabled' : '') + ' placeholder="把答案填在这里，回车确认" />' +
          (done ? '' : '<button class="btn btn-primary btn-sm" data-fillok="' + k + '" type="button">确认</button>') +
        '</div>';
        if (done) { body += '<div class="fill-ans">标准答案：<b>' + esc(q.answer) + '</b></div>'; }
      } else if (type === 'judge') {
        body = '<div class="judge-row">' +
          ['T', 'F'].map(function (v) {
            var cls = 'jbtn';
            if (done && got === v) { cls += v === q.answer ? ' correct' : ' wrong'; }
            if (done && v === q.answer) { cls += ' correct'; }
            return '<button class="' + cls + '" data-judge="' + k + '" data-v="' + v + '" type="button"' +
              (done ? ' disabled' : '') + '>' + (v === 'T' ? '✓ 正确' : '✕ 错误') + '</button>';
          }).join('') + '</div>';
      } else {
        var sel = (st.temp[k] || '');
        body = '<div class="popt-row">' + q.options.map(function (o) {
          var picked = done ? got.indexOf(o.k) >= 0 : sel.indexOf(o.k) >= 0;
          var cls = 'popt' + (picked ? ' sel' : '');
          if (done && q.answer.indexOf(o.k) >= 0) { cls += ' correct'; }
          if (done && picked && q.answer.indexOf(o.k) < 0) { cls += ' wrong'; }
          return '<button class="' + cls + '" data-multi="' + k + '" data-k="' + o.k + '" type="button"' +
            (done ? ' disabled' : '') + '><i>' + o.k + '</i><span>' + esc(o.t) + '</span></button>';
        }).join('') + '</div>' +
        (done ? '' : '<button class="btn btn-primary btn-sm multi-ok" data-multiok="' + k + '" type="button">提交本题</button>') +
        '<span class="multi-hint">多选题：选完全部再提交</span>';
      }

      return '<article class="pq">' +
        '<div class="pq-head">' +
          '<span class="pq-no">' + q.no + '</span>' +
          '<span class="pq-score">' + q.score + ' 分</span>' +
          (q.nodeId ? '<span class="pq-node">' + esc(q.nodeId) + '</span>' : '') +
          '<span class="pq-type">' + ({ fill: '填空题', judge: '判断题', multi: '多选题' })[type] + '</span>' +
          '<label class="pq-pick"><input type="checkbox" data-pick="' + k + '"' + (st.sel[k] ? ' checked' : '') + '> 加题</label>' +
        '</div>' +
        '<p class="pq-stem">' + esc(q.stem) + '</p>' +
        body +
        (done ? '<div class="pq-exp ' + (right ? 'ok' : 'no') + '"><b>' + (right ? '✓ 答对' : '✕ 答错，正确答案 ' + q.answer) + '</b></div>' + babyHtml(q.baby) : '') +
      '</article>';
    }).join('') || '<div class="teach-empty">这套卷暂时没有这种题。</div>';
  }

  /* ───────── 交卷判分 ───────── */
  function submitChoice() {
    var p = root.PAPERS[st.paper];
    var items = [];
    p.choice.forEach(function (q) { items.push({ q: q, k: keyOf(p.id, 'c', q.no), type: 'c' }); });
    (p.objective || []).forEach(function (q) {
      items.push({ q: q, k: keyOf(p.id, LETTER[q.type], q.no), type: LETTER[q.type] });
    });
    p.big.forEach(function (q) { items.push({ q: q, k: keyOf(p.id, 'b', q.no), type: 'b' }); });

    var answered = 0;
    items.forEach(function (it) {
      if (st.picked[it.k] !== undefined) { answered++; }
      else if (it.type === 'b' && st.self[it.k] > 0) { answered++; }
    });
    if (!answered) { alert('还没作答：先做题（大题可用自评打分），再来交卷。'); return; }

    var got = 0, total = 0, rows = [];
    items.forEach(function (it) {
      var q = it.q;
      total += q.score;
      var a = st.picked[it.k];
      var gained = 0, right = false;
      if (it.type === 'b') {
        gained = Math.max(0, Math.min(q.score, Number(st.self[it.k]) || 0));
        right = gained >= q.score * 0.6;
        rows.push({ q: q, a: null, right: right, key: it.k, type: 'b', gained: gained });
      } else {
        if (a !== undefined) {
          right = it.type === 'f' ? fillRight(a, q.accept) : a === q.answer;
        }
        gained = right ? q.score : 0;
        rows.push({ q: q, a: a, right: right, key: it.k, type: it.type, gained: gained });
      }
      got += gained;
    });

    var sent = 0, okEv = 0;
    rows.forEach(function (r) {
      if (!r.q.nodeId || !root.DJ) { return; }
      var k2 = r.key;
      if (st.sent[k2]) { return; }
      if (r.type === 'b') {
        if (r.gained >= r.q.score * 0.6) {
          st.sent[k2] = 1;
          if (root.DJ.addEvidence(r.q.nodeId, true)) { okEv++; }
        } else if (r.gained < r.q.score * 0.4) {
          st.sent[k2] = 1;
          if (root.DJ.addWrong(r.q.nodeId, '推演跳步')) { sent++; }
        }
        return;
      }
      if (r.right) {
        st.sent[k2] = 1;
        if (root.DJ.addEvidence(r.q.nodeId, true)) { okEv++; }
        return;
      }
      if (r.a === undefined) { return; }
      st.sent[k2] = 1;
      if (root.DJ.addWrong(r.q.nodeId, '概念混淆')) { sent++; }
    });
    save();

    var rightCount = rows.filter(function (r) { return r.right; }).length;
    var html = '<div class="score-card">' +
      '<div class="sc-head"><b>成绩单</b><span>' + p.year + ' 年 · 客观题 + 大题自评 合计 ' + total + ' 分</span></div>' +
      '<div class="sc-num"><strong>' + got + '</strong><em>/ ' + total + ' 分</em>' +
        '<span>正确 ' + rightCount + ' / ' + rows.length + '</span>' +
        (sent ? '<span class="sc-sent">已把 ' + sent + ' 道错题写进错题本</span>' : '') +
        (okEv ? '<span class="sc-ok">已记入 ' + okEv + ' 条正确证据</span>' : '') + '</div>' +
      '<div class="sc-rows">' +
        rows.map(function (r) {
          return '<div class="sc-row ' + (r.right ? 'ok' : 'no') + '">' +
            '<span class="sc-no">' + r.q.no + '</span>' +
            '<span class="sc-you">' + (r.type === 'b' ? ('自评 ' + r.gained) : ('你 ' + (r.a || '—'))) + '</span>' +
            '<span class="sc-ans">' + (r.type === 'b' ? ('满分 ' + r.q.score) : ('正确 ' + r.q.answer)) + '</span>' +
            '<span class="sc-node">' + (r.q.nodeId || '—') + '</span>' +
            '<span class="sc-mark">' + (r.right ? '✓' : '✕') + '</span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="sc-foot">错题已计入该知识点的「证据」；攒够 2 次正确才会判定愈合。</div>' +
    '</div>';
    var box = document.getElementById('paperScore');
    if (box) { box.innerHTML = html; }
  }

  /* ───────── 按断点抽题 ───────── */
  function pickPending() {
    var pend = (root.DJ && root.DJ.pendingNodes) ? root.DJ.pendingNodes() : [];
    if (!pend.length) {
      alert('错题本里还没有「待修复」的知识点。先诊断一道题、或刷题答错一道，再回来抽题。');
      return;
    }
    var set = {};
    pend.forEach(function (id) { set[id] = 1; });
    var n = 0;
    root.PAPERS.forEach(function (p) {
      p.choice.forEach(function (q) { if (q.nodeId && set[q.nodeId]) { st.sel[keyOf(p.id, 'c', q.no)] = true; n++; } });
      (p.objective || []).forEach(function (q) {
        if (q.nodeId && set[q.nodeId]) { st.sel[keyOf(p.id, LETTER[q.type], q.no)] = true; n++; }
      });
      p.big.forEach(function (q) { if (q.nodeId && set[q.nodeId]) { st.sel[keyOf(p.id, 'b', q.no)] = true; n++; } });
    });
    save();
    render();
    alert('你的待修复知识点共 ' + pend.length + ' 个，已为你选中 ' + n + ' 道相关题目，可直接「组卷打印」。');
  }

  /* ───────── 交互 ───────── */
  function bind() {
    Array.prototype.forEach.call(host.querySelectorAll('.pp-item'), function (b) {
      b.addEventListener('click', function () { st.paper = Number(b.dataset.i) || 0; render(); });
    });
    Array.prototype.forEach.call(host.querySelectorAll('.ptab'), function (b) {
      b.addEventListener('click', function () { st.mode = b.dataset.m; render(); });
    });
    Array.prototype.forEach.call(host.querySelectorAll('.popt'), function (b) {
      b.addEventListener('click', function () {
        var p = root.PAPERS[st.paper];
        var k = keyOf(p.id, 'c', Number(b.dataset.no));
        if (st.picked[k]) { return; }
        st.picked[k] = b.dataset.k;
        save(); render();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-open]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.open;
        st.openAnswer[k] = !st.openAnswer[k];
        var p = root.PAPERS[st.paper];
        var no = Number(String(k).split(':')[2]);
        var q = (p.big || []).filter(function (x) { return x.no === no; })[0];
        if (q) { st.lastQ = { year: p.year, no: q.no, stem: q.stem, answer: q.answer, score: q.score, nodeId: q.nodeId || null }; }
        render();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('.pq'), function (card) {
      card.addEventListener('click', function () {
        var p = root.PAPERS[st.paper];
        var noEl = card.querySelector('.pq-no');
        if (!noEl) { return; }
        var no = Number(noEl.textContent);
        var all = [].concat(p.choice || [], p.objective || [], p.big || []);
        var q = all.filter(function (x) { return x.no === no; })[0];
        if (q) { st.lastQ = { year: p.year, no: q.no, stem: q.stem, answer: q.answer, score: q.score, nodeId: q.nodeId || null }; }
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-pick]'), function (c) {
      c.addEventListener('change', function () {
        st.sel[c.dataset.pick] = c.checked;
        save();
        var n = collectSelected().length;
        var el = document.getElementById('selCount');
        if (el) { el.textContent = n; }
      });
    });
    var clear = document.getElementById('paperClear');
    if (clear) { clear.addEventListener('click', function () { st.sel = {}; save(); render(); }); }

    var pr = document.getElementById('paperReset');
    if (pr) { pr.addEventListener('click', resetAll); }
    var ps = document.getElementById('paperPrintSel');
    if (ps) { ps.addEventListener('click', function () {
      var items = collectSelected();
      openPrint('洞见 · 自选组卷（' + items.length + ' 题）', items);
    }); }
    var pa = document.getElementById('paperPrintAll');
    if (pa) { pa.addEventListener('click', function () {
      var p = root.PAPERS[st.paper];
      openPrint(p.title, collectPaper(p));
    }); }

    Array.prototype.forEach.call(host.querySelectorAll('[data-fillok]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.fillok;
        var inp = host.querySelector('[data-fill="' + k + '"]');
        var v = inp ? inp.value : '';
        if (!String(v).trim()) { if (inp) { inp.focus(); } return; }
        st.picked[k] = v;
        save(); render();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-fill]'), function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') { return; }
        var b = host.querySelector('[data-fillok="' + inp.dataset.fill + '"]');
        if (b) { b.click(); }
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-judge]'), function (b) {
      b.addEventListener('click', function () {
        st.picked[b.dataset.judge] = b.dataset.v;
        save(); render();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-multi]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.multi, letter = b.dataset.k;
        var cur = st.temp[k] || '';
        st.temp[k] = cur.indexOf(letter) >= 0 ? cur.replace(letter, '') : cur + letter;
        render();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-multiok]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.multiok;
        var v = st.temp[k] || '';
        if (!v) { alert('还没选：先勾选项再提交。'); return; }
        st.picked[k] = v.split('').sort().join('');
        save(); render();
      });
    });

    function recalcRub(k) {
      var p = root.PAPERS[st.paper];
      var no = Number(String(k).split(':')[2]);
      var q = (p.big || []).filter(function (x) { return x.no === no; })[0];
      if (!q) { return 0; }
      var pts = (q.steps && q.steps.length) ? q.steps.length : 1;
      var per = q.score / pts;
      var chosen = st.rub[k] || {};
      var got = 0;
      Object.keys(chosen).forEach(function (i) { if (chosen[i]) { got += per; } });
      got = Math.min(q.score, Math.round(got));
      st.self[k] = got;
      var num = host.querySelector('[data-selfnum="' + k + '"]');
      if (num) { num.textContent = String(got); }
      save();
      return got;
    }

    Array.prototype.forEach.call(host.querySelectorAll('[data-rub]'), function (box) {
      box.addEventListener('change', function () {
        var k = box.dataset.rub, i = box.dataset.i;
        st.rub[k] = st.rub[k] || {};
        st.rub[k][i] = box.checked;
        recalcRub(k);
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-selfq]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.selfq, v = Number(b.dataset.v) || 0;
        var p = root.PAPERS[st.paper];
        var no = Number(String(k).split(':')[2]);
        var q = (p.big || []).filter(function (x) { return x.no === no; })[0];
        var pts = q && q.steps ? q.steps.length : 0;
        st.rub[k] = {};
        if (v > 0) { for (var i = 0; i < pts; i++) { st.rub[k][i] = true; } }
        recalcRub(k);
        render();
      });
    });

    var sub = document.getElementById('paperSubmit');
    if (sub) { sub.addEventListener('click', submitChoice); }

    var pick = document.getElementById('pickPending');
    if (pick) { pick.addEventListener('click', pickPending); }
  }

  function toast(msg) {
    var hostEl = document.querySelector('.paper-main') || host;
    if (!hostEl) { return; }
    var t = document.getElementById('paperToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'paperToast';
      t.className = 'paper-toast';
      hostEl.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  /* 清空一切作答态：选项、勾选、自评、展开的答案、当前题上下文 */
  function resetAll() {
    st.picked = {};
    st.sel = {};
    st.sent = {};
    st.self = {};
    st.temp = {};
    st.rub = {};
    st.openAnswer = {};
    st.lastQ = null;
    save();
    render();
    toast('已重置：作答、组卷勾选、评分点自评、展开的答案全部清空');
  }

  /* 给主模块的「重置」按钮用：一次清空作答、组卷勾选、自评、已推送记录 */
  root.Paper = {
    reset: resetAll,
    context: function () {
      var p = root.PAPERS[st.paper] || null;
      if (!p) { return null; }
      return { paperId: p.id, year: p.year, title: p.title, question: st.lastQ };
    }
  };

  render();
})(typeof globalThis !== 'undefined' ? globalThis : this);
