'use strict';
/* 输出契约校验
 * 模型输出不可信：四条规则，一条不满足就算失败。
 * 第二段精判的候选集是硬边界 —— nodeId 必须落在候选里。
 * 单独成模块，前端校验与将来接 agent 时复用同一份实现。
 */

function parseJson(raw) {
  let s = String(raw).trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a >= 0 && b > a) { s = s.slice(a, b + 1); }
  return JSON.parse(s);
}

function validate(d, ctx) {
  const errs = [];
  if (!d || typeof d !== 'object') { return ['not an object']; }

  const allowed = (ctx.candidates && ctx.candidates.length) ? ctx.candidates : ctx.nodeIds;
  const node = ctx.nodeMap[d.nodeId];
  const types = node ? ctx.errorTypes[node.level] : null;

  if (typeof d.nodeId !== 'string' || allowed.indexOf(d.nodeId) < 0) {
    errs.push('nodeId 不在候选集：' + JSON.stringify(d.nodeId));
  }
  if (typeof d.errorType !== 'string' || (types && types.indexOf(d.errorType) < 0)) {
    errs.push('errorType 不符合该学段枚举：' + JSON.stringify(d.errorType));
  }
  if (typeof d.confidence !== 'number' || !isFinite(d.confidence) || d.confidence < 0 || d.confidence > 1) {
    errs.push('confidence 必须是 0-1 的数字');
  }
  if (typeof d.diagnosis !== 'string' || d.diagnosis.trim().length < 4 || d.diagnosis.length > 160) {
    errs.push('diagnosis 长度必须在 4-160 之间');
  }
  if (d.answer !== undefined && (typeof d.answer !== 'string' || d.answer.length > 120)) {
    errs.push('answer 必须是 120 字以内的字符串');
  }
  if (d.steps !== undefined) {
    if (!Array.isArray(d.steps) || d.steps.length < 2 || d.steps.length > 6 ||
        d.steps.some(s => typeof s !== 'string' || s.length > 120)) {
      errs.push('steps 必须是 2-6 条、每条 120 字以内的字符串数组');
    }
  }
  if (d.pitfall !== undefined && (typeof d.pitfall !== 'string' || d.pitfall.length > 120)) {
    errs.push('pitfall 必须是 120 字以内的字符串');
  }
  return errs;
}

module.exports = { parseJson, validate };
