---
layout: home

hero:
  name: "VitePress CMS 文档站"
  text: "基于 Decap CMS 的内容管理后台"
  tagline: VitePress + Decap CMS：用 Markdown 写作，用可视化后台管理，推送到 Git 自动发布
  image:
    src: /logo.svg
    alt: VitePress
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 管理后台
      link: /admin/
      target: _self

features:
  - icon: 📝
    title: Markdown 写作
    details: 所有页面均为 Markdown 文件，存放在 Git 仓库中，方便版本管理与协作。
  - icon: 🎛️
    title: 可视化后台
    details: 登录 /admin/ 即可在浏览器中编辑内容，无需本地环境，修改后自动提交到 Git。
  - icon: 🚀
    title: 自动发布
    details: 提交代码后由 GitHub Actions 自动构建并部署到 GitHub Pages。
---
