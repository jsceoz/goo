#!/bin/bash

# 配置
HOST="47.119.34.66"
USER="root"
DEPLOY_DIR="/var/www/goo"
APP_NAME="goo"

# 确认操作
echo "警告：此操作将重置服务器上的数据库，所有数据将被清除。"
read -p "是否继续？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "操作已取消"
    exit 1
fi

# 停止应用
ssh $USER@$HOST "cd $DEPLOY_DIR && pm2 stop $APP_NAME"

# 复制数据库文件和迁移文件
echo "正在同步数据库文件..."
rsync -avz --delete \
  prisma/migrations \
  prisma/schema.prisma \
  prisma/dev.db \
  $USER@$HOST:$DEPLOY_DIR/prisma/

# 在服务器上重新生成 Prisma 客户端并重启服务
ssh $USER@$HOST "cd $DEPLOY_DIR && \
  yarn prisma generate && \
  pm2 restart $APP_NAME"

echo "数据库重置完成"

# 清空现有数据
echo "清空现有数据..."
node scripts/clear-database.js

# 删除现有迁移记录
echo "删除迁移记录..."
rm -rf prisma/migrations

# 重新生成迁移
echo "生成新的迁移..."
npx prisma migrate dev --name init

# 初始化基础数据
echo "初始化基础数据..."
node scripts/init-database.js

echo "数据库重置完成！"