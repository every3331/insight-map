/* 洞见 · 函数图像引擎（零依赖）
 *
 * 能力：
 *   - 表达式解析：+ - * / ^、括号、隐式乘法（2x、x(x+1)、2sinx）
 *   - 内置函数：sin cos tan asin acos atan sinh cosh tanh exp ln log sqrt abs floor ceil round pow
 *   - 交互：滚轮缩放、拖拽平移、悬停十字线读数
 *   - 叠加：f′ 数值导数（紫色虚线）、零点与极值点自动标注
 *
 * 用法：
 *   var p = Plot.create(svgEl);
 *   p.setExpression('x^2 - 4x + 3');
 *   p.setDeriv(true); p.reset(); p.redraw();
 */
window.Plot = (function () {
  'use strict';

  var FNS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    exp: Math.exp, ln: Math.log, log: Math.log10, lg: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, abs: Math.abs,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
    pow: Math.pow
  };

  var C = {
    grid: 'rgba(120,150,220,.10)',
    gridStrong: 'rgba(120,150,220,.18)',
    axis: 'rgba(150,180,255,.30)',
    label: '#5F6C8C',
    curve: '#60A5FA',
    deriv: '#A78BFA',
    root: '#34D399',
    ext: '#FBBF24',
    cross: 'rgba(180,200,255,.55)'
  };

  /* ───────────── 解析 ───────────── */

  function tokenize(s) {
    var t = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) { j++; }
        var num = parseFloat(s.slice(i, j));
        if (!isFinite(num)) { throw new Error('数字写错了：' + s.slice(i, j)); }
        t.push({ t: 'num', v: num });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        var k = i;
        while (k < s.length && /[a-zA-Z0-9_]/.test(s[k])) { k++; }
        t.push({ t: 'id', v: s.slice(i, k).toLowerCase() });
        i = k;
        continue;
      }
      if ('+-*/^(),'.indexOf(c) >= 0) { t.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('看不懂这个符号：' + c);
    }
    return t;
  }

  function parse(toks) {
    var p = 0;
    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function expect(v) {
      if (!peek() || peek().v !== v) { throw new Error('少了 ' + v); }
      p++;
    }

    function expr() {
      var n = term();
      while (peek() && (peek().v === '+' || peek().v === '-')) {
        var op = next().v;
        n = { k: 'bin', op: op, a: n, b: term() };
      }
      return n;
    }

    function term() {
      var n = unary();
      for (;;) {
        var tk = peek();
        if (!tk) { break; }
        if (tk.v === '*' || tk.v === '/') {
          next();
          n = { k: 'bin', op: tk.v, a: n, b: unary() };
          continue;
        }
        if (tk.t === 'num' || tk.t === 'id' || tk.v === '(') {
          n = { k: 'bin', op: '*', a: n, b: unary() };
          continue;
        }
        break;
      }
      return n;
    }

    function unary() {
      var tk = peek();
      if (tk && (tk.v === '-' || tk.v === '+')) {
        next();
        return { k: 'neg', a: unary() };
      }
      return power();
    }

    function power() {
      var base = atom();
      if (peek() && peek().v === '^') {
        next();
        return { k: 'bin', op: '^', a: base, b: unary() };
      }
      return base;
    }

    function atom() {
      var tk = next();
      if (!tk) { throw new Error('表达式没写完'); }
      if (tk.t === 'num') { return { k: 'num', v: tk.v }; }
      if (tk.t === 'id') {
        if (tk.v === 'x') { return { k: 'x' }; }
        if (tk.v === 'pi') { return { k: 'num', v: Math.PI }; }
        if (tk.v === 'e') { return { k: 'num', v: Math.E }; }
        if (FNS[tk.v]) {
          expect('(');
          var a = expr();
          expect(')');
          return { k: 'fn', f: tk.v, a: a };
        }
        if (tk.v.length > 1 && tk.v[0] === 'x') {
          // 容错：x2 → x*2 之类就放弃，直接报错
          throw new Error('未知符号：' + tk.v);
        }
        throw new Error('未知符号：' + tk.v);
      }
      if (tk.v === '(') {
        var e = expr();
        expect(')');
        return e;
      }
      throw new Error('意外的符号：' + tk.v);
    }

    var ast = expr();
    if (p < toks.length) { throw new Error('后面多了点东西'); }
    return ast;
  }

  function evalNode(n, x) {
    switch (n.k) {
      case 'num': return n.v;
      case 'x': return x;
      case 'neg': return -evalNode(n.a, x);
      case 'bin':
        var a = evalNode(n.a, x), b = evalNode(n.b, x);
        switch (n.op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return a / b;
          case '^': return Math.pow(a, b);
        }
        return NaN;
      case 'fn': return FNS[n.f](evalNode(n.a, x));
      default: return NaN;
    }
  }

  function compile(src) {
    var s = String(src)
      .replace(/[×✕]/g, '*').replace(/[÷]/g, '/')
      .replace(/[−–—]/g, '-')
      .replace(/[²]/g, '^2').replace(/[³]/g, '^3')
      .replace(/[π]/g, 'pi').replace(/[，]/g, ',')
      .replace(/\s+/g, ' ');

    var eq = s.indexOf('=');
    if (eq >= 0) { s = s.slice(eq + 1); }
    s = s.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=/i, '');
    if (eq >= 0) { s = s.slice(s.indexOf('=') + 1); }
    s = s.trim();
    if (!s) { throw new Error('还没输入表达式'); }

    var ast = parse(tokenize(s));
    return {
      source: s,
      fn: function (x) { return evalNode(ast, x); }
    };
  }

  /* ───────────── 绘制 ───────────── */

  function niceStep(range, target) {
    var raw = range / Math.max(2, target);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step;
    if (norm <= 1) { step = 1; }
    else if (norm <= 2) { step = 2; }
    else if (norm <= 2.5) { step = 2.5; }
    else if (norm <= 5) { step = 5; }
    else { step = 10; }
    return step * mag;
  }

  function decOf(step) {
    var s = String(step), i = s.indexOf('.');
    return i < 0 ? 0 : Math.min(4, s.length - i - 1);
  }

  function fmt(v, step) {
    if (Math.abs(v) < 1e-9) { return '0'; }
    var d = decOf(step);
    var s = v.toFixed(d);
    if (s.indexOf('.') >= 0) { s = s.replace(/0+$/, '').replace(/\.$/, ''); }
    return s;
  }

  function create(svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var st = {
      xmin: -6, xmax: 6, ymin: -5, ymax: 5,
      expr: '', fn: null, deriv: false, hover: null,
      marks: [], tangent: null,
      W: 480, H: 560, fitted: false
    };

    function el(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      if (attrs) { for (var k in attrs) { e.setAttribute(k, attrs[k]); } }
      return e;
    }
    function X(x) { return (x - st.xmin) / (st.xmax - st.xmin) * st.W; }
    function Y(y) { return st.H - (y - st.ymin) / (st.ymax - st.ymin) * st.H; }
    function invX(px) { return st.xmin + px / st.W * (st.xmax - st.xmin); }
    function invY(py) { return st.ymin + (st.H - py) / st.H * (st.ymax - st.ymin); }

    function size() {
      var r = svg.parentElement.getBoundingClientRect();
      var w = Math.max(220, Math.round(r.width));
      var h = Math.max(180, Math.round(r.height));
      if (w === st.W && h === st.H) { return false; }
      st.W = w; st.H = h;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      return true;
    }

    function sample() {
      var pts = [], N = Math.min(1400, Math.max(320, st.W * 2));
      if (!st.fn) { return pts; }
      var prev = null;
      for (var i = 0; i <= N; i++) {
        var x = st.xmin + (st.xmax - st.xmin) * i / N;
        var y;
        try { y = st.fn(x); } catch (e) { y = NaN; }
        if (!isFinite(y) || Math.abs(y) > 1e7) {
          pts.push({ x: x, y: NaN });
          prev = null;
          continue;
        }
        pts.push({ x: x, y: y });
        prev = y;
      }
      return pts;
    }

    function fitY(pts) {
      var lo = Infinity, hi = -Infinity;
      pts.forEach(function (p) {
        if (!isFinite(p.y)) { return; }
        if (p.y < lo) { lo = p.y; }
        if (p.y > hi) { hi = p.y; }
      });
      if (!isFinite(lo) || !isFinite(hi)) { return; }
      var pad = Math.max(1, (hi - lo) * 0.18);
      var lo2 = lo - pad, hi2 = hi + pad;
      var span = Math.max(2, Math.min(200, hi2 - lo2));
      var mid = (lo + hi) / 2;
      st.ymin = mid - span / 2;
      st.ymax = mid + span / 2;
    }

    function drawGrid(root) {
      var sx = niceStep(st.xmax - st.xmin, Math.max(3, Math.round(st.W / 90)));
      var sy = niceStep(st.ymax - st.ymin, Math.max(3, Math.round(st.H / 70)));

      var gGrid = el('g', {});
      var gAxis = el('g', {});
      var gLabel = el('g', {});

      var x0 = Math.ceil(st.xmin / sx) * sx;
      for (var x = x0; x <= st.xmax + 1e-9; x += sx) {
        var px = X(x);
        gGrid.appendChild(el('line', { x1: px, y1: 0, x2: px, y2: st.H, stroke: C.grid, 'stroke-width': 1 }));
      }
      var y0 = Math.ceil(st.ymin / sy) * sy;
      for (var y = y0; y <= st.ymax + 1e-9; y += sy) {
        var py = Y(y);
        gGrid.appendChild(el('line', { x1: 0, y1: py, x2: st.W, y2: py, stroke: C.grid, 'stroke-width': 1 }));
      }

      // 轴
      var ax = Math.min(Math.max(X(0), 0), st.W);
      var ay = Math.min(Math.max(Y(0), 0), st.H);
      gAxis.appendChild(el('line', { x1: 0, y1: ay, x2: st.W, y2: ay, stroke: C.axis, 'stroke-width': 1.2 }));
      gAxis.appendChild(el('line', { x1: ax, y1: 0, x2: ax, y2: st.H, stroke: C.axis, 'stroke-width': 1.2 }));

      // 刻度文字
      for (var xt = x0; xt <= st.xmax + 1e-9; xt += sx) {
        if (Math.abs(xt) < sx / 2) { continue; }
        var tx = X(xt);
        var t1 = el('text', {
          x: tx, y: Math.min(st.H - 4, ay + 12),
          'text-anchor': 'middle', fill: C.label,
          'font-size': 9.5, 'font-family': 'ui-monospace, monospace'
        });
        t1.textContent = fmt(xt, sx);
        gLabel.appendChild(t1);
      }
      for (var yt = y0; yt <= st.ymax + 1e-9; yt += sy) {
        if (Math.abs(yt) < sy / 2) { continue; }
        var ty = Y(yt);
        var t2 = el('text', {
          x: Math.max(14, ax - 6), y: ty + 3,
          'text-anchor': 'end', fill: C.label,
          'font-size': 9.5, 'font-family': 'ui-monospace, monospace'
        });
        t2.textContent = fmt(yt, sy);
        gLabel.appendChild(t2);
      }

      root.appendChild(gGrid);
      root.appendChild(gAxis);
      root.appendChild(gLabel);
    }

    function pathOf(pts) {
      var d = '', pen = false;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!isFinite(p.y)) { pen = false; continue; }
        var px = X(p.x), py = Y(p.y);
        if (py < -2000 || py > st.H + 2000) { pen = false; continue; }
        d += (pen ? ' L' : ' M') + px.toFixed(2) + ' ' + py.toFixed(2);
        pen = true;
      }
      return d;
    }

    function drawCurve(root, pts) {
      var d = pathOf(pts);
      if (!d) { return; }
      root.appendChild(el('path', {
        d: d, fill: 'none', stroke: C.curve,
        'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    }

    function drawDeriv(root, pts) {
      var N = pts.length;
      if (N < 3) { return; }
      var h = (st.xmax - st.xmin) / 400;
      var out = [];
      for (var i = 0; i < N; i++) {
        var x = pts[i].x;
        var y1, y2;
        try { y1 = st.fn(x + h); y2 = st.fn(x - h); } catch (e) { y1 = y2 = NaN; }
        var d = (y1 - y2) / (2 * h);
        out.push({ x: x, y: isFinite(d) ? d : NaN });
      }
      var dd = pathOf(out);
      if (!dd) { return; }
      root.appendChild(el('path', {
        d: dd, fill: 'none', stroke: C.deriv,
        'stroke-width': 1.6, 'stroke-dasharray': '5 4', 'stroke-linecap': 'round', opacity: .9
      }));
    }

    function marks(pts) {
      var out = [];
      var i;
      // 零点
      for (i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (!isFinite(a.y) || !isFinite(b.y)) { continue; }
        if ((a.y === 0) || (a.y * b.y < 0)) {
          var t = a.y / (a.y - b.y);
          if (isFinite(t)) { out.push({ type: 'root', x: a.x + (b.x - a.x) * t, y: 0 }); }
        }
      }
      // 极值：三点判定
      for (i = 1; i < pts.length - 1; i++) {
        var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
        if (!isFinite(p0.y) || !isFinite(p1.y) || !isFinite(p2.y)) { continue; }
        var isMax = p1.y > p0.y && p1.y > p2.y;
        var isMin = p1.y < p0.y && p1.y < p2.y;
        if (isMax || isMin) {
          var last = out[out.length - 1];
          if (!last || last.type !== 'ext' || Math.abs(last.x - p1.x) > (st.xmax - st.xmin) * 0.03) {
            out.push({ type: 'ext', x: p1.x, y: p1.y, max: isMax });
          }
        }
      }
      return out.slice(0, 6);
    }

    function drawMarks(root, pts) {
      var ms = marks(pts);
      ms.forEach(function (m) {
        var cx = X(m.x), cy = Y(m.y);
        if (cx < -20 || cx > st.W + 20) { return; }
        root.appendChild(el('circle', {
          cx: cx, cy: cy, r: 3.6,
          fill: '#0B1226',
          stroke: m.type === 'root' ? C.root : C.ext,
          'stroke-width': 2
        }));
      });
    }

    function drawTangent(root) {
      var t = st.tangent;
      if (!t || !st.fn) { return; }
      var y0;
      try { y0 = st.fn(t.x); } catch (e) { return; }
      if (!isFinite(y0)) { return; }
      var x1 = st.xmin, x2 = st.xmax;
      var ya = y0 + t.slope * (x1 - t.x);
      var yb = y0 + t.slope * (x2 - t.x);
      root.appendChild(el('line', {
        x1: X(x1), y1: Y(ya), x2: X(x2), y2: Y(yb),
        stroke: '#FBBF24', 'stroke-width': 1.6, 'stroke-dasharray': '6 5', opacity: .85
      }));
      root.appendChild(el('circle', {
        cx: X(t.x), cy: Y(y0), r: 4,
        fill: '#FBBF24', stroke: '#0B1226', 'stroke-width': 2
      }));
      var lab = el('text', {
        x: X(t.x) + 9, y: Y(y0) - 9,
        fill: '#FBBF24', 'font-size': 10.5,
        'font-family': 'ui-monospace, monospace',
        'paint-order': 'stroke', stroke: '#080D1C', 'stroke-width': 3
      });
      lab.textContent = '切线 k=' + t.slope;
      root.appendChild(lab);
    }

    function drawPins(root) {
      st.marks.forEach(function (m) {
        var col = m.kind === 'bad' ? '#F87171' : '#34D399';
        var cx = X(m.x), cy = Y(m.y);
        root.appendChild(el('circle', {
          cx: cx, cy: cy, r: 5.5, fill: col, stroke: '#0B1226', 'stroke-width': 2
        }));
        if (m.label) {
          var t = el('text', {
            x: cx + 10, y: cy + 4, fill: col, 'font-size': 10,
            'font-family': 'ui-monospace, monospace',
            'paint-order': 'stroke', stroke: '#080D1C', 'stroke-width': 3
          });
          t.textContent = m.label;
          root.appendChild(t);
        }
      });
    }

    var crossG = null;
    var crossDot = null;
    var crossLabel = null;

    function drawCross(root) {
      crossG = el('g', { opacity: 0 });
      crossG.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: st.H, stroke: C.cross, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: .35 }));
      crossG.appendChild(el('line', { x1: 0, y1: 0, x2: st.W, y2: 0, stroke: C.cross, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: .35 }));
      crossDot = el('circle', { r: 4, fill: C.curve, stroke: '#0B1226', 'stroke-width': 2 });
      crossLabel = el('text', {
        x: 8, y: 16, fill: '#C8D6FF', 'font-size': 11,
        'font-family': 'ui-monospace, monospace'
      });
      crossG.appendChild(crossDot);
      root.appendChild(crossG);
      root.appendChild(crossLabel);
    }

    function updateCross() {
      if (!crossG) { return; }
      if (!st.hover) { crossG.setAttribute('opacity', 0); crossLabel.textContent = ''; return; }
      var hx = X(st.hover.x), hy = Y(st.hover.y);
      var l1 = crossG.childNodes[0], l2 = crossG.childNodes[1];
      l1.setAttribute('x1', hx); l1.setAttribute('x2', hx);
      l2.setAttribute('y1', hy); l2.setAttribute('y2', hy);
      crossDot.setAttribute('cx', hx);
      crossDot.setAttribute('cy', hy);
      crossG.setAttribute('opacity', 1);
      crossLabel.setAttribute('x', Math.min(st.W - 150, Math.max(6, hx + 10)));
      crossLabel.setAttribute('y', Math.min(st.H - 8, Math.max(14, hy - 10)));
      crossLabel.textContent = '(' + st.hover.x.toFixed(2) + ',  ' + st.hover.y.toFixed(2) + ')';
    }

    function render() {
      if (size()) { st.fitted = false; }
      var pts = sample();
      if (!st.fitted && st.fn) { fitY(pts); st.fitted = true; pts = sample(); }

      svg.textContent = '';
      var root = el('g', {});
      svg.appendChild(root);

      drawGrid(root);
      if (st.deriv && st.fn) { drawDeriv(root, pts); }
      drawCurve(root, pts);
      drawTangent(root);
      drawPins(root);
      drawMarks(root, pts);
      drawCross(root);
      updateCross();

      if (st.fn) {
        var bot = el('text', {
          x: st.W - 8, y: st.H - 8, 'text-anchor': 'end',
          fill: '#3E4A66', 'font-size': 10, 'font-family': 'ui-monospace, monospace'
        });
        bot.textContent = 'y = ' + st.expr;
        root.appendChild(bot);
      }
    }

    /* 交互 */
    var drag = null;

    function localPoint(ev) {
      var r = svg.getBoundingClientRect();
      return {
        px: (ev.clientX - r.left) / r.width * st.W,
        py: (ev.clientY - r.top) / r.height * st.H
      };
    }

    svg.addEventListener('mousemove', function (ev) {
      var p = localPoint(ev);
      if (drag) {
        var dx = (p.px - drag.px) / st.W * (st.xmax - st.xmin);
        var dy = (p.py - drag.py) / st.H * (st.ymax - st.ymin);
        st.xmin = drag.xmin - dx; st.xmax = drag.xmax - dx;
        st.ymin = drag.ymin + dy; st.ymax = drag.ymax + dy;
        drag.moved = true;
        render();
        return;
      }
      var x = invX(p.px);
      var y = invY(p.py);
      if (st.fn) {
        var fy;
        try { fy = st.fn(x); } catch (e) { fy = NaN; }
        if (isFinite(fy) && Math.abs(fy) < 1e6) { y = fy; }
      }
      st.hover = { x: x, y: y };
      updateCross();
    });

    svg.addEventListener('mouseleave', function () {
      st.hover = null;
      updateCross();
    });

    svg.addEventListener('mousedown', function (ev) {
      var p = localPoint(ev);
      drag = { px: p.px, py: p.py, xmin: st.xmin, xmax: st.xmax, ymin: st.ymin, ymax: st.ymax, moved: false };
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', function () {
      if (drag) { drag = null; svg.style.cursor = 'crosshair'; }
    });

    svg.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var p = localPoint(ev);
      var k = ev.deltaY > 0 ? 1.14 : 0.88;
      var cx = invX(p.px), cy = invY(p.py);
      st.xmin = cx + (st.xmin - cx) * k;
      st.xmax = cx + (st.xmax - cx) * k;
      st.ymin = cy + (st.ymin - cy) * k;
      st.ymax = cy + (st.ymax - cy) * k;
      render();
    }, { passive: false });

    svg.style.cursor = 'crosshair';

    if (window.ResizeObserver) {
      new ResizeObserver(function () { render(); }).observe(svg.parentElement);
    }

    var api = {
      setExpression: function (src) {
        try {
          var out = compile(src);
          st.fn = out.fn;
          st.expr = out.source;
          st.fitted = false;
          render();
          return { ok: true, source: out.source };
        } catch (e) {
          return { ok: false, err: e.message };
        }
      },
      setDeriv: function (on) { st.deriv = !!on; render(); },
      setMarks: function (list) { st.marks = list || []; render(); },
      setTangent: function (t) { st.tangent = t || null; render(); },
      setRange: function (a, b) {
        if (isFinite(a) && isFinite(b) && b > a) {
          st.xmin = a; st.xmax = b; st.fitted = false; render();
        }
      },
      zoom: function (k) {
        var cx = (st.xmin + st.xmax) / 2, cy = (st.ymin + st.ymax) / 2;
        st.xmin = cx + (st.xmin - cx) * k;
        st.xmax = cx + (st.xmax - cx) * k;
        st.ymin = cy + (st.ymin - cy) * k;
        st.ymax = cy + (st.ymax - cy) * k;
        render();
      },
      reset: function () {
        st.xmin = -6; st.xmax = 6;
        st.fitted = false;
        render();
      },
      redraw: function () { render(); },
      clear: function () { st.fn = null; st.expr = ''; render(); }
    };

    render();
    return api;
  }

  return { compile: compile, create: create };
})();




