@echo off
chcp 936 >nul 2>nul
cd /d "%~dp0web"
title Dongjian Agent Backend

if not exist ".env.local" (
  echo [i] 没找到 .env.local，正在从 .env.example 复制...
  copy ".env.example" ".env.local" >nul
  echo     请先编辑 web\.env.local 填入 AGENT_API_KEY
)

if not exist "node_modules" (
  echo [*] 首次运行，正在安装依赖（需要几分钟）...
  set npm_config_cache=%~dp0web\.npm-cache
  call npm install --no-audit --no-fund
)

echo.
echo [*] 启动 Agent 后端：http://127.0.0.1:3100
echo     健康检查：http://127.0.0.1:3100/api/agent
echo     保持这个窗口不要关
echo.
start "" "http://127.0.0.1:3100/api/agent"
call npm run dev
