# 基础镜像层 - 共享 yarn 配置
FROM node:24-alpine AS base
RUN corepack enable && yarn config set registry https://registry.npmmirror.com

# 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile && yarn cache clean

# 构建阶段
FROM deps AS builder
COPY tsconfig.json tsconfig.backend.json tsconfig.frontend.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/
RUN yarn build

# 生产阶段
FROM base AS production
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --production --frozen-lockfile && yarn cache clean && rm -rf /tmp/*
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data
EXPOSE 7143
ENV NODE_ENV=production
ENV PORT=7143
CMD ["node", "dist/index.js"]