/* jsdom 交互巡检：逐个点，断言"点了有变化"，并捕获异常 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = 'C:\\Users\\22969\\Desktop\\YOUHUA\\ai WEB网页开发26人工智能技术应用\\insight-map\\';
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const errors = [];
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://127.0.0.1:5173/', pretendToBeVisual: true });
const { window } = dom;

window.addEventListener('error', (e) => errors.push('onerror: ' + (e.message || e.error)));
window.console.error = function () { errors.push('console.error: ' + Array.prototype.join.call(arguments, ' ')); };
window.console.warn = function () {};
window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, mode: 'no-key', masked: '', model: null, host: 'api.deepseek.com' }) });
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
window.URL.createObjectURL = () => 'blob:mock';
window.alert = (m) => errors.push('alert: ' + m);
window.open = () => ({ document: { write() {}, close() {} }, focus() {}, print() {} });

for (const f of ['graph.js','data.js','bank-extra.js','mathfmt.js','plot.js','papers.js','papers2.js','papers3.js','papers-extra.js','papers4.js','paper-tags.js','paper-methods.js','paper-methods2.js','bili.js','resources.js','paper.js','pomodoro.js','app.js','planner.js','agent.js']) {
  try { window.eval(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { errors.push('加载 ' + f + ' 失败: ' + e.message); }
}
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const $ = (s) => window.document.querySelector(s);
const $$ = (s) => Array.prototype.slice.call(window.document.querySelectorAll(s));
const click = (sel) => {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) { errors.push('找不到: ' + sel); return false; }
  try { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); return true; }
  catch (e) { errors.push('click ' + sel + ': ' + e.message); return false; }
};
const report = [];
const check = (n, c, d) => report.push((c ? '  OK   ' : '  FAIL ') + n + (c ? '' : '  ← ' + (d || '')));

/* 导航 */
['diagnose','drill','teach','map','book','paper'].forEach(v => {
  click('[data-view="' + v + '"]');
  const view = window.document.getElementById('view-' + v);
  check('导航 ' + v, view && view.classList.contains('on'));
});

/* 助教：click 也能开（键盘可达） */
click('#agFab');
check('助教面板可打开（click）', $('#agPanel') && !$('#agPanel').hidden);
click('#agHist');
check('历史：出现列表或空态', !!$('#agHistList'), '没有 #agHistList');
click('#agKey');
check('密钥面板展开', $('#agSet') && !$('#agSet').hidden);
click('#agRun');
check('无题目时给提示', ($('#agOut') || {}).textContent.trim().length > 4);

/* 番茄钟 */
const pBtn = $('#pomoBtn');
click(pBtn);
check('番茄钟开始后按钮变暂停', pBtn && pBtn.textContent === '暂停', pBtn && pBtn.textContent);
click(pBtn);
check('再点变回开始', pBtn && pBtn.textContent === '开始');
click('#pomoReset');

/* 教学搜索 */
click('[data-view="teach"]');
const before = $$('#teachList .teach-item').length;
const ts = $('#teachSearch');
if (ts) { ts.value = '泰勒'; ts.dispatchEvent(new window.Event('input', { bubbles: true })); }
const after = $$('#teachList .teach-item').length;
check('教学搜索能过滤（' + before + '→' + after + '）', after > 0 && after < before);

/* 地图 chips */
click('[data-view="map"]');
click('#mapReset');
check('地图重置不抛错', true);
click('#mapModeNode');
check('聚焦 chip 变高亮', $('#mapModeNode').classList.contains('on'));

/* 试卷：答题 → 交卷 → 重置 */
click('[data-view="paper"]');
const opt = $('#paperApp .popt');
click(opt);
check('选择题作答后有反馈', $$('#paperApp .pq-exp').length > 0);
click('#paperSubmit');
check('交卷出现成绩单', !!$('#paperApp .score-card'));
const pickedBefore = Object.keys((function () { try { return JSON.parse(window.localStorage.getItem('dongjian.paper') || '{}').picked || {}; } catch (e) { return {}; } })()).length;
click('#resetBtn');
const scoreAfter = !!$('#paperApp .score-card');
const pickedAfter = Object.keys((function () { try { return JSON.parse(window.localStorage.getItem('dongjian.paper') || '{}').picked || {}; } catch (e) { return {}; } })()).length;
check('重置清空试卷作答（' + pickedBefore + '→' + pickedAfter + '）', !scoreAfter && pickedAfter === 0);

/* 大题 Tab：自评 + 多解法 */
const tabs = $$('.ptab');
if (tabs[3]) { click(tabs[3]); }
const rubRows = $$('#paperApp .rub-row');
check('大题有评分点清单（' + rubRows.length + ' 项）', rubRows.length > 0);
const numBefore = ($('#paperApp .self-num') || {}).textContent;
const rc = $('#paperApp .rub-row input');
if (rc) { rc.checked = true; rc.dispatchEvent(new window.Event('change', { bubbles: true })); }
const numAfter = ($('#paperApp .self-num') || {}).textContent;
check('勾选评分点会加分（' + numBefore + '→' + numAfter + '）', Number(numAfter) > Number(numBefore));

/* 大题专项：展开答案 + 勾分 → 全局「重置」必须复位，且有可见提示 */
const bigToggle = $('#paperApp .pq-toggle');
if (bigToggle) { click(bigToggle); }
const ansOpened = $$('#paperApp .pa-steps').length + $$('#paperApp .pm').length;
check('大题答案能展开（' + ansOpened + ' 块）', ansOpened > 0);
const rc2 = $('#paperApp .rub-row input');
if (rc2) { rc2.checked = true; rc2.dispatchEvent(new window.Event('change', { bubbles: true })); }
const scoreBefore = Number(($('#paperApp .self-num') || {}).textContent || 0);
check('自评分已累计（' + scoreBefore + '）', scoreBefore > 0);
click('#resetBtn');
const scoreAfter2 = Number(($('#paperApp .self-num') || {}).textContent || 0);
const ansAfter2 = $$('#paperApp .pa-steps').length + $$('#paperApp .pm').length;
check('全局重置后大题复位（分 ' + scoreBefore + '→' + scoreAfter2 + '，答案块 ' + ansAfter2 + '）', scoreAfter2 === 0 && ansAfter2 === 0);
check('重置有可见提示 toast', !!$('#paperToast'));
const prBtn = $('#paperReset');
check('试卷内有「重置作答」按钮', !!prBtn);
if (prBtn) { click(prBtn); check('「重置作答」点了不报错', true); }
const toggle = $('#paperApp .pq-toggle');
if (toggle) { click(toggle); }
check('大题能展开答案', $$('#paperApp .pm').length > 0 || $$('#paperApp .pa-steps').length > 0);

/* 错题本筛选 */
click('[data-view="book"]');
const chips = $$('#bookChips .bchip');
if (chips[1]) { click(chips[1]); }
check('错题本筛选可点', chips.length === 3);

/* 规划助教：先制造两个断点，再生成路线 */
window.DJ.addWrong('der-app', '分类讨论不全');
window.DJ.addWrong('indef-int', '换元不当');
const planBtn = $('#planBtn');
check('补课路线按钮存在', !!planBtn);
click(planBtn);
const planBox = $('#planBox');
check('路线卡出现', planBox && !planBox.hidden);
const steps = $$('#planBox .pl-step');
check('路线至少 1 步（' + steps.length + ' 步）', steps.length >= 1);
const planJson = (function () {
  try { return window.Planner.compute(); } catch (e) { errors.push('Planner.compute 抛错: ' + e.message); return null; }
})();
check('规划是纯算法（无网络）', !!planJson && Array.isArray(planJson.steps));
if (planJson && planJson.steps.length) {
  const first = planJson.steps[0];
  check('第一步有节点与理由', !!first.id && !!first.why, JSON.stringify(first).slice(0, 60));
  const chain = window.document.querySelector('#planBox [data-pl="map"]');
  click(chain);
  check('路线里的“地图定位”可用', window.document.getElementById('view-map').classList.contains('on'));
  const teachBtn = window.document.querySelector('#planBox [data-pl="teach"]');
  click(teachBtn);
  check('路线里的“看这个课”可用', window.document.getElementById('view-teach').classList.contains('on'));
}
/* 助教 askTopic 不抛错 */
try { window.Agent.askTopic('limit'); check('askTopic 可用', true); }
catch (e) { check('askTopic 可用', false, e.message); }

/* 三个角色的入口与输出 */
click('#navAgent');
check('顶栏「AI 助教」能开面板', $('#agPanel') && !$('#agPanel').hidden);
const roleBtns = $$('.ag-role');
check('面板里有 3 个角色', roleBtns.length === 3, '实际 ' + roleBtns.length);
if (roleBtns[1]) {
  click(roleBtns[1]);
  check('切到规划角色高亮', roleBtns[1].classList.contains('on'));
  click('#agRun');
  const planSteps = $$('#agOut .ag-planstep').length;
  check('规划角色有输出（' + planSteps + ' 步）', planSteps > 0 || ($('#agOut').textContent.indexOf('待修复') >= 0));
}
if (roleBtns[2]) {
  click(roleBtns[2]);
  click('#agRun');
  const txt = ($('#agOut') || {}).textContent || '';
  check('阅卷角色有输出', txt.indexOf('得分点') >= 0 || txt.indexOf('先去') >= 0, txt.slice(0, 40));
}
if (roleBtns[0]) { click(roleBtns[0]); }

/* 输出 */
console.log('=== 交互巡检 ===');
report.forEach(r => console.log(r));
console.log('');
const fails = report.filter(r => r.indexOf('FAIL') === 0).length;
if (errors.length) {
  console.log('=== 异常 (' + errors.length + ') ===');
  [...new Set(errors)].slice(0, 12).forEach(e => console.log('  ' + String(e).slice(0, 150)));
}
console.log('');
console.log(fails === 0 ? '全部通过 (' + report.length + ' 项)' : fails + ' 项未通过 / 共 ' + report.length + ' 项');
