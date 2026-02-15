import { createContentLoader } from 'vitepress'
import { getCategoryLabel } from '../categories'

export interface Post {
  title: string
  url: string
  date: string
  datetime: string
  category: string
  readingTime: number
}

declare const data: Post[]
export { data }

function extractCategory(url: string): string {
  // url: /posts/ai-llm/2026-02-13-xxx → categoryPath: "ai-llm"
  // url: /posts/ai-llm/rag/2026-02-13-xxx → categoryPath: "ai-llm/rag"
  const match = url.match(/^\/posts\/(.+)\/[^/]+$/)
  if (!match) return ''
  return getCategoryLabel(match[1])
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function calcReadingTime(html: string): number {
  const text = stripHtml(html)
  // 한국어 기준 ~500자/분
  const minutes = Math.ceil(text.length / 500)
  return Math.max(1, minutes)
}

export default createContentLoader('posts/**/*.md', {
  render: true,
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => !url.endsWith('/posts/'))
      .map(({ url, frontmatter, html }) => {
        const dateValue = frontmatter.date instanceof Date
          ? frontmatter.date.toISOString()
          : String(frontmatter.date)
        return {
          title: frontmatter.title as string,
          url,
          date: dateValue.split('T')[0],
          datetime: dateValue,
          category: extractCategory(url),
          readingTime: html ? calcReadingTime(html) : 1,
        }
      })
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
  },
})
