#!/bin/bash

# 配置
HOST="47.119.34.66"
USER="root"
DEPLOY_DIR="/var/www/goo"
APP_NAME="goo"

# 构建
echo "Building..."
yarn build

# 检查构建结果
if [ $? -ne 0 ]; then
  echo "构建失败，终止部署"
  exit 1
fi

# 创建部署目录
ssh $USER@$HOST "mkdir -p $DEPLOY_DIR"

# 复制文件
echo "Copying files..."
rsync -avz --delete \
  .next \
  node_modules \
  package.json \
  yarn.lock \
  public \
  prisma \
  $USER@$HOST:$DEPLOY_DIR/

# 在服务器上安装依赖并重启服务
ssh $USER@$HOST "cd $DEPLOY_DIR && \
  yarn prisma generate && \
  pm2 delete $APP_NAME || true && \
  pm2 start 'yarn start' --name $APP_NAME"