<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from './posts.data'
import { topLevelCategories } from '../categories'

const cards = computed(() =>
  topLevelCategories
    .map(cat => {
      const count = posts.filter(p => p.categoryPath === cat.id || p.categoryPath.startsWith(cat.id + '/')).length
      return { ...cat, count }
    })
    .filter(c => c.count > 0),
)
</script>

<template>
  <div class="category-grid">
    <a
      v-for="cat in cards"
      :key="cat.id"
      :href="withBase(`/posts/${cat.id}/`)"
      class="category-card"
    >
      <div class="category-head">
        <span class="category-label">{{ cat.label }}</span>
        <span class="category-count">{{ cat.count }}편</span>
      </div>
      <p v-if="cat.description" class="category-desc">{{ cat.description }}</p>
      <ul v-if="cat.children?.length" class="category-children">
        <li v-for="child in cat.children" :key="child.id">{{ child.label }}</li>
      </ul>
    </a>
  </div>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.category-card {
  display: block;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, translate 0.2s;
}

.category-card:hover,
.category-card:focus-visible {
  border-color: var(--vp-c-brand-1);
  box-shadow: 4px 4px 0 #e8d6b9;
}

.dark .category-card:hover,
.dark .category-card:focus-visible {
  box-shadow: 4px 4px 0 #483b2e;
}

@media (hover: hover) {
  .category-card:hover {
    translate: -2px -2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-card {
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .category-card:hover {
    translate: none;
  }
}

.category-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.category-label {
  font-family: var(--vp-font-family-heading, inherit);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.category-count {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.category-desc {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

.category-children {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.6rem 0 0;
  padding: 0;
}

.category-children li {
  margin: 0;
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
}
</style>
