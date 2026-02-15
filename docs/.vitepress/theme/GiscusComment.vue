<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { isDark } = useData()
const container = ref<HTMLDivElement>()

function loadGiscus() {
  if (!container.value) return
  container.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'shoney921/tech-blog')
  script.setAttribute('data-repo-id', '')
  script.setAttribute('data-category', 'General')
  script.setAttribute('data-category-id', '')
  script.setAttribute('data-mapping', 'pathname')
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'top')
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', 'ko')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true
  container.value.appendChild(script)
}

onMounted(() => {
  loadGiscus()
})

watch(() => route.path, () => {
  nextTick(() => loadGiscus())
})

watch(isDark, () => {
  const iframe = container.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (iframe) {
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: isDark.value ? 'dark' : 'light' } } },
      'https://giscus.app'
    )
  }
})
</script>

<template>
  <div class="giscus-wrapper">
    <div ref="container" />
  </div>
</template>

<style scoped>
.giscus-wrapper {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
