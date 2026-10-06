import { createContentLoader } from 'vitepress'
import { getCategoryLabel } from '../categories'

export interface Post {
  title: string
  url: string
  date: string
  datetime: string
  /** 표시용 라벨 (예: "AI 시스템 설계 연재") */
  category: string
  /** 디렉토리 경로 (예: "ai-llm/ai-systems") */
  categoryPath: string
  /** 프론트매터 description, 없으면 본문 앞부분 발췌 */
  description: string
  readingTime: number
}

declare const data: Post[]
export { data }

function extractCategoryPath(url: string): string {
  // url: /posts/ai-llm/2026-02-13-xxx → "ai-llm"
  // url: /posts/ai-llm/rag/2026-02-13-xxx → "ai-llm/rag"
  const match = url.match(/^\/posts\/(.+)\/[^/]+$/)
  return match ? match[1] : ''
}

const ENTITIES: Record<string, string> = {
  '&quot;': '"', '&#39;': "'", '&apos;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ',
}

function decodeEntities(text: string): string {
  return text
    .replace(/&(quot|#39|apos|amp|lt|gt|nbsp);/g, m => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
}

function calcReadingTime(html: string): number {
  const text = stripHtml(html)
  // 한국어 기준 ~500자/분
  const minutes = Math.ceil(text.length / 500)
  return Math.max(1, minutes)
}

/** 제목·코드·콜아웃을 걷어낸 본문 앞 120자 */
function makeExcerpt(html: string): string {
  const text = stripHtml(
    html
      .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g, '')
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<div class="(tip|warning|danger|info|details) custom-block[\s\S]*?<\/div>/g, '')
      .replace(/<table[\s\S]*?<\/table>/g, ''),
  )
  if (text.length <= 120) return text
  return text.slice(0, 120).replace(/\s+\S*$/, '') + '…'
}

export default createContentLoader('posts/**/*.md', {
  render: true,
  transform(raw): Post[] {
    return raw
      // index 페이지(/posts/, /posts/<cat>/)와 프론트매터 없는 파일은 제외
      .filter(({ url, frontmatter }) => !url.endsWith('/') && !!frontmatter.title && !!frontmatter.date)
      .map(({ url, frontmatter, html }) => {
        const dateValue = frontmatter.date instanceof Date
          ? frontmatter.date.toISOString()
          : String(frontmatter.date)
        const categoryPath = extractCategoryPath(url)
        return {
          title: frontmatter.title as string,
          url,
          date: dateValue.split('T')[0],
          datetime: dateValue,
          category: categoryPath ? getCategoryLabel(categoryPath) : '',
          categoryPath,
          description: (frontmatter.description as string | undefined)?.trim() || (html ? makeExcerpt(html) : ''),
          readingTime: html ? calcReadingTime(html) : 1,
        }
      })
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
  },
})
