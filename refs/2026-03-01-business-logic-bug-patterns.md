# 비즈니스 로직 버그 수정 및 코드 정리 패턴

> **날짜**: 2026-03-01
> **관련 커밋**: `89455d9`, `7f9220c`
> **관련 파일**: `persona_service.py`, `persona_evolution_service.py`, `persona.py`(스키마), `PersonaPage.tsx`, `persona.ts`(타입), `FriendTabs.tsx`

---

## 1. 페르소나 레벨 업그레이드 직후 진화가 즉시 활성화되는 버그

### 문제 상황

페르소나를 처음 생성(basic)하거나 업그레이드(complete)할 때 `diary_count_at_last_evolution` 값을 설정하지 않아, 이 필드가 기본값 0으로 남아있었다. 진화 조건은 "마지막 진화 이후 새 일기 5개"인데, 기준점이 0이므로 업그레이드 직후 현재 일기 수 전체가 "새 일기"로 계산되어 즉시 진화 조건을 충족하는 버그가 발생했다.

구체적인 시나리오:
1. 사용자가 일기 10개를 작성한다.
2. 페르소나를 업그레이드(complete)한다.
3. `diary_count_at_last_evolution`이 0으로 남아있다.
4. 새 일기 수 = 현재(10) - 기준점(0) = **10개**.
5. 5개 조건을 즉시 충족하여 업그레이드 직후 진화 버튼이 활성화된다.

### 원인 분석

`generate_persona`와 `upgrade_persona` 두 경로 모두에서 `diary_count_at_last_evolution`을 설정하지 않았다.

```python
# backend/app/services/persona_service.py (수정 전)
persona = Persona(
    user_id=user.id,
    name=persona_data.get("name", f"{user.username}의 페르소나"),
    personality=persona_data.get("personality", ""),
    traits=json.dumps(persona_data.get("traits", []), ensure_ascii=False),
    speaking_style=persona_data.get("speaking_style", ""),
    avatar_url=avatar_result.get("avatar_url"),
    avatar_description=avatar_result.get("avatar_description"),
    # diary_count_at_last_evolution 미설정 → 기본값 0
)
```

진화 서비스에서 새 일기 수를 계산하는 로직은 정상이었지만, 기준점이 잘못되어 결과가 틀렸다:

```python
# backend/app/services/persona_evolution_service.py
def _get_new_diary_count(self, user: User, persona: Persona) -> int:
    base_count = persona.diary_count_at_last_evolution or 0  # 0이면 전체 일기가 "새 일기"
    total_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()
    return max(0, total_count - base_count)
```

### 수정

페르소나 생성 시와 업그레이드 시 모두 현재 일기 수를 기준점으로 설정한다.

```python
# backend/app/services/persona_service.py (수정 후)

# 생성 시
diary_count = self.db.query(Diary).filter(Diary.user_id == user.id).count()
persona = Persona(
    user_id=user.id,
    name=persona_data.get("name", f"{user.username}의 페르소나"),
    personality=persona_data.get("personality", ""),
    traits=json.dumps(persona_data.get("traits", []), ensure_ascii=False),
    speaking_style=persona_data.get("speaking_style", ""),
    avatar_url=avatar_result.get("avatar_url"),
    avatar_description=avatar_result.get("avatar_description"),
    diary_count_at_last_evolution=diary_count,  # 현재 일기 수로 초기화
)

# 업그레이드 시
persona.level = new_level
persona.diary_count_at_last_evolution = diary_count  # 업그레이드 시점 일기 수로 리셋
```

### 주의사항/교훈

- **"기준점(baseline)" 역할을 하는 필드는 생성 시점에 반드시 초기화해야 한다.** 0이 유효한 기본값처럼 보이지만, "차이(delta)"를 계산하는 필드에서 0은 "처음부터"라는 완전히 다른 의미를 가진다.
- **모든 생성/변경 경로를 검증해야 한다.** 이 경우 `generate_persona`(최초 생성)와 `upgrade_persona`(레벨 업) 두 경로가 있었는데, 두 곳 모두에서 누락되었다. 새 조건 기능을 추가할 때 "이 값이 설정되는 모든 곳"을 검색하는 습관이 필요하다.
- **테스트 시 "최초 상태에서의 동작"을 반드시 확인해야 한다.** 기존 데이터가 있는 상태에서만 테스트하면 기본값 문제를 놓치기 쉽다.

---

## 2. Dead Code 제거와 로직 단순화

### 문제 상황

`PersonaEvolutionService`에 프리미엄 구독 기반 진화 제한 로직이 남아있었다. 하지만 프리미엄이 전면 무료 개방(v1.16.0)된 이후 이 로직은 실행될 일이 없는 dead code가 되었다. 불필요한 서비스 의존성(`SubscriptionService`, `FREE_PLAN_LIMITS`, `PREMIUM_PLAN_LIMITS`)이 유지되고 있었고, 프론트엔드에도 `monthly_used`/`monthly_limit` 표시 UI와 `cooldown_days_remaining` 스키마 필드가 남아있었다.

### 수정 전 (복잡한 상태)

```python
# backend/app/services/persona_evolution_service.py (수정 전)
from app.constants.subscription import FREE_PLAN_LIMITS, PREMIUM_PLAN_LIMITS
from app.services.subscription_service import SubscriptionService

class PersonaEvolutionService:
    def _get_today_evolution_count(self, persona: Persona, is_premium: bool) -> int:
        """오늘 수동 진화 횟수 (프리미엄일 때만 의미 있음)"""
        if not is_premium:
            return 0
        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        return self.db.query(PersonaEvolutionHistory).filter(
            PersonaEvolutionHistory.persona_id == persona.id,
            PersonaEvolutionHistory.evolution_type == "manual",
            PersonaEvolutionHistory.created_at >= start_of_day,
        ).count()

    def check_evolution_ready(self, user: User) -> dict:
        sub_service = SubscriptionService(self.db)
        is_premium = sub_service.is_premium(user)
        limits = PREMIUM_PLAN_LIMITS if is_premium else FREE_PLAN_LIMITS
        daily_limit = limits.get("daily_evolution_limit")

        new_diary_count = self._get_new_diary_count(user, persona)
        daily_used = self._get_today_evolution_count(persona, is_premium)

        can_evolve = True
        reason = None
        if new_diary_count < EVOLUTION_MIN_NEW_DIARIES:
            can_evolve = False
            reason = f"새 일기 {EVOLUTION_MIN_NEW_DIARIES - new_diary_count}개를 더 작성해 주세요."
        elif is_premium and daily_limit is not None and daily_used >= daily_limit:
            can_evolve = False
            reason = "오늘 진화 횟수를 모두 사용했어요. 내일 다시 시도해 주세요."

        return {
            "can_evolve": can_evolve, "reason": reason,
            "new_diary_count": new_diary_count,
            "cooldown_days_remaining": 0,
            "monthly_used": daily_used, "monthly_limit": daily_limit or 0,
            ...
        }
```

### 수정 후 (단순화된 상태)

```python
# backend/app/services/persona_evolution_service.py (수정 후)
# SubscriptionService, FREE_PLAN_LIMITS, PREMIUM_PLAN_LIMITS import 제거됨
# _get_today_evolution_count() 메서드 제거됨

class PersonaEvolutionService:
    def check_evolution_ready(self, user: User) -> dict:
        """진화 가능 여부 + 상태 정보 반환"""
        persona = self.db.query(Persona).filter(Persona.user_id == user.id).first()
        if not persona or persona.level != "complete":
            return {
                "can_evolve": False,
                "reason": "완전한 페르소나가 필요합니다.",
                "new_diary_count": 0,
                "required_diary_count": EVOLUTION_MIN_NEW_DIARIES,
                "evolution_count": 0,
                "last_evolved_at": None,
            }

        new_diary_count = self._get_new_diary_count(user, persona)
        can_evolve = new_diary_count >= EVOLUTION_MIN_NEW_DIARIES
        reason = None if can_evolve else f"새 일기 {EVOLUTION_MIN_NEW_DIARIES - new_diary_count}개를 더 작성해 주세요."

        return {
            "can_evolve": can_evolve,
            "reason": reason,
            "new_diary_count": new_diary_count,
            "required_diary_count": EVOLUTION_MIN_NEW_DIARIES,
            "evolution_count": persona.evolution_count or 0,
            "last_evolved_at": persona.last_evolved_at.isoformat() if persona.last_evolved_at else None,
        }
```

### 제거된 것들

| 레이어 | 제거 항목 |
|--------|-----------|
| 백엔드 서비스 | `_get_today_evolution_count()` 메서드 전체 |
| 백엔드 import | `SubscriptionService`, `FREE_PLAN_LIMITS`, `PREMIUM_PLAN_LIMITS` |
| 백엔드 스키마 | `EvolutionStatusResponse`의 `cooldown_days_remaining`, `monthly_used`, `monthly_limit` 필드 |
| 프론트 타입 | `EvolutionStatus`의 `cooldown_days_remaining`, `monthly_used`, `monthly_limit` 필드 |
| 프론트 UI | `PersonaPage.tsx`의 "오늘 N/M회 사용" 표시 |

### 주의사항/교훈

- **비즈니스 정책 변경 시 관련 dead code도 함께 정리해야 한다.** 유료 -> 무료 전환(v1.16.0)은 6버전 전이었지만, 구독 기반 로직이 그대로 남아있었다. 정책 변경과 코드 정리의 시점이 벌어질수록 "왜 이 코드가 있는지" 파악하기 어려워진다.
- **불필요한 서비스 의존성은 복합적인 비용을 발생시킨다.** `SubscriptionService`를 import하면: (1) 해당 서비스의 변경이 진화 서비스에 영향을 줄 수 있고, (2) 테스트 시 mock이 필요하고, (3) 코드를 읽는 사람이 구독 로직이 실제로 적용된다고 오해할 수 있다.
- **API 스키마 필드를 제거할 때는 프론트엔드도 함께 정리해야 한다.** 백엔드에서 필드를 제거하면 프론트에서 `undefined`로 남아 UI 깨짐이나 타입 에러가 발생할 수 있다. TypeScript strict 모드를 사용하고 있다면 타입 정의에서 제거하여 컴파일 타임에 모든 참조를 찾아 정리할 수 있다.
- **코드량 변화: 5개 파일, +6줄 / -58줄.** 올바른 정리는 코드를 줄인다. 줄어든 코드량은 향후 유지보수 비용의 직접적인 감소다.

---

## 3. 소소하지만 중요한 z-index 이슈

### 문제 상황

친구 페이지의 탭 버튼("친구", "요청", "찾기") 중 "요청" 탭에 미수신 친구 요청 수를 표시하는 빨간 배지가 있다. 이 배지가 `absolute` 포지셔닝으로 버튼 밖에 위치하는데, DOM 순서상 바로 뒤에 오는 "찾기" 탭 버튼에 가려져 보이지 않는 현상이 발생했다.

```
[친구] [요청(🔴 ← 여기 배지)] [찾기 ← 이 버튼이 배지 위에 렌더링]
```

### 원인 분석

CSS 스택 컨텍스트에서 `z-index`가 명시되지 않은 요소들은 **DOM 순서**에 따라 쌓인다. "요청" 버튼의 배지는 `absolute`로 버튼 영역 밖(-top-1, -right-1)으로 튀어나오지만, z-index가 없으므로 DOM 순서상 뒤에 오는 "찾기" 버튼이 그 위에 렌더링된다.

### 수정

배지에 `z-10`을 추가하여 인접 요소보다 위에 렌더링되도록 했다.

```tsx
// frontend/src/components/friend/FriendTabs.tsx
{tab.key === 'requests' && receivedRequestCount > 0 && (
  <span className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
    {receivedRequestCount}
  </span>
)}
```

### 주의사항/교훈

- **`absolute` 포지셔닝 + 인접 형제 요소 = z-index 필수 체크.** `absolute`로 부모 영역 밖에 배치되는 요소가 형제 요소와 겹칠 때, z-index 없이는 DOM 순서가 쌓임 순서를 결정한다. 배지, 툴팁, 드롭다운 등 오버레이 성격의 요소에는 항상 z-index를 명시하는 것이 안전하다.
- **개발 환경에서 발견하기 어렵다.** 배지 숫자가 있을 때만 렌더링되고, 탭 버튼 사이의 좁은 겹침 영역에서만 보이므로, 디자인 리뷰나 일반적인 테스트에서 놓치기 쉽다. 실제 데이터가 있는 디바이스에서 확인해야 발견된다.
- **Tailwind의 `z-10`은 `z-index: 10`이다.** 같은 스택 컨텍스트 내에서 인접 요소(기본 z-index: auto, 실질적으로 0)보다 확실히 위에 오게 하려면 z-10 정도면 충분하다. 과도하게 높은 값(z-50, z-[9999])을 남발하면 나중에 모달, 토스트 등과 충돌할 수 있다.

---

## 핵심 교훈

### 1. 초기값 설정은 "당연히 되어 있을 것"이라고 가정하지 마라

데이터베이스 필드의 기본값 0과 비즈니스 로직에서 "아직 사용하지 않음"은 전혀 다른 의미다. 특히 **차이(delta)를 계산하는 기준점 필드**(마지막 진화 시점의 일기 수, 마지막 로그인 시간, 마지막 동기화 ID 등)는 생성 시점에 올바른 값으로 초기화하지 않으면 예상치 못한 동작을 유발한다. 새 기능을 추가할 때 "이 값이 0이면 어떻게 되지?"라는 질문을 반드시 해야 한다.

### 2. Dead code 정리는 정책 변경과 동시에 하라

비즈니스 정책 변경(유료 -> 무료, 기능 제거 등) 시점에 관련 코드를 함께 정리하는 것이 이상적이다. 시간이 지나면 "이 코드가 왜 있는지", "삭제해도 안전한지" 판단이 점점 어려워진다. 이번 경우 v1.16.0에서 전면 무료를 개방했지만 구독 기반 로직은 v1.24.x까지 남아있었다. 정리 시점이 늦어질수록 "혹시 다시 쓸 수 있지 않을까?"라는 심리적 저항이 커지고, 결과적으로 dead code가 영구적으로 남게 된다.

### 3. 프론트엔드와 백엔드는 반드시 동시에 정리하라

API 스키마 필드를 백엔드에서 제거하면서 프론트엔드 타입과 UI를 함께 정리하지 않으면, 런타임에 `undefined` 참조가 발생하거나 의미 없는 UI가 남는다. TypeScript의 strict 모드를 활용하면 타입 정의에서 필드를 제거하는 것만으로 모든 참조 위치를 컴파일러가 알려주므로, 정리 누락을 방지할 수 있다. 이번 수정에서는 `EvolutionStatus` 타입에서 3개 필드를 제거하여 `PersonaPage.tsx`의 참조도 자연스럽게 정리되었다.

### 4. 모든 생성/변경 경로를 추적하라

하나의 모델이 여러 경로(생성, 업그레이드, 진화, 관리자 수정 등)로 변경될 수 있다면, 새 필드를 추가할 때 **모든 경로**에서 해당 필드가 올바르게 설정되는지 확인해야 한다. 코드베이스에서 해당 모델의 생성/수정 지점을 검색(`Persona(`, `persona.level =` 등)하는 습관을 들이면 누락을 방지할 수 있다.

### 5. CSS 스택 컨텍스트는 의도적으로 관리하라

`absolute`나 `fixed` 포지셔닝을 사용하는 요소가 다른 요소와 겹칠 가능성이 있다면 z-index를 명시적으로 지정해야 한다. "지금은 괜찮아 보인다"는 것은 현재 데이터와 뷰포트에서만 괜찮은 것이지, 다른 조건에서는 겹침이 발생할 수 있다. 프로젝트 내에서 z-index 체계(예: 배지 10, 드롭다운 20, 모달 30, 토스트 40)를 정해두면 충돌을 예방할 수 있다.
