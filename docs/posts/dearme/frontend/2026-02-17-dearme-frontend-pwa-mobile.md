---
title: "DearMe 프론트엔드 — PWA 구현기와 iOS Safari와의 전쟁"
date: 2026-02-17T13:00:00
---

# DearMe 프론트엔드 — PWA 구현기와 iOS Safari와의 전쟁

DearMe는 일기 앱이다. 매일 쓰는 서비스다. 그런데 매번 브라우저를 열고 주소를 입력해서 접속한다? 그건 일기장이 아니라 웹사이트다. 사용자가 홈 화면에서 아이콘 하나 톡 누르면 바로 일기를 쓸 수 있어야 한다. 그래서 PWA를 도입했고, 그 과정에서 iOS Safari와 길고 지루한 전쟁을 치르게 됐다.

솔직히 PWA 자체는 어렵지 않았다. manifest.json 작성하고, Service Worker 등록하고, 아이콘 준비하면 기본은 된다. 진짜 문제는 그 이후였다. iOS Safari가 다른 브라우저들과 미묘하게 — 때로는 노골적으로 — 다르게 동작하는 지점들에서 시간을 한참 잡아먹었다.

---

## PWA, 왜 필요했나

네이티브 앱을 만들면 되지 않느냐고 물을 수 있다. 맞는 말이다. 근데 1인 개발에서 iOS 앱 + Android 앱 + 웹을 동시에 관리한다는 건 현실적으로 불가능에 가깝다. React Native나 Flutter를 써도 결국 각 플랫폼별 이슈는 따로 챙겨야 한다.

PWA는 이 문제에 대한 나름 합리적인 절충안이었다. 웹 기술 하나로 만들되, 네이티브 앱에 가까운 사용 경험을 제공할 수 있으니까.

DearMe에서 PWA가 해결해주는 것들:

- **홈 화면 아이콘으로 원탭 접속** — 일기 앱의 핵심. 접근 장벽을 낮춰야 매일 쓴다
- **오프라인 폴백** — 네트워크가 끊겨도 빈 화면 대신 안내 페이지를 보여줌
- **앱 설치 경험** — 앱스토어 없이도 "설치"할 수 있음
- **standalone 모드** — 브라우저 UI 없이 네이티브 앱처럼 보임

---

## manifest.json 설정

PWA의 시작점은 `manifest.json`이다. 이 파일이 브라우저에게 "이건 설치 가능한 앱이에요"라고 알려주는 역할을 한다.

```json
{
  "name": "DearMe - 일기 기반 AI 페르소나",
  "short_name": "DearMe",
  "display": "standalone",
  "orientation": "portrait",
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

몇 가지 짚고 넘어갈 부분이 있다.

`display: "standalone"`은 브라우저의 주소창과 탭 바를 숨긴다. 사용자 입장에서는 네이티브 앱을 쓰는 것처럼 보인다. 이게 PWA를 PWA답게 만드는 핵심 설정이다.

`shortcuts`는 홈 화면 아이콘을 길게 누르면 나오는 바로가기 메뉴다. 일기 앱에서 "일기 쓰기"와 "페르소나 대화"를 바로가기로 넣어두면, 사용자가 앱을 열자마자 원하는 기능으로 바로 갈 수 있다. 안드로이드에서는 잘 동작하는데, iOS에서는... 글쎄, 후에 다시 이야기하겠다.

아이콘 URL에 `?v=2`가 붙어 있는 게 보이는가? 이건 나중에 별도로 설명할 건데, iOS의 아이콘 캐시 때문에 추가한 캐시 버스팅 쿼리다. 처음부터 이걸 알았다면 좋았겠지만, 아이콘 바꿨는데 홈 화면에 반영이 안 되는 걸 보고 한참 삽질한 뒤에야 알게 됐다.

---

## 앱 설치 프롬프트, 첫 방문에 바로 띄우지 않는 이유

앱을 만들었으면 사용자에게 설치하라고 알려야 한다. 근데 이 타이밍이 꽤 중요하다.

혹시 웹사이트에 처음 들어갔는데 "알림 허용하시겠습니까?", "앱 설치하시겠습니까?", "쿠키 동의해주세요" 이런 게 한꺼번에 뜨는 경험을 해본 적 있지 않은가? 짜증난다. 아직 이 서비스가 뭔지도 모르는데 설치부터 하라니.

그래서 DearMe에서는 **3회 이상 방문한 사용자에게만** 설치 안내를 보여준다.

```typescript
const MIN_VISITS = 3

useEffect(() => {
  if (isStandalone()) return        // 이미 설치됨
  if (dismissed) return             // 사용자가 닫음
  if (visitCount < MIN_VISITS) return // 아직 3회 미만

  if (isIOS()) {
    setShowIOSGuide(true)
  } else {
    window.addEventListener('beforeinstallprompt', handler)
  }
}, [])
```

3번 이상 돌아온 사용자는 최소한 이 서비스에 관심이 있다는 뜻이다. 그때 "홈 화면에 추가하면 더 편하게 쓸 수 있어요"라고 안내하는 게 훨씬 자연스럽다. 사용자가 닫기 버튼을 누르면 `pwa-install-dismissed` 플래그를 localStorage에 저장해서 다시 띄우지 않는다.

### iOS vs Android, 설치 경험의 간극

여기서 플랫폼 간 차이가 벌어진다.

Android의 Chrome은 `beforeinstallprompt`라는 이벤트를 지원한다. 이 이벤트를 잡아서 나만의 UI로 예쁘게 설치 버튼을 만들 수 있다. "설치하기" 버튼 누르면 `deferredPrompt.prompt()`를 호출하면 끝. 깔끔하다.

iOS Safari는? 이 이벤트를 **지원하지 않는다**. 프로그래밍 방식으로 설치 프롬프트를 띄울 수 있는 방법이 아예 없다. 그래서 할 수 있는 거라곤 "공유 버튼을 누르고 → 홈 화면에 추가를 선택하세요"라는 텍스트 가이드를 보여주는 것뿐이다.

내 경험상, iOS 사용자의 PWA 설치율은 Android에 비해 상당히 낮다. 공유 버튼 → 홈 화면에 추가라는 두 단계가 추가되는 것 치고는 꽤 큰 드롭오프가 발생한다. 이건 좀 의견이 갈릴 수 있는데, Apple이 의도적으로 PWA를 어렵게 만들고 있는 게 아닌가 싶기도 하다. 앱스토어 수수료 모델과 충돌하니까.

---

## Service Worker 업데이트 전략

PWA에서 Service Worker(SW)는 핵심 인프라다. 정적 파일을 캐싱하고, 오프라인에서도 앱이 돌아가게 해주고, 업데이트 감지까지 담당한다. vite-plugin-pwa를 쓰면 Workbox 기반으로 SW를 자동 생성해주는데, 중요한 건 업데이트 전략 설정이다.

```typescript
// 60분마다 SW 업데이트 체크
useEffect(() => {
  const interval = setInterval(() => {
    navigator.serviceWorker.ready.then((reg) => reg.update())
  }, 60 * 60 * 1000)
  return () => clearInterval(interval)
}, [])
```

DearMe에서는 `registerType: 'prompt'`를 선택했다. 이 설정의 의미는 새 SW가 준비되어도 자동으로 활성화하지 않고, 사용자에게 "업데이트 가능" 배너를 보여준 뒤 사용자가 직접 업데이트 버튼을 누르면 그때 `SKIP_WAITING` → 페이지 리로드를 수행하는 것이다.

왜 자동 업데이트를 안 하느냐고? 사용자가 일기를 작성하고 있는 도중에 갑자기 페이지가 리로드되면 어떻게 되겠는가. 작성 중이던 내용이 날아간다. 일기 앱에서 그건 치명적이다. 사용자가 적절한 시점에 직접 업데이트를 트리거하게 하는 게 낫다.

---

## iOS Safari와의 전쟁

여기서부터가 진짜 본론이다. "모바일 최적화"라고 쓰고 "iOS Safari 디버깅 일지"라고 읽는다.

### Safe Area: 노치, 다이나믹 아일랜드, 홈 인디케이터

아이폰에는 노치가 있고, 최신 모델에는 다이나믹 아일랜드가 있고, 하단에는 홈 인디케이터가 있다. 이 영역들을 피하지 않으면 UI가 가려진다. standalone 모드에서는 브라우저가 대신 처리해주지 않기 때문에 직접 챙겨야 한다.

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
```

특히 하단 탭바가 홈 인디케이터와 겹치는 문제가 골치 아팠다. 탭바 높이에 safe area 하단 값을 더해줘야 한다.

```css
@layer components {
  .pb-bottomtab {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
}
```

이거 안 하면 iPhone에서 하단 탭 버튼을 누르려다 홈으로 나가는 참사가 벌어진다. 처음에 "왜 탭바가 잘 안 눌리지?" 하고 한참 헤맸었다.

### 입력 필드 자동 확대, 16px의 비밀

iOS Safari에는 독특한 "기능"이 하나 있다. `font-size`가 16px 미만인 input에 포커스하면, 브라우저가 자동으로 페이지를 확대한다. 사용자가 입력을 마치고 나면 원래 크기로 돌아오기는 하는데, 이 확대-축소가 발생하는 동안 레이아웃이 흔들리면서 사용 경험이 상당히 불쾌해진다.

해결 방법은 단순하다. iOS Safari에서만 input의 font-size를 16px로 고정해버리면 된다.

```css
@supports (-webkit-touch-callout: none) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

`@supports (-webkit-touch-callout: none)`은 iOS Safari만 매칭하는 CSS 조건이다. `-webkit-touch-callout`이라는 프로퍼티는 iOS Safari에서만 지원하기 때문에, 이걸 feature query로 쓰면 사실상 iOS Safari 전용 스타일을 적용할 수 있다.

디자인 측면에서 보면 14px이 더 깔끔한 곳에 16px을 강제하는 건 좀 마음에 안 들었다. 하지만 자동 확대가 발생하는 것보다는 글자가 살짝 큰 게 낫다.

### 날짜 입력 필드의 WebKit 버그

일기 앱이니까 날짜 선택이 핵심 UI인데, Safari에서 `<input type="date">`가 컨테이너를 넘어가거나 잘리는 현상이 있었다. 이건 WebKit 엔진의 버그인데, 해결법이 좀 황당하다.

```css
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

웹에서는 `display: block`으로 두고, iOS Safari에서만 `display: flex`로 바꿔주면 overflow 문제가 해결된다. 왜 flex로 바꾸면 되는지 정확한 이유는 솔직히 나도 잘 모르겠다. WebKit 렌더링 엔진의 내부 동작과 관련된 것으로 보이는데, 중요한 건 이렇게 하면 된다는 거다. 프론트엔드 개발에서는 가끔 이런 "이유는 모르겠지만 이렇게 하면 동작하는" 해결책을 받아들여야 할 때가 있다.

### backdrop-blur와 fixed 위치 충돌

DearMe의 배경에는 이미지가 깔려 있고, 그 위에 반투명 배경 + blur 효과를 적용한 컨테이너가 올라간다. 꽤 예쁜 UI인데, iOS Safari에서 이 조합이 문제를 일으켰다.

`backdrop-filter: blur()`가 적용된 컨테이너 안에 `position: fixed` 요소를 넣으면, iOS Safari에서 fixed 포지셔닝이 제대로 작동하지 않는다. 하단 탭바가 스크롤을 따라 올라갔다 내려갔다 하거나, 엉뚱한 위치에 렌더링된다.

해결 방법은 구조를 바꾸는 것이었다. BottomTabBar를 backdrop-blur 컨테이너 **바깥**에 배치했다.

```tsx
<div style={{ backgroundImage: '...' }}>
  <div className="bg-white/70 backdrop-blur-sm">
    <Header />
    <main><Outlet /></main>
  </div>
  {/* backdrop-blur 컨테이너 바깥에 배치해야 fixed가 정상 작동 */}
  <BottomTabBar />
</div>
```

이 버그를 찾는 데 반나절은 쓴 것 같다. Chrome DevTools에서는 아무 문제 없이 동작하니까, iOS Safari 실기기에서 테스트하기 전까지는 원인을 특정할 수가 없었다. iOS Safari 디버깅은 Mac의 Safari에서 원격 디버깅 연결을 해야 하는데, 이것도 그렇게 안정적이지는 않다.

### 모달과 하단 탭바의 전쟁

모달이 열릴 때 뒤쪽의 탭바 버튼이 눌리는 문제도 있었다. 모달의 반투명 배경 너머로 탭바가 보이는데, 사용자가 모달 안에서 뭔가를 터치하려다 실수로 탭바를 누르게 되는 것이다.

간단한 해결책을 적용했다. 모달이 열리면 탭바를 아예 숨겨버린다.

```css
body[data-modal-open] #bottom-tab-bar {
  display: none;
}
```

모달이 열릴 때 `document.body.setAttribute('data-modal-open', '')`을 호출하고, 닫힐 때 `removeAttribute`로 제거한다. z-index 싸움을 벌이는 것보다 이게 더 확실하다.

---

## iOS 아이콘 캐시, 끝나지 않는 전쟁

이건 PWA 이야기 중에서도 특히 좌절스러웠던 부분이다.

DearMe의 아이콘을 교체했다. 빌드하고 배포했다. 새 아이콘이 잘 나오는지 확인하려고 홈 화면을 봤는데 — 옛날 아이콘이 그대로 있다.

"아, 캐시겠지." 생각하고 PWA를 삭제하고 다시 설치했다. 근데 **여전히 옛날 아이콘이다**.

원인은 두 가지가 겹쳐 있었다.

첫째, Nginx에서 png 파일에 `expires 1y`를 걸어뒀다. 아이콘 파일도 이미지이므로 1년 캐시가 적용된다. 보통은 content hash가 파일명에 붙어서 캐시 무효화가 자동으로 되는데, 아이콘 파일은 `icon-192x192.png`처럼 고정 이름이다.

둘째, 그것보다 더 문제인 건 iOS 자체가 PWA 아이콘을 독자적으로 캐시한다는 거다. 이건 Nginx 캐시와는 별개의 계층이다. 앱을 삭제하고 다시 추가해도 iOS가 내부적으로 캐시한 아이콘을 재사용하는 경우가 있다.

해결책은 manifest.json의 아이콘 URL에 버전 쿼리를 붙이는 것이었다.

```json
{
  "icons": [
    { "src": "/icon-192x192.png?v=2", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png?v=2", "sizes": "512x512", "type": "image/png" }
  ]
}
```

아이콘을 교체할 때마다 `?v=2`를 `?v=3`으로 올리면 된다. URL이 바뀌니까 브라우저와 iOS 모두 새 리소스로 인식한다. 아주 원시적인 방법이지만 확실하게 동작한다.

:::tip
캐시 전략을 세울 때는 **무효화 수단도 함께 만들어야 한다**. "이 파일은 안 바뀔 거야"라고 공격적으로 캐시했는데 정작 바꿔야 할 때 방법이 없으면 곤란하다. content hash가 자동으로 붙는 빌드 산출물과, 고정 이름을 써야 하는 아이콘 같은 파일은 캐시 전략이 달라야 한다.
:::

---

## 돌아보며

PWA 구현 자체는 vite-plugin-pwa 덕분에 크게 어렵지 않았다. manifest.json 작성하고, SW 설정하고, 설치 프롬프트 만들면 기본은 돌아간다. 하지만 "기본이 돌아가는 것"과 "실제 사용자가 쾌적하게 쓸 수 있는 것" 사이에는 꽤 넓은 간극이 있었다. 그 간극의 대부분은 iOS Safari가 차지하고 있었다.

솔직히 말하면, 이 글에서 다룬 문제들 중 상당수는 구글에서 검색해서 바로 해결책이 나오는 것들이 아니었다. safe area 처리야 문서가 잘 되어 있지만, backdrop-blur와 fixed의 충돌이라거나, 날짜 입력 필드의 display 속성 트릭 같은 건 여러 커뮤니티 글과 Stack Overflow 답변들을 조합해서 겨우 찾아낸 것들이다.

아직 고민이 남아 있는 부분도 있다. iOS에서 PWA 설치율이 낮은 문제를 어떻게 개선할 수 있을지, "홈 화면에 추가" 가이드 UI를 좀 더 직관적으로 만들 수 있을지는 계속 실험 중이다. 그리고 Apple이 `beforeinstallprompt`를 지원할 날이 과연 올 것인지 — 내 예상으로는 당분간은 없을 것 같다.

모바일 웹 개발, 특히 PWA를 제대로 하려면 실기기 테스트가 필수다. 에뮬레이터나 DevTools만으로는 잡을 수 없는 버그가 반드시 있다. iPhone 실기기 하나 없이 iOS Safari 대응을 하겠다는 건, 지도 없이 산을 오르겠다는 것과 비슷하다.
