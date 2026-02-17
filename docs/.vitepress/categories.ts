export interface Category {
  id: string
  label: string
  order: number
  children?: Category[]
}

export const categories: Category[] = [
  {
    id: 'ai-llm',
    label: 'AI / LLM',
    order: 1,
  },
  {
    id: 'physical-ai',
    label: '피지컬 AI',
    order: 2,
  },
  {
    id: 'langchain-langgraph',
    label: '랭체인 & 랭그래프',
    order: 3,
    children: [
      { id: 'background', label: '배경지식', order: 1 },
      { id: 'langchain', label: 'LangChain', order: 2 },
      { id: 'langgraph', label: 'LangGraph', order: 3 },
      { id: 'evaluation', label: 'LLM 평가', order: 4 },
    ],
  },
  {
    id: 'dearme',
    label: 'DearMe',
    order: 4,
    children: [
      { id: 'frontend', label: '프론트엔드', order: 1 },
      { id: 'backend', label: '백엔드', order: 2 },
      { id: 'ai', label: 'AI', order: 3 },
    ],
  },
  {
    id: 'blog',
    label: '블로그',
    order: 5,
  },
  {
    id: 'test',
    label: '테스트',
    order: 100,
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
