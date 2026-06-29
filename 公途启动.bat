@echo off
chcp 65001 >nul
title 公途学习平台

:: 切换到脚本所在目录
cd /d "%~dp0"

echo ========================================
echo   公途学习平台
echo ========================================
echo.

:: 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 检查依赖
echo [检查] 正在检查依赖...
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo [安装] 正在安装依赖...
    pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

:: 启动服务
echo [启动] 正在启动后端服务...
echo.
echo 服务地址: http://localhost:8888
echo 按 Ctrl+C 停止服务
echo.

python start_gontu.py --open

pause
