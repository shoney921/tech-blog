---
title: "DearMe 프론트엔드 — 캐싱 삼중주와 수동 버전 관리라는 선택"
date: 2026-02-17T12:00:00
---

# DearMe 프론트엔드 — 캐싱 삼중주와 수동 버전 관리라는 선택

SPA를 배포하고 나서 "사용자한테 안 보여요"라는 말을 들어본 적 있는가? 나는 있다. 정확히는 DearMe를 운영하면서 꽤 여러 번 들었다. 새 기능을 넣고 배포했는데, 사용자가 이전 버전을 계속 쓰고 있는 거다. 심지어 새로고침을 해도 안 바뀌는 경우도 있었다.

이 글은 그 문제를 해결하려고 만든 캐싱 구조와 버전 관리 전략에 대한 이야기다. Vite의 Content Hashing, Nginx 캐시 정책, Service Worker 캐싱 — 이 세 가지가 어떻게 맞물려 돌아가는지, 그리고 왜 하필 수동 버전 관리를 선택했는지를 다룬다.

---

## "배포했는데 왜 안 바뀌죠?"

SPA의 동작 원리를 생각하면 이 문제가 왜 생기는지 금방 이해할 수 있다. 전통적인 서버 렌더링 앱은 페이지마다 서버에서 HTML을 새로 받아오지만, SPA는 처음에 `index.html` 하나를 받고 그 안에 참조된 JS 번들이 모든 것을 그린다.

문제는 브라우저가 이 JS 파일을 캐시한다는 것이다. 서버에 새 코드를 올려도 브라우저는 "아, 이 파일 어제 받았잖아. 캐시에 있는 거 쓸게"라고 한다. 사용자 입장에서는 새로고침해도 옛날 앱이 나오는 거다.

이것만이 아니다. PWA로 만들어서 Service Worker까지 쓰고 있으면 상황이 더 복잡해진다. SW가 네트워크 요청을 가로채서 자기 캐시에서 응답을 돌려보내기 때문에, 서버에 새 파일이 있는 줄도 모른다.

DearMe에서는 이 문제를 세 겹의 캐시 전략으로 풀었다.

---

## 첫 번째 층: Vite Content Hashing

Vite가 빌드할 때 파일 내용의 해시를 파일명에 넣어준다.

```
src/App.tsx     →  assets/index-a1b2c3d4.js   (v1.16.3)
src/App.tsx 수정 →  assets/index-e5f6g7h8.js   (v1.16.4)
```

코드를 한 글자라도 바꾸면 해시가 바뀌고, 해시가 바뀌면 파일명이 바뀐다. 파일명이 바뀌면 브라우저 입장에서는 완전히 새로운 파일이다. 캐시에 있는 `index-a1b2c3d4.js`와 새로 요청하는 `index-e5f6g7h8.js`는 이름부터 다르니까 캐시 충돌 같은 건 일어나지 않는다.

그런데 여기에 한 가지 전제 조건이 있다. `index.html`이 항상 최신이어야 한다. `index.html` 안에 `<script src="/assets/index-e5f6g7h8.js">`라고 새 해시가 적혀 있어야 브라우저가 새 JS를 요청하니까. **옛날 `index.html`을 캐시해서 보고 있으면 옛날 해시의 JS를 계속 요청하게 된다.** 이게 핵심이다.

---

## 두 번째 층: Nginx 캐시 정책

그래서 Nginx에서 파일 종류별로 캐시 정책을 다르게 설정했다.

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
```

`index.html`은 **절대 캐시하지 않는다**. 사용자가 접속할 때마다 서버에서 최신 `index.html`을 받아오게 한다. 이 파일은 보통 몇 KB도 안 되니까 네트워크 비용이 거의 없다.

반면 JS/CSS 같은 에셋은 **1년이나 캐시한다**. 과하다고 느낄 수 있는데, 위에서 설명한 Content Hashing 덕분에 가능하다. 파일명에 해시가 있으니 같은 이름 = 같은 내용이다. 내용이 바뀌면 이름 자체가 바뀌니까, "같은 파일인데 내용이 달라졌어" 같은 상황이 구조적으로 발생하지 않는다. `immutable` 헤더는 브라우저에게 "이 파일은 절대 안 바뀌니까 재검증 요청도 하지 마"라고 알려주는 거다.

`sw.js`도 캐시하면 안 된다. Service Worker는 브라우저가 주기적으로 `sw.js`를 다시 가져와서 변경 여부를 확인하는데, 이걸 캐시해버리면 새 SW가 배포되어도 브라우저가 알 수 없다.

이렇게 되면 배포 후 사용자가 접속하는 흐름은 이렇게 된다.

```
사용자 접속
  → Nginx가 index.html 반환 (no-cache → 항상 서버에서 최신)
  → index.html 안의 <script src="/assets/index-NEW_HASH.js">
  → 브라우저가 새 해시의 JS 요청 (캐시에 없으니 서버에서 다운로드)
  → 새 JS 실행 → 새 버전의 앱 작동
```

심플하다. `index.html`만 항상 최신으로 유지하면 나머지는 자동으로 따라온다.

---

## 세 번째 층: Service Worker 캐싱

DearMe는 PWA다. 매일 일기를 쓰는 앱이니까, 홈 화면 아이콘으로 바로 접속하는 경험이 중요했다. 그리고 PWA를 하려면 Service Worker가 필요하다.

문제는 SW가 네트워크 요청 앞에 한 겹 더 끼어든다는 것이다. `vite-plugin-pwa`가 Workbox 기반으로 SW를 자동 생성하는데, 여기에 두 종류의 캐싱이 있다.

### Precache와 Runtime Cache

**Precache**는 빌드 시점에 "어떤 파일을 캐시할지" 목록이 정해진다. SW가 설치될 때 이 목록에 있는 파일을 한꺼번에 다운로드해서 캐시에 넣어둔다. JS, CSS, HTML 같은 앱 셸(shell) 파일이 대상이다.

```typescript
// vite.config.ts - VitePWA 설정
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
}
```

**Runtime Cache**는 사용자가 실제로 요청할 때 전략에 따라 처리한다. API 호출, 이미지, 폰트 같은 것들이다.

```typescript
runtimeCaching: [
  {
    urlPattern: /^https?:\/\/.*\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: { maxEntries: 100, maxAgeSeconds: 300 },
      networkTimeoutSeconds: 10,
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
    },
  },
]
```

### 왜 API에 NetworkFirst이고 이미지에 CacheFirst인가

API 응답은 실시간 데이터다. 일기 목록, 페르소나 상태 같은 건 항상 최신을 가져와야 한다. 그래서 **NetworkFirst** — 일단 네트워크에서 가져오고, 네트워크가 안 되면 캐시에서 보여준다. `networkTimeoutSeconds: 10`을 설정해서 느린 네트워크에서도 10초 안에 응답이 없으면 캐시를 쓰게 했다. 빈 화면보다는 마지막으로 캐시된 데이터를 보여주는 게 낫다는 판단이었다.

이미지는 반대다. 한번 올린 프로필 사진이나 UI 아이콘이 실시간으로 바뀔 일은 거의 없다. 그래서 **CacheFirst** — 캐시에 있으면 바로 쓰고, 없을 때만 네트워크로 간다. 앱 체감 속도에 상당히 기여하는 부분이다. 이미지를 매번 네트워크에서 받아오면 리스트 스크롤할 때 깜빡이거나 느려지는 게 체감된다.

폰트도 CacheFirst로 1년 캐시한다. 폰트야말로 거의 안 바뀌는 리소스니까.

---

## 삼중 캐시가 만나면 — 실제 요청 순서

이 세 계층이 동시에 작동할 때 실제 요청은 이렇게 흐른다.

```
브라우저 → Service Worker (가로챔) → Nginx → 파일시스템
```

1. 브라우저가 리소스를 요청하면 SW가 먼저 가로챈다
2. SW의 precache에 해당 파일이 있으면 캐시에서 바로 반환 (Nginx까지 안 간다)
3. 없으면 Nginx로 요청이 간다
4. Nginx는 자신의 캐시 정책에 따라 응답한다

배포 후 업데이트는 조금 더 복잡하다.

```
1. 새 빌드 → sw.js 내용 변경 (precache 목록이 바뀌니까)
2. 브라우저가 sw.js 재확인 (no-cache 정책이라 항상 서버에서 받아옴)
3. 새 SW 감지 → "installing" 상태로 새 precache 다운로드
4. 다운로드 완료 → "waiting" 상태
5. "업데이트 가능" 배너 표시
6. 사용자가 "지금 업데이트" 클릭 → SKIP_WAITING → 페이지 리로드
7. 새 SW 활성화 → 새 precache 사용
```

여기서 `registerType: 'prompt'`를 쓴 이유가 있다. 새 SW가 감지되면 자동으로 활성화하는 `autoUpdate` 방식도 있는데, 그러면 사용자가 일기를 쓰고 있는 도중에 갑자기 페이지가 리로드될 수 있다. 일기 앱에서 그건 최악이다. 사용자가 준비됐을 때 업데이트하도록 선택권을 줘야 했다.

---

## 수동 버전 관리라는 선택

캐싱 이야기만 하면 "브라우저에 새 코드를 잘 전달하는 법"이 되는데, 실은 또 다른 문제가 있었다. localStorage.

### 코드는 새건데 데이터는 옛날 거

이런 시나리오를 생각해보자.

1. v1.15.0이 배포되어 있다. 사용자 A가 접속해서 앱을 쓴다.
2. v1.16.0을 배포한다. Zustand 스토어 구조를 변경했다.
3. 사용자 A는 새로고침 없이 계속 쓰고 있다. localStorage에는 v1.15.0 형식의 데이터가 들어있다.
4. SW 업데이트로 새 JS가 로드된다. 새 코드가 옛날 형식의 localStorage 데이터를 읽으려 한다.
5. 크래시.

이걸 방지하려고 localStorage에 버전 게이트를 만들었다.

```typescript
// version.ts
export const APP_VERSION = '1.16.4'

export function checkAndUpdateVersion(): boolean {
  const storedVersion = localStorage.getItem('app_version')

  if (storedVersion !== APP_VERSION) {
    const keysToKeep = ['theme', 'access_token', 'auth-storage',
                        'pwa-install-dismissed', 'pwa-visit-count']
    const backup: Record<string, string> = {}
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) backup[key] = value
    })

    localStorage.clear()

    Object.entries(backup).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    localStorage.setItem('app_version', APP_VERSION)

    return true
  }
  return false
}
```

앱이 시작될 때 가장 먼저 이 함수가 실행된다. React가 마운트되기 전에. 저장된 버전과 코드의 버전이 다르면 localStorage를 싹 밀어버린다.

### keysToKeep — 뭘 살리고 뭘 죽이나

전부 밀어버리면 간단하겠지만, 그러면 사용자가 매 배포마다 로그아웃된다. 다크모드 설정도 날아가고, PWA 설치 배너를 닫았던 기록도 사라진다. 그래서 "확실히 안전한 키"만 백업하고 나머지를 정리하는 방식을 택했다.

- `theme` — 다크모드 설정. 날리면 매 배포마다 라이트 모드로 초기화되니 불편
- `access_token` — JWT 토큰. 날리면 강제 로그아웃
- `auth-storage` — Zustand persist 데이터. 로그인 상태 유지에 필요
- `pwa-install-dismissed` — "앱 설치하세요" 배너 닫기 기록. 날리면 또 뜬다
- `pwa-visit-count` — 방문 횟수. 설치 배너 조건에 사용

나머지, 특히 TanStack Query 관련 캐시 같은 건 새 코드와 호환성이 보장되지 않으니까 정리한다.

### 왜 Git hash가 아닌 수동 버전인가

솔직히 Git commit hash를 빌드 시 주입하는 게 자동화 측면에서는 더 편하다. 깜빡할 일이 없으니까. 근데 그렇게 하면 **모든 커밋이 localStorage 초기화를 유발한다**. README 오타 하나 고친 배포에서도, CSS 색상값 하나 바꾼 배포에서도 localStorage가 밀린다.

실제로 localStorage 초기화가 필요한 건 Zustand 스토어 구조가 바뀔 때, 혹은 TanStack Query의 queryKey 체계가 변경될 때처럼 데이터 호환성이 깨지는 배포뿐이다. 수동 버전은 개발자가 "이번 배포는 초기화가 필요한가?"를 판단하게 한다.

단점은 뻔하다. 깜빡하고 안 올릴 수 있다. 실제로 그랬다. 그리고 그게 무한 리로드 사건으로 이어졌다.

---

## 배포 후 무한 리로드 사건

이건 진짜 식은땀이 났던 경험이다.

어느 날 배포를 했는데, 일부 사용자에게서 "페이지가 계속 새로고침돼요"라는 피드백이 왔다. 확인해보니 이런 일이 벌어지고 있었다.

1. Zustand 스토어 구조를 변경한 배포를 했다
2. 그런데 `APP_VERSION`을 올리는 걸 깜빡했다
3. 사용자의 localStorage에는 옛날 형식의 Zustand 데이터가 그대로 남아있다
4. 새 코드가 옛 데이터를 파싱하다가 에러가 터진다
5. 에러 핸들러가 "뭔가 문제가 있네, 페이지를 리로드하자"고 판단한다
6. 리로드해도 localStorage는 그대로다 (버전 체크를 안 했으니까 정리도 안 됨)
7. 같은 에러 → 같은 리로드 → 무한 루프

사용자가 직접 브라우저 캐시를 지우거나, 개발자 도구에서 localStorage를 수동으로 삭제하기 전까지는 해결이 안 되는 상태였다.

급하게 핫픽스로 버전을 올려서 재배포했고, 그제서야 사용자들의 localStorage가 정리되면서 정상화됐다. 이후로 CLAUDE.md, 배포 체크리스트, 심지어 PR 템플릿에까지 "스토어 구조 변경 시 APP_VERSION 업데이트 필수"라는 문구를 넣어뒀다.

:::danger 교훈
수동 프로세스가 포함된 시스템에는 여러 곳에 체크포인트를 만들어야 한다. 한 곳에서 놓쳐도 다른 곳에서 잡을 수 있도록.
:::

이 사건 이후에 "그냥 Git hash 쓸까?"를 심각하게 고민했다. 근데 결국 안 바꿨다. 모든 배포에서 localStorage가 초기화되는 것도 나름의 비용이라고 생각했기 때문이다. 매번 사용자의 캐시 데이터를 날리면 TanStack Query가 다시 fetch해야 하고, 체감 속도가 떨어진다. 결국 수동이지만 의도적으로 제어하는 쪽을 유지하기로 했다. 정답은 아닐 수 있다. 아직도 좀 고민이 되는 부분이긴 하다.

---

## 이 세 가지가 맞물리는 방식

정리하면, 앱이 시작될 때 이런 순서로 실행된다.

```
main.tsx 실행
  │
  ├─ checkAndUpdateVersion()    ← (1) 버전 비교 + localStorage 정리
  │
  ├─ ReactDOM.createRoot()      ← (2) React 마운트
  │    └─ App.tsx
  │         └─ Zustand이 localStorage에서 상태 복원 (정리된 상태에서)
  │
  └─ serviceWorker.register()   ← (3) SW 등록 (프로덕션만)
```

(1)이 (2)보다 먼저 실행되니까, React가 마운트되는 시점에는 이미 localStorage가 정리된 깨끗한 상태다. 이 순서가 어긋나면 문제가 생긴다.

그리고 이걸 감싸는 바깥 층에 Nginx의 캐시 정책이 있다. `index.html`은 항상 서버에서 최신을 받아오니까 새 버전의 JS가 로드되고, 새 JS 안에 들어있는 `APP_VERSION`으로 localStorage를 점검한다. Content Hash가 있는 JS/CSS는 1년간 캐시하지만, 이름 자체가 바뀌니까 문제가 없다.

그 위에 Service Worker가 오프라인 지원과 캐싱 최적화를 담당한다. API는 NetworkFirst로 항상 최신 데이터를 시도하고, 이미지와 폰트는 CacheFirst로 빠르게 응답한다.

세 계층이 각자의 역할을 하면서도 서로 충돌하지 않는 구조다. 적어도 의도는 그렇다. 실전에서는 위에서 본 것처럼 빈틈이 있었고, 그때마다 하나씩 메꿔온 결과물이다.

---

## 남아있는 고민

완벽한 건 아니다. 수동 버전 관리의 인적 실수 리스크는 여전하고, semver 규칙을 엄격히 따르는 것도 아니라서 버전 번호 자체에 의미가 많지는 않다. "올려야 할 때 올린다"가 전부다.

언젠가 CI에서 스토어 타입의 변경을 감지하면 자동으로 버전을 올리게 하는 것도 생각해봤는데, 그 정도 자동화가 1인 개발 프로젝트에 필요한지는 잘 모르겠다. 지금은 체크리스트를 꼼꼼히 보는 것으로 충분하다고 판단하고 있다. 이것도 언제 생각이 바뀔지 모르지만.
