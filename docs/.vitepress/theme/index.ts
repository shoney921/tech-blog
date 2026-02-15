import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import PostList from './PostList.vue'
import GiscusComment from './GiscusComment.vue'
import { useRoute } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    const route = useRoute()
    const isPost = route.path.startsWith('/posts/') && route.path !== '/posts/'

    return h(DefaultTheme.Layout, null, {
      ...(isPost ? { 'doc-after': () => h(GiscusComment) } : {}),
    })
  },
  enhanceApp({ app }) {
    app.component('PostList', PostList)
  },
} satisfies Theme
