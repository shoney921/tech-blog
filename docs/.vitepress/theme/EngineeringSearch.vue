<script setup lang="ts">
import { computed, ref } from 'vue'

// 공신력 있는 AI 엔지니어링 글을 한국어로 찾아 들어가는 검색창.
// 원래 사이트들은 영어로만 검색되니, 글마다 한국어 제목·키워드를 붙여 두고 여기서 거른다.
// 목록은 손으로 관리한다 — 새 글이 올라오면 POSTS 에 한 줄 추가.
type SourceId = 'anthropic' | 'openai' | 'lilian' | 'chip'
type Post = { src: SourceId; date: string; url: string; title: string; ko: string; tags: string }

const SOURCES: { id: SourceId; label: string; site: string }[] = [
  { id: 'anthropic', label: 'Anthropic Engineering', site: 'anthropic.com/engineering' },
  { id: 'openai', label: 'OpenAI Developers', site: 'developers.openai.com/blog' },
  { id: 'lilian', label: "Lilian Weng (Lil'Log)", site: 'lilianweng.github.io' },
  { id: 'chip', label: 'Chip Huyen', site: 'huyenchip.com' },
]

const A = 'https://www.anthropic.com/engineering/'
const O = 'https://developers.openai.com/blog/'
const L = 'https://lilianweng.github.io/posts/'
const C = 'https://huyenchip.com/'

const POSTS: Post[] = [
  // Anthropic Engineering
  { src: 'anthropic', date: '2026-04-23', url: A + 'april-23-postmortem', title: 'An update on recent Claude Code quality reports', ko: '최근 Claude Code 품질 이슈 보고에 대한 업데이트', tags: '포스트모템 장애 품질 회고 클로드코드' },
  { src: 'anthropic', date: '2026-04-08', url: A + 'managed-agents', title: 'Scaling Managed Agents: Decoupling the brain from the hands', ko: '매니지드 에이전트 확장: 두뇌와 손 분리하기', tags: '에이전트 인프라 아키텍처 확장 실행 환경' },
  { src: 'anthropic', date: '2026-03-25', url: A + 'claude-code-auto-mode', title: 'How we built Claude Code auto mode: a safer way to skip permissions', ko: 'Claude Code 자동 모드: 권한 확인을 더 안전하게 건너뛰기', tags: '권한 보안 자동 모드 클로드코드 분류기' },
  { src: 'anthropic', date: '2026-03-24', url: A + 'harness-design-long-running-apps', title: 'Harness design for long-running application development', ko: '장시간 앱 개발을 위한 하네스 설계', tags: '하네스 장기 실행 에이전트 코딩 앱 개발' },
  { src: 'anthropic', date: '2026-03-06', url: A + 'eval-awareness-browsecomp', title: "Eval awareness in Claude Opus 4.6's BrowseComp performance", ko: 'BrowseComp에서 드러난 Claude Opus 4.6의 평가 인식', tags: '평가 벤치마크 평가 인식 브라우징 오염' },
  { src: 'anthropic', date: '2026-02-05', url: A + 'infrastructure-noise', title: 'Quantifying infrastructure noise in agentic coding evals', ko: '에이전트 코딩 평가에서 인프라 노이즈 측정하기', tags: '평가 벤치마크 노이즈 분산 신뢰성 코딩' },
  { src: 'anthropic', date: '2026-02-05', url: A + 'building-c-compiler', title: 'Building a C compiler with a team of parallel Claudes', ko: '병렬 Claude 팀으로 C 컴파일러 만들기', tags: '멀티 에이전트 병렬 컴파일러 장기 실행 코딩' },
  { src: 'anthropic', date: '2026-01-21', url: A + 'AI-resistant-technical-evaluations', title: 'Designing AI-resistant technical evaluations', ko: 'AI로 풀기 어려운 기술 면접 과제 설계하기', tags: '채용 면접 과제 평가 코딩 테스트' },
  { src: 'anthropic', date: '2026-01-09', url: A + 'demystifying-evals-for-ai-agents', title: 'Demystifying evals for AI agents', ko: 'AI 에이전트 평가 이해하기', tags: '평가 에발 eval pass@k 채점 판정자 그레이더 신뢰성' },
  { src: 'anthropic', date: '2025-11-26', url: A + 'effective-harnesses-for-long-running-agents', title: 'Effective harnesses for long-running agents', ko: '장시간 실행 에이전트를 위한 효과적인 하네스', tags: '하네스 장기 실행 에이전트 진행 상황 기록' },
  { src: 'anthropic', date: '2025-11-24', url: A + 'advanced-tool-use', title: 'Introducing advanced tool use on the Claude Developer Platform', ko: 'Claude 개발자 플랫폼의 고급 도구 사용', tags: '도구 사용 툴 검색 tool use 함수 호출' },
  { src: 'anthropic', date: '2025-11-04', url: A + 'code-execution-with-mcp', title: 'Code execution with MCP: Building more efficient agents', ko: 'MCP와 코드 실행: 더 효율적인 에이전트 만들기', tags: 'MCP 코드 실행 도구 토큰 절감 효율' },
  { src: 'anthropic', date: '2025-10-20', url: A + 'claude-code-sandboxing', title: 'Beyond permission prompts: making Claude Code more secure and autonomous', ko: '권한 프롬프트를 넘어: Claude Code 샌드박싱', tags: '샌드박스 보안 권한 격리 클로드코드' },
  { src: 'anthropic', date: '2025-10-16', url: A + 'equipping-agents-for-the-real-world-with-agent-skills', title: 'Equipping agents for the real world with Agent Skills', ko: '에이전트 스킬로 실전 에이전트 갖추기', tags: '스킬 skills 에이전트 확장 지식' },
  { src: 'anthropic', date: '2025-09-29', url: A + 'effective-context-engineering-for-ai-agents', title: 'Effective context engineering for AI agents', ko: 'AI 에이전트를 위한 효과적인 컨텍스트 엔지니어링', tags: '컨텍스트 엔지니어링 메모리 프롬프트 압축 토큰' },
  { src: 'anthropic', date: '2025-09-17', url: A + 'a-postmortem-of-three-recent-issues', title: 'A postmortem of three recent issues', ko: '최근 세 가지 장애 포스트모템', tags: '포스트모템 장애 회고 품질 인프라' },
  { src: 'anthropic', date: '2025-09-11', url: A + 'writing-tools-for-agents', title: 'Writing effective tools for agents — with agents', ko: '에이전트용 도구를 에이전트와 함께 잘 만들기', tags: '도구 설계 툴 tool use MCP 평가' },
  { src: 'anthropic', date: '2025-06-26', url: A + 'desktop-extensions', title: 'Desktop Extensions: One-click MCP server installation for Claude Desktop', ko: '데스크톱 확장: Claude Desktop에 MCP 서버 원클릭 설치', tags: 'MCP 서버 설치 데스크톱 확장' },
  { src: 'anthropic', date: '2025-06-13', url: A + 'multi-agent-research-system', title: 'How we built our multi-agent research system', ko: '멀티 에이전트 리서치 시스템을 만든 방법', tags: '멀티 에이전트 오케스트레이터 리서치 병렬 평가' },
  { src: 'anthropic', date: '2025-04-18', url: A + 'claude-code-best-practices', title: 'Claude Code: Best practices for agentic coding', ko: 'Claude Code 에이전틱 코딩 모범 사례', tags: '클로드코드 코딩 모범 사례 CLAUDE.md 워크플로' },
  { src: 'anthropic', date: '2025-03-20', url: A + 'claude-think-tool', title: 'The "think" tool: Enabling Claude to stop and think in complex tool use situations', ko: '"think" 도구: 복잡한 도구 사용 중 멈춰서 생각하기', tags: '생각 추론 도구 사용 think' },
  { src: 'anthropic', date: '2025-01-06', url: A + 'swe-bench-sonnet', title: 'Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet', ko: 'Claude 3.5 Sonnet으로 SWE-bench Verified 기록 경신', tags: '벤치마크 평가 코딩 에이전트 SWE-bench' },
  { src: 'anthropic', date: '2024-12-19', url: A + 'building-effective-agents', title: 'Building effective agents', ko: '효과적인 에이전트 만들기', tags: '에이전트 워크플로 프롬프트 체이닝 라우팅 병렬화 보팅 투표 오케스트레이터 평가자 최적화' },
  { src: 'anthropic', date: '2024-09-19', url: A + 'contextual-retrieval', title: 'Introducing Contextual Retrieval', ko: '컨텍스추얼 리트리벌(맥락 검색) 소개', tags: 'RAG 검색 임베딩 BM25 리랭킹 청크' },
  { src: 'anthropic', date: '', url: A + 'how-we-contain-claude', title: 'How we contain Claude across products', ko: '제품 전반에서 Claude를 격리하는 방법', tags: '샌드박스 보안 격리 컨테이너' },

  // OpenAI Developers 블로그 — 제품 홍보성 글은 빼고 엔지니어링 위주로
  { src: 'openai', date: '2026-09-11', url: O + 'rethinking-skills-and-prompts-for-gpt-6-astra', title: 'Rethinking skills and prompts for GPT-6 Astra', ko: 'GPT-6 Astra에 맞춰 스킬과 프롬프트 다시 생각하기', tags: '프롬프트 스킬 skills 프롬프트 엔지니어링' },
  { src: 'openai', date: '2026-08-25', url: O + 'automating-repetitive-work-at-openai-with-codex', title: 'Automating repetitive work at OpenAI with Codex', ko: 'OpenAI는 Codex로 반복 업무를 어떻게 자동화하나', tags: '코덱스 자동화 코딩 에이전트 사내 활용' },
  { src: 'openai', date: '2026-08-19', url: O + 'codex-as-a-platform', title: 'Codex as a platform: build on the open agent harness', ko: '플랫폼으로서의 Codex: 공개 에이전트 하네스 위에 만들기', tags: '하네스 코덱스 에이전트 플랫폼 코딩' },
  { src: 'openai', date: '2026-07-20', url: O + 'custom-code-review-rules-for-codex', title: 'Custom Code Review rules for Codex', ko: 'Codex 코드 리뷰 규칙 직접 정하기', tags: '코드 리뷰 코덱스 규칙 코딩' },
  { src: 'openai', date: '2026-06-26', url: O + 'connect-private-mcp-servers-to-openai-products', title: 'Making private MCP servers reachable without making them public', ko: '비공개 MCP 서버를 공개하지 않고 연결하기', tags: 'MCP 서버 보안 네트워크 사내' },
  { src: 'openai', date: '2026-03-11', url: O + 'one-year-of-responses', title: 'From prompts to products: One year of Responses', ko: '프롬프트에서 제품까지: Responses API 1년', tags: 'API 설계 responses 회고' },
  { src: 'openai', date: '2026-03-09', url: O + 'skills-agents-sdk', title: 'Using skills to accelerate OSS maintenance', ko: '스킬로 오픈소스 유지보수 빠르게 하기', tags: '스킬 skills 에이전트 SDK 오픈소스' },
  { src: 'openai', date: '2026-02-23', url: O + 'run-long-horizon-tasks-with-codex', title: 'Run long horizon tasks with Codex', ko: 'Codex로 긴 작업 맡기기', tags: '장기 실행 하네스 코덱스 에이전트 코딩' },
  { src: 'openai', date: '2026-02-11', url: O + 'skills-shell-tips', title: 'Shell + Skills + Compaction: Tips for long-running agents that do real work', ko: '셸·스킬·압축: 실제 일을 하는 장시간 에이전트를 위한 팁', tags: '장기 실행 컨텍스트 압축 스킬 셸 에이전트 하네스' },
  { src: 'openai', date: '2026-02-04', url: O + '15-lessons-building-chatgpt-apps', title: '15 lessons learned building ChatGPT Apps', ko: 'ChatGPT 앱을 만들며 배운 15가지', tags: '앱 MCP 교훈 회고 제품' },
  { src: 'openai', date: '2026-01-22', url: O + 'eval-skills', title: 'Testing Agent Skills Systematically with Evals', ko: '평가로 에이전트 스킬을 체계적으로 테스트하기', tags: '평가 eval 스킬 테스트 신뢰성' },
  { src: 'openai', date: '2025-09-22', url: O + 'responses-api', title: 'Why we built the Responses API', ko: 'Responses API를 만든 이유', tags: 'API 설계 상태 추론 도구 사용' },
  { src: 'openai', date: '2025-09-12', url: O + 'realtime-api', title: 'Developer notes on the Realtime API', ko: 'Realtime API 개발자 노트', tags: '음성 실시간 보이스 API' },

  // Lilian Weng — 길고 깊은 정리 글. 개념을 제대로 잡고 싶을 때
  { src: 'lilian', date: '2026-07-04', url: L + '2026-07-04-harness/', title: 'Harness Engineering for Self-Improvement', ko: '자기 개선을 위한 하네스 엔지니어링', tags: '하네스 자기 개선 에이전트' },
  { src: 'lilian', date: '2026-06-24', url: L + '2026-06-24-scaling-laws/', title: 'Scaling Laws, Carefully', ko: '스케일링 법칙, 조심스럽게 보기', tags: '스케일링 법칙 학습 모델 크기' },
  { src: 'lilian', date: '2025-05-01', url: L + '2025-05-01-thinking/', title: 'Why We Think', ko: '모델은 왜 생각하는가 (추론·테스트 타임 컴퓨트)', tags: '추론 생각 사고 테스트 타임 컴퓨트 CoT' },
  { src: 'lilian', date: '2024-11-28', url: L + '2024-11-28-reward-hacking/', title: 'Reward Hacking in Reinforcement Learning', ko: '강화학습의 보상 해킹', tags: '강화학습 보상 해킹 RLHF 정렬' },
  { src: 'lilian', date: '2024-07-07', url: L + '2024-07-07-hallucination/', title: 'Extrinsic Hallucinations in LLMs', ko: 'LLM의 외재적 환각', tags: '환각 할루시네이션 사실성 평가 신뢰성' },
  { src: 'lilian', date: '2024-02-05', url: L + '2024-02-05-human-data-quality/', title: 'Thinking about High-Quality Human Data', ko: '고품질 사람 데이터에 대하여', tags: '데이터 라벨링 품질 사람 평가' },
  { src: 'lilian', date: '2023-10-25', url: L + '2023-10-25-adv-attack-llm/', title: 'Adversarial Attacks on LLMs', ko: 'LLM에 대한 적대적 공격', tags: '보안 탈옥 jailbreak 프롬프트 인젝션 공격' },
  { src: 'lilian', date: '2023-06-23', url: L + '2023-06-23-agent/', title: 'LLM Powered Autonomous Agents', ko: 'LLM 기반 자율 에이전트', tags: '에이전트 계획 메모리 도구 사용' },
  { src: 'lilian', date: '2023-03-15', url: L + '2023-03-15-prompt-engineering/', title: 'Prompt Engineering', ko: '프롬프트 엔지니어링', tags: '프롬프트 퓨샷 CoT 추론' },
  { src: 'lilian', date: '2023-01-27', url: L + '2023-01-27-the-transformer-family-v2/', title: 'The Transformer Family Version 2.0', ko: '트랜스포머 계열 정리 2.0', tags: '트랜스포머 어텐션 아키텍처 모델' },
  { src: 'lilian', date: '2023-01-10', url: L + '2023-01-10-inference-optimization/', title: 'Large Transformer Model Inference Optimization', ko: '대형 트랜스포머 추론 최적화', tags: '추론 최적화 양자화 서빙 성능 인퍼런스' },
  { src: 'lilian', date: '2020-10-29', url: L + '2020-10-29-odqa/', title: 'How to Build an Open-Domain Question Answering System?', ko: '오픈 도메인 질의응답 시스템 만들기', tags: 'RAG 검색 질의응답 리트리버 QA' },

  // Chip Huyen — 『AI Engineering』 저자. 실무 관점 정리
  { src: 'chip', date: '2025-01-16', url: C + '2025/01/16/ai-engineering-pitfalls.html', title: 'Common pitfalls when building generative AI applications', ko: '생성형 AI 앱을 만들 때 흔히 빠지는 함정', tags: '실수 함정 실무 제품 평가' },
  { src: 'chip', date: '2025-01-07', url: C + '2025/01/07/agents.html', title: 'Agents', ko: '에이전트', tags: '에이전트 계획 도구 사용 실패 평가' },
  { src: 'chip', date: '2024-07-25', url: C + '2024/07/25/genai-platform.html', title: 'Building A Generative AI Platform', ko: '생성형 AI 플랫폼 만들기', tags: '아키텍처 플랫폼 RAG 가드레일 라우팅 캐시' },
  { src: 'chip', date: '2024-02-28', url: C + '2024/02/28/predictive-human-preference.html', title: 'Predictive Human Preference: From Model Ranking to Model Routing', ko: '사람 선호 예측: 모델 순위에서 모델 라우팅까지', tags: '라우팅 모델 선택 선호 평가' },
  { src: 'chip', date: '2024-01-16', url: C + '2024/01/16/sampling.html', title: 'Generation configurations: temperature, top-k, top-p, and test time compute', ko: '생성 설정: temperature, top-k, top-p, 테스트 타임 컴퓨트', tags: '샘플링 온도 파라미터 디코딩' },
  { src: 'chip', date: '2023-10-10', url: C + '2023/10/10/multimodal.html', title: 'Multimodality and Large Multimodal Models (LMMs)', ko: '멀티모달과 대형 멀티모달 모델', tags: '멀티모달 이미지 비전 모델' },
  { src: 'chip', date: '2023-08-16', url: C + '2023/08/16/llm-research-open-challenges.html', title: 'Open challenges in LLM research', ko: 'LLM 연구의 열린 과제들', tags: '연구 과제 환각 컨텍스트' },
  { src: 'chip', date: '2023-05-02', url: C + '2023/05/02/rlhf.html', title: 'RLHF: Reinforcement Learning from Human Feedback', ko: 'RLHF: 사람 피드백 기반 강화학습', tags: '강화학습 RLHF 정렬 학습' },
  { src: 'chip', date: '2023-04-11', url: C + '2023/04/11/llm-engineering.html', title: 'Building LLM applications for production', ko: '프로덕션용 LLM 애플리케이션 만들기', tags: '실무 프로덕션 프롬프트 비용 지연 평가' },
]

// 구글 검색용 — 자주 쓰는 한국어 용어만 영어로 바꾼다. 없는 단어는 그대로 넘긴다.
const DICT: Record<string, string> = {
  에이전트: 'agent', 평가: 'evals', 컨텍스트: 'context', 프롬프트: 'prompt', 도구: 'tool', 툴: 'tool',
  검색: 'retrieval', 보안: 'security', 샌드박스: 'sandbox', 권한: 'permission', 멀티: 'multi-agent',
  병렬: 'parallel', 하네스: 'harness', 스킬: 'skills', 메모리: 'memory', 코딩: 'coding',
  벤치마크: 'benchmark', 장애: 'postmortem', 추론: 'reasoning', 설계: 'design', 워크플로: 'workflow',
  환각: 'hallucination', 강화학습: 'reinforcement learning', 최적화: 'optimization', 라우팅: 'routing',
}

const q = ref('')
const src = ref<SourceId | ''>('')

const terms = computed(() => q.value.trim().toLowerCase().split(/\s+/).filter(Boolean))

const results = computed(() =>
  POSTS.filter(p => !src.value || p.src === src.value)
    .filter(p => {
      const hay = `${p.title} ${p.ko} ${p.tags} ${p.url}`.toLowerCase()
      return terms.value.every(t => hay.includes(t))
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const label = (id: SourceId) => SOURCES.find(s => s.id === id)!.label
const count = (id: SourceId) => POSTS.filter(p => p.src === id).length
// 구글 번역을 거쳐 열면 페이지 전체가 한국어로 나온다
const translated = (p: Post) =>
  `https://translate.google.com/translate?sl=en&tl=ko&u=${encodeURIComponent(p.url)}`

const googleUrl = computed(() => {
  const en = terms.value.map(t => DICT[t] ?? t).join(' ')
  const sites = SOURCES.filter(s => !src.value || s.id === src.value).map(s => `site:${s.site}`)
  const scope = sites.length > 1 ? `(${sites.join(' OR ')})` : sites[0]
  return `https://www.google.com/search?q=${encodeURIComponent(`${scope} ${en}`)}`
})
</script>

<template>
  <div class="es">
    <input
      v-model="q"
      class="es-input"
      type="search"
      placeholder="한국어로 검색 — 예: 평가, 컨텍스트, 하네스, 환각, MCP"
      aria-label="AI 엔지니어링 글 검색"
    />
    <div class="es-chips">
      <button :class="{ on: !src }" @click="src = ''">전체 {{ POSTS.length }}</button>
      <button v-for="s in SOURCES" :key="s.id" :class="{ on: src === s.id }" @click="src = s.id">
        {{ s.label }} {{ count(s.id) }}
      </button>
    </div>
    <div class="es-meta">
      {{ results.length }}개
      <a v-if="terms.length" :href="googleUrl" target="_blank" rel="noopener">구글에서 더 찾기 ↗</a>
    </div>

    <ul class="es-list">
      <li v-for="p in results" :key="p.url">
        <a class="es-ko" :href="translated(p)" target="_blank" rel="noopener">{{ p.ko }}</a>
        <div class="es-en">
          <span class="es-src">{{ label(p.src) }}</span>
          · {{ p.title }}
          <span v-if="p.date"> · {{ p.date }}</span>
          · <a :href="p.url" target="_blank" rel="noopener">원문</a>
        </div>
      </li>
    </ul>
    <p v-if="!results.length" class="es-empty">목록에 없다. 위의 "구글에서 더 찾기"를 눌러 보자.</p>
  </div>
</template>

<style scoped>
.es-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  font-size: 16px;
}
.es-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
.es-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.es-chips button {
  padding: 3px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.es-chips button.on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.es-meta {
  display: flex;
  justify-content: space-between;
  margin: 8px 2px 4px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.es-list {
  list-style: none;
  padding: 0 !important;
}
.es-list li {
  margin: 0;
  padding: 12px 2px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.es-ko {
  font-weight: 600;
  text-decoration: none !important;
}
.es-en {
  margin-top: 2px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.es-src {
  font-weight: 600;
}
.es-empty {
  color: var(--vp-c-text-2);
}
</style>
