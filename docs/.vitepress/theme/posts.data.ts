import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  url: string
  date: string
  category: string
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => url !== '/posts/')
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title as string,
        url,
        date: frontmatter.date instanceof Date
          ? frontmatter.date.toISOString().split('T')[0]
          : String(frontmatter.date),
        category: (frontmatter.category as string) || '',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
})
