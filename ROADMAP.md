# yujing ROADMAP

> 寓言式学习微信小程序，包含 Koa2 后端、当前小程序主线 `miniapp/`、候选主线 `miniAPP-V2/` 和部署文档。

## 项目状态

- 状态：active
- 优先级：P1
- 当前阶段：小程序开发 / 后端联调 / DevTools 验收
- 默认工作目录：`projects/yujing/`
- AI 入口：`README.md`、`docs/ACCEPTANCE.md`、`docs/DIRECTORY.md`

## 当前目标

1. 明确 `miniapp/` 当前主线与 `miniAPP-V2/` 候选主线的边界，避免混用源码和构建产物。
2. 小程序 bug 先查根因，再让 Agent 修改。
3. 验收优先读取已打开的微信 DevTools 控制台，不要每次重开。

## 近期任务池

| 优先级 | 任务 | 类型 | 可并行 | 验收方式 | 备注 |
|---|---|---|---|---|---|
| P1 | 小程序 bug 根因修复 | bug | depends | DevTools 控制台 + 真实页面验证 | 先定位再改 |
| P1 | `miniapp/` 与后端联调 | feature / bug | partial | API + 小程序页面验证 | 注意环境和构建目录 |
| P1 | `miniAPP-V2/` 候选主线验证 | prototype / feature | partial | 微信开发者工具导入验证 | 不与 `miniapp/` 混写 |
| P2 | 部署文档和验收清单补齐 | doc | yes | docs review | 可并行 |

## 已知风险 / Blocker

- `miniapp/` 和 `miniAPP-V2/` 是两套独立工程，不能混用源码、构建产物、DevTools 导入目录。
- 小程序问题如果只看代码不看 DevTools 控制台，容易误判。
- 后端/配置改动后需要部署 ECS、跑 migration（如有）、验证公网接口。

## 验收命令

```bash
# 后端
cd projects/yujing/server
npm run migrate
npm run dev

# 当前小程序主线
cd projects/yujing/miniapp
npm run build:mp-weixin
```

最终验收以微信 DevTools 控制台和真实页面表现为准。

## 部署 / 线上验证

- 环境：local / ECS 视任务而定
- migration：后端 schema 变更时必须确认
- 公网验证：后端变更后先验证 API，再让小程序测线上

## Agent 注意事项

- 允许修改：明确任务范围内的 `server/`、`miniapp/`、`miniAPP-V2/`、`docs/`。
- 禁止修改：`.env*`、密钥、token、AppID、provider config、无关文件。
- 新功能可以让 Cursor/Codex 大改，但 bug 必须先查根因。
