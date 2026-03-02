# 모바일 터치 제스처 구현 패턴

> **날짜**: 2026-03-01
> **관련 커밋**: `177938d`, `806bc88`, `3c9a4b4`
> **관련 파일**: `EmotionCalendar.tsx`, `FriendListPage.tsx`, `BottomTabBar.tsx`

---

## 1. 터치 스와이프 기본 구현 (React onTouch)

### 문제 상황

감정 캘린더에서 좌우 스와이프로 이전/다음 월로 이동하는 기능이 필요했다. 버튼만으로 월 이동을 제공하면 모바일 UX가 불편하므로, 네이티브 앱처럼 스와이프 제스처를 추가해야 했다.

### 해결 접근법

React의 합성 이벤트 `onTouchStart` / `onTouchEnd`를 사용한 가장 기본적인 스와이프 패턴이다. `useRef`로 터치 시작점의 X좌표를 기록하고, 터치가 끝났을 때 시작점과의 차이가 50px 이상이면 스와이프로 판정한다.

### 실제 코드

```tsx
// frontend/src/components/home/EmotionCalendar.tsx

const touchStartX = useRef<number | null>(null)

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX
}

const handleTouchEnd = (e: React.TouchEvent) => {
  if (touchStartX.current === null) return
  const diff = touchStartX.current - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    if (diff > 0) handleNextMonth()   // 왼쪽으로 스와이프 → 다음 달
    else handlePrevMonth()            // 오른쪽으로 스와이프 → 이전 달
  }
  touchStartX.current = null
}

// JSX
<CardContent
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
  {/* 캘린더 내용 */}
</CardContent>
```

### 주의사항/교훈

- **50px 임계값**은 실수 방지와 의도적 스와이프 사이의 적정 균형이다. 너무 작으면 스크롤 중 오작동하고, 너무 크면 스와이프가 인식되지 않는다.
- 이 패턴은 **수평 이동만** 필요한 단순한 경우에 적합하다. Y축 스크롤과 충돌 가능성이 있는 컨텍스트에서는 주제 2의 패턴을 사용해야 한다.
- `touchStartX.current = null`로 초기화하여 중복 처리를 방지한다.
- 이 방식은 iOS Safari/WKWebView에서 문제가 발생할 수 있다 (주제 3 참조). 캘린더처럼 스와이프 영역이 제한적이고 브라우저 뒤로가기와 충돌하지 않는 경우에만 안전하다.

---

## 2. 탭 스와이프 (수평/수직 구분)

### 문제 상황

친구 페이지에는 3개의 탭(친구 목록, 요청, 찾기)이 있고, 좌우 스와이프로 탭 전환을 구현해야 했다. 그런데 각 탭 내부에는 세로 스크롤 가능한 리스트가 있어서, 스크롤과 스와이프를 정확히 구분해야 했다.

### 해결 접근법

터치 시작 시 X/Y 좌표를 모두 기록하고, 터치 종료 시 `|dx| > 50 && |dx| > dy` 조건으로 수평 스와이프인지 수직 스크롤인지 구분한다. 수평 이동이 수직 이동보다 클 때만 스와이프로 판정한다. 탭 순서는 `TAB_ORDER` 배열로 관리하여 인덱스 기반으로 이전/다음 탭을 결정한다.

### 실제 코드 (초기 버전, React 합성 이벤트)

```tsx
// 탭 순서 정의
const TAB_ORDER: FriendTab[] = ['friends', 'requests', 'discover']

const touchStartRef = useRef<{ x: number; y: number } | null>(null)

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
}

const handleTouchEnd = (e: React.TouchEvent) => {
  if (!touchStartRef.current) return
  const dx = touchStartRef.current.x - e.changedTouches[0].clientX
  const dy = Math.abs(touchStartRef.current.y - e.changedTouches[0].clientY)

  // 수평 이동이 50px 이상이고, 수직 이동보다 큰 경우만 스와이프
  if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    if (dx > 0 && currentIndex < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[currentIndex + 1])  // 다음 탭
    } else if (dx < 0 && currentIndex > 0) {
      handleTabChange(TAB_ORDER[currentIndex - 1])  // 이전 탭
    }
  }
  touchStartRef.current = null
}
```

### 주의사항/교훈

- **`|dx| > dy` 조건**이 핵심이다. 이 조건 없이 `|dx| > 50`만 검사하면, 대각선으로 스크롤할 때 탭이 전환되는 오작동이 발생한다.
- `TAB_ORDER` 배열로 탭 순서를 관리하면 탭 추가/삭제 시 순서 로직을 수정할 필요가 없다.
- 이 코드는 **Android에서는 잘 동작**하지만, **iOS WKWebView에서는 touchEnd가 호출되지 않는 문제**가 있었다. 주제 3에서 이 문제를 해결한다.

---

## 3. iOS WKWebView 스와이프 충돌 해결 (핵심)

### 문제 상황

주제 2의 React `onTouchStart`/`onTouchEnd` 방식으로 구현한 탭 스와이프가 iOS에서 전혀 동작하지 않았다. 원인은 iOS WKWebView의 `allowsBackForwardNavigationGestures` 기능이 수평 터치 이벤트를 브라우저 레벨에서 가로채 버리기 때문이다.

구체적으로:
1. 사용자가 수평으로 스와이프를 시작한다.
2. iOS가 이를 "뒤로가기/앞으로가기" 제스처로 인식한다.
3. 브라우저가 터치 이벤트를 소비하고, **`touchEnd` 이벤트가 JavaScript로 전달되지 않는다**.
4. 결과적으로 `handleTouchEnd`가 호출되지 않아 탭 전환이 동작하지 않는다.

### 해결 접근법

React 합성 이벤트 대신 **네이티브 `addEventListener`**를 사용하고, `touchmove` 단계에서 `e.preventDefault()`를 호출하여 브라우저의 기본 수평 스와이프 동작을 선제적으로 차단한다.

핵심 포인트:
1. **`passive: false`**: `addEventListener`의 세 번째 인자로 `{ passive: false }`를 지정해야 `preventDefault()`가 동작한다. `passive: true`(기본값)이면 `preventDefault()` 호출이 무시된다.
2. **`touchmove`에서 방향 판별**: `touchEnd`가 아닌 `touchMove` 단계에서 수평 이동인지 판별하고, 수평이면 즉시 `preventDefault()`로 브라우저 기본 동작을 차단한다.
3. **`touch-pan-y` CSS**: 컨테이너에 `touch-action: pan-y`를 적용하여 수직 스크롤은 정상적으로 허용한다.
4. **`activeTabRef`로 클로저 stale 방지**: `useEffect` 내부의 이벤트 핸들러는 마운트 시점의 `activeTab` 값을 클로저로 캡처한다. `activeTabRef.current = activeTab`으로 매 렌더마다 최신 값을 반영한다.

### 실제 코드

```tsx
// frontend/src/pages/friend/FriendListPage.tsx

const containerRef = useRef<HTMLDivElement>(null)
const activeTabRef = useRef(activeTab)
activeTabRef.current = activeTab  // 매 렌더마다 최신 탭 상태 동기화

const handleTabChange = useCallback((tab: FriendTab) => {
  if (tab === 'friends') {
    setSearchParams({})
  } else {
    setSearchParams({ tab })
  }
}, [setSearchParams])

// 네이티브 터치 이벤트로 스와이프 처리
useEffect(() => {
  const el = containerRef.current
  if (!el) return

  let startX = 0
  let startY = 0
  let swiping = false

  const onTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    swiping = false
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!startX) return
    const dx = Math.abs(e.touches[0].clientX - startX)
    const dy = Math.abs(e.touches[0].clientY - startY)
    if (dx > 10 && dx > dy) {
      e.preventDefault()  // 핵심: iOS 기본 스와이프(뒤로가기) 방지
      swiping = true
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!swiping) {
      startX = 0
      return
    }
    const dx = startX - e.changedTouches[0].clientX
    if (Math.abs(dx) > 50) {
      const currentIndex = TAB_ORDER.indexOf(activeTabRef.current)
      if (dx > 0 && currentIndex < TAB_ORDER.length - 1) {
        handleTabChange(TAB_ORDER[currentIndex + 1])
      } else if (dx < 0 && currentIndex > 0) {
        handleTabChange(TAB_ORDER[currentIndex - 1])
      }
    }
    startX = 0
    swiping = false
  }

  // passive: false가 핵심 - 이래야 preventDefault()가 동작함
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: true })

  return () => {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
  }
}, [handleTabChange])

// JSX - touch-pan-y로 수직 스크롤 허용
<div
  ref={containerRef}
  className="mx-auto max-w-2xl space-y-4 flex-1 touch-pan-y"
>
  {/* 탭 컨텐츠 */}
</div>
```

### 주의사항/교훈

- **React 합성 이벤트의 한계**: React의 `onTouchMove`는 내부적으로 `passive: true`로 등록되기 때문에 `e.preventDefault()`가 동작하지 않는다. iOS에서 기본 제스처를 막아야 하는 경우 반드시 네이티브 `addEventListener`를 사용해야 한다.
- **`passive: false`는 `touchmove`에만**: `touchstart`와 `touchend`는 `passive: true`로 두어도 된다. 성능상 `touchmove`만 `passive: false`로 설정하는 것이 최적이다.
- **10px vs 50px 임계값 구분**: `touchmove`에서는 10px로 수평 스와이프를 "감지"하고 `preventDefault()`를 호출한다. 실제 탭 전환 판정은 `touchend`에서 50px 임계값으로 한다. 이 이중 임계값 패턴이 중요하다. 10px에서 바로 전환하면 살짝 건드려도 탭이 바뀌고, 50px까지 `preventDefault()`를 미루면 이미 iOS가 이벤트를 가로챈다.
- **클로저 stale 문제**: `useEffect`의 의존성에 `activeTab`을 넣으면 탭 전환 시마다 이벤트 리스너가 재등록된다. 대신 `activeTabRef`를 사용하면 리스너는 한 번만 등록하면서도 항상 최신 탭 상태를 참조할 수 있다.
- **cleanup 필수**: `useEffect`의 return에서 반드시 `removeEventListener`를 해야 한다. 누락 시 컴포넌트 언마운트 후에도 이벤트가 남아 메모리 릭과 비정상 동작을 유발한다.

---

## 4. 스와이프 영역 문제

### 문제 상황

스와이프 이벤트 핸들러가 탭 컨텐츠를 감싸는 `<div>`에만 연결되어 있었다. 그런데 "친구 요청" 탭처럼 컨텐츠가 적은 탭에서는 리스트가 화면의 일부만 차지하고, 나머지 빈 영역에서는 스와이프가 인식되지 않았다.

```tsx
// 문제가 있던 구조
<div className="mx-auto max-w-2xl space-y-4">
  <FriendTabs ... />
  <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
    {/* 컨텐츠 영역 - 컨텐츠가 적으면 이 div가 작음 */}
    {activeTab === 'friends' && <FriendListTab />}
    {activeTab === 'requests' && <FriendRequestsTab />}
  </div>
</div>
```

### 해결 접근법

이벤트 핸들러를 내부 컨텐츠 div가 아닌 최상위 컨테이너로 이동하고, `flex-1` 클래스를 추가하여 컨테이너가 남은 세로 공간을 모두 차지하게 만들었다.

### 실제 코드

```tsx
// 수정 후 구조
<div
  ref={containerRef}
  className="mx-auto max-w-2xl space-y-4 flex-1"  // flex-1 추가
  // 이벤트 핸들러는 이 최상위 컨테이너에 바인딩
>
  <FriendTabs ... />
  {/* 컨텐츠가 직접 자식으로 배치 */}
  {activeTab === 'friends' && <FriendListTab />}
  {activeTab === 'requests' && <FriendRequestsTab />}
  {activeTab === 'discover' && <FriendDiscoverTab />}
</div>
```

### 주의사항/교훈

- **`flex-1`의 역할**: 부모가 `display: flex; flex-direction: column`인 레이아웃에서 `flex: 1 1 0%`를 의미하며, 남은 수직 공간을 전부 차지한다. 이것이 없으면 컨테이너가 컨텐츠 높이만큼만 축소된다.
- **이벤트 위임 관점**: 터치 이벤트는 버블링되므로 가장 바깥 컨테이너에 한 번만 바인딩하면 내부 어디를 터치하든 감지된다.
- **레이아웃 구조 확인**: 스와이프가 동작하지 않는 것 같을 때, 먼저 **이벤트 핸들러가 바인딩된 요소의 실제 크기**를 DevTools의 Elements 패널에서 확인해보자. 대부분 요소가 예상보다 작아서 빈 영역의 터치를 감지하지 못하는 것이 원인이다.

---

## 5. 스크롤 투 탑 (탭 바 탭)

### 문제 상황

하단 탭 바에서 현재 활성화된 탭을 다시 누르면 페이지 최상단으로 스크롤하는 기능을 구현했다. 처음에는 더블탭(300ms 이내 두 번 탭) 방식으로 구현했으나, 사용자들이 더블탭을 인지하지 못하고 사용 빈도가 낮았다. iOS/Android 네이티브 앱들은 싱글 탭으로 스크롤 투 탑을 제공하므로, 동일하게 단순화하기로 했다.

### 해결 접근법

더블탭 로직을 제거하고, 현재 활성 탭을 한 번만 누르면 `scrollTo({ top: 0, behavior: 'smooth' })`를 실행한다. 이미 활성 탭인 경우 `e.preventDefault()`로 라우터 네비게이션을 방지하여 불필요한 리렌더를 막는다.

### 실제 코드

```tsx
// frontend/src/components/common/BottomTabBar.tsx

interface BottomTabBarProps {
  scrollRef?: RefObject<HTMLElement | null>
}

export default function BottomTabBar({ scrollRef }: BottomTabBarProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // 더블탭 → 싱글탭으로 단순화
  const handleTap = useCallback((active: boolean, e: React.MouseEvent) => {
    if (!active) return           // 다른 탭이면 정상 네비게이션
    e.preventDefault()            // 같은 탭이면 네비게이션 방지
    scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollRef])

  return (
    <nav>
      {tabs.map((tab) => {
        const active = isActive(tab.path)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            onClick={(e) => { haptic.light(); handleTap(active, e) }}
          >
            {/* 탭 아이콘, 라벨 */}
          </Link>
        )
      })}
    </nav>
  )
}
```

**기존 더블탭 코드 (제거됨):**

```tsx
// 제거된 코드 - 비교 참고용
const lastTapRef = useRef<Record<string, number>>({})

const handleDoubleTap = useCallback((path: string, active: boolean, e: React.MouseEvent) => {
  if (!active) {
    lastTapRef.current = {}
    return
  }
  const now = Date.now()
  const lastTap = lastTapRef.current[path] || 0
  if (now - lastTap < 300) {
    e.preventDefault()
    scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
    lastTapRef.current[path] = 0
  } else {
    lastTapRef.current[path] = now
  }
}, [scrollRef])
```

### 주의사항/교훈

- **`scrollRef` prop 패턴**: 각 페이지에서 스크롤 가능한 요소의 ref를 `BottomTabBar`에 전달한다. 페이지마다 스크롤 컨테이너가 다를 수 있으므로 (window vs 특정 div) ref를 prop으로 받는 것이 유연하다.
- **`e.preventDefault()`**: `<Link>`의 기본 동작은 라우트 이동이다. 이미 해당 라우트에 있으면 이동할 필요가 없고, 이동하면 컴포넌트가 리렌더/리마운트될 수 있으므로 방지한다.
- **더블탭의 문제점**: 300ms 대기는 싱글탭 반응성을 저하시키고, discoverability가 낮다 (사용자가 기능 존재를 모름). 네이티브 앱 관례를 따라 싱글탭으로 단순화하는 것이 정답이었다.
- **햅틱 피드백**: `haptic.light()`으로 탭 시 가벼운 진동을 제공하면 터치 피드백이 향상된다.

---

## 핵심 교훈

### 1. iOS WKWebView는 별도 세계다
React의 합성 이벤트 시스템은 일반적인 웹 브라우저에서는 잘 동작하지만, iOS WKWebView(PWA 포함)에서는 브라우저가 수평 터치 이벤트를 먼저 소비해 버릴 수 있다. iOS에서 수평 스와이프를 구현할 때는 **반드시** 네이티브 `addEventListener` + `passive: false` + `touchmove`에서 `preventDefault()`를 사용해야 한다.

### 2. 이벤트 차단 단계를 이해하라
`touchmove`에서 조기에 방향을 판별하고 `preventDefault()`를 호출해야 한다. `touchend`까지 기다리면 이미 브라우저가 터치를 가로챈 후라 너무 늦다. 10px로 의도 감지, 50px로 확정 판정하는 이중 임계값 패턴을 기억하자.

### 3. 스와이프 영역 = 이벤트 바인딩 요소의 크기
터치 이벤트는 요소 영역 내에서만 발생한다. 스와이프가 안 먹힌다고 느껴지면 핸들러가 바인딩된 요소의 실제 렌더링 크기를 먼저 확인하자. `flex-1`로 남은 공간을 채우는 것만으로 해결되는 경우가 많다.

### 4. 클로저 stale 문제를 항상 경계하라
`useEffect` 내부의 네이티브 이벤트 핸들러는 등록 시점의 상태를 클로저로 캡처한다. 상태가 변할 때마다 리스너를 재등록하면 성능 문제가 있으므로, `useRef`로 최신 상태를 별도 추적하는 패턴(`activeTabRef.current = activeTab`)을 사용하자.

### 5. 네이티브 앱 관례를 따르라
더블탭 같은 비표준 UX는 사용자가 발견하기 어렵다. iOS/Android의 표준 인터랙션 패턴(탭 바 싱글탭 = 스크롤 투 탑, 수평 스와이프 = 탭 전환)을 따르면 별도 온보딩 없이도 직관적인 UX를 제공할 수 있다.

### 6. passive 옵션을 정확히 이해하라
| 옵션 | `preventDefault()` | 스크롤 성능 |
|------|---------------------|-------------|
| `passive: true` (기본) | 무시됨 | 최적 |
| `passive: false` | 동작함 | 약간 저하 가능 |

`touchstart`와 `touchend`는 `passive: true`로, `touchmove`만 `passive: false`로 설정하여 성능과 제어를 모두 확보하는 것이 최적 패턴이다.
