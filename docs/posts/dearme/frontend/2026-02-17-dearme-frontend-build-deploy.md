---
title: "DearMe 프론트엔드 — 빌드부터 배포까지, Docker와 Nginx 이야기"
date: 2026-02-17T11:00:00
---

# DearMe 프론트엔드 — 빌드부터 배포까지, Docker와 Nginx 이야기

프론트엔드 코드를 작성하는 건 전체 여정의 절반쯤이다. 나머지 절반은 그 코드가 사용자 브라우저에 도달하기까지의 여정 — 빌드, 컨테이너화, 네트워크 프록시, 배포 — 이런 것들이다. DearMe를 만들면서 이 부분에서 생각보다 많이 삽질했고, 그 과정에서 배운 것들을 정리해본다.

DearMe는 일기 기반 AI 페르소나 서비스로, 혼자서 만들고 있는 프로젝트다. Mac Mini에서 셀프호스팅하고 있다. React + TypeScript + Vite 스택이고, Docker로 패키징해서 Nginx로 서빙한다. 거창하게 들릴 수 있지만, 1인 개발에서 할 수 있는 범위 안에서 나름 합리적인 선택이었다고 생각한다.

---

## `npm run build` 뒤에서 무슨 일이 일어나는가

Vite 프로젝트에서 `npm run build`를 치면 내부적으로 두 단계가 실행된다.

```bash
npm run build
# 실제로는: tsc && vite build
```

먼저 **tsc**가 TypeScript 타입 체크를 수행한다. 여기서 에러가 나면 빌드가 멈춘다. 그다음 **vite build**가 Rollup을 이용해 실제 번들링을 수행한다. 이 과정에서 일어나는 일을 좀 풀어보면:

- **Tree-shaking**: import하지 않는 코드를 제거한다. lodash에서 `debounce` 하나만 쓰면 나머지는 다 날아간다.
- **Code splitting**: 라우트별로 청크를 분리한다. 사용자가 첫 화면만 보면 전체 앱 코드를 다 내려받을 필요가 없다.
- **Asset hashing**: `App-3f8a2b1c.js` 같은 형태로 파일명에 content hash를 넣는다. 내용이 바뀌면 해시가 바뀌고, 해시가 바뀌면 파일명이 바뀐다. 캐싱과 관련해서 굉장히 중요한 부분인데, 뒤에서 더 이야기하겠다.
- **Minification**: 변수명 축약, 공백 제거 등으로 코드를 압축한다.

빌드가 끝나면 `dist/` 폴더에 이런 결과물이 나온다:

```
dist/
├── index.html                  # 해시된 JS/CSS를 참조하는 진입점
├── sw.js                       # Service Worker (PWA용)
├── manifest.json               # PWA 매니페스트
└── assets/
    ├── index-a1b2c3d4.js       # 메인 번들
    ├── index-e5f6g7h8.css      # 스타일
    └── vendor-i9j0k1l2.js      # 라이브러리 청크
```

이게 전부다. 결국 프론트엔드 빌드의 산출물은 HTML 파일 하나와 몇 개의 JS/CSS 파일뿐이다. React 컴포넌트도, TypeScript도, JSX도 빌드 결과물에는 흔적이 없다. 브라우저가 이해하는 언어로 완전히 변환된 정적 파일들만 남는다.

---

## 2-Stage Docker 빌드: 왜 굳이 두 단계로 나누나

여기서 질문이 하나 생긴다. 빌드 결과물이 고작 몇 MB짜리 정적 파일이라면, 왜 Docker 이미지에 Node.js와 `node_modules`가 들어있어야 하나? 답은 간단하다. 들어있으면 안 된다.

DearMe의 프로덕션 Dockerfile을 보자:

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

Stage 1에서 Node.js 환경을 만들고, `npm ci`로 의존성을 설치하고, 빌드한다. 이 시점의 이미지에는 `node_modules`(400MB+), TypeScript 컴파일러, 소스코드 원본 등이 다 들어있다. 무겁다.

Stage 2에서는 `nginx:alpine`이라는 가벼운 베이스 이미지 위에, Stage 1에서 빌드한 `dist/` 폴더만 복사한다. 그리고 Nginx 설정 파일도 같이 넣는다. 끝.

최종 이미지 크기? 대략 **40MB 정도**. Node.js 환경을 통째로 넣으면 수백 MB가 되었을 텐데, 정적 파일과 Nginx만 들어가니까 이 정도다. Mac Mini 한 대에서 여러 서비스를 돌리는 입장에서, 이미지 크기는 신경 쓸 수밖에 없었다.

---

## VITE_ 환경변수의 함정 — 빌드 타임에 굳어버린다

이 부분은 내가 실제로 삽질한 이야기다. 프로덕션 배포 후에 API URL을 바꿔야 할 일이 생겼는데, Docker 컨테이너의 환경변수만 바꾸면 될 줄 알았다. 반영이 안 됐다.

Vite에서 `VITE_` 접두사가 붙은 환경변수는 빌드 시점에 문자열로 치환된다. 소스코드에서 `import.meta.env.VITE_API_URL`이라고 쓰면, 빌드 후에는 그 자리에 실제 문자열이 박혀버린다:

```typescript
// 소스코드
const url = import.meta.env.VITE_API_URL

// 빌드 결과 (문자열로 치환됨)
const url = ""   // 빈 문자열이 하드코딩됨
```

이건 런타임 환경변수가 아니다. 빌드 타임에 확정되는 상수다. 그래서 Docker의 `environment`(런타임 환경변수)로 넘기면 아무 효과가 없다. `docker-compose.prod.yml`에서 **`args`(빌드 인자)** 로 넘겨야 한다.

```yaml
# docker-compose.prod.yml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ""     # 빌드 시점에 주입 (빈 문자열 = 상대 경로)
```

값을 바꾸려면? 이미지를 다시 빌드해야 한다. `--build` 플래그를 붙여서.

:::danger VITE_ 환경변수는 런타임에 못 바꾼다
CSR(Client-Side Rendering) 앱에서 `VITE_` 접두사 환경변수는 빌드 시점에 문자열로 치환된다. Docker 컨테이너의 환경변수를 바꿔도 이미 빌드된 JS 파일 안에 박힌 값은 변하지 않는다. 변경하려면 반드시 `--build`로 재빌드해야 한다.
:::

이 실수에서 배운 게 하나 있다면, **프론트엔드 빌드 결과물은 한번 구워지면 끝**이라는 점이다. 백엔드처럼 환경변수를 읽어서 동적으로 동작하는 게 아니다. 이미 JS 파일 안에 문자열이 박혀있다. 이걸 이해하고 나니까 Dockerfile에서 왜 `ARG`를 쓰는지, 왜 `ENV`로는 안 되는지가 명확해졌다.

---

## 전체 네트워크 흐름: 사용자 브라우저에서 DB까지

DearMe의 프로덕션 네트워크 구조를 한 장으로 보면 이렇다:

```
                            ┌── Mac Mini (호스트) ────────────────────────────┐
                            │                                                 │
[사용자 브라우저]            │  ┌───────────────────────────────────────────┐  │
       │                    │  │    Docker Network: dearme-prod-network    │  │
       │ HTTPS              │  │                                           │  │
       v                    │  │  ┌─────────────────┐                      │  │
┌──────────────┐            │  │  │ Nginx (frontend) │── /api/* ──> ┌─────┐│  │
│  Cloudflare  │── :8080 ──>│  │  │   :80 → :8080   │              │ Fast││  │
│  Tunnel      │            │  │  │                  │              │ API ││  │
│ (cloudflared)│            │  │  │ 정적파일: dist/  │              │:8000││  │
│  host network│            │  │  └─────────────────┘              │→8001││  │
└──────────────┘            │  │                                    └──┬──┘│  │
                            │  │                                       │   │  │
                            │  │                                       v   │  │
                            │  │                                 ┌────────┐│  │
                            │  │                                 │Postgres││  │
                            │  │                                 │ :5432  ││  │
                            │  │                                 │ →:5433 ││  │
                            │  │                                 └────────┘│  │
                            │  └───────────────────────────────────────────┘  │
                            └─────────────────────────────────────────────────┘
```

사용자가 `dearme.shoneylife.com`에 HTTPS로 접속하면 이런 일이 벌어진다:

1. **Cloudflare Tunnel**이 요청을 받는다. 이건 서버에 공인 IP나 포트포워딩 없이도 HTTPS 서비스를 가능하게 해주는 도구다. DDoS 방어도 기본 제공. `network_mode: host`로 호스트 네트워크를 직접 사용해서 `localhost:8080`으로 요청을 넘긴다.

2. **Nginx**(frontend 컨테이너 안에 있음)가 요청을 받는다. 정적 파일 요청이면 `dist/`에서 서빙하고, `/api/*` 경로면 백엔드로 프록시한다. SPA 라우팅을 위해 존재하지 않는 경로는 `index.html`로 폴백한다(`try_files`).

3. **FastAPI** 백엔드가 API 요청을 처리하고, 필요하면 **PostgreSQL**에서 데이터를 가져온다.

### Nginx가 왜 별도 컨테이너가 아니라 frontend 안에 있나?

별도로 뺄 수도 있었다. 하지만 "프론트엔드 = 빌드된 정적 파일 + 그걸 서빙할 웹 서버"를 하나의 단위로 묶는 게 더 자연스럽다고 느꼈다. 프론트엔드를 재배포하면 Nginx 설정도 같이 업데이트되고, `nginx.conf`가 프론트엔드 코드와 같은 Git 히스토리에서 관리된다. 컨테이너 수도 줄어서 Mac Mini의 리소스를 아낄 수 있다.

이건 좀 의견이 갈릴 수 있는 부분이다. 대규모 서비스에서는 Nginx를 리버스 프록시 전용 컨테이너로 분리하는 게 일반적이다. 하지만 1인 개발 + 셀프호스팅에서는 단순함이 정의다.

### API 상대 경로를 쓰는 이유

프로덕션에서 `VITE_API_URL`을 빈 문자열로 설정하면, API 요청이 `/api/v1/diaries` 같은 상대 경로가 된다. 브라우저는 현재 도메인으로 요청하고, Nginx가 이를 백엔드로 프록시한다.

```typescript
// api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
// 프로덕션: VITE_API_URL="" → baseURL = "/api/v1"
// 개발:     VITE_API_URL="http://localhost:8002" → "http://localhost:8002/api/v1"
```

이 방식의 가장 큰 장점은 **CORS 문제가 아예 없다**는 거다. 같은 도메인에서 요청하니까 cross-origin이 아니다. 쿠키나 Authorization 헤더도 프록시가 그대로 전달해준다. 도메인을 바꿔야 할 때도 프론트엔드 재빌드 없이 Nginx 설정만 바꾸면 된다.

처음에 프론트엔드에서 백엔드 URL을 절대 경로로 직접 때려넣었다가, CORS 설정 때문에 한참 고생했던 기억이 있다. 프록시 패턴으로 전환하고 나서 그런 걱정이 사라졌다.

---

## 개발 환경 vs 프로덕션 환경

DearMe는 개발과 프로덕션 환경이 꽤 다르다. 같은 Mac Mini에서 동시에 돌릴 수 있도록 포트, 볼륨, 네트워크를 전부 분리해두었다.

| 항목 | 개발 환경 | 프로덕션 환경 |
|------|----------|-------------|
| 프론트엔드 서버 | Vite 개발서버 (HMR) | Nginx (정적 파일) |
| 프론트 포트 | :5173 | :8080 (내부 :80) |
| 백엔드 포트 | :8002 (내부 :8000) | :8001 (내부 :8000) |
| DB 포트 | :5434 (내부 :5432) | :5433 (내부 :5432) |
| API 호출 | `http://localhost:8002/api/v1` (직접) | `/api/v1` (Nginx 프록시) |
| 네트워크 | `dearme-dev-network` | `dearme-prod-network` |
| 파일 변경 반영 | 즉시 (HMR) | 재빌드 필요 |

```bash
# 개발 환경
docker-compose up -d

# 프로덕션 환경 (같은 머신에서 동시 실행 가능)
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

개발 환경에서는 Vite 개발서버가 돌아간다. HMR 덕분에 코드를 고치면 브라우저에 즉시 반영된다. 프론트엔드에서 백엔드 API를 직접 호출하기 때문에 Nginx 프록시가 없다. Service Worker도 비활성화 상태다 — 개발 중에 캐시가 껴들면 디버깅이 지옥이 되기 때문이다.

프로덕션에서는 Nginx가 정적 파일을 서빙하고, API 프록시 역할을 한다. Cloudflare Tunnel이 HTTPS를 처리하고, Service Worker가 오프라인 캐싱을 담당한다. 소스맵은 포함하지 않는다.

이 분리가 중요한 이유가 하나 있다. 내 경험상 "프로덕션에서만 터지는" 버그가 가끔 발생한다. 개발 환경에서는 잘 되는데, 프로덕션에서만 안 되는 경우. 대부분 Nginx 계층 때문이다. SSE 스트리밍이 안 되거나, 특정 헤더가 빠지거나. 그런 문제를 로컬에서 재현하려면 프로덕션 환경을 같은 머신에서 띄울 수 있어야 한다.

---

## 배포 프로세스: 코드 수정부터 사용자 업데이트까지

배포는 생각보다 단순하다. 한번 파이프라인을 잡아놓으면.

```
1. 코드 변경 완료 + 테스트

2. version.ts의 APP_VERSION 올리기
   └── 예: '1.16.3' → '1.16.4'

3. Git 커밋

4. Docker 빌드 + 배포
   └── docker-compose -f docker-compose.prod.yml \
         --env-file .env.production up --build -d
```

4번 명령을 치면 Docker가 내부적으로 이런 일을 한다:

- **frontend 컨테이너**: Stage 1에서 npm ci, tsc, vite build를 수행하고, Stage 2에서 nginx:alpine에 빌드 결과물을 복사
- **backend 컨테이너**: pip install 후 uvicorn 실행
- **postgres**: 기존 볼륨이 유지되므로 데이터는 보존
- **cloudflared**: 터널 재연결

DB 스키마가 바뀌었으면 마이그레이션도 돌려야 한다:

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

그다음 컨테이너 상태를 확인한다:

```bash
docker-compose -f docker-compose.prod.yml ps
# 4개 컨테이너 모두 Up + postgres healthy
```

### 사용자한테는 어떻게 전달되나

배포가 끝나면, 사용자 쪽에서는 이런 흐름이 진행된다:

일반 웹 사용자는 새로고침하면 Nginx가 `index.html`을 no-cache로 서빙하고, 새 `index.html`이 새 해시의 JS 파일을 참조하니까 자동으로 최신 버전을 받게 된다. 앱 내부의 `initVersion()`이 localStorage 버전을 비교해서, 필요하면 정리해준다.

PWA 사용자는 조금 다르다. Service Worker가 60분 주기로 업데이트를 체크하고, 새 `sw.js`를 감지하면 새 SW를 설치한다. 그리고 "업데이트 가능" 배너를 보여준다. 사용자가 탭하면 그제서야 리로드. 작업 중에 갑자기 화면이 새로고침되는 일은 없다.

---

## 되돌아보며

솔직히 처음에는 "프론트엔드니까 빌드하고 어딘가에 올리면 끝이지" 하고 생각했다. 막상 해보니까 빌드 시스템, Docker 멀티스테이지, Nginx 설정, 환경변수 주입 시점, 네트워크 프록시 구조... 이런 것들이 하나의 체인을 이루고 있었다. 하나라도 이해가 부족하면 디버깅할 때 어디를 봐야 할지 모르게 된다.

특히 VITE_ 환경변수 삽질은 정말 뼈아팠다. "빌드 타임 치환"이라는 개념을 머리로는 알고 있었는데, 실제로 겪기 전까지는 체감이 안 됐다. Docker의 `args`와 `environment`의 차이를 몸으로 배운 셈이다.

그리고 개발 환경과 프로덕션 환경을 동시에 돌릴 수 있는 구조를 만들어둔 건 정말 잘한 결정이었다. "프로덕션에서만 안 되는" 문제를 로컬에서 바로 확인할 수 있으니까. 포트 하나, 볼륨 경로 하나, 네트워크 이름 하나 — 이런 사소한 분리가 나중에 큰 차이를 만든다.

아직 고민 중인 부분도 있다. CI/CD를 도입할지 말지. 지금은 수동 배포인데 혼자 개발하다 보니 `docker-compose up --build` 한 줄이면 끝이라 크게 불편하지는 않다. 하지만 배포 전에 버전 올리는 걸 깜빡하거나, 마이그레이션을 빼먹는 실수는 가끔 한다. 이런 건 자동화하는 게 맞는 것 같기도 하고... 아직은 체크리스트로 버티고 있다.
