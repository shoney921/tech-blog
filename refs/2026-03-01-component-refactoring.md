# 대규모 컴포넌트 리팩토링 패턴

> **날짜**: 2026-03-01
> **관련 커밋**: `c345eab`, `9eae6c3`, `293c9c7`, `16f9c2d`
> **관련 파일**: `FriendListPage.tsx`, `FriendTabs.tsx`, `FriendListTab.tsx`, `FriendRequestsTab.tsx`, `FriendDiscoverTab.tsx`, `FriendUserCard.tsx`, `PersonaDetailModal.tsx`

---

## 사례: 친구 페이지 리디자인 (578줄 -> 47줄)

### 리팩토링 전

`FriendListPage.tsx` 하나에 578줄이 들어 있었다. 친구 목록 표시, 사용자 검색, 친구 요청 송수신 관리, 페르소나 상세 모달, 친구 삭제 확인 다이얼로그 등 모든 기능이 한 파일에 집중되어 있었다.

문제점:
- **상태 관리 복잡**: 검색 쿼리, 선택된 친구, 삭제 대상, 탭 상태 등 여러 `useState`가 혼재
- **코드 수정 시 영향 범위 넓음**: 검색 기능을 수정하려 해도 친구 목록 코드를 건드릴 위험이 있음
- **재사용 불가**: 유저 카드 UI가 목록/검색/요청 각각에서 중복 구현됨
- **테스트 어려움**: 개별 기능을 분리해서 테스트할 수 없음

### 리팩토링 후

`FriendListPage.tsx`가 47줄의 "탭 오케스트레이터"로 변환되었다. 각 기능이 독립 컴포넌트로 분리되어 자체 데이터 fetching과 상태 관리를 담당한다.

```
frontend/src/pages/friend/
└── FriendListPage.tsx          (47줄)  - 탭 오케스트레이터 (탭 상태 + 라우팅만)

frontend/src/components/friend/
├── FriendTabs.tsx              (38줄)  - 세그먼트 컨트롤 UI + 배지
├── FriendListTab.tsx           (138줄) - 친구 목록 탭 (목록, 대화 시작, 삭제)
├── FriendRequestsTab.tsx       (153줄) - 요청 관리 탭 (받은/보낸 요청)
├── FriendDiscoverTab.tsx       (228줄) - 찾기/검색 탭 (검색, 추천 친구)
├── FriendUserCard.tsx          (54줄)  - 통일 유저 카드 컴포넌트
└── PersonaDetailModal.tsx      (162줄) - 페르소나 상세 모달
```

---

## 핵심 패턴들

### 1. 탭 오케스트레이터 패턴

리팩토링의 핵심이다. 페이지 컴포넌트가 **탭 상태 관리와 컴포넌트 조합만** 담당하고, 실제 비즈니스 로직은 각 탭 컴포넌트에 위임한다.

```tsx
// frontend/src/pages/friend/FriendListPage.tsx (47줄)

export default function FriendListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') || 'friends'
  const activeTab: FriendTab = TAB_PARAM_MAP[tabParam] || 'friends'

  const { data: receivedRequests } = useQuery({
    queryKey: ['friendRequests', 'received'],
    queryFn: friendService.getReceivedRequests,
  })

  const handleTabChange = useCallback((tab: FriendTab) => {
    if (tab === 'friends') {
      setSearchParams({})
    } else {
      setSearchParams({ tab })
    }
  }, [setSearchParams])

  return (
    <div className="mx-auto max-w-2xl space-y-4 flex-1 touch-pan-y">
      <FriendTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        receivedRequestCount={receivedRequests?.length}
      />

      {activeTab === 'friends' && <FriendListTab onNavigateDiscover={navigateDiscover} />}
      {activeTab === 'requests' && <FriendRequestsTab onNavigateDiscover={navigateDiscover} />}
      {activeTab === 'discover' && <FriendDiscoverTab />}
    </div>
  )
}
```

**이 패턴의 규칙:**
- 페이지는 **탭 상태**와 **공통 데이터**(배지용 요청 개수)만 관리한다.
- 각 탭 컴포넌트는 자신의 `useQuery`, `useMutation`, `useState`를 독립적으로 소유한다.
- 탭 간 유일한 통신은 `onNavigateDiscover` 같은 네비게이션 콜백뿐이다.

### 2. URL 파라미터 기반 탭 관리 (딥링크 지원)

`useState` 대신 `useSearchParams`로 탭 상태를 URL에 반영한다.

```tsx
const TAB_PARAM_MAP: Record<string, FriendTab> = {
  friends: 'friends',
  requests: 'requests',
  discover: 'discover',
}

const [searchParams, setSearchParams] = useSearchParams()
const tabParam = searchParams.get('tab') || 'friends'
const activeTab: FriendTab = TAB_PARAM_MAP[tabParam] || 'friends'

// 기본 탭(friends)은 파라미터 없이 깔끔한 URL
const handleTabChange = useCallback((tab: FriendTab) => {
  if (tab === 'friends') {
    setSearchParams({})        // /friends
  } else {
    setSearchParams({ tab })   // /friends?tab=requests
  }
}, [setSearchParams])
```

**이 방식의 장점:**
- **딥링크**: 알림에서 `?tab=requests`로 바로 요청 탭 이동 가능
- **브라우저 뒤로가기**: 탭 전환 히스토리가 자연스럽게 동작
- **상태 복원**: 새로고침해도 현재 탭이 유지됨
- **깔끔한 기본 URL**: 기본 탭은 파라미터를 제거하여 `/friends`로 유지

**`TAB_PARAM_MAP`을 사용하는 이유**: URL 파라미터는 외부 입력이므로 화이트리스트 방식으로 검증한다. 존재하지 않는 탭 값이 들어오면 `|| 'friends'`로 기본 탭으로 폴백한다.

### 3. 통일 카드 컴포넌트 (FriendUserCard)

모든 탭에서 동일한 유저 카드를 사용하되, `actions` prop으로 각 탭에 맞는 버튼을 주입한다.

```tsx
// frontend/src/components/friend/FriendUserCard.tsx (54줄)

interface FriendUserCardProps {
  username: string
  avatarUrl?: string | null
  profileImage?: string | null
  personaName?: React.ReactNode    // string 또는 JSX 모두 허용
  mutualFriendCount?: number
  actions?: React.ReactNode        // 탭마다 다른 액션 버튼 주입
  onClick?: () => void
}

export function FriendUserCard({ username, avatarUrl, profileImage, personaName, mutualFriendCount, actions, onClick }: FriendUserCardProps) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${
      onClick ? 'cursor-pointer transition-colors hover:bg-secondary/50' : ''
    }`} onClick={onClick}>
      <div className="flex items-center gap-3 min-w-0">
        <PersonaAvatar avatarUrl={avatarUrl || profileImage} name={username} size="md" />
        <div className="min-w-0">
          <p className="font-medium truncate">{username}</p>
          {personaName && <p className="text-sm text-muted-foreground truncate">{personaName}</p>}
          {mutualFriendCount != null && mutualFriendCount > 0 && (
            <p className="text-xs text-blue-500">친구 {mutualFriendCount}명과 함께 아는 사이</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 ml-2">{actions}</div>}
    </div>
  )
}
```

**각 탭에서의 사용 예시:**

```tsx
// FriendListTab - 대화 버튼
<FriendUserCard
  username={friend.username}
  avatarUrl={friend.avatar_url}
  personaName={friend.persona_name || '아직 페르소나가 없어요'}
  onClick={() => setSelectedFriend(friend)}
  actions={<Button onClick={(e) => { e.stopPropagation(); startChatMutation.mutate(friend.id) }}>대화</Button>}
/>

// FriendRequestsTab - 수락/거절 버튼
<FriendUserCard
  username={request.requester?.username || ''}
  avatarUrl={request.avatar_url}
  personaName={request.persona_name}
  actions={<><Button onClick={() => respondMutation.mutate({ id: request.id, status: 'accepted' })}>수락</Button>
            <Button variant="outline" onClick={() => respondMutation.mutate({ id: request.id, status: 'rejected' })}>거절</Button></>}
/>

// FriendDiscoverTab - 관계 상태에 따른 동적 액션
<FriendUserCard
  username={user.username}
  avatarUrl={user.avatar_url}
  mutualFriendCount={user.mutual_friend_count}
  actions={renderUserActions(user.id)}  // friend/sent/received/none에 따라 다른 UI
/>
```

**`personaName`이 `React.ReactNode`인 이유**: 보낸 요청 목록에서 "대기 중" 상태를 `<span className="text-amber-500">대기 중</span>`처럼 스타일링된 JSX로 표현해야 했다. `string`으로 제한하면 이런 유연한 표현이 불가능하다.

### 4. 세그먼트 컨트롤 + 배지 (FriendTabs)

탭 UI를 독립 컴포넌트로 분리하여 탭 개수나 스타일 변경이 페이지 로직에 영향을 주지 않도록 한다.

```tsx
// frontend/src/components/friend/FriendTabs.tsx (38줄)

export function FriendTabs({ activeTab, onTabChange, receivedRequestCount = 0 }: FriendTabsProps) {
  return (
    <div className="flex p-1 bg-primary/10 rounded-lg w-full overflow-visible">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.key
              ? 'bg-white text-primary shadow-sm'
              : 'text-primary/60 hover:text-primary/80'
          }`}
        >
          {tab.label}
          {tab.key === 'requests' && receivedRequestCount > 0 && (
            <span className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {receivedRequestCount}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

**z-index 이슈**: 배지가 `absolute` 포지션으로 탭 버튼 영역 밖으로 돌출되는데, 인접한 "찾기" 탭 위에 가려지는 문제가 있었다. `z-10`으로 배지가 항상 위에 표시되도록 하고, 부모 `div`에 `overflow-visible`을 적용하여 잘리지 않게 처리했다.

### 5. 찾기 탭의 관계 상태 관리 패턴

`FriendDiscoverTab`에서 검색 결과와 추천 친구를 표시할 때, 각 사용자와의 현재 관계 상태(친구/요청 보냄/요청 받음/없음)에 따라 다른 액션을 보여줘야 한다.

```tsx
// frontend/src/components/friend/FriendDiscoverTab.tsx

type RelationStatus = 'friend' | 'sent' | 'received' | 'none'

// 캐시된 데이터로 조회 Set/Map 구성
const friendIds = new Set(friends?.map((f) => f.id) ?? [])
const sentIds = new Set(sentRequests?.map((r) => r.addressee_id) ?? [])
const receivedMap = new Map(receivedRequests?.map((r) => [r.requester_id, r.id]) ?? [])

function getUserRelationStatus(userId: number, friendIds: Set<number>, sentIds: Set<number>, receivedMap: Map<number, number>): RelationStatus {
  if (friendIds.has(userId)) return 'friend'
  if (sentIds.has(userId)) return 'sent'
  if (receivedMap.has(userId)) return 'received'
  return 'none'
}
```

**이 패턴의 설계 포인트:**
- **O(1) 조회**: `Set`과 `Map`을 사용하여 배열 순회 없이 즉시 관계 상태를 판별한다.
- **캐시 활용**: TanStack Query 캐시에 이미 있는 친구 목록/요청 데이터를 재사용한다. 별도 API 호출 없이 관계 상태를 판별할 수 있다.
- **`receivedMap`이 Map인 이유**: 받은 요청의 경우 수락 시 `request.id`가 필요하므로 `userId -> requestId` 매핑을 저장한다.

### 6. 백엔드 API 개선 (검색에 페르소나 정보 포함)

기존 검색 API는 사용자 정보만 반환했다. 리디자인된 UI에서는 검색 결과에도 페르소나 아바타와 이름을 표시해야 했으므로, 전용 엔드포인트를 추가했다.

```python
# backend/app/api/api_v1/endpoints/friend.py

@router.get("/search/{username}", response_model=list[FriendWithPersonaResponse])
def search_users_with_persona(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """사용자 검색 (페르소나 정보 포함)"""
    users = db.query(User).filter(
        User.username.ilike(f"%{username}%"),
        User.id != current_user.id,
        User.is_active.is_(True),
    ).limit(20).all()

    if not users:
        return []

    # N+1 방지: 한 번의 쿼리로 모든 페르소나 조회
    user_ids = [u.id for u in users]
    personas = db.query(Persona).filter(
        Persona.user_id.in_(user_ids),
        Persona.is_public == True,
    ).all()
    persona_map = {p.user_id: p for p in personas}

    result = []
    for user in users:
        persona = persona_map.get(user.id)
        result.append(FriendWithPersonaResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            profile_image=user.profile_image,
            persona_name=persona.name if persona else None,
            persona_id=persona.id if persona else None,
            avatar_url=persona.avatar_url if persona else None,
        ))

    return result
```

**설계 결정:**
- **기존 `FriendWithPersonaResponse` 스키마 재사용**: 새 스키마를 만들지 않고, 기존 응답 스키마에 `Optional` 필드(`persona_name`, `avatar_url`)를 활용하여 하위 호환성을 유지했다.
- **N+1 쿼리 방지**: 사용자를 먼저 조회한 뒤, `IN` 절로 페르소나를 한 번에 가져온다. 사용자별로 페르소나를 개별 조회하면 사용자 수만큼 쿼리가 발생한다.
- **`is_public == True` 필터**: 비공개 페르소나는 검색 결과에서 제외한다.

### 7. 빈 상태 CTA (Call to Action) 패턴

각 탭에서 데이터가 없을 때 단순히 "데이터가 없습니다"가 아니라, 사용자를 다음 행동으로 유도하는 CTA를 제공한다.

```tsx
// FriendListTab - 친구가 없을 때
if (!friends?.length) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <p className="mb-1 font-medium text-gray-900">아직 친구가 없어요</p>
      <p className="mb-4 text-sm text-muted-foreground">친구를 찾아 요청을 보내보세요</p>
      <Button onClick={onNavigateDiscover}>
        <Search className="mr-1.5 h-4 w-4" />
        친구 찾기
      </Button>
    </div>
  )
}
```

`onNavigateDiscover` 콜백은 페이지 레벨에서 `handleTabChange('discover')`를 전달한다. 빈 상태에서 "찾기" 탭으로 자연스럽게 전환하여 사용자가 다음 행동을 쉽게 할 수 있도록 한다.

---

## 리팩토링 원칙 정리

### 1. 단일 책임 원칙 (Single Responsibility)

각 탭 컴포넌트가 자신의 데이터 fetching, 상태 관리, 에러 처리를 독립적으로 담당한다.

| 컴포넌트 | 책임 | 소유하는 상태 |
|---------|------|-------------|
| `FriendListPage` | 탭 라우팅 | `searchParams` (URL) |
| `FriendListTab` | 친구 목록, 대화, 삭제 | `selectedFriend`, `friendToDelete` |
| `FriendRequestsTab` | 요청 수락/거절/취소 | 없음 (서버 상태만) |
| `FriendDiscoverTab` | 검색, 추천 친구, 요청 전송 | `searchQuery`, `isSearching` |
| `FriendUserCard` | 유저 카드 렌더링 | 없음 (순수 표현 컴포넌트) |

### 2. 합성(Composition) 우선

페이지는 탭 컴포넌트를 조합만 한다. 상속이나 HOC 없이 props와 children으로 구성한다.

### 3. URL 기반 상태 관리

`useState` 대신 `searchParams`로 탭 상태를 관리하여 딥링크, 뒤로가기, 새로고침이 자연스럽게 동작한다.

### 4. 통일 UI 컴포넌트

`FriendUserCard`로 시각적 일관성을 확보하면서, `actions` prop의 `React.ReactNode` 타입으로 유연한 커스터마이징을 지원한다.

---

## 핵심 교훈

### 줄 수 비교

| 구분 | 리팩토링 전 | 리팩토링 후 | 변화 |
|------|-----------|-----------|------|
| FriendListPage.tsx | 578줄 | 47줄 | -91.9% |
| 컴포넌트 총합 | 578줄 (1개 파일) | 773줄 (7개 파일) | +33.7% |
| 파일당 평균 | 578줄 | 110줄 | -81.0% |
| 최대 파일 크기 | 578줄 | 228줄 (DiscoverTab) | -60.6% |

총 줄 수는 33.7% 증가했다. 컴포넌트 경계와 import 문, 인터페이스 정의 등 구조적 오버헤드가 추가되기 때문이다. 하지만 **파일당 평균 줄 수가 110줄로 줄어들어** 각 파일의 인지 부하가 대폭 감소했다. 578줄짜리 파일을 읽는 것과 110줄짜리 파일을 읽는 것은 개발 속도에서 체감 차이가 크다.

### 각 패턴의 재사용 가치

| 패턴 | 재사용 가능 장면 | 난이도 |
|------|----------------|--------|
| **탭 오케스트레이터** | 설정 페이지, 프로필 페이지 등 다중 탭 구조 어디서든 | 낮음 |
| **URL 파라미터 탭 관리** | 알림에서 특정 탭으로 이동해야 하는 모든 페이지 | 낮음 |
| **통일 카드 + actions prop** | 유저/아이템 리스트를 여러 맥락에서 다르게 표시해야 할 때 | 낮음 |
| **관계 상태 Set/Map 조회** | 팔로우/차단 등 관계 기반 UI 표시가 필요할 때 | 중간 |
| **빈 상태 CTA 패턴** | 온보딩 흐름이 중요한 모든 리스트 화면 | 낮음 |
| **백엔드 조인 API** | FE에서 여러 API를 조합하는 대신 BE에서 한 번에 제공 | 중간 |

### 리팩토링 시점 판단 기준

이 리팩토링은 "친구 페이지 탭 기반 리디자인"이라는 기능 변경과 함께 수행되었다. 순수한 리팩토링만을 위한 작업이 아니라, **기능 변경이 필요한 시점에 구조 개선을 함께 수행**한 것이다. 다음 조건 중 2개 이상 해당되면 리팩토링을 고려할 만하다:

1. **파일이 300줄을 넘었다** - 한 화면에 다 보이지 않으면 전체 흐름을 파악하기 어렵다.
2. **기능 변경 요청이 들어왔다** - 어차피 코드를 크게 만질 거라면 구조도 함께 개선한다.
3. **같은 UI 패턴이 3곳 이상 반복된다** - 통일 컴포넌트로 추출할 타이밍이다.
4. **새 기능 추가 시 기존 코드에 영향이 가는 범위가 넓다** - 컴포넌트 분리가 필요하다.

### 리팩토링 진행 순서

실제로 이 리팩토링에서 사용한 순서는 다음과 같았다:

1. **통일 카드 컴포넌트 추출** (`FriendUserCard`) - 가장 단순하고 위험이 낮은 작업부터
2. **탭 UI 분리** (`FriendTabs`) - 순수 표현 컴포넌트
3. **각 탭 컴포넌트 분리** (`FriendListTab`, `FriendRequestsTab`, `FriendDiscoverTab`) - 비즈니스 로직 이동
4. **모달 분리** (`PersonaDetailModal`) - 상태 연결이 복잡한 부분은 마지막에
5. **페이지를 오케스트레이터로 축소** - 모든 조각이 준비된 후 최종 조합
6. **백엔드 API 추가** - FE 구조가 확정된 후 필요한 데이터 형식에 맞춰 구현

이 순서의 핵심은 **가장 독립적인 조각부터 추출하고, 가장 의존성이 높은 부분을 마지막에 처리**하는 것이다. 반대로 페이지 구조부터 바꾸면 중간 과정에서 컴파일도 되지 않는 상태가 길어진다.
