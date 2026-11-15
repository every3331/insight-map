'use strict';
/* 模型调用：任何 OpenAI 兼容网关都能用（DeepSeek / 通义 / vLLM / one-api）。
 * 只做「发请求 + 取 content」，JSON 解析与校验交给 validate.js。
 */

const { parseJson } = require('./validate');

function createLLM(opts) {
  const baseUrl = String(opts.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = opts.apiKey || '';
  const model = opts.model || 'gpt-4o-mini';
  const timeoutMs = Number(opts.timeoutMs || 12000);

  async function callModel(messages) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          temperature: 0.2,
          max_tokens: 400,
          response_format: { type: 'json_object' },
          messages: messages
        }),
        signal: ctl.signal
      });
      if (!res.ok) {
        throw new Error('upstream ' + res.status + ' ' + (await res.text()).slice(0, 200));
      }
      const j = await res.json();
      const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!content) { throw new Error('empty completion'); }
      return parseJson(content);
    } finally {
      clearTimeout(timer);
    }
  }

  return { callModel, baseUrl, model, hasKey: !!apiKey };
}

module.exports = { createLLM };
