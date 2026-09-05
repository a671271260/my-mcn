# VitePress + Decap CMS 文档站

一个自带可视化内容管理后台的 VitePress 文档站模板：用 Markdown 写作，通过浏览器后台编辑，推送 GitHub 后自动构建部署到 GitHub Pages。

## 功能特性

- 📝 **VitePress 文档站**：指南页面自动生成侧边栏，内置本地搜索
- 🎛️ **Decap CMS 后台**：访问 `/admin/` 即可在浏览器中编辑内容
- 📂 **两大内容集合**：指南文档（Markdown 页面）与站点全局配置（标题/导航/页脚）
- 🚀 **自动部署**：GitHub Actions 构建并发布到 GitHub Pages

## 目录结构

```
vitepress-cms-site/
├─ docs/                          # VitePress 站点根目录
│  ├─ .vitepress/
│  │  ├─ config.js               # VitePress 主配置
│  │  └─ site-config.json        # 站点全局配置（后台可编辑 ⭐）
│  ├─ public/
│  │  ├─ logo.svg
│  │  └─ admin/                  # Decap CMS 后台
│  │     ├─ index.html           # 后台入口页面
│  │     └─ config.yml           # CMS 内容集合配置 ⭐
│  ├─ index.md                    # 站点首页
│  └─ guide/                      # 指南文档（后台可编辑 ⭐）
│     ├─ index.md
│     └─ getting-started.md
├─ .github/workflows/deploy.yml  # GitHub Pages 自动部署
├─ decap-oauth-worker/           # GitHub OAuth 代理（Cloudflare Worker）
│  ├─ src/index.ts              # Worker 源码（wrangler 部署用）
│  ├─ wrangler.toml
│  └─ worker-dashboard.js       # 控制台手动粘贴版（备用）
├─ package.json
└─ .gitignore
```

## 一、本地开发

```bash
npm install        # 安装依赖
npm run docs:dev   # 启动开发服务器 http://localhost:5173
npm run docs:build # 生产构建（输出到 docs/.vitepress/dist）
```

## 二、线上部署与后台（已配置完成）

本项目已配置好以下线上资源：

| 资源 | 地址 |
| --- | --- |
| 文档站点 | https://a671271260.github.io/my-mcn/ |
| CMS 后台 | https://a671271260.github.io/my-mcn/admin/ |
| OAuth Worker | https://decap-oauth.671271260.workers.dev |
| GitHub 仓库 | https://github.com/a671271260/my-mcn |

### 自动部署链路

推送 `main` 分支 → GitHub Actions 构建 → 部署到 GitHub Pages，全程无需手动操作。

### OAuth 认证链路

后台 → `decap-oauth` Worker `/auth` → GitHub OAuth App → `/callback` 回传令牌 → CMS 读写仓库。

- GitHub OAuth App：在 GitHub Developer settings 中管理（Client ID 已配置到 Worker 密钥）
- Worker 密钥：`GITHUB_OAUTH_ID`、`GITHUB_OAUTH_SECRET` 以加密 Secret 形式存于 Cloudflare
- 仓库为公开仓库，OAuth scope 使用 `public_repo,user`

### 更新 OAuth Worker（如需改代码）

```bash
cd decap-oauth-worker
npm install
npx wrangler login   # 浏览器授权一次
npx wrangler deploy  # 部署新代码
```


## 三、后台使用

| 操作 | 说明 |
| --- | --- |
| 编辑指南页 | 后台 →「指南文档」→ 新建/编辑，保存即提交到 Git |
| 修改站点配置 | 后台 →「站点配置」→ 修改标题/导航/页脚 |
| 上传图片 | 编辑器中图片部件上传，存入 `docs/public/media/` |

保存后内容自动 commit 到 `main` 分支，触发 GitHub Actions 重新部署，几分钟内上线。

## 四、常见问题

**为什么本地 `/admin/` 打不开？**
开发模式下直接访问 `http://localhost:5173/admin/index.html` 即可预览后台界面；CMS 的功能（登录、读写仓库）需要部署到线上并配置好 OAuth 才能使用。

**修改了 `config.yml` 后后台没变化？**
Decap CMS 会在加载时抓取该文件，刷新页面即可；若改了集合结构建议强制刷新（Ctrl+F5）。

**侧边栏不会自动更新？**
指南侧边栏由 `docs/.vitepress/config.js` 在启动/构建时扫描 `docs/guide/` 自动生成，新增页面后重启 `docs:dev` 或重新构建即可。
