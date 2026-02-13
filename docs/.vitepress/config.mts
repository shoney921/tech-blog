import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

function getSidebarFromPosts() {
  const postsDir = path.resolve(__dirname, '../posts')
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md') && f !== 'index.md')

  const posts: { title: string; link: string; category: string; date: string }[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8')
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (!match) continue

    const frontmatter = match[1]
    const title = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? file
    const category = frontmatter.match(/^category:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''
    const date = frontmatter.match(/^date:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''
    const link = `/posts/${file.replace(/\.md$/, '')}`

    posts.push({ title, link, category, date })
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const categoryMap = new Map<string, typeof posts>()
  for (const post of posts) {
    const cat = post.category || '기타'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(post)
  }

  const sidebar: any[] = [
    { text: '전체 글', link: '/' },
  ]

  for (const [category, items] of categoryMap) {
    sidebar.push({
      text: category,
      collapsed: false,
      items: items.map(p => ({ text: p.title, link: p.link })),
    })
  }

  return sidebar
}

export default defineConfig({
  title: 'Shoney Tech Blog',
  description: '개발 경험과 기술 이야기를 공유합니다',
  lang: 'ko-KR',
  cleanUrls: true,
  lastUpdated: false,

  sitemap: {
    hostname: 'https://blog.shoneylife.com',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#5b6af0' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'Shoney Tech Blog' }],
  ],

  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '소개', link: '/about' },
    ],

    sidebar: getSidebarFromPosts(),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shoney' },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '검색', buttonAriaLabel: '검색' },
          modal: {
            displayDetails: '상세 목록 표시',
            resetButtonTitle: '검색 초기화',
            backButtonTitle: '검색 닫기',
            noResultsText: '검색 결과 없음',
            footer: {
              selectText: '선택',
              navigateText: '탐색',
              closeText: '닫기',
            },
          },
        },
      },
    },

    docFooter: {
      prev: '이전 글',
      next: '다음 글',
    },

    outline: {
      label: '목차',
    },


    notFound: {
      title: '페이지를 찾을 수 없습니다',
      quote: '요청하신 페이지가 존재하지 않습니다.',
      linkLabel: '홈으로 돌아가기',
      linkText: '홈으로',
    },

    footer: {
      message: 'Shoney Tech Blog',
      copyright: `© ${new Date().getFullYear()} Shoney. All rights reserved.`,
    },
  },
})
