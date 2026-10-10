---
title: "설계 심화 2/3 — 에이전트 워크플로우와 LLM/RAG 아키텍처: 어떤 케이스에 어떤 모양을 고르나"
date: 2026-10-10T09:30:00
description: 워크플로우와 에이전트의 선택 기준, 2026년의 프레임워크·하네스 지형, 컨텍스트 엔지니어링, agentic RAG, 메모리, 멀티에이전트 논쟁의 수렴, 내구성 있는 실행과 보안, MCP·A2A 현황을 정리하고 고객지원·사내 문서 Q&A·코딩 에이전트·백오피스 자동화 네 케이스의 추천 아키텍처와 서술형 답안 뼈대를 적었다.
---

# 설계 심화 2/3 — 에이전트 워크플로우와 LLM/RAG 아키텍처: 어떤 케이스에 어떤 모양을 고르나

[연재 4편](/posts/ai-llm/ai-systems/2026-10-04-ai-agent-04-workflow-vs-agent)과 [6편](/posts/ai-llm/ai-systems/2026-10-04-ai-agent-06-agent-deep-dive)에서 워크플로우와 에이전트의 차이, 도구·상태·interrupt·MCP·보안을 다뤘다. 그 글들은 "부품 설명서"였다. 이번 글은 조립 순서다. 케이스가 주어졌을 때 어떤 모양을 고르고, 왜 그 모양인지 말할 수 있어야 한다. 2026년 들어 바뀐 것도 꽤 있다. 프레임워크 세대가 한 번 갈렸고, 멀티에이전트 논쟁이 수렴했고, MCP 스펙이 크게 개정됐다. 그 변화를 반영해서 쓴다.

버전과 날짜는 2026-10-10 기준이다. 2차 출처만 확인한 건 그렇다고 적는다.

---

## 워크플로우냐 에이전트냐는 "예측 가능성"으로 가른다

Anthropic의 "Building effective agents"(2024-12)가 여전히 기준점이다. 워크플로우는 코드가 정한 경로로 LLM과 도구를 엮는 것, 에이전트는 LLM이 스스로 과정과 도구 사용을 결정하는 것. 다섯 가지 워크플로우 패턴에는 각각 "언제 쓰는가"가 붙어 있고, 나는 이게 시험 답안의 뼈대로 제일 유용하다고 본다.

| 패턴 | 언제 | 케이스 예 |
|---|---|---|
| Prompt chaining | 고정된 하위 작업으로 깔끔하게 쪼개질 때 | 문서 추출→검증→요약 |
| Routing | 서로 다르게 다루는 게 나은 범주가 있을 때 | 고객 문의 의도 분류 후 분기 |
| Parallelization | 독립 하위 작업(sectioning) 또는 여러 관점(voting) | 가드레일 병렬 검사, 판정 투표 |
| Orchestrator-workers | 하위 작업을 미리 예측할 수 없을 때 | 리서치, 다중 파일 수정 |
| Evaluator-optimizer | 명확한 평가 기준이 있고 반복이 측정 가능하게 나아질 때 | 번역 다듬기, 검색 재질의 |

핵심 질문은 하나다. **다음 단계를 코드가 예측할 수 있는가.** 예측할 수 있으면 워크플로우다. 예측할 수 없을 때만 에이전트에게 결정을 넘긴다. 같은 글이 권하는 세 원칙, 단순함·투명성(계획 단계를 보여 주기)·도구 인터페이스에 투자하기는 지금도 그대로다.

HumanLayer의 12-factor agents(2025-04)는 이걸 더 밀어붙인다. 프로덕션 에이전트는 "대부분 결정론적 소프트웨어에 LLM 단계가 군데군데 박힌 것"이라는 주장. 프롬프트와 컨텍스트 윈도우를 직접 소유하고, 도구는 구조화 출력일 뿐이며, 사람에게 묻는 것도 도구 호출로 하고, 작고 집중된 에이전트를 만들라는 것. 나는 이 관점에 대체로 동의하는데, 다만 코딩 에이전트처럼 진짜로 다음 단계를 예측할 수 없는 영역에서는 에이전트 쪽이 압도적이라는 것도 같이 말해야 공정하다.

---

## 2026년: 프레임워크에서 하네스로

6편을 쓸 때는 LangGraph가 거의 유일한 선택지처럼 보였다. 지금은 지형이 다르다.

- **LangGraph / LangChain 1.0** (2025-10-22 GA, "2.0까지 breaking change 없음"): 체크포인터, `interrupt()`, durability 모드, `create_agent` + 미들웨어. 명시적 제어와 장기 실행 상태가 필요할 때.
- **OpenAI Agents SDK** (2025-03): Agent·Runner·Handoffs·Guardrails(병렬 실행, tripwire로 즉시 중단)·Sessions. 가벼운 handoff형 멀티에이전트.
- **Claude Agent SDK** (2025-09-29, Claude Code SDK에서 개명): Claude Code의 루프를 라이브러리로. 훅(PreToolUse/PostToolUse), 서브에이전트, 권한, 세션 resume/fork. 2026-04에는 호스팅 하네스인 Managed Agents가 나왔다.
- **Google ADK**: Python 1.0이 2025-05, Java·Go는 2026-03, Kotlin은 2026-09. 계층형 멀티에이전트, A2A·MCP 네이티브, OpenTelemetry 내장.
- **Microsoft Agent Framework**: AutoGen과 Semantic Kernel을 합쳐 2025-10 preview, 2026-04 1.0 GA. AutoGen은 유지보수 모드. .NET/Azure 조직의 기본값. (GA 날짜는 2차 출처)

여기서 내가 읽은 흐름은 "어느 프레임워크냐"가 "어느 하네스 + 어느 내구성 런타임이냐"로 바뀌고 있다는 것이다. Claude Managed Agents, LangChain Deep Agents, AWS AgentCore 같은 하네스 제품이 루프 자체를 흡수한다. 그래서 설계 문서에서 프레임워크 이름을 길게 비교하는 것보다, 우리 팀이 루프를 직접 소유할 건지 하네스에 맡길 건지를 먼저 적는 게 낫다. Anthropic 글의 조언은 여전히 유효하다. 날 API와 루프로 시작하고, 내구성·영속성이 필요해질 때 프레임워크를 들인다.

---

## 컨텍스트 엔지니어링: 캐시를 중심으로 설계한다

6편에서 다룬 Anthropic의 context rot, compaction, note-taking, just-in-time retrieval, sub-agent에 더해 Manus의 글(2025-07)이 운영 관점을 보탠다. 여섯 원칙 중 첫째가 **KV 캐시 적중률이 가장 중요한 지표**라는 것. 입력 대 출력 토큰이 100:1이고 작업당 도구 호출이 50회쯤 되는 에이전트에서 캐시된 토큰과 아닌 토큰의 가격은 10배 차이다. 그래서 도구를 제거하지 말고 로짓 마스킹으로 가리라는 것(도구 목록이 바뀌면 프리픽스 캐시가 깨진다), 파일 시스템을 컨텍스트로 쓰라는 것, 실패를 숨기지 말고 컨텍스트에 남기라는 것이 따라온다.

Anthropic 프롬프트 캐싱 문서의 무효화 순서도 설계에 직접 걸린다. tools → system → messages 순서로 캐시가 쌓이고, 도구 정의가 바뀌면 전부 무효화된다. 도구 결과는 괜찮다. 2026-01 논문 "Don't Break the Cache"는 세 벤더에 걸쳐 500회 이상 세션을 돌려 41~80% 비용 절감과 13~31% TTFT 개선을 보고하면서, 동적 콘텐츠는 끝에 두고 동적 함수 정의는 피하라는 규칙을 냈다. 순진하게 전체 컨텍스트를 캐시하면 오히려 느려질 수도 있다고 한다.

메모리도 이제 벤더 기능이다. Anthropic의 memory tool + context editing(2025-09, beta)은 오래된 도구 결과를 자동으로 비우고 클라이언트 쪽 파일 디렉토리를 Claude가 읽고 쓴다. 100턴 웹 검색 평가에서 토큰 84% 감소라는 수치가 있다. 장기 메모리 레이어로는 Mem0(v1.0, 2026-04 fused retrieval)와 Letta(메모리 블록, sleep-time compute)가 있는데, 벤치마크 수치는 벤더끼리 서로 다르게 재서 그대로 믿기 어렵다. Zep이 자체 보고한 LoCoMo 94.7을 제3자가 재니 75.1이 나왔다는 사례가 있다. 메모리 설계에서 내가 보는 건 두 가지다. 쓰기 경로(무엇을 저장할지 누가 결정하나)와 검색 신호(벡터, BM25, 그래프 중 무엇으로 꺼내나).

---

## RAG의 모양: 검색을 에이전트에게 맡길 것인가

[1편](/posts/ai-llm/design-cases/2026-10-10-01-data-pipeline-and-evidence-design)이 데이터 쪽이었다면 여기선 질의 시점의 모양이다. 선택지는 세 갈래다.

**고정 파이프라인.** 질의 재작성 → 라우터(어느 코퍼스, 정형/비정형) → 하이브리드 검색 → 리랭크 → 인용 생성. 대부분의 사내 문서 Q&A는 여기서 끝난다. 에이전트가 아니라 워크플로우다.

**Agentic RAG.** Self-RAG(모델이 검색할지·비판할지 스스로 결정)와 CRAG(검색 평가기가 품질을 보고 재질의나 웹 폴백)가 두 정형 루프다. 2025-01 서베이(arXiv 2501.09136)는 단일/멀티/계층/교정/적응/그래프 기반으로 분류한다. 2026 ACL Industry 논문 "Is Agentic RAG worth it?"가 기본/강화/에이전틱 RAG의 성능 대 비용을 비교했는데 초록만 봐서 결론 수치는 못 적는다. 내 의견은 이렇다. 실패 모드를 측정한 뒤에 그 실패를 고치는 루프만 넣는다. 처음부터 agentic으로 가면 어디서 틀렸는지 알 수 없다.

**Agentic search(임베딩 없이).** 코드에서는 이쪽이 이겼다. Claude Code는 초기에 벡터DB RAG를 썼다가 grep·glob 기반 검색이 "모든 걸 큰 차이로 능가"해서 버렸다는 Boris Cherny의 말이 있다(2차 인용). Amazon의 AAAI 2026 논문 "Keyword search is all you need"는 벡터 저장소 없이 grep 도구만 쓰는 에이전트로 faithfulness 94.5%, correctness 91.5%를 보고한다(검색 요약으로만 확인). 코드처럼 구조가 있고 식별자가 정확한 도메인에서는 임베딩이 오히려 노이즈다.

그리고 긴 컨텍스트. 2026년 합의는 하이브리드다. 20만 토큰(약 500페이지) 아래면 RAG 없이 캐싱해서 통째로 넣고, 그 위면 5만~20만 토큰을 검색해 넣고 추론한다. RAG의 장점은 "크게 실패한다"는 것이다. 검색이 틀리면 인용이 틀려서 눈에 보인다. 긴 컨텍스트는 조용히 틀린다.

---

## 멀티에이전트 논쟁은 이렇게 수렴했다

2025-06에 두 글이 거의 동시에 나왔다. Anthropic은 리서치 시스템에서 멀티에이전트가 단일 Opus 4보다 90.2% 나았다고 했고(토큰 15배), Cognition은 "Don't Build Multi-Agents"에서 컨텍스트와 전체 트레이스를 공유하지 않는 병렬 에이전트는 서로 충돌하는 결정을 내린다며 단일 스레드를 권했다. 6편에서 나는 정형 업무에 멀티에이전트는 과하다고 의견을 적었다.

2026-04에 Cognition이 "Multi-Agents: What's Actually Working"으로 입장을 누그러뜨렸다. 되는 패턴 세 가지. 깨끗한 컨텍스트의 리뷰 에이전트(PR당 약 2개 버그, 58%가 심각), 강한 모델을 약한 주 에이전트의 상담역으로 두는 "smart friend", 그리고 프롬프트를 많이 다듬은 관리자-조정자. 안 되는 건 여전히 병렬로 쓰는 에이전트 떼다. Anthropic 쪽은 2026-06 "A harness for every task"에서 `agent()`, `parallel()`, `pipeline()`으로 동적 워크플로우를 짜는 여섯 패턴(classify-and-act, fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament, loop-until-done)을 소개하면서 서브에이전트 격리가 게으름·자기 선호 편향·목표 이탈을 고친다고 했다.

양쪽을 합치면 한 문장이 된다. **읽기와 분석은 병렬로, 공유 상태에 쓰는 건 단일 스레드로.** 그리고 검증에 독립성이 필요할 때 컨텍스트 격리는 비용이 아니라 기능이다. 이 문장이 멀티에이전트 설계 질문의 답이라고 생각한다.

---

## 신뢰성: 체크포인트는 데이터를 지키지 실행을 지키지 않는다

6편에서 LangGraph interrupt의 재실행 함정을 다뤘다. 한 가지 더 알아야 할 게 있다. LangGraph 체크포인터는 매 super-step마다 상태를 저장하지만 프로세스가 죽으면 실행 자체는 죽는다. 누군가 다시 호출해야 이어진다. 그래서 2026-07에 Temporal이 LangGraph 플러그인을 냈다. 노드 하나를 Temporal Activity로 돌려서 프로세스가 죽어도 워크플로우가 이어진다. 승인을 며칠씩 기다리는 백오피스 흐름에는 이 차이가 결정적이다. 서버리스 쪽은 Inngest, Trigger.dev가 같은 자리를 노린다.

멱등성은 도구 호출 수준에서 건다. 재시도는 실패한 단계만, 내구성 있는 상태에서. 사람 승인은 12-factor 7번처럼 도구 호출로 표현하면 흐름이 단순해진다. MCP 2026-07 개정의 Multi Round-Trip Requests(`input_required`)도 도구 호출 중간에 확인을 요청하는 같은 발상이다.

가드레일은 역할이 세 가지로 나뉜다. 분류기(Llama Guard 4, 2025-04, 멀티모달), 대화 제어 런타임(NeMo Guardrails, Colang 흐름), 구조화 출력 검증기(Guardrails AI). 하나로 다 하려 하면 안 된다.

평가는 네 차원이다. 궤적(trajectory), 도구 사용, 과제 완료, 멀티턴. 결정론적 검사 → LLM 판정 → 사람 보정의 층을 두고, 출시 전엔 골든셋, 출시 후엔 샘플링 트래픽. 관측은 OpenTelemetry GenAI 시맨틱 컨벤션(`invoke_agent`, `execute_tool`, `retrieval` 같은 operation)이 표준이 되어 가는데 2026-09 기준 아직 Development 상태다. "6월에 안정화됐다"는 글도 있어서 상충한다. 메시지 본문은 PII 때문에 별도 이벤트로 보내게 돼 있다.

---

## 프로토콜과 보안: MCP, A2A, 그리고 2026년의 OWASP

MCP는 2025-12부터 Linux Foundation 산하 Agentic AI Foundation 프로젝트이고 현행 스펙은 2026-07-28이다. 6편에서 적은 stateless 전환(세션 제거, `_meta`로 버전·능력 전달), `*/list` 캐시 힌트, Tasks의 확장 이관에 더해 게이트웨이 라우팅용 `Mcp-Method`/`Mcp-Name` 헤더와 인증 강화(DCR 폐기, Client ID Metadata Documents)가 들어갔다. SDK는 TS·Python·Go·C#이 갱신됐다.

보안에서 알아야 할 공격은 Invariant Labs가 2025-04에 보인 tool poisoning이다. 도구 설명에 숨긴 지시로 `~/.ssh/id_rsa`를 빼내는 데모. 변형으로 승인 뒤 설명이 바뀌는 rug pull, 한 서버가 다른 서버의 동작을 바꾸는 shadowing이 있다. 완화는 설명 전문 표시, 체크섬으로 서버 고정, 서버 간 데이터 흐름 제어. MCPTox 벤치마크에서 20개 모델 평균 36.5%가 공격에 넘어갔다는 2차 자료가 있다.

A2A는 Google이 2025-04에 내고 Linux Foundation에 기부했으며 2026년 봄 v1.0(서명된 Agent Card, 멀티테넌시, AP2 결제 확장)이 나왔다. 정확한 월은 출처마다 3월·4월로 갈린다. 150개 이상 조직, Azure AI Foundry·Bedrock AgentCore에 통합. MCP가 에이전트↔도구라면 A2A는 에이전트↔에이전트다.

OWASP는 2026년 두 목록을 냈다. LLM 앱 Top 10 2026(2026-08)에서 Excessive Agency가 3위로 올라왔고 System Prompt Leakage가 Hidden Context Exposure로 이름이 바뀌어 도구 스키마와 검색된 정책까지 포함한다. 그리고 Agentic Applications Top 10 2026(2025-12)이 따로 나왔다. ASI01 Agent Goal Hijack, ASI02 Tool Misuse, ASI03 Identity & Privilege Abuse, ASI06 Memory & Context Poisoning, ASI08 Cascading Failures 같은 항목이 에이전트 설계와 직결된다.

설계 패턴으로는 2025-06 논문 "Design Patterns for Securing LLM Agents against Prompt Injections"(IBM·ETH·Google·Microsoft 공저)의 여섯 가지가 쓸 만하다. Action-Selector, Plan-Then-Execute, LLM Map-Reduce, Dual LLM(권한 있는 모델과 격리된 모델), Code-Then-Execute(DeepMind CaMeL), Context-Minimization. 시험에서 "프롬프트 인젝션 대응 설계"를 물으면 6편의 lethal trifecta(민감 데이터·신뢰 불가 입력·외부 통신 중 하나를 끊는다)에 이 패턴 중 하나를 얹어 쓰면 된다.

:::danger 도구 출력은 데이터이지 지시가 아니다
검색된 문서, 도구가 돌려준 JSON, 다른 에이전트의 메시지. 전부 신뢰할 수 없는 입력으로 다룬다. 최소 권한 도구, 샌드박스, 되돌릴 수 없는 행동 앞의 승인 게이트는 프롬프트로 대체되지 않는다.
:::

---

## 케이스별 추천 아키텍처

| | 고객지원 에이전트 | 사내 문서 Q&A | 코딩 에이전트 | 백오피스 자동화(보상·구매) |
|---|---|---|---|---|
| 모양 | 라우팅 워크플로우 → 의도별 제한 에이전트 | 워크플로우(에이전트 아님) | 단일 스레드 에이전트 | 내구성 있는 워크플로우 + LLM 단계 |
| 도구 수 | 의도당 10개 이하 | 검색·인용 | grep/glob/read/edit/shell | 추출·분류·조회, 승인 도구 |
| 검색 | 하이브리드 + ACL + 인용 필수 | 하이브리드 → 리랭크 → 인용 | 벡터 없음, agentic search | 정책·계약 검색(유효일 메타), 정형은 도구 |
| HITL 지점 | 낮은 확신, 감정, 임계값 이상 금액 | 없음("모르겠다" 허용) | 권한 모드 + 훅 + 샌드박스 | 모든 거절, 임계값 이상, 정책 예외 |
| 상태·내구성 | 세션 | 무상태 | 세션 + 체크포인트 | Temporal/Step Functions/LangGraph+체크포인터 |
| 평가 핵심 | 해결률, 실제 티켓 골든셋 | recall@k, faithfulness, 무응답률 | 테스트 통과율, PR 수용률 | 자동 처리율, 사람 번복률 |
| 가장 무서운 실패 | 돈이 움직이는 오판 | 권한 누수 | 테스트 안 돌리고 완료 선언 | 승인 없이 거절 |

**고객지원.** 앞단은 라우팅 워크플로우다. 의도와 티어를 분류하고 의도별로 도구가 10개 이하인 제한된 에이전트에 넘긴다. 환불처럼 돈이 움직이는 건 임계값 이상이면 무조건 사람에게. 핸드오프 패킷은 전체 대화 + 에이전트 추론 + 한 줄 요약. Intercom Fin이 해결당 0.99달러로 과금하는 걸 보면 "해결률"이 이 케이스의 단일 지표다.

**사내 문서 Q&A.** 에이전트가 아니다. 질의 재작성 → 라우터 → 하이브리드 → 리랭크 → 인용 생성의 워크플로우이고, 실패 모드를 측정한 뒤에야 CRAG식 루프를 넣는다. 권한은 검색 레이어에서 끊고(1편), 코퍼스가 20만 토큰 아래면 RAG 대신 캐싱. 한 컨설팅사가 23개 프로젝트의 실패 원인을 나눈 2차 자료가 있는데 청킹 불일치 61%, 권한 메타데이터 누락 52%, 벡터 전용 48%, 평가 없음 43%였다. 단일 출처라 경향만.

**코딩 에이전트.** 단일 스레드 에이전트 + agentic search + 루프 안의 테스트·린터. 리뷰는 깨끗한 컨텍스트의 서브에이전트가 한다(Cognition 데이터). 도구·시스템 프롬프트를 고정해 KV 캐시 프리픽스를 안정시키고, CLAUDE.md류 영속 노트와 compaction으로 긴 작업을 버틴다. HITL은 권한 모드(읽기 전용 → 수정 허용 → 자동)와 위험 명령을 막는 훅, 그 아래 OS 샌드박스의 세 층이다.

**백오피스 자동화.** 내구성 있는 워크플로우가 뼈대이고 LLM은 추출·분류 단계에만 들어간다. AWS의 2026-09 공공 부문 사례가 좋은 교과서인데, Cedar 정책으로 승인 게이트를 선언적으로 둔다. 소득 변동이 있으면 무조건 검토, 확신 92% 이상의 정기 갱신은 자동 승인, 같은 식이다. 자율성은 보조 → 감독하 자율 → 선택적 완전 자율의 3단계로 올린다. 평가 지표는 자동 처리율과 함께 **사람의 번복률**이다. 번복률이 오르면 모델이나 데이터가 드리프트한 신호다. 승인은 며칠을 기다릴 수 있어야 하므로 체크포인트만으로는 부족하고 Temporal류가 필요하다. [연재 3편](/posts/ai-llm/ai-systems/2026-10-04-ai-pipeline-03-high-stakes-decisions)의 임계값·감사 로그 설계가 여기 그대로 붙는다.

---

## 서술형 답안 뼈대

1. **예측 가능성 판단**: 다음 단계를 코드가 예측할 수 있는가 → 워크플로우 패턴 이름을 지정(라우팅, 체이닝…). 못 하면 에이전트, 그 범위를 제한
2. **루프 소유권**: 직접 루프(날 API) vs 프레임워크(LangGraph/Agents SDK/ADK/MAF) vs 하네스(Managed Agents/AgentCore). 선택 근거는 내구성·팀 스택
3. **컨텍스트 설계**: 고정 프리픽스(캐시), JIT 검색, compaction, 메모리의 쓰기 경로와 검색 신호
4. **RAG 모양**: 고정 파이프라인 / agentic RAG / agentic search / 긴 컨텍스트. 코퍼스 크기와 도메인(코드·문서)으로 근거
5. **멀티에이전트 여부**: 읽기 병렬·쓰기 단일. 리뷰어·상담역·조정자 중 어느 패턴인지, 아니면 안 쓰는지
6. **신뢰성**: 체크포인트 vs 내구성 실행, 멱등 도구, HITL 지점과 승인의 표현(도구 호출), 가드레일 3종 역할
7. **보안**: lethal trifecta 중 끊는 고리, 여섯 설계 패턴 중 적용할 것, MCP 서버 고정, OWASP Agentic 항목 매핑
8. **평가·관측·비용**: 4차원 평가, 골든셋→온라인, OTel GenAI, 캐시 무효화 순서, 모델 라우팅
9. **케이스 특화 실패 하나**: 표의 마지막 행. 그걸 막는 설계를 가장 길게

---

## 아직 고민 중인 부분

하네스에 루프를 맡기면 디버깅이 어려워진다는 2024년의 경고가 2026년의 하네스 제품에도 그대로 적용되는지 모르겠다. 훅과 트레이싱이 그걸 상쇄한다고들 하는데 내가 직접 큰 장애를 겪어 보진 않았다. 그리고 agentic search가 코드 밖, 예를 들어 계약서 수천 건 같은 데서도 임베딩을 이길지는 근거를 못 찾았다. 식별자가 정확한 도메인이면 그럴 것 같긴 하다.

다음 편은 이 에이전트가 화면과 만나는 방식이다.

**연재 목차**: [1편](/posts/ai-llm/design-cases/2026-10-10-01-data-pipeline-and-evidence-design) · 2편(현재) · [3편 동적 UI 연동](/posts/ai-llm/design-cases/2026-10-10-03-agent-driven-dynamic-ui)

## 참고자료

- Anthropic, [Building effective agents](https://www.anthropic.com/research/building-effective-agents) (2024-12) / [A harness for every task](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/) (2026-06)
- Manus, [Context Engineering for AI Agents: Lessons from Building Manus](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) (2025-07)
- Cognition, [Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents) (2025-06) / [Multi-Agents: What's Actually Working](https://cognition.com/blog/multi-agents-working) (2026-04)
- Temporal, [Temporal LangGraph plugin](https://temporal.io/blog/temporal-langgraph-plugin-durable-execution) (2026-07)
- Simon Willison, [Design Patterns for Securing LLM Agents against Prompt Injections](https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/) (2025-06)
- OWASP, [Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026)
- AWS, [Human-in-the-loop claims processing with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/publicsector/human-in-the-loop-claims-processing-with-amazon-bedrock-agentcore/) (2026-09)
