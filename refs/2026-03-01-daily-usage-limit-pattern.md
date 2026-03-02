# 일일 사용량 제한 구현 패턴

> **날짜**: 2026-03-01
> **커밋**: `a931c73` feat: 아바타 새로 뽑기 기능 추가 (일일 3회 제한)
> **사례**: 아바타 새로 뽑기 기능 — GPT Image API 호출 비용 제어를 위한 일일 3회 제한

---

## 전체 아키텍처

```
Frontend (확인 다이얼로그 → API 호출)
  → Backend API (rate limit + 사용량 확인)
    → SubscriptionService (DailyUsage 기반 제한)
      → 비용 발생 작업 (아바타 생성)
        → 성공 시에만 사용량 증가
```

수정 파일 총 8개:

| 레이어 | 파일 | 역할 |
|--------|------|------|
| DB 마이그레이션 | `backend/alembic/versions/98e9cd3af9df_...py` | `daily_usage`에 `avatar_regenerations` 컬럼 추가 |
| 모델 | `backend/app/models/usage.py` | DailyUsage 모델에 컬럼 선언 |
| 스키마 | `backend/app/schemas/persona.py` | `AvatarRegenerateResponse` 응답 스키마 |
| 서비스 | `backend/app/services/subscription_service.py` | 사용량 조회/증가/가능 여부 판단 |
| API | `backend/app/api/api_v1/endpoints/persona.py` | `/regenerate-avatar` 엔드포인트 |
| 프론트 타입 | `frontend/src/types/persona.ts` | `AvatarRegenerateResponse` 타입 |
| 프론트 서비스 | `frontend/src/services/personaService.ts` | `regenerateAvatar()` API 호출 |
| 프론트 페이지 | `frontend/src/pages/persona/PersonaPage.tsx` | 버튼, 확인 다이얼로그, 상태 관리 |

---

## 1단계: DB 모델 — DailyUsage 확장

기존 `DailyUsage` 테이블에 새 컬럼을 추가하는 방식. 테이블을 새로 만들지 않고 확장한다.

```python
# backend/app/models/usage.py
class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    usage_date = Column(Date, default=date.today, nullable=False, index=True)
    chat_messages = Column(Integer, default=0)           # 기존: 채팅 메시지 수
    avatar_regenerations = Column(Integer, default=0)    # 신규: 아바타 재생성 횟수

    __table_args__ = (
        UniqueConstraint('user_id', 'usage_date', name='uq_daily_usage_user_date'),
    )
```

Alembic 마이그레이션은 단순 `add_column`:

```python
def upgrade() -> None:
    op.add_column('daily_usage', sa.Column('avatar_regenerations', sa.Integer(), nullable=True))

def downgrade() -> None:
    op.drop_column('daily_usage', 'avatar_regenerations')
```

**포인트**: 모델에서는 `default=0`이지만 마이그레이션에서는 `nullable=True`로 추가. 기존 레코드는 `NULL`이 되므로 서비스 코드에서 `(usage.avatar_regenerations or 0)`으로 처리해야 한다.

---

## 2단계: 서비스 레이어 — SubscriptionService

세 가지 메서드로 구성. 기존 `chat_messages` 패턴과 동일한 구조를 따른다.

### 2-1. 사용량 조회 (`get_daily_avatar_regen_usage`)

```python
AVATAR_REGEN_DAILY_LIMIT = 3

def get_daily_avatar_regen_usage(self, user: User) -> int:
    """오늘의 아바타 재생성 사용량 조회"""
    today = date.today()
    usage = self.db.query(DailyUsage).filter(
        DailyUsage.user_id == user.id,
        DailyUsage.usage_date == today,
    ).first()
    return usage.avatar_regenerations if usage and usage.avatar_regenerations else 0
```

### 2-2. 사용량 증가 (`increment_avatar_regen_usage`)

Race condition 방지가 핵심:

```python
def increment_avatar_regen_usage(self, user: User) -> int:
    """아바타 재생성 사용량 증가 및 현재 사용량 반환"""
    from sqlalchemy.exc import IntegrityError
    today = date.today()

    # 1) with_for_update()로 행 잠금 → 동시 요청 시 하나만 통과
    usage = self.db.query(DailyUsage).filter(
        DailyUsage.user_id == user.id,
        DailyUsage.usage_date == today,
    ).with_for_update().first()

    if not usage:
        try:
            # 2) 오늘 첫 사용 → INSERT 시도
            usage = DailyUsage(user_id=user.id, usage_date=today, avatar_regenerations=1)
            self.db.add(usage)
            self.db.commit()
        except IntegrityError:
            # 3) 동시 요청으로 이미 INSERT된 경우 → rollback 후 UPDATE
            self.db.rollback()
            usage = self.db.query(DailyUsage).filter(
                DailyUsage.user_id == user.id,
                DailyUsage.usage_date == today,
            ).with_for_update().first()
            usage.avatar_regenerations = (usage.avatar_regenerations or 0) + 1
            self.db.commit()
    else:
        # 4) 이미 레코드 있음 → UPDATE
        usage.avatar_regenerations = (usage.avatar_regenerations or 0) + 1
        self.db.commit()

    return usage.avatar_regenerations
```

**Race condition 시나리오**: 사용자가 빠르게 버튼을 연타하거나, 두 디바이스에서 동시에 요청하는 경우:
- `with_for_update()`: SELECT ... FOR UPDATE로 행 잠금. 이미 레코드가 있으면 다른 트랜잭션은 대기.
- `IntegrityError` catch: 레코드가 없어서 INSERT하려는데, 다른 트랜잭션이 먼저 INSERT한 경우. UniqueConstraint 위반을 잡아서 UPDATE로 전환.

### 2-3. 가능 여부 확인 (`can_regenerate_avatar`)

```python
def can_regenerate_avatar(self, user: User) -> tuple[bool, int, Optional[str]]:
    """아바타 재생성 가능 여부 확인 → (가능 여부, 남은 횟수, 거절 사유)"""
    current_usage = self.get_daily_avatar_regen_usage(user)
    remaining = max(0, self.AVATAR_REGEN_DAILY_LIMIT - current_usage)

    if remaining <= 0:
        return False, 0, f"일일 아바타 재생성 횟수 {self.AVATAR_REGEN_DAILY_LIMIT}회를 모두 사용했어요. 내일 다시 시도해주세요!"

    return True, remaining, None
```

**반환 타입 `tuple[bool, int, Optional[str]]`**: 채팅 제한의 `tuple[bool, Optional[str]]`에서 `remaining`이 추가된 형태. 프론트엔드에서 남은 횟수를 표시하기 위해 API까지 전달해야 하기 때문.

---

## 3단계: API 엔드포인트

```python
@router.post("/regenerate-avatar", response_model=AvatarRegenerateResponse)
@limiter.limit("3/minute")  # FastAPI rate limit (분당 제한)
async def regenerate_avatar(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # 1. 페르소나 존재 확인
    persona = db.query(Persona).filter(Persona.user_id == current_user.id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona not found.")

    # 2. 일일 사용량 확인
    sub_service = SubscriptionService(db)
    can_regen, remaining, reason = sub_service.can_regenerate_avatar(current_user)
    if not can_regen:
        raise HTTPException(status_code=429, detail=reason)

    # 3. 비용 발생 작업 수행
    avatar_result = await generate_avatar(
        persona_data,
        previous_avatar_path=None,  # 기존 참조 없이 완전 새 생성
        gender=current_user.gender,
        birth_date=current_user.birth_date,
    )

    if not avatar_result.get("avatar_url"):
        raise HTTPException(status_code=500, detail="아바타 생성에 실패했어요.")

    # 4. 성공 시에만 사용량 증가 ← 핵심!
    sub_service.increment_avatar_regen_usage(current_user)
    remaining -= 1

    # 5. DB 업데이트
    persona.avatar_url = avatar_result["avatar_url"]
    persona.avatar_description = avatar_result.get("avatar_description")
    current_user.profile_image = avatar_result["avatar_url"]
    db.commit()

    # 6. 남은 횟수를 응답에 포함
    return AvatarRegenerateResponse(
        avatar_url=avatar_result["avatar_url"],
        remaining_today=remaining,
        message="새로운 아바타가 생성되었어요!",
    )
```

**이중 방어 구조**:
- `@limiter.limit("3/minute")`: FastAPI slowapi 기반 분당 3회 제한. 빠른 연타 차단용.
- `can_regenerate_avatar()`: DailyUsage 기반 일일 3회 제한. 비즈니스 로직 제한.

**HTTP 429 활용**: 사용량 초과 시 `429 Too Many Requests` 반환. 프론트엔드의 `getApiErrorMessage()`가 detail 메시지를 추출해 toast로 표시.

---

## 4단계: 응답 스키마

```python
# backend/app/schemas/persona.py
class AvatarRegenerateResponse(BaseModel):
    avatar_url: Optional[str] = None
    remaining_today: int          # 오늘 남은 횟수
    message: str                  # 사용자에게 보여줄 메시지
```

```typescript
// frontend/src/types/persona.ts
export interface AvatarRegenerateResponse {
  avatar_url: string | null
  remaining_today: number
  message: string
}
```

**`remaining_today` 필드가 핵심**: 프론트엔드가 별도 API 호출 없이 바로 남은 횟수를 갱신할 수 있다.

---

## 5단계: 프론트엔드

### 상태 관리

```tsx
const [showRegenAvatarConfirm, setShowRegenAvatarConfirm] = useState(false)
const [avatarRegenRemaining, setAvatarRegenRemaining] = useState(3)  // 초기값: 최대치
```

### Mutation

```tsx
const regenAvatarMutation = useMutation({
  mutationFn: personaService.regenerateAvatar,
  onSuccess: async (data: AvatarRegenerateResponse) => {
    toast.success(data.message)
    setAvatarRegenRemaining(data.remaining_today)  // 서버 응답으로 남은 횟수 갱신
    queryClient.invalidateQueries({ queryKey: ['myPersona'] })
    const me = await authService.getMe()           // 프로필 이미지도 갱신
    updateUser(me)
  },
  onError: (err) => {
    toast.error(getApiErrorMessage(err))
  },
})
```

### 확인 다이얼로그

```tsx
<ConfirmDialog
  isOpen={showRegenAvatarConfirm}
  onClose={() => setShowRegenAvatarConfirm(false)}
  onConfirm={() => {
    setShowRegenAvatarConfirm(false)
    regenAvatarMutation.mutate()
  }}
  title="아바타 새로 뽑기"
  description={`페르소나는 유지되고 이미지만 새로 생성됩니다.\n현재 이미지는 되돌릴 수 없습니다.\n\n남은 횟수: ${avatarRegenRemaining}회 (하루 3회 제한)`}
  confirmText="새로 뽑기"
  isLoading={regenAvatarMutation.isPending}
/>
```

### 버튼 비활성화

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowRegenAvatarConfirm(true)}
  disabled={regenAvatarMutation.isPending || avatarRegenRemaining <= 0}
  title="아바타 새로 뽑기"
>
  <RefreshCw className={cn('h-4 w-4', regenAvatarMutation.isPending && 'animate-spin')} />
</Button>
```

---

## 핵심 설계 포인트 요약

| # | 포인트 | 설명 |
|---|--------|------|
| 1 | **성공 후 증가** | 비용 발생 작업(GPT Image API)이 실패하면 사용량을 소비하지 않음. `increment`를 API 호출 성공 이후에 배치. |
| 2 | **이중 방어** | FastAPI rate limit(3/min) + DailyUsage(3/day). 분당 제한은 연타 방지, 일일 제한은 비용 제어. |
| 3 | **Race condition 방지** | `with_for_update()` 행 잠금 + `IntegrityError` catch. INSERT/UPDATE 두 경로 모두 안전. |
| 4 | **남은 횟수 응답 포함** | `remaining_today`를 API 응답에 넣어 프론트가 추가 조회 없이 즉시 UI 갱신. |
| 5 | **NULL 안전 처리** | 기존 레코드의 새 컬럼이 NULL일 수 있으므로 `(usage.avatar_regenerations or 0)` 패턴 사용. |
| 6 | **기존 테이블 확장** | 새 테이블 없이 `DailyUsage`에 컬럼만 추가. 조인 비용 없이 한 쿼리로 조회 가능. |

---

## 핵심 교훈

### "사용량 소비 시점"이 가장 중요한 설계 결정이다

사용량을 **언제** 증가시키느냐에 따라 사용자 경험이 완전히 달라진다:

- **작업 전 증가** (선차감): 구현이 간단하지만, 작업이 실패하면 사용자는 횟수만 잃고 결과를 못 받음. 사용자 불만의 원인.
- **작업 후 증가** (후차감): 성공한 경우에만 횟수 소비. 실패 시 횟수 보존. 이 프로젝트에서 채택한 방식.
- **트레이드오프**: 후차감 방식은 극단적 경우(서버 크래시 등) 사용량 증가 없이 결과만 받을 수 있지만, 일일 3회 정도의 소규모 제한에서는 무시 가능한 수준.

### Rate limit과 비즈니스 제한은 별개

- `@limiter.limit("3/minute")`: 인프라 보호. DDoS/연타 차단. IP/사용자 기반.
- `DailyUsage`: 비즈니스 로직. 비용 제어. 사용자에게 "오늘 X회 남았어요"라는 피드백 제공.
- 둘은 목적이 다르므로 반드시 양쪽 다 구현해야 한다.

### 남은 횟수는 서버가 알려줘야 한다

프론트엔드에서 로컬 상태로 관리하면 새로고침/멀티디바이스에서 어긋난다. 서버 응답의 `remaining_today`를 신뢰 소스(single source of truth)로 사용하되, 초기값은 낙관적으로 최대치를 설정한다.

---

## 이 패턴을 다른 기능에 적용할 때

### 체크리스트

1. **DailyUsage 모델 확장**
   - `backend/app/models/usage.py`에 새 `Column(Integer, default=0)` 추가
   - Alembic 마이그레이션 생성: `alembic revision --autogenerate -m "add_xxx_to_daily_usage"`
   - 마이그레이션에서 `nullable=True`로 추가 (기존 레코드 호환)

2. **SubscriptionService에 3개 메서드 추가**
   - `get_daily_xxx_usage(user)` → 현재 사용량 조회
   - `increment_xxx_usage(user)` → `with_for_update()` + `IntegrityError` 패턴으로 안전하게 증가
   - `can_xxx(user)` → `tuple[bool, int, Optional[str]]` 반환 (가능 여부, 남은 횟수, 거절 사유)

3. **API 엔드포인트**
   - `@limiter.limit("N/minute")` 분당 제한 추가
   - `can_xxx()` 확인 → 실패 시 `HTTPException(429)`
   - 비용 발생 작업 수행
   - **성공 후** `increment_xxx_usage()` 호출
   - 응답에 `remaining_today` 포함

4. **응답 스키마**
   - `remaining_today: int` 필드 포함 (Backend Pydantic + Frontend TypeScript)

5. **프론트엔드**
   - `useState`로 남은 횟수 관리 (초기값: 최대치)
   - `onSuccess`에서 `data.remaining_today`로 갱신
   - 남은 횟수 0이면 버튼 `disabled`
   - 확인 다이얼로그에 남은 횟수 표시

### 적용 가능한 후보 기능들

| 기능 | 제한 기준 | 비용 근거 |
|------|-----------|-----------|
| 페르소나 진화 | 월 N회 | LLM 호출 (프롬프트 대량) |
| 멘탈 분석 리포트 생성 | 일일 N회 | LLM 호출 |
| AI 일기 주제 제안 | 일일 N회 | LLM 호출 |
| 성격 퀴즈 생성 | 일일 N회 | LLM 호출 |

월간 제한이 필요한 경우 `DailyUsage` 대신 `MonthlyUsage` 테이블을 만들거나, `usage_date` 대신 `usage_month`를 키로 사용하는 변형을 고려할 수 있다.
