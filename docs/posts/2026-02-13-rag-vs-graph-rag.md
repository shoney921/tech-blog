---
title: RAG vs Graph RAG - 아키텍처, 성능, 그리고 선택 기준
date: 2026-02-13
category: AI / LLM
---

# RAG vs Graph RAG - 아키텍처, 성능, 그리고 선택 기준

LLM 기반 애플리케이션에서 외부 지식을 활용하는 대표적인 방법인 **RAG(Retrieval-Augmented Generation)**와 이를 그래프 구조로 확장한 **Graph RAG**를 비교 분석한다.

## RAG란?

RAG(Retrieval-Augmented Generation)는 2020년 Meta(Facebook AI Research)가 제안한 기법으로, LLM이 응답을 생성하기 전에 외부 데이터소스에서 관련 정보를 검색(Retrieve)하여 컨텍스트로 제공하는 방식이다.

> RAG는 LLM의 지식 한계를 보완하기 위해 설계되었다. 모델의 학습 데이터에 없는 최신 정보나 도메인 특화 지식을 실시간으로 제공할 수 있다. — [AWS - What is RAG?](https://aws.amazon.com/what-is/retrieval-augmented-generation/)

### RAG 아키텍처

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│  Documents  │───▶│  Chunk & Embed   │───▶│ Vector DB   │
└─────────────┘    └──────────────────┘    └──────┬──────┘
                                                  │
┌─────────────┐    ┌──────────────────┐           │
│  User Query │───▶│  Query Embedding │───────────┘
└─────────────┘    └──────────────────┘           │
                                           Semantic Search
                                                  │
                   ┌──────────────────┐    ┌──────▼──────┐
                   │   LLM Response   │◀───│  Context +  │
                   └──────────────────┘    │    Query    │
                                           └─────────────┘
```

**동작 과정:**

1. **Indexing**: 문서를 청크(chunk) 단위로 분할하고 임베딩 벡터로 변환하여 벡터 DB에 저장
2. **Retrieval**: 사용자 질의를 임베딩으로 변환 후, 벡터 DB에서 의미적으로 유사한 청크를 검색
3. **Generation**: 검색된 청크를 컨텍스트로 LLM에 전달하여 응답 생성

### RAG의 한계

[Seven Failure Points When Engineering a RAG System (arxiv, 2024)](https://arxiv.org/html/2401.05856v1)에서 정리한 RAG의 주요 실패 지점:

- **낮은 정밀도(Low Precision)**: 질의와 관련 없는 청크가 검색되어 노이즈 발생
- **낮은 재현율(Low Recall)**: 관련 있는 청크를 놓치는 경우
- **글로벌 질의 불가**: "이 데이터셋의 주요 주제는?" 같은 전체 코퍼스에 대한 질의에 취약
- **멀티홉 추론 한계**: 여러 문서에 분산된 정보를 연결하는 복합 추론에 약함
- **컨텍스트 윈도우 제약**: 검색된 청크 수가 제한적

참고: [Retrieval-Augmented Generation (RAG) | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## Graph RAG란?

Graph RAG는 Microsoft Research가 2024년 발표한 접근법으로, 문서에서 **지식 그래프(Knowledge Graph)**를 구축하고 이를 기반으로 검색 및 요약을 수행한다. 단순한 벡터 유사도 검색을 넘어, 엔티티 간 **관계(Relationship)**를 활용한 구조화된 추론이 핵심이다.

> GraphRAG는 텍스트에서 지식 그래프를 추출하고, 커뮤니티 계층 구조를 구축하며, 이 커뮤니티에 대한 요약을 생성하여 LLM의 추론 능력을 향상시킨다. — [Microsoft GraphRAG 공식 문서](https://microsoft.github.io/graphrag/)

### Graph RAG 아키텍처

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Documents  │───▶│  LLM Extraction  │───▶│ Knowledge Graph │
└─────────────┘    │  - Entities      │    │  (Nodes/Edges)  │
                   │  - Relationships │    └────────┬────────┘
                   │  - Claims        │             │
                   └──────────────────┘      Leiden Algorithm
                                                    │
                                           ┌────────▼────────┐
                                           │   Community      │
                                           │   Hierarchy      │
                                           │   + Summaries    │
                                           └────────┬────────┘
                                                    │
┌─────────────┐                            ┌────────▼────────┐
│  User Query │───────────────────────────▶│  Graph Search    │
└─────────────┘                            │  - Global Search │
                                           │  - Local Search  │
                   ┌──────────────────┐    │  - DRIFT Search  │
                   │   LLM Response   │◀───└─────────────────┘
                   └──────────────────┘
```

참고: [From Local to Global: A Graph RAG Approach to Query-Focused Summarization (arxiv, 2024)](https://arxiv.org/abs/2404.16130)

### 인덱싱 단계

1. **텍스트 유닛 분할**: 원본 문서를 분석 가능한 텍스트 유닛으로 분할
2. **엔티티/관계 추출**: LLM을 사용해 사람, 장소, 조직 등 엔티티와 관계를 추출. 여러 라운드의 "gleaning"으로 누락된 엔티티를 보완
3. **지식 그래프 구축**: 추출된 엔티티와 관계로 그래프 생성 (주어-서술어-목적어 트리플)
4. **커뮤니티 탐지**: **Leiden 알고리즘**으로 밀접하게 연결된 노드를 계층적 커뮤니티로 그룹화
5. **커뮤니티 요약**: 각 커뮤니티에 대해 bottom-up 방식으로 요약 생성

참고: [How Microsoft GraphRAG Works Step-By-Step](https://tech.bertelsmann.com/en/blog/articles/how-microsoft-graphrag-works-step-by-step-part-12)

### 검색 모드

| 모드 | 설명 | 적합한 질의 |
|------|------|------------|
| **Global Search** | 커뮤니티 요약을 활용한 전체 코퍼스 추론 | "데이터셋의 주요 주제는?" |
| **Local Search** | 특정 엔티티와 인접 노드 탐색 | "A 회사와 B 회사의 관계는?" |
| **DRIFT Search** | 엔티티 탐색 + 커뮤니티 컨텍스트 결합 | 복합적인 탐색 질의 |

참고: [Microsoft GraphRAG GitHub](https://github.com/microsoft/graphrag)

---

## 핵심 비교

### 아키텍처 차이

| 항목 | RAG | Graph RAG |
|------|-----|-----------|
| **데이터 표현** | 벡터 임베딩 (비정형) | 지식 그래프 (노드 + 엣지) |
| **검색 방식** | 코사인 유사도 기반 시맨틱 검색 | 그래프 순회 + 관계 기반 탐색 |
| **인덱싱 비용** | 낮음 (임베딩 생성) | 높음 (LLM으로 엔티티 추출 + 그래프 구축) |
| **검색 단위** | 텍스트 청크 | 엔티티, 관계, 커뮤니티 요약 |
| **글로벌 질의** | 취약 | 커뮤니티 요약으로 우수 |
| **멀티홉 추론** | 제한적 | 그래프 순회로 자연스럽게 지원 |

참고: [RAG vs GraphRAG: Shared Goal & Key Differences | Memgraph](https://memgraph.com/blog/rag-vs-graphrag)

### 벤치마크 성능

2025년 2월 발표된 [RAG vs. GraphRAG: A Systematic Evaluation and Key Insights (arxiv, 2025)](https://arxiv.org/abs/2502.11371)의 주요 결과:

**Question Answering 태스크:**
- **싱글홉 질의**: RAG가 우수 — 직접적인 사실 검색에서 벡터 기반 검색이 효율적
- **멀티홉 질의**: Graph RAG가 우수 — 여러 엔티티를 연결하는 추론에서 그래프 순회가 효과적

**Query-based Summarization 태스크:**
- **세부 정보 포착**: RAG가 우수 — 원본 텍스트 청크를 직접 전달하므로 세부 사항 보존
- **다양성과 다면적 요약**: Graph RAG가 우수 — 커뮤니티 기반 구조가 다양한 관점 제공

::: tip 핵심 인사이트
RAG와 Graph RAG는 경쟁 관계가 아니라 **상호 보완적**이다. 태스크 특성에 따라 적합한 방식이 달라진다.
:::

### 스케일링 특성

| 항목 | RAG | Graph RAG |
|------|-----|-----------|
| **수평 확장** | 용이 (벡터 DB 샤딩) | 어려움 (그래프 파티셔닝 복잡) |
| **인덱싱 시간** | 빠름 | 느림 (LLM 호출 필요) |
| **인덱싱 비용** | 임베딩 API 비용만 | LLM API 비용 (엔티티 추출) + 그래프 구축 |
| **쿼리 레이턴시** | 낮음 | 상대적으로 높음 |

참고: [GraphRAG vs. Vector RAG: Side-by-side comparison guide | Meilisearch](https://www.meilisearch.com/blog/graph-rag-vs-vector-rag)

---

## 언제 무엇을 선택할 것인가

### RAG가 적합한 경우

- 비정형 텍스트 기반의 **단순 QA** (FAQ, 문서 검색)
- **빠른 프로토타이핑**이 필요한 경우
- 데이터가 자주 업데이트되어 **실시간 인덱싱**이 중요한 경우
- 인프라 비용을 최소화해야 하는 경우

### Graph RAG가 적합한 경우

- **엔티티 간 관계**가 핵심인 도메인 (공급망, 조직도, 법률 문서)
- "전체 데이터의 주요 트렌드는?" 같은 **글로벌 질의**가 필요한 경우
- 여러 소스를 연결하는 **멀티홉 추론**이 필요한 경우
- 데이터의 **구조적 관계**를 보존해야 하는 경우

### 하이브리드 접근

실무에서는 두 방식을 결합하는 경우가 많다:

```
User Query
    │
    ├─ 단순 사실 질의 ──▶ Vector RAG (빠른 응답)
    │
    └─ 복합 관계 질의 ──▶ Graph RAG (정확한 추론)
```

참고: [Exploring RAG and GraphRAG: Understanding when and how to use both | Weaviate](https://weaviate.io/blog/graph-rag)

---

## 2025-2026 트렌드

- **Agentic RAG**: RAG에 계획(Planning) 레이어와 도구 실행 능력을 추가하여 복합 추론 태스크를 처리
- **HyperGraph RAG**: 문서를 탐색 가능한 엔티티 그래프로 취급, 과학 문헌이나 금융 문서에 최적화
- **DRIFT Search**: Microsoft GraphRAG에 추가된 새로운 검색 모드로, 엔티티 탐색과 커뮤니티 컨텍스트를 결합

참고: [RAG vs GraphRAG in 2025: A Builder's Field Guide | Medium](https://medium.com/@Quaxel/rag-vs-graphrag-in-2025-a-builders-field-guide-82bb33efed81)

---

## 참고 자료

- [AWS - What is Retrieval-Augmented Generation?](https://aws.amazon.com/what-is/retrieval-augmented-generation/)
- [Microsoft GraphRAG 공식 문서](https://microsoft.github.io/graphrag/)
- [Microsoft GraphRAG GitHub](https://github.com/microsoft/graphrag)
- [From Local to Global: A Graph RAG Approach (arxiv, 2024)](https://arxiv.org/abs/2404.16130)
- [RAG vs. GraphRAG: A Systematic Evaluation (arxiv, 2025)](https://arxiv.org/abs/2502.11371)
- [Microsoft Research - GraphRAG Project](https://www.microsoft.com/en-us/research/project/graphrag/)
- [Seven Failure Points in RAG Systems (arxiv, 2024)](https://arxiv.org/html/2401.05856v1)
- [RAG vs GraphRAG: Shared Goal & Key Differences | Memgraph](https://memgraph.com/blog/rag-vs-graphrag)
- [GraphRAG vs. Vector RAG: Side-by-side comparison | Meilisearch](https://www.meilisearch.com/blog/graph-rag-vs-vector-rag)
- [Exploring RAG and GraphRAG | Weaviate](https://weaviate.io/blog/graph-rag)
- [How Microsoft GraphRAG Works Step-By-Step | Bertelsmann Tech](https://tech.bertelsmann.com/en/blog/articles/how-microsoft-graphrag-works-step-by-step-part-12)
- [Retrieval-Augmented Generation | Pinecone](https://www.pinecone.io/learn/retrieval-augmented-generation/)
