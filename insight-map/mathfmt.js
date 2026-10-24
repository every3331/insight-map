/* 洞见 · 轻量数学排版
 *
 * 我们的题目内容是「中文 + 行内数学式」混排的纯文本（不是 LaTeX），
 * 所以没上 KaTeX（要重写 100+ 条字符串 + 300KB 字体，还得从 file:// 跑通）。
 * 这里做的是针对性的可视化：
 *   - lim(x→0) 变成真正的下标式
 *   - ∫ 放大、Δ 保留
 *   - 上下标符号统一
 * 规则保守：只改「确定是数学」的形状，不动中文。
 */
window.MathFmt = (function () {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function fmt(text) {
    var s = esc(text);

    // lim(x→0) / lim(Δx→0) → lim 带下标
    s = s.replace(/(^|[^\w])lim\(([^)]{1,12})\)/g, function (m, pre, sub) {
      return pre + '<span class="mf-lim">lim<span class="mf-sub">' + sub + '</span></span>';
    });

    // 积分号放大
    s = s.replace(/∫/g, '<span class="mf-int">∫</span>');

    // a^b → 上标（1^∞、x^2 这类）
    s = s.replace(/\^([A-Za-z0-9∞]+)/g, '<sup>$1</sup>');

    // n 阶导 / 撇号统一（f′(1) 已经是 ′，这里只统一 ' ）
    s = s.replace(/([A-Za-z])'/g, '$1′');

    return s;
  }

  var SELECTOR = [
    '.steps li',
    '.dq-stem',
    '.quiz-stem',
    '.opt .t',
    '.block-text',
    '.ans-box b',
    '.ic-one',
    '.ic-pts li',
    '.vc-desc',
    '.pq-stem',
    '.q-stem'
  ].join(',');

  function apply(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.dataset.mf === '1') { return; }
      var raw = el.textContent;
      if (!raw || !/[=lim∫Δ√≈≠≤≥]/.test(raw)) { return; }
      el.innerHTML = fmt(raw);
      el.dataset.mf = '1';
    });
  }

  return { fmt: fmt, apply: apply };
})();
