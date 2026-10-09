import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import PostList from './PostList.vue'
import CategoryGrid from './CategoryGrid.vue'
import GiscusComment from './GiscusComment.vue'
import HeroArtwork from './HeroArtwork.vue'
import ReadingProgress from './ReadingProgress.vue'
import { useRoute } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    const route = useRoute()
    // /posts/, /posts/<cat>/ 같은 목록 페이지는 글이 아님
    const isPost = route.path.startsWith('/posts/') && !route.path.endsWith('/')

    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroArtwork),
      ...(isPost
        ? {
            'doc-before': () => h(ReadingProgress),
            'doc-after': () => h(GiscusComment),
          }
        : {}),
    })
  },
  enhanceApp({ app }) {
    app.component('PostList', PostList)
    app.component('CategoryGrid', CategoryGrid)
  },
} satisfies Theme
