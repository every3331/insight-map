洞见 · 跨学段错题地图
========================================

怎么打开？两种方式，任选一种。

【方式 A · 双击就能看】（不需要装任何东西）
   双击 index.html
   浏览器打开后，点页面上的示例「① 导数定义 · 大学」，再点「诊断这道题」。
   这个模式叫「离线演示」，徽标会显示同样的字，功能是完整的。

【方式 B · 一键启动】（推荐，需要电脑里有 Node.js）
   双击 start.bat
   它会自动起服务并打开 http://127.0.0.1:5173
   没装 Node.js 也没关系，它会自动改用方式 A。

----------------------------------------

双击 index.html 没反应怎么办？
   右键 index.html → 打开方式 → 选择 Chrome 或 Edge。

页面打开是空白？
   1. 确认解压是完整的（本文件夹里应该有 index.html / styles.css / data.js / app.js / plot.js / mathfmt.js / server.js / eval.js，外加 server 与 docs 两个文件夹）
   2. 换 Chrome 或 Edge 打开，别用 IE 内核的浏览器

想先看看长什么样，不想操作？
   打开 docs\screenshots\ 文件夹，12 张界面截图都在里面。

----------------------------------------

目录说明
   index.html      入口，双击它
   start.bat       一键启动（可选）
   docs\           演示脚本 + 12 张截图
   README.md       完整说明（如何运行、设计思路、参数）
   server.js       可选后端，只有方式 B 会用到（已分层，实现在 server\ 里）
   eval.js         召回评测，命令行跑（装了 Node 才有用）
   test\           回归测试，命令行跑

技术栈：原生 HTML / CSS / JavaScript，零依赖、零构建。
