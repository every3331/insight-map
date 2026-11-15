'use strict';
/* 提示词：候选集动态生成，模型只在 10 个里选 1 个。
 * 这里是「两段式」的第二段；第一段的召回在 data.js（前后端同一份实现）。
 */

function levelNames(data) {
  const map = {};
  (data.LEVELS || []).forEach(lv => { map[lv.key] = lv.name; });
  return map;
}

function buildPrompt(data, cands) {
  const lvName = levelNames(data);

  const lines = cands.map(id => {
    const n = data.NODE_MAP[id];
    const pre = n.prereq && data.NODE_MAP[n.prereq] ? data.NODE_MAP[n.prereq].label : '—';
    return '  - ' + n.id + '｜' + n.label + '｜' + n.code + '｜' + (lvName[n.level] || n.level) + '｜前置：' + pre;
  }).join('\n');

  const typeLines = Object.keys(data.ERROR_TYPES)
    .map(lv => '  ' + (lvName[lv] || lv) + '：' + data.ERROR_TYPES[lv].join(' / '))
    .join('\n');

  return [
    '你是初中→高中→高等数学一贯制的错题诊断引擎，学生可能是任何一个学段。',
    '',
    '第一步已经做完了：系统用关键词把这题召回成下面这 ' + cands.length + ' 个候选节点。',
    '你只能在这些候选里选一个，禁止自创、禁止拼错、禁止选候选之外的：',
    lines,
    '',
    '错因类型按命中节点的学段选，各学段枚举不同：',
    typeLines,
    '',
    '任务：判断学生真正卡住的知识点、错因类型、置信度，并用一句中文说清楚错在哪。',
    '不要讲整道题，不要输出 markdown。',
    '',
    '如果能确定这道题的答案，再补三个字段；不确定就整体省略，绝对不要编：',
    '  answer   参考答案，一行，120 字以内',
    '  steps    2-6 条关键步骤，每条 120 字以内',
    '  pitfall  这一步最常见的错误，一句',
    '',
    '只输出 JSON，字段固定：',
    '{"nodeId":"...","errorType":"...","confidence":0.85,"diagnosis":"...",',
    ' "answer":"...","steps":["...","..."],"pitfall":"..."}'
  ].join('\n');
}

module.exports = { buildPrompt };
