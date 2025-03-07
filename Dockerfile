# 构建阶段
FROM --platform=linux/amd64 node:18-alpine AS builder
WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock ./
COPY node_modules ./node_modules
COPY prisma ./prisma

# 复制源代码并构建
COPY . .
RUN yarn build

# 生产阶段
FROM --platform=linux/amd64 node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV DATABASE_URL=""

# 复制所有必要文件
COPY node_modules ./node_modules
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY data ./data
COPY scripts ./scripts
COPY package.json yarn.lock ./
COPY prisma ./prisma

# 设置启动脚本权限
RUN chmod +x scripts/start.sh

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000

CMD ["sh", "scripts/start.sh"]