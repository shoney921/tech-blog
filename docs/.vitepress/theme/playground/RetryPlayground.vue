<script setup lang="ts">
import { computed, ref } from 'vue'
import { pct } from './math'

// n단계 에이전트. 각 단계 출력을 검증기가 보고, 막히면 그 단계만 다시 생성한다(최대 m번).
// 재시도해도 막히면 사람에게 넘긴다. 시도끼리는 독립이고 성공률이 같다고 본다.
const props = withDefaults(
  defineProps<{ n?: number; p?: number; r?: number; f?: number; m?: number }>(),
  { n: 6, p: 90, r: 0, f: 0, m: 0 },
)

const n = ref(props.n)
const p = ref(props.p)
const r = ref(props.r) // 검증기 재현율: 틀린 출력을 잡아내는 비율
const f = ref(props.f) // 검증기 오탐률: 맞는 출력을 괜히 막는 비율
const m = ref(props.m)

const PRESETS = [
  { label: '검증 없음', r: 0, f: 0, m: 0 },
  { label: '검증만 (재시도 없음)', r: 80, f: 5, m: 0 },
  { label: '검증 + 재시도 2번', r: 80, f: 5, m: 2 },
]
function apply(x: (typeof PRESETS)[number]) {
  r.value = x.r
  f.value = x.f
  m.value = x.m
}

const res = computed(() => {
  const P = p.value / 100
  const R = r.value / 100
  const F = f.value / 100
  const M = m.value + 1 // 최대 시도 횟수
  const a = P * (1 - F) // 이번 시도: 맞고 통과
  const b = (1 - P) * (1 - R) // 이번 시도: 틀렸는데 통과
  const c = P * F + (1 - P) * R // 이번 시도: 막혀서 다시
  const geo = c >= 1 ? M : (1 - c ** M) / (1 - c) // 한 단계의 기대 시도 수
  const A = a * geo // 단계가 맞은 채로 넘어감
  const B = b * geo // 단계가 틀린 채로 넘어감
  const S = A + B // 사람에게 안 넘어가고 다음 단계로
  const correct = A ** n.value
  const silent = S ** n.value - correct
  const escalated = 1 - S ** n.value
  // 앞 단계에서 사람에게 넘어가면 뒤 단계는 돌지 않는다
  let reach = 0
  for (let i = 0; i < n.value; i++) reach += S ** i
  const calls = geo * reach
  const verifier = R > 0 || F > 0
  return { correct, silent, escalated, calls, verifier, baseline: P ** n.value }
})

const segs = computed(() => [
  { key: '끝까지 정답', v: res.value.correct, c: 'var(--pg-a)' },
  { key: '조용한 오류', v: res.value.silent, c: 'var(--pg-b)' },
  { key: '사람에게 넘김', v: res.value.escalated, c: 'var(--pg-n)' },
])
const bars = computed(() => {
  let x = 0
  return segs.value.map(s => {
    const w = s.v * 100
    const out = { ...s, x, w }
    x += w
    return out
  })
})
</script>

<template>
  <div class="pg">
    <div class="pg-title">검증과 재시도 붙여 보기</div>

    <div class="pg-presets">
      <button v-for="x in PRESETS" :key="x.label" type="button" @click="apply(x)">{{ x.label }}</button>
    </div>

    <label class="pg-row">
      <span>단계 수</span><strong>{{ n }}단계</strong>
      <input v-model.number="n" type="range" min="1" max="20" />
    </label>
    <label class="pg-row">
      <span>각 단계 1회 성공률</span><strong>{{ p }}%</strong>
      <input v-model.number="p" type="range" min="50" max="99" />
    </label>
    <label class="pg-row">
      <span>검증기가 틀린 출력을 잡는 비율 (재현율)</span><strong>{{ r }}%</strong>
      <input v-model.number="r" type="range" min="0" max="100" />
    </label>
    <label class="pg-row">
      <span>검증기가 맞는 출력을 괜히 막는 비율 (오탐)</span><strong>{{ f }}%</strong>
      <input v-model.number="f" type="range" min="0" max="30" />
    </label>
    <label class="pg-row">
      <span>막혔을 때 최대 재시도</span><strong>{{ m }}번</strong>
      <input v-model.number="m" type="range" min="0" max="5" />
    </label>

    <svg class="pg-svg" viewBox="0 0 300 26" preserveAspectRatio="none" role="img"
      :aria-label="`끝까지 정답 ${pct(res.correct)}, 조용한 오류 ${pct(res.silent)}, 사람에게 넘김 ${pct(res.escalated)}`">
      <rect v-for="s in bars" :key="s.key" :x="s.x * 3" y="0" :width="Math.max(0, s.w * 3 - 1)" height="26" rx="3" :fill="s.c">
        <title>{{ s.key }} {{ pct(s.v) }}</title>
      </rect>
    </svg>
    <div class="pg-legend">
      <span v-for="s in segs" :key="s.key"><i :style="{ background: s.c }" />{{ s.key }} {{ pct(s.v) }}</span>
    </div>

    <div class="pg-cards" style="margin-top: 14px">
      <div class="pg-card a">
        <div class="pg-label">끝까지 정답</div>
        <div class="pg-value">{{ pct(res.correct) }}</div>
        <div class="pg-sub">검증 없이 Pass^{{ n }} = {{ pct(res.baseline) }}</div>
      </div>
      <div class="pg-card b">
        <div class="pg-label">조용한 오류 <small>틀렸는데 통과</small></div>
        <div class="pg-value">{{ pct(res.silent) }}</div>
        <div class="pg-sub">아무도 모른 채 고객에게 간다</div>
      </div>
      <div class="pg-card n">
        <div class="pg-label">업무 1건당 생성 호출</div>
        <div class="pg-value">{{ res.calls.toFixed(2) }}회</div>
        <div class="pg-sub"><template v-if="res.verifier">검증 호출도 같은 횟수만큼 더</template><template v-else>검증 없음</template></div>
      </div>
    </div>

    <p class="pg-note">재시도가 앞 시도와 독립이고 성공률도 같다고 본 이론값이다. 실제로는 같은 실수를 반복하기도 하고, 오류 메시지를 주면 성공률이 오르기도 한다.</p>
  </div>
</template>

<style src="./playground.css"></style>
