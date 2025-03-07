#!/bin/bash

# 设置变量
REGISTRY="registry.cn-shenzhen.aliyuncs.com"
NAMESPACE="jsceoz-docker-hub"
IMAGE_NAME="goo-images"
ALIYUN_USERNAME="jsceoz@qq.com"
ALIYUN_PASSWORD="wlhao123com"

TAG=$(date +%Y%m%d_%H%M%S)

# 构建Docker镜像
echo "开始构建Docker镜像..."
docker build --platform linux/amd64 -t $REGISTRY/$NAMESPACE/$IMAGE_NAME:$TAG .

# 登录阿里云容器仓库
echo "登录阿里云容器仓库..."
docker login --username=$ALIYUN_USERNAME --password=$ALIYUN_PASSWORD $REGISTRY

# 推送镜像到阿里云
echo "推送镜像到阿里云容器仓库..."
docker push $REGISTRY/$NAMESPACE/$IMAGE_NAME:$TAG

# 标记为最新版本
docker tag $REGISTRY/$NAMESPACE/$IMAGE_NAME:$TAG $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest
docker push $REGISTRY/$NAMESPACE/$IMAGE_NAME:latest

echo "部署完成！"
echo "镜像地址: $REGISTRY/$NAMESPACE/$IMAGE_NAME:$TAG"