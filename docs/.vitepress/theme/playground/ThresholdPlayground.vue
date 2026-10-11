<script setup lang="ts">
import { computed, ref } from 'vue'
import { normCdf, normPdf, pct } from './math'

// 에이전트 출력에 검증기가 점수를 매기고, 점수가 문턱값 미만이면 막아서 사람에게 넘긴다.
// 잘못된 출력의 점수 ~ N(0, 1), 정상 출력의 점수 ~ N(d, 1) 로 단순화했다.
const props = withDefaults(
  defineProps<{ err?: number; d?: number; t?: number; review?: number; miss?: number }>(),
  { err: 5, d: 2, t: 1, review: 1, miss: 50 },
)

const err = ref(props.err) // 잘못된 출력 비율 (%)
const d = ref(props.d) // 분별력
const t = ref(props.t) // 문턱값
const review = ref(props.review) // 사람 검토 1건 비용 (만원)
const miss = ref(props.miss) // 놓친 오류 1건 비용 (만원)

function stats(th: number) {
  const e = err.value / 100
  const recall = normCdf(th) // 잘못된 출력 중 막힌 비율
  const fpr = normCdf(th - d.value) // 정상 출력 중 괜히 막힌 비율
  const blocked = e * recall + (1 - e) * fpr
  const precision = blocked > 0 ? (e * recall) / blocked : 0
  const missed = e * (1 - recall)
  const cost = 1000 * (blocked * review.value + missed * miss.value)
  return { recall, fpr, blocked, precision, missed, cost }
}
const s = computed(() => stats(t.value))

const best = computed(() => {
  let bt = -3
  let bc = Infinity
  for (let th = -3; th <= 5.0001; th += 0.05) {
    const c = stats(th).cost
    if (c < bc) {
      bc = c
      bt = th
    }
  }
  return { t: Math.round(bt * 20) / 20, cost: bc }
})

// 분포 그림: x는 점수 -3.5 ~ 5.5, 곡선 높이는 "건수"에 비례하게 비율을 곱한다
const XMIN = -3.5
const XMAX = 5.5
const W = 360
const H = 110
const sx = (v: number) => ((v - XMIN) / (XMAX - XMIN)) * W
function curve(mu: number, weight: number, peak: number) {
  const pts: string[] = []
  for (let v = XMIN; v <= XMAX + 1e-9; v += 0.1) {
    const y = H - (normPdf(v - mu) * weight * (H - 10)) / peak
    pts.push(`${sx(v).toFixed(1)},${y.toFixed(1)}`)
  }
  return `M0,${H} L${pts.join(' L')} L${W},${H} Z`
}
const paths = computed(() => {
  const e = err.value / 100
  const peak = normPdf(0) * Math.max(e, 1 - e)
  return { bad: curve(0, e, peak), good: curve(d.value, 1 - e, peak) }
})
</script>

<template>
  <div class="pg">
    <div class="pg-title">검증기 문턱값 옮겨 보기</div>

    <svg class="pg-svg" :viewBox="`0 0 ${W} ${H + 18}`" role="img" aria-label="정상 출력과 잘못된 출력의 검증 점수 분포와 문턱값">
      <path :d="paths.good" fill="var(--pg-a)" opacity="0.22" />
      <path :d="paths.bad" fill="var(--pg-b)" opacity="0.35" />
      <path :d="paths.good" fill="none" stroke="var(--pg-a)" stroke-width="2" />
      <path :d="paths.bad" fill="none" stroke="var(--pg-b)" stroke-width="2" />
      <rect x="0" y="0" :width="sx(t)" :height="H" fill="var(--vp-c-text-1)" opacity="0.06" />
      <line :x1="sx(t)" :x2="sx(t)" y1="0" :y2="H" stroke="var(--vp-c-text-1)" stroke-width="2" stroke-dasharray="4 3" />
      <line class="axis" x1="0" :x2="W" :y1="H" :y2="H" />
      <text :x="Math.max(4, sx(t) - 6)" y="12" text-anchor="end">← 막음</text>
      <text :x="Math.min(W - 4, sx(t) + 6)" y="12">통과 →</text>
      <text x="0" :y="H + 14">낮은 점수</text>
      <text :x="W" :y="H + 14" text-anchor="end">높은 점수</text>
    </svg>
    <div class="pg-legend">
      <span><i style="background: var(--pg-b)" />잘못된 출력</span>
      <span><i style="background: var(--pg-a)" />정상 출력</span>
      <span>면적 = 건수 (오류 비율이 낮으면 주황이 작게 보인다)</span>
    </div>

    <div style="height: 14px" />
    <label class="pg-row">
      <span>문턱값 (이보다 낮으면 막음)</span><strong>{{ t.toFixed(2) }}</strong>
      <input v-model.number="t" type="range" min="-3" max="5" step="0.05" />
    </label>
    <label class="pg-row">
      <span>에이전트 출력 중 잘못된 비율</span><strong>{{ err }}%</strong>
      <input v-model.number="err" type="range" min="1" max="40" />
    </label>
    <label class="pg-row">
      <span>검증기 분별력 (두 분포 사이 거리)</span><strong>{{ d.toFixed(1) }}</strong>
      <input v-model.number="d" type="range" min="0.5" max="4" step="0.1" />
    </label>
    <label class="pg-row">
      <span>사람 검토 1건 비용</span><strong>{{ review }}만 원</strong>
      <input v-model.number="review" type="range" min="0" max="10" step="0.5" />
    </label>
    <label class="pg-row">
      <span>놓친 오류 1건 비용</span><strong>{{ miss }}만 원</strong>
      <input v-model.number="miss" type="range" min="0" max="500" step="5" />
    </label>

    <div class="pg-cards">
      <div class="pg-card b">
        <div class="pg-label">재현율 <small>오류를 잡아낸 비율</small></div>
        <div class="pg-value">{{ pct(s.recall) }}</div>
        <div class="pg-sub">1000건당 놓친 오류 {{ (s.missed * 1000).toFixed(1) }}건</div>
      </div>
      <div class="pg-card a">
        <div class="pg-label">정밀도 <small>막은 것 중 진짜 오류</small></div>
        <div class="pg-value">{{ pct(s.precision) }}</div>
        <div class="pg-sub">사람 검토로 가는 비율 {{ pct(s.blocked) }}</div>
      </div>
      <div class="pg-card n">
        <div class="pg-label">1000건당 비용</div>
        <div class="pg-value">{{ Math.round(s.cost).toLocaleString() }}만</div>
        <div class="pg-sub">최소는 문턱값 {{ best.t.toFixed(2) }}에서 {{ Math.round(best.cost).toLocaleString() }}만</div>
      </div>
    </div>

    <div class="pg-presets">
      <button type="button" @click="t = best.t">비용이 가장 적은 문턱값으로</button>
    </div>

    <p class="pg-note">점수 분포를 정규분포 두 개로 단순화한 모형이다. 실제 검증기의 점수 분포는 치우쳐 있고, 문턱값은 실제 라벨링 데이터로 다시 잡아야 한다.</p>
  </div>
</template>

<style src="./playground.css"></style>
