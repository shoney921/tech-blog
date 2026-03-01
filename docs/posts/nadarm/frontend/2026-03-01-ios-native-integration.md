---
title: "iOS 네이티브 앱 붙이면서 맞닥뜨린 것들 — 키보드, 배지, 이메일 링크"
date: 2026-03-01T10:30:00
---

# iOS 네이티브 앱 붙이면서 맞닥뜨린 것들 — 키보드, 배지, 이메일 링크

나닮을 Capacitor로 iOS 네이티브에 올리면서, 키보드 올라올 때 탭바, 입력 필드 가림, APNs 배지, 이메일 링크 앱/웹 분기, SMTP 안정성까지 손댄 걸 짧게 정리해 둔다. 웹뷰만이 아니라 네이티브·서버까지 같이 봐야 해결되는 게 많았다.

---

## 키보드 올라올 때 하단 탭바 숨기기

iOS에서 키보드가 올라오면 하단 탭바가 키보드 위에 떠서 입력 영역을 더 줄어들게 했다. 모달일 때는 `visibility: hidden`으로 탭바를 숨기고 있었는데, 키보드일 때는 **공간까지 비워야** 해서 `display: none`으로 바꿔야 했다.

`useVisualViewport` 훅을 만들어서:

- **웹/PWA**: `window.visualViewport`의 resize/scroll로 키보드 열림 감지 (`innerHeight - vv.height > 50px`), 열리면 `document.body.dataset.keyboardOpen = ''` 설정
- **네이티브**: Capacitor `Keyboard.resize: 'none'` 때문에 visualViewport가 안 바뀌어서, `Keyboard.addListener('keyboardWillShow'/'keyboardWillHide')`로 처리

CSS에서는 `body[data-keyboard-open] #bottom-tab-bar { display: none; }`로 탭바를 숨긴다. `visibility`는 레이아웃을 유지해서 모달용, `display: none`은 공간까지 제거해서 키보드용으로 나눠 썼다. cleanup 시 `dataset.keyboardOpen` 삭제를 꼭 해야 해서, 다른 페이지로 나갔는데도 탭바가 안 보이는 일이 없도록 했다.

---

## 입력 필드가 키보드에 가려질 때

키보드가 올라오면 포커스된 입력 필드가 키보드 뒤로 숨는 경우가 많다. `useVisualViewport`에 **onKeyboardShow** 콜백을 넣어서, 페이지마다 필요한 동작만 넣었다.

- 일기 작성: `document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })` — 포커스 필드를 화면 중앙으로
- 채팅: `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` — 메시지 끝으로

일기에서는 키보드 애니메이션이 끝난 뒤 스크롤하려고 `setTimeout(..., 100)`을 줬다. 너무 일찍 호출하면 레이아웃이 안정되기 전이라 위치가 어긋난다.

---

## iOS 앱 아이콘 배지

푸시 보낼 때 badge를 1로 하드코딩하고 있어서, 알림이 여러 개여도 1만 보이고, 앱에서 다 읽어도 1로 남는 문제가 있었다.

- **서버**: 푸시 보낼 때 해당 유저의 **미읽 알림 개수**를 DB에서 조회해서 APNs payload의 `badge`에 넣는다.
- **클라이언트**: 앱이 포그라운드로 들어올 때 `applicationDidBecomeActive`에서 `applicationIconBadgeNumber = 0`으로 초기화.

한쪽만 하면 부족하다. 서버만 맞춰도 "읽은 뒤에도 다음 푸시 올 때까지 배지 유지"가 되고, 클라이언트만 하면 앱 열기 전까지 숫자가 안 맞는다. 둘 다 해야 자연스럽다.

---

## 이메일 링크 — 앱/웹 스마트 리다이렉트

이메일 인증·비밀번호 재설정 링크가 웹 URL이면, 앱 사용자가 누르면 Safari에서 열리고 앱으로 돌아와도 상태가 안 맞는 식의 불편이 있었다. Universal Links는 설정이 부담돼서, **중간 리다이렉트 페이지** 방식을 썼다.

이메일 링크를 `/api/v1/auth/verify-email-app?token=...` 같이 API 경로로 보내고, 이 엔드포인트는 HTML을 반환한다. 그 안에서 `com.nadarm.app://verify-email?token=...`을 먼저 열고, 1.5초 안에 안 열리면 웹 URL로 fallback. 수동으로 "앱에서 열기" / "웹에서 열기" 버튼도 둔다.

중요한 건, **이 페이지에서는 토큰을 소비하지 않는다**는 것. 실제 인증은 앱이든 웹이든 최종 도착한 화면에서 기존 verify-email API를 호출해서 처리한다. 리다이렉트는 경유지일 뿐이다.

---

## SMTP 전송 안정성

기존 이메일 전송에는 timeout 없음, HTML만 전송, `except Exception` 하나로 처리되는 문제가 있었다. `smtplib.SMTP(..., timeout=30)` 추가, `MIMEMultipart("alternative")`에 plain 먼저·html 나중에 붙이기(RFC 2046), SMTP 예외 종류별로 로그 나누기, 공통 `_send_email()` 헬퍼로 묶기를 적용했다. timeout 미설정은 프로덕션에서 워커가 묶일 수 있는 부분이라 꼭 넣는 게 좋다.

---

## 정리

키보드, 배지, 이메일 링크 모두 **한쪽만 고치면 반쪽**이다. 웹뷰/네이티브, 서버/클라이언트, 앱/웹 경로를 같이 보는 게 중요했다. Capacitor 설정(예: `Keyboard.resize: 'none'`) 하나가 웹뷰 동작을 바꾸니까, "웹에서는 되는데 앱에서만 안 돼요"일 때 설정부터 의심하는 게 좋다. `body[data-keyboard-open]` 같은 data 속성 + CSS 선택자로 상태를 넘기는 패턴은 props drilling 없이 쓰기 편했다.
