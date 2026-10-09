<script setup lang="ts">
import { data as allPosts } from './posts.data'
import { withBase } from 'vitepress'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { topLevelCategories, isSeriesPath } from '../categories'

const props = withDefaults(defineProps<{
  /** 카테고리 경로 prefix (예: "ai-llm", "nadarm/frontend"). 없으면 전체 */
  category?: string
  /** 최대 글 수 */
  limit?: number
  /** 정렬. 생략하면 연재 카테고리는 asc, 나머지는 desc */
  order?: 'asc' | 'desc'
  /** 설명 문장 표시 */
  showDescription?: boolean
  /** 상단 카테고리 필터 칩 표시 (전체 글 페이지용) */
  showFilter?: boolean
}>(), {
  showDescription: true,
  showFilter: false,
})

// 필터 칩 상태 (URL ?cat= 과 동기화)
const activeCat = ref<string>('')

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60_000)

  if (props.showFilter) {
    const cat = new URLSearchParams(window.location.search).get('cat') ?? ''
    if (topLevelCategories.some(c => c.id === cat)) activeCat.value = cat
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function selectCat(id: string) {
  activeCat.value = id
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('cat', id)
  else url.searchParams.delete('cat')
  window.history.replaceState(window.history.state, '', url)
}

function inCategory(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/')
}

const posts = computed(() => {
  let list = allPosts
  const prefix = props.category || activeCat.value
  if (prefix) list = list.filter(p => inCategory(p.categoryPath, prefix))

  const order = props.order ?? (props.category && isSeriesPath(props.category) ? 'asc' : 'desc')
  if (order === 'asc') list = [...list].reverse()

  if (props.limit) list = list.slice(0, props.limit)
  return list
})

const counts = computed(() => {
  const map: Record<string, number> = {}
  for (const p of allPosts) {
    const top = p.categoryPath.split('/')[0]
    map[top] = (map[top] ?? 0) + 1
  }
  return map
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
  <div class="post-list-wrap">
    <div v-if="showFilter" class="post-filter" role="tablist" aria-label="카테고리 필터">
      <button
        type="button"
        class="post-filter-chip"
        :class="{ active: activeCat === '' }"
        @click="selectCat('')"
      >전체 <span class="count">{{ allPosts.length }}</span></button>
      <button
        v-for="cat in topLevelCategories"
        :key="cat.id"
        type="button"
        class="post-filter-chip"
        :class="{ active: activeCat === cat.id }"
        :disabled="!counts[cat.id]"
        @click="selectCat(cat.id)"
      >{{ cat.label }} <span class="count">{{ counts[cat.id] ?? 0 }}</span></button>
    </div>

    <div class="post-list">
      <article
        v-for="(post, i) in posts"
        :key="post.url"
        class="post-item"
        :style="{ '--i': Math.min(i, 8) }"
      >
        <div class="post-header">
          <a
            v-if="post.category && post.categoryPath !== props.category"
            class="post-category"
            :href="withBase(`/posts/${post.categoryPath}/`)"
          >{{ post.category }}</a>
          <time :datetime="post.datetime">{{ formatDate(post.datetime) }}</time>
          <span class="post-reading">{{ post.readingTime }}분</span>
        </div>
        <h2><a :href="withBase(post.url)" class="post-title">{{ post.title }}</a></h2>
        <p v-if="showDescription && post.description" class="post-desc">{{ post.description }}</p>
      </article>
      <p v-if="posts.length === 0" class="post-empty">아직 글이 없습니다.</p>
    </div>
  </div>
</template>

<style scoped>
.post-list-wrap {
  margin-top: 1.5rem;
}

.post-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.post-filter-chip {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.post-filter-chip:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.post-filter-chip.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.post-filter-chip:disabled {
  opacity: 0.4;
  cursor: default;
}

.post-filter-chip .count {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-left: 0.15rem;
}

.post-item {
  position: relative;
  display: block;
  padding: 1.25rem 1.5rem;
  margin-bottom: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s, translate 0.2s;
  /* 목록이 위에서부터 차례로 올라온다. 9번째 이후는 같은 시점에 (--i 상한 8) */
  animation: post-item-in 0.4s ease-out calc(var(--i, 0) * 45ms) backwards;
}

/* 히어로 카드와 같은 '스티커' 그림자. 마우스가 있는 기기에서만 들썩인다 */
.post-item:hover,
.post-item:has(.post-title:focus-visible) {
  border-color: var(--vp-c-brand-1);
  box-shadow: 4px 4px 0 #e8d6b9;
}

.dark .post-item:hover,
.dark .post-item:has(.post-title:focus-visible) {
  box-shadow: 4px 4px 0 #483b2e;
}

@media (hover: hover) {
  .post-item:hover {
    translate: -2px -2px;
  }
}

@keyframes post-item-in {
  from {
    opacity: 0;
    translate: 0 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-item {
    animation: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .post-item:hover {
    translate: none;
  }
}

.post-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.post-category {
  position: relative;
  z-index: 1;
  display: inline-block;
  padding: 0.15rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
  text-decoration: none;
}

.post-category:hover {
  text-decoration: underline;
}

.post-item h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.4;
  border-top: none;
  padding-top: 0;
}

/* 제목 링크를 카드 전체로 확장 */
.post-title {
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-weight: inherit;
}

.post-title::after {
  content: '';
  position: absolute;
  inset: 0;
}

.post-desc {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-item time,
.post-reading {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.post-empty {
  color: var(--vp-c-text-3);
}
</style>
