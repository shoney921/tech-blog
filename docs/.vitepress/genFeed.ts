import fs from 'node:fs'
import path from 'node:path'
import type { SiteConfig } from 'vitepress'

interface FeedItem {
  title: string
  link: string
  date: string
  description: string
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function scanPosts(dir: string, baseUrl: string): FeedItem[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const items: FeedItem[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      items.push(...scanPosts(path.join(dir, entry.name), `${baseUrl}/${entry.name}`))
    } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8')
      const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
      if (!match) continue

      const frontmatter = match[1]
      const title = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? entry.name
      const date = frontmatter.match(/^date:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''
      const description = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? ''

      items.push({
        title,
        link: `${baseUrl}/${entry.name.replace(/\.md$/, '')}`,
        date,
        description,
      })
    }
  }

  return items
}

export async function genFeed(siteConfig: SiteConfig) {
  const hostname = 'https://blog.shoneylife.com'
  const postsDir = path.resolve(siteConfig.srcDir, 'posts')
  const outDir = siteConfig.outDir

  const items = scanPosts(postsDir, '/posts')
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const rssItems = items.slice(0, 20).map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${hostname}${item.link}</link>
      <guid>${hostname}${item.link}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description>${escapeXml(item.description || item.title)}</description>
    </item>`).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Shoney Tech Blog</title>
    <link>${hostname}</link>
    <description>개발 경험과 기술 이야기를 공유합니다</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${hostname}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`

  fs.writeFileSync(path.join(outDir, 'feed.xml'), rss, 'utf-8')
}
