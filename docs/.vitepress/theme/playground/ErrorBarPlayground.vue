<script setup lang="ts">
import { computed, ref } from 'vue'
import { pct, wilson } from './math'

// 두 에이전트 버전의 통과율과 평가셋 크기 n → 95% 신뢰구간, 차이의 신뢰구간, 필요한 n
const props = withDefaults(defineProps<{ a?: number; b?: number; n?: number }>(), { a: 82, b: 78, n: 50 })

const SIZES = [10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000]
const a = ref(props.a)
const b = ref(props.b)
const ni = ref(Math.max(0, SIZES.indexOf(props.n)))
const n = computed(() => SIZES[ni.value])

const pa = computed(() => a.value / 100)
const pb = computed(() => b.value / 100)
const ciA = computed(() => wilson(pa.value, n.value))
const ciB = computed(() => wilson(pb.value, n.value))

// 두 버전을 서로 다른 n개 과제로 독립 측정했다고 보는 단순 근사 (Wald)
const diff = computed(() => pa.value - pb.value)
const diffHalf = computed(
  () => 1.96 * Math.sqrt((pa.value * (1 - pa.value) + pb.value * (1 - pb.value)) / n.value),
)
const significant = computed(() => Math.abs(diff.value) > diffHalf.value)

// 이 차이를 검정력 80%로 잡아내려면 버전당 과제가 몇 개 필요한가
const needN = computed(() => {
  const d = Math.abs(diff.value)
  if (d < 0.005) return null
  const v = pa.value * (1 - pa.value) + pb.value * (1 - pb.value)
  return Math.ceil(((1.96 + 0.8416) ** 2 * v) / (d * d))
})

// SVG x축: 0~100%를 X0부터 W 폭에
const X0 = 50
const W = 270
const x = (v: number) => X0 + v * W
</script>

<template>
  <div class="pg">
    <div class="pg-title">평가셋 크기 바꿔 보기</div>

    <label class="pg-row">
      <span>버전 A 통과율</span><strong>{{ a }}%</strong>
      <input v-model.number="a" type="range" min="1" max="99" />
    </label>
    <label class="pg-row">
      <span>버전 B 통과율</span><strong>{{ b }}%</strong>
      <input v-model.number="b" type="range" min="1" max="99" />
    </label>
    <label class="pg-row">
      <span>평가 과제 수 (버전당)</span><strong>{{ n }}개</strong>
      <input v-model.number="ni" type="range" min="0" :max="SIZES.length - 1" step="1" />
    </label>

    <svg class="pg-svg" viewBox="0 0 330 96" role="img" :aria-label="`A ${a}%, B ${b}%, 과제 ${n}개일 때 95% 신뢰구간`">
      <line class="axis" :x1="X0" :x2="X0 + W" y1="78" y2="78" />
      <g v-for="t in [0, 25, 50, 75, 100]" :key="t">
        <line class="axis" :x1="x(t / 100)" :x2="x(t / 100)" y1="74" y2="82" />
        <text :x="x(t / 100)" y="94" text-anchor="middle">{{ t }}%</text>
      </g>
      <g v-for="(row, i) in [
        { name: 'A', p: pa, ci: ciA, c: 'var(--pg-a)' },
        { name: 'B', p: pb, ci: ciB, c: 'var(--pg-b)' },
      ]" :key="row.name">
        <title>버전 {{ row.name }}: {{ pct(row.p) }} (95% 구간 {{ pct(row.ci[0]) }} ~ {{ pct(row.ci[1]) }})</title>
        <text :x="0" :y="22 + i * 30" dominant-baseline="middle">버전 {{ row.name }}</text>
        <rect :x="x(row.ci[0])" :y="16 + i * 30" :width="Math.max(2, x(row.ci[1]) - x(row.ci[0]))" height="14" rx="4"
          :fill="row.c" opacity="0.28" />
        <line :x1="x(row.p)" :x2="x(row.p)" :y1="12 + i * 30" :y2="32 + i * 30" :stroke="row.c" stroke-width="3" stroke-linecap="round" />
      </g>
    </svg>
    <div class="pg-legend">
      <span><i style="background: var(--pg-a)" />버전 A</span>
      <span><i style="background: var(--pg-b)" />버전 B</span>
      <span>막대 = 95% 신뢰구간, 굵은 선 = 측정값</span>
    </div>

    <div class="pg-cards" style="margin-top: 14px">
      <div class="pg-card a">
        <div class="pg-label">A의 95% 구간</div>
        <div class="pg-value">±{{ ((ciA[1] - ciA[0]) * 50).toFixed(1) }}%p</div>
        <div class="pg-sub">{{ pct(ciA[0]) }} ~ {{ pct(ciA[1]) }}</div>
      </div>
      <div class="pg-card n">
        <div class="pg-label">A − B 차이</div>
        <div class="pg-value">{{ (diff * 100).toFixed(1) }}%p</div>
        <div class="pg-sub">95% 구간 {{ ((diff - diffHalf) * 100).toFixed(1) }} ~ {{ ((diff + diffHalf) * 100).toFixed(1) }}%p</div>
      </div>
    </div>

    <div class="pg-verdict">
      <template v-if="significant">
        차이의 구간이 0을 넘지 않는다. 이 정도 과제 수면 <strong>{{ diff > 0 ? 'A' : 'B' }}가 낫다</strong>고 말해도 될 만하다.
      </template>
      <template v-else>
        차이의 구간이 0을 걸친다. 이 결과만으로는 <strong>둘 중 뭐가 나은지 모른다.</strong>
      </template>
      <template v-if="needN">
        이 차이를 놓치지 않으려면(검정력 80%) 버전당 과제가 약 <strong>{{ needN.toLocaleString() }}개</strong> 필요하다.
      </template>
    </div>

    <p class="pg-note">두 버전을 서로 독립인 과제로 쟀다고 본 근사다. 같은 과제셋으로 비교하면(짝지은 비교) 구간이 이보다 좁아질 수 있다.</p>
  </div>
</template>

<style src="./playground.css"></style>
