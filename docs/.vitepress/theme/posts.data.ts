import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  url: string
  date: string
  datetime: string
  category: string
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw
      .filter(({ url }) => url !== '/posts/')
      .map(({ url, frontmatter }) => {
        const dateValue = frontmatter.date instanceof Date
          ? frontmatter.date.toISOString()
          : String(frontmatter.date)
        return {
          title: frontmatter.title as string,
          url,
          date: dateValue.split('T')[0],
          datetime: dateValue,
          category: (frontmatter.category as string) || '',
        }
      })
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
  },
})
