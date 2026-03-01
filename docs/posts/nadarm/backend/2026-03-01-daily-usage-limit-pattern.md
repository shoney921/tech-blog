---
title: "일일 사용량 제한 넣을 때 — 아바타 새로 뽑기 3회 제한 사례"
date: 2026-03-01T10:20:00
---

# 일일 사용량 제한 넣을 때 — 아바타 새로 뽑기 3회 제한 사례

GPT Image API 비용을 잡기 위해 "아바타 새로 뽑기"에 일일 3회 제한을 넣었다. DB 확장, 서비스 레이어, API, 프론트까지 한 번에 손댄 패턴을 정리해 둔다. 다른 "일 N회 제한" 기능에도 그대로 갖다 쓸 수 있다.

---

## 전체 흐름

프론트에서 확인 다이얼로그 → API 호출. 백엔드에서는 rate limit(분당) + DailyUsage 기반 일일 제한을 둘 다 검사하고, 비용 나가는 작업(아바타 생성)을 **성공한 뒤에만** 사용량을 올린다.

수정한 곳은 대략: DB 마이그레이션(컬럼 추가), DailyUsage 모델, SubscriptionService(조회/증가/가능 여부), persona API, 프론트 타입·서비스·페이지(버튼, 다이얼로그, 남은 횟수 표시).

---

## DB·서비스 레이어

기존 `daily_usage` 테이블에 `avatar_regenerations` 컬럼만 추가했다. 새 테이블을 만들지 않고 확장. 마이그레이션에서는 기존 행 호환을 위해 `nullable=True`로 두고, 코드에서는 `(usage.avatar_regenerations or 0)`으로 처리한다.

SubscriptionService에는 세 가지를 넣었다.

- **get_daily_avatar_regen_usage(user)** — 오늘 사용량 조회
- **increment_avatar_regen_usage(user)** — 사용량 증가 (여기가 제일 중요)
- **can_regenerate_avatar(user)** — (가능 여부, 남은 횟수, 거절 사유) 튜플 반환

증가 로직에서 **race condition**을 막기 위해 `with_for_update()`로 행을 잠그고, 오늘 첫 사용이면 INSERT를 시도한다. 동시에 두 요청이 들어와서 둘 다 "레코드 없음"으로 INSERT하려 들면 UniqueConstraint 위반이 나니까, `IntegrityError`를 잡아서 rollback 후 다시 조회해서 UPDATE하는 패턴을 썼다.

---

## 사용량은 언제 올릴까

**작업 전에** 올리면 구현은 쉽지만, 실패해도 횟수만 까인다. **작업 성공 후에** 올리면 실패 시 횟수는 그대로다. 우리는 후자(성공 시에만 증가)를 선택했다. 아바타 생성이 실패하면 사용량은 그대로 두고, 성공 응답에 `remaining_today`를 넣어서 프론트가 추가 조회 없이 바로 갱신하게 했다.

---

## API·프론트

엔드포인트에서는 `@limiter.limit("3/minute")`로 분당 3회(연타 방지), 그다음 `can_regenerate_avatar()`로 일일 3회를 검사한다. 초과 시 429, 메시지는 `detail`에 넣어서 기존 toast 처리 그대로 쓰면 된다. 아바타 생성 성공 후에만 `increment_avatar_regen_usage()`를 호출하고, 응답에 `remaining_today`를 포함한다.

프론트는 `avatarRegenRemaining` 상태를 두고, mutation `onSuccess`에서 `data.remaining_today`로 갱신. 0이면 버튼 비활성화, 확인 다이얼로그에 "남은 횟수: N회 (하루 3회 제한)" 같이 보여 주면 된다. 남은 횟수는 서버가 알려주는 값을 신뢰 소스로 두고, 초기값만 낙관적으로 최대치(3)로 두었다.

---

## 다른 기능에 쓸 때 체크리스트

1. DailyUsage에 컬럼 추가 + 마이그레이션 (nullable=True)
2. SubscriptionService에 get / increment / can 세 메서드 (increment는 with_for_update + IntegrityError 패턴)
3. API: rate limit + can 확인 → 실패 시 429, 비용 작업 수행 → **성공 후** increment, 응답에 remaining_today
4. 스키마·타입에 remaining_today 포함
5. 프론트: onSuccess에서 remaining 갱신, 0이면 버튼 비활성화

페르소나 진화(월 N회), 멘탈 리포트·일기 주제 제안(일 N회) 같은 LLM 비용 나가는 기능에도 같은 패턴을 그대로 적용할 수 있다. 월간 제한이 필요하면 DailyUsage 대신 월 단위 테이블이나 usage_month 키를 쓰는 변형을 생각하면 된다.
