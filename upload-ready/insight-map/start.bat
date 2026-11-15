@echo off
chcp 65001 >nul
title 洞见 · 跨学段错题地图
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto NONODE

echo.
echo   洞见 · 跨学段错题地图
echo   --------------------------------
echo   正在启动本地服务，稍后会自动打开浏览器
echo   关闭这个窗口 = 停止服务
echo.

start "" /min cmd /c "node server.js"
timeout /t 2 >nul
start "" "http://127.0.0.1:5173"
goto :EOF

:NONODE
echo.
echo   没有检测到 Node.js —— 这不影响使用。
echo   正在用「离线模式」打开，功能完整，只是诊断走本地引擎。
echo.
start "" "index.html"
goto :EOF
