import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PostList from './PostList.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PostList', PostList)
  },
} satisfies Theme
