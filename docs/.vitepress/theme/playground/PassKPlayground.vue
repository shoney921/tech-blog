<script setup lang="ts">
import { computed, ref } from 'vue'

// 글 안에서 직접 만져 보는 Pass@k / Pass^k 계산기.
// 각 시도(또는 단계)의 성공 확률이 같고 서로 독립이라고 가정한 이론값만 보여 준다.
const props = withDefaults(
  defineProps<{
    p?: number // 1회 성공률 (%)
    k?: number
    maxK?: number
    unit?: string // '회' | '단계'
    title?: string
  }>(),
  { p: 80, k: 6, maxK: 20, unit: '회', title: '직접 조작해 보기' },
)

const p = ref(props.p)
const k = ref(props.k)

const rate = computed(() => p.value / 100)
const passAt = (n: number) => 1 - (1 - rate.value) ** n
const passPow = (n: number) => rate.value ** n

// 99.996%를 100.0%로 반올림하면 "확실하다"로 읽히니, 100에 가까우면 자릿수를 늘린다
function pct(v: number) {
  const x = v * 100
  if (x >= 100) return '100%'
  if (x > 99.9) return `${Math.min(x, 99.99).toFixed(2)}%`
  if (x > 0 && x < 0.1) return '0.1% 미만'
  return `${parseFloat(x.toFixed(2))}%`
}

const bars = computed(() =>
  Array.from({ length: props.maxK }, (_, i) => {
    const n = i + 1
    return { n, at: passAt(n), pow: passPow(n), active: n === k.value }
  }),
)
</script>

<template>
  <div class="passk">
    <div class="passk-title">{{ title }}</div>

    <label class="passk-row">
      <span>{{ unit === '단계' ? '각 단계 성공률' : 'AI의 1회 성공률' }}</span>
      <strong>{{ p }}%</strong>
      <input v-model.number="p" type="range" min="1" max="99" step="1" />
    </label>

    <label class="passk-row">
      <span>{{ unit === '단계' ? '단계 수 (k)' : '시도 횟수 (k)' }}</span>
      <strong>{{ k }}{{ unit }}</strong>
      <input v-model.number="k" type="range" min="1" :max="maxK" step="1" />
    </label>

    <div class="passk-cards">
      <div class="passk-card at">
        <div class="passk-label">Pass@{{ k }} <small>하나라도 성공</small></div>
        <div class="passk-value">{{ pct(passAt(k)) }}</div>
        <div class="passk-formula">1 − (1 − {{ rate.toFixed(2) }})<sup>{{ k }}</sup></div>
      </div>
      <div class="passk-card pow">
        <div class="passk-label">Pass^{{ k }} <small>모두 성공</small></div>
        <div class="passk-value">{{ pct(passPow(k)) }}</div>
        <div class="passk-formula">{{ rate.toFixed(2) }}<sup>{{ k }}</sup></div>
      </div>
    </div>

    <div class="passk-chart" role="img" :aria-label="`k=1부터 ${maxK}까지 Pass@k와 Pass^k 막대`">
      <button
        v-for="b in bars"
        :key="b.n"
        type="button"
        class="passk-col"
        :class="{ active: b.active }"
        :title="`k=${b.n} · Pass@k ${pct(b.at)} · Pass^k ${pct(b.pow)}`"
        @click="k = b.n"
      >
        <span class="bar at" :style="{ height: `${b.at * 100}%` }" />
        <span class="bar pow" :style="{ height: `${b.pow * 100}%` }" />
      </button>
    </div>
    <div class="passk-axis">
      <span>k=1</span>
      <span class="legend"><i class="at" />Pass@k <i class="pow" />Pass^k</span>
      <span>k={{ maxK }}</span>
    </div>

    <p class="passk-note">각 {{ unit === '단계' ? '단계' : '시도' }}의 성공 확률이 같고, 서로 독립이라고 가정한 이론값이다.</p>
  </div>
</template>

<style scoped>
.passk {
  margin: 24px 0;
  padding: 20px 20px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.passk-title {
  font-weight: 700;
  margin-bottom: 12px;
}
.passk-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  margin-bottom: 14px;
  font-size: 14px;
}
.passk-row strong {
  font-variant-numeric: tabular-nums;
}
.passk-row input {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--vp-c-brand-1);
}
.passk-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 6px 0 18px;
}
.passk-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border-left: 4px solid;
}
.passk-card.at {
  border-color: var(--vp-c-brand-1);
}
.passk-card.pow {
  border-color: var(--vp-c-warning-1);
}
.passk-label {
  font-size: 13px;
  font-weight: 600;
}
.passk-label small {
  font-weight: 400;
  color: var(--vp-c-text-2);
  margin-left: 4px;
}
.passk-value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}
.passk-formula {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.passk-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 110px;
}
.passk-col {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  gap: 1px;
  padding: 0;
  border-radius: 3px;
  cursor: pointer;
}
.passk-col.active {
  background: var(--vp-c-default-soft);
  outline: 1px solid var(--vp-c-divider);
}
.bar {
  flex: 1;
  min-height: 1px;
  border-radius: 2px 2px 0 0;
  transition: height 0.2s ease;
}
.bar.at,
.legend .at {
  background: var(--vp-c-brand-1);
}
.bar.pow,
.legend .pow {
  background: var(--vp-c-warning-1);
}
.passk-col:not(.active) .bar {
  opacity: 0.55;
}
.passk-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.legend i {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin: 0 4px 0 10px;
}
.passk-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
@media (max-width: 480px) {
  .passk-value {
    font-size: 24px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
