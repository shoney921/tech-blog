---
title: "Chapter 7. RX (Robotic Transformation) 이해"
date: 2026-04-30T10:00:00
---

# Chapter 7. RX (Robotic Transformation) 이해

::: info 2026년 하반기 업데이트 안내 · 2026-10-12 기준
이 글은 2026년 상반기에 작성한 원문을 그대로 두고, 바뀐 내용을 각 섹션 아래 '2026년 하반기 업데이트' 박스로 덧붙였습니다. 핵심 변화:
- 화면 조작형 에이전트는 정리되는 중입니다. OpenAI Operator는 2025년 8월 종료됐고, 이를 흡수했던 ChatGPT agent도 2026년 8월 사라졌으며, Google Project Mariner는 2026년 5월 종료됐습니다. UiPath는 코딩 에이전트를 엮는 오케스트레이션(Maestro Flow)으로 방향을 틀었습니다.
- 로보택시는 "확장 단계"에 들어섰습니다. Waymo는 2026년 9월 기준 미국 14개 도시에서 완전 무인 운행 중이고, Tesla는 2026년 2분기(Q2)에 Cybercab 생산을 시작했다고 공시했습니다. Cruise는 원문의 "서비스 축소"가 아니라 2024년 12월에 로보택시 사업 자체를 접었습니다.
- 휴머노이드는 "발표·시범"과 "실제 출하"의 간극이 여전히 큽니다. Tesla Optimus는 2026년 Q2 기준 아직 정식 생산 전, 1X NEO는 2026-10 기준 고객 인도가 공식 확인되지 않았습니다. 반면 Unitree는 2025년 5,500대 이상 출하를 공시하고 상장했고, Agility는 9개 고객 현장 운영 실적을 공개했습니다.
- 로봇 파운데이션 모델은 세대가 바뀌었습니다. Gemini Robotics 2(2026-07), NVIDIA Isaac GR00T N1.6/N1.7, Physical Intelligence π0.7(2026-04), Figure Helix 02가 현재 기준점입니다.
- 표준·규제: ISO 10218은 2025년 개정판에서 ISO/TS 15066 내용을 흡수했고, 휴머노이드·사족보행용 ISO 25785-1은 아직 위원회 초안(CD) 단계입니다. EU AI Act 고위험 의무는 Digital Omnibus로 연기됐습니다.
- 한국: K-휴머노이드 연합 출범은 원문의 2024년이 아니라 2025년 4월 10일이고, 소관 부처 이름은 2025년 10월부터 산업통상부입니다. 국토교통부가 2026년 7월 레벨4 무인차 안전운행 가이드라인을 내놨습니다.
:::

## 들어가며 — DX, AX, 그리고 RX

### 왜 지금 RX인가?

지난 10여 년간 산업의 흐름을 가장 잘 설명하는 키워드는 세 글자였습니다.

- **DX (Digital Transformation)** : 종이/대면 업무를 디지털·클라우드 기반으로 옮기는 변화
- **AX (AI Transformation)** : 디지털화된 데이터 위에 AI를 얹어 의사결정·생성 작업을 자동화하는 변화
- **RX (Robotic Transformation)** : AI가 **물리 세계와 직접 상호작용**하기 시작하면서 일어나는 변화

DX는 데이터를 디지털로 옮겼고, AX는 그 데이터로 AI가 추론하게 했다면, RX는 그 AI가 **소프트웨어 안의 작업, 더 나아가 물리 세계의 작업까지 직접 수행**하는 단계입니다.

> **RX는 왜 2026년에 본격적으로 회자되는가?**
>
> 2024–2025년을 거치며 ① LLM이 멀티모달·도구 사용 능력을 갖추게 되었고, ② 로봇용 파운데이션 모델(VLA)이 의미 있는 일반화 성능을 보였으며, ③ 휴머노이드 로봇 양산 시도가 본격화되었습니다. 세 가지가 한 시기에 맞물리며 "AI가 화면 안에서 나와 손을 움직이기 시작한 시기"가 2026년이라는 평가가 나옵니다.

### 이 글의 목적

RX는 한 분야가 아닙니다. RPA, 자율주행, 협동 로봇, 휴머노이드, VLA 모델 등 출신이 다른 기술들이 한 우산 아래 모여 있어 비전공자가 입문하면 길을 잃기 쉽습니다.

이 글의 목적은 RX의 **전체 지도를 한 번에 보여주고**, 각 영역의 **핵심 키워드와 특징**을 짚어주는 것입니다. 깊이 있는 기술 해설이 아니라, "이 단어가 나오면 어떤 기술 영역인지"를 빠르게 매칭할 수 있도록 돕는 가이드라고 보시면 됩니다.

---

## RX의 정의와 범위

### RX란 무엇인가

> **RX (Robotic Transformation)**
>
> AI와 로봇 기술을 활용하여 **사람이 수행하던 작업을 자동화·자율화**하고, 이를 통해 업무·조직·산업의 운영 방식을 근본적으로 전환하는 변화.
>
> 작업 대상은 **소프트웨어 작업(화면 클릭·문서 처리)** 부터 **물리적 작업(이동·조작)** 까지 모두 포함됩니다.

RX는 종종 "로봇 도입"이라는 좁은 의미로 오해되지만, 실제로는 두 갈래로 봐야 합니다.

| 구분 | 대상 | 주요 키워드 |
| --- | --- | --- |
| **소프트웨어 RX** | 화면 안의 작업 (서류, 시스템 조작) | RPA, 하이퍼오토메이션, Agentic Automation, AI Agent |
| **피지컬 RX** | 물리 세계의 작업 (이동, 조작, 인지) | 산업용/협동/서비스 로봇, 자율주행, 드론, 휴머노이드, VLA |

### DX·AX·RX의 관계

세 개념은 단계가 아니라 **층(Layer)** 으로 보는 것이 정확합니다.

- **DX 없이는 AX가 어렵습니다.** 데이터가 디지털화되어 있어야 AI가 학습·추론할 수 있습니다.
- **AX 없이는 RX가 어렵습니다.** 로봇이 환경을 인식하고 판단하는 능력은 AI에서 옵니다.
- 즉, RX는 **DX(데이터) + AX(지능) 위에 "행동(Action)"이 더해진** 형태입니다.

> 한 번 정리하면: **DX는 디지털, AX는 지능, RX는 행동.** AI가 답을 "말하던" 시대에서 "직접 수행하는" 시대로의 전환이 RX의 본질입니다.

---

## 소프트웨어 RX — 화면 안에서 일어나는 자동화

물리 로봇 이야기를 하기 전에, 먼저 짚어야 할 것이 화이트칼라 업무를 자동화하는 **소프트웨어 로봇** 영역입니다. 한국 기업의 RX 추진 과제 중 절반 이상이 이 영역에 해당합니다.

### RPA (Robotic Process Automation)

> **RPA**
>
> 사람이 컴퓨터에서 수행하는 **반복적인 화면 조작 작업(클릭, 입력, 복사·붙여넣기, 화면 전환 등)** 을 소프트웨어 로봇이 대신 수행하도록 하는 기술.

#### 특징

- 기존 시스템(ERP, 그룹웨어, 엑셀 등)을 **수정하지 않고** 위에 올라타서 작동
- 정해진 규칙(Rule-based)에 따라 동작 — AI 없이도 운영 가능
- 도입이 비교적 쉬워 한국 대기업의 백오피스(인사·재무·구매)에 광범위하게 적용됨

#### 주요 키워드 / 플레이어

- **글로벌**: UiPath, Automation Anywhere, Microsoft Power Automate, Blue Prism, SAP Build Process Automation
- **국내**: 삼성SDS Brity RPA, LG CNS RPA Automate, 그리드원
- **운영 방식**:
  - **Attended Bot** : 사용자가 옆에서 트리거(예: 한 클릭으로 양식 채우기)
  - **Unattended Bot** : 서버에서 무인으로 동작(야간 배치 작업 등)

### Hyperautomation (하이퍼오토메이션)

> **Hyperautomation**
>
> RPA + AI/OCR/Process Mining + 워크플로우 등을 결합해 **단순 화면 조작을 넘어 의사결정과 비정형 업무까지 자동화**하는 접근.

#### 키워드

- **OCR / IDP (Intelligent Document Processing)** : 종이·PDF 인식 후 데이터화
- **Process Mining** : 실제 업무 로그를 분석해 자동화 대상 발굴 (Celonis가 대표)
- **Decision Automation** : 룰 엔진 + ML로 의사결정 자동화

### Agentic Automation — 2026년 가장 큰 변화

2025년부터 RPA 시장의 패러다임이 빠르게 바뀌고 있습니다. **AI Agent가 RPA를 흡수**하는 흐름입니다.

> **Agentic Automation**
>
> 정해진 시나리오대로만 움직이던 RPA 봇이, **LLM 기반 AI Agent로 업그레이드되어 스스로 판단하며 업무를 수행**하는 형태.

#### 기존 RPA 와의 차이

| 비교 항목 | 전통 RPA | Agentic Automation |
| --- | --- | --- |
| 동작 방식 | 사전 정의된 규칙 그대로 실행 | 목표를 받고 스스로 단계 계획·수행 |
| 화면 변화 대응 | 화면 위치/구조가 바뀌면 깨짐 | LLM이 화면을 "이해"하므로 변화에 강함 |
| 비정형 입력 | 처리 어려움 (룰 추가 필요) | 자연어·이미지 등 비정형 입력 가능 |
| 예외 처리 | 사람 개입 필요 | 일부 예외는 스스로 우회·해결 |

#### 주요 키워드

- **Computer Use / Browser Use** : Anthropic Claude Computer Use, OpenAI Operator, Google Mariner — AI가 사람처럼 화면을 보고 마우스/키보드를 조작
- **Agentic RPA Platform** : UiPath Agentic Automation, Automation Anywhere AI Agent Studio
- **Agentic Workflow** : LangGraph, n8n, Make, Zapier Agents 등 워크플로우 도구의 에이전트화
- **MCP (Model Context Protocol)** : AI 에이전트가 다양한 시스템·도구에 표준 방식으로 접속

> **실무자가 알아야 할 흐름**: "RPA = 시키는 대로만 하는 봇" → "AI Agent = 목표만 주면 알아서 하는 봇"으로의 전환. 다만 책임 추적성·감사(Audit)가 약해지는 단점이 있어, 두 방식이 한동안 공존할 가능성이 높습니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 원문에 예시로 든 "화면을 보고 조작하는 에이전트" 제품 두 개가 사라졌고, 무게중심이 오케스트레이션·코딩 에이전트 쪽으로 옮겨 갔습니다.

- 확인된 사실: OpenAI Operator는 2025년 7월 ChatGPT agent로 기능이 합쳐진 뒤 2025년 8월 31일 접속이 종료됐습니다. 원문 작성 시점에 이미 단독 제품이 아니었던 셈입니다. ([Wikipedia - OpenAI Operator](https://en.wikipedia.org/wiki/OpenAI_Operator), 검색 결과로만 확인)
- 확인된 사실: 그 ChatGPT agent(Agent Mode)도 2026년 8월 초 ChatGPT에서 제거됐고, OpenAI는 "ChatGPT Work"(별도 클라우드 브라우저 포함)를 대신 쓰라고 안내했습니다. 사전 공지 없는 제거라 사용자 반발이 있었습니다. ([OpenAI Developer Community 스레드, 2026-08-08](https://community.openai.com/t/agent-mode-was-removed-with-no-real-replacement/1389601), 2026-10-12 확인)
- 확인된 사실: Google Project Mariner는 2026년 5월 4일 종료됐고, 기능은 Gemini Agent와 Chrome의 auto-browse로 흡수됐습니다. ([Android Headlines](https://www.androidheadlines.com/2026/05/google-shuts-down-project-mariner-ai-agent.html), 2026-10-12 확인)
- 확인된 사실: UiPath는 2026년 8월 19일 Maestro Flow를 발표했습니다. Claude Code·Cursor·GitHub Copilot·Codex 같은 코딩 에이전트로 프로세스를 설계하고, 에이전트·RPA 로봇·API·사람을 한 흐름에서 실행·감사하는 오케스트레이션 도구입니다. UiPath CPTO의 말이 상징적입니다 — "기업에는 에이전트 문제가 아니라 오케스트레이션 문제가 있다." ([UiPath Newsroom](https://www.uipath.com/newsroom/uipath-launches-maestro-flow), 2026-10-12 확인)
- 해석·전망: "RPA를 에이전트가 대체한다"보다 "에이전트·RPA·사람을 누가 감사 가능하게 엮느냐"로 경쟁 축이 이동했다고 보는 게 지금은 더 정확해 보입니다. 원문의 "두 방식이 한동안 공존"이라는 예측은 오히려 더 강해졌습니다.
- 확인하지 못한 것: Anthropic Claude Computer Use, Automation Anywhere AI Agent Studio의 2026년 하반기 현황은 이번에 별도로 확인하지 않았습니다.

교육·실습 관점: 실습 교재에 특정 제품명(Operator, Mariner)을 박아 두면 금방 낡습니다. "브라우저 조작 에이전트 → 코딩·API 기반 에이전트 → 오케스트레이션 계층"이라는 구조로 가르치고, 실습은 API로 접근 가능한 도구(예: 각 모델사의 computer use API나 오픈소스 브라우저 자동화)로 구성하는 편이 안전합니다. 소비자용 에이전트 기능은 예고 없이 없어질 수 있다는 점도 꼭 짚어 주세요.
:::

---

## 피지컬 RX — 물리 세계의 자동화

이제 진짜 "로봇" 이야기로 넘어갑니다. 피지컬 RX는 형태와 용도에 따라 분류하는 것이 가장 실용적입니다.

### 분류 한눈에 보기

| 분류 | 핵심 특징 | 대표 키워드 |
| --- | --- | --- |
| 산업용 로봇 | 고정 설치, 고하중·고속도, 펜스 안에서 작업 | ABB, KUKA, FANUC, Yaskawa |
| 협동 로봇 (Cobot) | 사람과 같은 공간에서 안전하게 작업 | Universal Robots, 두산로보틱스, 한화로보틱스 |
| 서비스 로봇 | 일상·매장·병원 환경에서 사람과 상호작용 | LG CLOi, 베어로보틱스, 푸두 |
| 모바일 로봇 (AGV/AMR) | 자율적으로 공간을 이동하며 운반 | Amazon Kiva, Geek+, 로보티즈 |
| 자율주행차 | 도로 환경에서 자율 운전 | Waymo, Tesla FSD, 모셔널 |
| 드론 (UAV) | 공중 이동·촬영·운반 | DJI, Skydio, 군용 드론 |
| 휴머노이드 | 사람 형태의 범용 로봇 | Tesla Optimus, Figure, 1X, Unitree |
| 사족보행/특수형 | 4족 보행, 점검·순찰·구조 | Boston Dynamics Spot, Unitree Go |

### 산업용 로봇 (Industrial Robot)

공장 자동화의 가장 오래된 형태입니다. 용접·도장·조립·운반 등을 정해진 좌표에서 정밀하게 반복 수행합니다.

- **4대 메이커** : ABB(스위스), KUKA(독일), FANUC(일본), Yaskawa(일본)
- **국내** : 현대로보틱스, 두산로보틱스
- **특징** : 고속·고하중, 안전 펜스 필수, 가격대가 높음. 자동차·반도체·디스플레이 산업이 핵심 수요처.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — IFR 「World Robotics 2026」이 나와 2025년 실적 숫자가 새로 생겼습니다.

- 확인된 사실: 2026년 9월 24일 IFR 발표에 따르면 전 세계 공장에서 가동 중인 산업용 로봇은 2025년 500만 대(전년 대비 +9%), 2025년 신규 설치는 60만 대 이상(+11%)입니다. ([IFR 보도자료](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally), 2026-10-12 확인)
- 확인된 사실: 중국이 35.4만 대(+20%, 전 세계의 59%)로 압도적 1위이고 중국 내 시장의 55%를 중국 업체가 가져갔습니다. 미국이 약 3.85만 대로 일본(36,219대, -19%)을 제치고 2위, 한국은 약 3만 대(-1%)로 4위를 유지했습니다. (같은 출처)
- 확인된 사실: IFR은 2026년 설치량을 65.5만 대, 2029년 80.6만 대로 전망합니다. 이건 전망치입니다. (같은 출처)
- 해석·전망: 원문의 "4대 메이커(ABB·KUKA·FANUC·Yaskawa)" 구도는 여전히 글로벌 기준으로 유효하지만, 최대 시장인 중국에서 자국 업체 비중이 절반을 넘었다는 점은 함께 알려 줄 필요가 있습니다.

교육·실습 관점: "한국은 로봇 밀도 세계 최상위"라는 익숙한 문장만 쓰지 말고, 신규 설치량은 정체(-1%)라는 숫자도 같이 보여 주면 토론거리가 됩니다. 수치는 매년 9월 IFR 발표 때 갱신하세요.
:::

### 협동 로봇 (Cobot, Collaborative Robot)

> **협동 로봇**
>
> 사람과 같은 작업 공간에서 **안전 펜스 없이 함께 일할 수 있도록 설계**된 로봇. 충돌 감지·힘 제어·저속 동작 등 안전 기능이 핵심.

- **글로벌** : Universal Robots(덴마크, 점유율 1위), FANUC CRX, ABB YuMi, Techman
- **국내** : 두산로보틱스, 한화로보틱스, 뉴로메카, 레인보우로보틱스
- **활용** : 중소제조업, 카페·치킨집(자동 튀김·바리스타 로봇), 뷰티·의료
- **국내 강점** : 한국은 두산로보틱스가 글로벌 시장 점유율 4–5위권이고, 한화/LG가 잇따라 진입하며 경쟁이 치열한 분야입니다.

### 서비스 로봇 (Service Robot)

매장·호텔·병원 등 사람과 가까운 환경에서 동작하는 로봇.

- **서빙/배송** : 베어로보틱스 Servi(LG전자가 인수), 푸두(Pudu), 키노(KEENON), 브이디컴퍼니 Dilly
- **안내·청소** : LG CLOi 가이드봇·서브봇·셰프봇, 삼성 봇핸디·봇아이, 소프트뱅크 Pepper(서비스 종료)
- **의료** : Intuitive Surgical da Vinci(수술), 한미사이언스·큐렉소(재활)
- **특징** : 사람과 가까이 있으므로 안전·소음·디자인이 중요. 완전 자율보다는 **반자율(Semi-autonomous)** 형태가 많음.

### 모바일 로봇 — AGV vs AMR

물류·창고·공장 안을 돌아다니며 물건을 옮기는 로봇입니다. 둘은 자주 혼용되지만 자율성 수준이 다릅니다.

| 구분 | AGV (Automated Guided Vehicle) | AMR (Autonomous Mobile Robot) |
| --- | --- | --- |
| 경로 | **사전에 깔린 가이드**(자기띠·QR·라인) 따라 이동 | **자율적으로 경로를 생성**, 장애물 회피 |
| 유연성 | 낮음 (경로 변경 시 재시공) | 높음 (지도만 갱신하면 됨) |
| 대표 사례 | 자동차 공장 내 부품 운반 | Amazon Kiva, Coupang FC, Geek+ |

- **국내** : 트위니, 로보티즈, 시스콘, 클로봇
- **트렌드** : SLAM 기반 AMR이 빠르게 AGV를 대체 중. 물류 자동화 시장의 핵심.

### 자율주행차 (Autonomous Driving)

가장 큰 자본이 몰린 RX 분야이지만, 동시에 가장 어려운 분야이기도 합니다.

#### 자율주행 단계 (SAE Level 0–5)

| Level | 명칭 | 설명 |
| --- | --- | --- |
| 0 | 비자동 | 운전자 100% 책임 |
| 1 | 운전자 보조 | 크루즈 컨트롤 등 단일 기능 보조 |
| 2 | 부분 자동 | 차선 유지 + 가감속 결합 (Tesla Autopilot, 현대 HDA) |
| 3 | 조건부 자동 | 특정 조건에서 차가 운전, 운전자는 즉시 인계 가능 |
| 4 | 고도 자동 | 특정 영역(ODD)에서 완전 자율 — Robotaxi |
| 5 | 완전 자동 | 모든 환경에서 무인 |

#### 주요 플레이어

- **Robotaxi (Level 4)** : Waymo(가장 앞섬), Zoox(Amazon), Cruise(서비스 축소), Baidu Apollo, Pony.ai, WeRide
- **End-to-End 자율주행** : Tesla FSD, Wayve, Comma.ai — 카메라+신경망 위주의 접근
- **국내** : 현대 모셔널, 카카오모빌리티, 라이드플럭스, 토르드라이브, 오토노머스에이투지
- **2026 트렌드** : Tesla Cybercab(2인용 로보택시) 양산 진입, Waymo의 도시 확장, **End-to-End 모델이 모듈식(Perception→Planning→Control) 접근을 빠르게 대체**하는 흐름.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 원문이 "트렌드"로 적은 Cybercab 양산과 Waymo 확장은 실제로 일어났고, Cruise는 "축소"가 아니라 이미 철수한 상태입니다.

- 확인된 사실: Cruise는 원문 표현("서비스 축소")과 달리, GM이 2024년 12월 로보택시 사업을 포기하고 Cruise 조직을 GM 기술팀에 흡수했습니다. 로보택시 플레이어 목록에서는 빼는 게 맞습니다. ([NBC News](https://www.nbcnews.com/business/autos/gm-cruise-robotaxi-business-rcna184294), 검색 결과로만 확인)
- 확인된 사실: Waymo는 2026년 9월 1일 덴버·샌디에이고·탬파에서 일반 승객을 받기 시작하면서 완전 무인 운행 도시가 14곳이 됐습니다. 2026년 상반기에 마이애미, 댈러스·휴스턴·샌안토니오·올랜도, 내슈빌이 차례로 열렸습니다. ([Waymo 블로그](https://waymo.com/blog/2026/09/ride-in-denver-san-diego-tampa/), 2026-10-12 확인 / [Waymo 블로그 - 텍사스·올랜도](https://waymo.com/blog/2026/02/dallas-houston-san-antonio-orlando/), 검색 결과로만 확인)
- 확인된 사실: Tesla는 2026년 Q2에 텍사스 기가팩토리에서 Cybercab 생산을 시작했고 7월부터 사내 직원 탑승을 운영했습니다. Q2 업데이트 기준 Robotaxi는 미국 7개 대도시권(샌프란시스코 베이 지역은 안전 요원 탑승)에서 운영 중입니다. ([Tesla Q2 2026 Update, SEC 8-K](https://www.sec.gov/Archives/edgar/data/0001318605/000162828026049213/exhibit991.htm), 2026-10-12 확인)
- 확인된 사실: 현대차는 2026 CEO 인베스터 데이(8월 26일)에서 첫 IONIQ 5 기반 Waymo 로보택시를 2026년 4분기에 인도한다고 밝혔습니다. ([Hyundai Motor Group 뉴스룸](https://www.hyundaimotorgroup.com/en/news/hyundai-motor-company-charts-profit-driven-growth-roadmap-at-2026-ceo-investor-day), 2026-10-12 확인)
- 확인된 사실: 국토교통부는 2026년 7월 7일 '무인 자율주행차 안전운행 요건 가이드라인'을 냈습니다. 무인 임시운행 허가 전 1만5천km 이상 실증 주행(동일 차량 최대 5대 합산 가능), 원격관제, 시스템 이중화, 최소위험상태(MRC) 확보가 핵심입니다. ([한국경제](https://www.hankyung.com/article/202607070745i), 2026-10-12 확인)
- 확인된 사실: 서울시는 2026년 하반기 상암 자율주행지구(6.6㎢)에서 레벨4 무인 로보택시 3대로 시범 운행을 시작해 2027년까지 10대 이상으로 늘린다는 계획을 밝혔고, 일부 보도는 11월 시작·초기 조수석 안전관리자 탑승을 전합니다. ([국민일보](https://www.kmib.co.kr/article/view.asp?arcid=1769412748), 2026-10-12 확인 / [아시아경제](https://view.asiae.co.kr/article/2026070210170759922), 검색 결과로만 확인)
- 해석·전망: 미국에서는 "무인 운행이 되느냐"보다 "얼마나 빨리 도시를 늘리느냐"가 경쟁 포인트가 됐고, 한국은 이제 막 레벨4 무인 실증의 제도 틀을 갖추는 단계입니다.
- 확인하지 못한 것: Tesla Robotaxi의 도시별 '완전 무인(차내 안전요원 없음)' 여부는 Tesla 자료 요약과 제3자 트래커 사이에 표현 차이가 있어 도시별로 단정하지 않았습니다. 서울 상암 로보택시의 실제 운행 개시 여부도 2026-10-12 시점에는 확인하지 못했습니다. Waymo의 런던 서비스 개시 여부도 확인하지 못했습니다.

교육·실습 관점: 표의 "Robotaxi (Level 4)" 목록은 "실제 무인 유료 운행 중 / 시범 운행 / 철수"로 나눠서 다시 그려 보게 하면 좋은 연습이 됩니다. 특히 "생산 시작 = 무인 상용 서비스"가 아니라는 점(Cybercab)과, 한국 레벨4가 "허가 요건 정비" 단계라는 점을 구분해 주세요.
:::

### 드론 (UAV, Unmanned Aerial Vehicle)

- **상업/촬영** : DJI(중국, 압도적 점유율), Skydio, Parrot
- **물류** : Zipline(아프리카 의약품 배송이 시작점), Wing(구글), Amazon Prime Air
- **농업·측량** : 정밀 농업, 토목 측량, 시설 점검
- **군용·방위** : 우크라이나-러시아 전쟁 이후 군용 드론 시장 폭발적 성장. **자율 군집(Swarm) 드론**, 자폭 드론(Loitering Munition) 등 신영역 형성.
- **국내** : 두산모빌리티이노베이션(수소 드론), 베셀, 니어스랩(풍력 점검)

### 휴머노이드 로봇 — 2026년 가장 뜨거운 분야

> **휴머노이드 로봇**
>
> 사람과 유사한 형태(머리·몸통·양팔·양다리)를 가진 로봇. 사람이 쓰는 도구·환경을 그대로 활용할 수 있어 **범용 로봇의 종착지**로 여겨집니다.

#### 왜 휴머노이드인가?

세상은 이미 사람 형태에 맞춰 설계되어 있기 때문에(문 손잡이, 계단, 도구, 차량 등), 환경을 바꾸지 않고도 적용 가능한 로봇 형태가 휴머노이드입니다. 한 가지 형태로 다양한 작업이 가능한 **범용성**이 핵심입니다.

#### 주요 플레이어

- **미국**
  - Tesla **Optimus** (2026년 자체 공장 투입 단계)
  - Figure AI **Figure 02 / Helix** (BMW 공장 시범 투입)
  - 1X Technologies **Neo Gamma** (가정용 휴머노이드 베타 시작)
  - Boston Dynamics **Atlas** (전기식 신형, 현대차 공장 투입)
  - Agility Robotics **Digit** (Amazon 물류센터 투입)
  - Apptronik **Apollo** (Mercedes-Benz 협력)
  - Sanctuary AI **Phoenix**
- **중국 (2025–2026 폭발적 성장)**
  - Unitree **H1 / G1** (가성비 강점, 연구용 폭증)
  - Xiaomi **CyberOne**
  - Fourier Intelligence **GR-1**
  - UBTECH **Walker S**
  - XPENG **Iron**
  - Agibot, Robotera, Galbot 등 신생 다수
- **국내**
  - 레인보우로보틱스 **Hubo**, **RB-Y1** (삼성전자가 최대주주)
  - 정부 주도 **K-휴머노이드 연합** (현대·삼성·LG·두산 등 참여, 2026년 본격 가동)

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 업체별로 "발표 → 시범 → 실제 출하"의 위치가 꽤 다릅니다. 원문 일부 표현은 현실보다 앞서 있었습니다.

- 확인된 사실 (Tesla Optimus): 2026년 7월 Q2 업데이트 기준, 프리몬트 공장의 Model S·X 라인을 철거하고 1세대 Optimus 라인을 설치 중이며 생산은 "올해 후반 예상"입니다. 초기 생산분은 학습 데이터 수집용 'Optimus Academy'에 쓰인다고 밝혔습니다. 원문의 "2026년 자체 공장 투입 단계"는 공식 자료로는 아직 확인되지 않습니다. ([Tesla Q2 2026 Update, SEC 8-K](https://www.sec.gov/Archives/edgar/data/0001318605/000162828026049213/exhibit991.htm), 2026-10-12 확인)
- 확인된 사실 (Figure): Figure 02의 BMW 조립 라인 투입(2025)에 이어, 2026년 6월 30일 Figure 03이 BMW 스파턴버그 공장에서 부품 시퀀싱(분류·적재) 작업을 시작했습니다. 제어 모델은 Helix 02입니다. Figure 스스로 "첫 시연·다음 단계"라고 표현하므로 대규모 상용 배치로 보기는 이릅니다. ([Figure - F.03 Arrives at BMW](https://www.figure.ai/news/f-03-at-bmw), 2026-10-12 확인)
- 확인된 사실 (1X): 원문의 "Neo Gamma 베타"는 이후 소비자용 NEO로 이어졌습니다. 가격은 Early Access $20,000 또는 월 $499 구독, 미국 인도는 "2026년 시작"이 공식 안내입니다. 모르는 집안일은 사람 전문가(1X Expert)가 원격으로 가르치는 방식이 공식적으로 포함돼 있습니다. ([1X - NEO Home Robot](https://www.1x.tech/discover/neo-home-robot), 2026-10-12 확인)
- 확인된 사실 (Boston Dynamics): 2026년 1월 5일 CES에서 양산형 Atlas를 공개하고 즉시 생산을 시작했으며, 2026년 물량은 현대차 RMAC(로보틱스 메타플랜트 애플리케이션 센터)와 Google DeepMind로 전량 배정됐습니다. ([Boston Dynamics 블로그](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/), 2026-10-12 확인) 다만 현대차는 메타플랜트 아메리카 생산 현장 투입을 2028년부터로 잡고 있어, 원문의 "현대차 공장 투입"은 현재로선 "학습·검증 센터 투입"이 정확합니다. ([Hyundai Motor Group 뉴스룸](https://www.hyundaimotorgroup.com/en/news/hyundai-motor-company-charts-profit-driven-growth-roadmap-at-2026-ceo-investor-day), 2026-10-12 확인)
- 확인된 사실 (Agility): 2026년 6월 24일 SPAC 합병 상장 발표 자료 기준 Digit은 Schaeffler, GXO, Toyota Motor Manufacturing Canada, Mercado Libre 등 9개 고객 시설에서 누적 6.5만 시간 이상 운영했고, 차세대 Digit v5 수주는 3억 달러 이상(다년 계약)입니다. 이 고객 목록에 Amazon은 없습니다 — 원문의 "Amazon 물류센터 투입"은 2023년 시험 사례로 보는 게 맞을 것 같습니다. ([Churchill Capital Corp XI·Agility 공동 보도자료, SEC](https://www.sec.gov/Archives/edgar/data/2074973/000121390026071290/ea029548401ex99-1.htm), 2026-10-12 확인)
- 확인된 사실 (Unitree): 상장 심사 자료 기준 2025년 휴머노이드 5,500대 이상을 출하해 세계 1위라고 밝혔고, 2026년 7월 2일 상하이 STAR Market 상장 승인을 받았습니다. ([SSE 영문 뉴스(Global Times 전재)](https://english.sse.com.cn/news/newsrelease/voice/c/c_20260806_10828128.shtml), 2026-10-12 확인) 8월 19일 상장 완료는 [Caixin Global](https://www.caixinglobal.com/2026-07-03/unitree-robotics-wins-approval-for-618-million-star-market-ipo-102460136.html) 등 보도로만 봤습니다(검색 결과로만 확인).
- 확인된 사실 (한국): K-휴머노이드 연합 출범일은 2025년 4월 10일입니다(본문 '정부 정책' 박스 참고).
- 해석·전망: "누가 제일 멋진 데모를 했나"보다 "몇 대를, 어느 고객 현장에서, 몇 시간 돌렸나"를 공개하는 회사가 늘었습니다(Agility, Unitree). 반대로 출하 수치를 내지 않는 회사의 양산 발표는 한 번 더 의심해 볼 만합니다.
- 확인하지 못한 것: Tesla Optimus 3세대(V3)의 공개 여부, 1X NEO의 실제 고객 인도 여부(제3자 보도는 2026-10 초까지 확인된 인도가 없다고 전함)는 공식 자료로 확인하지 못했습니다. Sanctuary AI, Xiaomi CyberOne, Fourier, UBTECH, XPENG의 2026년 하반기 현황도 이번에 검증하지 않았습니다.

교육·실습 관점: 휴머노이드 뉴스를 읽을 때 "공개(announce) / 시연(demo) / 파일럿(pilot) / 유상 상용 배치(commercial) / 소비자 인도(delivered)" 다섯 칸 표를 만들어 업체를 배치해 보게 하세요. 같은 "공장 투입"이라도 칸이 전혀 다릅니다. 1X NEO처럼 원격 조작이 제품에 포함된 경우는 "자율성"과 "프라이버시"를 함께 토론할 좋은 사례입니다.
:::

#### 휴머노이드 시장 특징

- 2025년 말부터 양산 단계 진입, 2026년부터 **공장·물류 도입 사례 누적** 시작
- 가정용은 아직 상용화 초기 단계. 안전·가격이 큰 장벽.
- 가격대: Unitree G1이 약 $16,000부터 시작해 진입 장벽이 빠르게 낮아지는 중.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — "2026년부터 도입 사례 누적"이라는 원문 전망은 산업용에서는 맞아 들어가고 있지만, 가정용은 아직 "인도 대기" 상태입니다.

- 확인된 사실: 산업 현장 도입은 실제로 늘었습니다. Agility는 9개 고객 시설·누적 6.5만 시간을, Figure는 BMW에서 Figure 03 작업 개시를 공개했습니다. ([Agility 공동 보도자료, SEC](https://www.sec.gov/Archives/edgar/data/2074973/000121390026071290/ea029548401ex99-1.htm) / [Figure](https://www.figure.ai/news/f-03-at-bmw), 2026-10-12 확인)
- 확인된 사실: 대규모 계획도 숫자로 나왔습니다. 현대차는 2028년부터 미국에서 연 3만 대 로봇 생산 능력을 갖추고, 그중 2.5만 대 이상을 현대차·기아 공장에 배치한다는 계획입니다. 이건 계획이지 실적이 아닙니다. ([Boston Dynamics 블로그](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/), 2026-10-12 확인 / [The Korea Herald](https://www.koreaherald.com/article/10741955), 검색 결과로만 확인)
- 확인된 사실: 가정용 1X NEO는 $20,000에 예약을 받고 있지만, 공식 안내는 여전히 "2026년 인도 시작"이라는 미래형입니다. ([1X](https://www.1x.tech/discover/neo-home-robot), 2026-10-12 확인)
- 해석·전망: 가격은 계속 내려가는 추세로 보입니다. Unitree는 2025년 7월 더 작은 R1을 약 $5,900 수준에 내놨다는 보도가 많습니다. 다만 Unitree 제품 가격은 지역·구성(EDU, 손 옵션)에 따라 편차가 커서 원문의 "G1 약 $16,000"을 대체할 단일 숫자는 제시하지 않겠습니다.
- 확인하지 못한 것: Unitree G1·R1의 2026-10 기준 공식 정가는 공식 스토어 페이지에서 직접 확인하지 못했습니다(검색 결과마다 수치가 다름).

교육·실습 관점: 가격을 슬라이드에 넣을 때는 "기본 구성 / 연구용(EDU) 구성"을 나누고 확인 날짜를 적어 두세요. 그리고 "로봇 가격"보다 "로봇 1대·1시간 운용 비용(유지보수·원격 지원 인력 포함)"으로 사고하게 하면 도입 판단 연습이 훨씬 현실적이 됩니다.
:::

### 사족보행·특수형 로봇

- **사족보행** : Boston Dynamics **Spot**, Unitree **Go2**, ANYbotics ANYmal — 점검·순찰·재난 구조에 활용
- **2족 외 특수 형태** : 뱀형(파이프 점검), 수중 로봇(Saab Seaeye), 외골격(Exoskeleton, Sarcos)

---

## 로봇의 두뇌 — Physical AI 시대

휴머노이드 같은 로봇이 갑자기 가능해진 것은 하드웨어가 좋아져서가 아닙니다. **"보고, 이해하고, 행동을 만들어내는" AI 모델이 등장**했기 때문입니다. 이 영역을 통상 **Physical AI** 또는 **Embodied AI** 라고 부릅니다.

### Physical AI / Embodied AI

> **Physical AI**
>
> 물리 세계를 인식하고, 그 안에서 행동을 생성하는 AI. NVIDIA가 적극적으로 사용하는 용어로, 2026년 AI 산업의 핵심 키워드 중 하나.
>
> **Embodied AI**
>
> "신체를 가진 AI"라는 뜻. 학계에서 더 오래 쓰인 용어로, 로봇·시뮬레이션 에이전트 모두를 포함.

### VLA (Vision-Language-Action) 모델 — 로봇 파운데이션 모델

LLM이 텍스트를 학습해 언어를 이해하게 된 것처럼, **VLA 모델은 영상·언어·로봇 동작 데이터를 함께 학습**해 "이 컵을 빨간 접시 위에 놓아"라는 자연어 명령을 실제 로봇 동작으로 변환합니다.

#### 주요 VLA 모델

| 모델 | 만든 곳 | 특징 |
| --- | --- | --- |
| **RT-2 / RT-X / RT-H** | Google DeepMind | 인터넷 영상+로봇 데이터를 함께 학습한 초기 대표 |
| **Open X-Embodiment** | DeepMind + 다수 연구실 | 22종 로봇 데이터 통합 — VLA의 ImageNet 격 |
| **OpenVLA** | Stanford 등 오픈소스 | 7B 규모, 누구나 파인튜닝 가능 |
| **π0 (pi-zero)** | Physical Intelligence | 2024년 등장, 강력한 일반화 — 빨래 개기 등 비정형 작업 시연 |
| **GR00T (Project GR00T)** | NVIDIA | 휴머노이드 전용 파운데이션 모델 |
| **Helix** | Figure AI | Figure 02 휴머노이드의 자체 VLA |
| **Gemini Robotics** | Google DeepMind | Gemini를 로봇 제어용으로 확장 |

> **한 줄 요약**: VLA는 "로봇판 ChatGPT"입니다. 한 모델로 다양한 로봇·다양한 작업을 처리할 수 있다는 점이 혁명적입니다.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 표에 있는 모델 대부분이 한두 세대씩 올라갔습니다. 이름은 그대로 두되 "현재 버전"을 함께 알려 주세요.

- 확인된 사실 (Gemini Robotics): Google DeepMind는 2025년 9월 Gemini Robotics 1.5·ER 1.5에 이어, 2026년 7월 30일 Gemini Robotics 2(VLA, 휴머노이드 전신 제어), Gemini Robotics ER 2(추론·계획 담당), Gemini Robotics On-Device 2(로컬 실행)를 발표했습니다. ER 2는 Google AI Studio에서 공개 사용 가능하고, VLA·On-Device 모델은 신청제 조기 접근입니다. 하드웨어 파트너로 Apptronik Apollo 2, Franka, Boston Dynamics 등이 언급됩니다. ([Google DeepMind 블로그 - Gemini Robotics 2](https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/), 2026-10-12 확인)
- 확인된 사실 (GR00T): NVIDIA는 2026년 1월 5일 CES에서 Isaac GR00T N1.6(휴머노이드 전신 제어용 오픈 추론 VLA, Cosmos Reason 사용)을 Hugging Face로 공개했습니다. ([NVIDIA IR 보도자료](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Releases-New-Physical-AI-Models-as-Global-Partners-Unveil-Next-Generation-Robots/default.aspx), 2026-10-12 확인) 2026년 4월 N1.7(Early Access)이 나왔다는 정보는 검색 결과로만 확인했습니다.
- 확인된 사실 (π): Physical Intelligence는 π0 → π0.5 → π*0.6(경험 기반 학습)에 이어 2026년 4월 16일 π0.7을 공개했습니다. 다른 작업에서 배운 기술을 조합해 학습 데이터에 없던 작업을 수행하는 "조합적 일반화의 첫 징후"를 내세웁니다. ([Physical Intelligence 블로그 - π0.7](https://www.pi.website/blog/pi07), 검색 결과로만 확인)
- 확인된 사실 (Helix): Figure의 현재 VLA는 Helix 02이며, Figure 03의 손·팔·몸통·발을 함께 제어합니다. ([Figure](https://www.figure.ai/news/f-03-at-bmw), 2026-10-12 확인)
- 해석·전망: 2026년 VLA의 공통 키워드는 "팔만 → 전신(whole-body)", "단일 명령 → 수 분짜리 긴 작업", "추론 모델(ER/Reason)과 행동 모델(VLA)의 분리"입니다. 원문의 "로봇판 ChatGPT" 비유는 여전히 유용하지만, 데모 성공률과 현장 신뢰성 사이에는 아직 큰 차이가 있다는 점도 같이 말해 주는 게 정직하다고 생각합니다.
- 확인하지 못한 것: π0.7의 가중치 공개 여부, GR00T N1.7의 정식 출시 여부는 공식 페이지에서 직접 확인하지 못했습니다.

교육·실습 관점: 실습은 공개 가중치가 있는 모델(GR00T N1.6, OpenVLA, π0/π0.5 오픈소스 버전)로, 최신 상용 모델(Gemini Robotics 2, Helix 02)은 "읽기 자료"로 나누는 게 현실적입니다. 비공개 모델의 성능 수치는 회사 발표치라는 걸 반드시 표시하세요.
:::

### World Model (세계 모델)

> **World Model**
>
> 환경(세계)이 어떻게 동작할지 예측하는 AI 모델. "이 행동을 하면 어떻게 될까?"를 시뮬레이션할 수 있게 해주어, 로봇이 **현실에서 시도하기 전에 머릿속으로 시뮬레이션**할 수 있도록 합니다.

- **NVIDIA Cosmos** : 물리 세계 시뮬레이션을 위한 파운데이션 모델
- **Genie 2 / 3 (Google DeepMind)** : 텍스트로 가상 환경을 생성
- **V-JEPA (Meta, Yann LeCun 주도)** : 영상 기반 세계 모델 연구
- **1X World Model** : 휴머노이드 학습을 위한 자체 월드 모델

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 월드 모델은 "연구 데모"에서 "데이터 생성·정책 평가 도구"와 "일반인 체험판"으로 갈라졌습니다.

- 확인된 사실: NVIDIA는 2026년 1월 Cosmos Predict 2.5·Cosmos Transfer 2.5(합성 데이터 생성과 시뮬레이션 내 로봇 정책 평가용 오픈 월드 모델)와 Cosmos Reason 2(물리 세계 이해용 오픈 VLM)를 공개했고, 정책 평가·벤치마크용 Isaac Lab-Arena도 함께 내놨습니다. ([NVIDIA IR 보도자료](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Releases-New-Physical-AI-Models-as-Global-Partners-Unveil-Next-Generation-Robots/default.aspx), 2026-10-12 확인)
- 확인된 사실: Genie 3(2025년 8월 발표)는 2026년 1월 29일 'Project Genie'라는 Google Labs 실험으로 미국 Google AI Ultra 구독자에게 열렸습니다. 공개 API는 없습니다. ([Engadget](https://www.engadget.com/ai/googles-project-genie-lets-you-create-your-own-3d-interactive-worlds-183646428.html), 검색 결과로만 확인)
- 해석·전망: 로봇 분야에서 월드 모델의 실용적 쓰임은 "로봇이 머릿속으로 상상"보다는 "학습 데이터를 늘리고, 실제 로봇에 올리기 전 정책을 평가"하는 쪽으로 먼저 자리 잡는 것 같습니다.
- 확인하지 못한 것: Meta V-JEPA, 1X World Model의 2026년 하반기 업데이트는 이번에 확인하지 않았습니다.

교육·실습 관점: Cosmos 계열은 Hugging Face에서 받을 수 있어 실습 소재로 쓸 수 있지만 GPU 요구량이 큽니다. 비전공자 대상이라면 Project Genie 같은 체험형 도구로 개념을 잡고, 엔지니어 대상이라면 Cosmos로 합성 데이터 생성 파이프라인을 보여 주는 식으로 나누세요.
:::

### 시뮬레이션 — Sim2Real

로봇은 실제 환경에서 학습하면 시간·비용이 너무 큽니다. 그래서 **가상 시뮬레이션에서 수백만 시간을 학습**한 뒤 실제 로봇으로 옮기는 방식이 표준이 되었습니다. 이를 **Sim2Real(Simulation to Reality)** 이라고 합니다.

- **NVIDIA Isaac Sim / Isaac Lab** : 가장 널리 쓰이는 로봇 시뮬레이션 플랫폼
- **MuJoCo** : Google DeepMind가 인수, 학계 표준
- **Gazebo / Webots** : 오픈소스
- **Genesis (2024 공개)** : 초고속 오픈소스 시뮬레이터로 주목

### 디지털 트윈 (Digital Twin)

물리 세계를 가상에 복제한 것. 공장·도시·로봇 자체를 디지털로 본떠 시뮬레이션하고 운영을 최적화합니다.

- **NVIDIA Omniverse** : 산업용 디지털 트윈의 표준 플랫폼
- **Siemens Industrial Metaverse**, **Dassault 3DEXPERIENCE**
- **활용** : 공장 라인 설계 검증, 자율주행 시나리오 테스트, 로봇 학습용 환경 생성

---

## 로봇이 세상을 보고 다루는 법

### 인지 (Perception) — 로봇의 감각

- **카메라(RGB / Depth)** : 가장 기본 — 컬러+거리 정보
- **LiDAR** : 레이저로 3D 거리 측정. 자율주행·정밀 매핑에 필수
- **IMU (관성 측정 장치)** : 가속도·각속도로 자세 파악
- **Force/Torque Sensor** : 힘·토크 감지로 정밀 조작
- **Tactile Sensor (촉각 센서)** : GelSight 등 — 손가락 끝의 감각 구현

### SLAM (Simultaneous Localization and Mapping)

> **SLAM**
>
> 로봇이 모르는 공간에서 **자신의 위치를 알아내면서 동시에 지도를 만드는 기술**.
> 자율주행차·AMR·드론 등 모든 자율 이동 로봇의 기반 기술입니다.

- Visual SLAM(카메라 기반), LiDAR SLAM, Semantic SLAM(의미 정보 포함) 등으로 분화

### 조작 (Manipulation) — 로봇의 손

- **Gripper (그리퍼)** : 단순 집게형, 흡착식, 다관절 손
- **Dexterous Manipulation** : 사람 손처럼 정교한 조작 — 휴머노이드의 핵심 난제
- **Bi-manual Manipulation** : 양손 협응 — ALOHA 프로젝트가 대표
- **End-to-End Manipulation** : 카메라 입력 → 신경망 → 모터 명령으로 직결

### 학습 방식 (Robot Learning)

| 학습 방식 | 핵심 아이디어 | 비고 |
| --- | --- | --- |
| **Imitation Learning (모방 학습)** | 사람이 시범을 보이면 로봇이 따라 학습 | 데이터 수집 비용이 큼 |
| **Reinforcement Learning (강화 학습)** | 시행착오로 보상을 최대화 | 시뮬레이션과 결합 시 강력 |
| **Behavior Cloning** | 모방 학습의 단순 형태 | 분포 변화에 약함 |
| **Diffusion Policy** | Diffusion 모델로 행동 분포를 학습 | 2023년 이후 표준화 |
| **RLHF / Preference Learning** | 사람 피드백으로 보정 | LLM 기법이 로봇으로 확산 |

#### Teleoperation — 데이터 수집의 열쇠

VLA 모델 학습에는 **사람이 로봇을 조종한 시연 데이터**가 필요합니다. 그래서 휴머노이드 회사들은 대규모 **원격 조작(Teleoperation)** 데이터를 모으고 있고, **ALOHA / Mobile ALOHA**(Stanford 오픈소스 양손 데이터 수집 시스템) 같은 도구가 표준이 되어가고 있습니다.

---

## 로봇 인프라와 표준

- **ROS / ROS 2 (Robot Operating System)** : 로봇 소프트웨어의 사실상 표준 미들웨어
- **NVIDIA Isaac Platform** : 시뮬레이션·학습·배포를 통합한 풀스택
- **MoveIt** : 로봇 팔 모션 플래닝의 표준 라이브러리
- **Open Robotics, ROS-Industrial** : 오픈소스 생태계의 중심

### 안전·표준

- **ISO 10218** : 산업용 로봇 안전 표준
- **ISO/TS 15066** : 협동 로봇 안전 표준
- **EU AI Act, EU Machinery Regulation** : 로봇·AI 결합 시스템에 대한 규제 정비 중

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — ISO 10218과 ISO/TS 15066을 "별개 두 표준"으로 외우면 이제 틀립니다. 휴머노이드 전용 표준은 아직 초안입니다.

- 확인된 사실: ISO 10218-1:2025·10218-2:2025가 2025년 2월 발행됐습니다(2011년 이후 첫 대개정). 협동 로봇용 ISO/TS 15066:2016의 요구사항 대부분이 10218-2에 흡수됐고, "협동"은 로봇의 속성이 아니라 "응용(application)의 속성"으로 바뀌었습니다. 기능안전·사이버보안 요구도 확대됐습니다. ([ISO 10218-1:2025](https://www.iso.org/standard/73933.html), 검색 결과로만 확인 / [arXiv - 2011 vs 2025 비교 분석](https://arxiv.org/abs/2602.17822v1), 검색 결과로만 확인)
- 확인된 사실: 휴머노이드·사족보행·자가균형 바퀴형처럼 "능동적으로 균형을 잡아야 하는" 산업용 이동 로봇을 위한 ISO 25785-1은 2026-10 기준 ISO 카탈로그에 위원회 초안(ISO/CD 25785-1)으로 올라 있습니다. 즉 아직 발행된 표준이 아닙니다. ([ISO/CD 25785-1](https://www.iso.org/standard/91469.html), 검색 결과로만 확인)
- 확인된 사실: EU AI Act의 고위험 AI 의무는 'Digital Omnibus'로 미뤄졌습니다. 2026년 5월 6일 잠정 합의 기준, 단독형(부속서 III) 고위험 시스템은 2027년 12월 2일, 규제 제품 내장형(부속서 I)은 2028년 8월 2일로 연기됐고, 기계류 규정(Machinery Regulation) 대상 제품에 내장된 AI는 AI Act 의무에서 대부분 빠지고 기계류 규정 쪽으로 정리됩니다. ([Gibson Dunn, 2026-05-27](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/), 2026-10-12 확인) 2026년 7월 정식 채택됐다는 보도는 검색 결과로만 확인했습니다.
- 해석·전망: 휴머노이드를 공장에 넣으려는 회사들은 당분간 ISO 10218(2025)·ISO 3691-4(무인 산업 트럭) 같은 기존 표준과 리스크 평가를 조합해 버틸 수밖에 없어 보입니다. 원문의 "규제 정비 중"은 여전히 맞는 표현인데, 그 "정비"가 예상보다 느립니다.
- 확인하지 못한 것: ISO 25785-1의 예상 발행 시점(업계 글에선 2026~2027년 언급)은 공식 일정으로 확인하지 못했습니다. ISO 공식 페이지는 직접 열람이 막혀 검색 결과로만 봤습니다.

교육·실습 관점: 안전 파트 슬라이드는 "ISO 10218:2025(협동 요구사항 통합) / ISO 25785-1(휴머노이드, 초안) / EU AI Act(연기)"로 바꿔 두세요. "협동 로봇을 샀으니 펜스 없이 써도 된다"는 오해를 깨기에 '협동은 응용의 속성'이라는 2025년 개정 포인트가 아주 좋은 교재입니다.
:::

---

## 2026년, 한국의 RX 풍경

한국은 RX 영역에서 글로벌 상위권의 자원을 보유한 나라입니다. 가장 큰 강점은 **제조업 + 반도체 + 디스플레이 + 자동차** 라는 수요처가 모두 국내에 있다는 점입니다.

### 대기업 동향

- **현대차 그룹** : Boston Dynamics 인수(2021) 후 Atlas·Spot을 자사 공장에 적용. 모셔널을 통한 자율주행 추진. 휴머노이드를 그룹 차원의 핵심 과제로 격상.
- **삼성** : 레인보우로보틱스 최대주주 등극, 한화로보틱스와 별개로 자체 봇 시리즈(봇핸디 등) 개발. 메모리·파운드리에서 휴머노이드용 반도체 수요를 노림.
- **LG** : LG전자가 베어로보틱스 인수, CLOi 시리즈 확장. LG CNS는 RPA·하이퍼오토메이션·AI Agent 사업화에 집중.
- **두산** : 두산로보틱스가 협동 로봇 글로벌 4–5위권. 2024년 IPO 후 휴머노이드까지 영역 확장 추진.
- **한화** : 한화로보틱스 출범, 협동 로봇·국방 로봇 양면 공략.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 현대차가 로봇·자율주행 계획에 처음으로 구체적인 연도와 수량을 붙였고, 두산로보틱스는 휴머노이드 로드맵을 공개했습니다.

- 확인된 사실: 현대차는 2026 CEO 인베스터 데이(2026-08-26)에서 메타플랜트 아메리카에 2028년부터 Atlas를 투입하고, 6월 미국에 연 RMAC를 연말까지 10배로 키운다고 밝혔습니다. 자율주행은 2026년 말 광주에 'Atria AI'를 투입해 데이터를 모으고, 2028년 NVIDIA와 협력해 첫 양산 SDV에 레벨2+를 적용, 이후 레벨4까지 단계적으로 올리는 로드맵입니다. ([Hyundai Motor Group 뉴스룸](https://www.hyundaimotorgroup.com/en/news/hyundai-motor-company-charts-profit-driven-growth-roadmap-at-2026-ceo-investor-day), 2026-10-12 확인)
- 확인된 사실: Boston Dynamics 발표 기준, 현대차그룹은 연 3만 대 규모 로봇 공장을 짓고 있으며 미국에 260억 달러 투자를 발표했습니다. ([Boston Dynamics 블로그](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/), 2026-10-12 확인)
- 확인된 사실: 두산로보틱스는 2026년 9월 '협동로봇 → 지능형 로봇 솔루션(용접·표면처리 등) → 산업용 휴머노이드(2028년 실증)'의 3단계 로드맵을 제시했습니다. 원문의 "휴머노이드까지 영역 확장 추진"이 구체 일정으로 바뀐 셈입니다. ([아시아경제, 2026-09-08](https://view.asiae.co.kr/article/2026090809005349708), 2026-10-12 확인)
- 해석·전망: 현대차 계획에서 눈여겨볼 건 인베스터 데이 관련 보도에 나온 액추에이터(휴머노이드 재료비의 큰 몫) 미국 생산 계획입니다(검색 결과로만 확인 — 현대차 뉴스룸 본문에서는 직접 확인하지 못함). 원문 말미의 "핵심 부품 해외 의존도" 약점에 대기업이 직접 대응하기 시작한 신호로 읽힙니다. 다만 이는 미국 생산이라 "국내 공급망" 문제와는 결이 다릅니다.
- 확인하지 못한 것: 삼성전자(레인보우로보틱스)의 자체 휴머노이드 공개 일정, LG전자의 로봇 사업 2026년 하반기 변화, 원문의 "두산로보틱스 협동로봇 글로벌 4–5위권" 최신 순위는 공식 자료로 확인하지 못했습니다.

교육·실습 관점: 대기업 동향은 "보유 자산(인수·지분) / 실제 배치 / 공식 일정"으로 나눠 정리하게 하세요. 현대차처럼 연도·수량이 공개된 계획은 1년 뒤 실제와 비교해 보는 과제로 쓰기 좋습니다.
:::

### 정부 정책

- **K-휴머노이드 연합 (2024 출범)** : 대기업·중소기업·연구소가 모인 휴머노이드 공동 추진체. 2026년부터 본격 R&D 수행.
- **지능형 로봇 기본 계획** : 산업부 주도, 5년 단위 갱신.
- **자율주행 임시운행 허가, 도심 항공교통(UAM) 실증** 등 규제 샌드박스 활발.

::: info 2026년 하반기 업데이트 · 2026-10-12 기준
**상반기 원문 이후 달라진 점** — 원문의 K-휴머노이드 연합 출범 연도(2024)는 2025년으로 바로잡아야 하고, 담당 부처 이름도 바뀌었습니다.

- 확인된 사실: K-휴머노이드 연합은 2025년 4월 10일 출범했습니다(원문 '2024 출범'과 참고자료의 '2024 보도자료'는 연도 오기로 보입니다). 기업·대학 등 약 40개 기관이 참여하고, 2030년까지 민관 합산 1조 원 이상 투자, 로봇 AI 공용 모델·핵심 부품 개발 등이 미션입니다. ([정책브리핑 보도자료](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156683522), 2026-10-12 확인 — 날짜만 직접 확인, 세부 내용은 [AI타임스](https://www.aitimes.com/news/articleView.html?idxno=169526) 등 검색 결과로 확인)
- 확인된 사실: 2025년 10월 1일 시행된 정부조직법 개정으로 에너지 기능이 기후에너지환경부로 넘어가면서 산업통상자원부는 '산업통상부'가 됐습니다. 원문의 "산업부"는 이제 산업통상부를 가리킵니다. ([신김 뉴스레터 - 기후에너지환경부 출범 확정](https://shinkim.com/kor/media/newsletter/2979), 검색 결과로만 확인)
- 확인된 사실: 산업부는 2026년 3월 5일 'AI로봇 M.AX 얼라이언스' 간담회를 열어 K-휴머노이드 방향을 논의했습니다. ([정책브리핑](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156747403&call_from=rsslink), 2026-10-12 확인 — 세부 내용은 첨부파일에만 있어 확인하지 못함)
- 확인된 사실: 자율주행 쪽은 국토교통부가 2026년 7월 7일 레벨4 무인차 안전운행 가이드라인을 냈습니다(자율주행차 섹션 박스 참고).
- 해석·전망: 정책은 "연합 결성"에서 "실증·인증·부품 국산화"로 무게가 옮겨 가는 중으로 보입니다. 2026년 국정감사에서 "중국 대비 피지컬 AI 투자 부족" 지적이 나왔다는 보도도 있어(검색 결과로만 확인), 하반기 예산·정책 발표를 지켜볼 필요가 있습니다.
- 확인하지 못한 것: 지능형로봇법의 2026년 개정 여부와 '첨단로봇 산업 전략'의 2026년 후속 계획은 공식 자료로 확인하지 못했습니다. 검색에 나오는 "영구법 전환·실외이동로봇 허용" 개정은 2023년 개정 내용으로 보이며 2026년 변화가 아닙니다.

교육·실습 관점: 정책 자료를 인용할 때는 부처명(산업통상부)과 보도자료 날짜를 반드시 원문 링크로 확인하게 하세요. 이 글의 원문처럼 연도 하나가 틀리면 "정부가 2년째 추진 중"과 "1년째 추진 중"이라는 해석이 달라집니다.
:::

> **한국 RX의 약점이라면?**: 휴머노이드용 핵심 부품(고성능 액추에이터, 정밀 감속기, 촉각 센서)의 해외 의존도가 높고, VLA·World Model 같은 핵심 SW 모델의 자체 개발 사례가 아직 부족합니다.

---

## 비전공자가 헷갈리지 않으려면 — 용어 정리

### 자동화 vs 자율화

이 두 단어를 구분하면 RX 뉴스를 훨씬 잘 읽을 수 있습니다.

| 구분 | 자동화 (Automation) | 자율화 (Autonomy) |
| --- | --- | --- |
| 의미 | **정해진 절차**를 사람 없이 실행 | **상황을 판단해 스스로 결정**하며 실행 |
| 예시 | RPA, AGV, 산업용 로봇 | AI Agent, 자율주행차, AMR, 휴머노이드 |
| 변화 대응 | 시나리오 밖이면 멈춤 | 시나리오 밖에서도 시도 |

### AI Agent vs 로봇

- **AI Agent** : 디지털 환경(소프트웨어)에서 행동하는 자율 시스템
- **로봇 (Embodied Agent)** : 물리 환경에서 행동하는 자율 시스템

**둘 다 "Agent"라는 본질은 같습니다.** 차이는 행동의 무대가 화면 안인지 밖인지뿐. 그래서 2026년에는 두 영역의 기반 기술(LLM·VLA)이 빠르게 수렴 중입니다.

### RPA vs AI Agent

- **RPA**: 시키는 화면 조작을 그대로 실행 — 룰 기반, 화면 변화에 약함
- **AI Agent**: 목표만 주면 스스로 화면을 이해하고 단계 계획·수행 — LLM 기반, 변화에 강함

> 흔한 오해: "RPA는 죽었다" — 사실은 아닙니다. **감사·통제·예측가능성이 중요한 영역(재무 결산, 규제 보고)** 에서는 결정론적인 RPA가 여전히 적합하고, 두 방식은 한동안 공존합니다.

### 휴머노이드 vs 일반 로봇

- 일반 로봇: 한 가지 작업에 최적화 (전용 = 효율적)
- 휴머노이드: 여러 작업을 한 몸으로 처리 (범용 = 유연함)
- 비유하자면 일반 로봇은 "전용 가전제품"이고, 휴머노이드는 "범용 컴퓨터"에 가깝습니다.

---

## 정리하며

RX는 한 줄로 요약하기 어려운 분야지만, 이번 글에서 다룬 지도를 머릿속에 두면 어떤 뉴스가 나와도 좌표를 찍을 수 있습니다.

- **소프트웨어 RX** 는 RPA에서 출발해 Agentic Automation으로 빠르게 진화 중이고,
- **피지컬 RX** 는 산업용·협동·서비스·모바일·자율주행·드론·휴머노이드라는 여러 갈래로 분기되어 있으며,
- 그 모든 영역의 두뇌 역할을 하는 **VLA·World Model·시뮬레이션** 이 2024–2026년에 비약적으로 발전하면서 "범용 로봇"이라는 오랜 꿈에 한 걸음 다가서고 있습니다.

> **마지막 한 마디**
>
> 한 가지는 분명히 짚어두고 싶습니다. RX의 본질은 "로봇 도입"이 아니라 **"AI가 행동하기 시작했다"** 는 사실 그 자체입니다. 키보드와 마우스를 거쳐, 이제 손과 바퀴를 통해 세계와 직접 상호작용하는 AI를 우리는 보고 있는 중입니다.
>
> 비전공자라면 모든 키워드를 외울 필요는 없습니다. 다만 **"이 변화는 단발성 트렌드가 아니라 향후 10년 산업 지형의 기본 축이 될 것"** 이라는 감각을 가지고 자신의 업무·산업과 연결지어 보시기를 권합니다.

---

## 참고 자료

- NVIDIA, "Physical AI Developer Resources" (2024–2026)
- Physical Intelligence, "π0: A Vision-Language-Action Flow Model for General Robot Control" (2024)
- Google DeepMind, "RT-2 / RT-X / Gemini Robotics" 발표 자료
- Stanford, "Open X-Embodiment Dataset" (2023–)
- 산업통상자원부, "K-휴머노이드 연합 출범" 보도자료 (2024)
- UiPath, "Agentic Automation Platform" 백서 (2025)

## 2026년 하반기 업데이트 참고자료 (2026-10-12 확인)

- [Wikipedia - OpenAI Operator](https://en.wikipedia.org/wiki/OpenAI_Operator) — Operator의 ChatGPT agent 통합(2025-07)과 종료(2025-08-31) (검색 결과로만 확인)
- [OpenAI Developer Community - Agent Mode was removed](https://community.openai.com/t/agent-mode-was-removed-with-no-real-replacement/1389601) — 2026년 8월 ChatGPT agent 제거, ChatGPT Work 안내
- [Android Headlines - Google shuts down Project Mariner](https://www.androidheadlines.com/2026/05/google-shuts-down-project-mariner-ai-agent.html) — Mariner 종료(2026-05-04)와 Gemini Agent·Chrome으로의 흡수
- [UiPath Newsroom - UiPath Launches Maestro Flow](https://www.uipath.com/newsroom/uipath-launches-maestro-flow) — 2026-08-19 Maestro Flow 발표, 지원 코딩 에이전트
- [IFR - Five Million Robots now Operate in Factories Globally](https://ifr.org/ifr-press-releases/news/five-million-robots-now-operate-in-factories-globally) — World Robotics 2026: 2025년 설치량·국가별 순위·전망
- [NBC News - GM's Cruise robotaxi business](https://www.nbcnews.com/business/autos/gm-cruise-robotaxi-business-rcna184294) — GM의 Cruise 로보택시 사업 철수(2024-12) (검색 결과로만 확인)
- [Waymo - Welcoming our first riders in Denver, San Diego, and Tampa](https://waymo.com/blog/2026/09/ride-in-denver-san-diego-tampa/) — 2026-09-01 기준 14개 도시 완전 무인 운행
- [Waymo - Ready to Ride: Dallas, Houston, San Antonio, and Orlando](https://waymo.com/blog/2026/02/dallas-houston-san-antonio-orlando/) — 2026년 상반기 신규 도시 (검색 결과로만 확인)
- [Tesla Q2 2026 Update (SEC 8-K Exhibit 99.1)](https://www.sec.gov/Archives/edgar/data/0001318605/000162828026049213/exhibit991.htm) — Cybercab 생산 개시, Robotaxi 운영 도시, Optimus 라인 설치·생산 예정
- [Hyundai Motor Group - 2026 CEO Investor Day](https://www.hyundaimotorgroup.com/en/news/hyundai-motor-company-charts-profit-driven-growth-roadmap-at-2026-ceo-investor-day) — Atlas 2028 투입, RMAC 확대, Atria AI·레벨2+ 로드맵, IONIQ 5 Waymo 로보택시 4분기 인도
- [The Korea Herald - Hyundai Motor Group to deploy 25,000 Atlas robots](https://www.koreaherald.com/article/10741955) — Atlas 2.5만 대 배치 계획 (검색 결과로만 확인)
- [한국경제 - 레벨4 무인 자율주행차 안전기준 마련](https://www.hankyung.com/article/202607070745i) — 국토부 무인차 안전운행 가이드라인(2026-07-07)
- [국민일보 - 서울시, 올 하반기 레벨4 무인 로보택시 실증](https://www.kmib.co.kr/article/view.asp?arcid=1769412748) — 상암 레벨4 로보택시 계획
- [아시아경제 - 서울서 11월부터 무인 로보택시](https://view.asiae.co.kr/article/2026070210170759922) — 11월 개시·안전관리자 탑승 보도 (검색 결과로만 확인)
- [Figure - F.03 Arrives at BMW](https://www.figure.ai/news/f-03-at-bmw) — Figure 03의 BMW 스파턴버그 투입(2026-06-30), Helix 02
- [1X - NEO Home Robot](https://www.1x.tech/discover/neo-home-robot) — NEO 가격·2026년 인도 계획·원격 전문가 지원
- [Boston Dynamics - Unveils New Atlas Robot](https://bostondynamics.com/blog/boston-dynamics-unveils-new-atlas-robot-to-revolutionize-industry/) — 양산형 Atlas(2026-01-05), 2026년 물량 배정, 현대차 3만 대 공장
- [Churchill Capital Corp XI·Agility Robotics 공동 보도자료 (SEC)](https://www.sec.gov/Archives/edgar/data/2074973/000121390026071290/ea029548401ex99-1.htm) — Digit 고객·운영 시간·Digit v5 수주
- [SSE 영문 뉴스 - Unitree IPO (Global Times)](https://english.sse.com.cn/news/newsrelease/voice/c/c_20260806_10828128.shtml) — Unitree 2025년 휴머노이드 5,500대+ 출하, 상장 승인
- [Caixin Global - Unitree wins approval for STAR Market IPO](https://www.caixinglobal.com/2026-07-03/unitree-robotics-wins-approval-for-618-million-star-market-ipo-102460136.html) — 상장 승인·일정 (검색 결과로만 확인)
- [Google DeepMind - Gemini Robotics 2](https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/) — Gemini Robotics 2·ER 2·On-Device 2(2026-07-30)와 접근 방식
- [NVIDIA - New Physical AI Models (CES 2026)](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Releases-New-Physical-AI-Models-as-Global-Partners-Unveil-Next-Generation-Robots/default.aspx) — GR00T N1.6, Cosmos Predict/Transfer 2.5, Cosmos Reason 2
- [Physical Intelligence - π0.7](https://www.pi.website/blog/pi07) — π0.7 공개(2026-04-16)와 조합적 일반화 주장 (검색 결과로만 확인)
- [Engadget - Google's Project Genie](https://www.engadget.com/ai/googles-project-genie-lets-you-create-your-own-3d-interactive-worlds-183646428.html) — Genie 3 기반 Project Genie 공개 범위 (검색 결과로만 확인)
- [ISO 10218-1:2025](https://www.iso.org/standard/73933.html) — 산업용 로봇 안전 표준 2025년 개정판 (검색 결과로만 확인)
- [arXiv - ISO 10218 2011 vs 2025 비교 및 ISO/TS 15066 통합](https://arxiv.org/abs/2602.17822v1) — 협동 요구사항 흡수, 로봇·리스크 분류 변경 (검색 결과로만 확인)
- [ISO/CD 25785-1](https://www.iso.org/standard/91469.html) — 동적 안정 산업용 이동 로봇(휴머노이드 등) 안전 표준, 위원회 초안 단계 (검색 결과로만 확인)
- [Gibson Dunn - EU AI Act Omnibus Agreement](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/) — 고위험 의무 연기 일정, 기계류 규정 대상 AI 처리
- [아시아경제 - 두산로보틱스 휴머노이드 로드맵](https://view.asiae.co.kr/article/2026090809005349708) — 3단계 로드맵, 2028년 산업용 휴머노이드 실증
- [정책브리핑 - K-휴머노이드 연합 출범](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156683522) — 출범일 2025-04-10
- [AI타임스 - 산업부, K-휴머노이드 연합 출범](https://www.aitimes.com/news/articleView.html?idxno=169526) — 참여 기관·투자 규모 (검색 결과로만 확인)
- [정책브리핑 - K-휴머노이드가 나아가야할 길 찾는다](https://www.korea.kr/briefing/pressReleaseView.do?newsId=156747403&call_from=rsslink) — 2026-03-05 AI로봇 M.AX 얼라이언스 간담회
- [신김 뉴스레터 - 기후에너지환경부 출범 확정](https://shinkim.com/kor/media/newsletter/2979) — 정부조직법 개정, 산업통상부 명칭 (검색 결과로만 확인)
