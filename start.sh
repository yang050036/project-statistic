#!/bin/bash

set -e

PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$PROJECT_DIR"

echo "====================================="
echo "  项目统计系统启动脚本"
echo "====================================="

MODE="${1:-development}"

if [ ! -d "node_modules" ]; then
    echo "[INFO] 正在安装依赖..."
    npm install
fi

if [ "$MODE" = "production" ]; then
    echo "[INFO] 编译前端项目..."
    ./node_modules/.bin/vite build
    
    echo "[INFO] 启动生产模式服务..."
    NODE_ENV=production ./node_modules/.bin/nodemon --watch api --ext ts api/server.ts
else
    echo "[INFO] 启动开发模式..."
    ./node_modules/.bin/concurrently "./node_modules/.bin/vite" "./node_modules/.bin/nodemon --watch api --ext ts api/server.ts"
fi
