#!/bin/sh

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "错误: DATABASE_URL 环境变量未设置"
  exit 1
fi

# 生成 Prisma 客户端
echo "生成 Prisma 客户端..."
npx prisma generate

# 初始化数据库
echo "初始化数据库..."
echo "使用数据库 URL: $DATABASE_URL"
node scripts/init-database.js

# 启动应用
echo "启动应用..."
exec node server.js 