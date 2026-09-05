---
title: 快速开始
description: 了解如何通过 Decap CMS 后台管理 VitePress 文档站
---

# 快速开始

本文演示了如何通过 Decap CMS 后台管理本站内容。

## 后台入口

在浏览器中打开部署后站点的 `/admin/` 路径（例如 `https://用户名.github.io/仓库名/admin/`），即可进入内容管理后台。

## 可管理的内容

| 内容类型 | 说明 |
| --- | --- |
| 指南文档 | 位于 `docs/guide/` 下的 Markdown 页面 |
| 站点配置 | 站点标题、描述、导航菜单等全局配置 |

## 工作原理

Decap CMS 后台把每次编辑保存为一个 Git 提交：

```
后台编辑 → 写入 Markdown/JSON → 提交到 GitHub → GitHub Actions 自动构建 → 部署上线
```

## 本地预览

```bash
# 安装依赖（首次）
npm install

# 启动本地开发服务器
npm run docs:dev
```

浏览器访问 `http://localhost:5173` 即可预览站点效果。
