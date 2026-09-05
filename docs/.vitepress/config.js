import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 读取站点全局配置（可由 Decap CMS 后台编辑）
const siteConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'site-config.json'), 'utf-8')
)

// 部署基路径：GitHub Pages 子路径部署时由 CI 注入，本地默认为根路径
const base = process.env.VITEPRESS_BASE || '/'

// 扫描 docs/guide 目录下的 Markdown 文件，自动生成侧边栏
const guideDir = path.resolve(__dirname, '../guide')

function extractTitle(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  // 优先取 frontmatter 中的 title
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (fmMatch) {
    const title = fmMatch[1].match(/title:\s*(.+)/)
    if (title) return title[1].trim().replace(/^["']|["']$/g, '')
  }
  // 其次取第一个一级标题
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) return h1[1].trim()
  return path.basename(filePath, '.md')
}

function buildGuideSidebar() {
  if (!fs.existsSync(guideDir)) return []
  const files = fs
    .readdirSync(guideDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  return files.map((f) => {
    const name = f.replace(/\.md$/, '')
    return { text: extractTitle(path.join(guideDir, f)), link: `/guide/${name}` }
  })
}

export default defineConfig({
  base,
  title: siteConfig.title,
  description: siteConfig.description,
  lang: siteConfig.lang || 'zh-CN',
  head: [['meta', { name: 'theme-color', content: '#42b883' }]],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: siteConfig.title,
    nav: siteConfig.nav || [],
    sidebar: {
      '/guide/': buildGuideSidebar()
    },
    footer: {
      message: siteConfig.footer || '',
      copyright: `Copyright © ${new Date().getFullYear()}`
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/a671271260/my-mcn' }],
    search: {
      provider: 'local'
    },
    outline: { level: [2, 3], label: '本页导航' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'full', timeStyle: 'medium' } },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '语言'
  }
})
