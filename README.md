# 寓言 MVP

寓言式学习微信小程序，包含后端服务、两套前端工程和部署文档。

## 当前约定

- **默认主线**：`miniapp/`
- **候选主线**：`miniAPP-V2/`
- **后端服务**：`server/`
- **部署相关**：`deploy/`
- **说明文档**：`docs/`

`miniapp/` 和 `miniAPP-V2/` 可以并存，但它们是两套独立工程，不能混用源码目录、构建产物和开发者工具导入目录。

## 目录结构

```text
projects/yujing/
├── server/                # Koa2 API
├── miniapp/               # 当前默认前端主线（Uni-app）
├── miniAPP-V2/            # 候选主线前端（独立小程序工程）
├── deploy/                # ECS / Nginx / 部署脚本
├── docs/                  # 规范、验收、联调说明
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── HANDOFF.md
```

## 开发约定

### `server/`
后端只负责 API、数据库迁移、种子数据和认证逻辑。

### `miniapp/`
当前联调和微信开发者工具导入默认使用这个目录。

- `src/` 是源码
- `dist/build/mp-weixin/` 是构建产物
- `devtools-ready/` 是给微信开发者工具导入的同步目录

### `miniAPP-V2/`
这是另一套独立小程序工程，后续会作为主线候选继续演进。

- 目录内部自成一体
- 不借用 `miniapp/` 的构建产物
- 不和 `miniapp/` 混写同一套运行时目录

## 本地开发

### 后端

```bash
cd projects/yujing/server
npm install
npm run migrate
npm run dev
```

### 当前前端主线

```bash
cd projects/yujing/miniapp
npm install
npm run build:mp-weixin
```

构建后把 `dist/build/mp-weixin/` 同步到 `devtools-ready/`，然后在微信开发者工具里导入 `devtools-ready/`。

### 候选前端主线

直接用微信开发者工具导入 `projects/yujing/miniAPP-V2/`，按它自己的工程结构开发和编译。

## 相关文档

- [目录规范](./docs/DIRECTORY.md)
- [验收清单](./docs/ACCEPTANCE.md)
