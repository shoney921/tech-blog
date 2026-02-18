<script setup lang="ts">
import { data as posts } from './posts.data'
import { withBase } from 'vitepress'
import { ref, onMounted, onUnmounted } from 'vue'

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function formatDate(datetime: string): string {
  const date = new Date(datetime)
  const diff = now.value - date.getTime()

  if (diff < 0) {
    return formatAbsoluteDate(date)
  }

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return formatAbsoluteDate(date)
}

function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="post-list">
    <a
      v-for="post in posts"
      :key="post.url"
      :href="withBase(post.url)"
      class="post-item"
    >
      <article>
        <div class="post-header">
          <span v-if="post.category" class="post-category">{{ post.category }}</span>
          <time :datetime="post.datetime">{{ formatDate(post.datetime) }}</time>
          <span class="post-reading-time">{{ post.readingTime }}분</span>
        </div>
        <h2>{{ post.title }}</h2>
      </article>
    </a>
  </div>
</template>

<style scoped>
.post-list {
  margin-top: 1.5rem;
}

.post-item {
  display: block;
  padding: 1.25rem 1.5rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s, box-shadow 0.25s;
}

.post-item:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.dark .post-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.24);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.post-category {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
}

.post-item h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  border-top: none;
  padding-top: 0;
}

.post-item time {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.post-reading-time {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.post-reading-time::before {
  content: '·';
  margin: 0 0.4rem;
}
</style>
