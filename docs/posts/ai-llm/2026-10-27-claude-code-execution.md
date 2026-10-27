---
title: "Claude Code 내부 동작 원리 — 요청 하나가 실행되기까지"
date: 2026-10-27T15:00:00
description: 공개 문서로 따라가는 Claude Code의 실행 과정. 에이전트 루프, 권한 검사, 컨텍스트 압축과 확장 기능을 블로그 글 하나를 만드는 상황으로 풀어봅니다.
---

# Claude Code 내부 동작 원리 — 요청 하나가 실행되기까지

“글 하나 써 줘”라고 했는데 파일을 읽고, 명령을 실행하고, 가끔 허락을 구합니다. 한참 일하다가는 대화를 압축한다고 해요. 글 쓰는 데 이사까지 해야 하나 싶습니다.

이 움직임을 이해하려면 모델의 머릿속보다 **모델과 컴퓨터 사이의 왕복**을 보는 편이 낫습니다. 어떤 정보로 다음 행동을 고르고, 누가 그 행동을 허용하고, 실행 결과가 어떻게 다음 판단으로 돌아오는지요.

![작업 카드, 도구, 권한 관문과 가방이 있는 작은 공방에서 일하는 로봇](/images/claude-code-execution/hero.jpg)

*삽화 6장은 이 글을 위해 AI로 생성한 비유입니다. 실제 제품 화면이나 공식 설계도가 아닙니다.*

읽는 순서는 [기존 사내 설명서](/posts/ai-llm/2026-08-21-claude-code-how-it-works)의 입문 배경 → 이번 글의 실행 경계 → [AI 연재 6편](/posts/ai-llm/ai-systems/2026-10-04-ai-agent-06-agent-deep-dive)의 운영 설계입니다. 독립된 후속편이라 기존 편 번호는 유지합니다. 기존 글의 내부 구현 설명은 근거로 재사용하지 않았습니다.

::: info 어디까지 확인한 이야기인가
기준일은 **2026-10-27**입니다. 아래 출처의 확인일도 같은 날입니다. ‘문서 확인’은 Anthropic 공개 문서, ‘로컬 확인’은 이 저장소와 명령 출력, ‘추정’은 그 사실을 연결한 해석입니다. 설명용 상황은 실험 결과가 아닙니다. 비공개 소스, 유출 자료, 역난독화한 코드는 사용하지 않았습니다.
:::

## “알겠습니다” 다음에는 누가 일을 하나요?

먼저 역할을 나눕시다. 모델은 다음 행동을 고릅니다. Claude Code는 도구를 제공하고 실행을 관리합니다. 공식 문서는 이를 맥락 수집 → 행동 → 결과 검증이 반복되는 구조로 설명합니다. 세 단계는 고정된 체크리스트처럼 한 번씩만 지나가지 않습니다. 검증하다 정보가 부족하면 다시 읽고, 읽다가 답이 나오면 편집할 필요도 없어요. **[문서 확인 · [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works#the-agentic-loop), 2026-10-27]**

![자료를 살피고 도구를 사용한 뒤 결과를 점검하며 반복하는 공방의 비유](/images/claude-code-execution/agent-loop.jpg)

*위 그림은 반복 작업의 비유입니다. 아래 구조도는 요청·판단·실행 결과의 관계를 구분합니다.*

![사용자 요청이 모델 판단으로 들어가고, 도구 호출은 실행 제어를 거쳐 실행된다. 결과나 거부 이유는 모델로 돌아가며, 모델은 다음 행동 또는 답변을 선택한다.](/images/claude-code-execution/execution-flow.svg)

API 수준에서 확인되는 연결 고리도 있습니다. 클라이언트 도구를 사용할 때 모델은 `tool_use`라는 구조화된 호출을 내보내고, 애플리케이션이 실행한 뒤 `tool_result`를 돌려줍니다. 모델이 답변에 “파일을 수정했습니다”라고 쓰는 것과 실제 파일 편집이 일어나는 것은 다른 사건입니다. 서버 도구는 실행 위치가 다르므로, 모든 도구가 내 맥에서 실행된다고 일반화해서도 안 됩니다. **[문서 확인 · [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview), 2026-10-27]**

설명용으로 다음 요청을 넣었다고 합시다.

> AI / LLM 카테고리에 새 글을 써 줘. 기존 글은 건드리지 말고, 로컬 빌드까지만 확인해. 푸시는 하지 마.

가능한 경로는 이렇습니다. 프로젝트 지침과 기존 글을 읽습니다. 새 파일을 쓰고 빌드를 실행합니다. 링크 오류가 나오면 경로를 고치고 다시 빌드합니다. 마지막에는 변경 파일과 확인 결과를 알려줍니다. 이건 이해를 돕기 위한 시나리오입니다. Claude Code가 언제나 이 순서로 호출한다거나, 정확히 몇 번의 모델 요청으로 끝난다는 측정값은 아닙니다.

**[추정]** 사용자에게 유용한 Claude Code의 강점 중 하나는 첫 답의 정답률뿐 아니라, 실행 결과를 받고 접근을 수정할 수 있는 데 있다고 봅니다. 이는 공개된 루프를 해석한 의견이며 성능 비교 실험의 결론은 아닙니다.

## 도구를 쥐었다고 문이 저절로 열리나요?

읽기·검색은 정보를 모으고, 편집은 파일을 바꾸고, 셸은 빌드나 테스트 같은 프로그램을 실행합니다. **[문서 확인 · [도구가 하는 일](https://code.claude.com/docs/en/how-claude-code-works#tools), 2026-10-27]**

그런데 셸은 특히 넓은 문입니다. `pnpm docs:build`도 셸로 실행할 수 있고, `git push`도 셸로 실행할 수 있습니다. 둘 다 글자 몇 개짜리 명령이지만 이 블로그에서는 뒤의 명령이 배포로 이어집니다. 저장소의 `CLAUDE.md`에 main 푸시 시 Cloudflare Pages가 자동 배포한다고 적혀 있습니다. **[로컬 확인 · [저장소 운영 지침](https://github.com/shoney921/tech-blog/blob/34fb7941bebba6b46229dcb738084cab2aa5c717/CLAUDE.md), 2026-10-27]**

![렌치를 든 로봇이 권한 관문 앞에서 기다리고 사람이 열쇠를 쥐고 있는 모습](/images/claude-code-execution/permission-gate.jpg)

권한은 `/permissions`에서 규칙과 출처를 확인할 수 있습니다. 규칙은 모델이 아니라 Claude Code가 집행합니다. `deny` → `ask` → `allow` 순서로 평가하며, 좁은 허용 규칙으로 넓은 거부 규칙의 예외를 만들 수 없습니다. “하지 마”라는 자연어 지침과 실행을 막는 규칙은 같은 장치가 아닙니다. **[문서 확인 · [Permissions](https://code.claude.com/docs/en/permissions#manage-permissions), 2026-10-27]**

예를 들어 같은 `Bash(git push *)` 규칙을 ask와 deny에 넣으면 deny가 이깁니다. 이는 우선순위 예시이지, API나 다른 스크립트를 통한 모든 배포까지 차단하는 완성된 정책은 아닙니다. **[문서 확인 · [권한 규칙 문법](https://code.claude.com/docs/en/permissions#permission-rule-syntax), 2026-10-27]**

권한 모드는 개별 규칙 위에서 세션의 승인 방식을 정합니다. 주요 차이만 추리면 다음과 같습니다.

| 모드 | 이해할 때 잡아둘 차이 |
|---|---|
| `default` / Manual | 수정·셸 실행 등에서 승인을 묻는 방식. 읽기 전용 동작에는 예외가 있음 |
| `acceptEdits` | 파일 편집과 정해진 파일 작업을 자동 승인. 모든 셸 명령을 허용한다는 뜻은 아님 |
| `plan` | 조사와 계획이 목적. 셸 처리와 편집 제한에는 세션 설정에 따른 예외가 있음 |
| `auto` | 일상적인 승인 질문 대신 분류기가 해당 행동을 검토 |
| `dontAsk` | 보통 승인이 필요한 호출을 자동 거부. 사전 허용된 작업은 실행 가능 |
| `bypassPermissions` | 권한 확인을 대폭 건너뜀. 별도 격리 환경과 같은 말은 아님 |

**[문서 확인 · [권한 모드 목록](https://code.claude.com/docs/en/permissions#permission-modes), 2026-10-27]**

내장 Bash 샌드박스는 셸의 파일·네트워크 접근을 제한합니다. 파일 도구, 훅·로컬 MCP 서버까지 같은 울타리 안에서 실행되는 것은 아닙니다. **[문서 확인 · [샌드박스 적용 범위](https://code.claude.com/docs/en/sandboxing#what-runs-outside-the-sandbox), 2026-10-27]**

**[추정]** 이 구분은 승인 피로를 줄이면서도 행동의 범위를 나누기 위한 설계로 읽힙니다. 그러나 이것을 Anthropic의 내부 의사결정 기록에서 확인한 것은 아닙니다. 문이 여러 개라는 사실과, 설계자가 왜 그 문을 골랐는지는 구분해야 해요.

## 아까 읽은 걸 왜 또 읽을까요?

컨텍스트는 작업용 가방이라고 생각하면 편합니다. 지금 모델이 판단할 때 참고할 지침, 대화, 읽은 파일과 도구 결과가 들어갑니다. 터미널 화면에 보이는 대화만 세면 가방 무게를 과소평가하게 됩니다. 시작 시 로드되는 지침과 스킬 설명 같은 내용도 있기 때문입니다. **[문서 확인 · [Explore the context window](https://code.claude.com/docs/en/context-window), 2026-10-27]**

![흩어진 자료에서 작은 요약 지도를 골라 제한된 가방에 넣는 로봇](/images/claude-code-execution/context-backpack.jpg)

`CLAUDE.md`는 가방에 넣어 주는 프로젝트 안내문입니다. 기본적인 로딩 방식은 작업 디렉토리와 상위 디렉토리의 지침을 모으고, 하위 디렉토리 지침은 그 영역의 파일을 다룰 때 필요에 따라 읽는 것입니다. 여러 파일은 단순히 하나가 다른 하나를 덮어쓰는 설정값이 아니라 컨텍스트에 함께 들어갑니다. 로딩 여부는 `/context`의 Memory files에서 확인할 수 있습니다. **[문서 확인 · [CLAUDE.md 로딩](https://code.claude.com/docs/en/memory#how-claudemd-files-load), 2026-10-27]**

이 블로그의 안내문에는 파일명, 필수 frontmatter, 카테고리, `pnpm docs:build`가 적혀 있습니다. 운영 방식을 저장소에서 확인할 수 있는 사례죠. 실제 Claude Code 세션의 자동 로딩은 계측하지 않았습니다. **[로컬 확인 · [CLAUDE.md](https://github.com/shoney921/tech-blog/blob/34fb7941bebba6b46229dcb738084cab2aa5c717/CLAUDE.md), 2026-10-27]**

가방이 차면 압축이 등장합니다. 공식 문서가 설명하는 compaction은 대화를 요약해 이어가는 과정이며, 초반의 세부 지시가 빠질 수 있습니다. `/compact`에 보존할 초점을 덧붙일 수도 있습니다. 이것을 원문이 한 글자도 빠지지 않는 ZIP 압축처럼 이해하면 곤란합니다. **[문서 확인 · [컨텍스트 관리](https://code.claude.com/docs/en/how-claude-code-works#context-management), 2026-10-27]**

그렇다고 압축 뒤에 모든 것이 백지가 되는 것도 아닙니다. 현재 문서는 루트 `CLAUDE.md`와 일부 시작 정보를 다시 넣고, 하위 지침은 필요할 때 재로딩하는 식으로 내용별 처리를 설명합니다. “전부 그대로 남는다”와 “전부 잊는다” 사이에 실제 동작이 있습니다. **[문서 확인 · [압축 뒤 남는 것](https://code.claude.com/docs/en/context-window#what-survives-compaction), 2026-10-27]**

인수인계할 때는 원문 전체보다 다시 확인할 좌표를 남겨 보세요. 예를 들면 다음과 같습니다. 자동 압축의 실제 출력은 아닙니다.

```text
현재 작업: 새 글 1개와 이미지 추가
검증: docs:build 통과, 모바일 이미지는 아직 확인 전
남은 일: 모바일 표시 확인, 출처 날짜 재검토
작업 경계: 기존 글 수정 금지, 푸시·배포 금지
```

## 그 가방 무게가 전부 청구서인가요?

컨텍스트 크기와 비용은 관련 있지만 같은 숫자는 아닙니다. 공식 문서는 매 요청에 필요한 맥락을 다시 보내며, 바뀌지 않은 앞부분은 prompt caching으로 재사용할 수 있다고 설명합니다. 캐시는 같은 입력을 다시 처리하는 비용을 줄이는 장치입니다. 모델이 영구적으로 내용을 학습했다는 뜻도, 컨텍스트 한도가 늘었다는 뜻도 아닙니다. **[문서 확인 · [Prompt caching](https://code.claude.com/docs/en/prompt-caching#how-the-cache-is-organized), 2026-10-27]**

그래서 “파일을 한 번 읽었으니 그 뒤로는 공짜”도, “매번 전체 내용을 새 입력 가격으로 청구한다”도 정확하지 않습니다. 캐시가 적용되는 부분과 새로 처리하는 부분을 나눠 봐야 합니다. 모델 변경이나 컨텍스트 재구성 등은 캐시에도 영향을 줄 수 있습니다. **[문서 확인 · [캐시를 무효화하는 동작](https://code.claude.com/docs/en/prompt-caching#actions-that-invalidate-the-cache), 2026-10-27]**

사용량을 볼 때는 `/usage` 같은 도구를 활용할 수 있습니다. 현재 문서는 API 토큰 비용 추정과 구독 플랜 사용량을 구분합니다. 화면에 표시되는 세션 비용 추정치를 구독자의 추가 청구액으로 곧바로 해석하면 안 됩니다. 이 글에서는 실제 세션 비용이나 압축 전후 절감률을 측정하지 않았습니다. **[문서 확인 · [Manage costs effectively](https://code.claude.com/docs/en/costs#track-your-costs), 2026-10-27]**

제안 하나를 보태면, 새 글 하나에 관련 없는 폴더까지 읽기 전에 조사 범위를 정해 보세요. 이 주제는 [컨텍스트 최적화 글](/posts/ai-llm/2026-02-26-ai-context-optimization-vibe-coding)에서 이어집니다.

## 확장 기능, 이름은 많은데 어디에 꽂나요?

훅, 서브에이전트, 스킬, MCP. 전부 “능력을 늘리는 것”이라고만 기억하면 정작 필요할 때 헷갈립니다. 구분 기준은 루프의 어느 지점을 바꾸느냐입니다. 공식 개요도 지침, 재사용 절차, 외부 연결, 분리된 작업, 이벤트 자동화를 나눠 설명합니다. **[문서 확인 · [Extend Claude Code](https://code.claude.com/docs/en/features-overview), 2026-10-27]**

![이벤트 종, 별도 조사 책상, 절차 책자, 외부 보관함 연결선과 명령 카드가 작업대 주위에 배치된 모습](/images/claude-code-execution/extensions.jpg)

### 훅: “잊지 말고 해”를 언제 실행할지 정하기

훅은 정해진 이벤트에 연결합니다. `PreToolUse`는 도구 매개변수가 만들어진 뒤 실행 처리 전에 개입할 수 있고, `PostToolUse`는 도구가 성공한 뒤 실행됩니다. 후자는 이미 일어난 편집을 사전에 막는 장치가 아닙니다. **[문서 확인 · [PreToolUse](https://code.claude.com/docs/en/hooks#pretooluse), [PostToolUse](https://code.claude.com/docs/en/hooks#posttooluse), 2026-10-27]**

예를 들어 편집 후 검사 결과를 모델에 전달하는 것은 후처리입니다. 금지된 작업을 실행 전에 거부하는 것은 사전 제어죠. 훅을 쓴다는 말만으로 둘이 같아지지 않습니다. 또 `Edit`에만 매칭한 훅이 셸을 통한 파일 수정까지 감지한다고 가정하면 빈틈이 생깁니다. 이벤트와 매처가 무엇을 대상으로 하는지 확인해야 합니다. **[문서 확인 · [PostToolUse의 매칭 범위](https://code.claude.com/docs/en/hooks#posttooluse), 2026-10-27]**

### 서브에이전트: 옆 책상에서 조사해 오기

서브에이전트는 별도 컨텍스트에서 작업하고 결과를 돌려주는 용도로 쓸 수 있습니다. 일반적인 새 컨텍스트 방식에서는 주 대화 전체가 자동 전달되는 것이 아니므로 필요한 과업을 전달해야 합니다. 현재 문서에는 부모 대화를 물려받는 fork 방식도 있어, 모든 서브에이전트가 항상 빈 대화에서 출발한다고 단정할 수는 없습니다. **[문서 확인 · [서브에이전트 시작 맥락과 fork](https://code.claude.com/docs/en/sub-agents#what-loads-at-startup), 2026-10-27]**

서브에이전트도 자체 요청과 토큰을 씁니다. 주 대화가 가벼워지는 것과 총비용 감소는 별개입니다. **[문서 확인 · [서브에이전트와 사용량](https://code.claude.com/docs/en/sub-agents), 2026-10-27]**

### 스킬과 슬래시 명령: 필요할 때 꺼내는 작업 설명서

스킬은 `SKILL.md`로 재사용할 지식이나 절차를 제공하는 방식입니다. 본문은 사용할 때 로드되며, `/skill-name`으로 직접 부르거나 관련 작업에서 선택될 수 있습니다. 현재 문서에서는 기존 `.claude/commands/`의 사용자 명령을 스킬과 통합해 설명하고, 기존 명령 파일도 계속 동작한다고 안내합니다. **[문서 확인 · [Extend Claude with skills](https://code.claude.com/docs/en/skills), 2026-10-27]**

다만 슬래시로 시작한다고 전부 같은 종류는 아닙니다. `/compact` 같은 내장 명령과, 내가 만든 `/write-post` 같은 절차 호출은 구분해서 생각하세요. 후자의 이름만 보고 실제로 어떤 파일을 바꾸는지는 알 수 없습니다. 스킬 본문을 봐야 합니다. 이 글의 `/write-post`는 예시 이름이며 설치된 명령이 아닙니다. **[문서 확인 · [내장 명령과 스킬의 구분](https://code.claude.com/docs/en/skills), 2026-10-27]**

### MCP: 다른 시스템으로 이어지는 연결선

MCP는 외부 도구와 데이터 소스에 연결하는 통로입니다. 이슈를 조회하거나 다른 시스템의 API를 사용하는 식입니다. 무엇을 할 수 있는지는 연결한 서버와 도구, 그 시스템의 접근 권한에 달려 있습니다. 연결했다고 외부 데이터가 저절로 신뢰할 만해지는 것도 아닙니다. 공식 문서도 외부 내용을 가져오는 서버의 프롬프트 인젝션 위험을 언급합니다. **[문서 확인 · [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp), 2026-10-27]**

“우리 글쓰기 순서를 기억해”라면 스킬을, “외부 이슈 내용을 가져와”라면 MCP를 검토하는 식으로 시작해 볼 수 있겠습니다. 확장 기능을 많이 붙이는 것 자체가 목표는 아니에요. 레시피가 필요한데 냉장고부터 증설할 필요는 없으니까요.

## 계획을 승인하면 배포까지 승인한 걸까요?

Plan 모드는 조사하고 변경안을 제시하는 데 쓰입니다. 현재 문서는 소스 편집 제한, 계획 승인, 셸 실행 처리가 세션 조건에 따라 달라지는 점을 함께 설명합니다. 특히 bypass가 가능한 대화형 터미널의 예외도 있으므로, Plan이라는 표시만 보고 모든 종류의 쓰기나 외부 행동이 기술적으로 불가능하다고 믿으면 안 됩니다. **[문서 확인 · [Plan 모드의 동작과 예외](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode), 2026-10-27]**

![사람이 로봇의 변경 문서와 검사 결과를 검토하고 배포 상자는 경계선 너머에 남아 있는 모습](/images/claude-code-execution/human-review.jpg)

협업할 때는 “새 파일 작성과 로컬 빌드까지, 원격 반영은 별도”처럼 결과와 경계를 함께 정하는 방식을 권합니다. 제품의 자동 보장에 관한 주장은 아닙니다.

블로그라면 새 글, 이미지, 출처, 빌드 결과를 검토하면 됩니다. 빌드 성공이 내용의 정확성과 읽는 재미를 보장하지는 않아요. 컴파일러에게 유머 감각까지 맡기기에는 계약 범위가 넓습니다.

## 확인하지 못한 곳에는 선을 남겨 둡니다

이 맥에서 `claude --version`을 실행해 **2.1.308 (Claude Code)**을 확인했습니다. 저장소 지침, 글 메타데이터 로더, 사이드바 생성 코드도 읽었습니다. 날짜가 있는 새 Markdown 글은 자동 스캔 대상이어서 수동 등록 항목을 추가할 필요가 없습니다. **[로컬 확인 · 명령 출력 및 [글 로더](https://github.com/shoney921/tech-blog/blob/34fb7941bebba6b46229dcb738084cab2aa5c717/docs/.vitepress/theme/posts.data.ts), [사이드바 설정](https://github.com/shoney921/tech-blog/blob/34fb7941bebba6b46229dcb738084cab2aa5c717/docs/.vitepress/config.mts), 2026-10-27]**

확인하지 못한 것도 분명합니다. 실제 Claude Code 세션의 권한 거부, 훅 실행, 자동 압축, MCP 왕복을 이번 조사에서 재현하지 않았습니다. 압축 전후 정보 보존율과 비용도 측정하지 않았습니다. 비공개 함수 이름, 내부 호출 스택, 모든 도구의 병렬 실행 규칙은 확인하지 못했으며 이 글의 설명에 사용하지 않았습니다.

‘추정’으로 표시한 반복 수정 능력의 가치와 권한 설계 의도는 검토가 필요한 해석입니다. 모르는 부분을 그럴듯한 함수 이름으로 메우지는 않으려 합니다.

## 다시 열어볼 자료

핵심 주장 옆의 링크가 개별 출처입니다. 아래는 다시 읽기 좋은 출발점 다섯 개만 골랐습니다. 모두 2026-10-27 확인했습니다.

- [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works): 루프와 모델·도구의 역할.
- [Permissions](https://code.claude.com/docs/en/permissions): 규칙 문법과 허용·거부의 관계.
- [Explore the context window](https://code.claude.com/docs/en/context-window): 시작 정보와 압축 뒤 처리.
- [Extend Claude Code](https://code.claude.com/docs/en/features-overview): 확장 기능을 선택하는 기준.
- [How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching): 반복 입력과 캐시의 관계.
