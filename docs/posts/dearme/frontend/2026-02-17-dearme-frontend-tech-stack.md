---
title: "DearMe 프론트엔드 — 기술 스택 선택과 프로젝트 구조"
date: 2026-02-17T10:00:00
---

# DearMe 프론트엔드 — 기술 스택 선택과 프로젝트 구조

DearMe는 일기를 기반으로 AI 페르소나를 만들어주는 서비스다. 혼자 개발하고 있다. 프론트엔드 기술 스택을 고를 때 가장 많이 고민한 건 "이걸로 끝까지 갈 수 있을까?"였는데, 돌이켜보면 그 고민 자체가 좀 과했던 것 같기도 하다. 결국 중요한 건 익숙함과 생태계 크기였다.

이 글에서는 DearMe 프론트엔드에서 어떤 기술을 왜 선택했는지, 그리고 프로젝트 폴더를 어떤 원칙으로 나눴는지를 이야기한다.

## React + TypeScript, 결국 레퍼런스의 힘

솔직히 나도 Vue나 Svelte를 잠깐 고민했다. 특히 Svelte는 번들 크기도 작고 문법도 깔끔해서 끌리는 부분이 있었다. 그런데 1인 개발에서 결정적인 건 따로 있다. **"이 기능 어떻게 구현하지?"라고 검색했을 때 답이 나오는 속도**가 생산성에 직결된다.

React 생태계는 압도적이다. Stack Overflow든 GitHub 이슈든, 웬만한 문제는 누군가 이미 겪었고 해결책을 올려놨다. 1인 개발자에게 이건 꽤 큰 차이다. 팀이 있으면 동료한테 물어볼 수 있지만, 혼자서는 검색이 유일한 동료니까.

TypeScript는 strict 모드로 쓰고 있다. `any` 타입 쓰지 않으려고 노력하는 편인데, 가끔 외부 라이브러리 타입이 애매할 때는 솔직히 유혹이 크다. 그래도 strict 모드 덕분에 런타임에서 터지는 에러가 눈에 띄게 줄었다. 처음에는 타입 정의하느라 시간이 더 걸리는 것 같았는데, 프로젝트가 커지면서 오히려 리팩토링할 때 타입이 가이드 역할을 해줘서 훨씬 편해졌다.

## Vite — CRA는 이제 역사 속으로

CRA(Create React App)로 시작하려다가 공식 문서를 보니 더 이상 유지보수되지 않는다는 걸 알았다. 이 시점에서 선택지는 Vite 아니면 Next.js였는데, DearMe는 SSR이 필요 없는 순수 SPA라서 Next.js까지 가져올 이유가 없었다.

Vite의 개발 서버는 진짜 빠르다. ESBuild 기반이라 콜드 스타트가 거의 즉시고, HMR도 체감될 정도로 빠르다. CRA에서 `npm start` 치고 멍하니 기다리던 시절을 생각하면 격세지감이다. 프로덕션 빌드에는 Rollup을 써서 tree-shaking이랑 코드 스플리팅도 자동으로 해준다.

그리고 사소하지만 편한 게 하나 있다. 경로 별칭 설정이다.

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

이걸 해두면 `import { api } from '../../../lib/api'` 대신 `import { api } from '@/lib/api'`로 쓸 수 있다. 깊은 디렉토리에서 `../../..` 지옥을 겪어본 사람이라면 이게 얼마나 편한지 알 거다. 참고로 `tsconfig.json`에도 같은 paths 설정을 해줘야 한다.

## 상태 관리 — Zustand과 TanStack Query 조합

상태 관리를 어떻게 할지가 아마 가장 많이 고민한 부분이었을 거다. 처음에는 Redux Toolkit을 깔았다가 보일러플레이트 양을 보고 바로 지웠다. 슬라이스 만들고, 리듀서 정의하고, 타입 잡고... 1인 개발 프로젝트에서 이 모든 걸 관리하는 건 좀 오버엔지니어링이라고 느꼈다.

### Zustand — store 하나가 파일 하나

Zustand은 정말 간결하다. store 하나가 파일 하나로 끝난다. `persist` 미들웨어를 쓰면 localStorage 영속화도 한 줄이면 된다. DearMe에서 Zustand이 관리하는 건 테마 설정이나 인증 토큰 같은 **클라이언트 상태**, 즉 서버와 무관한 데이터들이다.

### 그런데 서버 데이터는?

여기서 중요한 분리가 하나 있다. 일기 목록, 페르소나 데이터, 알림 같은 건 서버에서 오는 데이터다. 이걸 Zustand에 같이 넣으면 어떻게 될까? 캐시 무효화, 재검증, 페이지네이션 같은 걸 전부 직접 구현해야 한다. 처음에 이렇게 했다가 코드가 빠르게 복잡해지는 걸 경험했다.

그래서 서버 상태는 TanStack Query에 맡겼다. `staleTime`, `queryKey` 기반으로 캐싱과 재검증을 자동 처리해준다.

```typescript
// queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 fresh
      retry: 1,
    },
  },
})
```

`staleTime: 5분`이면, 같은 queryKey로 5분 내에 다시 요청할 때 네트워크 요청 없이 캐시된 데이터를 돌려준다. 일기 목록이나 페르소나 데이터처럼 자주 바뀌지 않는 데이터에 딱 맞는 설정이다.

정리하면 이렇다. 클라이언트 상태(테마, 인증 토큰 등)는 Zustand, 서버 상태(일기, 페르소나, 알림 등)는 TanStack Query. 이 두 가지를 하나의 도구로 합치면 복잡도가 급격히 올라가는데, 분리하니까 각자 할 일만 깔끔하게 하는 느낌이다.

## Tailwind CSS + CSS 변수 디자인 시스템

스타일링은 Tailwind CSS를 선택했다. CSS 파일을 별도로 관리하지 않아도 되는 게 1인 개발에서 꽤 큰 장점이다. 컴포넌트 파일 하나만 보면 구조와 스타일이 다 보이니까.

다크모드 전환은 shadcn/ui 스타일의 CSS 변수 기반 테마 시스템을 참고했다.

```css
:root {
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
}
.dark {
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
}
```

이렇게 해두면 Tailwind에서 `bg-primary`, `text-primary-foreground` 같은 클래스로 쓸 수 있고, 테마 전환은 CSS 변수만 바꾸면 끝이다. 처음 설정할 때는 좀 번거롭지만, 한번 잡아두면 이후에는 거의 신경 쓸 일이 없다.

이건 좀 의견이 갈릴 수 있는데, Tailwind이 클래스가 길어져서 가독성이 떨어진다는 비판도 있다. 맞는 말이다. 특히 반응형까지 들어가면 클래스가 한 줄을 넘기기도 한다. 그래도 CSS 파일과 컴포넌트 파일 사이를 왔다갔다하는 것보다는 한 곳에 다 있는 게 내 작업 흐름에는 더 맞았다.

## 프로젝트 구조 — 나름의 원칙 세 가지

프로젝트가 커지면서 폴더 구조를 몇 번 바꿨다. 지금 형태가 완벽하다고는 못 하겠지만, 나름대로 세 가지 원칙을 지키려고 한다.

### services 레이어 — API 호출의 관문

```
src/services/
├── authService.ts
├── diaryService.ts
├── personaService.ts
├── chatService.ts
├── friendService.ts
├── mentalService.ts
└── ...
```

컴포넌트에서 Axios를 직접 호출하지 않는다. 모든 API 호출은 services 레이어를 거친다. 처음에는 "이거 그냥 한 단계 더 감싸는 거 아닌가?" 싶었는데, API 엔드포인트가 바뀌거나 요청 형식이 달라질 때 서비스 파일만 수정하면 되니까 실질적으로 편하다. 특히 백엔드를 같이 개발하고 있어서 API가 자주 바뀌는 환경에서는 이 분리가 꽤 빛을 발한다.

### pages vs components — 역할의 차이

```
src/pages/           # 라우트에 1:1 매핑
├── diary/           # DiaryListPage, DiaryNewPage, DiaryDetailPage
├── persona/         # PersonaPage, PersonaChatPage
├── friend/          # FriendListPage
├── mental/          # MentalDashboardPage
└── ...

src/components/      # 재사용 가능한 UI 조각
├── common/          # Layout, Header, BottomTabBar, ProtectedRoute
├── ui/              # ConfirmDialog, Loading, Button
├── diary/           # 일기 관련 컴포넌트
├── persona/         # 페르소나 카드, 진화 UI
├── chat/            # 채팅 메시지, 입력 바
└── ...
```

`pages/`는 라우트에 1:1로 매핑되는 최상위 컴포넌트다. `components/`는 여러 페이지에서 재사용할 수 있는 UI 조각들이다. 규칙은 단순한데, 페이지 컴포넌트가 비대해지면 그 안의 섹션을 `components/` 쪽으로 분리한다.

삽질 끝에 알게 된 건, 이 분리 기준을 너무 엄격하게 적용하려고 하면 오히려 파일만 늘어난다는 거다. "이 컴포넌트가 다른 곳에서도 쓰일까?"를 진지하게 생각해보고, 지금 당장 아니면 그냥 페이지 안에 두는 편이다. 나중에 필요해지면 그때 분리해도 늦지 않다.

### types 독립 — 순환 참조 방지

```
src/types/
├── auth.ts
├── diary.ts
├── persona.ts
├── chat.ts
└── ...
```

타입 정의를 별도 디렉토리로 뺐다. 이유는 간단하다. services에서도, components에서도, pages에서도 같은 타입을 import해야 하는데, 타입이 특정 레이어에 묶여 있으면 순환 참조가 생기기 쉽다. types를 독립시키면 어디서든 자유롭게 가져다 쓸 수 있다.

## 전체 기술 스택 한눈에

```json
{
  "core": "React 18 + TypeScript 5",
  "build": "Vite 5",
  "styling": "Tailwind CSS 3",
  "client-state": "Zustand 4 (persist middleware)",
  "server-state": "TanStack Query 5",
  "http": "Axios",
  "routing": "React Router DOM 6",
  "icons": "Lucide React",
  "charts": "Recharts",
  "toast": "Sonner",
  "pwa": "vite-plugin-pwa (Workbox)",
  "share": "html2canvas"
}
```

Axios는 인터셉터가 편해서 선택했고, React Router DOM 6는 사실상 React에서 라우팅의 표준이라 별다른 고민 없이 가져왔다. Lucide React는 아이콘 라이브러리인데, tree-shaking이 잘 돼서 쓰는 아이콘만 번들에 포함된다. Sonner는 토스트 알림 라이브러리로, 설정이 거의 필요 없어서 좋다.

## 아직 고민 중인 것들

솔직히 lazy loading을 아직 적용하지 않았다. 지금은 앱 규모가 크지 않아서 초기 로딩이 문제될 정도는 아닌데, 기능이 계속 붙고 있어서 조만간 라우트별 코드 스플리팅을 해야 할 것 같다.

그리고 테스트. 내 경험상 1인 개발에서 테스트 커버리지를 높게 유지하는 건 현실적으로 쉽지 않다. 지금은 핵심 로직 위주로만 테스트하고 있는데, 서비스가 안정화되면 컴포넌트 테스트도 추가할 계획이다. 계획이라고 쓰고 희망이라고 읽는 건 비밀이다.

기술 스택 선택에 정답은 없다고 생각한다. 다만 1인 개발에서는 "내가 가장 빠르게 움직일 수 있는 조합"이 최선이었고, 지금까지는 이 스택으로 크게 후회한 적이 없다. 다음 글에서는 이 구조 위에서 Zustand과 TanStack Query를 실제로 어떻게 조합해서 쓰고 있는지, 그리고 그 과정에서 겪은 삽질들을 더 자세히 다뤄볼 생각이다.
