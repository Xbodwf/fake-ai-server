#!/bin/bash

# Fake OpenAI Server 启动脚本
# 先构建前端，再启动后端服务

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "Fake OpenAI Server 启动脚本"
echo "========================================"

# 检查 node 是否存在
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 node，请先安装 Node.js"
    exit 1
fi

# 步骤 1: 构建前端
echo ""
echo "[1/3] 构建前端..."
cd frontend

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install || pnpm install || yarn install
fi

# 构建前端
npm run build || pnpm run build || yarn build

cd "$SCRIPT_DIR"

# 步骤 2: 构建后端
echo ""
echo "[2/3] 构建后端..."
if [ ! -d "node_modules" ]; then
    echo "安装后端依赖..."
    npm install || pnpm install || yarn install
fi

npm run build

# 步骤 3: 启动服务器
echo ""
echo "[3/3] 启动服务器..."
echo "========================================"
npm run start
