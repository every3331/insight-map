/* 静态托管模式（GitHub Pages）下的行为验证 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = 'C:\\Users\\22969\\Desktop\\YOUHUA\\ai WEB网页开发26人工智能技术应用\\insight-map\\';
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://demo-user.github.io/dongjian/insight-map/', pretendToBeVisual: true });
const { window } = dom;
const calls = [];
const errors = [];
window.console.error = (...a) => errors.push(a.join(' '));
window.addEventListener('error', (e) => errors.push('onerror: ' + (e.message || e.error)));
window.onerror = (m, s, l, c, err) => { errors.push('win.onerror: ' + m + ' @' + l); return false; };
window.fetch = async (u) => { calls.push(String(u)); throw new Error('no network in static test'); };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.alert = (m) => errors.push('alert: ' + m);

for (const f of ['graph.js','data.js','bank-extra.js','mathfmt.js','plot.js','papers.js','papers2.js','papers3.js','papers-extra.js','papers4.js','paper-tags.js','paper-methods.js','paper-methods2.js','bili.js','resources.js','paper.js','pomodoro.js','app.js','planner.js','agent.js']) {
  try { window.eval(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { errors.push(f + ': ' + e.message); }
}
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const $ = (s) => window.document.querySelector(s);
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const out = (ok, name, extra) => console.log((ok ? '  OK   ' : '  FAIL ') + name + (ok ? '' : '  ← ' + (extra || '')));

out(!!$('#staticBanner'), '静态版横幅出现');
const bannerSpan = window.document.querySelector('.static-banner span');
out(!!bannerSpan && bannerSpan.textContent.indexOf('内置诊断引擎') >= 0, '横幅说明了 AI 降级');

// 诊断一次，确认不走网络
const q = $('#qInput'); if (q) { q.value = '求 lim(x→0) sinx/x，我用了洛必达'; }
click($('#diagnoseBtn'));
setTimeout(() => {
  const apiCalls = calls.filter(u => u.includes('/api/'));
  out(apiCalls.length === 0, '静态版不请求任何 /api/*（实际 ' + apiCalls.length + ' 次）', apiCalls.join(','));
  const body = (window.document.body.textContent || '');
  console.log('    [debug] body=' + body.length + ' 含"正在诊断"=' + /正在诊断/.test(body) + ' 面板存在=' + !!$('#agPanel') + ' 面板hidden=' + ($('#agPanel') ? $('#agPanel').hidden : 'n/a'));
  out(body.length > 500 && !/正在诊断/.test(body), '本地点断仍能出结果');

  // 助教面板：不 ping 后端
  const fab = $('#agFab');
  console.log('    [debug] fab=' + !!fab + ' Agent=' + (typeof window.Agent) + ' hiddenBefore=' + $('#agPanel').hidden);
  click(fab);
  out(!$('#agPanel').hidden, '点悬浮球能开面板');
  out(window.document.querySelectorAll('#agFab').length === 1, '只有一个悬浮球（幂等）',
    '实际 ' + window.document.querySelectorAll('#agFab').length + ' 个');
  console.log('    [debug] afterClick hidden=' + $('#agPanel').hidden);
  if (window.Agent) { window.Agent.open(false); }
  console.log('    [debug] afterAgentOpen hidden=' + $('#agPanel').hidden);
  out(!$('#agPanel').hidden, '助教面板能打开');
  out(calls.filter(u => u.includes('/api/agent')).length === 0, '助教在静态版不 ping 后端');
  const dot = $('#agDot');
  out(dot && dot.className.includes('nokey'), '状态灯显示"无后端"', dot && dot.className);

  console.log('');
  console.log(errors.length ? '异常: ' + [...new Set(errors)].slice(0,5).join(' | ') : '无异常');
}, 600);
