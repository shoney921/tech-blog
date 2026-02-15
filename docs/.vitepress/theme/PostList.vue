<script setup lang="ts">
import { data as posts } from './posts.data'
import { withBase } from 'vitepress'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
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
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
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
