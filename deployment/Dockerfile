# 使用 Node.js 18 作为基础镜像
FROM node:18-slim AS builder

# 设置工作目录
WORKDIR /app

# 复制配置文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm install

# 复制源码
COPY . .

# 执行构建 (输出到 dist/server.js)
RUN npm run build:node

# --- 运行阶段 ---
FROM node:18-slim

WORKDIR /app

# 只要生产依赖（特别是 better-sqlite3）
COPY package*.json ./
RUN npm install --omit=dev

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/schema.sql ./

# 静态资源处理
# 如果你的项目是通过 admin.html 字符串嵌入的，则不需要额外复制 static
# 但为了稳妥起见，复制可能需要的静态资源
COPY --from=builder /app/src/static ./src/static

# 环境配置预留 (可以通过 -e 覆盖)
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server.js"]
