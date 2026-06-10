# AGENTS.md

> 给 Hermes / Codex / Cursor / 其他代码 Agent 的项目执行规则。进入本项目后，先读 `README.md`、`ROADMAP.md`、`docs/DIRECTORY.md`、`docs/ACCEPTANCE.md`。

## 项目定位

寓境 / 寓言 MVP：寓言式学习微信小程序，包含：

- `server/`：Koa2 API、数据库迁移、种子数据、认证逻辑。
- `miniapp/`：当前默认小程序主线，基于 Uni-app。
- `miniAPP-V2/`：候选主线，独立小程序工程。
- `deploy/`：ECS / Nginx / 部署脚本和说明。
- `docs/`：目录规范、验收清单、联调说明。

## 默认主线规则

1. 当前联调和微信开发者工具导入默认使用 `miniapp/`。
2. `miniAPP-V2/` 是候选主线，除非任务明确点名，否则不要把它当当前主线。
3. `miniapp/` 与 `miniAPP-V2/` 是两套独立工程：
   - 不混用源码目录；
   - 不混用构建产物；
   - 不混用微信开发者工具导入目录；
   - 切主线必须显式迁移，不做悄悄替换。

## Agent 调度规则

1. Hermes 负责拆任务、分配工具、验收和部署验证。
2. Codex / Cursor 不固定前端或后端角色，按任务文件范围、上下文和风险分配。
3. Bug 必须先查根因，再修改；不要让 Agent 直接大改猜修。
4. 新功能可以让单个 Agent 分段实现，或在文件边界清晰时并行。
5. 同一状态流、同一页面主链路、同一 migration 默认串行，不并行抢文件。

## 允许修改范围

按任务限定，常见范围：

- 后端任务：`server/`
- 当前小程序任务：`miniapp/src/`
- 当前小程序构建/导入：`miniapp/dist/`、`miniapp/devtools-ready/`（仅在构建/同步任务中）
- 候选主线任务：`miniAPP-V2/`（必须被明确点名）
- 部署任务：`deploy/`
- 文档任务：`README.md`、`ROADMAP.md`、`docs/`

## 禁止修改范围

未经明确授权不得修改：

- `.env*`、密钥、token、AppID、provider config。
- 与任务无关的文件。
- 两套小程序工程的另一套目录。
- 大范围格式化、依赖升级、框架迁移。
- 生产数据、线上配置、ECS 部署脚本的破坏性操作。

## 本地开发命令

### 后端

```bash
cd projects/yujing/server
npm install
npm run migrate
npm run dev
```

### 当前小程序主线

```bash
cd projects/yujing/miniapp
npm install
npm run build:mp-weixin
```

构建后将 `dist/build/mp-weixin/` 同步到 `devtools-ready/`，微信开发者工具导入 `devtools-ready/`。

### 候选主线

直接用微信开发者工具导入：

```text
projects/yujing/miniAPP-V2/
```

按它自己的工程结构开发和编译。

## 验收规则

1. 后端改动：至少跑相关测试/启动检查/API 验证。
2. 小程序改动：最终以微信 DevTools 控制台和真实页面表现为准。
3. 如果 DevTools 已打开，优先直连读取控制台，不要每次重开。
4. 后端/配置/数据库改动后，如果要测线上，必须先部署 ECS、跑 migration（如有）、验证公网接口，再让小程序测。
5. 不允许只改本地后端，让小程序指向线上后端后出现 404/401。

## 验收清单入口

MVP 功能验收见：`docs/ACCEPTANCE.md`。

重点路径：

- 首页空态。
- 路径 B 新生成。
- 路径 B 缓存复用。
- 并发等待。
- 低置信度确认。
- 登录与藏书阁。
- 分享。
- Admin。
- 失败处理。

## 输出要求

Agent 完成任务后必须报告：

```markdown
## 完成情况
- [完成/部分完成/未完成]

## 修改文件
- `path`: 改了什么，为什么

## 验证结果
- `command`: 结果摘要
- DevTools/API/页面验证：结果摘要

## 风险与阻塞
- [剩余风险、失败原因、需要 Hermes 决策的点]

## 是否需要后续动作
- [是否需要 Hermes 部署 / migration / 公网验证 / 用户确认]
```
