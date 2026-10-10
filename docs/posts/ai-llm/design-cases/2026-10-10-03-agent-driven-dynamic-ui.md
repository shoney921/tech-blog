---
title: "설계 심화 3/3 — 에이전트 기반 동적 UI 연동: 정적·선언형·자유생성 중 무엇을, 어느 앱에"
date: 2026-10-10T10:00:00
description: Generative UI를 정적 매핑·선언형 스펙·자유 생성 세 단계와 전송 프로토콜로 나누고, 2026년 10월 기준 A2UI·json-render·MCP Apps·OpenAI Apps SDK·AG-UI 1.0·Vercel AI SDK 6의 위치를 정리했다. 스트리밍, 승인 UI, 양방향 상태 동기화, 안전·접근성·테스트까지 다루고 챗 중심 SaaS·기존 웹앱 코파일럿·생성 대시보드 세 케이스와 서술형 답안 뼈대를 적었다.
---

# 설계 심화 3/3 — 에이전트 기반 동적 UI 연동: 정적·선언형·자유생성 중 무엇을, 어느 앱에

[연재 8편](/posts/ai-llm/ai-systems/2026-10-04-chat-ux-08-generative-ui)에서 동적 UI를 세 층위(정적 매핑, 선언형 스키마, 샌드박스 앱)로 나누고 프로토콜 지형을 표로 그렸다. 그때 "1년 뒤에 이 표가 그대로 남아 있을 자신이 없다"고 썼는데, 일주일 만에 고칠 게 생겼다. AG-UI 1.0이 2026-09-30에 나왔고, 8편에서 버전을 확인 못 했던 그 프로토콜이다. 이번 글은 8편의 지형도를 갱신하고, 그 위에서 "어떤 앱에 어떤 층위를 고르는가"를 케이스로 푼다.

확인 날짜는 2026-10-10이다. 벤더 자료만 본 것은 그렇다고 적는다.

---

## 분류를 다시: 세 단계와 전송을 분리한다

Thesys의 "State of Generative UI" 리포트(2026-06)가 쓸 만한 틀을 준다. UI를 만드는 방식을 Static → Declarative → Open-ended 세 단계로 놓고, 그 아래 전송(transport) 계층(AG-UI, MCP Apps)을 **따로** 둔다. 8편에서 내가 섞어 썼던 걸 깔끔하게 분리한 셈이다. 벤더 리포트라 자기 제품 수치는 걸러 읽어야 하지만 틀 자체는 중립적이다.

| | Static(도구→컴포넌트) | Declarative(JSON/DSL 스펙) | Open-ended(HTML/JS 생성) |
|---|---|---|---|
| 작동 | 에이전트가 미리 만든 컴포넌트를 typed function call로 고르고 props만 채움 | 카탈로그 안에서 트리를 조립, 클라이언트가 렌더 | 모델이 코드를 쓰고 샌드박스 iframe에서 실행 |
| 안전 | 생성 코드 없음. 가장 안전 | 실행 의미가 렌더러에만 있어 샌드박스할 코드 표면이 없음 | iframe + CSP 필수 |
| 디자인 시스템 | 그대로 상속 | 상속 | 상속 안 됨 |
| 지연·토큰 | 가장 빠름. 단 컴포넌트마다 공수가 선형 증가 | 포맷 문법이 오버헤드 | 선언형 대비 5~10배 토큰, 분 단위 지연 |

리포트가 권하는 건 하이브리드다. 선언형 카탈로그 안에 `GeneratedView` 하나만 두고 그 안에서만 자유 생성을 허용한다. 보안 리뷰가 출력 전체가 아니라 컴포넌트 하나로 국소화된다. InfoQ의 A2UI 기사(2026-07)에 실린 절충안도 같은 결이다. 고정 카탈로그 + 동적 오버레이 + 검증 실패 시 결정적 폴백.

전송 계층은 다른 질문에 답한다. 에이전트의 이벤트(텍스트, 도구 호출, 상태 변화)를 화면까지 어떻게 실어 나르고, 화면의 이벤트(클릭, 입력, 현재 페이지)를 에이전트에게 어떻게 되돌리는가. AG-UI 문서가 스스로 "generative UI 스펙이 아니라 에이전트↔앱 양방향 런타임 연결"이라고 못 박는 이유다.

---

## 2026년 10월의 지형

**Google A2UI.** 2025-12-15 공개(v0.8, Apache 2.0). 선언적 데이터이지 실행 코드가 아니고, 클라이언트가 신뢰된 카탈로그를 쥔다. 2026-04 v0.9에서 방향이 바뀌었는데 structured output 대신 시스템 프롬프트에 스키마를 넣는 prompt-first로 갔고, "Standard" 컴포넌트 세트를 "Basic"으로 개명해 기존 디자인 시스템을 존중하는 쪽으로 물러섰고, 공식 React 렌더러와 클라이언트→서버 데이터 동기화, 캐싱 레이어가 들어갔다. 2026-07 기준 v0.9.1이 현행이고 v1.0 RC가 있다. 비판도 있다. 표준 카탈로그면 모든 UI가 똑같아진다는 것. (v0.9 세부는 2차 출처)

**Vercel json-render.** 2026-01 출시, Apache 2.0. Zod로 `defineCatalog({components, actions})`를 선언하고 스펙은 `{root, elements:{id:{type, props, children}}}`의 평탄한 트리다. RFC 6902 JSON Patch로 스트리밍한다. 렌더러가 React·Vue·Svelte·Solid·React Native·React PDF·Email까지 있어서 같은 스펙으로 화면과 PDF를 만들 수 있다. `@json-render/mcp`로 Claude·ChatGPT·Cursor 안에서도 렌더된다.

**MCP Apps.** Anthropic·OpenAI가 공동으로 낸 SEP-1865, 2026-01-26 Stable. 확장 ID `io.modelcontextprotocol/ui`, 도구의 `_meta.ui.resourceUri`가 `ui://` 리소스를 가리키고 MIME은 `text/html;profile=mcp-app`. 모든 View는 **반드시** 샌드박스 iframe이고, CSP는 서버가 `connectDomains/resourceDomains/frameDomains`로 선언하고 호스트가 강제한다(기본 `default-src 'none'`). 통신은 postMessage 위의 JSON-RPC 단일 채널. 상태 영속과 외부 URL은 "향후 확장"으로 미뤘다. 호스트는 Claude, ChatGPT, VS Code Copilot, Goose, Postman. Claude 쪽 런칭 파트너는 Asana, Box, Canva, Figma, Slack 등이었다.

**OpenAI Apps SDK.** 2025-10 DevDay에 Booking.com, Canva, Spotify, Zillow 등과 함께 나왔고 현행 문서는 "ChatGPT는 MCP 서버가 반환하는 UI에 open MCP Apps 표준을 구현한다"고 쓴다. `_meta["openai/outputTemplate"]`은 호환 별칭이다. `window.openai`에 `toolInput`, `toolOutput`, `callTool`, `sendFollowUpMessage`, `widgetState`/`setWidgetState`, `requestCheckout`이 있고, 표시 모드는 inline card / carousel / fullscreen / PiP. 내가 제일 눈여겨본 건 widgetState가 `{modelContent, privateContent}`로 나뉜다는 점이다. 모델에게 보일 것과 UI 전용을 처음부터 분리한다. 2026-07부터 앱은 skills·apps·templates를 묶은 "plugins" 안에 배포된다(2차 출처).

**AG-UI 1.0.** 2026-09-30. 이벤트별 JSON Schema가 고정됐다. 이벤트는 `RUN_STARTED/FINISHED`, `TEXT_MESSAGE_*`, `TOOL_CALL_START/RESULT`, `STATE_SNAPSHOT/DELTA`, `MESSAGES_SNAPSHOT`에 1.0에서 `SUBAGENT_STARTED/FINISHED`가 더해졌다. 지원 프레임워크가 넓다. LangGraph, Mastra, Google ADK, Pydantic AI, CrewAI, LlamaIndex, Microsoft Agent Framework, OpenAI Agents SDK, Claude Agent SDK. 클라이언트는 React·Angular·Vue·RN에 Slack·Teams까지. CopilotKit은 A2UI, Open-JSON-UI, MCP Apps 세 스펙을 전부 렌더한다. 참고로 Open-JSON-UI는 "OpenAI 내부 스키마의 공개 표준화"라고 CopilotKit 문서에만 있고 OpenAI 측 발표는 찾지 못했다.

**Vercel AI SDK 6** (2025-12-22). `ToolLoopAgent`, 도구 승인, MCP 안정화, `Output`으로 구조화 출력 통합. 8편에서 못 확인했던 도구 part 상태 전체는 이렇다. `input-streaming → input-available → (approval-requested → approval-responded) → output-available | output-error | output-denied`. 그리고 RSC 기반 `streamUI`는 공식 문서가 "experimental, 프로덕션 비권장"으로 못 박았다. 중단 불가, `.done()` 시 리마운트 깜빡임, 다중 Suspense 크래시, 전송량 제곱 증가. `useChat` + tool parts로 가라는 것. 2024년에 `streamUI` 데모를 보고 감탄했던 사람으로서 좀 씁쓸하다.

**assistant-ui, LangGraph.** assistant-ui는 `makeAssistantToolUI`가 deprecated되고 Toolkits로 갔으며, `generative-ui` 파트에 컴포넌트 이름 트리를 받아 소비자 allowlist로 해석해 렌더한다. LangGraph는 `push_ui_message()`가 UI 메시지를 `ui` 채널에 넣고 `langgraph.json`에 등록한 컴포넌트를 LangSmith가 번들해 클라이언트의 `LoadExternalComponent`가 shadow DOM에 렌더한다. 보안 가이드는 없다.

---

## 스트리밍: 부분 객체, 패치, 선행 참조

사용자는 3초 이상 빈 화면을 못 견딘다. 네 가지 기법이 있다.

- **부분 객체 스트리밍.** AI SDK `useObject` + `streamObject`(또는 `streamText` + `Output.object()`). 결과는 partial이라 JSX에서 `undefined` 처리가 필수다. `onFinish`가 "검증 실패면 object가 undefined, 성공이면 error가 undefined"로 둘을 구분해 준다. 생성 오류와 스키마 검증 실패는 다른 처리가 필요하다.
- **JSON Patch 스트림.** json-render와 AG-UI `STATE_DELTA`가 RFC 6902를 쓴다. 순서대로 적용해야 하니 재연결 시엔 `STATE_SNAPSHOT`부터 다시 받는다.
- **선행 참조.** Thesys OpenUI Lang은 `id = Component(args)` 줄 단위 DSL이라 아직 안 온 컴포넌트를 참조하면 스켈레톤을 먼저 그린다. A2UI는 구조와 데이터가 독립 스트림이다.
- **예측 상태.** CopilotKit의 predictive state updates는 도구 인자 토큰이 생성되는 대로 상태 키에 흘려 넣어 폼이 타이핑되듯 채워진다.

지연 수치 하나만. Google Research의 Generative UI(2025-11, Gemini 3 Pro가 HTML/CSS/JS를 생성)는 사람 평가에서 표준 LLM 출력보다 강하게 선호됐지만 생성에 1분 이상 걸릴 수 있다고 스스로 적는다. 자유 생성이 대규모 프로덕션에 들어간 거의 유일한 사례이고, 그래서 분 단위 지연을 감수할 수 있는 "탐색형" 화면에만 맞는다.

---

## 승인 UI: 버튼 클릭도 도구 호출이다

8편과 6편에서 interrupt를 다뤘으니 UI 관점만 더한다.

- AI SDK의 `toolApproval`은 조건 함수를 받는다. 읽기는 자동, 삭제·송금만 사람에게. 승인 대기는 `approval-requested` part로 와서 카드로 렌더한다. `needsApproval`은 deprecated.
- LangGraph interrupt는 재개 시 노드 전체가 처음부터 재실행된다. UI 쪽 함정은 승인 카드를 두 번 그리거나, 승인 전 부수효과가 두 번 일어나는 것. Agent Chat UI는 표준 `HumanInterrupt` 스키마를 감지해 카드를 자동 렌더한다.
- AG-UI 1.0은 Interrupts로 이메일 발송 같은 액션 전 일시정지를 1급 개념으로 둔다.
- MCP Apps 스펙은 "버튼 클릭도 직접 도구 호출과 동일하게 로그·동의"라고 명시한다. UI 안의 클릭이 권한 우회 경로가 되지 않게 하는 원칙이다.

승인 카드의 선례는 사실 Microsoft Adaptive Cards다. Teams·Copilot의 Approve/Reject·Submit 액션 가이드가 10년 가까이 쌓여 있고, 호스트별 스키마 버전(Teams 1.5, Web Chat 1.6, Outlook 1.0~1.2)이 달라 조용히 실패할 수 있다는 교훈까지 문서에 있다. 선언형 UI가 호스트마다 다르게 렌더되는 문제는 A2UI에도 그대로 올 것이다.

---

## 양방향 상태: 화면이 에이전트에게 말하는 법

여기가 "기존 앱에 코파일럿 붙이기" 케이스의 핵심이다. 세 방향의 흐름이 있다.

**에이전트 → 화면.** AG-UI `STATE_SNAPSHOT`(시작·재연결 시 전체)과 `STATE_DELTA`(JSON Patch). CopilotKit `useAgent`(v1.50부터, `useCoAgent`는 호환 래퍼)가 이걸 React 상태로 묶는다.

**화면 → 에이전트.** `useCopilotReadable`로 현재 페이지·선택·폼 값을 컨텍스트에 주입하고, `useCopilotAction`으로 navigate·highlight·fillForm 같은 브라우저 안에서 실행되는 도구를 노출한다. Pydantic AI는 클라이언트가 보낸 상태를 `StateDeps`로 Pydantic 모델 검증을 거쳐 받는다. 상태를 검증 없이 받으면 그게 인젝션 경로다.

**턴을 넘는 위젯 상태.** OpenAI widgetState의 `modelContent`/`privateContent` 분리, MCP Apps의 `ui/update-model-context`와 `host-context-changed`(테마·표시 모드). 모델이 봐야 할 것과 UI만 알면 되는 것을 처음부터 나눈다.

Salesforce Agentforce 엔지니어링 글(2026-03)이 이 주제에서 가장 솔직한 사례다. 400만 세션, 13만 에이전트, 1,000개 이상 조직. 런타임 레이어가 평문으로 답할지 구조화 UI로 답할지 결정하고 Lightning Types로 렌더한다. 가장 어려웠던 건 **사용자가 옵션을 고르면 그 액션을 다시 에이전트가 이해하는 언어로 번역하는 것**이었다고 한다. 그리고 너무 많은 응답을 컴포넌트로 바꾸면 인터페이스가 제한적이고 복잡해져서 옵션 수를 제한해 안정화했다고. 8편에서 내가 "레지스트리를 작게"라고 쓴 건 감이었는데 이 글이 근거를 줬다.

---

## 설계 고려사항: 안전, 디자인 시스템, 접근성, 테스트

안전은 8편의 규칙이 그대로다. 모델 HTML 직접 렌더 금지, 선언형은 allowlist가 곧 보안 모델, 자유 생성은 iframe 샌드박스 + CSP + postMessage 단일 채널. 새로 덧붙일 건 상태 입력의 검증(위 `StateDeps`)과, UI 클릭도 도구 호출과 같은 권한 검사를 거치게 하는 것.

디자인 시스템은 생각보다 큰 문제다. MCP Apps 리소스는 호스트와 디자인 시스템을 공유하지 않는다. 그래서 ChatGPT 안의 Canva 위젯은 Canva처럼 보인다. 반대로 A2UI가 "Standard"를 "Basic"으로 바꾼 건 호스트 앱의 디자인 시스템을 존중하려는 것이다. 우리 앱 안에서 쓸 거면 선언형, 남의 호스트에 배포할 거면 샌드박스. 이 구분이 8편보다 지금 더 선명하다.

접근성은 아직 거의 아무도 안 다룬다. 토큰 단위 스트리밍은 스크린리더에서 문장 중간에 리셋되는 겹침 낭독을 일으키고, 생성된 UI는 감사할 고정 DOM과 안정된 탭 순서가 없다. `aria-live="polite"`와 문장 단위 플러시가 최소한의 대응이다(2차 출처). Microsoft가 2026-03에 Adaptive Cards 접근성 가이드를 냈다는 것 정도가 공식 자료다.

테스트는 세 층이다. 컴포넌트 선택과 props를 스키마로 검증(생성 계약), DOM 구조 대신 accessible role + name으로 단언, 반복 샘플링으로 사용자 가시 결과 확인. 스냅샷 테스트는 올바른 동작에도 실패해서 빨간 빌드를 무시하게 만든다는 지적이 있다. 동의한다. 생성 UI에 스냅샷 테스트를 걸었다가 매 커밋마다 깨져서 결국 꺼 버린 적이 있다.

:::tip 모델이 보는 것과 UI가 아는 것을 나눠라
widgetState의 modelContent/privateContent, MCP Apps의 update-model-context, Salesforce의 역번역 문제. 셋 다 같은 얘기다. 화면 상태 전부를 모델에게 보내면 토큰이 새고 인젝션 표면이 넓어진다. 모델이 판단에 필요한 최소한만 구조화해서 보낸다.
:::

---

## 케이스별 추천

| | 챗 중심 SaaS에 차트·표·폼 | 기존 React 앱에 코파일럿 사이드바 | 에이전트 생성 대시보드·리포트 |
|---|---|---|---|
| 단계 | Static(도구 = 컴포넌트) | Static + 양방향 상태 | Declarative(+GeneratedView 한 칸) |
| 전송 | AI SDK `useChat` tool parts | AG-UI 1.0 | JSON Patch 스트림 |
| 스택 | AI SDK 6 + AI Elements 또는 assistant-ui Toolkits | CopilotKit + LangGraph/Pydantic AI/ADK | json-render(Zod 카탈로그) 또는 A2UI |
| 밖으로 내보내기 | 같은 MCP 서버에 `ui://` 붙여 MCP Apps | 해당 없음 | PDF·Email 렌더러 공유 |
| HITL | `toolApproval` 조건 함수 | interrupt 승인 카드 | 스펙 검증 실패 시 결정적 폴백 |
| 가장 흔한 실패 | 7개 상태 중 일부만 처리해 UI 멈춤 | 승인 전 부수효과 중복, 상태 크기 폭주 | 벤더 벤치마크 믿고 토큰·지연 과소 추정 |

**챗 중심 SaaS.** 도구 하나에 컴포넌트 하나. 폼 제출은 `addToolOutput`으로 회신한다(await 금지, 데드락). `sendAutomaticallyWhen`을 승인 흐름에선 `...WithApprovalResponses`로 바꿔야 한다. `streamUI`는 쓰지 않는다. 레지스트리는 작게 시작한다. ChatGPT나 Claude 안에서도 보여 주고 싶으면 같은 MCP 서버에 `ui://` 리소스를 붙이면 MCP Apps가 된다. 이게 2026년에 새로 생긴 선택지다.

**기존 앱 코파일럿.** AG-UI를 전송으로 깔고 CopilotKit으로 묶는다. 현재 화면 상태는 `useCopilotReadable`로, 브라우저 도구(navigate, highlight, fillForm)는 `useCopilotAction`으로, 폼이 채워지는 모습은 predictive state로. 부수효과는 interrupt 승인. 함정은 상태 크기(델타만 보내고 스냅샷은 재연결 시만), JSON Patch 순서 의존, interrupt 전 멱등성, 그리고 Salesforce가 말한 역번역이다. 사용자가 드롭다운에서 고른 값을 에이전트에게 어떻게 전달할지를 설계 초기에 정해야 한다.

**생성 대시보드.** json-render가 가장 실용적이다. Zod 카탈로그, shadcn 기반 36개 컴포넌트, 화면과 PDF를 같은 스펙으로. 멀티 플랫폼(Flutter 포함)이 필요하면 A2UI인데 아직 v1.0 RC라 호환이 깨질 수 있다. 코드 생성(Gemini식)은 토큰 5~10배와 분 단위 지연이라 `GeneratedView` 한 칸 하이브리드로만. 같은 질의의 스펙은 캐싱한다. 재생성하지 않는다. 벤더(OpenUI) 벤치마크의 토큰 수치는 자기 홍보라 그대로 인용하지 않는다.

---

## 서술형 답안 뼈대

1. **단계 선택**: Static / Declarative / Open-ended 중 무엇을, 왜. 안전·디자인 시스템·지연 세 축으로 근거
2. **전송 선택**: 우리 앱 안(AG-UI, AI SDK tool parts) vs 남의 호스트(MCP Apps). 양방향이 필요한가
3. **카탈로그 설계**: 컴포넌트 allowlist, props 스키마(Zod), 작게 시작, GeneratedView 한 칸의 허용 범위
4. **스트리밍**: 부분 객체·JSON Patch·선행 참조 중 무엇. undefined 처리, 재연결 시 스냅샷
5. **상태 모델**: 에이전트→화면(snapshot/delta), 화면→에이전트(readable, 검증), 모델 가시/UI 전용 분리
6. **승인 UI**: 어떤 도구에 승인이 붙는가(조건 함수), 승인 카드의 상태 전이, 버튼 클릭 = 도구 호출 권한 검사
7. **안전·접근성·테스트**: HTML 직접 렌더 금지, iframe+CSP, aria-live, 스키마+role 단언
8. **케이스 특화 실패 하나**: 표의 마지막 행을 가장 길게

---

## 아직 고민 중인 부분

A2UI와 MCP Apps 중 무엇이 남을지 8편에서 모르겠다고 했는데 지금도 모르겠다. 다만 CopilotKit이 둘 다 렌더하고 OpenAI가 MCP Apps 표준을 채택한 걸 보면, 선언형은 앱 안에서, 샌드박스는 호스트 간에, 이렇게 공존할 가능성이 커 보인다. 그리고 computer use나 브라우저 에이전트가 기존 앱을 직접 조작하는 네 번째 방식은 이번에 조사하지 못했다. 코파일럿 사이드바 대신 에이전트가 그냥 클릭하면 되는 것 아닌가 하는 질문에 아직 답이 없다.

세 편이 끝났다. 1편의 근거 데이터 위에서 2편의 워크플로우가 돌고 3편의 화면으로 나온다. 시험이든 설계 문서든, 케이스에서 가장 무서운 실패 하나를 먼저 고르고 거기서부터 쓰면 된다.

**연재 목차**: [1편](/posts/ai-llm/design-cases/2026-10-10-01-data-pipeline-and-evidence-design) · [2편](/posts/ai-llm/design-cases/2026-10-10-02-agent-workflow-and-rag-architecture) · 3편(현재)

## 참고자료

- Thesys, [State of Generative UI](https://www.openui.com/blog/state-of-generative-ui-report) (2026-06, 벤더 리포트)
- Model Context Protocol, [MCP Apps specification 2026-01-26](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)
- CopilotKit, [AG-UI 1.0](https://www.copilotkit.ai/blog/ag-ui-1.0) (2026-09) / [State concepts](https://docs.ag-ui.com/concepts/state)
- Vercel, [json-render](https://github.com/vercel-labs/json-render) / AI SDK 문서 [Chatbot Tool Usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage), [Migrating from RSC to UI](https://ai-sdk.dev/docs/ai-sdk-rsc/migrating-to-ui)
- Salesforce Engineering, [How Agentforce converts LLM responses into structured UI across 4M sessions](https://engineering.salesforce.com/how-agentforce-converts-llm-responses-into-structured-ui-for-ai-agents-across-4m-sessions/) (2026-03)
- Google Developers, [Introducing A2UI](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) (2025-12) / Google Research, [Generative UI](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) (2025-11)
