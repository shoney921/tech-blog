---
title: "Chapter 6. AIND 이해와 활용"
date: 2026-03-21T09:50:00
---

# Chapter 6. AIND 이해와 활용

::: info 2026년 하반기 업데이트 안내 · 2026-10-12 기준
이 글은 2026년 상반기에 작성한 원문을 그대로 두고, 바뀐 내용을 각 섹션 아래 '2026년 하반기 업데이트' 박스로 덧붙였습니다. 핵심 변화:
- `.cursorrules`는 현재 Cursor 공식 문서에서 사라졌고, 프로젝트 규칙은 `.cursor/rules/*.mdc` 또는 `AGENTS.md`로 작성합니다. `AGENTS.md`는 Linux Foundation 산하 Agentic AI Foundation이 관리하는 도구 공통 규칙 파일이 되었고, Claude Code도 `CLAUDE.md`가 없으면 `AGENTS.md`를 읽습니다.
- Claude Code의 `.claude/commands/`는 Skills로 통합되었고, Agent Skills(`SKILL.md`) 포맷은 Cursor·GitHub Copilot·Codex·Kiro·Junie 등 다수 도구가 지원하는 공통 포맷이 되었습니다. Claude Code에는 내장 `/code-review`도 생겨 실습 예제의 스킬 이름과 겹칩니다.
- 도구 지형이 크게 바뀌었습니다. Windsurf는 Devin Desktop으로 이름이 바뀌었고, 개인용 Gemini CLI는 2026-06-18 서비스가 중단되어 Antigravity CLI로 전환되었으며, Amazon Q Developer IDE 플러그인은 2027-04-30 지원 종료(후속은 Kiro)가 예고되었습니다. Cursor 운영사 Anysphere는 SpaceX에 인수되었습니다.
- GitHub Copilot은 2026-06-01부터 AI Credits 기반 사용량 과금으로 바뀌었고, 원문 표의 Copilot Workspace는 이미 종료되어 cloud agent(구 coding agent)가 그 자리를 대신합니다.
- 데이터 정책: GitHub Copilot Free/Pro/Pro+는 2026-04-24부터 옵트아웃하지 않으면 상호작용 데이터가 모델 학습에 쓰입니다. "개인용 플랜 사용 제한" 원칙이 더 중요해졌습니다.
- 원문의 `.claudeignore`는 Claude Code 공식 문서에서 확인되지 않습니다. 민감 파일 차단은 `permissions.deny`(필요 시 hooks)로 구성하는 것이 공식 방식입니다.
:::

## AIND (AI Native Development) 개요

### AIND 정의

> **LG CNS AIND란?**
>
> LG CNS의 AI Native Development(AIND)는 AI 기술로 최적화된 전 공정 개발 및 Pair Programming 구현 접근 방식입니다.
>
> "분석, 설계, 개발, 테스트 **전 공정에서 AI 기술을 적용하여 이행 프로세스를 최적화** 하고,
> 다양한 AI Assistant를 활용하여 **프로젝트 이행을 전면 혁신**하는 것입니다."

### AI Coding이란?

> **AI Coding**
>
> AI Coding이란 코드 자동완성, 함수 생성, 오류 수정 등 **코드 작성 단계에서 AI를 생산성 도구로 활용**하는 방식입니다.
>
> 개발 방식 자체는 기존과 동일하되, AI가 개발 속도를 높이는 보조 수단으로 기능합니다.

GitHub Copilot, Cursor의 코드 자동완성, ChatGPT에 코드를 물어보는 행위 모두 AI Coding의 범주에 해당합니다.

개발자가 원하는 코드를 AI에게 요청하면 AI가 결과를 생성하고, 개발자가 이를 검토/사용하는 **단방향 요청-응답 구조**가 특징입니다.

#### AI Coding의 주요 활용 유형

| **대표적인 AI Coding 활용 사례** | **AI Coding의 한계** |
| --- | --- |
| - 함수 이름 타이핑 시 AI가 전체 코드 자동완성<br>- "이 오류 메시지 원인이 뭐야?" 질문 후 해결책 수령<br>- "정렬 알고리즘 코드 작성해줘" 요청 후 복사/붙여넣기<br>- 리팩토링 대상 코드 선택 후 AI에게 개선 요청<br>- 테스트 코드 초안 자동 생성 요청<br><br>→ **특정 코드 작성 작업에 국한된 단발성 AI 활용** | - AI가 비즈니스 요구사항의 배경을 알지 못함<br>- AI가 설계 결정의 이유를 이해하지 못함<br>- 각 요청이 독립적이어서 전체 맥락 일관성이 낮음<br>- 코드 작성 이외 단계(분석/설계/검증)에 미적용<br>- 품질 판단과 모든 책임은 온전히 개발자에게 있음<br><br>→ **이 한계를 극복하기 위해 AIND 등장** |

> **AI Coding 도구와 AIND의 관계**
>
> - GitHub Copilot, Cursor, Claude Code 같은 도구 자체가 'AI Coding'인 것은 아닙니다.
>
> - 이 도구들을 코드 작성 보조 용도로만 쓰면 AI Coding이고, 요구사항 배경/설계 의도/도메인 규칙까지 AI와 공유하며 전주기에 활용하면 AIND가 됩니다.
>
> - **구분 기준은 도구가 아닌 활용 방식**입니다.

### AI Coding과 AIND의 차이

| 구분 | AI Coding | AIND |
| --- | --- | --- |
| 활용 범위 | **코드 작성 중심** — 코드 자동완성, 함수 생성 등 특정 코딩 작업 단계에만 AI를 활용 | **요구사항 정의 → 설계 → 구현 → 검증 전주기** — 개발의 모든 단계에서 AI와 협력하며, 기획/분석/테스트까지 AI가 참여 |
| 역할 | **생산성 도구** — 개발자의 작업 속도를 높이는 보조 수단. 개발 방식 자체는 기존과 동일 | **개발 패러다임** — AI를 팀원 수준으로 포함하는 새로운 개발 방식. 사고/설계 방식 자체의 변화 |
| 구조 | **단발성 활용** — 필요한 시점에 AI에게 요청하고 결과를 수령 | **반복적 협업 구조** — 도메인 지식/요구사항/설계 의도를 AI와 지속적으로 공유하며 맥락(컨텍스트)을 쌓아가는 반복 협업 사이클 |
| 책임 | **개발자 중심** — AI의 결과물은 참고용이며, 모든 품질 책임은 개발자에게 있음 | **개발자 + AI 협업** — AI와 함께 품질 기준을 설정하고 검증. 결과 책임은 개발자에게 있으나 AI가 품질 과정에 참여 |
| 컨텍스트 관리 | **코드 레벨 맥락 유지** — Cursor 등 도구는 파일 구조/함수/코딩 패턴 등 기술적 맥락을 유지하지만, 비즈니스 도메인 지식이나 설계 의도는 포함되지 않음 | **비즈니스/도메인 레벨까지 확장** — 코드 레벨 맥락에 더해 요구사항 배경, 설계 결정의 이유, 품질 기준까지 AI와 공유/유지함. 컨텍스트 엔지니어링이 AIND의 핵심 역량임 |
| 대상 역할 | **개발자 전용** — 코드를 직접 작성하는 엔지니어에게 국한 | **PM/기획자/개발자** — 요구사항 정의, 설계, 구현, 검증 등 전 역할이 AI와 협업하는 방식으로 확장 |

### AIND의 등장 배경

#### 수요 측면의 변화

- **[소프트웨어 복잡도 증가]** 마이크로서비스로 시작된 시스템 복잡도는 멀티클라우드/하이브리드 환경, AI 컴포넌트 통합으로 더욱 심화되었으며, 비결정적 AI 동작, 분산된 인프라, 방대한 API 의존성 등이 맞물리면서 개발자 혼자 전체/맥락을 유지하며 개발하는 것이 구조적으로 어려워졌습니다.
  → **AI가 맥락을 보조 유지하는 협업 파트너로 부상**

- **[개발 생산성 요구 증대]** 시장 경쟁이 심화됨에 따라 시장 출시 속도(Time-to-Market) 압박이 높아지면서 기존 방식만으로는 한계에 도달했으며, 더 적은 인력으로 더 빠르게 개발해야 하는 압력이 증가하고 있습니다.
  → **단순 코드 보조(AI Coding)를 넘어 전주기 AI 협업이 필요해짐**

- **[개발 인력 수급 불균형]** 숙련 개발자 부족과 인건비 상승이 지속되면서 분석/설계자 등 비코딩 직군도 AI를 통해 개발 과정에 직접 참여할 수 있는 방법이 요구되기 시작했습니다.
  → **AIND는 전 직군이 AI와 협업하는 패러다임으로 확장**

#### 기술 공급 측면의 변화

- **[대규모 언어 모델(LLM)의 고도화]** GPT-4, Claude 등 LLM이 수만 토큰의 긴 컨텍스트를 이해하고 유지할 수 있게 되어, 단순 문장 생성을 넘어 요구사항 분석과 설계 추론이 가능해졌습니다.
  → **AI가 일회성 도구가 아닌 지속적 협업 파트너로 동작 가능**

- **[코드 이해 및 생성 능력 향상]** 코드 특화 LLM이 고도화되어 버그 탐지, 리팩토링, 테스트 코드 생성 등 개발 전반의 작업을 수행할 수 있게 되었습니다.
  → **AI 역할이 코드 보조 → 개발 전주기 참여로 확대**

#### 생태계 측면의 변화

- **[AI 개발 도구 생태계 성숙]** Cursor, Claude Code 등 IDE 통합 AI 도구와 LangChain, AutoGen 같은 Agent 프레임워크가 등장하고, 고도화됨에 따라 AIND를 실제 업무에 적용할 수 있는 환경이 갖춰지고 있습니다.
  → **AIND는 개념이 아니라, 실현 가능한 개발 방식이 됨**

## AIND의 핵심 개념

### 컨텍스트 엔지니어링과 AIND의 관계

AIND의 핵심 개념인 컨텍스트 엔지니어링(Context Engineering)을 이해하려면 먼저 도구와 방법론의 차이를 구분해야 합니다.

#### 도구(Tool) vs 방법론(Methodology) — Cursor는 AI Coding인가 AIND인가?

Cursor, GitHub Copilot, Claude Code 같은 도구 자체가 AI Coding인지 AIND인지를 결정하는 것이 아닙니다. 그 도구를 어떤 방식으로 활용하느냐가 AI Coding과 AIND를 구분합니다.

| **AI Coding 방식으로 Cursor를 사용하는 경우** | **AIND 방식으로 Cursor를 사용하는 경우** |
| --- | --- |
| 코드 자동완성, 함수 생성 요청, 오류 수정 등 코드 작성 작업에만 활용한다. 프로젝트 맥락은 Cursor가 코드베이스를 인덱싱한 수준에서 유지된다. → Cursor의 기능을 쓰지만, 활용 범위는 코드 작성 단계에 국한 | .cursorrules에 비즈니스 규칙/도메인 용어/설계 원칙을 정의하고, Skills로 반복 워크플로우를 자동화한다. → 동일한 도구지만, 비즈니스 맥락까지 AI와 공유하는 AIND 방식 |

#### 컨텍스트 엔지니어링이란?

컨텍스트 엔지니어링이란 AI가 좋은 결과를 내기 위해 필요한 **배경 정보/도메인 지식/제약조건/목표**를 체계적으로 구성하고 전달하는 기술로, 단순히 "프롬프트를 잘 쓰는 것"을 넘어 AI가 프로젝트 전체를 이해하고 지속적으로 협업할 수 있도록 맥락을 설계하는 행위입니다.

Cursor 같은 도구가 코드베이스를 인덱싱하여 유지하는 것은 **코드 레벨 맥락**이며, 컨텍스트 엔지니어링은 여기서 한 단계 더 나아가 **"왜 이렇게 만들어야 하는가"** — 비즈니스 목표, 설계 결정의 이유, 도메인 규칙까지를 AI가 이해하도록 설계하는 것입니다.

**컨텍스트 깊이 비교**

아래는 같은 요청이지만 컨텍스트 깊이가 다른 예시입니다. AI가 받는 맥락의 수준이 결과물의 품질을 결정합니다.

| **코드 레벨 컨텍스트 (AI Coding)** | **비즈니스/도메인 레벨 컨텍스트 (AIND)** |
| --- | --- |
| "사용자 목록을 가져오는 API를 만들어줘." (Cursor가 코드베이스를 인덱싱하고 있는 상태) → AI는 기존 코드 패턴을 참고하지만, 인증 방식/페이징 정책/비즈니스 규칙은 여전히 임의로 결정 | .cursorrules에 인증은 JWT, 페이징은 커서 기반, 응답은 표준 래퍼 사용 등의 규칙이 정의됨 → AI가 시스템 구조뿐 아니라 비즈니스 규칙과 제약까지 이해하고 적합한 코드를 생성 |

### AI와의 협업 사이클 (Prompt → Review → Refine)

AIND의 작업 방식은 단발성 요청-응답이 아닌 **반복적인 3단계 협업 사이클**로 이루어지며, 이 사이클이 AI Coding과 AIND를 구조적으로 가르는 핵심 특성입니다.

| **① Prompt** | **② Review** | **③ Refine** |
| --- | --- | --- |
| 컨텍스트를 포함한 요청을 AI에게 전달한다. 단순 명령이 아닌 배경/목표/제약을 함께 제공한다. (컨텍스트 엔지니어링이 적용되는 단계) | AI의 결과물을 비즈니스 요구사항, 기술 기준, 팀 컨벤션에 맞게 검토한다. 개발자의 판단력이 핵심이다. | 검토 결과를 바탕으로 컨텍스트를 보완하고 AI에게 재요청한다. 결과물이 기준에 맞을 때까지 반복한다. |

> 이 사이클이 반복될수록 AI는 더 많은 맥락을 갖게 되고, 결과물의 품질이 점점 높아집니다. AIND는 "한 번에 완벽한 결과"가 아닌 "반복을 통한 정교화"를 전제로 합니다.

### 개발자 역할의 변화 — 코드 작성 중심에서 설계/검토 중심으로

AIND를 도입한다고 해서 기존의 개발 지식이나 역량이 사라지는 것은 아닙니다. 오히려 개발자의 핵심 역할이 **"무엇을 만들 것인가"를 설계하고 판단하는 방향으로 상향**됩니다.

변화의 핵심은 아래와 같이 세 가지로 볼 수 있습니다.

1. **코드 작성자 → 컨텍스트 설계자**
   요구사항/도메인 지식/설계 의도를 AI가 이해할 수 있도록 구조화하여 전달하는 역할이 중요해짐. AI에게 무엇을 어떻게 전달하는지가 결과물의 품질을 결정함.

2. **구현 중심 → 검토/판단 중심**
   AI가 생성한 코드/설계안이 요구사항에 맞는지, 기술적으로 적절한지를 판단하는 역량이 핵심이 됨. AI는 틀린 결과를 자신 있게 제시할 수 있으므로 개발자의 비판적 검토가 품질의 최후 방어선임.

3. **독립적 작업 → 반복 협업 설계**
   한 번의 요청으로 끝내려 하지 않고, 컨텍스트를 단계적으로 쌓아가며 AI와 반복 협업하는 워크플로우를 설계하는 역량이 필요해짐.

| **기존 AI Coding 방식** | **AIND 방식** |
| --- | --- |
| **코드 작성자 중심** — 요구사항을 받아 직접 코드로 구현. AI는 코드 자동완성 보조 도구. 각 작업이 독립적으로 처리됨. 구현 세부사항에 집중. 코드 품질 = 개발자 책임 | **설계자/검토자 중심** — 요구사항/설계 의도를 AI에게 전달/정의. AI와 함께 방향을 탐색하고 결과를 검토. 컨텍스트를 누적하며 반복 협업. 전체 아키텍처와 품질 기준에 집중. AI 결과물의 적절성을 판단/수정 |

> AIND에서 개발자의 가치는 "코드를 얼마나 빠르게 작성하느냐"에서 "**AI에게 올바른 맥락을 전달하고, AI의 결과물을 정확하게 검토/판단하는 역량**"으로 이동합니다.

#### 컨텍스트 설계 역량

AI에게 어떤 배경과 제약을 전달해야 하는지를 구조화하는 능력으로, 이를 위해서는 비즈니스 도메인 이해와 시스템 아키텍처 이해가 선행되어야 합니다. 컨텍스트를 잘 설계하는 개발자가 AIND 환경에서 더 높은 생산성을 발휘합니다.

#### AI 결과물 검토/판단 역량

AI가 생성한 코드/설계안이 요구사항에 맞는지, 기술적으로 적절한지를 판단하는 능력입니다. AI는 틀린 결과를 자신 있게 제시할 수 있으므로, 개발자의 비판적 검토 능력이 품질의 최후 방어선이 됩니다.

#### 반복 협업 설계 역량

한 번의 요청으로 끝내려 하지 않고, 단계적으로 컨텍스트를 쌓아가며 AI와 협업하는 워크플로우를 설계하는 능력입니다. 특히 복잡한 기능 구현 시 이 역량이 결과물의 완성도를 결정합니다.

## 개발 단계별 AIND 적용

### 요구사항 정의~검증 전주기에서 AI 역할 요약

AIND의 핵심 특성 중 하나는 AI가 코드 작성 단계에만 머물지 않고, 개발 전주기에 걸쳐 서로 다른 역할로 참여한다는 것입니다.

| 단계 | AI Coding | AIND에서의 AI 역할 | 개발자의 역할 |
| --- | --- | --- | --- |
| 요구사항 분석 | 개발자 단독 분석 (AI 미활용) | 요구사항 구조화 보조, 누락 케이스 탐지, 유사 사례 제안 | 비즈니스 맥락 제공, AI 제안 검토 및 확정 |
| 설계 | 설계 후 AI에게 코드 요청 | 아키텍처 대안 제시, 설계 의도 기반 구조 초안 생성 | 설계 의도/제약 전달, 대안 평가 및 결정 |
| 구현 | AI가 코드 자동완성 보조 | 컨텍스트 기반 코드 생성, 반복 수정, 리팩토링 제안 | 컨텍스트 설계, 결과물 검토/수정, 품질 판단 |
| 테스트/검증 | 개발자가 직접 테스트 작성 | 테스트 케이스 생성, 엣지 케이스 탐지, 코드 리뷰 보조 | 테스트 기준 정의, AI 생성 케이스 검토 및 보완 |

### AIND 적용 전/후 비교 시나리오

하나의 실제 개발 상황을 통해 AI Coding 방식과 AIND 방식의 차이를 구체적으로 확인할 수 있습니다.

**시나리오 : 주문 처리 API 신규 개발**

| **AI Coding 방식 접근** | **AIND 방식 접근** |
| --- | --- |
| - 요구사항 문서를 읽고 개발자가 설계를 단독으로 완료<br>- IDE에서 "주문 API 만들어줘"로 코드 자동완성 활용<br>- 생성된 코드 조각들을 붙여 전체 구조 완성<br>- 테스트는 개발자가 직접 작성<br>- AI는 각 코드 작성 순간에만 개입 | - AI에게 시스템 구조, 기존 패턴, 비즈니스 규칙을 먼저 공유<br>- AI와 함께 API 설계 초안 검토 → 개발자가 방향 확정<br>- 컨텍스트 기반으로 전체 구조 코드 생성 → 검토 → 수정 반복<br>- AI가 엣지 케이스 제안, 개발자가 기준에 맞는지 판단<br>- AI가 테스트 케이스 초안 생성 → 개발자가 보완/확정 |

**두 방식의 결과 차이**

| **AI Coding 결과** | **AIND 결과** |
| --- | --- |
| - 코드 작성 속도는 빠름<br>- 각 코드 조각의 맥락 일관성이 낮을 수 있음<br>- 설계 결정은 모두 개발자 단독<br>- 누락된 케이스는 개발자가 직접 발견해야 함 | - 초기 설정 시간이 있으나 전체 품질이 높음<br>- 전체 코드가 일관된 맥락 하에서 생성됨<br>- 설계 대안을 AI와 검토하며 결정 품질 향상<br>- AI가 엣지 케이스 선제 탐지에 기여 |

## AIND 실무 활용

### 주요 AI Coding 도구의 특징 비교

AIND를 실무에서 구현하려면 도구의 특성을 이해하고 상황에 맞게 선택해야 합니다. 대표적인 AI Coding 도구인 Cursor, Claude Code, GitHub Copilot의 핵심 차이점을 비교합니다.

#### 도구별 핵심 특징

| 구분 | Cursor | Claude Code | GitHub Copilot |
| --- | --- | --- | --- |
| 형태 | AI 기능 내장 IDE (VS Code 기반) | 터미널 기반 AI 에이전트 | IDE 확장(Extension) 플러그인 |
| 핵심 특징 | 코드베이스 자동 인덱싱, Tab 자동완성 + Cmd+K 인라인 편집, Chat / Composer / Agent 모드, .cursorrules로 프로젝트 규칙 설정 | 프로젝트 전체 파일 자율 접근, 코드 편집/실행/테스트 자동 수행, CLAUDE.md로 컨텍스트 설정, 터미널에서 자연어로 지시 | 인라인 코드 자동완성 중심, Chat 기반 코드 Q&A, VS Code / JetBrains 등 지원, Copilot Workspace(프리뷰) |
| 컨텍스트 관리 | 코드베이스 인덱싱 + @파일/@폴더 참조로 컨텍스트 직접 지정 가능 | 프로젝트 전체를 자동 탐색하며 필요한 파일을 스스로 찾아 참조 | 현재 열린 파일 및 인접 파일 중심의 제한적 컨텍스트 |
| AIND 적합성 | 높음 — 규칙 파일과 컨텍스트 지정 기능으로 AIND 방식 적용에 적합 | 매우 높음 — 전주기 협업에 적합한 에이전틱 코드 도구 | 보통 — 코드 작성 보조에 강점이 있으나 AIND 전주기 적용에는 제약 |
| 적합 시나리오 | IDE 환경에서 코드 작성과 설계를 AI와 함께 반복 협업할 때 | 대규모 리팩토링, 멀티파일 작업, 자율적 작업 위임이 필요할 때 | 기존 IDE를 유지하면서 코드 자동완성 생산성을 높이고자 할 때 |

> **도구 선택의 핵심 기준**
>
> - 도구 자체보다 활용 방식이 AI Coding과 AIND를 구분한다는 원칙은 변하지 않습니다.
>
> - 다만 도구마다 AIND 방식 적용의 용이성에 차이가 있으므로, 프로젝트 특성과 팀 역량에 맞는 도구를 선택하는 것이 중요합니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 비교표의 세 도구 모두 '에이전트' 중심으로 재편되었고, Copilot Workspace는 이미 종료되었으며 과금 방식도 바뀌었습니다.

- 확인된 사실: 표의 "Copilot Workspace(프리뷰)"는 기술 프리뷰가 2025-05-30에 종료되었고, 이슈를 받아 백그라운드에서 PR을 만드는 Copilot coding agent가 2025-09-25 유료 플랜 전체에 GA되었습니다. ([GitHub Changelog — Copilot coding agent GA](https://github.blog/changelog/2025-09-25-copilot-coding-agent-is-now-generally-available/), 검색 결과로만 확인) 현재 GitHub 공식 문서는 이 기능을 "Copilot cloud agent"라는 이름으로 부릅니다. ([GitHub Docs — Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions), 2026-10-12 확인)
- 확인된 사실: GitHub Copilot은 2026-06-01부터 premium request 방식 대신 토큰 사용량 기반의 GitHub AI Credits로 과금합니다. 공식 공지 기준 Pro 월 $10, Pro+ 월 $39, Business 사용자당 월 $19, Enterprise 사용자당 월 $39이며 각각 같은 금액의 월 크레딧이 포함됩니다. 코드 자동완성과 Next Edit suggestions는 크레딧을 소모하지 않습니다. ([GitHub Changelog — usage-based billing](https://github.blog/changelog/2026/04/27/github-copilot-is-moving-to-usage-based-billing/), 2026-10-12 확인) 요금제 페이지에는 월 $100의 Max 플랜도 추가되어 있습니다. ([GitHub Copilot Plans](https://github.com/features/copilot/plans), 2026-10-12 확인)
- 확인된 사실: Cursor 요금제 페이지 기준 Hobby(무료), 개인 유료 플랜은 월 $20부터(Pro·Pro+·Ultra), Teams는 사용자당 월 $40이며, 개인 유료 플랜에 MCP·skills·hooks·cloud agents가 포함되어 있습니다. ([Cursor Pricing](https://cursor.com/pricing), 2026-10-12 확인)
- 확인된 사실: Cursor 운영사 Anysphere는 SpaceX(xAI와 합병)에 전액 주식 방식으로 인수되었고, 거래는 2026-08-14 완료되었습니다. 보도 기준으로 Cursor 브랜드와 제품은 유지되고 있습니다. ([The Next Web](https://thenextweb.com/news/spacex-cursor-acquisition-completed-gpu-fleet), 2026-10-12 확인)
- 확인된 사실: Claude Code는 이제 터미널 전용이 아니라 터미널·IDE·데스크톱 앱·브라우저(클라우드 세션)에서 쓸 수 있는 도구로 소개됩니다. ([Agent Skills 클라이언트 목록의 Claude Code 소개](https://agentskills.io), 2026-10-12 확인)
- 해석·전망: Copilot도 agent 모드와 cloud agent로 멀티파일 편집·PR 생성까지 하므로, 표의 "현재 열린 파일 중심의 제한적 컨텍스트", "AIND 적합성 보통" 평가는 지금 기준으로는 Copilot을 과소평가한 것으로 보입니다. 세 도구의 차이는 '자동완성 vs 에이전트'보다 '어디서 실행되는 에이전트인가(IDE/터미널/클라우드)'와 하네스 설계 차이로 옮겨 갔습니다.
- 확인하지 못한 것: Copilot agent 모드의 현재 컨텍스트 수집 방식, Cursor 인수 이후의 제품 로드맵·데이터 정책 변경 여부는 공식 문서로 확인하지 못했습니다.

교육·실습 관점: 표는 "형태" 축 대신 "IDE 내 에이전트 / 터미널 에이전트 / 클라우드(비동기) 에이전트" 축으로 다시 비교해 보는 것을 권합니다. 가격과 포함 사용량은 분기마다 바뀌고 있으니 강의 자료에 숫자를 고정하지 말고, 수업 당일 공식 요금제 페이지를 함께 열어 보는 방식이 안전합니다.
:::

#### 주요 Use Case 비교

동일한 작업을 각 도구에서 어떻게 수행하는지 비교하면 도구별 특성을 더 명확히 이해할 수 있습니다.

| Use Case | Cursor | Claude Code | GitHub Copilot |
| --- | --- | --- | --- |
| 코드 자동완성 | Tab 키로 실시간 자동완성, 멀티라인 제안 | 터미널에서 자연어 지시 후 코드 생성 | 인라인 실시간 자동완성 (가장 빠른 반응) |
| 코드 리팩토링 | 코드 선택 → Cmd+K로 인라인 리팩토링 지시 | "이 모듈을 리팩토링해줘" → 자율적으로 관련 파일 탐색/수정 | Chat에서 리팩토링 요청 → 제안 코드 수동 적용 |
| 멀티파일 작업 | Composer/Agent 모드에서 여러 파일 동시 편집 | 프로젝트 전체를 자동 탐색하며 필요한 파일 모두 수정 | 파일 단위 개별 작업 (멀티파일 동시 편집 제한적) |
| 테스트 코드 생성 | 대상 코드 참조하여 테스트 생성 요청 | "테스트 작성하고 실행까지 해줘" → 생성+실행+수정 자동 | Chat에서 테스트 생성 요청 → 결과 복사/붙여넣기 |
| 디버깅 | 오류 코드 선택 후 "이 오류 원인 분석해줘" 요청 | 에러 메시지 전달 → 원인 분석 + 자동 수정 + 재실행 확인 | 에러 메시지 붙여넣기 → 원인 설명 및 수정안 제시 |

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 원문 비교표 밖의 주요 AI 코딩 도구 상당수가 이름이 바뀌거나 개인용 서비스가 종료되었습니다.

- 확인된 사실: Windsurf는 2025년 7월 Cognition에 인수된 뒤 2026-06-02 "Devin Desktop"으로 이름이 바뀌었습니다. 현재 `windsurf.com`에 접속하면 `devin.ai/desktop`으로 영구 리다이렉트(308)됩니다. (windsurf.com 직접 접속으로 2026-10-12 확인; 공식 공지 [Windsurf is now Devin Desktop](https://devin.ai/blog/windsurf-is-now-devin-desktop)은 검색 결과로만 확인)
- 확인된 사실: Google은 2026-06-18부터 Google AI Pro·Ultra 및 무료 개인 사용자에 대해 Gemini CLI와 Gemini Code Assist IDE 확장의 요청 처리를 중단하고 Antigravity CLI로 전환했습니다. Gemini Code Assist Standard/Enterprise 라이선스 조직은 계속 사용할 수 있습니다. ([Google Developers Blog](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/), 2026-10-12 확인)
- 확인된 사실: AWS는 Amazon Q Developer의 신규 가입을 2026-05-15부터 막고, IDE 플러그인(VS Code·JetBrains·Eclipse·Visual Studio)과 유료 구독을 2027-04-30에 지원 종료한다고 발표했으며 후속 도구로 Kiro를 권장합니다. AWS 콘솔 등 1st-party 경험의 Q는 영향을 받지 않습니다. ([AWS 블로그(일본어)](https://aws.amazon.com/jp/blogs/news/amazon-q-developer-end-of-support-announcement/), 2026-10-12 확인)
- 확인된 사실: Kiro 요금제는 Free($0, 50 credits), Pro(사용자당 월 $20), Pro+($40), Pro Max($100), Power($200)입니다. ([Kiro Pricing](https://kiro.dev/pricing/), 2026-10-12 확인)
- 확인된 사실: OpenAI Codex는 ChatGPT 플랜(Free, Go 월 $8, Plus 월 $20, Pro 월 $100부터, Business 사용자당 월 $20(연간 결제) 등)에 포함되며 데스크톱 앱·CLI·웹·IDE 확장으로 쓸 수 있습니다. ([Codex Pricing](https://learn.chatgpt.com/docs/pricing), 2026-10-12 확인)
- 확인된 사실: JetBrains는 2026년 3월 LLM 비종속 터미널 에이전트 Junie CLI 베타를 공개했고, 4월에는 실행 중인 JetBrains IDE의 인덱싱·분석 기능에 연결되도록 했습니다. ([JetBrains Junie 블로그](https://blog.jetbrains.com/junie/2026/03/junie-cli-the-llm-agnostic-coding-agent-is-now-in-beta/), 검색 결과로만 확인)
- 확인된 사실: Windsurf의 Cascade 에이전트는 Devin Local로 대체되었고, 공식 FAQ는 기존 Cascade를 "7월까지 계속 사용 가능"하다고 안내했습니다. 제3자 기사에 나온 '2026-07-01 종료'와는 다르므로 공식 FAQ를 기준으로 삼습니다. ([Devin Desktop FAQ](https://docs.devin.ai/desktop/devin-desktop-faq), 2026-10-12 확인)
- 확인하지 못한 것: 개인용 Jules 접근이 Gemini CLI와 함께 종료되었다는 내용, Junie의 GA(2026년 6월)는 제3자 기사로만 보았고 공식 문서로는 확인하지 못했습니다.
- 해석·전망: 도구 간 이합집산(인수·리브랜딩·종료)이 1년 사이 여러 번 일어났습니다. 특정 도구에 맞춘 절차보다 `AGENTS.md`, Agent Skills, MCP처럼 도구가 바뀌어도 들고 갈 수 있는 자산에 투자하는 편이 안전해 보입니다.

교육·실습 관점: 실습 환경에서 개인 계정의 Gemini CLI·Jules나 Amazon Q Developer IDE 플러그인을 쓰고 있었다면 교체가 필요합니다(Google은 Antigravity CLI, AWS는 Kiro를 안내). Windsurf 화면 캡처가 들어간 자료는 Devin Desktop 기준으로 갱신하세요.
:::

### 프로젝트 설정 파일 활용

AIND에서 컨텍스트 엔지니어링을 실현하는 가장 구체적인 수단이 프로젝트 설정 파일입니다. 이 파일들은 AI가 프로젝트의 규칙, 구조, 제약을 지속적으로 참조할 수 있게 하여 매번 반복 설명 없이도 일관된 결과물을 생성하도록 돕습니다.

#### .cursorrules (Cursor)

Cursor에서 프로젝트 루트에 위치하는 설정 파일로, AI가 코드를 생성하거나 수정할 때 자동으로 참조하는 규칙을 정의합니다.

- **역할:** 프로젝트의 코딩 컨벤션, 아키텍처 규칙, 금지 패턴, 선호 패턴 등을 AI에게 지속적으로 전달
- **위치:** 프로젝트 루트 디렉토리 (예: /project-root/.cursorrules)
- **적용 범위:** 해당 프로젝트에서 Cursor의 모든 AI 기능(자동완성, Chat, Composer 등)에 적용

**포함해야 할 주요 내용**

| 항목 | 예시 |
| --- | --- |
| **기술 스택 명시** | "이 프로젝트는 Spring Boot 3.2 + Java 17 + PostgreSQL을 사용합니다" |
| **코딩 컨벤션** | "메서드명은 camelCase, 클래스명은 PascalCase를 사용합니다. 모든 public 메서드에 Javadoc을 작성합니다" |
| **아키텍처 규칙** | "Controller → Service → Repository 계층 구조를 따르며, Controller에서 직접 Repository를 호출하지 않습니다" |
| **금지 패턴** | "System.out.println 대신 SLF4J 로거를 사용합니다. 하드코딩된 비밀번호/API 키를 절대 포함하지 않습니다" |
| **선호 패턴** | "예외 처리는 GlobalExceptionHandler를 통해 일괄 처리합니다. DTO 변환은 MapStruct를 사용합니다" |

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — `.cursorrules` 한 파일 대신 `.cursor/rules/*.mdc`와 도구 공통의 `AGENTS.md`가 표준 경로가 되었습니다.

- 확인된 사실: 현재 Cursor 공식 Rules 문서는 프로젝트 규칙을 `.cursor/rules` 디렉토리의 `.mdc` 파일로 작성하도록 안내하며, 같은 디렉토리의 일반 `.md` 파일은 frontmatter가 없어 무시된다고 명시합니다. 규칙 적용 방식은 Always Apply / Apply Intelligently / Apply to Specific Files / Apply Manually 네 가지이고, Team·Enterprise 플랜에는 대시보드에서 관리하는 Team Rules가 있습니다. 문서 어디에도 `.cursorrules`는 더 이상 나오지 않습니다. ([Cursor Docs — Rules](https://cursor.com/docs/context/rules), 2026-10-12 확인)
- 확인된 사실: 같은 문서에서 Cursor는 프로젝트 루트와 하위 디렉토리의 `AGENTS.md`를 `.cursor/rules`의 간단한 대안으로 지원합니다. ([Cursor Docs — Rules](https://cursor.com/docs/context/rules), 2026-10-12 확인)
- 확인된 사실: `AGENTS.md`는 2025년 12월 출범한 Agentic AI Foundation(Linux Foundation 산하)이 MCP 등과 함께 관리하는 오픈 포맷이 되었고, 6만 개 이상의 오픈소스 프로젝트가 사용합니다. ([agents.md](https://agents.md), 2026-10-12 확인; [OpenAI — Agentic AI Foundation](https://openai.com/blog/agentic-ai-foundation), 검색 결과로만 확인)
- 확인된 사실: GitHub Copilot은 `.github/copilot-instructions.md`(저장소 전체), `.github/instructions/` 아래 `NAME.instructions.md`(경로별), 저장소 내 `AGENTS.md`, 루트의 `CLAUDE.md` 또는 `GEMINI.md` 하나를 지시 파일로 인식합니다. ([GitHub Docs — Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions), 2026-10-12 확인) Kiro는 `.kiro/steering/`의 steering 파일과 `AGENTS.md`를 지원합니다. ([Kiro Docs — Steering](https://kiro.dev/docs/steering/), 검색 결과로만 확인)
- 확인하지 못한 것: 기존 `.cursorrules`가 지금도 하위 호환으로 로드되는지는 Cursor 공식 문서에서 확인하지 못했습니다. 제3자 글과 포럼에는 "레거시로 남아 있으나 Agent에서 적용되지 않는 사례가 있다"는 보고가 있습니다.

교육·실습 관점: 실습은 `.cursorrules` 대신 `.cursor/rules/` 아래 `.mdc` 파일(예: 항상 적용되는 프로젝트 규칙 1개 + 특정 경로에만 적용되는 규칙 1개)로 다시 작성하세요. 팀이 Cursor·Claude Code·Copilot·Codex를 섞어 쓴다면 공통 규칙은 `AGENTS.md` 하나에 두고, 도구별 파일에는 그 도구에만 필요한 내용만 남기는 구성이 관리하기 쉽습니다. 위 표의 항목(기술 스택·컨벤션·아키텍처·금지/선호 패턴)은 파일 형식만 바뀌었을 뿐 그대로 유효합니다.
:::

#### CLAUDE.md (Claude Code)

Claude Code가 프로젝트 작업 시 자동으로 읽어 참조하는 설정 파일입니다. .cursorrules와 유사한 목적이지만, Claude Code의 에이전틱 특성에 맞게 보다 포괄적인 프로젝트 정보를 포함합니다.

- **역할:** 프로젝트 구조, 빌드/테스트 명령어, 코딩 스타일, 도메인 규칙 등 프로젝트 전반의 컨텍스트 제공
- **위치:** 프로젝트 루트 디렉토리 (예: /project-root/CLAUDE.md)
- **특징:** Claude Code가 자율적으로 파일 탐색/편집/실행할 때 이 파일의 규칙을 준수

**포함해야 할 주요 내용**

| 항목 | 예시 |
| --- | --- |
| **프로젝트 개요** | "B2B SaaS 주문관리 시스템. 멀티테넌트 구조이며 테넌트 간 데이터 격리가 핵심 보안 요건임" |
| **프로젝트 구조** | "src/main/java: 소스코드, src/test: 테스트, docs/: API 문서, config/: 환경설정" |
| **빌드/실행 명령어** | "빌드: ./gradlew build / 테스트: ./gradlew test / 로컬 실행: docker-compose up" |
| **코딩 스타일 및 규칙** | "Google Java Style Guide 준수. 모든 API는 OpenAPI 3.0 스펙을 먼저 작성한 후 구현" |
| **도메인 규칙** | "주문 취소는 결제 완료 후 24시간 이내만 가능. 할인율은 고객 등급에 따라 차등 적용" |
| **금지 사항** | "main 브랜치 직접 수정 금지. 환경변수에 민감정보 하드코딩 금지. ORM 없이 raw SQL 금지" |

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — `CLAUDE.md`는 위치·범위가 세분화되었고, `AGENTS.md`를 직접 읽게 되었으며, "규칙"이지 "강제"가 아니라는 점이 공식 문서에 명시되었습니다.

- 확인된 사실: 프로젝트 지시 파일은 `./CLAUDE.md` 또는 `./.claude/CLAUDE.md`에 둘 수 있고, 개인 전역 `~/.claude/CLAUDE.md`, 커밋하지 않는 개인용 `./CLAUDE.local.md`, 조직이 배포하는 managed `CLAUDE.md`가 있습니다. 하위 디렉토리의 `CLAUDE.md`는 Claude가 그 디렉토리 파일을 다룰 때 필요 시 로드됩니다. ([Claude Code Docs — Memory](https://code.claude.com/docs/en/memory), 2026-10-12 확인)
- 확인된 사실: `.claude/rules/` 디렉토리에 주제별 `.md` 규칙 파일을 나눠 둘 수 있고, `paths` frontmatter로 특정 파일 경로에서만 로드되게 할 수 있습니다. ([Claude Code Docs — Memory](https://code.claude.com/docs/en/memory), 2026-10-12 확인)
- 확인된 사실: Claude Code v2.1.277 이상은 작업 디렉토리 위쪽에 `CLAUDE.md`·`.claude/CLAUDE.md`·`CLAUDE.local.md`가 없을 때 `AGENTS.md`를 프로젝트 지시로 읽습니다. 둘 다 있으면 기본값으로 `CLAUDE.md`만 읽으며, `CLAUDE.md`에서 `AGENTS.md`를 import하는 방식도 안내합니다. ([Claude Code Docs — Memory](https://code.claude.com/docs/en/memory), 2026-10-12 확인)
- 확인된 사실: Claude가 사용자의 교정·선호를 스스로 메모하는 auto memory가 추가되어 매 세션 함께 로드됩니다. 또한 공식 문서는 `CLAUDE.md`를 "강제되는 설정이 아니라 컨텍스트"로 취급한다고 밝히고, 반드시 막아야 하는 동작은 PreToolUse hook으로 차단하라고 안내합니다. ([Claude Code Docs — Memory](https://code.claude.com/docs/en/memory), 2026-10-12 확인)
- 해석·전망: 위 표의 "금지 사항" 행(예: main 브랜치 직접 수정 금지)은 `CLAUDE.md`에 적는 것만으로는 보장되지 않습니다. 원칙은 `CLAUDE.md`에 쓰고, 정말 지켜야 하는 것은 permissions·hooks·브랜치 보호 규칙 같은 강제 수단으로 이중화하는 것이 맞다고 봅니다.

교육·실습 관점: 실습에서는 세션에서 `/context`를 실행해 어떤 메모리 파일이 실제로 로드되었는지 확인하는 단계를 추가하세요. 표의 "도메인 규칙"처럼 특정 모듈에만 해당하는 내용은 `.claude/rules/`의 경로 한정 규칙으로 분리해 보는 연습이 컨텍스트 엔지니어링 감각을 기르는 데 좋습니다.
:::

> **설정 파일이 컨텍스트 엔지니어링의 실체인 이유**
>
> - 컨텍스트 엔지니어링은 "AI에게 배경/목표/제약을 체계적으로 전달하는 기술"입니다.
>
> - .cursorrules와 CLAUDE.md는 이 원칙을 파일 형태로 구현한 것입니다. 매 대화마다 반복 설명하는 대신, 프로젝트 규칙을 파일로 정의하면 AI가 지속적으로 일관된 컨텍스트를 참조하게 됩니다.
>
> - 즉, 설정 파일 = 지속적 컨텍스트(Persistent Context)의 실현 수단입니다.

#### Skills (커스텀 명령어)

.cursorrules와 CLAUDE.md가 "AI가 항상 참조하는 규칙"이라면, Skills는 "개발자가 호출하거나 에이전트가 자동으로 적용하는 실행 가능한 워크플로우"입니다. 도메인 특화 지식, 스크립트, 템플릿을 마크다운 파일로 정의하면, 팀원 누구나 동일한 명령어로 표준화된 작업을 수행할 수 있습니다. Cursor와 Claude Code 모두 Skills 체계를 제공하며, Agent Skills는 에이전트 도구 간 호환을 목표로 하는 오픈 표준으로 발전하고 있습니다.

| 구분 | Claude Code Skills | Cursor Agent Skills |
| --- | --- | --- |
| **정의 방식** | .claude/skills/스킬명/SKILL.md 디렉토리 구조 (기존 .claude/commands/ 단일 파일도 하위 호환 지원) | .agents/skills/스킬명/ 디렉토리에 SKILL.md 파일 생성. .cursor/skills/도 지원 |
| **디렉토리 구조** | 디렉토리 단위 — SKILL.md(필수) + scripts/, templates, examples(선택). 기존 .claude/commands/ 단일 파일도 호환 | 디렉토리 단위 — SKILL.md(필수) + scripts/, references/, assets/(선택) |
| **호출 방식** | 터미널에서 /review처럼 슬래시 명령으로 수동 실행 | 에이전트가 컨텍스트 기반으로 자동 호출하거나, Chat에서 /스킬명으로 수동 실행 |
| **자동 호출** | 지원 — 에이전트가 컨텍스트에 기반하여 자동으로 스킬을 적용하며, 사용자가 / 명령으로 수동 호출도 가능 | 지원 — 에이전트가 관련성을 판단하여 자동 적용. disable-model-invocation: true로 수동 전용 전환 가능 |
| **YAML 프론트매터** | name, description, disable-model-invocation, user-invocable, allowed-tools, context, model 등 | name, description(필수), license, compatibility, disable-model-invocation 등 |
| **인수 전달** | $ARGUMENTS 변수로 호출 시 전달한 값을 본문에 삽입 | 에이전트가 컨텍스트에서 필요한 정보를 자동으로 판단하여 전달 |
| **셸 명령/스크립트** | 본문에 !`command` 구문으로 셸 명령을 전처리 실행하여 동적 컨텍스트를 생성 가능 (예: !`gh pr diff`) | scripts/ 디렉토리에 Bash/Python/JS 스크립트를 배치하고 SKILL.md에서 상대 경로로 참조 |
| **도구 제한** | allowed-tools 프론트매터로 사용 가능한 도구를 제한 (예: Read만 허용) | 별도 도구 제한 기능 없음 |
| **공유 범위** | .claude/commands/는 프로젝트 공유, ~/.claude/commands/는 개인용 | .agents/skills/는 프로젝트 공유 (Git 커밋), ~/.cursor/skills/는 개인용. GitHub URL로 원격 설치도 가능 |

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — Claude Code의 commands는 skills로 통합되었고, Agent Skills는 수십 개 도구가 읽는 공통 포맷이 되어 표의 경로·필드 일부가 바뀌었습니다.

- 확인된 사실: Claude Code 공식 문서는 "custom commands가 skills로 통합되었다"고 명시합니다. `.claude/commands/deploy.md`와 `.claude/skills/deploy/SKILL.md`는 똑같이 `/deploy`를 만들고 기존 commands 파일도 계속 동작하지만, 새 작업은 skills가 권장됩니다. 따라서 표의 "공유 범위" 행은 이제 `.claude/skills/`(프로젝트)·`~/.claude/skills/`(개인) 기준으로 읽어야 하며, 엔터프라이즈·플러그인 위치도 있고 이름이 겹치면 Enterprise → Personal → Project 순으로 우선합니다. ([Claude Code Docs — Skills](https://code.claude.com/docs/en/skills), 2026-10-12 확인)
- 확인된 사실: Claude Code frontmatter에 `when_to_use`, `arguments`(이름 있는 인수, `$이름` 치환), `paths`, `effort`, `disallowed-tools`, `hooks` 등이 추가되었고 `$ARGUMENTS[N]` 형식의 위치 인수도 지원합니다. 문서는 `name`·`description`·`license`·`compatibility`·`metadata`·`allowed-tools`를 Agent Skills 표준 필드로, `disable-model-invocation`·`user-invocable`·`context` 등을 Claude Code 확장 필드로 구분합니다. ([Claude Code Docs — Skills](https://code.claude.com/docs/en/skills), 2026-10-12 확인)
- 확인된 사실: Cursor는 프로젝트의 `.agents/skills/`·`.cursor/skills/`, 사용자 전역의 `~/.agents/skills/`·`~/.cursor/skills/`를 읽고, 호환을 위해 `.claude/skills/`와 `.codex/skills/`도 인식합니다. `name`(소문자·숫자·하이픈)과 `description`이 필수이며 `paths`, `disable-model-invocation`을 지원합니다. ([Cursor Docs — Agent Skills](https://cursor.com/docs/context/skills), 2026-10-12 확인)
- 확인된 사실: Agent Skills 포맷은 Anthropic이 처음 개발해 오픈 표준으로 공개했으며, 클라이언트 목록에 Claude Code·Cursor·GitHub Copilot·VS Code·Codex·Gemini CLI·Kiro·Junie 등이 올라 있습니다. ([agentskills.io](https://agentskills.io), 2026-10-12 확인)
- 확인하지 못한 것: 표의 "Cursor — 별도 도구 제한 기능 없음"이 지금도 맞는지는 Cursor 문서에서 확인하지 못했습니다(문서에 관련 필드가 보이지 않았을 뿐, 부재를 단정할 근거는 없음).
- 해석·전망: 표준 필드만 쓴 스킬은 도구 간 이식성이 높고, 확장 필드는 도구마다 무시될 수 있습니다. 팀 공용 스킬은 표준 필드 중심으로 쓰고, 도구별 확장은 꼭 필요한 곳에만 넣는 것이 좋겠습니다.

교육·실습 관점: Cursor가 `.claude/skills/`도 읽으므로, 실습에서는 스킬을 `.claude/skills/` 한 곳(또는 `.agents/skills/`)에 두고 두 도구에서 모두 호출되는지 확인하는 방식으로 단순화할 수 있습니다. `.claude/commands/` 예제를 쓰는 기존 자료는 skills 디렉토리 구조로 바꿔 두는 편이 좋습니다.
:::

실무에서는 코드 리뷰 포맷을 /review 스킬로 표준화하거나, 배포 절차를 scripts/가 포함된 스킬로 자동화하는 등 팀 단위의 반복 워크플로우를 정의하는 데 활용합니다.

**실습 예시: Skill 작성 따라하기 — 코드 리뷰 스킬**

위에서 언급한 "코드 리뷰 포맷을 /review 스킬로 표준화"하는 사례를 실제로 만들어 보겠습니다. 아래 예시는 Claude Code와 Cursor에서 대부분 동일하게 동작합니다. Claude Code와 Cursor는 유사한 형태의 Skill 구조(SKILL.md + 프론트매터)를 사용하므로, 대부분의 경우 동일한 방식으로 재사용할 수 있습니다.

**(1) 디렉토리 구조**

```
code-review/
├── SKILL.md       # 필수 — 스킬 지침 (프론트매터 + 마크다운)
└── checklist.md   # 선택 — 상세 체크리스트 참조 문서
```

설치 위치는 도구 및 버전에 따라 다를 수 있습니다. 아래는 대표적인 예시이며, SKILL.md 파일의 내용은 동일하게 재사용할 수 있습니다.

| 도구 | 프로젝트 공유 경로 | 개인용 경로 |
| --- | --- | --- |
| Claude Code | .claude/skills/code-review/ | ~/.claude/skills/code-review/ |
| Cursor | .cursor/skills/code-review/ 또는 .agents/skills/code-review/ | ~/.cursor/skills/code-review/ |

**(2) SKILL.md 작성**

```yaml
---
name: code-review
description: >
  변경된 코드를 정확성, 보안, 일관성 관점에서 리뷰합니다.
  코드 리뷰를 요청하거나 PR을 검토할 때 사용합니다.
disable-model-invocation: true
---
```

```markdown
# 코드 리뷰

변경된 파일을 아래 기준으로 리뷰하고, 발견된 이슈를 심각도별로 정리하세요.

## 리뷰 기준

1. **정확성**: 요구사항을 올바르게 구현했는가?
2. **보안**: SQL Injection, XSS, 하드코딩된 시크릿 등 보안 취약점이 없는가?
3. **일관성**: 프로젝트의 기존 코딩 컨벤션과 일치하는가?
4. **에러 처리**: 예외 상황, null 체크, 경계값이 적절히 처리되었는가?

## 출력 형식

### 심각 (즉시 수정 필요)
- 파일명:라인번호 — 이슈 설명

### 권장 (개선 권장)
- 파일명:라인번호 — 이슈 설명

### 제안 (선택적 개선)
- 파일명:라인번호 — 이슈 설명

이슈가 없으면 "리뷰 완료: 이슈 없음"으로 마무리합니다.

상세 체크리스트는 checklist.md를 참조하세요.
```

**(3) 프론트매터 핵심 필드 설명**

| 필드 | 값 | 설명 |
| --- | --- | --- |
| name | code-review | 스킬 이름. /code-review로 호출할 때 사용 |
| description | 변경된 코드를... | AI가 이 스킬을 자동 적용할지 판단하는 기준. 용도와 사용 시기를 명확히 기술 |
| disable-model-invocation | true | AI가 자동으로 실행하지 않고, 개발자가 /code-review를 입력할 때만 동작 (환경에 따라 동작 방식은 다를 수 있음) |

disable-model-invocation을 true로 설정한 이유는 코드 리뷰처럼 개발자가 타이밍을 직접 결정해야 하는 작업에서 AI가 임의로 실행하는 것을 방지하기 위함입니다. 반대로, API 규칙이나 코딩 스타일처럼 항상 참고될 수 있는 지식형 스킬은 이 옵션을 생략할 수 있으며, 자동 적용 여부는 모델의 판단에 따라 달라질 수 있습니다.

**(4) 호출 방법**

| 도구 | 호출 방식 |
| --- | --- |
| Claude Code (터미널) | /code-review |
| Cursor (Chat/Agent) | /code-review |

두 도구 모두 /스킬명으로 동일하게 호출합니다.

이처럼 Skills는 한 번 작성하면 팀 전체가 /code-review 한 줄로 동일한 기준의 코드 리뷰를 수행할 수 있습니다. 리뷰 기준이 변경되면 SKILL.md만 수정하면 되므로, 팀의 리뷰 품질을 코드(파일)로 관리할 수 있다는 것이 Skills의 핵심 가치입니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — Claude Code에 내장 `/code-review`가 생겨, 실습 스킬 이름 `code-review`가 내장 명령을 덮어쓰게 됩니다.

- 확인된 사실: Claude Code에는 브랜치의 변경분을 리뷰하는 내장(bundled) `/code-review`가 있고 `/review`는 그 별칭입니다. `--fix`(지적 사항 적용), `--comment`(PR에 인라인 코멘트) 같은 플래그를 지원합니다. ([Claude Code Docs — Code Review](https://code.claude.com/docs/en/code-review), 2026-10-12 확인)
- 확인된 사실: 사용자 스킬이 내장 명령·번들 스킬과 이름이 같으면 사용자 스킬이 우선하지만 별칭은 대체하지 않습니다. 공식 문서 예시 그대로, 프로젝트 `code-review` 스킬은 `/code-review`를 대체하고 `/review`는 여전히 내장 리뷰를 실행합니다. ([Claude Code Docs — Skills](https://code.claude.com/docs/en/skills), 2026-10-12 확인)
- 확인된 사실: `disable-model-invocation: true`는 Claude Code에서 "사용자만 호출 가능, 설명도 컨텍스트에 로드하지 않음"으로 동작하고, Cursor에서도 "명시적으로 호출할 때만 포함"으로 동작해 실습 프론트매터는 두 도구에서 유효합니다. Cursor의 `/migrate-to-skills`도 현재 문서에 남아 있으며, 슬래시 명령을 `disable-model-invocation: true` 스킬로 변환합니다. ([Claude Code Docs — Skills](https://code.claude.com/docs/en/skills), [Cursor Docs — Agent Skills](https://cursor.com/docs/context/skills), 2026-10-12 확인)
- 해석·전망: 실습대로 따라 하면 동작은 하지만, 수강생이 "내 스킬이 실행된 것인지 내장 리뷰가 실행된 것인지" 헷갈리기 쉽습니다. `/review`로 호출하면 팀 기준이 아니라 내장 기준으로 리뷰된다는 점도 혼란 요인입니다.

교육·실습 관점: 실습 스킬 이름을 `team-review`나 `team-code-review`처럼 내장 명령과 겹치지 않게 바꾸는 것을 권합니다. 오히려 "팀 스킬 `/team-review` vs 내장 `/code-review`"를 같은 diff에 돌려 결과를 비교하는 활동을 추가하면, 하네스와 컨텍스트가 결과를 어떻게 바꾸는지 보여 주는 좋은 예가 됩니다.
:::

> **기존 Cursor Commands에서의 마이그레이션**
>
> Cursor 2.4부터 기존 Commands 체계가 Skills로 전환되었습니다. 내장 /migrate-to-skills 명령을 실행하면 기존 슬래시 명령어가 disable-model-invocation: true 설정의 스킬로 자동 변환되어 기존 호출 방식이 유지됩니다.

> **Skills = 실행 가능한 컨텍스트(Executable Context)**
>
> 설정 파일(.cursorrules, CLAUDE.md)이 AI가 항상 참조하는 "수동적 컨텍스트"라면, Skills는 개발자가 필요한 시점에 호출하거나 에이전트가 자동으로 적용하는 "능동적 컨텍스트"입니다. 둘을 조합하면 규칙 준수(설정 파일)와 작업 표준화(Skills)를 동시에 달성할 수 있습니다.

> **설정 파일이 컨텍스트 엔지니어링의 실체인 이유**
>
> 컨텍스트 엔지니어링은 "AI에게 배경/목표/제약을 체계적으로 전달하는 기술"입니다. .cursorrules, CLAUDE.md, Skills는 이 원칙을 파일 형태로 구현한 것입니다. 매 대화마다 반복 설명하는 대신, 프로젝트 규칙과 워크플로우를 파일로 정의하면 AI가 지속적으로 일관된 컨텍스트를 참조하게 됩니다. 즉, 설정 파일 + Skills = 지속적 컨텍스트(Persistent Context)의 실현 수단입니다.

**MCP, Skills, Rules/CLAUDE.md 비교**

MCP는 여러 AI 도구에서 공통으로 사용되는 오픈 프로토콜이고, Skills와 Rules/CLAUDE.md는 **각 도구의 설정 파일**입니다. 추상화 수준은 다르지만, 실무에서는 함께 조합하여 사용하므로 역할을 비교하면 다음과 같습니다.

| 구분 | MCP | Skills | .cursorrules / CLAUDE.md |
| --- | --- | --- | --- |
| 역할 | 외부 도구 데이터 연결 | 에이전트 새 능력 추가 | 에이전트 행동 규칙 설정 |
| 작동 방식 | 도구 호출(Tool Use) | SKILL.md의 Description 기반 자동 발견 및 실행 | 항상 적용 또는 경로별 적용 (선언적) |
| 예시 | GitHub, Slack, DB 연동 | 배포 자동화, PR 리뷰, 코드 시각화 | 코딩 컨벤션, API 설계 규칙, 커밋 형식 |

즉, MCP가 외부 시스템을 "연결"하는 것이라면, Agent Skills는 에이전트에 새로운 능력을 "설치"하는 것이며, Rules/CLAUDE.md는 에이전트의 행동 규칙을 "설정"하는 것입니다.

#### 같은 모델, 같은 스킬인데 왜 결과가 다를까? — 하네스(Harness)의 역할

Cursor와 Claude Code에 동일한 모델(예: Claude Sonnet)을 연결하고, 같은 프롬프트를 주더라도 결과물이 달라지는 경우가 많습니다. 모델이 같은데 왜 차이가 날까요? 그 핵심 원인이 바로 **하네스(Harness)** 입니다.

하네스는 원래 말에 씌우는 마구를 뜻합니다. 마구는 말이 아무 방향으로나 달리지 못하도록 움직임의 방향과 범위를 통제하는 장비입니다. AI 에이전트에서도 마찬가지로, 하네스는 **모델을 감싸고 있는 실행 환경 — 시스템 프롬프트, 도구 호출 방식, 파일 접근 전략, 컨텍스트 주입 순서 등**을 통칭하는 비유적 표현이며, 공식 표준 용어라기보다는 실무에서 사용하는 개념에 가깝습니다.

같은 말(모델)이라도 어떤 마구(하네스)를 씌우느냐에 따라 움직임이 완전히 달라지듯, 같은 LLM이라도 하네스 설계에 따라 결과물의 품질과 일관성이 크게 달라집니다. 실제로 도구 간 차이 역시 모델 자체보다는 이러한 실행 환경(하네스) 설계의 차이에서 비롯되는 경우가 많습니다.

| 하네스 구성 요소 | Cursor | Claude Code |
| --- | --- | --- |
| **컨텍스트 수집 방식** | 코드베이스 인덱싱 + 사용자가 @파일로 지정 | 프로젝트 전체를 자율 탐색하며 필요한 파일을 스스로 선택 |
| **시스템 프롬프트** | IDE 내장 프롬프트 + .cursorrules | 터미널 에이전트용 프롬프트 + CLAUDE.md |
| **도구 실행** | IDE 내부에서 편집/미리보기 | 터미널에서 셸 명령/파일 편집/테스트 실행까지 자율 수행 |
| **세션 연속성** | 대화 히스토리 기반 | 진행 파일/git 커밋 기반으로 세션 간 상태 복원 |

> 도구별 차이(컨텍스트 관리, AIND 적합성 등)는 사실상 각 도구가 제공하는 **하네스의 차이**입니다. .cursorrules, CLAUDE.md, Skills 같은 설정 파일은 이 하네스를 개발자가 직접 커스터마이징하는 수단이며, 하네스를 얼마나 잘 설계하느냐가 동일 모델에서도 결과물의 품질을 가르는 핵심 변수입니다.

### 레거시 코드 분석 및 리팩토링

프로젝트에서 가장 빈번한 실무 시나리오 중 하나가 기존 레거시 시스템의 분석과 리팩토링입니다. AIND 방식을 적용하면 이 과정을 체계적이고 효율적으로 수행할 수 있습니다.

#### AI 도구를 활용한 레거시 코드 이해 전략

레거시 코드를 처음 접할 때 AI 도구를 활용하면 이해 속도를 크게 높일 수 있습니다. 다만 AI에게 단순히 "이 코드 설명해줘"라고 요청하는 것(AI Coding)과, 체계적으로 분석 맥락을 설계하여 요청하는 것(AIND)은 결과물의 깊이에서 큰 차이가 납니다.

| 분석 활동 | AI Coding 접근 | AIND 접근 |
| --- | --- | --- |
| **코드 요약** | "이 파일 설명해줘" → 함수 단위 설명 | 시스템 목적, 비즈니스 규칙을 먼저 전달한 뒤 "이 모듈의 역할을 비즈니스 흐름 관점에서 분석해줘" |
| **의존관계 분석** | "이 클래스가 뭘 호출하는지 알려줘" | "아키텍처 규칙(계층 구조)을 기준으로 이 모듈의 의존관계가 적절한지 분석해줘" |
| **기술 부채 식별** | "이 코드 문제 있어?" → 표면적 이슈 탐지 | 팀 코딩 표준, 대상 아키텍처를 컨텍스트로 제공 후 "현재 코드와 목표 상태의 gap을 분석해줘" |
| **비즈니스 로직 추출** | "이 함수 뭐 하는 거야?" | "이 코드에 숨어 있는 비즈니스 규칙(할인 정책, 권한 검증 등)을 요구사항 형태로 정리해줘" |

#### 리팩토링 시 범위 한정과 단계적 접근

AI 도구를 활용한 리팩토링에서 가장 중요한 원칙은 "한 번에 모든 것을 바꾸지 않는 것"입니다.

| 원칙 | 설명 | 실천 방법 |
| --- | --- | --- |
| **범위 한정** | 리팩토링 대상을 명확히 한정하여 AI에게 전달. 전체를 한 번에 맡기면 일관성이 떨어짐 | "OrderService 클래스의 calculateDiscount 메서드만 리팩토링해줘. 기존 인터페이스(입출력)는 유지해줘" |
| **단계적 진행** | 큰 변경을 여러 단계로 나누어 진행. 각 단계마다 AI의 결과를 검증한 후 다음 단계 진행 | 1단계: 코드 구조 분석 → 2단계: 인터페이스 정의 → 3단계: 핵심 로직 리팩토링 → 4단계: 테스트 검증 |
| **제약 조건 명시** | 변경하면 안 되는 부분, 유지해야 할 외부 인터페이스, 성능 기준 등을 명확히 전달 | "외부 API 호출 시그니처는 변경 불가. 응답 시간 200ms 이하 유지. 기존 단위 테스트가 모두 통과해야 함" |
| **동작 보전 검증** | 리팩토링 전후로 동일한 동작을 보장하는지 반드시 확인 | 리팩토링 전 기존 테스트 통과 확인 → 리팩토링 수행 → 동일 테스트 재실행 → 신규 엣지 케이스 테스트 추가 |

> **AIND 방식 리팩토링의 핵심**
>
> - AI에게 "이 코드 리팩토링해줘"(AI Coding)가 아니라, "변환 목표, 제약 조건, 유지해야 할 인터페이스"를 명시하고 단계별로 협업하는 것(AIND)이 결과물의 안정성과 품질을 결정합니다.
>
> - 이는 Prompt → Review → Refine 협업 사이클의 전형적인 적용 사례입니다.

### 코드 리뷰 및 품질 검증

AIND에서 개발자는 "코드 작성자"에서 "검토자/판단자"로 역할이 이동합니다. AI가 생성한 코드를 효과적으로 검증하려면 AI 코드의 공통적인 문제 유형을 알고, 체계적인 리뷰 관점을 갖추어야 합니다.

#### AI 생성 코드의 흔한 문제 유형

AI가 생성한 코드는 겉보기에 완벽해 보일 수 있지만, 다음과 같은 유형의 문제를 자주 포함합니다. 개발자는 이 패턴을 숙지하고 의식적으로 검증해야 합니다.

| 문제 유형 | 증상 | 검증 방법 |
| --- | --- | --- |
| **Hallucinated API/라이브러리** | 실제로 존재하지 않는 함수, 클래스, 라이브러리를 자신 있게 사용 | import 문 확인, 공식 문서 대조, 컴파일/실행 테스트로 존재 여부 검증 |
| **불완전한 에러 처리** | Happy Path 중심 구현. 예외 상황, null 처리, 경계값 누락 | "어떤 예외가 발생할 수 있는지 분석해줘" 후속 요청, 엣지 케이스 테스트 |
| **과도한 추상화** | 불필요한 디자인 패턴 적용, 과도한 계층 분리로 코드 복잡도 증가 | 현재 요구사항 대비 필요 이상의 추상화인지 판단. YAGNI 원칙 적용 |
| **컨텍스트 불일치** | 프로젝트의 기존 패턴, 컨벤션과 다른 스타일로 코드 생성 | 기존 코드와의 일관성 확인. 설정 파일(.cursorrules 등)에 규칙 추가 |
| **보안 취약점** | SQL Injection, XSS, 하드코딩된 시크릿 등 보안 이슈 포함 | 보안 체크리스트 기반 검토, AI에게 "이 코드의 보안 취약점 분석해줘" 교차 리뷰 |
| **비효율적 구현** | 성능을 고려하지 않은 N+1 쿼리, 불필요한 반복 연산, 과도한 메모리 사용 | 대량 데이터 시나리오 테스트, 성능 기준 명시 후 AI에게 최적화 요청 |

#### AI 코드 리뷰 체크리스트

AI 생성 코드를 검토할 때 다음 관점에 대해 체계적인 확인이 필요합니다.

| 검토 관점 | 확인 항목 |
| --- | --- |
| **정확성** | - 요구사항을 정확히 구현했는가?<br>- 사용된 API/라이브러리가 실제로 존재하고 올바르게 호출되었는가?<br>- 비즈니스 로직이 도메인 규칙과 일치하는가? |
| **완전성** | - 에러 처리, 경계값, null 체크가 빠짐없이 구현되었는가?<br>- 엣지 케이스(빈 리스트, 최대값 초과, 동시성 등)가 고려되었는가? |
| **일관성** | - 기존 코드베이스의 네이밍 컨벤션, 아키텍처 패턴과 일치하는가?<br>- 프로젝트 설정 파일(.cursorrules, CLAUDE.md)의 규칙을 준수하는가? |
| **보안성** | - 입력 검증이 적절한가? (SQL Injection, XSS 등)<br>- 민감정보가 노출되지 않는가? (API 키, 비밀번호 등)<br>- 인증/인가 로직이 적절한가? |
| **유지보수성** | - 코드가 불필요하게 복잡하지 않은가? (과도한 추상화, 불필요한 패턴)<br>- 적절한 주석과 문서화가 되어 있는가?<br>- 테스트가 작성되어 있고 의미 있는 시나리오를 커버하는가? |

#### AI를 활용한 교차 리뷰

AI가 생성한 코드를 다시 AI에게 리뷰시키는 "교차 리뷰" 방식도 효과적인 품질 검증 방법입니다.

- **생성과 리뷰 분리:** AI에게 코드를 생성시킨 후, 새로운 대화에서 "이 코드를 보안/성능/아키텍처 관점에서 리뷰해줘"라고 요청하면 자기 생성물에 대한 편향 없이 객관적 분석을 받을 수 있습니다.

- **역할 지정 리뷰:** "너는 10년 경력의 시니어 보안 엔지니어야. 이 코드의 보안 취약점을 찾아줘"와 같이 특정 전문가 역할을 부여하면 해당 관점에 집중한 리뷰를 받을 수 있습니다.

- **체크리스트 기반 리뷰:** 위의 리뷰 체크리스트를 AI에게 함께 제공하고 "이 체크리스트의 각 항목에 대해 이 코드를 평가해줘"라고 요청하면 체계적인 리뷰 결과를 얻을 수 있습니다.

> **AI 리뷰의 한계를 인식하라**
>
> - AI 교차 리뷰는 유용한 보조 수단이지만, 최종 판단은 반드시 개발자가 해야 합니다.
>
> - AI는 비즈니스 맥락의 적절성, 조직 내 암묵적 규칙 준수 여부, 실제 운영 환경의 제약 등을 완전히 이해하지 못합니다.
>
> - 개발자의 비판적 검토 역량이 품질의 최후 방어선이라는 원칙은 AI 리뷰를 활용할 때도 동일하게 적용됩니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — '교차 리뷰'가 PR 단위의 관리형 자동 리뷰 제품으로 자리 잡았고, 비용 구조를 이해해야 쓸 수 있게 되었습니다.

- 확인된 사실: GitHub Copilot code review는 Pro·Pro+·Max·Business·Enterprise 플랜에서 제공되며(Free 제외), 리뷰마다 AI Credits를 소모합니다(공식 추정치: Lite 효과 수준에서 $0.05–$1, Balanced에서 $0.25–$5). 프로젝트 전체 컨텍스트를 활용하고, `.github/copilot-instructions.md`와 경로별 instructions를 반영하며, 저장소·조직 ruleset으로 자동 리뷰를 설정할 수 있습니다. ([GitHub Docs — Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review), 2026-10-12 확인)
- 확인된 사실: Anthropic의 관리형 Code Review는 Team·Enterprise 구독에서 research preview로 제공됩니다. 여러 에이전트가 병렬로 문제를 찾고 검증 단계에서 오탐을 거른 뒤 심각도(Important/Nit/Pre-existing)별 인라인 코멘트를 남기며, 체크 결과는 항상 neutral이라 머지를 막지 않습니다. `CLAUDE.md`와 리뷰 전용 `REVIEW.md`로 기준을 조정하고, 비용은 리뷰당 평균 $15–25 수준으로 별도 사용량 크레딧에서 청구됩니다. Zero Data Retention 조직에서는 사용할 수 없습니다. ([Claude Code Docs — Code Review](https://code.claude.com/docs/en/code-review), 2026-10-12 확인)
- 확인된 사실: 직접 워크플로를 관리하려면 Claude Code GitHub Actions(`anthropics/claude-code-action@v1`)를 씁니다. `/install-github-app`으로 설정하고, PR·이슈에서 `@claude`로 호출합니다. `@beta`를 쓰던 워크플로는 v1으로 옮기면서 `direct_prompt`를 `prompt`로 바꾸는 등 입력값을 수정해야 합니다. ([Claude Code Docs — GitHub Actions](https://code.claude.com/docs/en/github-actions), 2026-10-12 확인)
- 해석·전망: 원문의 "생성과 리뷰 분리" 원칙이 제품 차원에서 구현된 셈입니다. 다만 두 제품 모두 승인·차단 권한을 주지 않는 설계라, "최종 판단은 개발자"라는 원문 원칙은 그대로 유효합니다.

교육·실습 관점: 실습에서는 위 체크리스트를 `REVIEW.md`(또는 `.github/copilot-instructions.md`)로 옮겨 자동 리뷰에 반영해 보는 활동이 효과적입니다. 다만 PR마다 비용이 발생하므로 수업용 저장소는 수동 트리거(예: `@claude review`)로 두고, 강사가 사용 한도를 먼저 설정해 두세요.
:::

### 보안 및 기밀성 고려사항

Cursor, Claude Code와 같은 상용 AI Coding 도구를 SI 프로젝트에 도입할 때 반드시 고려해야 할 보안 및 기밀성 이슈를 다룹니다. 도구의 기능적 장점만큼이나 데이터 보호와 법적 리스크에 대한 이해가 AIND 실무 역량의 필수 요소입니다.

#### 소스코드 및 데이터 전송 리스크

상용 AI Coding 도구를 사용하면 코드와 프롬프트가 외부 AI 서비스(클라우드)로 전송됩니다. 이 과정에서 발생할 수 있는 리스크를 이해해야 합니다.

| 리스크 유형 | 설명 | 대응 방안 |
| --- | --- | --- |
| **소스코드 외부 노출** | 프롬프트에 포함된 코드가 AI 서비스 제공자의 서버로 전송됨 | 기업용 플랜(데이터 비학습 보장) 사용, 민감 모듈은 AI 도구 사용 범위에서 제외 |
| **고객 데이터 유출** | 테스트 데이터나 설정 파일에 포함된 실제 고객 정보가 전송될 수 있음 | 실제 데이터 대신 마스킹/더미 데이터 사용, 환경변수로 민감정보 분리 |
| **API Key/인증정보 노출** | 코드 내 하드코딩된 API 키, 비밀번호, 토큰 등이 AI에게 전달됨 | .env 파일 분리 + .gitignore 등록, 설정 파일에 "시크릿 하드코딩 금지" 규칙 명시 |
| **학습 데이터 활용 우려** | 전송된 코드가 AI 모델의 향후 학습 데이터로 사용될 가능성 | 서비스 약관의 데이터 활용 정책 확인, 학습 제외(Opt-out) 옵션 활성화 |

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 개인용 플랜의 학습 정책이 '기본 사용(옵트아웃 필요)' 쪽으로 움직였고, 도구별 정책 차이를 직접 확인해야 합니다.

- 확인된 사실: GitHub은 2026-04-24부터 Copilot Free·Pro·Pro+ 사용자의 상호작용 데이터(입력·출력·코드 조각·파일명·저장소 구조 등)를 사용자가 옵트아웃하지 않는 한 모델 학습에 사용합니다. Business·Enterprise는 대상이 아니며, 예전에 옵트아웃했다면 그 설정이 유지됩니다. ([GitHub Blog — interaction data usage policy](https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/), 2026-10-12 확인)
- 확인된 사실: Anthropic은 소비자 플랜(Free·Pro·Max, Claude Code 포함)에서 학습 사용 여부를 사용자가 선택하게 하며, 허용 시 5년, 비허용 시 30일 보관합니다. Team·Enterprise·API 같은 상업 약관 사용자는 별도로 동의하지 않는 한 학습에 쓰지 않고 기본 30일 보관이며, Zero Data Retention은 자격을 갖춘 Claude for Enterprise 조직에 개별 적용됩니다. 또 Claude Code는 세션 기록을 로컬 `~/.claude/projects/`에 평문으로 기본 30일 보관합니다. ([Claude Code Docs — Data usage](https://code.claude.com/docs/en/data-usage), 2026-10-12 확인)
- 확인된 사실: Cursor는 Privacy Mode가 켜져 있으면 고객 데이터를 학습에 쓰지 않고 모든 모델 제공자와 ZDR 계약을 유지한다고 밝히며, 꺼져 있으면 코드베이스 데이터·프롬프트 등을 저장·학습에 사용할 수 있다고 명시합니다. 팀원은 팀의 Privacy Mode 설정을 상속합니다. ([Cursor — Data Use](https://cursor.com/data-use), [Cursor — Security](https://cursor.com/security), 2026-10-12 확인)
- 확인하지 못한 것: Cursor 개인 플랜의 Privacy Mode 기본값, SpaceX 인수 이후 Cursor 데이터 정책의 변경 여부는 공식 페이지에서 확인하지 못했습니다.
- 해석·전망: "기업용 플랜이면 비학습"이라는 원문 대응은 대체로 맞지만, 개인 계정을 쓰는 순간 기본값이 학습 허용일 수 있는 도구가 늘었습니다. SI 현장에서 개인 계정 사용을 막아야 하는 이유가 더 분명해졌습니다.

교육·실습 관점: 표의 "학습 제외(Opt-out) 옵션 활성화"를 실습 체크리스트로 바꿔, 수강생이 각자 쓰는 도구의 개인정보 설정 화면을 직접 열어 현재 상태를 확인하게 하세요. 또한 로컬에 남는 세션 기록(Claude Code의 `~/.claude/projects/` 등)도 고객 코드가 담긴 산출물로 보고 보관·삭제 규칙에 포함해야 합니다.
:::

**(1) 민감 파일 접근 제어 (Ignore / Deny 설정)**

위 리스크에 대한 기술적 1차 방어선으로, AI 도구가 민감 파일을 자동으로 읽거나 참조하지 못하도록 설정하는 방법이 있습니다. 도구별로 제공하는 접근 제어 메커니즘이 다르므로 차이를 이해하고 적절히 조합해야 합니다.

| 구분 | .claudeignore | settings.json permissions.deny | .cursorignore |
| --- | --- | --- | --- |
| **도구** | Claude Code | Claude Code | Cursor |
| **위치** | 프로젝트 루트 (/.claudeignore) | ~/.claude/settings.json 또는 프로젝트 .claude/settings.json | 프로젝트 루트 (/.cursorignore) |
| **문법** | .gitignore와 동일한 글로브 패턴 | JSON 배열로 "도구(패턴)" 형태 지정 | .gitignore와 동일한 글로브 패턴 |
| **차단 수준** | 소프트 차단 — AI의 자동 탐색/인덱싱에서 제외 | 하드 차단 — 해당 도구의 실행 자체를 차단 (우회 불가) | 소프트 차단 — AI의 인덱싱 및 컨텍스트 참조에서 제외 |
| **우회 가능성** | 사용자가 명시적으로 파일을 지정하면 읽을 수 있음 | 우회 불가. 설정된 패턴에 대해 도구 실행이 거부됨 | 사용자가 직접 파일을 열어 참조하면 읽을 수 있음 |
| **권장 용도** | 테스트 데이터, 빌드 산출물 등 탐색 불필요 파일 제외 | .env, secrets, 인증정보 등 절대 읽으면 안 되는 파일 차단 | 민감 설정 파일, 고객 데이터 디렉토리 등 인덱싱 제외 |

**(2) permissions.deny 실전 설정 예시**

| 패턴 | 차단 대상 | 효과 |
| --- | --- | --- |
| Read(.env) | .env 파일 | AI가 환경변수 파일을 읽는 것 자체를 차단 |
| Read(.env.*) | .env.local, .env.production 등 | 모든 환경별 설정 파일 읽기 차단 |
| Read(secrets/**) | secrets 디렉토리 전체 | 인증서, 키 파일 등 민감 디렉토리 전체 읽기 차단 |
| Bash(curl *) | curl 명령 실행 | AI가 외부 서버로 데이터를 전송하는 것을 차단 |

> **.claudeignore + permissions.deny 이중 방어 권장**
>
> .claudeignore는 AI가 자동으로 파일을 찾아 읽는 것을 방지하고, permissions.deny는 어떤 경우에도 해당 파일에 접근하지 못하도록 강제합니다. 민감 파일에는 두 설정을 모두 적용하는 이중 방어가 권장됩니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — `.claudeignore`는 공식 문서에서 확인되지 않는 설정이므로, 민감 파일 차단은 `permissions.deny`와 hooks 중심으로 다시 구성해야 합니다.

- 확인된 사실: Claude Code 공식 Settings 문서는 `.env` 읽기를 막는 예로 `~/.claude/settings.json`의 `permissions.deny`에 `Read(./.env)`, `Read(./.env.*)`를 추가하는 방법을 제시합니다(원문 표의 `Read(.env)`와 달리 `./` 접두가 붙은 형태). ([Claude Code Docs — Settings](https://code.claude.com/docs/en/settings), 2026-10-12 확인)
- 확인된 사실: 공식 Memory 문서는 `CLAUDE.md`가 강제 설정이 아닌 컨텍스트이며, 반드시 막아야 하는 동작은 PreToolUse hook으로 차단하라고 안내합니다. ([Claude Code Docs — Memory](https://code.claude.com/docs/en/memory), 2026-10-12 확인)
- 확인된 사실: Cursor의 `.cursorignore`는 Agent·Tab·Inline Edit·@mention에서 파일 접근을 막지만, 공식 문서는 Agent가 쓰는 터미널과 MCP 서버 도구는 `.cursorignore` 대상 파일 접근을 막지 못하며 완전한 보호는 보장되지 않는다고 명시합니다. ([Cursor Docs — Ignore files](https://cursor.com/docs/context/ignore-files), 2026-10-12 확인)
- 확인하지 못한 것: 원문 표의 `.claudeignore`는 이번에 열어 본 Claude Code 공식 문서(Settings, Memory, Skills)에서 전혀 언급되지 않았습니다. 공식 기능으로 동작한다는 근거를 찾지 못했으므로 보안 통제로 의존하지 않는 것이 안전합니다.
- 해석·전망: `Bash(curl *)` 같은 명령 단위 차단은 `wget`이나 스크립트 실행 등 다른 경로로 우회될 여지가 있다고 봅니다. "우회 불가"는 해당 패턴과 일치하는 도구 호출에 한정된 이야기로 이해하는 편이 정확합니다.

교육·실습 관점: 실습은 "`.claudeignore` + `permissions.deny`" 이중 방어 대신 "`permissions.deny`(읽기 차단) + hooks(강제 차단) + 비밀값을 애초에 저장소·작업 디렉토리 밖(시크릿 매니저 등)에 두기" 조합으로 고쳐 쓰는 것을 권합니다. Cursor 실습에서는 `.cursorignore`만으로는 터미널 접근을 막지 못한다는 점을 반드시 함께 설명하세요.
:::

#### AI 생성 코드의 라이선스 및 저작권

AI가 생성한 코드의 법적 지위는 아직 명확하게 확립되지 않은 영역이 있으며, 실무에서 인지해야 할 주요 이슈는 다음과 같습니다.

- **저작권 귀속 불명확:** AI가 생성한 코드가 저작권법상 보호받는 저작물인지, 저작권이 누구에게 귀속되는지에 대해 국가별로 해석이 다르며 판례가 축적되는 중입니다.

- **오픈소스 라이선스 위반 리스크:** AI 모델이 학습한 오픈소스 코드와 유사한 코드를 생성할 가능성이 있으며, GPL 등 강한 카피레프트 라이선스의 코드가 포함될 경우 라이선스 위반 리스크가 존재합니다.

- **실무 대응:** AI 생성 코드를 그대로 사용하기보다 개발자가 충분히 검토하고 수정하여 자체 저작물로서의 독창성을 확보하는 것이 권장됩니다. 또한 프로젝트 차원에서 AI 생성 코드 사용에 대한 가이드라인을 수립해야 합니다.

#### SI 프로젝트에서의 AI 도구 사용 가이드라인

AIND를 SI 프로젝트에 적용할 때 수립해야 할 보안 가이드라인의 주요 항목은 다음과 같습니다.

| 검토 관점 | 확인 항목 |
| --- | --- |
| **허용 도구 및 플랜 지정** | 프로젝트에서 사용 가능한 AI 도구와 플랜(기업용)을 명시하고, 개인용 플랜/무료 도구 사용을 제한 |
| **AI 도구 사용 범위 정의** | AI 도구에 입력 가능한 코드/데이터의 범위와 제외 대상(보안 모듈, 인증 로직, 고객 데이터 등)을 명확히 정의 |
| **민감정보 처리 규칙** | API 키, 인증 토큰, 고객 데이터 등 민감정보가 AI 도구에 전달되지 않도록 하는 구체적 방법(환경변수 분리, 데이터 마스킹 등) 규정 |
| **코드 리뷰 의무화** | AI 생성 코드에 대해 반드시 인간 개발자의 리뷰를 거친 후 커밋하도록 프로세스 규정 |
| **라이선스 검증** | AI 생성 코드의 오픈소스 라이선스 위반 여부를 검증하는 절차(라이선스 스캐닝 도구 활용 등) 포함 |

## 한눈에 정리하는 이번 챕터

- AIND는 AI를 개발 전주기의 협업 파트너로 삼는 패러다임이다. 코드 작성 보조 도구인 AI Coding과 구분된다.

- AI Coding 도구(Cursor 등)도 코드 레벨 맥락은 유지한다. AIND의 차이는 비즈니스 도메인 지식/설계 의도/품질 기준까지 AI와 공유하는 것이다. 도구가 아니라 활용 방식이 AI Coding과 AIND를 가른다.

- 컨텍스트 엔지니어링은 AI에게 배경/목표/제약을 체계적으로 전달하는 기술로, AIND의 핵심 역량이다.

- AIND의 협업 사이클은 Prompt → Review → Refine의 반복이다. 이 반복이 결과물 품질을 점진적으로 높인다.

- AIND에서 개발자는 설계자/검토자 역할로 이동한다. 코드를 직접 쓰는 것보다 맥락을 설계하고 결과를 판단하는 역량이 중요해진다.

- AIND는 개발자만의 방법론이 아니라 분석/설계자 포함 전 직군이 AI와 협업하는 방식으로 확장된다.

- AI Coding 도구(Cursor, Claude Code, GitHub Copilot)는 각각 다른 강점을 가진다. 프로젝트 특성과 팀 역량에 맞는 도구를 선택하되, AIND 적용 용이성을 고려해야 한다.

- .cursorrules와 CLAUDE.md 등 프로젝트 설정 파일은 컨텍스트 엔지니어링을 파일로 구현한 것이다. 코딩 규칙, 아키텍처 원칙, 도메인 규칙을 정의하여 AI의 일관된 결과물 생성을 유도한다.

- 레거시 코드 분석 및 리팩토링에 AIND를 적용할 때는 범위 한정, 단계적 진행, 제약 조건 명시, 동작 보전 검증의 4가지 원칙을 따른다.

- AI가 생성한 코드는 Hallucinated API, 불완전한 에러 처리, 보안 취약점 등의 문제를 포함할 수 있다. 정확성/완전성/일관성/보안성/유지보수성 관점의 체계적 검토가 필수이다.

- SI 프로젝트에서 AI 도구 사용 시 소스코드/고객 데이터의 외부 전송 리스크, 기업용 플랜의 데이터 정책, AI 생성 코드의 라이선스 이슈를 반드시 고려해야 한다.

## 2026년 하반기 업데이트 참고자료 (2026-10-12 확인)

- [Cursor Docs — Rules](https://cursor.com/docs/context/rules) — `.cursor/rules/*.mdc`, 규칙 유형, AGENTS.md 지원, Team Rules
- [Cursor Docs — Agent Skills](https://cursor.com/docs/context/skills) — 스킬 디렉토리(`.agents/skills`, `.claude/skills` 호환), frontmatter, `/migrate-to-skills`
- [Cursor Docs — Ignore files](https://cursor.com/docs/context/ignore-files) — `.cursorignore` 적용 범위와 터미널·MCP 한계
- [Cursor Pricing](https://cursor.com/pricing) — 현재 요금제 구성
- [Cursor — Data Use](https://cursor.com/data-use) / [Cursor — Security](https://cursor.com/security) — Privacy Mode와 학습·ZDR 정책
- [The Next Web — SpaceX closes Cursor deal](https://thenextweb.com/news/spacex-cursor-acquisition-completed-gpu-fleet) — Cursor 인수 완료(2026-08-14)
- [Claude Code Docs — Skills](https://code.claude.com/docs/en/skills) — commands→skills 통합, 경로·우선순위, frontmatter, 내장 명령과 이름 충돌
- [Claude Code Docs — Memory](https://code.claude.com/docs/en/memory) — CLAUDE.md 위치, `.claude/rules/`, AGENTS.md 읽기, auto memory, hooks 권고
- [Claude Code Docs — Settings](https://code.claude.com/docs/en/settings) — `permissions.deny` 예시
- [Claude Code Docs — Code Review](https://code.claude.com/docs/en/code-review) — 관리형 Code Review, REVIEW.md, 비용, 내장 `/code-review`
- [Claude Code Docs — GitHub Actions](https://code.claude.com/docs/en/github-actions) — `claude-code-action@v1`, beta→v1 마이그레이션
- [Claude Code Docs — Data usage](https://code.claude.com/docs/en/data-usage) — 학습·보관 정책, 로컬 세션 기록
- [agentskills.io](https://agentskills.io) — Agent Skills 표준과 지원 도구 목록
- [agents.md](https://agents.md) — AGENTS.md 관리 주체(Agentic AI Foundation)와 채택 규모
- [OpenAI — Agentic AI Foundation](https://openai.com/blog/agentic-ai-foundation) — AAIF 출범(검색 결과로만 확인)
- [GitHub Docs — Repository custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) — copilot-instructions.md, AGENTS.md·CLAUDE.md·GEMINI.md 지원, cloud agent 명칭
- [GitHub Docs — Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review) — 제공 플랜, AI Credits 소모, 자동 리뷰
- [GitHub Changelog — usage-based billing](https://github.blog/changelog/2026/04/27/github-copilot-is-moving-to-usage-based-billing/) — AI Credits 전환과 플랜 가격
- [GitHub Copilot Plans](https://github.com/features/copilot/plans) — 현재 플랜 구성(Max 포함)
- [GitHub Changelog — Copilot coding agent GA](https://github.blog/changelog/2025-09-25-copilot-coding-agent-is-now-generally-available/) — coding agent GA(검색 결과로만 확인)
- [GitHub Blog — interaction data usage policy](https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/) — Free/Pro/Pro+ 학습 정책 변경
- [Google Developers Blog — Gemini CLI to Antigravity CLI](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) — Gemini CLI 개인용 서비스 중단
- [AWS 블로그 — Amazon Q Developer 지원 종료](https://aws.amazon.com/jp/blogs/news/amazon-q-developer-end-of-support-announcement/) — 일정과 Kiro 전환
- [Kiro Pricing](https://kiro.dev/pricing/) / [Kiro Docs — Steering](https://kiro.dev/docs/steering/) — 요금제, steering·AGENTS.md(steering은 검색 결과로만 확인)
- [Codex Pricing](https://learn.chatgpt.com/docs/pricing) — Codex 포함 플랜과 사용 환경
- [Windsurf is now Devin Desktop](https://devin.ai/blog/windsurf-is-now-devin-desktop) — Windsurf 리브랜딩(검색 결과로만 확인, windsurf.com 리다이렉트는 직접 확인)
- [JetBrains — Junie CLI beta](https://blog.jetbrains.com/junie/2026/03/junie-cli-the-llm-agnostic-coding-agent-is-now-in-beta/) — Junie CLI(검색 결과로만 확인)
- [Devin Desktop FAQ](https://docs.devin.ai/desktop/devin-desktop-faq) — Windsurf → Devin Desktop(2026-06-02), Cascade → Devin Local, 기존 Cascade는 7월까지 제공
