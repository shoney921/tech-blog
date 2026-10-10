export interface Category {
  id: string
  label: string
  order: number
  /** 카테고리 랜딩·홈 카드에 보여줄 한 줄 소개 */
  description?: string
  /** true면 연재물로 취급해 목록·사이드바를 오래된 글부터(1편부터) 정렬 */
  series?: boolean
  children?: Category[]
}

export const categories: Category[] = [
  {
    id: 'ai-llm',
    label: 'AI / LLM',
    order: 1,
    description: 'LLM, RAG, 에이전트, 바이브 코딩. 개념 정리부터 실무에서 부딪힌 이야기까지.',
    children: [
      {
        id: 'ai-systems',
        label: 'AI 시스템 설계 연재',
        order: 1,
        description: 'LLM 호출 하나를 운영 가능한 시스템으로 키워가는 9편 + 보강 5편. 1편부터 순서대로 읽는 걸 권한다.',
        series: true,
      },
      {
        id: 'design-cases',
        label: 'AI 아키텍처 설계 심화',
        order: 2,
        description: '데이터 파이프라인·근거 데이터, 에이전트 워크플로우·RAG, 동적 UI 연동. 세 주제를 케이스별로 어떻게 다르게 설계하는지 3편, 그리고 도메인마다 무엇을 깊이 고민해야 하는지 1편.',
        series: true,
      },
    ],
  },
  {
    id: 'langchain-langgraph',
    label: '랭체인 & 랭그래프',
    order: 2,
    description: '배경지식 → LangChain → LangGraph → LLM 평가 순서로 이어지는 학습 연재.',
    children: [
      { id: 'background', label: '배경지식', order: 1, series: true },
      { id: 'langchain', label: 'LangChain', order: 2, series: true },
      { id: 'langgraph', label: 'LangGraph', order: 3, series: true },
      { id: 'evaluation', label: 'LLM 평가', order: 4, series: true },
    ],
  },
  {
    id: 'nadarm',
    label: '나닮',
    order: 3,
    description: '직접 만들고 운영 중인 서비스 "나닮"의 개발 기록. 프론트엔드, 백엔드, 앱 심사까지.',
    children: [
      {
        id: 'frontend',
        label: '프론트엔드',
        order: 1,
        description: '기술 스택 선택부터 배포, 캐싱, PWA, 상태 관리, SSE까지 6편 연재 + 이후 삽질기.',
        series: true,
      },
      { id: 'backend', label: '백엔드', order: 2 },
    ],
  },
  {
    id: 'physical-ai',
    label: '피지컬 AI',
    order: 4,
    description: '로봇, IoT, JEPA. 화면 밖으로 나가는 AI 이야기.',
    children: [
      { id: 'smart-home', label: '스마트홈 / IoT', order: 1 },
    ],
  },
  {
    id: 'dev-notes',
    label: '개발 노트',
    order: 5,
    description: 'DevOps, 모바일, 백엔드 잡기술. 한 번 겪고 나면 다음엔 빨리 끝내고 싶은 것들.',
  },
  {
    id: 'ax-edu',
    label: 'AX 교육',
    order: 6,
    description: '사내 AX(AI Transformation) 교육 과정을 챕터별로 정리한 노트.',
    series: true,
  },
  {
    id: 'blog',
    label: '블로그',
    order: 7,
    description: '이 블로그 자체에 대한 이야기.',
  },
]

const categoryMap = new Map<string, Category>()

function buildMap(cats: Category[], prefix = '') {
  for (const cat of cats) {
    const path = prefix ? `${prefix}/${cat.id}` : cat.id
    categoryMap.set(path, cat)
    if (cat.children) {
      buildMap(cat.children, path)
    }
  }
}

buildMap(categories)

export function getCategory(categoryPath: string): Category | undefined {
  return categoryMap.get(categoryPath)
}

export function getCategoryLabel(categoryPath: string): string {
  const cat = categoryMap.get(categoryPath)
  if (cat) return cat.label

  // 서브카테고리 경로: "ai-llm/rag" → "AI / LLM > RAG" 형태로 조합
  const parts = categoryPath.split('/')
  const labels: string[] = []
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    const c = categoryMap.get(current)
    labels.push(c ? c.label : part)
  }
  if (labels.length > 0) return labels.join(' > ')

  return categoryPath
}

/** 경로 자체 또는 상위 경로 중 하나라도 series면 연재로 본다 */
export function isSeriesPath(categoryPath: string): boolean {
  const parts = categoryPath.split('/')
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    if (categoryMap.get(current)?.series) return true
  }
  return false
}

/** order 기준으로 정렬된 최상위 카테고리 */
export const topLevelCategories = [...categories].sort((a, b) => a.order - b.order)
