import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { categories, getCategoryLabel } from './categories'
import type { Category } from './categories'
import { genFeed } from './genFeed'

interface PostEntry {
  title: string
  link: string
  date: string
}

function scanPosts(dir: string, baseUrl: string, recursive = true): PostEntry[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const posts: PostEntry[] = []

  for (const entry of entries) {
    if (recursive && entry.isDirectory()) {
      posts.push(...scanPosts(path.join(dir, entry.name), `${baseUrl}/${entry.name}`))
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8')
      const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
      if (!match) continue

      const frontmatter = match[1]
      const title = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? entry.name
      const date = frontmatter.match(/^date:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''

      posts.push({ title, link: `${baseUrl}/${entry.name.replace(/\.md$/, '')}`, date })
    }
  }

  return posts
}

function buildSidebarCategory(cat: Category, postsDir: string, baseUrl: string): any | null {
  const catDir = path.join(postsDir, cat.id)
  if (!fs.existsSync(catDir)) return null

  // children이 있으면 직접 .md만 스캔 (하위 디렉토리는 children이 처리)
  const posts = cat.children
    ? scanPosts(catDir, `${baseUrl}/${cat.id}`, false)
    : scanPosts(catDir, `${baseUrl}/${cat.id}`)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const items: any[] = posts.map(p => ({ text: p.title, link: p.link }))

  // 서브카테고리 처리
  if (cat.children) {
    for (const child of [...cat.children].sort((a, b) => a.order - b.order)) {
      const childSection = buildSidebarCategory(child, catDir, `${baseUrl}/${cat.id}`)
      if (childSection) items.push(childSection)
    }
  }

  if (items.length === 0) return null

  return {
    text: cat.label,
    collapsed: false,
    items,
  }
}

function getSidebarFromPosts() {
  const postsDir = path.resolve(__dirname, '../posts')
  const sidebar: any[] = [
    { text: '전체 글', link: '/' },
  ]

  // categories.ts에 정의된 카테고리 순서대로
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)
  const knownIds = new Set(categories.map(c => c.id))

  for (const cat of sortedCategories) {
    const section = buildSidebarCategory(cat, postsDir, '/posts')
    if (section) sidebar.push(section)
  }

  // categories.ts에 없는 디렉토리 → "기타"
  const dirs = fs.readdirSync(postsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !knownIds.has(d.name))

  if (dirs.length > 0) {
    const etcPosts: PostEntry[] = []
    for (const dir of dirs) {
      etcPosts.push(...scanPosts(path.join(postsDir, dir.name), `/posts/${dir.name}`))
    }
    if (etcPosts.length > 0) {
      etcPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      sidebar.push({
        text: '기타',
        collapsed: false,
        items: etcPosts.map(p => ({ text: p.title, link: p.link })),
      })
    }
  }

  return sidebar
}

export default defineConfig({
  title: '삽질 테크 블로그',
  description: '개발 경험과 기술 이야기를 공유합니다',
  lang: 'ko-KR',
  cleanUrls: true,
  lastUpdated: false,

  sitemap: {
    hostname: 'https://blog.shoneylife.com',
  },

  buildEnd: genFeed,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#5b6af0' }],
    ['meta', { property: 'og:site_name', content: '삽질 테크 블로그' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { property: 'og:image', content: 'https://blog.shoneylife.com/og-image.svg' }],
    ['meta', { name: 'twitter:image', content: 'https://blog.shoneylife.com/og-image.svg' }],
    ['meta', { name: 'twitter:site', content: '@shoney' }],
    ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'RSS', href: '/feed.xml' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Intel+One+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap', rel: 'stylesheet' }],
  ],

  transformHead({ pageData }) {
    const head: Array<[string, Record<string, string>] | [string, Record<string, string>, string]> = []
    const siteHostname = 'https://blog.shoneylife.com'
    const pageUrl = `${siteHostname}/${pageData.relativePath.replace(/((^|\/)index)?\.md$/, '')}`

    // Canonical URL
    head.push(['link', { rel: 'canonical', href: pageUrl }])

    // Per-page Open Graph
    const title = pageData.frontmatter.title || pageData.title
    const description = pageData.frontmatter.description || pageData.description || '개발 경험과 기술 이야기를 공유합니다'
    const isPost = pageData.relativePath.startsWith('posts/') && pageData.relativePath !== 'posts/index.md'

    head.push(['meta', { property: 'og:title', content: title }])
    head.push(['meta', { property: 'og:description', content: description }])
    head.push(['meta', { property: 'og:url', content: pageUrl }])
    head.push(['meta', { property: 'og:type', content: isPost ? 'article' : 'website' }])

    // Twitter meta
    head.push(['meta', { name: 'twitter:title', content: title }])
    head.push(['meta', { name: 'twitter:description', content: description }])

    // Per-page OG image (프론트매터에 image 필드가 있으면 덮어쓰기)
    if (pageData.frontmatter.image) {
      const ogImage = pageData.frontmatter.image.startsWith('http')
        ? pageData.frontmatter.image
        : `${siteHostname}${pageData.frontmatter.image}`
      head.push(['meta', { property: 'og:image', content: ogImage }])
      head.push(['meta', { name: 'twitter:image', content: ogImage }])
    }

    // Article-specific OG tags
    if (isPost && pageData.frontmatter.date) {
      head.push(['meta', { property: 'article:published_time', content: new Date(pageData.frontmatter.date).toISOString() }])
      head.push(['meta', { property: 'article:author', content: 'Shoney' }])
    }

    // JSON-LD Structured Data
    if (isPost) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        url: pageUrl,
        datePublished: pageData.frontmatter.date ? new Date(pageData.frontmatter.date).toISOString() : undefined,
        author: {
          '@type': 'Person',
          name: 'Shoney',
          url: 'https://github.com/shoney',
        },
        publisher: {
          '@type': 'Organization',
          name: '삽질 테크 블로그',
          url: siteHostname,
        },
      }
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)])
    } else {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Shoney Tech Blog',
        url: siteHostname,
        description: '개발 경험과 기술 이야기를 공유합니다',
        author: {
          '@type': 'Person',
          name: 'Shoney',
        },
      }
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)])
    }

    return head
  },

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
      message: '삽질 테크 블로그',
      copyright: `© ${new Date().getFullYear()} Shoney. All rights reserved.`,
    },
  },
})
