---
title: "Claude Code는 뒤에서 무슨 일을 하고 있나 — 바이브 코딩 사내 설명서"
description: 비전공자도 읽을 수 있게 쓴 Claude Code 동작 원리 설명서. 에이전트 루프, 컨텍스트 관리, 권한 모델이 어떻게 돌아가는지부터 소스 레벨의 내부 처리 순서, 회사에서 쓸 때의 리스크까지 정리했습니다.
date: 2026-08-21T14:00:00
---

<style>
.dg { margin: 30px 0; text-align: center; }
.dg svg { max-width: 100%; height: auto; }
.dg figcaption {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-top: 12px;
  line-height: 1.7;
  text-align: left;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}
</style>

# Claude Code는 뒤에서 무슨 일을 하고 있나 — 바이브 코딩 사내 설명서

요즘 사내에서 "바이브 코딩"이라는 말이 자주 들립니다. 그런데 막상 "그게 정확히 뭐냐"고 물으면 설명이 제각각입니다. 어떤 분은 "AI한테 말로 시키면 코드가 나오는 것"이라고 하고, 어떤 분은 "위험해서 회사에선 못 쓰는 것"이라고 합니다. 둘 다 반쯤 맞습니다.

이 문서는 두 가지 목적으로 썼습니다.

첫째, **Claude Code가 화면 뒤에서 실제로 어떤 절차를 밟는지** 정리하는 것입니다. 도구를 쓰면서 "왜 이럴 때 느려지지", "왜 아까 시킨 걸 까먹지", "왜 이건 물어보고 저건 안 물어보지" 같은 의문이 생기는데, 내부 동작을 알면 대부분 설명이 됩니다.

둘째, **비전공자분이 "그거 뭐예요"라고 물었을 때 답할 수 있는 수준**까지 풀어쓰는 것입니다. 개발 경험이 없어도 읽히도록 용어마다 설명을 붙였습니다. 개발자분들은 익숙한 부분을 건너뛰셔도 됩니다.

읽는 방법을 미리 말씀드리면, **1부에서 6부까지가 본편**입니다. 여기까지만 읽으셔도 됩니다. **7부는 실제 구현이 어떤 함수를 어떤 순서로 부르는지까지 파고드는 장**이라 개발자분들을 위한 것이고, 비전공자분은 건너뛰고 8부로 가셔도 흐름이 끊기지 않습니다.

---

## 1부. 용어 정리 — 바이브 코딩이 정확히 뭔가

### 시작은 트윗 한 줄이었습니다

"바이브 코딩(vibe coding)"이라는 말은 2025년 2월 2일, 안드레이 카파시(Andrej Karpathy)가 올린 짧은 글에서 나왔습니다. OpenAI 창립 멤버이자 테슬라 AI 총괄을 지낸 사람입니다.

그는 이렇게 표현했습니다. "완전히 분위기에 몸을 맡기고, 지수적 성장을 받아들이고, 코드가 존재한다는 사실 자체를 잊어버리는 새로운 방식의 코딩."

핵심은 **순서가 뒤집혔다**는 점입니다. 기존 개발은 사람이 코드를 쓰고 AI가 거들었습니다. 바이브 코딩은 사람이 결과를 설명하고 AI가 구현하며, 사람은 문법이 아니라 **동작 수준에서** 결과를 검토합니다. 코드를 작성하는 대신 변경사항을 승인하는 역할로 옮겨가는 겁니다.

이 표현은 빠르게 퍼져서 2025년 콜린스 사전 올해의 단어로 선정됐습니다.

### 그런데 2026년 지금은 말이 또 바뀌고 있습니다

재밌는 건 정작 카파시 본인이 2026년 4월에 "바이브 코딩은 이제 한물갔다"고 말했다는 점입니다. 모델이 좋아지면서 "분위기에 맡긴다"는 뉘앙스가 실제와 안 맞게 됐기 때문입니다.

요즘은 **에이전틱 엔지니어링(agentic engineering)** 이라는 표현을 더 씁니다. 대충 맡기는 게 아니라, 조사 → 계획 → 실행 → 검토 → 배포라는 루프를 AI 에이전트에게 **설계해서 돌리는** 작업이라는 뜻입니다.

용어가 왜 중요하냐면, 사내에서 "바이브 코딩 해도 되나요"라는 질문이 사실 두 가지 다른 질문이기 때문입니다.

- "코드를 안 읽고 AI 결과를 그대로 배포해도 되나요" → 대부분의 경우 안 됩니다
- "AI 에이전트에게 절차를 주고 개발을 시켜도 되나요" → 이미 많이들 하고 있습니다

이 문서에서 다루는 건 두 번째입니다.

---

## 2부. Claude Code가 챗봇과 다른 점

### 채팅 AI에서 행동 AI로

ChatGPT나 Claude 웹 화면에 코드를 물어보면, 답변으로 코드 **텍스트**가 나옵니다. 그걸 복사해서 내 편집기에 붙여넣고, 저장하고, 실행하고, 에러가 나면 다시 복사해서 물어봅니다. 사람이 AI와 컴퓨터 사이를 왕복하는 택배기사 역할을 합니다.

Claude Code는 그 왕복을 없앱니다. 터미널에서 실행되며, **내 컴퓨터의 파일을 직접 읽고 고치고, 명령어를 직접 실행합니다.**

비전공자분께 설명할 때 저는 이렇게 말합니다.

> 채팅 AI가 "이렇게 하세요"라고 알려주는 상담원이라면, Claude Code는 내 컴퓨터 앞에 앉아서 직접 작업하는 인턴입니다. 어깨너머로 지켜보다가 "그건 하지 마"라고 말릴 수 있는 인턴이요.

<figure class="dg">
<svg viewBox="0 0 760 300" role="img" aria-label="채팅 AI와 행동 AI 비교. 채팅 AI에서는 사람이 AI와 컴퓨터 사이를 오가며 결과를 나르고 AI와 컴퓨터는 직접 연결되지 않는다. 행동 AI에서는 AI가 컴퓨터를 직접 다루고 사람은 요청과 승인만 한다.">
  <defs>
    <marker id="a2" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto-start-reverse"><polygon points="0 0, 9 3, 0 6" fill="currentColor"/></marker>
    <marker id="a2b" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto-start-reverse"><polygon points="0 0, 9 3, 0 6" fill="#3b82f6"/></marker>
  </defs>

  <text x="195" y="34" text-anchor="middle" font-size="13" fill="currentColor" font-weight="600">채팅 AI</text>
  <rect x="50" y="70" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="105" y="100" text-anchor="middle" font-size="13" fill="currentColor">AI</text>
  <rect x="230" y="70" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="285" y="100" text-anchor="middle" font-size="13" fill="currentColor">내 컴퓨터</text>
  <rect x="140" y="190" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="195" y="220" text-anchor="middle" font-size="13" fill="currentColor">사람</text>
  <line x1="170" y1="186" x2="118" y2="122" stroke="currentColor" stroke-opacity=".6" marker-start="url(#a2)" marker-end="url(#a2)"/>
  <text x="136" y="150" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".7">질문 · 답변</text>
  <line x1="222" y1="186" x2="272" y2="122" stroke="currentColor" stroke-opacity=".6" marker-start="url(#a2)" marker-end="url(#a2)"/>
  <text x="256" y="150" font-size="11" fill="currentColor" fill-opacity=".7">복사 · 붙여넣기</text>
  <line x1="164" y1="94" x2="226" y2="94" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="4 4"/>
  <text x="195" y="99" text-anchor="middle" font-size="15" fill="#ef4444" fill-opacity=".85">✕</text>
  <text x="195" y="270" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".75">사람이 결과를 나른다</text>

  <line x1="380" y1="30" x2="380" y2="280" stroke="currentColor" stroke-opacity=".15"/>

  <text x="570" y="34" text-anchor="middle" font-size="13" fill="currentColor" font-weight="600">행동 AI (Claude Code)</text>
  <rect x="418" y="70" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="473" y="100" text-anchor="middle" font-size="13" fill="currentColor">AI</text>
  <rect x="612" y="70" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="667" y="100" text-anchor="middle" font-size="13" fill="currentColor">내 컴퓨터</text>
  <rect x="508" y="190" width="110" height="48" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="563" y="220" text-anchor="middle" font-size="13" fill="currentColor">사람</text>
  <line x1="532" y1="94" x2="608" y2="94" stroke="#3b82f6" marker-start="url(#a2b)" marker-end="url(#a2b)"/>
  <text x="570" y="82" text-anchor="middle" font-size="11" fill="#3b82f6">직접 실행</text>
  <line x1="540" y1="186" x2="486" y2="122" stroke="currentColor" stroke-opacity=".6" marker-start="url(#a2)" marker-end="url(#a2)"/>
  <text x="504" y="150" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".7">요청 · 승인</text>
  <text x="570" y="270" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".75">AI가 직접 다룬다</text>
</svg>
<figcaption>달라지는 건 선 하나입니다. 사람과 컴퓨터를 잇던 연결이 <strong>AI와 컴퓨터 사이로 옮겨갑니다.</strong> 사람은 나르는 역할에서 요청하고 승인하는 역할로 이동합니다.</figcaption>
</figure>


이 차이가 왜 결정적이냐면, **AI가 자기 결과를 스스로 확인할 수 있게 되기 때문**입니다. 코드를 고쳤으면 테스트를 돌려보고, 실패하면 다시 고칩니다. 사람이 중간에서 결과를 전달해줄 필요가 없습니다. 이걸 검증 루프라고 부르는데, 뒤에서 자세히 다루겠습니다.

---

## 3부. 뒤에서 벌어지는 일 — 에이전트 루프

여기가 이 문서의 핵심입니다.

### 루프는 생각보다 단순합니다

Claude Code의 심장부는 놀랄 만큼 단순한 반복문입니다. 공식 문서 기준으로 다섯 단계입니다.

1. **프롬프트 수신** — 내가 입력한 요청과 함께, 시스템 프롬프트(AI의 기본 행동 지침), 사용 가능한 도구 목록, 지금까지의 대화 내역이 함께 전달됩니다
2. **판단** — 지금 상황에서 뭘 할지 결정합니다. 텍스트로 답할 수도, 도구를 쓰겠다고 요청할 수도, 둘 다일 수도 있습니다
3. **도구 실행** — 요청한 도구를 실제로 실행하고 결과를 모읍니다
4. **반복** — 2번과 3번을 계속 돕니다. 도구를 더 이상 쓰지 않는 답변이 나올 때까지요
5. **결과 반환** — 최종 답변과 함께 토큰 사용량, 비용, 세션 ID를 돌려줍니다

<figure class="dg">
<svg viewBox="0 -14 760 316" role="img" aria-label="에이전트 루프 구조도. 프롬프트가 판단으로 들어가고, 판단이 도구를 호출하면 실행 결과가 다시 판단으로 되먹여진다. 도구 호출이 없는 답변이 나오면 최종 답변으로 빠져나간다.">
  <defs>
    <marker id="a1" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="currentColor"/></marker>
    <marker id="a1b" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="#3b82f6"/></marker>
  </defs>
  <rect x="290" y="26" width="180" height="250" rx="12" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="5 5"/>
  <text x="380" y="17" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".55">이 왕복 한 번 = 1턴</text>

  <rect x="40" y="48" width="130" height="54" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="105" y="80" text-anchor="middle" font-size="14" fill="currentColor">프롬프트</text>

  <rect x="310" y="40" width="140" height="70" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="380" y="72" text-anchor="middle" font-size="14" fill="currentColor">판단</text>
  <text x="380" y="92" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">무엇을 할지 결정</text>

  <rect x="310" y="200" width="140" height="64" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="380" y="228" text-anchor="middle" font-size="14" fill="currentColor">도구 실행</text>
  <text x="380" y="248" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">Read · Edit · Bash</text>

  <rect x="590" y="48" width="140" height="54" rx="8" fill="none" stroke="currentColor" stroke-opacity=".4"/>
  <text x="660" y="80" text-anchor="middle" font-size="14" fill="currentColor">최종 답변</text>

  <line x1="172" y1="75" x2="302" y2="75" stroke="currentColor" stroke-opacity=".6" marker-end="url(#a1)"/>
  <line x1="452" y1="75" x2="582" y2="75" stroke="currentColor" stroke-opacity=".6" marker-end="url(#a1)"/>
  <text x="517" y="64" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".7">도구 호출 없음</text>

  <line x1="418" y1="112" x2="418" y2="192" stroke="currentColor" stroke-opacity=".6" marker-end="url(#a1)"/>
  <text x="428" y="157" font-size="11" fill="currentColor" fill-opacity=".7">도구 호출</text>

  <line x1="342" y1="198" x2="342" y2="118" stroke="#3b82f6" marker-end="url(#a1b)"/>
  <text x="332" y="157" text-anchor="end" font-size="11" fill="#3b82f6">결과 되먹임</text>
</svg>
<figcaption>루프를 빠져나가는 조건은 단 하나입니다. <strong>도구를 더 이상 호출하지 않는 답변</strong>이 나올 때입니다. 그전까지는 도구 결과가 계속 판단 단계로 되먹여집니다.</figcaption>
</figure>


2번과 3번이 한 바퀴 도는 걸 **턴(turn)** 이라고 부릅니다.

### 실제 예시로 보겠습니다

"auth.ts의 실패하는 테스트를 고쳐줘"라고 요청하면 이렇게 흘러갑니다.

| 턴 | Claude가 하는 일 | 돌아오는 결과 |
|---|---|---|
| 1턴 | `Bash` 도구로 `npm test` 실행 | 테스트 3개 실패 |
| 2턴 | `Read` 도구로 `auth.ts`와 `auth.test.ts` 읽기 | 파일 내용 |
| 3턴 | `Edit`로 코드 수정 → `Bash`로 테스트 재실행 | 3개 모두 통과 |
| 4턴 | 도구 없이 텍스트만 답변 | "고쳤습니다, 3개 다 통과합니다" |

총 4턴입니다. 여기서 주목할 점이 있습니다. **1턴에서 테스트를 먼저 돌려본다는 것**입니다. 코드를 보기도 전에요.

왜냐면 "무엇이 잘못됐는지"를 추측하는 것보다 실제로 실행해서 확인하는 게 정확하기 때문입니다. 그리고 3턴에서 고친 다음 **다시 돌려서 확인**합니다. 이게 아까 말한 검증 루프입니다. 사람이 "됐어?"라고 물어보지 않아도 스스로 확인합니다.

간단한 질문("이 폴더에 어떤 파일 있어?")은 1~2턴이면 끝나고, 복잡한 작업("인증 모듈 리팩토링하고 테스트도 고쳐줘")은 수십 턴이 이어질 수 있습니다.

### 도구 목록

Claude Code가 쓸 수 있는 기본 도구들입니다. 이름만 봐도 대략 짐작이 가실 겁니다.

| 분류 | 도구 | 하는 일 |
|---|---|---|
| 파일 | `Read`, `Edit`, `Write` | 읽기, 수정, 새로 만들기 |
| 검색 | `Glob`, `Grep` | 파일 찾기, 내용 검색 |
| 실행 | `Bash` | 터미널 명령 실행 (git, 테스트, 빌드 등) |
| 웹 | `WebSearch`, `WebFetch` | 검색하고 웹페이지 읽기 |
| 오케스트레이션 | `Agent`, `Skill`, `AskUserQuestion` | 하위 에이전트 띄우기, 스킬 호출, 사용자에게 되묻기 |

Claude Code 내부 구조를 분석한 공개 논문에 따르면, 조건에 따라 최대 54개 정도의 도구가 조립된다고 합니다. 19개는 항상 켜져 있고 나머지는 설정과 사용자 유형에 따라 붙는 구조입니다.

여기에 MCP(뒤에서 설명합니다)로 사내 시스템을 연결하면 도구가 더 늘어납니다.

### 한 가지 중요한 세부사항: 병렬 실행

읽기만 하는 도구(`Read`, `Grep`, `Glob`)는 **동시에** 실행됩니다. 파일 5개를 봐야 하면 5개를 한꺼번에 읽습니다.

반면 상태를 바꾸는 도구(`Edit`, `Write`, `Bash`)는 **순서대로** 실행됩니다. 동시에 고치다가 충돌하면 안 되니까요.

체감상 "읽을 때는 빠른데 고칠 때는 하나씩 가네" 싶은 이유가 이겁니다.

---

## 4부. 컨텍스트 — 가장 중요하고 가장 오해가 많은 자원

### 컨텍스트 윈도우가 뭔가요

AI 모델이 한 번에 "머릿속에 담을 수 있는" 정보의 총량입니다. 현재 Claude의 주력 모델들은 100만 토큰 수준입니다. 토큰은 대략 단어 조각인데, 한국어는 글자당 토큰을 좀 더 먹습니다.

중요한 건 **세션 안에서 이게 리셋되지 않는다**는 점입니다. 대화가 진행될수록 계속 쌓입니다.

무엇이 쌓이냐면요.

- 시스템 프롬프트 (항상 있음, 크지 않음)
- CLAUDE.md 파일 내용 (프로젝트 규칙 문서 — 매 요청마다 통째로 들어감)
- 도구 정의들
- 대화 내역 전체 — 내 질문, AI 답변, **도구에 넣은 입력, 도구가 뱉은 출력**

마지막 항목이 문제입니다. 큰 파일 하나 읽으면 수천 토큰이 한 번에 들어갑니다. 로그가 잔뜩 나오는 명령어를 실행해도 마찬가지입니다. 그래서 긴 세션은 컨텍스트가 빠르게 찹니다.

### 컨텍스트가 차면 무슨 일이 벌어지나

여기가 재밌는 부분입니다. 그냥 터지지 않고, **단계적으로 압축**됩니다.

앞서 언급한 분석 논문에 따르면, 모델을 호출하기 전에 다섯 단계의 압축 장치가 순서대로 작동합니다. 비용이 싼 것부터 씁니다.

1. **예산 축소** — 개별 도구 결과의 크기를 제한합니다. 너무 큰 출력은 "참조"로 바꿉니다
2. **스닙(snip)** — 오래된 대화 구간을 기계적으로 잘라냅니다
3. **마이크로컴팩트** — 세밀한 단위로 압축합니다
4. **컨텍스트 콜랩스** — 저장된 원본은 두고, 읽을 때만 축약해서 봅니다
5. **자동 압축(auto-compact)** — 최후의 수단. 모델이 지금까지의 대화를 통째로 요약합니다

<figure class="dg">
<svg viewBox="0 0 760 320" role="img" aria-label="컨텍스트 압축 5단계 파이프라인. 예산 축소와 스닙은 결정적으로 동작하고, 마이크로컴팩트와 컨텍스트 콜랩스는 의미를 이해해 줄이며, 마지막 자동 압축은 전체를 요약해 정보 손실이 발생한다.">
  <defs>
    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10b981" stop-opacity=".55"/>
      <stop offset="55%" stop-color="#f59e0b" stop-opacity=".6"/>
      <stop offset="100%" stop-color="#ef4444" stop-opacity=".8"/>
    </linearGradient>
  </defs>
  <rect x="20" y="52" width="6" height="240" rx="3" fill="url(#g3)"/>

  <rect x="44" y="52" width="440" height="40" rx="7" fill="none" stroke="currentColor" stroke-opacity=".35"/>
  <circle cx="70" cy="72" r="13" fill="currentColor" fill-opacity=".1"/>
  <text x="70" y="77" text-anchor="middle" font-size="12" fill="currentColor">1</text>
  <text x="94" y="77" font-size="13" fill="currentColor">예산 축소</text>
  <text x="468" y="77" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">도구 결과 크기 제한</text>
  <text x="502" y="77" font-size="11" fill="#10b981">결정적</text>

  <rect x="44" y="100" width="440" height="40" rx="7" fill="none" stroke="currentColor" stroke-opacity=".35"/>
  <circle cx="70" cy="120" r="13" fill="currentColor" fill-opacity=".1"/>
  <text x="70" y="125" text-anchor="middle" font-size="12" fill="currentColor">2</text>
  <text x="94" y="125" font-size="13" fill="currentColor">스닙</text>
  <text x="468" y="125" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">오래된 구간 잘라내기</text>
  <text x="502" y="125" font-size="11" fill="#10b981">결정적</text>

  <rect x="44" y="148" width="440" height="40" rx="7" fill="none" stroke="currentColor" stroke-opacity=".35"/>
  <circle cx="70" cy="168" r="13" fill="currentColor" fill-opacity=".1"/>
  <text x="70" y="173" text-anchor="middle" font-size="12" fill="currentColor">3</text>
  <text x="94" y="173" font-size="13" fill="currentColor">마이크로컴팩트</text>
  <text x="468" y="173" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">세밀한 단위로 압축</text>
  <text x="502" y="173" font-size="11" fill="#f59e0b">의미 기반</text>

  <rect x="44" y="196" width="440" height="40" rx="7" fill="none" stroke="currentColor" stroke-opacity=".35"/>
  <circle cx="70" cy="216" r="13" fill="currentColor" fill-opacity=".1"/>
  <text x="70" y="221" text-anchor="middle" font-size="12" fill="currentColor">4</text>
  <text x="94" y="221" font-size="13" fill="currentColor">컨텍스트 콜랩스</text>
  <text x="468" y="221" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">읽을 때만 축약</text>
  <text x="502" y="221" font-size="11" fill="#f59e0b">의미 기반</text>

  <rect x="44" y="244" width="440" height="40" rx="7" fill="#ef4444" fill-opacity=".07" stroke="#ef4444" stroke-opacity=".55"/>
  <circle cx="70" cy="264" r="13" fill="#ef4444" fill-opacity=".15"/>
  <text x="70" y="269" text-anchor="middle" font-size="12" fill="currentColor">5</text>
  <text x="94" y="269" font-size="13" fill="currentColor">자동 압축</text>
  <text x="468" y="269" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">대화 전체를 요약</text>
  <text x="502" y="269" font-size="11" fill="#ef4444">정보 손실</text>

  <text x="614" y="261" font-size="11" fill="#ef4444" fill-opacity=".9">← 초반 지시가</text>
  <text x="626" y="276" font-size="11" fill="#ef4444" fill-opacity=".9">사라지는 지점</text>
</svg>
<figcaption>위에서부터 순서대로 시도하고, 공간이 확보되면 멈춥니다. 아래로 갈수록 비싸지고 정보가 사라지기 때문에 <strong>5단계는 최후의 수단</strong>입니다. 반드시 지켜야 할 규칙을 <code>CLAUDE.md</code>에 적어야 하는 이유가 여기 있습니다.</figcaption>
</figure>


앞의 두 개는 기계적이고 예측 가능합니다. 뒤로 갈수록 의미를 이해해서 줄이는 대신 **정보 손실이 생깁니다.**

:::warning 여기서 실무적으로 중요한 함의가 나옵니다
자동 압축이 일어나면 **초반에 준 지시사항이 요약 과정에서 날아갈 수 있습니다.** "아까 분명히 말했는데 왜 또 그러지"의 원인이 대부분 이겁니다.

그래서 **반드시 지켜야 할 규칙은 대화 첫머리에 말하지 말고 `CLAUDE.md`에 적어야 합니다.** 이 파일은 매 요청마다 다시 주입되기 때문에 압축돼도 사라지지 않습니다.
:::

### CLAUDE.md — 프로젝트 규칙서

`CLAUDE.md`는 프로젝트 루트에 두는 마크다운 파일입니다. "이 프로젝트는 이런 구조다", "커밋은 이런 식으로 해라", "이 폴더는 건드리지 마라" 같은 내용을 적어두면 매번 설명하지 않아도 됩니다.

계층 구조로 되어 있습니다. 전역 설정 → 프로젝트 단위 → 특정 디렉토리 단위 → AI가 대화 중 스스로 적어두는 메모까지 네 단계입니다.

똑똑한 부분은 **지연 로딩**입니다. 하위 디렉토리의 규칙 파일은 그 폴더의 파일을 실제로 건드릴 때만 읽힙니다. 안 쓰는 규칙이 컨텍스트를 낭비하지 않도록요.

### 서브에이전트 — 컨텍스트를 아끼는 장치

"이 코드베이스에서 결제 관련 로직 다 찾아줘" 같은 작업은 파일을 엄청나게 읽어야 합니다. 그걸 본체가 직접 하면 컨텍스트가 순식간에 찹니다.

그래서 **서브에이전트**를 띄웁니다. 별도의 깨끗한 컨텍스트를 가진 하위 AI입니다.

- 부모의 대화 내역을 물려받지 않습니다 (자기 시스템 프롬프트와 프로젝트 규칙은 읽습니다)
- 파일을 실컷 뒤진 다음, **최종 결과만** 부모에게 돌려줍니다
- 부모의 컨텍스트는 그 요약본만큼만 늘어납니다
- 하위 에이전트의 권한은 부모를 넘을 수 없습니다
- 실패해도 부모 세션은 멀쩡합니다

<figure class="dg">
<svg viewBox="0 0 760 300" role="img" aria-label="서브에이전트 컨텍스트 격리 구조도. 서브에이전트는 별도 컨텍스트에서 파일을 대량으로 읽지만, 부모에게는 요약 한 건만 돌려주므로 부모 컨텍스트는 그 요약만큼만 늘어난다.">
  <defs>
    <marker id="a4" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="currentColor"/></marker>
    <marker id="a4b" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="#3b82f6"/></marker>
  </defs>

  <rect x="40" y="60" width="230" height="190" rx="10" fill="none" stroke="currentColor" stroke-opacity=".45"/>
  <text x="155" y="84" text-anchor="middle" font-size="13" fill="currentColor" font-weight="600">본체 (부모)</text>
  <rect x="60" y="100" width="190" height="22" rx="4" fill="currentColor" fill-opacity=".09"/>
  <text x="70" y="115" font-size="11" fill="currentColor" fill-opacity=".75">대화 내역</text>
  <rect x="60" y="130" width="190" height="22" rx="4" fill="currentColor" fill-opacity=".09"/>
  <text x="70" y="145" font-size="11" fill="currentColor" fill-opacity=".75">프로젝트 규칙</text>
  <rect x="60" y="160" width="190" height="22" rx="4" fill="#3b82f6" fill-opacity=".18" stroke="#3b82f6" stroke-opacity=".5"/>
  <text x="70" y="175" font-size="11" fill="#3b82f6">+ 요약 1건</text>
  <text x="155" y="212" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".65">늘어나는 건 이만큼뿐</text>

  <rect x="430" y="60" width="290" height="190" rx="10" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="6 5"/>
  <text x="575" y="84" text-anchor="middle" font-size="13" fill="currentColor" font-weight="600">서브에이전트</text>
  <text x="575" y="101" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">별도 컨텍스트 (부모 내역 없음)</text>
  <rect x="450" y="116" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="498" y="116" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="546" y="116" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="594" y="116" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="642" y="116" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="450" y="138" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="498" y="138" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="546" y="138" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="594" y="138" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="642" y="138" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="450" y="160" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="498" y="160" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="546" y="160" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="594" y="160" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="642" y="160" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="450" y="182" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="498" y="182" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="546" y="182" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="594" y="182" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <rect x="642" y="182" width="40" height="14" rx="3" fill="currentColor" fill-opacity=".16"/>
  <text x="575" y="218" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".65">파일을 수십 개 읽어도 여기서 끝</text>

  <line x1="274" y1="130" x2="424" y2="130" stroke="currentColor" stroke-opacity=".6" marker-end="url(#a4)"/>
  <text x="349" y="122" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".7">작업 지시</text>
  <line x1="424" y1="190" x2="276" y2="190" stroke="#3b82f6" marker-end="url(#a4b)"/>
  <text x="349" y="206" text-anchor="middle" font-size="11" fill="#3b82f6">요약만 반환</text>
</svg>
<figcaption>조사하느라 읽은 파일 전문은 서브에이전트 안에서 소멸합니다. 본체로 돌아오는 건 <strong>최종 요약 한 건뿐</strong>이라, 읽기 작업의 부산물이 본체 기억을 오염시키지 않습니다.</figcaption>
</figure>


이게 왜 좋냐면, 읽는 작업의 부산물(파일 100개 전문)이 본체 기억을 오염시키지 않기 때문입니다. 사람으로 치면 "가서 조사해오고 요약만 보고해"에 해당합니다.

---

## 5부. 권한 — 회사에서 가장 신경 써야 할 부분

AI가 내 컴퓨터에서 명령어를 실행한다는 건 솔직히 무서운 얘기입니다. 그래서 권한 체계가 겹겹이 있습니다.

### 권한 모드

어느 정도까지 사람이 개입할지를 정하는 설정입니다.

| 모드 | 동작 | 언제 쓰나 |
|---|---|---|
| `default` | 허용 규칙에 없는 도구는 물어봅니다 | 기본값. 평소 작업 |
| `plan` | **소스를 고치지 않고** 조사와 계획만 합니다 | 손대기 전에 무슨 일이 벌어질지 보고 싶을 때 |
| `acceptEdits` | 파일 수정과 기본 파일 명령은 자동 승인. 나머지 명령은 규칙대로 | 프로토타이핑, 격리된 폴더 작업 |
| `dontAsk` | 절대 안 물어봅니다. 미리 허용한 것만 실행하고 나머지는 거부 | 자동화된 무인 실행 |
| `auto` | 분류 모델이 승인 여부를 판단합니다 | 가드레일은 두되 자율성을 주고 싶을 때 |
| `bypassPermissions` | 대부분 안 물어봅니다 | **CI나 컨테이너 같은 격리 환경 전용** |

`plan` 모드는 비전공자분께 특히 권합니다. 실제로 뭘 바꾸기 전에 계획을 먼저 보여주니까, 이해 못 한 채로 파일이 바뀌는 상황을 막을 수 있습니다.

### 거부 우선 원칙

규칙이 충돌하면 **거부가 항상 이깁니다.** 그리고 규칙에 없는 애매한 동작은 조용히 실행되지 않고 사람에게 올라옵니다.

방어층도 여러 겹입니다. 아예 목록에서 도구를 빼버리기, 규칙 평가, 모드별 제약, 분류 모델 판단, 셸 샌드박싱, 훅을 통한 가로채기. 어느 한 층만 막아도 실행되지 않습니다.

### 그런데 여기 함정이 있습니다

Anthropic 데이터에 따르면 **사용자는 권한 요청의 약 93%를 승인**한다고 합니다.

이게 무슨 뜻이냐면, 확인 창을 아무리 띄워도 사람은 결국 습관적으로 "예"를 누른다는 겁니다. 승인 피로(approval habituation)라고 부릅니다. **확인 창만으로는 안전장치가 되지 않는다**는 얘기입니다.

<figure class="dg">
<svg viewBox="0 0 620 400" role="img" aria-label="권한 방어 계층도. 도구 호출은 사전 필터, 거부 규칙, 권한 모드 제약, 샌드박스와 훅을 차례로 통과해야 실행된다. 마지막 확인 창은 사용자가 93퍼센트를 승인하기 때문에 거의 걸러내지 못한다.">
  <defs>
    <marker id="a5" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="currentColor"/></marker>
  </defs>

  <rect x="150" y="24" width="300" height="38" rx="8" fill="none" stroke="currentColor" stroke-opacity=".45"/>
  <text x="300" y="48" text-anchor="middle" font-size="13" fill="currentColor">도구 호출 요청</text>
  <line x1="300" y1="64" x2="300" y2="84" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="150" y="88" width="300" height="34" rx="7" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".35"/>
  <text x="300" y="110" text-anchor="middle" font-size="12" fill="currentColor">도구 사전 필터</text>
  <line x1="300" y1="124" x2="300" y2="140" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="165" y="144" width="270" height="34" rx="7" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".35"/>
  <text x="300" y="166" text-anchor="middle" font-size="12" fill="currentColor">거부 규칙 (거부 우선)</text>
  <line x1="300" y1="180" x2="300" y2="196" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="178" y="200" width="244" height="34" rx="7" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".35"/>
  <text x="300" y="222" text-anchor="middle" font-size="12" fill="currentColor">권한 모드 제약</text>
  <line x1="300" y1="236" x2="300" y2="252" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="189" y="256" width="222" height="34" rx="7" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".35"/>
  <text x="300" y="278" text-anchor="middle" font-size="12" fill="currentColor">셸 샌드박스 · 훅</text>
  <line x1="300" y1="292" x2="300" y2="308" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="191" y="312" width="218" height="34" rx="7" fill="#ef4444" fill-opacity=".07" stroke="#ef4444" stroke-opacity=".55" stroke-dasharray="5 4"/>
  <text x="300" y="334" text-anchor="middle" font-size="12" fill="currentColor">확인 창</text>
  <text x="421" y="330" font-size="11" fill="#ef4444">93%가</text>
  <text x="421" y="344" font-size="11" fill="#ef4444">그대로 통과</text>
  <line x1="300" y1="348" x2="300" y2="364" stroke="currentColor" stroke-opacity=".5" marker-end="url(#a5)"/>

  <rect x="210" y="368" width="180" height="30" rx="7" fill="none" stroke="currentColor" stroke-opacity=".45"/>
  <text x="300" y="388" text-anchor="middle" font-size="12" fill="currentColor">실행</text>
</svg>
<figcaption>각 층은 독립적이라 <strong>어느 하나만 막아도 실행되지 않습니다.</strong> 다만 폭이 거의 줄지 않는 마지막 층이 문제입니다 — 확인 창은 사람이 습관적으로 승인하기 때문에 실질적인 방어선이 되지 못합니다.</figcaption>
</figure>


:::danger 사내 도입 시 시사점
"확인 창이 뜨니까 안전하다"는 전제를 버려야 합니다. 진짜 방어선은 그 아래에 있어야 합니다. 위험한 명령을 아예 규칙으로 차단하고, 격리된 환경에서 돌리고, 훅으로 자동 검사를 걸고, 최종적으로 사람이 코드 리뷰를 하는 구조여야 합니다.
:::

### 훅(Hooks) — 자동 검사 장치

훅은 루프의 특정 시점에 자동으로 실행되는 스크립트입니다. AI의 판단이 아니라 **기계적으로** 돌기 때문에 예측 가능합니다.

| 훅 | 시점 | 활용 |
|---|---|---|
| `PreToolUse` | 도구 실행 직전 | 위험한 명령 차단 — 주요 보안 체크포인트 |
| `PostToolUse` | 도구 실행 직후 | 결과 감사, 자동 포맷팅 |
| `UserPromptSubmit` | 프롬프트 전송 시 | 컨텍스트 추가 주입 |
| `Stop` | 작업 종료 시 | 결과 검증, 상태 저장 |
| `PreCompact` | 압축 직전 | 원본 대화 아카이빙 |

훅은 AI의 컨텍스트 밖에서 돌기 때문에 토큰을 먹지 않습니다. 그리고 `PreToolUse` 훅이 거부하면 그 도구는 실행되지 않고, AI는 거부당했다는 사실을 결과로 받습니다.

사내 규정으로 "프로덕션 DB 접속 명령은 무조건 차단" 같은 걸 걸어두기 좋은 자리입니다.

---

## 6부. 확장 메커니즘 정리 — 헷갈리는 네 가지

Claude Code를 커스터마이징하는 방법이 여러 개인데 자꾸 헷갈립니다. 성격이 다릅니다.

**CLAUDE.md는 "항상 지켜야 할 규칙"입니다.** 매 요청에 들어갑니다. 짧게 유지해야 합니다.

**스킬(Skills)은 "필요할 때 꺼내 보는 매뉴얼"입니다.** 폴더에 `SKILL.md`로 두면, 평소엔 한 줄 설명만 올라가 있다가 관련 작업이 생기면 전문이 로드됩니다. 지식입니다.

**서브에이전트는 "일을 대신 시킬 사람"입니다.** 별도 컨텍스트를 가진 작업자입니다.

**MCP는 "외부 시스템으로 나가는 문"입니다.** 사내 DB 조회, Slack 전송, 티켓 시스템 연동 같은 실제 행동을 담당합니다. 스킬이 지식이라면 MCP는 행동입니다.

**훅은 "자동으로 도는 검사"입니다.** AI 판단과 무관하게 기계적으로 실행됩니다.

한 줄로 줄이면 이렇습니다. 규칙은 CLAUDE.md, 지식은 스킬, 일손은 서브에이전트, 연결은 MCP, 강제는 훅.

---

## 7부. 소스 레벨에서 따라가는 내부 동작 — 케이스 여섯 가지

여기서부터는 상당히 깊이 들어갑니다. **비전공자분은 건너뛰고 8부로 가셔도 이 글을 이해하는 데 지장이 없습니다.** 개발자분들 중 "그래서 실제로 코드가 어떤 순서로 도는데?"가 궁금하신 분들을 위한 장입니다.

:::warning 출처에 대해
아래 함수명과 파일명, 상수값은 **공식 문서가 아니라 배포된 바이너리를 역분석한 공개 연구**([arXiv 2604.14228](https://arxiv.org/html/2604.14228v2))에서 나온 것입니다. 동작 원리를 이해하는 데는 충분히 정확하지만, 식별자는 버전에 따라 바뀔 수 있고 Anthropic이 보증하는 인터페이스가 아닙니다. **이걸 전제로 코드를 짜시면 안 됩니다.** 흐름을 이해하는 용도로만 보세요.

반면 권한 모드, 체크포인트, 세션 재개처럼 공식 문서에 명시된 동작은 그대로 신뢰하셔도 됩니다. 아래에서 둘을 구분해 표시했습니다.
:::

### Case 1. 한 턴 안에서 실제로 벌어지는 순서

3부에서 루프를 "판단 → 도구 실행 → 되먹임"으로 그렸습니다. 실제 구현은 그 사이에 훨씬 많은 단계가 있습니다.

핵심은 `query.ts`의 `queryLoop()`입니다. 비동기 제너레이터이고, 반복 사이의 모든 가변 상태를 **State 객체 하나**에 담습니다. 흥미로운 설계 결정이 하나 있는데, 루프 안의 일곱 개 continue 지점에서 이 객체의 **필드를 개별적으로 고치지 않고 통째로 새로 할당**합니다. 재시작 의미를 깨끗하게 유지하기 위해서입니다.

한 번의 반복은 대략 이 순서입니다.

1. 설정 해석
2. 가변 상태 초기화
3. `getMessagesAfterCompactBoundary()`로 컨텍스트 조립 — **압축 경계 이후의 메시지만** 가져옵니다
4. 모델 호출 전 컨텍스트 셰이퍼 다섯 개를 순차 실행 (Case 3)
5. `deps.callModel()`로 모델 호출, 스트리밍
6. 도구 사용 디스패치
7. 권한 게이트 통과 (Case 2)
8. 도구 실행 및 결과 수집
9. 정지 조건 판정

<figure class="dg">
<svg viewBox="0 0 760 250" role="img" aria-label="한 턴의 내부 순서. 모델이 보기 전에 도구 풀 조립, 컨텍스트 조립, 셰이퍼 다섯 단계가 실행되고, 모델이 응답한 뒤에 도구 호출 디스패치, 권한 게이트, 실행, 결과 수집이 이어진다. 도구 호출이 남아 있으면 다음 턴으로 되돌아간다.">
  <defs>
    <marker id="t7" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="currentColor"/></marker>
    <marker id="t7b" markerWidth="9" markerHeight="7" refX="8" refY="3" orient="auto"><polygon points="0 0, 9 3, 0 6" fill="#3b82f6"/></marker>
  </defs>
  <text x="145" y="46" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".65">모델이 보기 전</text>
  <rect x="20" y="55" width="250" height="130" rx="9" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="5 4"/>
  <text x="40" y="90" font-size="12" fill="currentColor">① 도구 풀 조립 · deny 필터</text>
  <text x="40" y="122" font-size="12" fill="currentColor">② 압축 경계 이후만 조립</text>
  <text x="40" y="154" font-size="12" fill="currentColor">③ 셰이퍼 5단계</text>

  <rect x="300" y="95" width="140" height="60" rx="8" fill="none" stroke="#3b82f6" stroke-opacity=".55"/>
  <text x="370" y="120" text-anchor="middle" font-size="13" fill="currentColor">모델 호출</text>
  <text x="370" y="140" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">스트리밍</text>

  <text x="605" y="46" text-anchor="middle" font-size="12" fill="currentColor" fill-opacity=".65">모델이 말한 뒤</text>
  <rect x="470" y="55" width="270" height="130" rx="9" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-dasharray="5 4"/>
  <text x="490" y="82" font-size="12" fill="currentColor">④ 도구 호출 디스패치</text>
  <text x="490" y="107" font-size="12" fill="currentColor">⑤ 권한 게이트</text>
  <text x="490" y="132" font-size="12" fill="currentColor">⑥ 실행 (읽기 병렬 / 쓰기 직렬)</text>
  <text x="490" y="157" font-size="12" fill="currentColor">⑦ 결과 수집</text>

  <line x1="272" y1="125" x2="294" y2="125" stroke="currentColor" stroke-opacity=".6" marker-end="url(#t7)"/>
  <line x1="442" y1="125" x2="464" y2="125" stroke="currentColor" stroke-opacity=".6" marker-end="url(#t7)"/>

  <path d="M 605 190 L 605 214 L 145 214 L 145 191" fill="none" stroke="#3b82f6" marker-end="url(#t7b)"/>
  <text x="375" y="234" text-anchor="middle" font-size="11" fill="#3b82f6">도구 호출이 남아 있으면 다음 턴</text>
</svg>
<figcaption>주목할 점은 <strong>절반의 작업이 모델이 입을 열기도 전에 끝나 있다</strong>는 것입니다. 어떤 도구가 존재하는지, 어떤 대화가 보일지가 이미 결정된 상태에서 모델이 판단합니다.</figcaption>
</figure>

이 그림이 말하는 게 중요합니다. 우리는 흔히 "AI가 판단하고 시스템이 따른다"고 생각하는데, 실제로는 **시스템이 먼저 판을 짜고 그 안에서 모델이 판단합니다.** 모델이 볼 수 있는 도구와 대화 내역은 호출 전에 이미 결정됩니다.

### Case 2. 도구 하나가 실행되기까지 — 권한 심사의 실제 순서

5부에서 방어층을 깔때기로 그렸는데, 실제 구현 순서는 이렇습니다.

**1단계, 도구 풀 조립 시점의 사전 제거.** `tools.ts`의 `filterToolsByDenyRules()`가 전면 거부된 도구를 **모델에게 보이는 목록에서 아예 빼버립니다.** 이게 첫 번째이자 가장 강력한 층인 이유가 있습니다. 모델은 그 도구가 존재한다는 사실조차 모릅니다. 거부당하는 게 아니라 선택지에 없는 겁니다.

참고로 도구 풀은 `assembleToolPool()`이 조립하는데, 내장 도구가 최대 54개입니다. **19개는 무조건 포함되고 35개는 기능 플래그와 사용자 유형에 따라 조건부**로 붙습니다. 여기에 MCP 도구가 병합됩니다. 사람마다 Claude Code가 조금씩 다르게 동작하는 이유가 여기 있습니다.

**2단계, PreToolUse 훅.** 규칙보다 **먼저** 돕니다. 훅은 `permissionDecision`으로 거부하거나 확인을 요구할 수 있고, 흥미롭게도 `updatedInput`으로 **도구의 입력 자체를 수정**할 수도 있습니다. 막는 것뿐 아니라 고쳐서 통과시키는 것도 된다는 뜻입니다.

**3단계, 거부 우선 규칙 평가.** 여기 핵심 비대칭이 있습니다. **거부 규칙은 항상 허용 규칙을 이깁니다. 허용 쪽이 더 구체적이어도 그렇습니다.** "모든 셸 명령 거부"라는 넓은 거부를 "npm test 허용"이라는 좁은 허용으로 뚫을 수 없습니다.

CSS나 방화벽 규칙에 익숙한 분이라면 "구체적인 게 이긴다"를 기대하실 텐데, 여기는 정반대입니다. 안전 쪽으로 기울인 의도적 설계입니다.

**4단계, 권한 핸들러 분기.** `useCanUseTool.tsx`에서 코디네이터 / 스웜 워커 / 투기적 분류기 / 대화형 경로로 갈립니다. Bash 명령에 분류기가 켜져 있으면 **미리 시작해둔 분류 결과와 타임아웃을 경주시킵니다.** 분류가 빨리 끝나면 그 판단을 쓰고, 늦으면 타임아웃 경로로 갑니다. 안전성을 위해 매번 기다리는 대신 응답성을 챙긴 구조입니다.

**5단계, 셸 샌드박싱.** `shouldUseSandbox.ts`의 **독립적인 층**입니다. 이게 재밌는데, 권한과 샌드박스는 별개로 판단됩니다. **승인은 받았지만 샌드박스 안에서 도는** 명령이 있을 수 있고, 권한 단계에서 거부되면 샌드박스 검사까지 가지도 않습니다.

**6단계, 실행 후 PostToolUse 훅.** 실행이 끝난 뒤에도 개입 지점이 있습니다. `additionalContext`를 주입하거나, MCP 도구의 경우 `updatedMCPToolOutput`으로 **결과가 컨텍스트에 들어가기 전에 수정**할 수 있습니다.

정리하면 개입 지점이 **실행 전에 셋, 실행 후에 하나** 있습니다. 5부에서 "확인 창은 한 겹일 뿐"이라고 한 게 이 구조를 두고 한 말입니다.

### Case 3. 컨텍스트가 찰 때 — 다섯 셰이퍼가 각각 하는 일

4부에서 5단계 압축을 소개했는데, 각각이 실제로 무엇을 반환하고 어떻게 다른지가 흥미롭습니다. 다섯 개 모두 `query.ts`에서 **모델 호출 전마다** 순차 실행되며, `messagesForQuery` 배열을 대상으로 합니다.

**`applyToolResultBudget()`** — 메시지당 크기 상한을 강제합니다. 예외가 있는데, `maxResultSizeChars`가 유한하지 않은 도구는 출력이 온전히 유지됩니다. 잘리면 안 되는 도구가 따로 지정돼 있다는 뜻입니다.

**`snipCompactIfNeeded()`** — `HISTORY_SNIP` 플래그로 켜집니다. 오래된 구간을 가볍게 잘라내고 `{messages, tokensFreed, boundaryMessage}`를 돌려줍니다. **얼마나 확보했는지를 숫자로 반환**한다는 점이 중요합니다. 다음 셰이퍼를 돌릴지 판단하는 근거가 됩니다.

**마이크로컴팩트** — `CACHED_MICROCOMPACT`로 제어됩니다. 시간 기반 경로는 항상 돌고, 캐시 인식 경로는 선택적입니다. 캐시 경로가 켜지면 **경계 메시지를 API 응답 이후로 미룹니다.** 프롬프트 캐시를 깨지 않으려는 최적화입니다.

**컨텍스트 콜랩스** — 여기가 가장 영리한 부분입니다. 다른 셰이퍼와 달리 **저장된 대화 기록을 건드리지 않습니다.** 읽는 시점에 투영(projection)만 해서 `messagesForQuery`를 축약된 뷰로 갈아끼웁니다.

무슨 뜻이냐면, **모델에게 보내는 버전만 짧아지고 원본은 그대로 남습니다.** 나중에 필요하면 다시 펼칠 수 있습니다. 되돌릴 수 없는 압축과 되돌릴 수 있는 축약이 구분돼 있는 겁니다.

**자동 압축 (`compact.ts`)** — 마지막 수단. `PreCompact` 훅을 실행하고, `getCompactPrompt()`로 요약 요청을 만들어 모델을 호출합니다. **앞의 네 개를 다 돌리고도 압력이 남아 있을 때만** 발동합니다.

앞의 넷과 이것의 차이가 결정적입니다. 넷은 잘라내거나 가리는 것이고, 이것만 **모델이 새로 쓴 요약으로 대체**합니다. 4부에서 "초반 지시가 사라지는 지점"이라고 한 게 정확히 여기입니다.

### Case 4. 서브에이전트를 띄울 때 — 무엇이 갈라지나

`AgentTool.tsx`와 `runAgent.ts`가 담당합니다. 눈여겨볼 점은 서브에이전트가 특별 취급을 받지 않는다는 것입니다. **다른 도구와 똑같이 `buildTool()` 팩토리를 거칩니다.** 모델 입장에서는 파일을 읽는 것과 하위 에이전트를 띄우는 것이 같은 종류의 행위입니다.

띄우면 `queryLoop()`에 **재진입**합니다. 같은 루프가 격리된 컨텍스트로 다시 도는 겁니다. 재귀 구조죠.

기록은 분리됩니다. **사이드체인 트랜스크립트**(`sessionStorage.ts`)가 하위 에이전트의 대화를 별도 파일에 저장합니다. 부모 트랜스크립트에는 들어가지 않습니다. 4부의 격리 그림이 파일 수준에서도 그대로 구현돼 있는 셈입니다.

권한 쪽에 재밌는 게 하나 있습니다. 5부의 권한 모드 표에 없는 **`bubble`이라는 내부 전용 모드**가 존재합니다. 타입 정의에는 있지만 사용자가 고를 수 있는 모드 배열 어디에도 없습니다. 용도는 **하위 에이전트의 권한 승격을 부모에게 올려보내는 것**입니다. 하위가 스스로 판단하지 못하는 권한 요청은 부모에게 올라갑니다. 그래서 하위 에이전트의 권한이 부모를 넘을 수 없습니다.

### Case 5. 잘못됐을 때 — 복구 경로들

이 부분이 개인적으로 제일 흥미로웠습니다. 실패했을 때 그냥 죽지 않고 여러 단계로 살려보려 합니다.

**출력 토큰 상한에 걸렸을 때.** 상한을 올려서 재시도합니다. 다만 무한정은 아니고 **턴당 최대 3회**입니다(`MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3`). 기능 플래그로 제어되고, 사용자가 직접 상한을 지정했거나 환경변수 상한이 있으면 이 복구를 하지 않습니다. 사용자가 정한 한계를 시스템이 몰래 넘지 않는다는 뜻입니다.

**프롬프트가 너무 길다는 오류가 왔을 때.** 이게 3단 방어입니다. 먼저 컨텍스트 콜랩스 오버플로 복구를 시도하고, 그다음 리액티브 압축을 시도하고, **둘 다 실패해야** `prompt_too_long`으로 종료합니다.

리액티브 압축에는 안전장치가 붙어 있습니다. `hasAttemptedReactiveCompact` 플래그로 **턴당 한 번만** 발동합니다. 압축하고 또 넘치고 또 압축하는 무한 루프를 막기 위해서입니다. 실제로 파일 하나가 너무 커서 압축해도 바로 다시 차는 상황이 있는데, 이때는 몇 번 시도하다 포기하고 오류를 보여줍니다. 공식 문서에도 "auto-compaction thrashing"으로 언급돼 있습니다.

**Bash 명령 하나가 터졌을 때.** `StreamingToolExecutor`에 **형제 중단 컨트롤러**가 있습니다. 병렬로 돌던 Bash 중 하나가 에러를 내면 나머지 진행 중인 자식 프로세스를 **즉시 종료**합니다. 어차피 실패한 작업의 나머지 절반을 끝까지 돌릴 이유가 없으니까요.

**모델 자체가 문제일 때.** `fallbackModel` 파라미터로 대체 모델로 전환하고, 스트리밍이 문제면 `onStreamingFallback` 콜백으로 다른 전략으로 재시도합니다.

이 설계에서 읽히는 원칙이 있습니다. **자동 복구는 하되, 횟수를 세고, 사용자가 정한 한계는 넘지 않는다.** 세 가지가 다 지켜지고 있습니다.

### Case 6. 세션을 다시 열 때 — 복원되는 것과 안 되는 것

여기부터는 공식 문서에 명시된 내용이라 신뢰도가 높습니다.

대화는 진행되는 대로 `~/.claude/projects/` 아래에 **JSONL 평문 파일**로 쌓입니다. 메시지, 도구 사용, 결과가 전부 한 줄씩 append 됩니다. 전역 프롬프트 이력은 `history.jsonl`에 따로 남습니다.

`claude --resume`이나 `--continue`는 **같은 세션 ID로 열어 뒤에 이어 붙입니다.** `--fork-session`이나 `/branch`는 **기록을 복사해 새 ID를 만들고 원본은 그대로 둡니다.** 다른 방향을 시도해보고 싶을 때 원본을 지키면서 갈라질 수 있습니다.

그런데 여기 **의도적으로 복원되지 않는 것**이 하나 있습니다.

**세션 범위 권한은 resume에서도 fork에서도 복원되지 않습니다.**

어제 "이 명령 허용"을 눌렀다고 오늘 자동으로 허용되지 않습니다. 처음엔 불편하게 느껴지는데, 생각해보면 이게 맞습니다. 오래된 승인이 슬그머니 살아남으면, 상황이 바뀐 뒤에도 예전 판단으로 실행됩니다. **승인은 그때의 맥락에 붙은 것이지 영구 자격이 아니라는 관점**입니다. 5부의 93% 승인률 문제를 생각하면 더 그렇습니다.

체크포인트는 별개로 동작합니다. 파일을 고치기 전에 내용을 스냅샷해두기 때문에 `Esc`를 두 번 누르면 되돌릴 수 있습니다. **git과 무관하게 동작하고 세션을 재개해도 남아 있습니다.** 다만 한계가 분명합니다. 심볼릭 링크와 하드 링크는 복원되지 않고, **원격 시스템에 일어난 일(DB 변경, API 호출, 배포)은 체크포인트로 되돌릴 수 없습니다.** 그건 권한 모드와 규칙으로 막는 수밖에 없습니다.

### 이 여섯 가지에서 읽히는 것

전체를 관통하는 설계 철학이 하나 보입니다.

**모델에게는 최대한의 판단 자유를 주되, 그 판단이 놓이는 판은 결정적으로 짠다.**

도구 목록은 모델이 보기 전에 필터링되고, 대화는 셰이퍼를 거친 뒤에 전달되고, 거부는 항상 허용을 이기고, 복구 시도 횟수는 상수로 박혀 있고, 권한은 세션을 넘겨받지 않습니다. 모델이 자유롭게 추론하는 영역과 시스템이 기계적으로 보장하는 영역이 명확히 갈려 있습니다.

역분석 논문의 표현을 빌리면, 이건 **명시적인 플래너나 상태 그래프를 얹는 대신 풍부한 실행 환경과 세밀한 컨텍스트 관리에 투자한 선택**입니다. 모델이 좋아질수록, 제약된 의사결정 절차보다는 결정적인 가드레일 안에서의 추론 자유가 더 이득이라는 쪽에 건 겁니다.

LangGraph 같은 그래프 오케스트레이터와 정확히 반대 방향의 베팅이라는 점이 흥미롭습니다. 어느 쪽이 맞았는지는 몇 년 더 지나야 알 것 같습니다.

---

## 8부. 비전공자가 실제로 써보면 어떤 경험인가

여기부터는 개발 경험이 없는 분들을 위한 내용입니다.

### 설치는 생각보다 간단합니다

터미널이 익숙하지 않으면 데스크톱 앱이 편합니다. 파일이 눈에 보이고 클릭으로 대부분 됩니다. 세팅 자체는 15분 안에 끝납니다.

진입 장벽은 설치가 아니라 그 다음입니다.

### 제일 중요한 능력은 기술 지식이 아니라 '구체성'입니다

**막연한 요청은 막연한 결과를 만듭니다.** 이게 비전공자 바이브 코딩의 가장 큰 변수입니다.

"직원들이 쓸 관리 도구 만들어줘" — 이건 거의 반드시 실패합니다.

"엑셀 파일을 올리면 부서별 인원수를 세서 표로 보여주는 웹페이지를 만들어줘. 파일 형식은 이렇게 생겼어." — 이건 됩니다.

기술 용어를 몰라도 됩니다. **무엇을 넣으면 무엇이 나와야 하는지**를 구체적으로 말할 수 있으면 충분합니다. 오히려 업무를 잘 아는 현업이 유리한 지점입니다.

### 물어보는 사람이 성공합니다

인상적인 조사 결과가 하나 있습니다. AI가 만든 코드에 대해 **되물어본 사람들은 이해도 평가에서 65% 이상**을 받았고, **그냥 받아들인 사람들은 40% 미만**이었습니다.

그래서 저는 비전공자분들께 이 습관을 권합니다.

> "방금 뭘 한 건지 비개발자한테 설명하듯 알려줘."

Claude Code는 이걸 아주 잘합니다. 그리고 이 질문을 반복하면 몇 주 만에 실제로 시스템 구조를 이해하게 됩니다. 코드를 못 써도요.

### 한 번에 하나씩

**층층이 쌓아야 합니다.** 기능 하나 요청하고, 되는지 확인하고, 다음으로 갑니다.

한꺼번에 열 개를 시키면 뭐가 어디서 꼬였는지 알 수 없는 덩어리가 나옵니다. 그리고 그 상태에서 "고쳐줘"라고 하면 더 꼬입니다.

### 에러 메시지는 실패가 아니라 정보입니다

빨간 글씨가 나오면 당황하시는데, 그건 대부분 **가장 유용한 정보**입니다. 그대로 복사해서 "이런 에러가 났어"라고 붙여넣으면 초보자가 겪는 문제의 상당수가 바로 해결됩니다.

에러 메시지를 무서워하지 않는 것, 이게 비전공자와 개발자의 실질적인 차이 중 하나입니다.

### 할 수 있는 것과 어려운 것

경험상 이렇게 갈립니다.

잘 되는 쪽은 개인 업무 자동화(반복 엑셀 작업, 파일 정리, 데이터 변환), 사내용 간단한 도구, 프로토타입과 데모, 기존 데이터 분석과 시각화입니다.

어려운 쪽은 실제 고객이 쓰는 서비스, 민감정보를 다루는 시스템, 기존 레거시와 깊게 얽힌 작업, 그리고 **본인이 요구사항을 정의하지 못하는 일**입니다. 마지막 건 AI 문제가 아니라 기획 문제입니다.

---

## 9부. 회사에서 쓸 때 알아야 할 리스크

좋은 얘기만 하면 균형이 안 맞으니, 최근 수치들을 정직하게 옮기겠습니다.

### 보안

API 보안 업체 Escape.tech가 실제 운영 중인 바이브 코딩 애플리케이션 1,400여 개를 스캔한 결과입니다.

- 65%에서 보안 이슈 발견
- 58%에 심각도 '치명적' 취약점이 하나 이상 존재
- 노출된 시크릿(비밀키) 400건 이상, 개인정보 노출 175건

GitGuardian의 2026년 보고서에서는 AI가 관여한 커밋의 **비밀키 유출률이 3.2%로, 기준선 1.5%의 약 두 배**였습니다.

포춘 50대 기업을 대상으로 한 조사에서는 더 선명합니다. AI를 쓴 개발자는 커밋을 **3~4배** 많이 만들었지만, 보안 지적사항은 **10배** 많이 만들었습니다.

### 기술 부채

코드 중복은 48% 늘고 리팩토링 활동은 60% 줄었다는 보고가 있습니다. 테스트 커버리지가 업계 평균 68%에서 12%까지 떨어진 사례도 나옵니다.

### 이 숫자들을 어떻게 읽어야 하나

저는 이 수치들이 "AI가 위험하다"가 아니라 **"검토 없는 속도가 위험하다"**를 말한다고 봅니다.

생산량이 3~4배가 되면 리뷰 부담도 3~4배가 됩니다. 그런데 리뷰 프로세스는 그대로 두는 경우가 많습니다. 그러면 통과율이 떨어지는 게 아니라 **리뷰가 형식화**됩니다. 앞서 나온 93% 승인률과 정확히 같은 구조입니다.

그래서 사내 도입에서 진짜 논점은 "AI를 쓸까 말까"가 아니라 **"늘어난 산출물을 어떤 게이트로 거를까"** 입니다.

---

## 10부. 실무 권장 흐름

정리하면 이런 순서를 권합니다.

**조사 → 계획 → 실행 → 검토 → 배포.**

조사 단계에서는 아무것도 고치지 않습니다. `plan` 모드가 이 단계를 위해 있습니다. 무엇을 건드릴 건지 먼저 듣습니다.

계획 단계에서는 AI가 제시한 계획을 사람이 읽고 승인합니다. 여기서 걸러내는 게 나중에 코드에서 걸러내는 것보다 훨씬 쌉니다.

실행 단계는 작은 단위로 끊습니다. 한 번에 하나. 그리고 매번 확인합니다.

검토 단계에서는 자동 검사(훅, 린터, 테스트)를 먼저 돌리고, 그 다음에 사람이 봅니다. 반대 순서로 하면 사람이 기계가 잡을 수 있는 걸 잡느라 지칩니다.

배포는 기존 프로세스를 그대로 씁니다. AI가 만들었다고 게이트를 건너뛰면 안 됩니다.

몇 가지 실무 팁을 덧붙이면.

- `CLAUDE.md`는 **짧게** 유지하세요. 매 요청에 들어가는 비용입니다. 긴 설명은 스킬로 빼세요
- 긴 세션은 주기적으로 끊으세요. 압축이 여러 번 일어난 세션은 초반 맥락이 흐려집니다
- 조사성 작업은 서브에이전트에 맡기세요. 본체 컨텍스트를 아낍니다
- 위험한 명령은 훅으로 막으세요. 확인 창을 믿지 마세요
- 회사 코드를 다룰 때는 사내 AI 사용 정책을 먼저 확인하세요. 이건 기술 문제가 아니라 규정 문제입니다

---

## 11부. 예상 질문 정리

사내에서 실제로 받았던 질문들입니다.

**Q. 개발자 없어도 되나요?**
아닙니다. 오히려 검토할 사람이 더 필요해집니다. 만드는 속도는 빨라지는데 판단하는 속도는 그대로거든요. 다만 개발자가 하는 일의 무게중심이 "작성"에서 "설계와 검토"로 옮겨갑니다.

**Q. 코드를 못 읽는데 결과를 어떻게 믿나요?**
동작으로 검증하시면 됩니다. 넣어야 할 값을 넣고 나와야 할 값이 나오는지 확인하는 것, 이건 코드를 몰라도 할 수 있습니다. 다만 **보안과 성능은 동작만으로 검증되지 않습니다.** 그래서 외부에 나가는 것은 반드시 개발자 검토를 거쳐야 합니다.

**Q. 우리 회사 코드를 AI에 보내도 되나요?**
사내 정책 확인이 먼저입니다. 기술적으로는 무엇이 전송되는지 통제할 수 있지만, 그건 정책이 정해진 다음의 얘기입니다.

**Q. 왜 아까 말한 걸 까먹나요?**
4부의 자동 압축 때문일 가능성이 큽니다. 계속 지켜야 할 규칙은 `CLAUDE.md`에 적으세요.

**Q. 비용이 얼마나 드나요?**
사용량에 따라 다릅니다. 컨텍스트가 클수록, 턴이 많을수록 늘어납니다. 다만 반복되는 앞부분(시스템 프롬프트, 프로젝트 규칙)은 캐싱되기 때문에 생각보다는 덜 나옵니다. 조사성 작업을 서브에이전트로 빼고 세션을 적당히 끊는 게 비용 관리에도 도움이 됩니다.

**Q. 뭐부터 시작하면 되나요?**
본인 업무 중에 **반복적이고, 결과가 명확하고, 틀려도 안 위험한 것** 하나를 고르세요. 매주 하는 엑셀 정리 같은 것이요. 그걸로 감을 잡은 다음에 범위를 넓히시면 됩니다.

---

## 마무리

Claude Code를 이해하는 데 필요한 건 결국 세 가지입니다.

**루프**입니다. 판단하고, 도구를 쓰고, 결과를 보고, 다시 판단합니다. 스스로 확인한다는 점이 챗봇과의 결정적 차이입니다.

**컨텍스트**입니다. 유한한 자원이고, 차면 압축되고, 압축되면 정보가 사라집니다. 그래서 무엇을 기억시킬지를 설계해야 합니다.

**권한**입니다. 겹겹이 있지만 확인 창은 생각만큼 안전하지 않습니다. 진짜 방어선은 규칙과 격리와 자동 검사입니다.

이 세 가지를 알면 도구가 왜 이렇게 동작하는지 대부분 설명이 되고, 어디서 사고가 날지도 예상할 수 있습니다.

마지막으로 한 가지만 덧붙이면, 저는 비전공자분들이 이 도구를 쓰는 게 위험하다고 생각하지 않습니다. 위험한 건 **결과를 이해하려 하지 않는 태도**입니다. 아까 그 65% 대 40% 차이가 딱 그 지점을 가리킵니다.

"방금 뭘 한 거야?"라고 계속 물어보시면 됩니다. 그거면 충분합니다.

---

## 이어지는 글

이 글은 원리 쪽이었습니다. **실제로 내 업무 폴더에 어떻게 앉히는지**는 따로 정리했습니다.

→ [내 업무 폴더에 Claude Code 앉히기 — 비개발자용 파일 관리 실전](/posts/ai-llm/2026-08-21-claude-code-for-office-work)

폴더를 어떻게 나누고, `CLAUDE.md`에 뭘 적고, 반복되는 일을 어떻게 스킬로 굳히는지를 업무 유형 세 가지(리포트 생성 / 파일 정리 / 데이터 대조)로 나눠 다룹니다.

---

## 참고 자료

- [How the agent loop works — Claude Code 공식 문서](https://code.claude.com/docs/en/agent-sdk/agent-loop) — 루프, 턴, 도구, 권한 모드, 컨텍스트 관리의 1차 출처
- [Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems](https://arxiv.org/html/2604.14228v2) — 내부 구조 분석 논문. 5단계 압축 파이프라인, 권한 모드, 93% 승인률 통계
- [Vibe Coding Security Crisis: Credential Sprawl and SDLC Debt — Cloud Security Alliance](https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-security-vibe-coding-202/) — 보안 수치의 출처
- [Vibe coding is passé — The New Stack](https://thenewstack.io/vibe-coding-is-passe/) — 용어가 에이전틱 엔지니어링으로 옮겨간 배경
- [Claude Code for Non-Developers](https://ccforeveryone.com/guides/claude-code-for-non-developers) — 비전공자 관점의 실무 가이드
