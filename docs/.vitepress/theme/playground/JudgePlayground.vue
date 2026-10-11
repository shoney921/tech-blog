<script setup lang="ts">
import { computed, ref } from 'vue'
import { pct } from './math'

// LLM 판정자 vs 사람 정답. 실제 합격 비율 π, 판정자 민감도(좋은 답을 합격) se, 특이도(나쁜 답을 불합격) sp
const props = withDefaults(defineProps<{ pi?: number; se?: number; sp?: number }>(), { pi: 85, se: 95, sp: 60 })

const pi = ref(props.pi)
const se = ref(props.se)
const sp = ref(props.sp)

const PRESETS = [
  { label: '무조건 합격 주는 판정자', pi: 90, se: 100, sp: 0 },
  { label: '후한 판정자', pi: 85, se: 95, sp: 60 },
  { label: '균형 잡힌 판정자', pi: 85, se: 90, sp: 90 },
]
function apply(p: (typeof PRESETS)[number]) {
  pi.value = p.pi
  se.value = p.se
  sp.value = p.sp
}

const N = 1000
const m = computed(() => {
  const P = pi.value / 100
  const s = se.value / 100
  const c = sp.value / 100
  const tp = P * s // 진짜 좋음, 판정자 합격
  const fn = P * (1 - s) // 진짜 좋음, 판정자 불합격
  const fp = (1 - P) * (1 - c) // 진짜 나쁨, 판정자 합격
  const tn = (1 - P) * c // 진짜 나쁨, 판정자 불합격
  const po = tp + tn
  const q = tp + fp // 판정자가 보고하는 합격률
  const pe = P * q + (1 - P) * (1 - q) // 우연히 맞을 확률
  const kappa = pe >= 1 ? 0 : (po - pe) / (1 - pe)
  // 판정자의 se/sp를 알고 있을 때의 보정 추정 (Rogan–Gladen)
  const youden = s + c - 1
  const corrected = Math.abs(youden) < 0.02 ? null : Math.min(1, Math.max(0, (q + c - 1) / youden))
  return { P, tp, fn, fp, tn, po, q, kappa, corrected }
})

const cnt = (v: number) => Math.round(v * N).toLocaleString()

const kappaWord = computed(() => {
  const k = m.value.kappa
  if (k < 0.2) return '우연과 거의 구분이 안 된다'
  if (k < 0.4) return '약하다'
  if (k < 0.6) return '보통'
  if (k < 0.8) return '꽤 믿을 만하다'
  return '매우 높다'
})
</script>

<template>
  <div class="pg">
    <div class="pg-title">LLM 판정자 성향 바꿔 보기</div>

    <div class="pg-presets">
      <button v-for="p in PRESETS" :key="p.label" type="button" @click="apply(p)">{{ p.label }}</button>
    </div>

    <label class="pg-row">
      <span>에이전트 답 중 실제로 좋은 답 비율</span><strong>{{ pi }}%</strong>
      <input v-model.number="pi" type="range" min="1" max="99" />
    </label>
    <label class="pg-row">
      <span>좋은 답을 합격시키는 비율 (민감도)</span><strong>{{ se }}%</strong>
      <input v-model.number="se" type="range" min="0" max="100" />
    </label>
    <label class="pg-row">
      <span>나쁜 답을 걸러내는 비율 (특이도)</span><strong>{{ sp }}%</strong>
      <input v-model.number="sp" type="range" min="0" max="100" />
    </label>

    <table>
      <thead>
        <tr><th>답 1,000개</th><th>판정자: 합격</th><th>판정자: 불합격</th></tr>
      </thead>
      <tbody>
        <tr><th>사람: 좋은 답</th><td>{{ cnt(m.tp) }}</td><td>{{ cnt(m.fn) }}</td></tr>
        <tr><th>사람: 나쁜 답</th><td style="color: var(--pg-b); font-weight: 700">{{ cnt(m.fp) }}</td><td>{{ cnt(m.tn) }}</td></tr>
      </tbody>
    </table>

    <div class="pg-cards">
      <div class="pg-card n">
        <div class="pg-label">단순 일치율</div>
        <div class="pg-value">{{ pct(m.po) }}</div>
        <div class="pg-sub">사람과 같은 판정을 낸 비율</div>
      </div>
      <div class="pg-card a">
        <div class="pg-label">코헨 카파 κ</div>
        <div class="pg-value">{{ m.kappa.toFixed(2) }}</div>
        <div class="pg-sub">우연을 뺀 일치도 · {{ kappaWord }}</div>
      </div>
      <div class="pg-card b">
        <div class="pg-label">판정자가 보고한 합격률</div>
        <div class="pg-value">{{ pct(m.q) }}</div>
        <div class="pg-sub">실제 {{ pct(m.P) }}<template v-if="m.corrected !== null"> · 보정하면 {{ pct(m.corrected) }}</template></div>
      </div>
    </div>

    <p class="pg-note">카파 해석 구간(0.2·0.4·0.6·0.8)은 관례적인 기준일 뿐 정답은 아니다. 보정값은 판정자의 민감도·특이도를 정확히 안다고 가정한 것이다.</p>
  </div>
</template>

<style src="./playground.css"></style>
