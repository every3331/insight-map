# 洞见 · Agent 后端（Next.js + Vercel AI SDK）

一个接口：`POST /api/agent`。

## 跑起来

```powershell
cd web
copy .env.example .env.local     # 填 AGENT_API_KEY
npm install
npm run dev                      # http://127.0.0.1:3100
```

没配 key 也能跑：接口会返回「结构合法、内容弱一档」的兜底诊断，前端不会崩。

## 接口

| 方法 | 说明 |
|---|---|
| `GET /api/agent` | 健康检查，返回 `{ ok, mode: 'live'|'no-key', model }` |
| `POST /api/agent` `mode=diagnose` | 结构化诊断（JSON），nodeId 被硬限制在 candidates 内 |
| `POST /api/agent` `mode=stream` | 流式讲解（纯文本） |

请求体：

```json
{ "question": "...", "work": "...", "candidates": [{ "id": "limit", "label": "极限", "code": "1.3", "level": "uni" }] }
```

## 为什么只有一个接口

前端只关心两件事：**这次诊断的结论**（结构化，直接渲染）和**讲解正文**（流式，边写边看）。
其余全部在服务端完成：候选集约束、schema 校验、错误兜底、跨域。
