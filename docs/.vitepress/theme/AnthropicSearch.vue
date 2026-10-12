<script setup lang="ts">
import { computed, ref } from 'vue'

// Anthropic Engineering 글을 한국어로 찾아 들어가는 검색창.
// 저쪽 사이트는 영어로만 검색되니, 글 목록에 한국어 제목·키워드를 붙여 두고 여기서 거른다.
// 목록은 손으로 관리한다 — 새 글이 올라오면 POSTS 에 한 줄 추가.
type Post = { date: string; slug: string; title: string; ko: string; tags: string }

const POSTS: Post[] = [
  { date: '2026-04-23', slug: 'april-23-postmortem', title: 'An update on recent Claude Code quality reports', ko: '최근 Claude Code 품질 이슈 보고에 대한 업데이트', tags: '포스트모템 장애 품질 회고 클로드코드' },
  { date: '2026-04-08', slug: 'managed-agents', title: 'Scaling Managed Agents: Decoupling the brain from the hands', ko: '매니지드 에이전트 확장: 두뇌와 손 분리하기', tags: '에이전트 인프라 아키텍처 확장 실행 환경' },
  { date: '2026-03-25', slug: 'claude-code-auto-mode', title: 'How we built Claude Code auto mode: a safer way to skip permissions', ko: 'Claude Code 자동 모드: 권한 확인을 더 안전하게 건너뛰기', tags: '권한 보안 자동 모드 클로드코드 분류기' },
  { date: '2026-03-24', slug: 'harness-design-long-running-apps', title: 'Harness design for long-running application development', ko: '장시간 앱 개발을 위한 하네스 설계', tags: '하네스 장기 실행 에이전트 코딩 앱 개발' },
  { date: '2026-03-06', slug: 'eval-awareness-browsecomp', title: "Eval awareness in Claude Opus 4.6's BrowseComp performance", ko: 'BrowseComp에서 드러난 Claude Opus 4.6의 평가 인식', tags: '평가 벤치마크 평가 인식 브라우징 오염' },
  { date: '2026-02-05', slug: 'infrastructure-noise', title: 'Quantifying infrastructure noise in agentic coding evals', ko: '에이전트 코딩 평가에서 인프라 노이즈 측정하기', tags: '평가 벤치마크 노이즈 분산 신뢰성 코딩' },
  { date: '2026-02-05', slug: 'building-c-compiler', title: 'Building a C compiler with a team of parallel Claudes', ko: '병렬 Claude 팀으로 C 컴파일러 만들기', tags: '멀티 에이전트 병렬 컴파일러 장기 실행 코딩' },
  { date: '2026-01-21', slug: 'AI-resistant-technical-evaluations', title: 'Designing AI-resistant technical evaluations', ko: 'AI로 풀기 어려운 기술 면접 과제 설계하기', tags: '채용 면접 과제 평가 코딩 테스트' },
  { date: '2026-01-09', slug: 'demystifying-evals-for-ai-agents', title: 'Demystifying evals for AI agents', ko: 'AI 에이전트 평가 이해하기', tags: '평가 에발 eval pass@k 채점 판정자 그레이더 신뢰성' },
  { date: '2025-11-26', slug: 'effective-harnesses-for-long-running-agents', title: 'Effective harnesses for long-running agents', ko: '장시간 실행 에이전트를 위한 효과적인 하네스', tags: '하네스 장기 실행 에이전트 진행 상황 기록' },
  { date: '2025-11-24', slug: 'advanced-tool-use', title: 'Introducing advanced tool use on the Claude Developer Platform', ko: 'Claude 개발자 플랫폼의 고급 도구 사용', tags: '도구 사용 툴 검색 tool use 함수 호출' },
  { date: '2025-11-04', slug: 'code-execution-with-mcp', title: 'Code execution with MCP: Building more efficient agents', ko: 'MCP와 코드 실행: 더 효율적인 에이전트 만들기', tags: 'MCP 코드 실행 도구 토큰 절감 효율' },
  { date: '2025-10-20', slug: 'claude-code-sandboxing', title: 'Beyond permission prompts: making Claude Code more secure and autonomous', ko: '권한 프롬프트를 넘어: Claude Code 샌드박싱', tags: '샌드박스 보안 권한 격리 클로드코드' },
  { date: '2025-10-16', slug: 'equipping-agents-for-the-real-world-with-agent-skills', title: 'Equipping agents for the real world with Agent Skills', ko: '에이전트 스킬로 실전 에이전트 갖추기', tags: '스킬 skills 에이전트 확장 지식' },
  { date: '2025-09-29', slug: 'effective-context-engineering-for-ai-agents', title: 'Effective context engineering for AI agents', ko: 'AI 에이전트를 위한 효과적인 컨텍스트 엔지니어링', tags: '컨텍스트 엔지니어링 메모리 프롬프트 압축 토큰' },
  { date: '2025-09-17', slug: 'a-postmortem-of-three-recent-issues', title: 'A postmortem of three recent issues', ko: '최근 세 가지 장애 포스트모템', tags: '포스트모템 장애 회고 품질 인프라' },
  { date: '2025-09-11', slug: 'writing-tools-for-agents', title: 'Writing effective tools for agents — with agents', ko: '에이전트용 도구를 에이전트와 함께 잘 만들기', tags: '도구 설계 툴 tool use MCP 평가' },
  { date: '2025-06-26', slug: 'desktop-extensions', title: 'Desktop Extensions: One-click MCP server installation for Claude Desktop', ko: '데스크톱 확장: Claude Desktop에 MCP 서버 원클릭 설치', tags: 'MCP 서버 설치 데스크톱 확장' },
  { date: '2025-06-13', slug: 'multi-agent-research-system', title: 'How we built our multi-agent research system', ko: '멀티 에이전트 리서치 시스템을 만든 방법', tags: '멀티 에이전트 오케스트레이터 리서치 병렬 평가' },
  { date: '2025-04-18', slug: 'claude-code-best-practices', title: 'Claude Code: Best practices for agentic coding', ko: 'Claude Code 에이전틱 코딩 모범 사례', tags: '클로드코드 코딩 모범 사례 CLAUDE.md 워크플로' },
  { date: '2025-03-20', slug: 'claude-think-tool', title: 'The "think" tool: Enabling Claude to stop and think in complex tool use situations', ko: '"think" 도구: 복잡한 도구 사용 중 멈춰서 생각하기', tags: '생각 추론 도구 사용 think' },
  { date: '2025-01-06', slug: 'swe-bench-sonnet', title: 'Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet', ko: 'Claude 3.5 Sonnet으로 SWE-bench Verified 기록 경신', tags: '벤치마크 평가 코딩 에이전트 SWE-bench' },
  { date: '2024-12-19', slug: 'building-effective-agents', title: 'Building effective agents', ko: '효과적인 에이전트 만들기', tags: '에이전트 워크플로 프롬프트 체이닝 라우팅 병렬화 보팅 투표 오케스트레이터 평가자 최적화' },
  { date: '2024-09-19', slug: 'contextual-retrieval', title: 'Introducing Contextual Retrieval', ko: '컨텍스추얼 리트리벌(맥락 검색) 소개', tags: 'RAG 검색 임베딩 BM25 리랭킹 청크' },
  { date: '', slug: 'how-we-contain-claude', title: 'How we contain Claude across products', ko: '제품 전반에서 Claude를 격리하는 방법', tags: '샌드박스 보안 격리 컨테이너' },
]

// 구글 검색용 — 자주 쓰는 한국어 용어만 영어로 바꾼다. 없는 단어는 그대로 넘긴다.
const DICT: Record<string, string> = {
  에이전트: 'agent', 평가: 'evals', 컨텍스트: 'context', 프롬프트: 'prompt', 도구: 'tool', 툴: 'tool',
  검색: 'retrieval', 보안: 'security', 샌드박스: 'sandbox', 권한: 'permission', 멀티: 'multi-agent',
  병렬: 'parallel', 하네스: 'harness', 스킬: 'skills', 메모리: 'memory', 코딩: 'coding',
  벤치마크: 'benchmark', 장애: 'postmortem', 추론: 'reasoning', 설계: 'design', 워크플로: 'workflow',
}

const q = ref('')

const terms = computed(() => q.value.trim().toLowerCase().split(/\s+/).filter(Boolean))

const results = computed(() => {
  if (!terms.value.length) return POSTS
  return POSTS.filter(p => {
    const hay = `${p.title} ${p.ko} ${p.tags} ${p.slug}`.toLowerCase()
    return terms.value.every(t => hay.includes(t))
  })
})

const original = (p: Post) => `https://www.anthropic.com/engineering/${p.slug}`
// 구글 번역 프록시로 열면 페이지 전체가 한국어로 나온다
const translated = (p: Post) =>
  `https://www-anthropic-com.translate.goog/engineering/${p.slug}?_x_tr_sl=en&_x_tr_tl=ko&_x_tr_hl=ko`

const googleUrl = computed(() => {
  const en = terms.value.map(t => DICT[t] ?? t).join(' ')
  return `https://www.google.com/search?q=${encodeURIComponent(`site:anthropic.com/engineering ${en}`)}`
})
</script>

<template>
  <div class="as">
    <input
      v-model="q"
      class="as-input"
      type="search"
      placeholder="한국어로 검색 — 예: 평가, 컨텍스트, 멀티 에이전트, MCP"
      aria-label="Anthropic Engineering 글 검색"
    />
    <div class="as-meta">
      {{ results.length }}개
      <a v-if="terms.length" :href="googleUrl" target="_blank" rel="noopener">구글에서 더 찾기 ↗</a>
    </div>

    <ul class="as-list">
      <li v-for="p in results" :key="p.slug">
        <a class="as-ko" :href="translated(p)" target="_blank" rel="noopener">{{ p.ko }}</a>
        <div class="as-en">
          {{ p.title }}
          <span v-if="p.date"> · {{ p.date }}</span>
          · <a :href="original(p)" target="_blank" rel="noopener">원문</a>
        </div>
      </li>
    </ul>
    <p v-if="!results.length" class="as-empty">목록에 없다. 위의 "구글에서 더 찾기"를 눌러 보자.</p>
  </div>
</template>

<style scoped>
.as-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  font-size: 16px;
}
.as-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
.as-meta {
  display: flex;
  justify-content: space-between;
  margin: 8px 2px 4px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.as-list {
  list-style: none;
  padding: 0 !important;
}
.as-list li {
  margin: 0;
  padding: 12px 2px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.as-ko {
  font-weight: 600;
  text-decoration: none !important;
}
.as-en {
  margin-top: 2px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.as-empty {
  color: var(--vp-c-text-2);
}
</style>
