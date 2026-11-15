#!/usr/bin/env node
/* 洞见 · 最小后端（零依赖）
 *
 * 分层（每一层都能被将来的 agent 直接复用）：
 *   server/validate.js  输出契约：四条规则 + 候选集硬边界
 *   server/prompt.js    两段式的第二段：候选集动态生成提示词
 *   server/llm.js       OpenAI 兼容网关调用（DeepSeek / 通义 / vLLM / one-api）
 *   server/cache.js     sha256 键 + 落盘缓存（演示现场最稳的一条路）
 *   server/diagnose.js  编排：缓存 → 模型（含一次修复重试）→ 本地兜底
 *   server/static.js    静态托管 + 统一响应封装
 *   server/app.js       路由 + CORS + 请求体读取
 *
 * 本文件只做两件事：读环境变量、把上面几层装配起来。
 *
 * 启动：
 *   node server.js
 *   $env:LLM_API_KEY="sk-..."   # 可选，不配就走本地兜底
 *   $env:LLM_MODEL="gpt-4o-mini"
 *   $env:LLM_BASE_URL="https://api.openai.com/v1"
 */

'use strict';

const path = require('path');
const DATA = require('./data.js');
const { createLLM } = require('./server/llm');
const { createCache } = require('./server/cache');
const { createDiagnoser } = require('./server/diagnose');
const { createApp } = require('./server/app');
const { createAgent } = require('./server/agent');

const PORT = Number(process.env.PORT || 5173);
const ROOT = __dirname;

const llm = createLLM({
  baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4o-mini',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 12000)
});

const agent = createAgent({
  data: DATA,
  configFile: path.join(ROOT, '.agent-config.json'),
  baseUrl: process.env.AGENT_BASE_URL || process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1',
  apiKey: process.env.AGENT_API_KEY || process.env.LLM_API_KEY || '',
  model: process.env.AGENT_MODEL || process.env.LLM_MODEL || 'deepseek-chat'
});

const cache = createCache(path.join(ROOT, 'cache.json'));
const diagnoser = createDiagnoser({ data: DATA, llm: llm, cache: cache });
const { server } = createApp({ data: DATA, diagnoser: diagnoser, llm: llm, cache: cache, root: ROOT, agent: agent });

server.listen(PORT, () => {
  console.log('洞见 · 知识地图  →  http://127.0.0.1:' + PORT);
  console.log('  模型：' + (llm.hasKey ? llm.model + ' @ ' + llm.baseUrl : '未配置 LLM_API_KEY（走本地兜底）'));
  console.log('  缓存：' + cache.size() + ' 条  (' + path.join(ROOT, 'cache.json') + ')');
  console.log('  知识库：' + DATA.NODES.length + ' 节点 · ' + Object.keys(DATA.VARIANTS).length + ' 组变式 · ' + Object.keys(DATA.PROBES).length + ' 个探针');
});
