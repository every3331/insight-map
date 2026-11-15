/* 洞见 · Agent 后端（Next.js + Vercel AI SDK）
 *
 * 只有一个接口：POST /api/agent
 *   mode = 'diagnose'（默认）→ 结构化诊断：nodeId 被硬限制在候选集内
 *   mode = 'stream'          → 流式讲解（纯文本，给前端边写边显示）
 *   GET  /api/agent          → 健康检查（前端用来判断"在线/离线"）
 *
 * 设计原则（沿用前端那条：模型只做语言理解，不做数学计算）：
 *   1. 知识点只能在候选集里选 —— 选外面直接判失败，前端回落到本地引擎；
 *   2. 输出是 schema 约束的 JSON，前端拿到就能渲染，不用解析自由文本；
 *   3. 任何异常都返回结构化错误，不抛 500 给前端。
 */
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, streamText } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BASE_URL = process.env.AGENT_BASE_URL || 'https://api.deepseek.com/v1';
const API_KEY = process.env.AGENT_API_KEY || '';
const MODEL = process.env.AGENT_MODEL || 'deepseek-chat';

const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS }
  });
}

/* OpenAI 兼容网关（DeepSeek / 通义 / vLLM / one-api）：走 chat/completions 而不是 responses */
const provider = createOpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
const model = () => provider.chat(MODEL);

/* ── 输出契约：和前端 validate() 一一对应 ── */
const DiagnoseSchema = z.object({
  nodeId: z.string(),
  errorType: z.string(),
  confidence: z.number(),
  diagnosis: z.string(),
  verdict: z.enum(['wrong', 'right', 'unclear']).optional(),
  steps: z.array(z.string()).min(2).max(6).optional(),
  trap: z.string().optional(),
  next: z.array(z.string()).max(3).optional()
});

type Candidate = { id: string; label: string; code: string; level: string; prereq?: string };

function buildPrompt(input: any, cands: Candidate[]) {
  const lines = cands
    .map((c) => `  - ${c.id}｜${c.label}｜${c.code}｜${c.level === 'uni' ? '大学' : '高中'}${c.prereq ? '｜前置 ' + c.prereq : ''}`)
    .join('\n');

  return [
    '你是一名跨学段（高中→大学）数学错题诊断助教。',
    '',
    '【第一段已由系统完成：关键词召回得到下面这些候选知识点】',
    lines || '  （无候选，请只做讲解，nodeId 填空字符串）',
    '',
    '你只能从上面的候选里选一个 nodeId，禁止自创、禁止拼错。',
    '错因 errorType 只能取：符号错误 / 概念混淆 / 分类讨论不全 / 换元不当 / 运算跳步 / 条件遗漏 / 定理误用 / 极限判错。',
    '',
    '【学生题目】',
    input.question || '（未提供）',
    '',
    '【学生自己的写法】',
    input.work || '（未提供）',
    '',
    '要求：',
    '1. verdict：学生答对没有（right / wrong / unclear）；',
    '2. diagnosis：一句话说清他真正卡在哪，不要复述题目；',
    '3. steps：2-6 步，每步一句人话，写清算式，能让人照着算出来；',
    '4. trap：这一步最常见的错法，一句；',
    '5. next：最多 3 条下一步建议（例如「先补 5.1 导数概念」）。',
    '不要输出 markdown，不要输出多余解释。'
  ].join('\n');
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  return json({
    ok: true,
    mode: API_KEY ? 'live' : 'no-key',
    model: MODEL,
    baseURL: BASE_URL.replace(/\/v1$/, '/v1'),
    hint: API_KEY ? 'POST /api/agent 即可' : '设置 AGENT_API_KEY 后才会真正调用模型；否则只用候选集约束返回兜底结构'
  });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'body 不是合法 JSON' }, 400);
  }

  const text = String(body?.question || '').trim();
  if (body?.mode !== 'chat' && text.length < 4) { return json({ ok: false, error: '题目太短（至少 4 个字）' }, 400); }

  const cands: Candidate[] = Array.isArray(body?.candidates) ? body.candidates.slice(0, 12) : [];
  const mode = body?.mode === 'chat' ? 'chat' : body?.mode === 'stream' ? 'stream' : 'diagnose';
  const history = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];

  if (!API_KEY) {
    /* 没有 key 也要有结果：返回「结构合法、内容弱一档」的兜底，前端不会崩 */
    return json({
      ok: true,
      source: 'no-key',
      data: {
        nodeId: cands[0]?.id || '',
        errorType: '概念混淆',
        confidence: 0.3,
        diagnosis: '后端还没配置 AGENT_API_KEY，这一条是占位诊断。配置后即可得到真实讲解。',
        verdict: 'unclear',
        steps: ['先读题，写下已知和所求', '再对照这个知识点的定义式'],
        trap: '没有模型时最容易直接代公式，先别急。'
      }
    });
  }

  if (mode === 'chat') {
    const system = [
      '你是耐心中文数学助教，正在和学生一问一答。只讲这一道题及其知识点，用最直白的话，每步写算式，不确定就说不确定。',
      '题目：' + text,
      '学生写法：' + String(body?.work || '（无）'),
      cands.length ? '可涉及知识点：' + cands.map((c) => c.id + '=' + c.label).join('、') : '',
      '回答 240 字以内，不要 markdown 标题。'
    ].filter(Boolean).join('\n');
    const result = streamText({ model: model(), temperature: 0.4, system, messages: history });
    return result.toTextStreamResponse({ headers: CORS });
  }

  if (mode === 'stream') {
    const result = streamText({
      model: model(),
      temperature: 0.3,
      prompt: buildPrompt(body, cands) + '\n\n这次请只输出「讲解正文」：先一句结论，再分步写，最后一句提醒。不要 JSON。'
    });
    return result.toTextStreamResponse({ headers: CORS });
  }

  try {
    const { object } = await generateObject({
      model: model(),
      schema: DiagnoseSchema,
      temperature: 0.2,
      prompt: buildPrompt(body, cands)
    });

    /* 候选集硬边界：模型选了候选之外的，直接判失败，让前端回落本地引擎 */
    if (cands.length && !cands.some((c) => c.id === object.nodeId)) {
      return json({ ok: false, error: 'nodeId 不在候选集', got: object.nodeId, candidates: cands.map((c) => c.id) });
    }
    return json({ ok: true, source: 'model', model: MODEL, data: object });
  } catch (e: any) {
    return json({
      ok: false,
      error: String(e?.message || e).slice(0, 300),
      hint: '检查 AGENT_API_KEY / AGENT_BASE_URL / AGENT_MODEL 是否正确'
    });
  }
}
