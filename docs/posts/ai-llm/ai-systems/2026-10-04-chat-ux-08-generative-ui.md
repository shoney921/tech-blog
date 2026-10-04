---
title: "AI 연재 8/9 — 도구 호출 결과를 화면으로: 동적 UI(Generative UI) 연동 설계"
date: 2026-10-04T11:10:00
---

# AI 연재 8/9 — 도구 호출 결과를 화면으로: 동적 UI(Generative UI) 연동 설계

7편의 결론은 대화와 구조화된 위젯을 섞자는 것이었다. 그럼 이런 질문이 생긴다. 모델이 "지금 날짜 선택기를 보여 줘야겠다"고 판단했을 때, 그걸 어떻게 안전하게 화면에 올리는가.

이 분야는 지금 빠르게 움직이고 있어서 먼저 말해 둔다. 아래 버전과 상태는 2026-10-04에 공식 문서와 저장소에서 확인한 것이고, 몇 달 뒤엔 달라져 있을 가능성이 높다.

---

## 세 가지 층위

동적 UI를 구현하는 방식은 크게 세 가지로 나눠 볼 수 있다. 이 분류는 내 정리이고, CopilotKit 문서의 display-only/interactive/interrupt 구분과 AG-UI 문서의 설명을 참고했다.

1. **정적 매핑**: 도구 하나에 미리 만든 컴포넌트 하나를 대응시킨다. 모델은 어떤 도구를 호출할지만 고르고, 렌더링은 우리 코드다.
2. **선언형 스키마**: 에이전트가 컴포넌트 트리를 JSON으로 보내고, 클라이언트가 허용된 카탈로그 안에서 렌더링한다.
3. **샌드박스 앱**: 서버가 HTML 앱을 내려 주고 격리된 iframe에서 실행한다.

처리형 서비스(서류 업로드, 금액 확인, 동의)는 1번이나 2번이 어울린다. 3번은 서드파티가 만든 도구 UI를 안전하게 붙일 때 쓴다. 뒤로 갈수록 유연하지만 보안 부담이 커진다.

---

## 1번 층위: Vercel AI SDK의 도구 → 컴포넌트

가장 이해하기 쉬운 건 정적 매핑이다. 확인한 현재 상황은 이렇다. Vercel AI SDK(`ai` 패키지)는 GitHub 릴리스 기준 7.0.127이 안정 최신이었고(2026-10-01), 6 계열은 별도 브랜치에서 유지되고 있었다. npm 페이지는 열리지 않아서 GitHub 릴리스로 확인했다.

문서에서 확인한 구조를 요약하면 다음과 같다.

- 메시지는 `UIMessage`이고 `parts` 배열을 가진다. part에는 텍스트, 추론, 도구, 출처, 파일, 그리고 `data-*` 형태의 커스텀 데이터가 있다.
- 도구 part의 타입은 `tool-${toolName}` 형태다.
- 도구 part의 상태는 `input-streaming`, `input-available`, `output-available`, `output-error`로 문서에 나와 있다.
- `useChat`에서는 도구 결과를 `addToolOutput`으로 돌려준다. `addToolResult`는 deprecated로 표시돼 있다.

```tsx
// 개념 예시: 문서의 패턴을 줄인 것. 정확한 시그니처는 현재 문서에서 확인할 것.
{message.parts.map((part, i) => {
  if (part.type === 'tool-askClaimAmount') {
    switch (part.state) {
      case 'input-streaming':  return <Skeleton key={i} />
      case 'input-available':  return <AmountForm key={i} {...part.input} onSubmit={...} />
      case 'output-available': return <AmountSummary key={i} {...part.output} />
      case 'output-error':     return <ErrorCard key={i} message={part.errorText} />
    }
  }
  return null
})}
```

여기서 설계 포인트는 **모든 상태마다 UI를 정의한다**는 것이다. 로딩과 오류 상태를 빼먹은 도구 UI는 데모에선 멀쩡하다가 실제 환경에서 빈 화면이 된다.

한 가지 확인하지 못한 부분이 있다. v7에서 도구 실행 전 사람 승인을 받는 API가 바뀌었다는 마이그레이션 가이드 내용(`needsApproval`이 `toolApproval` 설정으로 이동)을 봤지만, UI 쪽 승인 대기 상태의 정확한 문자열은 확인하지 못했다. 이 부분은 이 글에서 코드로 쓰지 않았다.

---

## 2번·3번 층위: 프로토콜들의 지형

도구마다 UI를 하드코딩하면 확장이 어렵다. 에이전트와 UI 사이를 표준화하려는 움직임이 여럿 있고, 확인한 현재 상태는 이렇다.

| 대상 | 확인한 상태 |
|------|-------------|
| MCP Apps | MCP 공식 확장. 안정 스펙 날짜 2026-01-26, 지원 호스트로 Claude, ChatGPT, VS Code, Goose, Postman 등이 문서에 언급됨 |
| MCP-UI | MCP Apps 표준으로 흡수되어, 현재는 참조 구현과 레거시 어댑터 역할이라고 안내됨 |
| A2UI (Google) | 문서상 v0.9.1이 현행이고 v1.0은 release candidate. "early stage public preview"로 표기. 패키지도 0.x 버전 |
| AG-UI | MIT 라이선스 오픈소스로 활발히 개발 중. 버전과 안정 라벨은 확인하지 못함 |
| OpenAI Apps SDK | 문서 도메인이 "Plugins"로 표기돼 있었고, UI 컴포넌트는 ChatGPT 안 iframe에서 MCP Apps 브리지로 통신. 리네임에 대한 명시적 공지는 못 찾음 |

각각의 핵심만 짚으면 이렇다.

**MCP Apps.** 도구 정의의 `_meta.ui.resourceUri`가 `ui://` 리소스를 가리키고, 호스트가 이를 미리 가져와 샌드박스 iframe에 렌더링한다. 통신은 postMessage 위의 JSON-RPC다. 허용할 origin은 `csp`와 `permissions`로 선언하고, 앱은 부모 DOM이나 쿠키, localStorage에 접근할 수 없다. 3번 층위의 대표다.

**A2UI.** 실행 코드가 아니라 선언형 JSON 데이터만 오간다. 클라이언트가 신뢰된 컴포넌트 카탈로그를 갖고, 에이전트는 그 안에서만 요청할 수 있다. 서버 쪽에는 컴포넌트를 검증하는 기능이 있다. 2번 층위다. 아직 0.x라서 안정 API로 고정해서 쓰는 건 위험하다.

**AG-UI.** 에이전트와 프런트엔드 사이의 이벤트 기반 프로토콜이다. 확인한 이벤트 종류로는 실행 시작·종료·오류, 텍스트 메시지, 도구 호출, 상태 스냅샷·델타 등이 있다. 특히 인상적인 건 interrupt가 실행 종료 이벤트의 한 결과(`outcome`)로 표현되고, 클라이언트가 재개 값을 담은 새 실행으로 이어간다는 점이다. 6편의 LangGraph interrupt와 개념이 닮았다. 사람 승인 대기 흐름에 잘 맞는 모델이라고 느꼈다.

OpenAI 쪽 문서에서 인상 깊었던 권고는 데이터 처리 도구와 렌더링 도구를 분리하라는 것이다. 비즈니스 데이터의 권위 있는 원본은 서버가 갖고(`structuredContent`), UI는 임시 표시 상태만 갖는다. 이 원칙은 프로토콜이 달라도 통한다고 생각한다.

이 프로토콜들은 경쟁이라기보다 층이 다르다. A2UI는 네이티브 렌더링용 선언형 데이터, MCP Apps는 샌드박스 HTML이다. 둘 중 무엇이 이길지는 모르겠다. 솔직히 1년 뒤에 이 표가 거의 그대로 남아 있을 거라고 자신하지 못한다.

---

## 안전하게 렌더링하기

모델이 만든 값이 화면에 들어간다는 건 새로운 공격 경로다. OWASP의 LLM05:2025(Improper Output Handling)는 LLM 출력을 하위 컴포넌트로 넘기기 전의 검증·정제 부족을 문제로 본다. 브라우저가 해석하는 JS나 Markdown은 XSS로 이어질 수 있고, 완화책으로 출력을 신뢰하지 않는 zero-trust 접근, 문맥별 인코딩, CSP, 로깅을 든다.

그래서 처리형 서비스의 동적 UI에는 최소한 이 규칙들을 둔다. 문서에서 직접 나온 건 위 OWASP 항목과 A2UI/MCP Apps의 카탈로그·샌드박스 방식이고, 나머지는 거기서 도출한 내 제안이다.

- 렌더링 가능한 컴포넌트는 화이트리스트로 제한한다
- props는 스키마(Zod 같은)로 검증한 뒤 넘긴다
- `dangerouslySetInnerHTML` 금지. 링크 URL은 스킴을 제한한다
- 금액이나 개인정보에 영향을 주는 동작은 UI 클릭만으로 확정하지 않고 서버가 다시 검증한다
- UI 클릭은 서버 이벤트나 도구 호출로 올라가고, 서버가 상태를 소유한다

:::tip 권위 있는 데이터는 서버에
화면에 보이는 금액이 정말 그 금액인지는 서버 데이터로 채운 필드인가에 달려 있다. 모델이 쓴 문장에 숫자를 섞게 하지 말고, 숫자는 서버 값으로 렌더링하자.
:::

---

## 흔한 실패

- 모델이 낸 HTML이나 Markdown을 그대로 렌더링한다
- 로딩, 오류, 승인 대기 상태의 UI를 정의하지 않는다
- 프로토콜을 섞어 쓰면서 책임 경계를 정하지 않는다
- 0.x 단계 프로토콜을 안정 API처럼 가정하고 깊게 결합한다

다음 편은 마지막이다. 1~8편을 보상 신청 시나리오 하나로 엮어 본다.

**연재 목차**: [7편](/posts/ai-llm/ai-systems/2026-10-04-chat-ux-07-limits) · 8편(현재) · [9편 종합 설계](/posts/ai-llm/ai-systems/2026-10-04-chat-ux-09-end-to-end-design)

## 참고자료

- Vercel AI SDK 문서, [Generative User Interfaces](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)
- Model Context Protocol, [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- Google, [A2UI](https://github.com/google/A2UI)
- AG-UI, [문서](https://docs.ag-ui.com)
- OWASP, [LLM05:2025 Improper Output Handling](https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/)
