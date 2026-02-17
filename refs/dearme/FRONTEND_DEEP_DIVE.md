# DearMe 프론트엔드 기술 Deep Dive

> 일기 기반 AI 페르소나 서비스 "DearMe"의 프론트엔드 아키텍처를 깊이 있게 다루는 기술 문서입니다.
> PWA, 버전 관리, 캐싱 전략, 인증, SSE 스트리밍 등 실제 서비스를 운영하면서 마주친 문제와 해결 과정을 담았습니다.

---

## 목차

1. [기술 스택과 선택 이유](#1-기술-스택과-선택-이유)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [빌드 시스템: Vite와 2-Stage Docker 빌드](#3-빌드-시스템-vite와-2-stage-docker-빌드)
4. [배포 아키텍처: 코드에서 사용자까지](#4-배포-아키텍처-코드에서-사용자까지)
5. [버전 관리: 왜 수동 버전을 쓰는가](#5-버전-관리-왜-수동-버전을-쓰는가)
6. [캐싱 전략: Nginx, Vite 해시, Service Worker 삼중주](#6-캐싱-전략-nginx-vite-해시-service-worker-삼중주)
7. [PWA: 웹앱을 네이티브처럼](#7-pwa-웹앱을-네이티브처럼)
8. [상태 관리: Zustand + TanStack Query 이중 구조](#8-상태-관리-zustand--tanstack-query-이중-구조)
9. [인증 플로우: JWT + Zustand Hydration 문제](#9-인증-플로우-jwt--zustand-hydration-문제)
10. [SSE 스트리밍: AI 대화의 실시간 응답](#10-sse-스트리밍-ai-대화의-실시간-응답)
11. [에러 처리: 백엔드 영어 → 프론트엔드 한국어 번역 패턴](#11-에러-처리-백엔드-영어--프론트엔드-한국어-번역-패턴)
12. [모바일 최적화: iOS Safari와의 전쟁](#12-모바일-최적화-ios-safari와의-전쟁)
13. [개발 환경 vs 프로덕션 환경](#13-개발-환경-vs-프로덕션-환경)
14. [배포 프로세스 전체 흐름](#14-배포-프로세스-전체-흐름)
15. [마주친 문제들과 교훈](#15-마주친-문제들과-교훈)

---

## 1. 기술 스택과 선택 이유

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

### React 18 + TypeScript

React를 선택한 가장 큰 이유는 생태계입니다. 1인 개발에서는 "이 기능 어떻게 구현하지?"라는 질문에 대한 레퍼런스가 얼마나 많은지가 속도에 직결됩니다. TypeScript strict 모드를 사용하여 런타임 에러를 최소화하고, `any` 타입 사용을 지양합니다.

### Vite를 빌드 도구로 선택한 이유

CRA(Create React App)는 더 이상 유지보수되지 않고, 개발 서버 시작 속도가 느립니다. Vite는 ESBuild 기반 개발 서버로 콜드 스타트가 거의 즉시이고, HMR(Hot Module Replacement)도 체감될 정도로 빠릅니다. 프로덕션 빌드에는 Rollup을 사용하여 tree-shaking과 코드 스플리팅을 자동 처리합니다.

### Zustand vs Redux

Redux는 보일러플레이트가 과도합니다. Zustand은 store 하나가 파일 하나로 끝나고, `persist` 미들웨어로 localStorage 영속화도 한 줄이면 됩니다. DearMe 같은 중소 규모 앱에서 Redux Toolkit + RTK Query까지 가져오는 건 오버엔지니어링이라고 판단했습니다.

### TanStack Query로 서버 상태 분리

클라이언트 상태(테마, 인증 토큰)와 서버 상태(일기 목록, 페르소나 데이터)를 분리하는 것이 핵심입니다. Zustand에 서버 데이터까지 넣으면 캐시 무효화, 재검증, 페이지네이션 등을 직접 구현해야 합니다. TanStack Query는 이를 `staleTime`, `queryKey` 기반으로 자동 처리합니다.

```typescript
// queryClient.ts - 전역 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 fresh
      retry: 1,                 // 실패 시 1회만 재시도
    },
  },
})
```

`staleTime: 5분`의 의미: 같은 queryKey로 5분 내에 다시 요청하면 네트워크 요청 없이 캐시된 데이터를 반환합니다. 일기 목록이나 페르소나 데이터처럼 자주 바뀌지 않는 데이터에 적합합니다.

### Tailwind CSS + CSS 변수 디자인 시스템

Tailwind은 유틸리티 클래스 방식으로, CSS 파일을 별도로 관리하지 않아도 됩니다. shadcn/ui 스타일의 CSS 변수 기반 테마 시스템을 사용하여 다크모드 전환도 CSS 변수만 바꾸면 됩니다:

```css
:root {
  --primary: 239 84% 67%;          /* HSL 값 */
  --primary-foreground: 0 0% 100%;
}
.dark {
  --primary: 239 84% 67%;          /* 다크모드에서 동일 or 조정 */
  --primary-foreground: 0 0% 100%;
}
```

Tailwind에서 `bg-primary`, `text-primary-foreground` 같은 클래스로 사용하면 테마에 따라 자동 전환됩니다.

---

## 2. 프로젝트 구조

```
frontend/src/
├── main.tsx              # 앱 진입점 (버전 체크 + SW 등록)
├── App.tsx               # 라우팅 정의 (Public/Protected)
├── index.css             # Tailwind + CSS 변수 + iOS 핵
│
├── components/
│   ├── common/           # Layout, Header, BottomTabBar, ProtectedRoute
│   ├── ui/               # ConfirmDialog, Loading, Button 등 공통 UI
│   ├── pwa/              # InstallPrompt, UpdatePrompt
│   ├── diary/            # 일기 관련 컴포넌트
│   ├── persona/          # 페르소나 카드, 진화 UI
│   ├── chat/             # 채팅 메시지, 입력 바
│   └── friend/           # 친구 목록, 추천 등
│
├── pages/                # 라우트별 페이지 컴포넌트
│   ├── diary/            # DiaryListPage, DiaryNewPage, DiaryDetailPage
│   ├── persona/          # PersonaPage, PersonaChatPage
│   ├── friend/           # FriendListPage
│   ├── mental/           # MentalDashboardPage, BookRecommendation, Report
│   ├── profile/          # ProfilePage
│   ├── premium/          # PremiumPage
│   ├── quiz/             # QuizPage
│   ├── legal/            # PrivacyPolicy, TermsOfService
│   └── ...               # LoginPage, RegisterPage, LandingPage 등
│
├── services/             # API 호출 함수 (Axios 기반)
│   ├── authService.ts
│   ├── diaryService.ts
│   ├── personaService.ts
│   ├── chatService.ts    # SSE 스트리밍 포함
│   ├── friendService.ts
│   ├── mentalService.ts
│   ├── subscriptionService.ts
│   ├── notificationService.ts
│   ├── paymentService.ts
│   └── quizService.ts
│
├── store/                # Zustand 클라이언트 상태
│   └── authStore.ts      # 인증 상태 (persist middleware)
│
├── types/                # TypeScript 타입 정의
│   ├── auth.ts
│   ├── diary.ts
│   ├── persona.ts
│   ├── chat.ts
│   └── ...
│
├── hooks/                # 커스텀 훅
│   └── usePWA.ts         # useInstallPrompt, useSWUpdate
│
├── lib/                  # 유틸리티
│   ├── api.ts            # Axios 인스턴스 + 인터셉터
│   ├── queryClient.ts    # TanStack Query 클라이언트
│   ├── version.ts        # 앱 버전 관리
│   ├── error.ts          # 에러 메시지 번역
│   ├── utils.ts          # cn() 등 유틸
│   └── constants.ts      # 상수 정의
│
└── public/
    ├── manifest.json     # PWA 매니페스트
    ├── sw.js             # (빌드 시 자동 생성)
    ├── offline.html      # 오프라인 폴백 페이지
    ├── icon-192x192.png
    └── icon-512x512.png
```

### 핵심 설계 원칙

**services/ 레이어**: 컴포넌트에서 Axios를 직접 호출하지 않습니다. 모든 API 호출은 `services/` 레이어를 거칩니다. 이렇게 하면 API 엔드포인트가 변경되어도 서비스 파일만 수정하면 됩니다.

**pages/ vs components/ 분리**: `pages/`는 라우트에 1:1 매핑되는 최상위 컴포넌트입니다. `components/`는 재사용 가능한 UI 조각입니다. 페이지가 비대해지면 그 안의 섹션을 `components/`로 분리합니다.

**types/ 독립**: 타입은 별도 디렉토리에 관리합니다. 서비스, 컴포넌트, 페이지 어디서든 import할 수 있도록 순환 참조를 방지합니다.

---

## 3. 빌드 시스템: Vite와 2-Stage Docker 빌드

### Vite 설정 핵심

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ ... }),  // Service Worker 자동 생성
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // @/ 경로 별칭
    },
  },
})
```

`@/` 경로 별칭을 설정하면 `import { api } from '../../../lib/api'` 대신 `import { api } from '@/lib/api'`로 쓸 수 있습니다. 깊은 중첩 디렉토리에서도 깔끔합니다. `tsconfig.json`에도 동일한 paths 설정이 필요합니다.

### 빌드 시 일어나는 일

```bash
npm run build
# 실제로는: tsc && vite build
```

1. **tsc**: TypeScript 컴파일러가 타입 체크 수행 (에러 있으면 빌드 실패)
2. **vite build**: Rollup으로 번들링
   - Tree-shaking: 사용하지 않는 코드 제거
   - Code splitting: 라우트별 청크 분리 (lazy loading은 아직 미적용)
   - Asset hashing: `App-3f8a2b1c.js` 형태로 파일명에 content hash 추가
   - Minification: 코드 압축

빌드 결과물:
```
dist/
├── index.html           # 진입점 (해시된 JS/CSS 참조)
├── sw.js                # Service Worker (vite-plugin-pwa 생성)
├── manifest.json        # PWA 매니페스트
├── workbox-*.js         # Workbox 런타임
└── assets/
    ├── index-a1b2c3d4.js    # 메인 번들
    ├── index-e5f6g7h8.css   # 스타일
    └── vendor-i9j0k1l2.js   # 라이브러리 청크
```

### 2-Stage Docker 빌드

```dockerfile
# Dockerfile.prod

# Stage 1: 빌드 (Node.js 환경)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false   # devDependencies 포함 설치
COPY . .
ARG VITE_API_URL                      # 빌드 타임 환경변수
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build                     # → dist/ 생성

# Stage 2: 실행 (Nginx 환경)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**왜 2-Stage인가?**

Stage 1에서는 `node_modules` (400MB+), TypeScript 컴파일러, 소스코드 등이 모두 필요합니다. 하지만 실행 시에는 빌드된 정적 파일(보통 2~5MB)만 있으면 됩니다. 2-Stage 빌드로 최종 이미지 크기를 **~40MB** (Nginx Alpine + 정적 파일)로 줄입니다.

**VITE_ 접두사 환경변수의 특성:**

Vite는 `VITE_` 접두사가 붙은 환경변수만 클라이언트 코드에 노출합니다. 이 변수들은 **빌드 타임**에 문자열로 치환됩니다. 즉, 빌드 후에는 변경 불가능합니다.

```typescript
// 소스코드
const url = import.meta.env.VITE_API_URL

// 빌드 결과 (문자열 치환)
const url = ""   // 프로덕션: 빈 문자열 → 상대 경로
```

이것이 `docker-compose.prod.yml`에서 `VITE_API_URL`을 `args`(빌드 인자)로 넘기는 이유입니다. `environment`(런타임 환경변수)로는 안 됩니다.

---

## 4. 배포 아키텍처: 코드에서 사용자까지

### 전체 네트워크 흐름

```
                              ┌── Mac Mini (호스트) ──────────────────────────────┐
                              │                                                    │
[사용자 브라우저]              │  ┌─────────────────────────────────────────────┐  │
       │                      │  │     Docker Network: dearme-prod-network     │  │
       │ HTTPS                │  │                                             │  │
       ▼                      │  │  ┌──────────────────┐                       │  │
┌──────────────┐              │  │  │  Nginx (frontend) │  ── /api/* ──→  ┌─────┤  │
│  Cloudflare  │─── :8080 ──→│  │  │    :80 → :8080    │                 │ Fast│  │
│  Tunnel      │              │  │  │                   │                 │ API │  │
│ (cloudflared)│              │  │  │ 정적파일: dist/   │                 │:8000│  │
│  host network│              │  │  └──────────────────┘                 │→8001│  │
└──────────────┘              │  │                                       └──┬──┘  │
                              │  │                                          │     │
                              │  │                                          ▼     │
                              │  │                                    ┌──────────┐│
                              │  │                                    │PostgreSQL││
                              │  │                                    │  :5432   ││
                              │  │                                    │  →:5433  ││
                              │  │                                    └──────────┘│
                              │  └─────────────────────────────────────────────┘  │
                              └────────────────────────────────────────────────────┘
```

### 각 계층의 역할

**1. Cloudflare Tunnel (cloudflared)**
- 서버에 공인 IP나 포트포워딩 없이 HTTPS 서비스를 제공
- Cloudflare 엣지 서버가 프록시 역할을 하여 DDoS 방어도 기본 제공
- `network_mode: host`로 호스트 네트워크를 직접 사용하여 `localhost:8080`에 접근
- 설정은 Cloudflare 대시보드에서 터널 생성 후 `TUNNEL_TOKEN`만 환경변수로 주입

**2. Nginx (frontend 컨테이너 내부)**
- **정적 파일 서빙**: Vite 빌드 결과물(`dist/`)을 서빙
- **API 프록시**: `/api/*` 요청을 백엔드 컨테이너로 전달 (reverse proxy)
- **SPA 라우팅**: 존재하지 않는 경로도 `index.html`로 폴백 (`try_files`)
- **캐싱 정책**: 파일 종류별 차별화된 캐시 (후술)
- **보안 헤더**: X-Frame-Options, CSP, XSS Protection 등
- **SSE 지원**: `proxy_buffering off`로 스트리밍 응답 지원

**3. FastAPI (backend)**
- Docker 네트워크 내에서 `backend:8000`으로 접근 가능
- Nginx가 `/api/*` → `http://backend:8000`으로 프록시
- 호스트에서는 `:8001`로 직접 접근 가능 (디버깅용)

### 왜 Nginx가 frontend 컨테이너 안에 있나?

별도 Nginx 컨테이너를 두는 방법도 있지만, 이 프로젝트에서는 "프론트엔드 = 빌드된 정적 파일 + 그것을 서빙할 웹 서버"를 하나의 단위로 묶었습니다. 장점:
- 프론트엔드 배포 시 Nginx 설정도 함께 업데이트
- `nginx.conf`가 프론트엔드 코드와 같은 Git 히스토리에서 관리
- 컨테이너 수를 줄여 리소스 절약

### 프로덕션에서 API 상대 경로를 쓰는 이유

```typescript
// api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
// 프로덕션: VITE_API_URL="" → baseURL = "/api/v1"
// 개발:     VITE_API_URL="http://localhost:8002" → baseURL = "http://localhost:8002/api/v1"
```

프로덕션에서 `VITE_API_URL`을 빈 문자열로 설정하면, API 요청이 `/api/v1/diaries` 같은 상대 경로가 됩니다. 브라우저는 현재 도메인(`dearme.shoneylife.com`)으로 요청하고, Nginx가 이를 백엔드로 프록시합니다.

이 방식의 장점:
- **CORS 문제 없음**: 같은 도메인이므로 cross-origin이 아님
- **쿠키/헤더 전달 자유로움**: 프록시가 Authorization 헤더를 그대로 전달
- **도메인 변경 시 프론트 재빌드 불필요**: Nginx 설정만 변경

---

## 5. 버전 관리: 왜 수동 버전을 쓰는가

### 문제 배경

SPA에서 가장 골치 아픈 문제 중 하나는 **배포 후 사용자가 옛날 코드를 실행하는 것**입니다.

시나리오:
1. v1.15.0 배포. 사용자 A가 접속하여 앱 사용 중.
2. v1.16.0 배포. Zustand 스토어 구조가 변경됨.
3. 사용자 A가 새로고침 없이 계속 사용. localStorage에는 v1.15.0 형식 데이터가 저장되어 있음.
4. 어느 순간 새 JS가 로드됨 (SW 업데이트 등) → 새 코드가 옛 localStorage 데이터를 읽으려 함 → **크래시!**

### 해결책: localStorage 버전 게이트

```typescript
// version.ts
export const APP_VERSION = '1.16.4'  // ← 배포마다 수동으로 올림

export function checkAndUpdateVersion(): boolean {
  const storedVersion = localStorage.getItem('app_version')

  if (storedVersion !== APP_VERSION) {
    // 유지할 키 백업
    const keysToKeep = ['theme', 'access_token', 'auth-storage',
                        'pwa-install-dismissed', 'pwa-visit-count']
    const backup: Record<string, string> = {}
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) backup[key] = value
    })

    // localStorage 전체 초기화
    localStorage.clear()

    // 백업 복원 + 새 버전 저장
    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    localStorage.setItem('app_version', APP_VERSION)

    return true  // 버전 변경됨
  }
  return false
}
```

### 왜 자동 버전(Git hash 등)이 아닌 수동 버전인가?

Git commit hash를 빌드 시 주입하는 것도 가능합니다. 하지만 **모든 커밋이 localStorage 초기화를 유발**하게 됩니다. 실제로는 스토어 구조가 바뀌는 배포에서만 초기화가 필요합니다. 수동 버전은 "의도적으로 초기화가 필요한 배포"를 개발자가 판단하게 합니다.

단점은 물론 **깜빡하고 안 올릴 수 있다**는 것입니다. 이를 위해 배포 체크리스트와 CLAUDE.md에 "배포 시 반드시 버전 업데이트" 경고를 넣어두었습니다.

### keysToKeep 설계 의도

| 키 | 유지 이유 |
|----|----------|
| `theme` | 다크모드 설정. 초기화되면 사용자 불편 |
| `access_token` | JWT 토큰. 초기화되면 강제 로그아웃 |
| `auth-storage` | Zustand persist 데이터. 로그인 상태 유지 |
| `pwa-install-dismissed` | PWA 설치 배너 닫기 기록. 초기화되면 다시 뜸 |
| `pwa-visit-count` | 방문 횟수. 설치 배너 표시 조건 |

나머지 키(TanStack Query 캐시 관련 등)는 새 코드와 호환성이 보장되지 않으므로 정리합니다.

### 앱 시작 시 실행 순서

```
main.tsx 실행
  │
  ├─ initVersion()        ← (1) 버전 체크 + localStorage 정리
  │
  ├─ ReactDOM.createRoot() ← (2) React 앱 마운트
  │    └─ App.tsx
  │         └─ isHydrated 체크 → Zustand이 localStorage에서 상태 복원 중이면 대기
  │
  └─ serviceWorker.register() ← (3) SW 등록 (프로덕션만, window.load 이후)
```

(1)이 (2)보다 먼저 실행되므로, React가 마운트될 때는 이미 localStorage가 정리된 상태입니다.

---

## 6. 캐싱 전략: Nginx, Vite 해시, Service Worker 삼중주

캐싱은 세 계층에서 동시에 작동합니다. 각 계층의 역할을 정확히 이해해야 "배포했는데 사용자한테 안 보여요" 문제를 해결할 수 있습니다.

### 6-1. Vite Content Hashing (빌드 시)

Vite가 빌드할 때 파일 내용의 해시를 파일명에 포함시킵니다:

```
src/App.tsx     →  assets/index-a1b2c3d4.js   (v1.16.3)
src/App.tsx 수정 →  assets/index-e5f6g7h8.js   (v1.16.4, 해시 변경)
```

`index.html`이 참조하는 JS 파일명이 바뀌므로, 새 `index.html`을 받으면 자동으로 새 JS를 다운로드합니다. 핵심은 **index.html이 항상 최신이어야 한다**는 것입니다.

### 6-2. Nginx 캐시 정책 (서빙 시)

```nginx
# index.html: 절대 캐시하지 않음
location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# JS/CSS/이미지/폰트: 1년 캐시 (immutable)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# sw.js: 절대 캐시하지 않음
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# manifest.json: 1시간 캐시
location = /manifest.json {
    add_header Cache-Control "public, max-age=3600";
}
```

**왜 JS/CSS를 1년이나 캐시하나?**

파일명에 content hash가 있으므로, 같은 파일명 = 같은 내용입니다. 내용이 바뀌면 파일명 자체가 바뀌므로 "같은 파일의 최신 버전"이라는 개념이 없습니다. `immutable` 헤더는 브라우저에게 "이 파일은 절대 안 바뀌니 재검증도 하지 마"라고 알려줍니다.

**index.html만 캐시 안 하는 이유:**

```
사용자 접속
  → Nginx가 index.html 반환 (no-cache → 항상 서버에서 최신 가져옴)
  → index.html 안의 <script src="/assets/index-NEW_HASH.js">
  → 브라우저가 새 해시의 JS 요청 (캐시에 없음 → 서버에서 다운로드)
  → 새 JS 실행 → 새 버전의 앱 작동
```

만약 `index.html`도 캐시되면, 새 배포를 해도 사용자는 옛 `index.html` → 옛 해시의 JS → 옛 앱을 계속 보게 됩니다.

### 6-3. Service Worker 캐싱 (브라우저 레벨)

vite-plugin-pwa가 Workbox 기반 Service Worker를 자동 생성합니다.

```typescript
// vite.config.ts 내 VitePWA 설정
workbox: {
  // Precache: 빌드 시 생성된 JS/CSS/HTML을 미리 캐시
  globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

  // Runtime Cache: 런타임에 요청되는 리소스 캐싱 전략
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\//,
      handler: 'NetworkFirst',      // 네트워크 우선, 실패 시 캐시
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 300 },
        networkTimeoutSeconds: 10,   // 10초 타임아웃 시 캐시 사용
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',        // 캐시 우선, 없으면 네트워크
      options: { cacheName: 'image-cache', expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',        // 폰트는 거의 안 바뀌므로 캐시 우선
      options: { cacheName: 'font-cache', expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
  ],
}
```

**Precache vs Runtime Cache:**
- **Precache**: 빌드 시점에 "어떤 파일을 캐시할지" 목록이 정해짐. SW 설치 시 한꺼번에 다운로드.
- **Runtime Cache**: 사용자가 실제로 요청할 때 캐싱 전략에 따라 처리.

**API 요청에 NetworkFirst를 쓰는 이유:**

API 응답은 실시간 데이터이므로 항상 최신을 가져와야 합니다. 하지만 네트워크가 끊기면(오프라인) 마지막으로 캐시된 응답을 보여주는 것이 빈 화면보다 낫습니다. `networkTimeoutSeconds: 10`으로 느린 네트워크에서도 10초 후에는 캐시를 사용합니다.

### 삼중 캐시가 충돌하면?

실제 요청 순서:
```
브라우저 → Service Worker (가로챔) → Nginx → 파일시스템/백엔드

1. SW가 precache에 해당 파일이 있는지 확인
2. 있으면 → 캐시에서 반환 (Nginx까지 안 감)
3. 없으면 → Nginx로 요청 → Nginx 캐시 정책에 따라 처리
```

배포 후 업데이트 흐름:
```
1. 새 빌드 → sw.js 내용 변경 (precache 목록이 바뀌므로)
2. 브라우저가 sw.js 재확인 (no-cache 정책)
3. 새 SW 감지 → "installing" 상태로 새 precache 다운로드
4. 다운로드 완료 → "waiting" 상태 → UpdatePrompt 배너 표시
5. 사용자가 "지금 업데이트" 클릭 → SKIP_WAITING → 페이지 리로드
6. 새 SW 활성화 → 새 precache 사용
```

---

## 7. PWA: 웹앱을 네이티브처럼

### PWA가 필요한 이유

DearMe는 일기 앱입니다. 매일 써야 하는 서비스이므로 접근성이 중요합니다. 홈 화면 아이콘으로 원탭 접속, 오프라인 폴백, 앱 설치 경험은 웹앱의 리텐션을 높입니다.

### manifest.json 설정

```json
{
  "name": "DearMe - 일기 기반 AI 페르소나",
  "short_name": "DearMe",
  "display": "standalone",           // 브라우저 UI 숨김 (네이티브 앱처럼)
  "orientation": "portrait",         // 세로 모드 고정
  "start_url": "/",
  "scope": "/",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "categories": ["lifestyle", "social", "health"],
  "icons": [
    { "src": "/icon-192x192.png?v=2", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png?v=2", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512x512.png?v=2", "sizes": "512x512", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "일기 쓰기", "url": "/diaries/new" },
    { "name": "페르소나 대화", "url": "/persona/chat" }
  ]
}
```

아이콘 URL에 `?v=2` 쿼리가 붙어있는 것에 주목하세요. iOS Safari는 PWA 아이콘을 매우 공격적으로 캐시합니다. 아이콘을 교체해도 반영이 안 되는 문제를 겪었고, 캐시 버스팅용 버전 쿼리를 추가하여 해결했습니다.

### 앱 설치 프롬프트 전략

```typescript
// hooks/usePWA.ts - useInstallPrompt

const MIN_VISITS = 3  // 3번 방문 후에 설치 안내

useEffect(() => {
  if (isStandalone()) return        // 이미 설치됨
  if (dismissed) return             // 사용자가 닫음
  if (visitCount < MIN_VISITS) return // 아직 3회 미만

  if (isIOS()) {
    setShowIOSGuide(true)           // iOS: 수동 가이드
  } else {
    // Android/Chrome: beforeinstallprompt 이벤트 리스닝
    window.addEventListener('beforeinstallprompt', handler)
  }
}, [])
```

**왜 첫 방문에 바로 안 띄우나?**

첫 방문자에게 "앱 설치하세요!"는 반감을 줍니다. 3회 이상 방문한 사용자는 서비스에 관심이 있다는 뜻이므로 그때 설치를 권유합니다.

**iOS vs Android 차이:**

- **Android/Chrome**: `beforeinstallprompt` 이벤트를 지원. 프로그래밍으로 설치 프롬프트를 띄울 수 있음.
- **iOS Safari**: 이 이벤트를 **지원하지 않음**. "공유 버튼 → 홈 화면에 추가"를 수동으로 안내해야 함.

이 차이 때문에 `InstallPrompt` 컴포넌트는 두 가지 UI를 분기합니다:
- Android: "설치하기" 버튼 → `deferredPrompt.prompt()` 호출
- iOS: "공유 버튼을 누르고 홈 화면에 추가를 선택하세요" 텍스트 가이드

### SW 업데이트 감지

```typescript
// hooks/usePWA.ts - useSWUpdate

useEffect(() => {
  // 60분마다 SW 업데이트 체크
  const interval = setInterval(() => {
    navigator.serviceWorker.ready.then((reg) => reg.update())
  }, 60 * 60 * 1000)
  return () => clearInterval(interval)
}, [])

// 새 SW가 waiting 상태면 업데이트 배너 표시
if (registration.waiting) {
  setNeedRefresh(true)
}
```

`registerType: 'prompt'`를 사용하므로, 새 SW가 자동 활성화되지 않습니다. 사용자가 "지금 업데이트" 버튼을 눌러야 `SKIP_WAITING` 메시지를 보내고 페이지를 리로드합니다. 이는 사용자가 작업 중일 때 갑자기 페이지가 리로드되는 것을 방지합니다.

---

## 8. 상태 관리: Zustand + TanStack Query 이중 구조

### 왜 두 개를 쓰나?

| 상태 종류 | 예시 | 관리 도구 | 이유 |
|-----------|------|----------|------|
| 클라이언트 상태 | 로그인 여부, 테마, UI 토글 | Zustand | 서버와 무관. localStorage에 영속화. |
| 서버 상태 | 일기 목록, 페르소나 데이터, 알림 | TanStack Query | 캐싱, 재검증, 에러 처리, 로딩 상태 자동화. |

이 두 가지를 하나의 도구로 합치면 복잡도가 급격히 올라갑니다. 예를 들어 Zustand에 일기 목록을 넣으면 "5분 후 재검증", "다른 탭에서 수정 시 동기화", "페이지네이션 캐시" 등을 직접 구현해야 합니다.

### Zustand + Persist 미들웨어

```typescript
// store/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,     // ← 중요: hydration 완료 여부

      setAuth: (user, token) => {
        localStorage.setItem('access_token', token)  // 이중 저장
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth-storage')
        queryClient.clear()  // ← TanStack Query 캐시도 정리
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',                // localStorage 키
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({            // 저장할 필드만 선택
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {  // 복원 완료 시 콜백
        if (state) {
          state.syncToken()    // localStorage ↔ Zustand 동기화
          state.setHydrated()  // hydration 완료 플래그
        }
      },
    }
  )
)
```

**왜 토큰을 이중 저장하나?** (`access_token` + `auth-storage`)

Zustand persist는 전체 상태를 JSON 직렬화하여 하나의 키(`auth-storage`)에 저장합니다. 하지만 Axios 인터셉터는 Zustand 스토어를 import하지 않고 직접 `localStorage.getItem('access_token')`으로 토큰을 읽습니다. 이는 순환 의존성을 피하기 위한 설계입니다.

```typescript
// api.ts - Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')  // Zustand이 아닌 직접 읽기
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**syncToken()의 역할:**

배포 후 localStorage 초기화 과정에서 `access_token`과 `auth-storage`가 불일치할 수 있습니다. `syncToken()`은 이 두 값을 일치시킵니다:
- Zustand에 토큰 있고 localStorage에 없으면 → localStorage에 복원
- Zustand에 없고 localStorage에 있으면 → localStorage에서 제거
- 둘 다 있지만 다르면 → localStorage 값 우선 (더 최신)

### TanStack Query 사용 패턴

```typescript
// 페이지 컴포넌트에서의 사용 예시
const { data: diaries, isLoading } = useQuery({
  queryKey: ['diaries', page],
  queryFn: () => diaryService.getList(page),
})

const createDiaryMutation = useMutation({
  mutationFn: diaryService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['diaries'] })  // 목록 재검증
  },
  onError: (err) => {
    setError(getApiErrorMessage(err))  // 한국어 에러 메시지
  },
})
```

주요 queryKey 목록: `subscriptionStatus`, `usageStatus`, `subscriptionPlans`, `mySubscription`, `diaries`, `persona`, `friends`, `notifications`, `mental` 등.

---

## 9. 인증 플로우: JWT + Zustand Hydration 문제

### 전체 인증 흐름

```
[회원가입] → 이메일 인증 메일 발송 → 사용자가 메일 링크 클릭 → 인증 완료
    ↓
[로그인] → POST /api/v1/auth/login → JWT 토큰 반환
    ↓
authStore.setAuth(user, token)
    ├── Zustand 상태 업데이트 (user, token, isAuthenticated)
    ├── localStorage['access_token'] = token
    └── localStorage['auth-storage'] = JSON.stringify({user, token, isAuthenticated})
    ↓
[이후 모든 API 요청]
    → Axios Request Interceptor가 Authorization: Bearer <token> 헤더 자동 추가
    ↓
[401 응답 시]
    → Response Interceptor가 감지
    → 인증 페이지(/login, /register, /landing)에서 발생한 401은 무시
    → 그 외: 토큰 삭제 → queryClient.clear() → /landing으로 리다이렉트
```

### Hydration 문제와 해결

**문제:** SPA에서 페이지 새로고침 시:
1. React 마운트 → Zustand 상태 = 초기값 (isAuthenticated: false)
2. Zustand persist가 localStorage에서 상태 복원 (비동기)
3. ProtectedRoute가 isAuthenticated = false를 보고 /landing으로 리다이렉트
4. 그 직후 hydration 완료 → isAuthenticated = true... 하지만 이미 리다이렉트됨

**해결:** `isHydrated` 플래그로 hydration 완료까지 렌더링을 지연:

```typescript
// ProtectedRoute.tsx
export default function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return <PageLoading />   // hydration 완료 전: 로딩 스피너
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />  // 미인증: 리다이렉트
  }

  return <Outlet />  // 인증됨: 자식 라우트 렌더
}
```

```typescript
// App.tsx 최상위에서도 동일하게 체크
if (!isHydrated) {
  return <PageLoading />
}
```

이 패턴이 없으면 로그인한 사용자가 새로고침할 때마다 잠깐 로그인 페이지가 깜빡이는 현상(flash of unauthenticated content)이 발생합니다.

### 401 에러 처리의 미묘함

```typescript
// api.ts - Response Interceptor
let isLoggingOut = false  // 중복 실행 방지 플래그

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthPage = ['/login', '/register', '/landing']
        .includes(window.location.pathname)

      if (!isAuthPage && !isLoggingOut) {
        isLoggingOut = true
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth-storage')
        queryClient.clear()
        window.location.href = '/landing'

        setTimeout(() => { isLoggingOut = false }, 1000)
      }
    }
    return Promise.reject(error)
  }
)
```

**왜 `isLoggingOut` 플래그가 필요한가?**

한 페이지에서 여러 API 요청이 동시에 발생할 수 있습니다 (일기 목록 + 알림 수 + 구독 상태). 토큰이 만료되면 이 요청들이 모두 401을 반환합니다. 플래그 없이는 `window.location.href = '/landing'`이 여러 번 실행되고, queryClient.clear()도 여러 번 호출됩니다.

**왜 인증 페이지에서는 무시하나?**

로그인 페이지에서 잘못된 비밀번호를 입력하면 401이 옵니다. 이때 리다이렉트하면 무한 루프가 됩니다.

---

## 10. SSE 스트리밍: AI 대화의 실시간 응답

AI 페르소나와 대화할 때, 전체 응답을 기다리면 수 초간 빈 화면이 보입니다. ChatGPT처럼 글자가 하나씩 나타나는 경험을 위해 **Server-Sent Events (SSE)** 를 사용합니다.

### 왜 WebSocket이 아닌 SSE인가?

| 기능 | SSE | WebSocket |
|------|-----|-----------|
| 방향 | 서버 → 클라이언트 (단방향) | 양방향 |
| 프로토콜 | HTTP | WS (별도 프로토콜) |
| Nginx 설정 | `proxy_buffering off`만 추가 | upgrade 헤더 처리 필요 |
| 자동 재연결 | 브라우저 내장 | 직접 구현 |
| 복잡도 | 낮음 | 높음 |

AI 대화는 "사용자가 메시지 보내기 → 서버가 응답 스트리밍"의 단방향 흐름입니다. 양방향 통신이 필요 없으므로 SSE가 적합합니다.

### 프론트엔드 구현

```typescript
// services/chatService.ts - sendMessageStream
async sendMessageStream(
  chatId: number,
  content: string,
  onChunk: (chunk: string) => void,      // 글자 단위 콜백
  onUserMessage: (msg: ChatMessage) => void,  // 내 메시지 확인
  onDone: (msg: ChatMessage) => void,    // 완료
  onError: (error: string) => void       // 에러
): Promise<void> {
  // Axios가 아닌 fetch API 사용 (스트리밍 지원)
  const response = await fetch(`${apiUrl}/api/v1/chats/${chatId}/messages/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''  // 마지막 불완전 라인은 버퍼에 보관

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        switch (data.type) {
          case 'user_message': onUserMessage(data.message); break
          case 'chunk':        onChunk(data.content); break
          case 'done':         onDone(data.message); break
          case 'error':        onError(data.content); break
        }
      }
    }
  }
}
```

**왜 Axios 대신 fetch를 쓰나?**

Axios는 `response.data`를 한번에 반환합니다. 스트리밍 응답의 `ReadableStream`을 청크 단위로 읽으려면 `fetch` API의 `response.body.getReader()`가 필요합니다.

**버퍼 처리가 왜 필요한가?**

SSE 데이터는 `data: {...}\n\n` 형식입니다. 하지만 네트워크에서 데이터는 TCP 패킷 단위로 도착하므로, 하나의 `reader.read()` 호출에서 메시지가 중간에 잘릴 수 있습니다:

```
// 첫 번째 read()에서 받은 데이터
"data: {\"type\":\"chunk\",\"content\":\"안\"}\ndata: {\"type\":\"ch"

// 두 번째 read()에서 받은 데이터
"unk\",\"content\":\"녕\"}\n"
```

`buffer`에 불완전한 마지막 라인을 보관하고, 다음 read()에서 이어붙여 완성된 라인만 파싱합니다.

### Nginx SSE 설정

```nginx
location /api/ {
    proxy_pass http://backend:8000;
    proxy_buffering off;          # 버퍼링 비활성화 (즉시 전달)
    proxy_cache off;              # 캐시 비활성화
    chunked_transfer_encoding on; # 청크 전송 인코딩
    proxy_read_timeout 120s;      # AI 응답 대기 (최대 2분)
}
```

`proxy_buffering off`가 핵심입니다. Nginx는 기본적으로 백엔드 응답을 버퍼에 모았다가 한번에 클라이언트에 전달합니다. SSE에서는 이 버퍼링을 끄지 않으면 스트리밍이 안 되고 전체 응답이 한번에 도착합니다.

---

## 11. 에러 처리: 백엔드 영어 → 프론트엔드 한국어 번역 패턴

### 설계 원칙

백엔드 에러 메시지는 **영어**로 작성합니다. 이유:
1. 백엔드 로그에서 에러 추적 시 영어가 편리 (grep 등)
2. 향후 다국어 지원 시 백엔드 수정 불필요
3. API 문서의 일관성

프론트엔드에서 사용자에게 보여주기 전에 **한국어로 번역**합니다.

### 번역 맵 방식

```typescript
// lib/error.ts
const translations: Record<string, string> = {
  'Incorrect email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email already registered': '이미 등록된 이메일입니다.',
  'Diary already exists for this date': '해당 날짜에 이미 일기가 존재합니다.',
  'Cannot write diary for future dates': '미래 날짜에는 일기를 작성할 수 없습니다.',
  // ... 40개 이상의 번역
}

// 동적 에러 (정규식 매칭)
const usernameMatch = detail.match(/^Username can be changed after (\d+) days$/)
if (usernameMatch) {
  return `닉네임은 ${usernameMatch[1]}일 후에 변경할 수 있습니다.`
}

// 번역이 없으면 원문 그대로 표시
return translations[detail] || detail
```

### 사용 패턴

```typescript
import { getApiErrorMessage } from '@/lib/error'

const mutation = useMutation({
  mutationFn: diaryService.create,
  onError: (err) => {
    const message = getApiErrorMessage(err)  // 한국어 변환
    toast.error(message)
    // 또는 setError(message) → 폼 하단에 에러 메시지 표시
  },
})
```

### HTTP 상태 코드별 기본 메시지

번역 맵에 없는 에러도 상태 코드로 기본 한국어 메시지를 제공합니다:

```typescript
switch (status) {
  case 400: return translateErrorDetail(detail) || '잘못된 요청입니다.'
  case 401: return '인증에 실패했습니다. 다시 로그인해주세요.'
  case 403: return translateErrorDetail(detail) || '접근 권한이 없습니다.'
  case 404: return '요청한 리소스를 찾을 수 없습니다.'
  case 409: return '이미 존재하는 데이터입니다.'
  case 422: /* Validation 에러 배열 처리 */
  case 429: return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  case 500: return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
```

네트워크 에러(서버 무응답)도 별도 처리합니다:
```typescript
if (!error.response) {
  return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
}
```

---

## 12. 모바일 최적화: iOS Safari와의 전쟁

DearMe는 모바일 퍼스트 앱입니다. iOS Safari에서의 동작은 Chrome과 상당히 다릅니다.

### Safe Area 처리

아이폰의 노치/다이나믹 아일랜드/홈 인디케이터 영역을 피해야 합니다:

```css
/* index.css */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}

/* BottomTabBar가 홈 인디케이터와 겹치지 않도록 */
@layer components {
  .pb-bottomtab {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
}
```

### iOS Safari 입력 필드 자동 확대 방지

iOS Safari는 `font-size`가 16px 미만인 input에 포커스하면 자동으로 페이지를 확대합니다. 이를 방지:

```css
@supports (-webkit-touch-callout: none) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

`@supports (-webkit-touch-callout: none)`은 iOS Safari만 매칭하는 조건입니다.

### iOS Safari 날짜 입력 필드 버그

Safari에서 `<input type="date">`가 컨테이너를 넘어가거나 잘리는 WebKit 버그가 있습니다:

```css
/* 날짜 필드: 웹은 block, Safari iOS에서만 flex로 overflow 방지 */
.date-field-wrapper {
  display: block;
}
@supports (-webkit-touch-callout: none) {
  .date-field-wrapper {
    display: flex;
  }
}

input[type="date"] {
  overflow: hidden;
  max-width: 100%;
  -webkit-min-logical-width: 0;
}
```

### 아이콘 캐싱 문제 (iOS PWA)

iOS에서 PWA 아이콘을 변경해도 홈 화면 아이콘이 업데이트되지 않는 문제:
- iOS는 PWA 추가 시점에 아이콘을 캐시하고 이후 업데이트하지 않음
- Nginx가 아이콘을 1년 캐시(`expires 1y`)
- **해결**: 아이콘 URL에 `?v=2` 쿼리 추가 + manifest.json 아이콘 경로도 함께 변경

### backdrop-blur와 fixed 위치 충돌

iOS Safari에서 `backdrop-filter: blur()`가 적용된 컨테이너 내부의 `position: fixed` 요소가 정상 작동하지 않는 버그:

```tsx
// Layout.tsx - BottomTabBar를 backdrop-blur 컨테이너 바깥에 배치
<div style={{ backgroundImage: '...' }}>
  <div className="bg-white/70 backdrop-blur-sm">
    <Header />
    <main><Outlet /></main>
  </div>
  {/* BottomTabBar는 backdrop-blur 컨테이너 바깥에 위치해야 fixed가 정상 작동 */}
  <BottomTabBar />
</div>
```

### 모달 열릴 때 하단 탭바 숨김

모달이 열리면 뒤의 탭바 버튼이 눌리는 문제를 방지:

```css
body[data-modal-open] #bottom-tab-bar {
  display: none;
}
```

모달 열릴 때 `document.body.setAttribute('data-modal-open', '')`, 닫힐 때 `removeAttribute`로 제어합니다.

---

## 13. 개발 환경 vs 프로덕션 환경

### 환경별 차이 상세 비교

| 항목 | 개발 (docker-compose.yml) | 프로덕션 (docker-compose.prod.yml) |
|------|--------------------------|----------------------------------|
| **프론트엔드 서버** | Vite 개발서버 (HMR) | Nginx (정적 파일 서빙) |
| **프론트 포트** | :5173 | :8080 (→ 내부 :80) |
| **백엔드 실행** | `uvicorn --reload` (자동 재시작) | `uvicorn` (재시작 없음) |
| **백엔드 포트** | :8002 (→ 내부 :8000) | :8001 (→ 내부 :8000) |
| **DB 포트** | :5434 (→ 내부 :5432) | :5433 (→ 내부 :5432) |
| **DB 볼륨** | `./data/postgres` | `./data/postgres-prod` |
| **네트워크** | `dearme-dev-network` | `dearme-prod-network` |
| **API 호출** | `http://localhost:8002/api/v1` (직접) | `/api/v1` (Nginx 프록시) |
| **HTTPS** | 없음 (HTTP) | Cloudflare Tunnel |
| **Service Worker** | 비활성화 | 활성화 |
| **파일 변경 반영** | 즉시 (HMR) | 재빌드 필요 |
| **소스맵** | 포함 | 미포함 (minified) |
| **Dockerfile** | `frontend/Dockerfile` | `frontend/Dockerfile.prod` |
| **재시작 정책** | 없음 | `restart: unless-stopped` |

### 동시 실행 가능

포트와 볼륨, 네트워크, 컨테이너 이름이 모두 분리되어 있으므로, 개발 환경과 프로덕션 환경을 같은 머신에서 동시에 돌릴 수 있습니다:

```bash
# 개발
docker-compose up -d

# 프로덕션 (같은 머신에서 동시 실행 가능)
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 14. 배포 프로세스 전체 흐름

### Step by Step

```
1. 코드 변경 완료 + 테스트

2. version.ts APP_VERSION 올리기
   └── 예: '1.16.3' → '1.16.4'

3. Git 커밋
   └── git commit -m "chore: v1.16.4 배포 버전 업데이트"

4. Docker 빌드 + 배포
   └── docker-compose -f docker-compose.prod.yml \
         --env-file .env.production up --build -d

   Docker가 내부적으로 하는 일:
   ┌────────────────────────────────────────────┐
   │ frontend 컨테이너:                          │
   │   Stage 1: npm ci → tsc → vite build       │
   │   Stage 2: nginx:alpine에 dist/ + nginx.conf│
   │                                              │
   │ backend 컨테이너:                            │
   │   pip install → uvicorn 실행                 │
   │                                              │
   │ postgres: 기존 볼륨 유지 (데이터 보존)        │
   │                                              │
   │ cloudflared: 터널 재연결                      │
   └────────────────────────────────────────────┘

5. DB 마이그레이션 (스키마 변경 있을 때만)
   └── docker-compose -f docker-compose.prod.yml \
         exec backend alembic upgrade head

6. 배포 확인
   └── docker-compose -f docker-compose.prod.yml ps
   └── 4개 컨테이너 모두 Up + postgres healthy

7. 사용자 측 업데이트 흐름:
   ┌────────────────────────────────────────────┐
   │ 사용자가 앱 접속 또는 새로고침               │
   │   → 브라우저가 index.html 요청 (no-cache)   │
   │   → 새 index.html 반환                      │
   │   → 새 해시의 JS 파일 로드                   │
   │   → initVersion() → 버전 비교               │
   │   → localStorage 정리 (필요 시)              │
   │   → 새 앱 정상 실행                          │
   │                                              │
   │ PWA 사용자:                                  │
   │   → SW가 60분 주기로 업데이트 체크            │
   │   → 새 sw.js 감지 → 새 SW 설치               │
   │   → "업데이트 가능" 배너 표시                 │
   │   → 사용자 클릭 → 리로드 → 위 과정 실행      │
   └────────────────────────────────────────────┘
```

---

## 15. 마주친 문제들과 교훈

### 문제 1: 배포 후 무한 리로드

**증상**: 배포 후 일부 사용자가 페이지가 계속 새로고침되는 현상.

**원인**: 버전을 올리지 않고 배포 → localStorage에 옛 Zustand 상태 → 새 코드와 호환 안 됨 → 에러 → 에러 핸들러가 페이지 리로드 → 같은 localStorage → 같은 에러 → 무한 루프.

**해결**: 배포 시 반드시 `APP_VERSION` 업데이트. CLAUDE.md, DEPLOYMENT_CHECKLIST.md 모두에 경고 문구 추가.

**교훈**: 자동화할 수 있는 것은 자동화하되, 수동 프로세스가 필요한 경우 여러 곳에 체크포인트를 만들어야 합니다.

### 문제 2: iOS 아이콘 캐시

**증상**: 아이콘을 교체했는데 iOS PWA 홈 화면 아이콘이 안 바뀜.

**원인**: Nginx `expires 1y` + iOS 자체 PWA 아이콘 캐시 (앱 삭제 후 재추가해도 캐시됨).

**해결**: `manifest.json`의 아이콘 URL에 `?v=N` 쿼리 추가. 아이콘 변경 시 N을 올림.

**교훈**: 캐시 전략은 "캐시를 공격적으로 하되, 반드시 무효화 수단을 함께 만들어야" 합니다.

### 문제 3: SSE 스트리밍 안 됨

**증상**: 개발 환경에서는 글자가 하나씩 나타나는데, 프로덕션에서는 전체 응답이 한번에 도착.

**원인**: Nginx의 기본 `proxy_buffering on` 설정. Nginx가 백엔드 응답을 버퍼에 모았다가 한번에 전달.

**해결**: `proxy_buffering off; proxy_cache off; chunked_transfer_encoding on;`

**교훈**: 개발/프로덕션 환경이 다를 때는, 프로덕션에서만 존재하는 계층(Nginx)에서 문제가 생길 수 있습니다.

### 문제 4: Zustand Hydration 깜빡임

**증상**: 로그인한 사용자가 새로고침하면 잠깐 로그인 페이지가 보였다가 메인 페이지로 이동.

**원인**: Zustand persist의 hydration이 비동기. React 마운트 시점에 `isAuthenticated = false`.

**해결**: `isHydrated` 플래그 도입. hydration 완료 전까지 로딩 스피너 표시.

**교훈**: persist 미들웨어를 쓸 때는 반드시 hydration 상태를 UI에 반영해야 합니다.

### 문제 5: 401 에러 중복 처리

**증상**: 토큰 만료 시 여러 API 요청이 동시에 401 반환 → `window.location.href`가 여러 번 호출.

**원인**: 페이지 하나에서 일기 목록, 알림 수, 구독 상태 등 여러 API를 동시 호출.

**해결**: `isLoggingOut` 플래그로 중복 실행 방지.

**교훈**: 글로벌 인터셉터에서 부수 효과(리다이렉트, 상태 초기화)를 실행할 때는 반드시 중복 방지 로직이 필요합니다.

### 문제 6: VITE_ 환경변수를 런타임에 바꾸려 함

**증상**: 프로덕션 Docker 컨테이너에서 `VITE_API_URL` 환경변수를 바꿨는데 반영 안 됨.

**원인**: Vite 환경변수는 빌드 타임에 문자열로 치환됨. 런타임 환경변수가 아님.

**해결**: `docker-compose.prod.yml`의 `args`로 빌드 시점에 주입. 변경하려면 `--build`로 재빌드.

**교훈**: CSR(Client-Side Rendering) 앱에서 환경변수는 "빌드 시점에 확정되는 상수"입니다.

---

## 부록: 핵심 파일 참조

| 파일 | 역할 |
|------|------|
| `frontend/src/main.tsx` | 앱 진입점 (버전 체크 + SW 등록) |
| `frontend/src/App.tsx` | 라우팅 정의 |
| `frontend/src/lib/version.ts` | 앱 버전 관리 + localStorage 초기화 |
| `frontend/src/lib/api.ts` | Axios 인스턴스 + 인터셉터 |
| `frontend/src/lib/error.ts` | 에러 메시지 한국어 번역 |
| `frontend/src/lib/queryClient.ts` | TanStack Query 전역 설정 |
| `frontend/src/store/authStore.ts` | Zustand 인증 상태 (persist) |
| `frontend/src/hooks/usePWA.ts` | PWA 설치/업데이트 훅 |
| `frontend/src/services/chatService.ts` | SSE 스트리밍 구현 |
| `frontend/src/components/common/ProtectedRoute.tsx` | 인증 가드 |
| `frontend/src/components/pwa/InstallPrompt.tsx` | 앱 설치 안내 UI |
| `frontend/src/components/pwa/UpdatePrompt.tsx` | 앱 업데이트 안내 UI |
| `frontend/vite.config.ts` | Vite + PWA 플러그인 설정 |
| `frontend/nginx.conf` | 프로덕션 Nginx 설정 |
| `frontend/Dockerfile.prod` | 프로덕션 2-Stage 빌드 |
| `frontend/public/manifest.json` | PWA 매니페스트 |
| `docker-compose.prod.yml` | 프로덕션 Docker 구성 |

---

> 마지막 업데이트: 2026-02-17 | DearMe v1.16.4
