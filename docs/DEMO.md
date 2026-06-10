# Demo 页面约定

## 目的

用于先放置和验证 `canvas` demo HTML，之后再决定是否把 demo 的交互逻辑迁移到正式业务页面。

## 放置位置

推荐放在 `miniAPP-V2/demo/` 下。

原因：

- 它是独立候选主线工程
- demo 不会污染当前默认主线 `miniapp/`
- 以后正式开发时，可以直接从 demo 原型收敛到正式页面

## 目录建议

```text
miniAPP-V2/
├── demo/
│   ├── canvas-demo.html
│   └── README.md
└── miniprogram/
```

## 使用方式

1. 先把 demo HTML 放到 `miniAPP-V2/demo/`
2. demo 确认后，再拆成真实页面结构
3. 正式开发时，把 canvas 交互代码迁到小程序页面或组件中

## 约束

- demo HTML 只作为原型和参考，不作为正式发布入口
- demo 页面可以自由试验布局和画布交互
- 正式业务页面开发前，优先把 demo 的行为拆成可复用组件
