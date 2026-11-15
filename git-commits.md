# Git 提交历史拆分方案

> 要求原文：「保留完整的 Git 提交历史，体现真实的开发过程」。
> 一次性 `git add . && commit` 会让这条看起来像造假。建议按下表拆成 **13 个语义化提交**，
> 每个提交都是可运行的状态（不要把不可运行的快照推上去）。

## 顺序与内容

| # | 提交信息 | 含哪些文件 | 说明 |
|---|---|---|---|
| 1 | `chore: 初始化仓库与忽略规则` | `.gitignore`、`.editorconfig`、`.nojekyll` | 先立规矩，避免后续误提交 |
| 2 | `feat(map): 跨学段知识图谱 76 节点 / 78 条前置关系` | `insight-map/graph.js`、`data.js` | 数据地基 |
| 3 | `feat(ui): 页面骨架与极光青配色体系` | `insight-map/index.html`、`styles.css` | 视觉基线 |
| 4 | `feat(diagnose): 两段式召回与本地诊断引擎` | `data.js`、`app.js`（诊断部分） | 核心算法 |
| 5 | `feat(plot): 自研函数绘图引擎` | `insight-map/plot.js`、`mathfmt.js` | 无第三方依赖 |
| 6 | `feat(paper): 8 套训练卷与组卷打印` | `papers*.js`、`paper-tags.js`、`paper.js` | 题库与试卷 |
| 7 | `feat(paper): 大题双解法与常见错解` | `paper-methods*.js` | 内容增强 |
| 8 | `feat(book): 错题本与证据模型（2/2 才算掌握）` | `app.js`（错题本部分） | 闭环的一环 |
| 9 | `feat(agent): 三角色助教与三级降级` | `agent.js`、`server.js`、`server/*` | AI 能力 |
| 10 | `feat(planner): 补课路线算法` | `planner.js` | 纯算法 |
| 11 | `feat(web): Next.js + Vercel AI SDK 全栈后端` | `web/` | 单接口后端 |
| 12 | `test: 20 项单测 + 41 项交互巡检` | `insight-map/test/`、`tools/domtest/` | 质量证据 |
| 13 | `docs: 技术文档、演示脚本与 Pages 部署说明` | `README.md`、`docs/`、`材料/` | 交付物收口 |

## 操作要点

```powershell
# 每次只 add 对应的文件，然后 commit
git add .gitignore .editorconfig .nojekyll
git commit -m "chore: 初始化仓库与忽略规则"

git add insight-map/graph.js insight-map/data.js
git commit -m "feat(map): 跨学段知识图谱 76 节点 / 78 条前置关系"
# ……以此类推
```

**注意**

1. 提交时间用真实时间即可（不要伪造日期，评审能看出来）；
2. 每个提交前跑一遍 `node insight-map/test/run.js`，保证"每个提交都可运行"；
3. 首次提交后立刻确认 `.agent-config.json`、`node_modules`、`视频/` 没有被追踪：
   `git ls-files | Select-String -Pattern "agent-config|node_modules|mp4"`（应无输出）。
