---
title: "나닮 프론트엔드 — Zustand과 TanStack Query, 그리고 인증의 함정들"
date: 2026-02-17T14:00:00
---

# 나닮 프론트엔드 — Zustand과 TanStack Query, 그리고 인증의 함정들

프론트엔드에서 "상태 관리"라는 말을 들으면 무슨 생각이 드는가? 나는 솔직히 처음에 Redux 하나면 다 될 줄 알았다. 서버에서 받아온 데이터든, 로그인 여부든, 다크모드 토글이든 — 전부 하나의 store에 넣으면 되는 거 아닌가? 나닮를 만들면서 그 생각이 얼마나 순진했는지 깨달았다.

## 클라이언트 상태와 서버 상태는 다른 생물이다

나닮에서 Zustand과 TanStack Query를 동시에 쓰기로 결정한 이유부터 이야기해야 할 것 같다.

처음에는 Zustand 하나로 모든 걸 관리하려 했다. 로그인 상태도 넣고, 일기 목록도 넣고, 페르소나 데이터도 넣었다. 그런데 금방 문제가 터졌다. 일기를 새로 작성한 뒤에 목록을 업데이트하려면? Zustand store에서 직접 배열을 조작해야 한다. 다른 탭에서 데이터가 바뀌면? 동기화 로직을 직접 짜야 한다. "5분이 지나면 서버에서 새로 가져와"라는 재검증 로직은? 타이머를 직접 돌려야 한다.

이건 좀 아니다 싶었다.

결국 깨달은 건, **클라이언트 상태와 서버 상태는 성격이 완전히 다르다**는 것이다. 로그인 여부나 테마 같은 클라이언트 상태는 서버와 무관하게 브라우저에 살아있다. 반면 일기 목록이나 페르소나 데이터 같은 서버 상태는 "진짜 데이터"가 서버에 있고, 프론트엔드가 들고 있는 건 그 복사본에 불과하다. 복사본은 언제든 stale해질 수 있고, 캐싱과 재검증이 필요하다.

| 상태 종류 | 예시 | 관리 도구 |
|-----------|------|----------|
| 클라이언트 상태 | 로그인 여부, 테마, UI 토글 | Zustand |
| 서버 상태 | 일기 목록, 페르소나 데이터, 알림 | TanStack Query |

이 분리를 하고 나니까 각자의 역할이 명확해졌다. Zustand은 가볍게, TanStack Query는 똑똑하게.

## Zustand + persist: 간단한 줄 알았는데

Zustand을 선택한 건 보일러플레이트가 적어서였다. Redux Toolkit은 slice 만들고, action 정의하고, reducer 쓰고... 1인 개발에서 이 오버헤드는 꽤 부담이다. Zustand은 store 하나가 파일 하나로 끝난다.

`persist` 미들웨어를 붙이면 localStorage에 자동 저장도 된다. 여기까지만 들으면 참 좋아 보인다. 문제는 그 다음이다.

```typescript
// store/authStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,  // 이 녀석이 핵심

      setAuth: (user, token) => {
        localStorage.setItem('access_token', token)  // 이중 저장
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth-storage')
        queryClient.clear()
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.syncToken()
          state.setHydrated()
        }
      },
    }
  )
)
```

코드를 보면 `isHydrated`라는 필드가 눈에 띌 것이다. 그리고 `setAuth`에서 `localStorage.setItem('access_token', token)`을 별도로 호출하는 것도. 이게 왜 필요한지는 뒤에서 삽질 경험과 함께 설명하겠다.

### 토큰을 두 군데에 저장하는 이유

이건 처음 봤을 때 나도 의아했다. Zustand persist가 `auth-storage`라는 키에 전체 상태를 JSON으로 직렬화해서 저장하는데, 왜 `access_token`을 따로 또 저장하나?

답은 Axios 인터셉터에 있다.

```typescript
// api.ts - Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

인터셉터는 매 API 요청마다 토큰을 읽어서 Authorization 헤더에 붙여야 한다. 그런데 여기서 `useAuthStore`를 import해서 `getState().token`으로 읽으면 어떻게 될까? `api.ts` → `authStore.ts` → `queryClient.ts` → `api.ts`... 이런 식으로 순환 의존성이 생길 수 있다. authStore의 `logout()`이 `queryClient.clear()`를 호출하기 때문이다.

그래서 인터셉터는 Zustand을 모르는 척하고 `localStorage.getItem('access_token')`으로 직접 읽는다. 이 설계 때문에 토큰이 두 군데에 존재하게 된 거다.

근데 이렇게 하면 당연히 동기화 문제가 생긴다.

### syncToken()이 하는 일

배포 후 localStorage가 초기화되거나, 어떤 이유로 `access_token`과 `auth-storage` 안의 토큰이 불일치할 수 있다. `syncToken()`은 hydration이 끝난 직후에 실행되면서 이 둘을 맞춰준다.

- Zustand에 토큰 있는데 localStorage에 없으면 → localStorage에 복원
- Zustand에 없는데 localStorage에 있으면 → localStorage에서 제거
- 둘 다 있는데 값이 다르면 → localStorage 값을 우선시 (더 최신일 가능성)

사소해 보이지만, 이 동기화가 없으면 "로그인했는데 API 호출이 안 되는" 유령 같은 버그가 간헐적으로 발생한다. 디버깅이 정말 어려운 부류의 버그다.

## TanStack Query: staleTime이 바꿔놓은 것들

서버 상태 관리를 TanStack Query로 넘기고 나서 정말 많은 코드가 사라졌다. 직접 구현했던 로딩 상태 관리, 에러 핸들링, 캐시 로직 같은 것들.

```typescript
// 전역 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
})
```

`staleTime: 5분`이 의미하는 건 이렇다. 같은 queryKey로 5분 내에 다시 요청하면 네트워크를 타지 않고 캐시에서 바로 돌려준다. 일기 목록 같은 건 사용자 본인이 새로 쓰지 않는 한 자주 바뀌지 않으니까, 매번 서버에 물어볼 필요가 없다.

```typescript
// 페이지에서 사용
const { data: diaries, isLoading } = useQuery({
  queryKey: ['diaries', page],
  queryFn: () => diaryService.getList(page),
})

// 일기 작성 후 목록 갱신
const createDiaryMutation = useMutation({
  mutationFn: diaryService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['diaries'] })
  },
})
```

`invalidateQueries`가 좋은 게, `['diaries']`를 prefix로 가진 모든 쿼리를 stale 처리한다. `['diaries', 1]`, `['diaries', 2]` 전부. 새 일기를 쓰면 어떤 페이지의 목록이든 다음에 접근할 때 자동으로 재검증된다.

이런 걸 Zustand에서 직접 구현하려면... 생각만 해도 좀 아찔하다.

## JWT 인증의 전체 흐름

인증 이야기를 좀 더 해보자. 나닮의 전체 인증 흐름은 이렇다.

```
[로그인] → POST /api/v1/auth/login → JWT 토큰 반환
    ↓
authStore.setAuth(user, token)
    ├── Zustand 상태 업데이트 (user, token, isAuthenticated)
    ├── localStorage['access_token'] = token
    └── localStorage['auth-storage'] = { user, token, isAuthenticated }
    ↓
[이후 API 요청마다]
    → Axios 인터셉터가 Authorization: Bearer <token> 자동 추가
    ↓
[401 응답 시]
    → Response 인터셉터가 감지
    → 인증 페이지에서의 401은 무시
    → 그 외: 토큰 삭제 → 캐시 클리어 → 랜딩으로 리다이렉트
```

흐름 자체는 단순해 보인다. 그런데 이 단순한 흐름에서 내가 삽질한 부분이 두 군데 있다.

## 새로고침하면 로그인 페이지가 깜빡인다

이건 처음 겪었을 때 진짜 당황스러웠다. 분명 로그인한 상태인데, F5를 누르면 랜딩 페이지가 스쳐 지나간 후에야 원래 페이지가 보이는 거다. 사용자 입장에서는 "어? 로그아웃됐나?" 싶은 찰나에 다시 원래 화면이 뜬다. Flash of Unauthenticated Content라고 부르는데, 경험상 사용자들이 이런 깜빡임을 꽤 불쾌하게 느낀다.

원인은 Zustand persist의 hydration이 비동기라는 데 있었다.

```
1. 사용자가 새로고침
2. React 마운트 → Zustand 상태 = 초기값 (isAuthenticated: false)
3. ProtectedRoute가 isAuthenticated = false를 보고 → /landing으로 리다이렉트
4. 그 직후 hydration 완료 → isAuthenticated = true
   ...하지만 이미 리다이렉트된 뒤다
```

React가 마운트되는 시점에 Zustand은 아직 localStorage에서 상태를 복원하지 못한 상태다. 그래서 `isAuthenticated`가 `false`이고, ProtectedRoute는 "로그인 안 됐네" 하고 랜딩으로 보내버린다.

해결은 `isHydrated` 플래그를 도입하는 것이었다.

```typescript
// ProtectedRoute.tsx
export default function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  if (!isHydrated) {
    return <PageLoading />  // hydration 끝날 때까지 로딩 스피너
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />
  }

  return <Outlet />
}
```

hydration이 완료되기 전에는 아무 판단도 하지 않는다. 그냥 로딩 스피너만 보여준다. hydration이 끝나면 그때 `isAuthenticated`를 확인해서 진짜 인증 여부를 판단한다.

App.tsx 최상위에서도 같은 체크를 한다.

```typescript
// App.tsx
if (!isHydrated) {
  return <PageLoading />
}
```

이 패턴이 없었을 때와 있을 때의 차이가 극적이다. 없으면 매 새로고침마다 화면이 깜빡이고, 있으면 로딩 스피너가 잠깐(보통 수십 밀리초) 보였다가 매끄럽게 원래 페이지가 뜬다.

:::tip
persist 미들웨어를 쓸 때는 반드시 hydration 상태를 UI에 반영해야 한다. 이건 Zustand뿐 아니라 Redux Persist 같은 다른 영속화 도구에서도 마찬가지다.
:::

## 401이 세 번 터지면 무슨 일이 벌어지나

이건 실제로 운영 중에 발견한 문제다. 나닮의 메인 페이지에서는 여러 API를 동시에 호출한다. 일기 목록, 알림 수, 구독 상태 정도. 이 세 요청이 거의 동시에 나간다.

토큰이 만료되면? 세 요청이 모두 401을 돌려받는다. 그리고 Response 인터셉터가 세 번 실행된다.

```typescript
// 이 코드가 세 번 실행된다
localStorage.removeItem('access_token')
localStorage.removeItem('auth-storage')
queryClient.clear()
window.location.href = '/landing'
```

`window.location.href = '/landing'`이 세 번 호출되고, `queryClient.clear()`도 세 번 호출된다. 눈에 보이는 문제가 당장 생기지 않을 수도 있지만, 비정상적인 동작이고 예측 불가능한 사이드 이펙트가 발생할 수 있다.

해결은 간단하지만, 생각해내기까지가 좀 걸렸다.

```typescript
let isLoggingOut = false

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

`isLoggingOut` 플래그로 첫 번째 401만 처리하고, 나머지는 무시한다. `setTimeout`으로 1초 후에 플래그를 풀어주는 건, 혹시 리다이렉트가 안 되는 엣지 케이스를 위한 안전장치다.

그리고 `isAuthPage` 체크가 있는 이유도 중요하다. 로그인 페이지에서 틀린 비밀번호를 입력하면 서버가 401을 보낸다. 이때 인터셉터가 `/landing`으로 리다이렉트하면? 로그인 페이지로 보내지고, 거기서 다시 401이 오고, 다시 리다이렉트되고... 무한 루프다. 그래서 인증 관련 페이지에서 발생한 401은 인터셉터가 아예 건드리지 않고 그냥 해당 컴포넌트에서 에러를 처리하게 놔둔다.

## Axios 인터셉터에서의 부수 효과, 생각보다 까다롭다

여담인데, Axios 인터셉터에서 `window.location.href` 변경이나 `queryClient.clear()` 같은 부수 효과를 실행하는 건 꽤 까다로운 패턴이라고 생각한다. 인터셉터는 매 요청/응답마다 실행되는 글로벌 미들웨어라서, 어떤 컨텍스트에서 호출될지 예측하기 어렵다.

내 경험상 인터셉터에 부수 효과를 넣을 때 주의할 점은 이 정도다.

- 반드시 중복 실행 방지 로직을 넣을 것
- 현재 페이지(경로)에 따라 동작을 분기할 것
- 인터셉터가 실행되는 타이밍을 정확히 이해할 것 (요청 전? 응답 후? 에러 시?)

정확히는 이게 정답인지 모르겠지만, 적어도 나닮에서는 이 접근이 잘 동작하고 있다. 더 나은 방법이 있을 수도 있다. 예를 들어 토큰 갱신(refresh token) 로직까지 인터셉터에 넣게 되면 복잡도가 또 한 단계 올라가는데, 나닮에서는 아직 거기까지는 안 갔다.

## 정리하면

Zustand과 TanStack Query의 이중 구조는 나름 잘 동작한다. 각자 잘하는 게 있으니까. 다만 이 둘 사이, 그리고 Axios 인터셉터까지 끼면 경계 영역에서 미묘한 문제들이 생긴다. 토큰 이중 저장, hydration 깜빡임, 401 중복 처리 — 전부 그 경계에서 터진 문제들이다.

아직 고민 중인 부분도 있다. refresh token을 도입하면 인터셉터 로직이 훨씬 복잡해질 텐데, 지금의 `isLoggingOut` 패턴으로 감당이 될지. 그리고 Zustand persist의 hydration이 느린 디바이스에서는 로딩 스피너가 체감될 만큼 오래 보일 수도 있는데, 그때는 어떻게 할지.

결국 이런 문제들은 직접 부딪혀봐야 답이 나온다. 문서에 적힌 happy path만으로는 알 수 없는 것들이 현실 프로젝트에는 꽤 많다.
