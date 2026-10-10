---
title: "설계 심화 1/4 — AI 데이터 파이프라인과 근거 데이터 설계: 케이스가 다르면 무엇이 달라지는가"
date: 2026-10-10T09:00:00
description: 문서가 들어와 근거(evidence)가 되기까지의 파이프라인을 층으로 나누고, 파싱·청킹·인덱스·인용·권한·신선도·평가를 2026년 기준으로 정리했다. 사내 문서 Q&A, 고객지원, 금융·법률, 분석 코파일럿 네 케이스에서 설계가 어떻게 갈리는지와 서술형 답안 뼈대까지.
---

# 설계 심화 1/4 — AI 데이터 파이프라인과 근거 데이터 설계: 케이스가 다르면 무엇이 달라지는가

[연재 5편](/posts/ai-llm/ai-systems/2026-10-04-ai-agent-05-rag-pipeline)에서 "RAG는 검색 문제"라고 썼다. 그 글은 검색 품질 얘기였다. 이번 글은 그 앞과 뒤를 본다. 문서가 어디서 들어와서 어떤 층을 거쳐 "근거"가 되는가, 그리고 답변이 그 근거에 실제로 묶여 있다는 걸 어떻게 보장하는가. 솔직히 처음 RAG를 만들 때 나는 이 부분을 거의 생각하지 않았다. 벡터DB에 넣으면 끝인 줄 알았다. 문서가 바뀌었는데 인덱스는 그대로였고, 권한이 없는 사람에게 남의 부서 문서가 검색됐고, 답변이 인용한 조항이 문서에 없는 문장이었다. 세 가지 다 "파이프라인" 문제였지 모델 문제가 아니었다.

아래 수치와 버전은 2026-10-10에 확인한 것이다. 1차 출처에서 직접 본 것과 2차 출처만 본 것은 구분해 적는다.

---

## 파이프라인을 층으로 본다

데이터 엔지니어링의 메달리온(Bronze/Silver/Gold)을 LLM용으로 변형하는 설명이 요즘 여러 글에 보인다. 나는 이 틀이 꽤 쓸 만하다고 생각하는데, 이유는 **어느 층에서 실패했는지 말할 수 있게 되기 때문**이다.

| 층 | 저장하는 것 | 왜 분리하나 |
|---|---|---|
| Bronze | 원본 문서 그대로(append-only), 출처·수집 시각 | 파서를 바꿔도 다시 시작할 수 있다. 감사 때 "원본이 뭐였나"에 답한다 |
| Silver | 파싱 결과(텍스트·표·레이아웃), 중복 제거, PII 마스킹, 청크 | 청킹 전략을 바꿀 때 파싱을 다시 안 해도 된다 |
| Gold | 청크 + 메타데이터 + 권한 라벨 + 인용용 위치 정보 | 이게 "근거 데이터"다. 검색·인용·권한이 전부 여기 붙은 메타데이터를 쓴다 |
| Vector | 임베딩(모델 버전과 함께) | 임베딩 모델을 바꾸면 이 층만 재생성한다. Silver가 바뀌면 재임베딩을 트리거한다 |

이 구분이 왜 중요한지는 뒤의 케이스에서 보인다. 법률 문서는 Gold의 위치 정보(페이지·문장 인덱스)가 핵심이고, 사내 문서는 Gold의 권한 라벨이 핵심이고, 티켓 데이터는 Silver의 파싱 구조가 핵심이다. 같은 파이프라인인데 힘을 주는 층이 다르다.

---

## 파싱: 하나의 파서가 다 잘하는 건 없다

2026년 기준 파서 비교 글들을 읽다 보면 공통된 결론이 하나 있다. 벤더 벤치마크를 믿지 말고 자기 문서 열 개로 직접 돌려 보라는 것. Nutrient의 비교 글(2026-09 갱신)은 아예 숫자를 제시하길 거부하고 벤치마크의 종류(벤더 자체, 경쟁사 코퍼스, 공개 방법론)를 구분하는 데 지면을 쓴다.

그래도 지형은 그려진다.

- **Docling**(IBM, MIT): 로컬 실행. 2025-04 LF AI & Data에 기부됐고, 2025-09에 Granite-Docling-258M이라는 소형 VLM이 나와 표·수식·레이아웃 보존을 담당한다. PDF 정확도가 중요하고 데이터를 밖에 못 내보내는 환경이면 첫 후보다.
- **Unstructured**: 파서라기보다 파티셔닝→청킹→enrichment→커넥터까지 묶은 데이터 준비 플랫폼. 이메일·HTML·PPT처럼 형식이 잡다할 때 편하다. PII 마스킹 단계를 Presidio 기반으로 공식 지원한다. 오픈소스 버전은 Tesseract 기반이라 표에 약하다.
- **LlamaParse**: 관리형. 밀집 표·차트용 Agentic 티어가 따로 있다.
- **VLM 직접 파싱**: OmniDocBench 기준 Gemini 3 Pro가 92.9점으로 선두라는 2차 자료가 있다. 양식·서신 같은 정형 문서는 여전히 Azure Document Intelligence가 낫다는 평도 같은 자료다. 둘 다 1차 확인은 못 했다.
- **ColPali/ColQwen**(ICLR 2025): OCR을 건너뛰고 페이지 이미지를 패치 단위 멀티벡터로 임베딩한다. 차트·스캔이 많으면 매력적인데 함정이 있다. 페이지당 약 1,030개 벡터가 나와서 100만 페이지면 260GB 규모라는 추정이 있다. binary quantization이나 token pooling으로 줄이는 게 전제다. 나는 이걸 주 인덱스가 아니라 "보조 인덱스"로 두는 쪽이 현실적이라고 본다.

2차 벤치(Kanopy Labs) 수치 하나만 적어 두면, 표 구조 정확도는 LlamaParse 89%, Docling 83%, Unstructured hi_res 71%였고 다단 읽기 순서는 Docling이 94%로 앞섰다. 한 벤치의 수치이니 경향만 보자.

---

## 청킹: 2026년의 기본값

5편에서 Contextual Retrieval 수치(실패율 5.7%→1.9%)를 다뤘으니 반복하지 않는다. 그 뒤로 알게 된 것들을 보탠다.

**Chroma의 청킹 평가**(2024-07, 472 쿼리)가 내 생각을 좀 바꿨다. RecursiveCharacterTextSplitter 200토큰이 recall 88.1%, 의미 기반 ClusterSemanticChunker가 87.3%, GPT-4o로 청킹한 LLMChunker가 91.9%였다. 전략 간 recall 격차가 최대 9% 정도다. 결론은 "잘 튜닝한 휴리스틱이 꽤 잘 된다"는 것. 의미 청킹이나 LLM 청킹은 비용 대비 소폭 개선이다.

**Late Chunking**(Jina, arXiv 2409.04701)은 Contextual Retrieval과 같은 문제(청크가 문맥을 잃는다)를 다른 방향에서 푼다. 긴 문서를 통째로 임베딩 모델에 넣어 토큰 임베딩을 먼저 뽑고, 그 다음에 청크 경계로 평균을 낸다. LLM 호출이 없어 싸다. 대신 8K 이상 받는 장문 임베딩 모델이 필요하다. BeIR nDCG@10이 2.7~3.6% 올랐다고 논문은 보고한다.

**Parent-child**(small-to-big)는 이제 프로덕션 기본값으로 굳은 것 같다. 작은 청크로 검색하고 부모 청크를 생성에 넣는다. LlamaIndex의 2048→512→256 계층이 대표 예다.

Agentic chunking이라는 말도 돈다. 2026년 논문 하나(TopoChunker)가 모든 구간에 LLM 추론을 균등하게 쓰는 건 낭비라며 복잡한 구간에만 생성 추론을 할당하는 구조를 제안했다. 아직 논문 단계다.

내 기본값은 이렇다. 구조 인식 청킹(헤더·섹션 경계) + parent-child를 깔고, 예산이 되면 Contextual Retrieval, 임베딩 모델이 장문이면 Late Chunking을 대안으로. 그리고 Anthropic 글의 한 줄을 늘 기억한다. 지식 베이스가 20만 토큰(약 500페이지) 미만이면 RAG를 하지 말고 통째로 넣어라.

---

## 인덱스: 하이브리드, 리랭커, 그리고 pgvector로 시작

하이브리드가 필수라는 근거는 BEIR에서 18개 데이터셋 중 8~10개에서 BM25가 dense 임베딩을 zero-shot으로 이긴다는 것이다. SKU, 에러 코드, API 이름 같은 질의에서 dense는 "조용히 틀린다". 사용자는 왜 틀렸는지 모른다.

리랭커는 Cohere Rerank 4가 2025-12에 나왔다(pro/fast 두 종, 32K 컨텍스트, 100개 이상 언어). 한 가지 거슬리는 불일치가 있는데, Cohere 문서는 직전 3.5의 컨텍스트를 4,096으로 적고 있고 언론 기사는 8K에서 4배라고 쓴다. 어느 쪽이 맞는지 못 정했다.

벡터DB는 2026년 비교 글들이 거의 한목소리다. Postgres를 쓰고 있으면 pgvector로 시작하라. 단일 노드에서 1천만~5천만 벡터가 한계이고 그 위는 pgvectorscale이나 전용 엔진(Qdrant가 가성비, Milvus가 수십억 규모)으로 간다. 다만 pgvector 변경 로그를 보면 0.8.0(2024-10, iterative index scan)이 마지막 큰 기능이고 2026년 릴리스는 전부 버그 수정이다. 안정적이라고 읽을 수도, 정체됐다고 읽을 수도 있다.

Matryoshka 임베딩(차원을 잘라 써도 품질이 유지되는 모델)은 512차원으로 잘라 원 품질의 98.5%를 유지하며 인덱스를 4배 줄였다는 2차 자료가 있다. 비용이 문제라면 먼저 볼 만하다.

---

## 그래프는 언제 꺼내나

GraphRAG 얘기는 자주 나오지만 비용이 악명 높다. 한 데이터셋 인덱싱에 3만 3천 달러가 들었다는 사례가 돌고, Microsoft의 오픈소스 graphrag 저장소 README는 스스로 "largely in maintenance mode"라고 적고 있다. 여기서 주의할 게 하나 있다. Microsoft가 2024-11에 발표한 LazyGraphRAG(인덱싱 비용이 벡터 RAG 수준이고 글로벌 질의 비용이 700배 낮다는 것)는 **오픈소스 라이브러리에 들어 있지 않다.** Microsoft Discovery와 Azure Local로만 제공된다. "LazyGraphRAG를 오픈소스로 쓸 수 있다"는 블로그 글들이 있는데 README에는 언급이 없다.

오픈소스로 가려면 LightRAG(EMNLP 2025, 증분 업데이트 지원)나 HippoRAG 2(ICML 2025, Personalized PageRank로 multi-hop 연관 기억)가 후보다. HippoRAG 1 기준 인덱싱 토큰이 GraphRAG의 10~30분의 1이라는 비교가 있다.

그래프가 실제로 도움이 되는 질의는 두 종류다. 여러 문서를 건너뛰어야 하는 multi-hop 질의, 그리고 "이 코퍼스 전체의 주요 주제는?" 같은 글로벌 질의. 단순 사실 검색은 하이브리드+리랭커가 더 싸고 더 낫다. 그리고 뒤에 나오는 LinkedIn 사례처럼 데이터에 이미 구조화된 관계(티켓→증상→원인→해결)가 있을 때 그래프가 빛난다.

---

## 근거 데이터를 설계한다는 것

여기가 이 글의 중심이다. "근거(grounding) 데이터"는 검색에 쓰이는 청크가 아니라 **답변을 출처에 묶어 주는 메타데이터와 그 운영 규칙**이다. 내가 정리한 청크 메타데이터 최소 스키마는 이렇다.

```yaml
doc_id: contract-2026-0412
source_uri: sharepoint://legal/contracts/2026-0412.pdf
source_system: sharepoint
doc_version: sha256:9f3a…          # 원본 해시. 바뀌면 재처리
section_path: "제3장 > 제12조 > 2항"   # 구조 인식 청킹의 산물
page: 14
char_span: [1180, 1642]            # 문장 단위 인용용
ingested_at: 2026-10-08T03:12:00Z
source_updated_at: 2026-10-07T18:40:00Z
acl_groups: [legal-team, exec]     # 청크 행마다 복제
sensitivity_label: confidential
parser: docling@2.x
embedding_model: text-embedding-x@2026-03
chunk_strategy: structure+parent-child
pii_redacted: true
```

이 필드 하나하나가 뒤의 기능 하나에 대응한다.

**인용(citation).** 모델에게 "출처를 적어라"고 프롬프트로 시키는 것과 API가 문장 단위로 출처를 돌려주는 건 다르다. Anthropic Citations(2025-01 출시)는 문서 타입이 세 가지다. 평문은 문장 단위 char index, PDF는 문장 단위 + 페이지 번호, 그리고 **custom content**는 블록 단위로 추가 청킹 없이 인용한다. RAG 청크를 그대로 custom content 블록으로 넣으면 "몇 번째 청크에서 왔는가"가 구조화돼 나온다. 인용된 텍스트는 출력 토큰 과금에서 빠진다. 대신 structured outputs와 같이 못 쓴다(400 에러). Vertex AI는 `groundingMetadata`에 청크 목록과 답변 세그먼트↔청크 매핑(groundingSupports)을 돌려주고, 별도의 Check Grounding API가 답변 후보와 사실 목록을 받아 0~1 점수를 500ms 안에 준다. Azure AI Content Safety의 Groundedness Detection은 한 발 더 나가서 근거와 다른 구절을 자동 수정한 `correctedText`를 돌려주는 correction 모드가 preview다(영어 전용).

세 벤더 모두 같은 방향을 가리킨다. 인용은 생성 중에 구조화하고, 생성 후에 한 번 더 검사한다.

**권한(ACL)-aware 검색.** 원칙은 한 줄이다. LLM이 보기 전에 검색 레이어에서 자른다. Azure AI Search 문서(2026-08 갱신)가 네 가지 방식을 정리하는데, 문자열 security filter만 GA이고 POSIX ACL, Purview 민감도 라벨, SharePoint ACL은 preview다. 여기서 실무 함정 하나가 문서에 명시돼 있다. 청킹 스킬셋을 쓰면 **ACL 필드를 청크 행마다 projection해야** 청크 단위 필터가 된다. 문서 단위로만 붙여 두면 청크는 걸러지지 않는다. 그리고 권한 변경은 재동기화 후에야 반영된다. 어제 퇴사한 사람이 오늘 아침까지 검색되는 창이 생긴다. 이 창의 크기를 SLO로 정해 두는 게 설계다.

**신선도.** Databricks Vector Search는 Delta 테이블의 Change Data Feed로 증분 동기화하는데 continuous(초 단위, 비용 높음)와 triggered 두 모드다. 어느 쪽이든 핵심은 "검색 결과가 원본보다 최대 얼마나 늦을 수 있는가"를 숫자로 적어 두는 것이다. 이걸 freshness SLO라고 부르는 글들이 있다. 내 경험상 이 숫자를 안 정하면 아무도 재인덱싱 파이프라인을 모니터링하지 않는다.

**버저닝과 재현성.** 2025-09 논문 "On the Reproducibility Limitations of RAG Systems"는 RAG 재현성이 알고리즘보다 데이터 버저닝과 수치 정밀도 관리의 문제라고 지적한다. lakeFS처럼 코퍼스와 인덱스를 git처럼 브랜치·커밋하는 접근이 그래서 나온다. 평가 점수가 바뀌었을 때 "모델이 바뀐 건가, 문서가 바뀐 건가"에 답하려면 Gold 층의 스냅샷이 필요하다.

**PII.** 임베딩은 되돌리기 어렵다고들 하지만 복원 공격 연구가 계속 나온다. 그래서 마스킹은 청킹·임베딩 **전**에 한다. Silver 층의 일이다.

:::tip 근거 데이터는 품질 문제가 아니라 책임 문제다
검색 정확도는 평가셋으로 올린다. 하지만 "왜 이 답을 했나"에 답하는 건 메타데이터다. 감사, 권한, 정정 요청이 들어왔을 때 메타데이터가 없으면 모델을 아무리 바꿔도 대답할 수 없다.
:::

---

## 평가 데이터와 플라이휠

RAGAS는 0.4.3(2026-01)이고 faithfulness, answer relevancy, context precision/recall에 더해 합성 테스트셋 생성과 에이전트·멀티모달 지표로 확장됐다. ARES는 컴포넌트별 판정기를 학습시키고 신뢰구간까지 주지만 셋업이 무겁다.

LLM-as-judge의 편향은 이제 체계적으로 연구돼 있다. 위치 편향(순서를 바꿔 평균 내서 완화), 자기 선호(같은 모델 계열로 판정하지 않기), 길이·마크다운 스타일 편향. 2025년 연구에서 GPT-4o와 Claude 3.5 Sonnet 모두 자기 출력에 더 높은 점수를 줬다는 보고가 있다.

운영 루프는 단순하다. 프로덕션의 실패 트레이스 → 사람이 라벨 → 골든셋에 증분 → 회귀 테스트. Langfuse(MIT core)나 Arize Phoenix가 이 루프의 annotation queue와 데이터셋 실험 기능을 준다. 어느 도구든 상관없고, 루프가 돌고 있느냐가 중요하다.

---

## 구조화 데이터는 다른 종류의 근거

텍스트-to-SQL 쪽에서 "근거 데이터"는 청크가 아니라 메트릭 정의, 조인 경로, 동의어 사전이다. Snowflake가 BIRD-SQL에서 같은 LLM에 시맨틱 모델만 더해 57%→78%로 올렸다는 수치가 돌고(2차 출처), Databricks는 2026-06 Genie One에서 임베딩 검색 대신 온톨로지로 SQL을 직접 생성한다고 했다. 표준화 움직임은 Open Semantic Interchange가 Apache Ossie(Incubating)로 2026-06에 들어간 것이 확인된다. 이 주제는 [시멘틱 레이어 글](/posts/ai-llm/2026-10-06-semantic-layer-for-ai-agents)에서 길게 다뤘으니 여기선 한 줄로 끝낸다. 문서 RAG의 청크 메타데이터가 하는 일을 분석 에이전트에선 시맨틱 레이어가 한다.

---

## 케이스별로 무엇이 달라지나

여기부터가 시험 답안에 바로 쓸 부분이다. 네 케이스를 놓고 파이프라인의 어느 층에 힘을 주는지 비교한다.

| | 사내 문서 Q&A | 고객지원(티켓 이력) | 금융·법률(엄격 인용) | 내부 분석 코파일럿 |
|---|---|---|---|---|
| 힘 주는 층 | Gold의 권한 라벨 | Silver의 구조 파싱 | Gold의 위치 정보·인용 | 시맨틱 레이어·계보 |
| 파싱 | Unstructured류(형식 잡다) | 티켓 필드 구조 보존 | Docling/LlamaParse(표·조항) | 스키마·쿼리 로그·위키 |
| 청킹 | 구조 인식 + parent-child | 티켓 = 증상/원인/해결 노드 | 조항 단위, 문장 인덱스 유지 | 해당 없음(테이블 메타) |
| 검색 | 하이브리드 + ACL 필터 | KG + 벡터 | 하이브리드 + 리랭커 | 테이블 선택 → SQL 생성 |
| 인용 | 문서 링크 수준 | 유사 티켓 ID | 문장 단위 + 사후 groundedness 검사 | 실행된 SQL 자체가 근거 |
| 가장 무서운 실패 | 권한 누수 | 티켓 간 관계 소실 | misgrounded(법리 맞고 출처 틀림) | 그럴듯한 틀린 SQL |
| 평가 핵심 | 권한 테스트 + recall | 해결 시간, MRR | 인용 정확도 | 전문가 채점 + 사람 검증 UI |

**사내 문서 Q&A.** 품질보다 권한이 설계의 중심이다. 청크마다 ACL을 복제하고, 권한 변경 반영 지연을 SLO로 두고, "권한 없는 사용자가 검색했을 때 0건"이 평가셋에 들어간다. 민감도 라벨(Purview류)을 메타데이터로 전파하면 "confidential은 요약에 쓰되 원문 인용 금지" 같은 정책을 걸 수 있다.

**고객지원.** LinkedIn 논문(arXiv 2404.17723)이 교과서다. 과거 티켓을 평문으로 청킹하면 티켓 내부 구조(증상→원인→해결)와 티켓 간 참조 관계가 사라진다. 그래서 지식 그래프로 구조를 보존했고 검색 MRR이 77.6% 올랐으며 6개월 운영에서 중앙값 해결 시간이 28.6% 줄었다. 여기서 배울 점은 그래프 자체가 아니라, 청킹이 아니라 **구조 파싱**이 근거 설계의 핵심이었다는 것이다. 참고로 Intercom Fin은 평균 51%, 최대 86% 해결률을 공개하고 있다.

**금융·법률.** Stanford HAI 연구(2024-05, JELS 2025 게재)가 법률 AI 제품의 환각률을 Lexis+ AI 17%, Westlaw AI-AR 33%로 측정했다. 여기서 나온 개념이 "misgrounded"다. 법리는 맞는데 인용한 출처가 그 주장을 뒷받침하지 않는다. 이걸 막으려면 문장 단위 인용(Anthropic custom content, Vertex groundingSupports) + 생성 후 groundedness 검사 + 가능하면 권위 검증(KeyCite류) 연동까지 세 겹이 필요하다. 그리고 페이지 번호와 char span이 Gold에 있어야 사람이 검증할 수 있다.

**분석 코파일럿.** LinkedIn SQL Bot(arXiv 2507.14372)은 DB 메타데이터, 쿼리 로그, 위키, 코드로 지식 그래프를 만들고 팀별로 테이블을 클러스터링한 뒤 에이전트가 SQL을 생성·자기수정한다. 주간 사용자 300명 이상, 전문가 평가 53%가 정답 또는 근접. 53%라는 숫자가 낮아 보이지만 이 시스템은 사람이 SQL을 보고 검증하는 UI를 전제로 한다. Uber QueryGPT도 쿼리 작성 시간을 10분에서 3분으로 줄였다고 하지 "자동 실행"을 말하지 않는다. 이 케이스의 근거는 실행된 SQL 그 자체다.

---

## 서술형 답안 뼈대

설계안을 글로 써야 할 때 나는 이 순서로 쓴다. 각 항목에 위의 내용을 끼우면 된다.

1. **요구 분석**: 문서 유형(정형/비정형/스캔), 갱신 빈도, 권한 모델, 인용 엄격도, 질의 유형(단순 사실/multi-hop/글로벌)
2. **층 설계**: Bronze/Silver/Gold/Vector. 각 층의 저장 내용과 재처리 트리거
3. **파싱 전략**: 문서 유형별 파서 선택과 "자기 문서 10개 벤치" 계획
4. **청킹과 인덱스**: 구조 인식 + parent-child 기본, 하이브리드 + 리랭커, 벡터DB 선택 근거(규모)
5. **근거 메타데이터**: 위 YAML 스키마. 인용 방식(API 수준 citation), ACL 복제, freshness SLO, PII 선처리, 버전 스냅샷
6. **그래프 여부**: multi-hop·글로벌 질의·구조화된 관계가 있을 때만. 비용 근거
7. **평가와 플라이휠**: 검색/생성 분리 지표, 판정자 편향 완화, 프로덕션 실패→골든셋 루프
8. **케이스 특화**: 이 케이스에서 가장 무서운 실패 하나를 골라 그걸 막는 설계를 강조

8번이 점수를 가른다고 생각한다. 모든 걸 균등하게 쓰면 "무엇이 중요한지 모르는 답"이 된다.

---

## 아직 고민 중인 부분

ColPali 같은 시각 검색을 주 인덱스로 쓰는 게 언제 합리적인지 아직 감이 없다. 저장 비용을 양자화로 32배 줄였다는 글들이 있는데, 그러고도 텍스트 하이브리드보다 나은 케이스가 차트 중심 문서 말고 또 있는지 모르겠다. 그리고 데이터 컨트랙트(스키마 변경 시 소비자에게 보장하는 계약)를 LLM 파이프라인에 적용한 구체 사례를 찾지 못했다. Silver→Gold 사이에 컨트랙트가 있어야 할 것 같은데, 다들 아직 손으로 하는 모양이다.

다음 편은 이 근거 데이터 위에서 돌아가는 에이전트 워크플로우와 RAG 아키텍처다.

**연재 목차**: 1편(현재) · [2편 에이전트 워크플로우·RAG 아키텍처](/posts/ai-llm/design-cases/2026-10-10-02-agent-workflow-and-rag-architecture) · [3편 동적 UI 연동](/posts/ai-llm/design-cases/2026-10-10-03-agent-driven-dynamic-ui) · [4편 도메인별 고민](/posts/ai-llm/design-cases/2026-10-10-04-domain-specific-deep-dives)

## 참고자료

- Anthropic, [Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) (2024-09) / [Citations](https://platform.claude.com/docs/en/build-with-claude/citations)
- Chroma, [Evaluating Chunking Strategies for Retrieval](https://www.trychroma.com/research/evaluating-chunking) (2024-07)
- Microsoft Learn, [Document-level access control in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) (2026-08)
- LinkedIn, [Retrieval-Augmented Generation with Knowledge Graphs for Customer Service Question Answering](https://arxiv.org/abs/2404.17723) (2024-04)
- Stanford HAI, [AI on Trial: Legal Models Hallucinate in 1 out of 6 Queries](https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-queries) (2024-05)
- Microsoft Research, [LazyGraphRAG](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/) (2024-11)
