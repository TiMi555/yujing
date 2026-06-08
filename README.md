# 寓境 MVP

寓言式学习微信小程序 — Uni-app + Koa2 + PostgreSQL + 火山方舟

## 目录结构

```
yujing/
├── server/          # Koa2 API
├── miniapp/         # Uni-app 微信小程序
├── docker-compose.yml
└── .env.example
```

## 本地开发

### 1. 环境变量

```bash
cp .env.example .env
# 编辑 VOLCENGINE_API_KEY 等
```

### 2. 启动数据库

```bash
docker compose up -d postgres
```

### 3. 后端

```bash
cd server
npm install
npm run migrate
npm run dev
# http://localhost:3000/health
```

### 4. 小程序

```bash
cd miniapp
npm install
npm run dev:mp-weixin
```

微信开发者工具打开 `miniapp/dist/dev/mp-weixin`，勾选「不校验合法域名」。  
修改 `miniapp/src/config.js` 中的 `BASE_URL` 为本机 IP（真机调试时）。

### 5. 内测灌库（需配置 LLM）

```bash
cd server
npm run seed
```

### 6. Admin

浏览器打开 `http://localhost:3000/admin`，输入 `.env` 中 `ADMIN_API_KEY`。

## ECS 部署（2C2G）

见 [deploy/DEPLOY.md](./deploy/DEPLOY.md)

## 需求文档

- [03-需求文档/寓境/需求文档.md](../../03-需求文档/寓境/需求文档.md)
- [Codex开发任务.md](../../03-需求文档/寓境/Codex开发任务.md)
