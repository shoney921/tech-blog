---
title: "나닮 Web Enhancement — DB, API, 프론트 한 번에 손본 기록"
date: 2026-02-28T16:00:00
---

# 나닮 Web Enhancement — DB, API, 프론트 한 번에 손본 기록

`feature/web-enhancement` 브랜치에서 DB 성능, 프론트 성능, API 보안, 테스트 품질 네 가지 축으로 개선을 몰아서 진행했다. 한 번에 다 쓰진 않고, 손댄 부분만 요약해 둔다.

---

## 복합 인덱스 추가

자주 쓰는 쿼리 패턴에 맞춰 PostgreSQL 복합 인덱스를 7개 넣었다. 일기 날짜별 조회, 채팅 목록 최신순, 메시지 시간순, 읽지 않은 알림, 친구 요청/목록, 멘탈 분석 조회 등이다. 덕분에 해당 구간은 seq scan 대신 index scan으로 바뀌었다.

Notification은 기존에 `user_id`, `is_read` 각각 index만 걸려 있던 걸 빼고, `user_id + is_read + created_at` 3컬럼 복합 인덱스 하나로 통합했다. 배포 시엔 `alembic revision --autogenerate` 후 `upgrade head` 한 번 돌리면 된다.

---

## N+1 쿼리 정리

반복문 안에서 하나씩 DB 찔러보던 부분을 `joinedload` / `selectinload`나 배치 조회로 바꿨다.

가장 심했던 건 채팅 API. 채팅 N개 가져올 때마다 persona를 N번 따로 조회하던 걸, `joinedload(PersonaChat.persona)` 한 번으로 줄였다. `get_chat`, `send_message`, `send_message_stream`도 persona·messages를 eager load 하도록 통일했다. 친구 API는 `get_received_requests` / `get_sent_requests` / `get_friends`에서 requester·addressee lazy load 제거하고 `joinedload`로, `get_friends_with_persona`는 친구 ID 모아서 persona를 `user_id.in_()` 배치 조회로 바꿨다. `friend_service.get_recommendations()`도 `Persona.user` lazy load 제거하고 `joinedload(Persona.user)` 넣었다.

이거 하고 나니 채팅·친구 목록 로딩이 체감될 정도로 나아졌다.

---

## Rate Limiting 확대

원래는 로그인/회원가입 같은 auth 쪽에만 rate limit이 있었는데, LLM 쓰는 API에는 제한이 없어서 비용 폭주나 남용이 걸걸했다. 그래서 LLM을 호출하는 엔드포인트 11곳에 제한을 걸었다.

채팅 메시지 생성·스트리밍은 20회/분, 페르소나 생성·진화·퀴즈·업그레이드는 3회/분, 일기 주제 제안·주간 인사이트·멘탈 피드백·리포트류는 5회/분 이런 식이다. 기존에 쓰던 `slowapi`에 `@limiter.limit("N/minute")`랑 `Request` 파라미터만 추가했고, 프론트는 이미 429 처리해 두어서 따로 손댄 건 없다.

---

## 배경 이미지 최적화

`nadarm-background.png`가 5MB(2816x1536 PNG)라서 모바일에서 첫 로딩이 꽤 무거웠다. WebP로 바꾸고 해상도 나눠서 데스크톱용 1920x1047 19KB, 모바일용 1080x589 6KB 두 개 넣었다. PNG는 WebP 미지원 브라우저용 fallback으로 1920 기준으로 리사이징해 두었고, Layout에서는 Tailwind 반응형으로 `sm:` 이상에만 큰 걸 쓰고 그 아래는 모바일용을 쓰도록 바꿨다. 5MB → 19KB/6KB 수준으로 줄어서 체감이 꽤 크다.

---

## React.lazy 코드 스플리팅

`App.tsx`에서 페이지 27개를 전부 static import 하고 있어서 초기 번들에 다 들어가 있었다. Layout, ProtectedRoute, InstallPrompt, PushNotificationBanner 네 개만 그대로 두고, 나머지 페이지 컴포넌트는 전부 `React.lazy`로 바꿨다. Routes 전체를 `Suspense fallback={<PageLoading />}`로 감싸서 기존 로딩 UI를 그대로 쓰고 있다. 멘탈 쪽은 barrel import 제거하고 페이지별로 개별 lazy import 하도록 정리했다. 빌드해 보면 청크가 잘 갈라져 나오고, 첫 로딩이 이전보다 가벼워진 걸 확인할 수 있다.

---

## 백엔드 테스트 추가

원래 `conftest.py`에 DB/client fixture만 있고 실제 테스트는 없었는데, 이번에 인증·일기 핵심 플로우만이라도 자동 검증하고 싶어서 테스트를 넣었다.

`conftest`에는 이메일 인증까지 끝낸 테스트 유저 두 명이랑, 각각 JWT Bearer 헤더 주는 `auth_headers` / `auth_headers2` fixture를 추가했다. `test_auth.py`에서는 회원가입(성공·중복 이메일·중복 사용자명), 로그인(성공·잘못된 비밀번호·없는 사용자·이메일 미인증), 보호된 엔드포인트(토큰 없음·유효 토큰·잘못된 토큰) 11개. `test_diary.py`에서는 일기 생성(성공·미래 날짜/3일 이전/같은 날짜 중복 거부), 조회(빈 목록·상세·타인 일기 404·페이지네이션), 수정·삭제 8개 넣었다. `docker-compose exec backend pytest -v`로 돌리면 된다.

---

## 배포할 때 체크할 것

1. DB 마이그레이션 — 복합 인덱스 적용 (`alembic revision --autogenerate`, `upgrade head`)
2. 인덱스 적용 여부 — psql에서 `\d+ diaries` 등으로 확인
3. 테스트 실행 — `pytest -v`
4. 프론트 빌드 — 코드 스플리팅 청크 나오는지 확인
5. WebP는 새 파일이라 CDN/nginx 캐시 무효화는 안 해도 되고, PWA 쓰면 `APP_VERSION` 올려두는 걸 권장한다.

변경 파일은 백엔드 15개, 프론트 5개 정도고, 이번 턴에서 특히 N+1 제거랑 배경 이미지·코드 스플리팅이 체감이 컸다.
