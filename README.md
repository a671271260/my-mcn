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
├─ package.json
└─ .gitignore
```

## 一、本地开发

```bash
npm install        # 安装依赖
npm run docs:dev   # 启动开发服务器 http://localhost:5173
npm run docs:build # 生产构建（输出到 docs/.vitepress/dist）
```

## 二、推送 GitHub 并启用后台

Decap CMS 需要 OAuth 认证才能把编辑内容写回 GitHub 仓库，有两条路线：

### 路线 A：GitHub OAuth App（推荐，站点部署在 GitHub Pages）

1. 在 GitHub 新建仓库（例如 `my-docs`），把本目录推送上去：

```bash
git init
git add .
git commit -m "init: VitePress + Decap CMS"
git branch -M main
git remote add origin https://github.com/<你的用户名>/my-docs.git
git push -u origin main
```

2. 部署站点：仓库 `Settings → Pages → Source` 选择 **GitHub Actions**，推送后 Actions 会自动构建发布。

3. 创建 OAuth App：GitHub `Settings → Developer settings → OAuth Apps → New OAuth App`：

| 字段 | 值 |
| --- | --- |
| Application name | 任意，如 `my-docs CMS` |
| Homepage URL | 部署后的站点地址，如 `https://<用户名>.github.io/my-docs/` |
| Authorization callback URL | `https://<用户名>.github.io/my-docs/admin/index.html` |

4. 将 `Client ID` 填入后台 `docs/public/admin/index.html`（`window.CMS_MANUAL_INIT` 配置或通过认证代理），并将 `Client Secret` 配置到你选用的 OAuth 代理服务（GitHub 不支持纯前端保存 Secret，需借助 Netlify Functions、Vercel Serverless 或第三方 OAuth 服务如 [oauth.paperplane.cc](https://oauth.paperplane.cc)）。

5. 修改 `docs/public/admin/config.yml` 中 `repo` 字段为你的仓库名，然后提交推送。

### 路线 B：Netlify 部署（内置身份认证，无需自建 OAuth）

1. 在 [Netlify](https://www.netlify.com) 上 Import 该仓库，构建命令 `npm run docs:build`，输出目录 `docs/.vitepress/dist`。
2. 将 `docs/public/admin/config.yml` 的 `backend` 改为：

```yaml
backend:
  name: git-gateway
  branch: main
```

3. 站点 `Site settings → Identity` 启用身份认证，并到 `Identity → Services → Git Gateway` 勾选启用。
4. 后台 `docs/public/admin/index.html` 中取消注释 Netlify Identity 脚本。
5. 在 Netlify 的站点地址后加 `/admin/` 即可登录使用。

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
