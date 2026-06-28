#!/bin/zsh
# 公途 · Mac 启动脚本
# 双击运行：启动后端服务 → 等待3秒 → 自动打开浏览器
# 按 Ctrl+C 停止服务

# 1. 获取当前目录（项目根目录）
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 2. 设置数据库和日志路径（使用项目目录，永久保存）
export GONTU_DB_PATH="$PROJECT_DIR/backend/data.db"
export GONTU_LOG_DIR="$PROJECT_DIR/backend/logs"
mkdir -p "$PROJECT_DIR/backend/logs"

# 3. 如果 /tmp 有修复过的数据，同步到项目目录（覆盖旧文件）
if [ -f /tmp/gontu/data.db ]; then
    cp /tmp/gontu/data.db "$PROJECT_DIR/backend/data.db"
    echo "✅ 数据已同步到项目目录"
fi

# 4. Python 解释器路径（venv）
PYTHON="/Users/xixi/Workbuddy/2026-06-28-19-13-40/venv/bin/python"

# 5. 启动后端服务（后台）
cd "$PROJECT_DIR/backend"
echo "🚀 正在启动公途后端服务..."
echo "   数据库: $GONTU_DB_PATH"
echo "   日志:   $GONTU_LOG_DIR"
echo "   端口:   8888"
echo ""

nohup $PYTHON -m uvicorn main:app --host 127.0.0.1 --port 8888 > "$GONTU_LOG_DIR/server.log" 2>&1 &

# 6. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 7. 自动打开浏览器
echo "🌐 正在打开浏览器..."
open http://127.0.0.1:8888

# 8. 显示日志，保持终端打开
echo ""
echo "────────────────────────────────────"
echo "  ✅ 服务已启动，端口: 8888"
echo "  📝 正在显示日志（按 Ctrl+C 停止）"
echo "────────────────────────────────────"
echo ""

tail -f "$GONTU_LOG_DIR/server.log"
