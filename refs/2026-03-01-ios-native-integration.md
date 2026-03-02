# iOS 네이티브 앱 통합 패턴

> **날짜**: 2026-03-01
> **관련 커밋**: `34189fb`, `aec4f6b`
> **관련 파일**: `useVisualViewport.ts`, `index.css`, `AppDelegate.swift`, `push_notification_service.py`, `auth.py`, `email_service.py`

---

## 1. iOS 키보드 활성화 시 하단 탭바 숨김

### 문제 상황

iOS에서 키보드가 올라오면 하단 탭바(`#bottom-tab-bar`)가 키보드 위에 떠서 화면에 불필요하게 표시된다. 특히 채팅 페이지나 일기 작성 페이지에서 입력 영역이 이미 좁은데, 탭바까지 공간을 차지하면 실질적인 콘텐츠 영역이 크게 줄어든다. 기존에 모달이 열릴 때 탭바를 숨기는 로직(`visibility: hidden`)이 있었지만, 키보드 상황에서는 다른 접근이 필요했다.

### 해결 접근법

두 가지 환경(웹/PWA, 네이티브 앱)을 모두 커버하는 `useVisualViewport` 훅을 만들었다.

1. **웹/PWA**: `window.visualViewport` API의 `resize`/`scroll` 이벤트를 감지하여 `window.innerHeight - vv.height > 50px`이면 키보드가 열린 것으로 판단한다.
2. **네이티브 앱**: Capacitor의 `Keyboard` 플러그인이 제공하는 `keyboardWillShow`/`keyboardWillHide` 이벤트를 사용한다. `capacitor.config.ts`에서 `Keyboard.resize: 'none'`으로 설정했기 때문에 네이티브에서는 `visualViewport`가 업데이트되지 않아 별도 처리가 필요하다.
3. 키보드 열림 시 `document.body.dataset.keyboardOpen = ''` 속성을 토글하고, CSS에서 `display: none`으로 탭바를 완전히 숨긴다.

### 실제 코드

```typescript
// frontend/src/hooks/useVisualViewport.ts

const KEYBOARD_THRESHOLD = 50

export function useVisualViewport(options?: UseVisualViewportOptions) {
  const rafRef = useRef<number>(0)
  const onKeyboardShowRef = useRef(options?.onKeyboardShow)
  onKeyboardShowRef.current = options?.onKeyboardShow

  const handleResize = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const vv = window.visualViewport
      if (!vv) return

      if (window.innerHeight - vv.height > KEYBOARD_THRESHOLD) {
        // 키보드 열림 → visual viewport 높이 사용
        document.documentElement.style.setProperty('--vh', `${vv.height}px`)
        document.body.dataset.keyboardOpen = ''
        requestAnimationFrame(() => onKeyboardShowRef.current?.())
      } else {
        // 키보드 닫힘 → CSS 기본값(100dvh) 사용
        document.documentElement.style.removeProperty('--vh')
        delete document.body.dataset.keyboardOpen
      }
    })
  }, [])

  useEffect(() => {
    // body 스크롤 잠금 (iOS 키보드 push 방지)
    document.documentElement.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = '0'

    let cleanup: (() => void) | undefined

    if (isNative()) {
      // 네이티브 앱: Capacitor Keyboard 플러그인 이벤트 사용
      let isMounted = true
      let showHandle: Promise<{ remove: () => void }> | undefined
      let hideHandle: Promise<{ remove: () => void }> | undefined

      import('@capacitor/keyboard').then(({ Keyboard }) => {
        if (!isMounted) return

        showHandle = Keyboard.addListener('keyboardWillShow', (info) => {
          const newHeight = window.innerHeight - info.keyboardHeight
          document.documentElement.style.setProperty('--vh', `${newHeight}px`)
          document.body.dataset.keyboardOpen = ''
          requestAnimationFrame(() => onKeyboardShowRef.current?.())
        })
        hideHandle = Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.style.removeProperty('--vh')
          delete document.body.dataset.keyboardOpen
        })
      }).catch(() => {})

      cleanup = () => {
        isMounted = false
        showHandle?.then(l => l.remove())
        hideHandle?.then(l => l.remove())
      }
    } else {
      // 웹/PWA: visualViewport API 사용
      const vv = window.visualViewport
      if (vv) {
        vv.addEventListener('resize', handleResize)
        vv.addEventListener('scroll', handleResize)
        handleResize()
      }
      cleanup = () => {
        const vv = window.visualViewport
        if (vv) {
          vv.removeEventListener('resize', handleResize)
          vv.removeEventListener('scroll', handleResize)
        }
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      cleanup?.()
      document.documentElement.style.removeProperty('--vh')
      delete document.body.dataset.keyboardOpen
      // body 스타일 복원
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [handleResize])
}
```

```css
/* frontend/src/index.css */

/* 모달 열릴 때 하단 탭바 숨김 (visibility로 레이아웃 유지) */
body[data-modal-open] #bottom-tab-bar {
  visibility: hidden;
}

/* 키보드 열릴 때 하단 탭바 숨김 (display:none으로 공간 확보) */
body[data-keyboard-open] #bottom-tab-bar {
  display: none;
}
```

### 주의사항/교훈

- **`visibility: hidden` vs `display: none` 선택 기준**: 모달이 열릴 때는 `visibility: hidden`을 사용한다. 탭바가 차지하는 공간은 유지되므로 레이아웃이 점프하지 않는다. 반면 키보드가 열릴 때는 `display: none`을 사용한다. 탭바가 차지하던 공간까지 완전히 제거되어 콘텐츠 입력 영역이 최대한 확보된다.
- **Capacitor `Keyboard.resize: 'none'` 설정의 영향**: 네이티브 앱에서 이 설정을 하면 키보드가 올라와도 웹뷰의 `visualViewport`가 리사이즈되지 않는다. 웹뷰 리사이즈를 CSS가 아닌 직접 제어하기 위한 설정이지만, 그 결과 웹에서 사용하는 `visualViewport.resize` 이벤트가 발화하지 않으므로 Capacitor의 `keyboardWillShow`/`keyboardWillHide` 이벤트를 별도로 사용해야 한다.
- **`requestAnimationFrame` 이중 사용**: `handleResize`에서 `cancelAnimationFrame` + `requestAnimationFrame`으로 래핑하여, `resize`와 `scroll` 이벤트가 동시에 다수 발화될 때 마지막 프레임에서만 DOM 조작이 실행되도록 디바운싱한다.
- **cleanup에서 `dataset` 삭제 필수**: 컴포넌트가 언마운트될 때 `delete document.body.dataset.keyboardOpen`을 반드시 호출해야 한다. 그렇지 않으면 입력 페이지에서 벗어난 후에도 탭바가 숨겨진 채로 남는다.
- **`--vh` CSS 변수 전략**: 키보드가 열리면 `--vh`를 `visualViewport.height`로 설정하고, 닫히면 제거하여 CSS 기본값(`100dvh`)으로 복귀한다. 이렇게 하면 키보드 높이를 포함한 정확한 레이아웃 계산이 가능하다.

---

## 2. 모바일 키보드로 입력 필드가 가려지는 문제

### 문제 상황

iOS에서 키보드가 올라오면 현재 포커스된 입력 필드가 키보드 뒤로 가려지는 경우가 빈번하다. 특히 일기 작성 페이지에서 하단에 위치한 textarea에 포커스하면 키보드가 올라오면서 입력 영역이 화면 밖으로 밀려나는 문제가 있었다. 채팅 페이지에서는 입력창이 항상 하단 고정이므로 메시지 목록을 최하단으로 스크롤해야 최신 메시지가 보인다.

### 해결 접근법

`useVisualViewport` 훅에 `onKeyboardShow` 콜백 옵션을 추가하여, 키보드가 열릴 때 각 페이지에서 필요한 스크롤 동작을 수행할 수 있게 했다. 일기 작성 페이지에서는 `document.activeElement`(현재 포커스된 요소)를 `scrollIntoView`로 화면 중앙에 배치하고, 채팅 페이지에서는 메시지 목록의 끝으로 스크롤한다.

### 실제 코드

```tsx
// frontend/src/pages/diary/DiaryNewPage.tsx
// 일기 작성: 현재 포커스된 입력 필드를 화면 중앙으로 스크롤

useVisualViewport({
  onKeyboardShow: () => {
    setTimeout(() => {
      document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  },
})
```

```tsx
// frontend/src/pages/persona/PersonaChatPage.tsx
// 채팅: 메시지 목록의 끝(최신 메시지)으로 스크롤

useVisualViewport({
  onKeyboardShow: () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
})
```

### 주의사항/교훈

- **`setTimeout` 100ms 지연이 필요한 이유**: 키보드 애니메이션이 진행 중일 때 `scrollIntoView`를 호출하면, 레이아웃이 아직 확정되지 않아 스크롤 위치가 부정확하다. 100ms 지연을 두면 키보드 애니메이션이 대부분 완료된 후 정확한 위치로 스크롤된다.
- **`block: 'center'` vs `block: 'nearest'`**: 일기 작성처럼 여러 입력 필드가 세로로 배치된 페이지에서는 `'center'`가 적합하다. 입력 필드가 화면 중앙에 위치하면 위아래 문맥을 함께 볼 수 있다. `'nearest'`는 이미 보이는 경우 스크롤하지 않으므로, 키보드에 의해 가려진 상황에서는 동작하지 않을 수 있다.
- **페이지별 콜백 분리 설계**: `useVisualViewport`가 직접 `scrollIntoView`를 호출하지 않고 콜백으로 위임한 이유는, 페이지마다 키보드 표시 시 수행할 동작이 다르기 때문이다. 채팅은 메시지 목록 끝으로, 일기 작성은 활성 입력 필드로, 각각 다른 스크롤 타겟이 필요하다.
- **네이티브 환경에서의 콜백 타이밍**: Capacitor의 `keyboardWillShow`는 키보드가 올라오기 "직전"에 발화한다. 이때 `onKeyboardShow` 콜백이 `requestAnimationFrame`으로 한 프레임 지연되어 실행되므로, `--vh` CSS 변수 업데이트 후에 스크롤이 계산된다.

---

## 3. iOS 앱 아이콘 배지 동기화

### 문제 상황

APNs 푸시 전송 시 badge 값을 `1`로 하드코딩하고 있었다. 그 결과:
1. 알림이 여러 개 와도 배지가 항상 `1`로 표시되어, 사용자가 미읽 알림의 실제 개수를 알 수 없었다.
2. 앱에서 알림을 모두 읽어도 배지가 그대로 `1`로 남아있어, 사용자가 계속 알림이 있는 것으로 착각했다.
3. 배지를 지우려면 다음 푸시가 올 때까지 기다려야 했는데, 그 푸시도 badge=1이므로 영원히 안 지워졌다.

### 해결 접근법

서버사이드와 클라이언트사이드 양쪽에서 이중으로 처리한다.

1. **서버사이드 (APNs 전송 시)**: 푸시를 보낼 때 DB에서 해당 사용자의 실제 미읽 알림 개수를 조회하여 APNs payload의 `badge` 값으로 설정한다.
2. **클라이언트사이드 (앱 포그라운드 진입 시)**: 사용자가 앱을 열면 `applicationDidBecomeActive`에서 배지를 `0`으로 초기화한다. 앱에 들어왔다는 것은 알림을 확인하겠다는 의도이므로, 배지를 즉시 제거하는 것이 자연스럽다.

### 실제 코드

```python
# backend/app/services/push_notification_service.py

from app.models.notification import Notification as NotificationModel

def _send_apns(device_token: str, payload: dict, badge_count: int = 1) -> bool:
    """APNs HTTP/2로 단일 디바이스에 푸시를 전송한다."""
    # ...
    apns_payload = {
        "aps": {
            "alert": {
                "title": payload.get("title", ""),
                "body": payload.get("body", ""),
            },
            "sound": "default",
            "badge": badge_count,  # 하드코딩 1 → 실제 미읽 개수
        },
        "url": payload.get("url", "/notifications"),
    }
    # ...

def send_push_to_user(db: Session, user_id: int, ...):
    # ...

    # iOS 배지에 표시할 미읽 알림 개수 조회
    unread_count = db.query(NotificationModel).filter(
        NotificationModel.user_id == user_id,
        NotificationModel.is_read.is_(False),
    ).count()

    # APNs 디바이스에 전송
    for sub in subscriptions:
        if sub.endpoint.startswith("apns://"):
            device_token = sub.endpoint.replace("apns://", "", 1)
            success = _send_apns(device_token, payload_dict, badge_count=unread_count)
            # ...
```

```swift
// frontend/ios/App/App/AppDelegate.swift

func applicationDidBecomeActive(_ application: UIApplication) {
    // 앱 진입 시 아이콘 배지 초기화
    application.applicationIconBadgeNumber = 0
}
```

### 주의사항/교훈

- **이중 전략의 필요성**: 서버에서 정확한 미읽 개수를 보내는 것만으로는 부족하다. 사용자가 앱을 열고 알림을 확인한 후에도 다음 푸시가 올 때까지 배지가 남아있기 때문이다. 반대로 클라이언트에서만 초기화하면, 앱을 열기 전까지 배지 숫자가 부정확하다. 양쪽을 모두 처리해야 자연스러운 UX가 완성된다.
- **`applicationDidBecomeActive` 선택 이유**: `applicationWillEnterForeground`도 사용할 수 있지만, `didBecomeActive`는 앱이 최초 실행될 때와 백그라운드에서 복귀할 때 모두 호출되므로 더 포괄적이다. 전화 수신 후 앱으로 돌아오는 경우에도 동작한다.
- **배지 개수 조회의 성능**: `Notification` 테이블에 `user_id` + `is_read` 복합 인덱스가 있으면 `COUNT` 쿼리는 매우 빠르다. 푸시 전송은 비동기로 처리되므로 1회의 추가 쿼리가 사용자 경험에 영향을 주지 않는다.
- **iOS 16+ 변경사항**: iOS 16부터 `UNUserNotificationCenter.setBadgeCount(_:)`가 권장되지만, Capacitor 앱에서는 `applicationIconBadgeNumber`가 여전히 안정적으로 동작하며, 추가 권한 요청 없이 사용 가능하다.

---

## 4. 이메일 링크에서 앱/웹 스마트 리다이렉트

### 문제 상황

이메일 인증 및 비밀번호 초기화 이메일에 포함된 링크가 웹 URL(`https://nadarm.com/verify-email?token=...`)로 직접 연결되어 있었다. 네이티브 앱을 설치한 사용자가 이 링크를 탭하면:
1. 기본 브라우저(Safari)에서 웹 페이지가 열린다.
2. 사용자는 웹에서 인증을 완료한 후 다시 앱으로 돌아와야 한다.
3. 앱에서는 인증 상태가 반영되지 않아 혼란을 겪는다.

Universal Links를 설정하면 해결되지만, AASA(Apple App Site Association) 파일 호스팅과 앱-웹 도메인 연동 설정이 복잡하다.

### 해결 접근법

중간 리다이렉트 HTML 페이지를 서버에서 동적 생성하는 패턴을 사용했다.

1. 이메일의 링크를 `/api/v1/auth/verify-email-app?token=...`으로 변경한다.
2. 이 엔드포인트는 HTML 페이지를 반환하며, JavaScript로 네이티브 앱의 URL scheme(`com.nadarm.app://verify-email?token=...`)을 먼저 시도한다.
3. 앱이 설치되어 있으면 앱이 열리고, 1.5초 내에 앱이 열리지 않으면 자동으로 웹 URL로 fallback한다.
4. 자동 fallback이 동작하지 않는 환경을 위해 수동 버튼도 함께 제공한다.

**핵심**: 이 리다이렉트 페이지는 토큰을 소비하지 않는다. 실제 인증은 앱이든 웹이든 최종 도착 페이지에서 기존 `/verify-email` 엔드포인트를 호출하여 처리한다.

### 실제 코드

```python
# backend/app/api/api_v1/endpoints/auth.py

@router.get("/verify-email-app", response_class=HTMLResponse)
def verify_email_app(token: str = Query(...)):
    """이메일 인증 - 앱/웹 스마트 리다이렉트.

    이메일 링크가 이 엔드포인트를 가리킴.
    네이티브 앱 URL scheme을 먼저 시도하고, 실패 시 웹으로 fallback.
    토큰 소비는 하지 않음 (실제 인증은 /verify-email에서 처리).
    """
    app_url = f"com.nadarm.app://verify-email?token={token}"
    web_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    return _build_smart_redirect_html(
        app_url=app_url,
        web_url=web_url,
        title="이메일 인증",
        loading_text="인증 페이지로 이동 중...",
        button_text="앱에서 인증하기",
    )


@router.get("/reset-password-app", response_class=HTMLResponse)
def reset_password_app(token: str = Query(...)):
    """비밀번호 재설정 - 앱/웹 스마트 리다이렉트."""
    app_url = f"com.nadarm.app://reset-password?token={token}"
    web_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    return _build_smart_redirect_html(
        app_url=app_url,
        web_url=web_url,
        title="비밀번호 재설정",
        loading_text="재설정 페이지로 이동 중...",
        button_text="앱에서 재설정하기",
    )
```

```python
# 스마트 리다이렉트 HTML 생성 헬퍼

def _build_smart_redirect_html(
    app_url: str,
    web_url: str,
    title: str = "나닮",
    loading_text: str = "이동 중...",
    button_text: str = "앱으로 돌아가기",
) -> HTMLResponse:
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} - 나닮</title>
<style>
body{{font-family:-apple-system,sans-serif;display:flex;justify-content:center;
align-items:center;min-height:100vh;margin:0;background:#f8f9fa;color:#333}}
.c{{text-align:center;padding:20px}}
.spinner{{width:32px;height:32px;border:3px solid #e0e0e0;border-top-color:#6366f1;
border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
a.btn{{display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;
color:#fff;border-radius:8px;text-decoration:none;font-size:15px}}
.hint{{font-size:13px;color:#888;margin-top:12px}}
</style>
</head>
<body>
<div class="c">
<div class="spinner"></div>
<p>{loading_text}</p>
<div id="fallback" style="display:none">
<a class="btn" href="{app_url}">{button_text}</a>
<p class="hint">앱이 열리지 않으면 아래 링크를 눌러주세요</p>
<a href="{web_url}" style="color:#6366f1;font-size:14px;">웹에서 열기</a>
</div>
</div>
<script>
window.location.href="{app_url}";
setTimeout(function(){{
document.getElementById("fallback").style.display="block";
window.location.href="{web_url}";
}},1500);
</script>
</body>
</html>"""
    return HTMLResponse(content=html)
```

### 주의사항/교훈

- **URL scheme vs Universal Links 비교**: Universal Links는 앱이 설치되어 있으면 브라우저를 거치지 않고 바로 앱을 여는 이상적인 방식이지만, AASA 파일 호스팅, 도메인 검증, CDN 캐시 등 설정이 복잡하다. URL scheme + timeout fallback 패턴은 서버사이드 코드만으로 구현 가능하고, 앱 미설치 시 자연스럽게 웹으로 넘어간다.
- **1.5초 timeout 근거**: iOS에서 URL scheme으로 앱을 여는 데 보통 0.5~1초가 소요된다. 1.5초면 대부분의 디바이스에서 앱 전환이 완료된다. 너무 짧으면(500ms) 앱이 열리는 중에 웹으로도 이동하여 혼란을 주고, 너무 길면(3초+) 앱이 미설치된 사용자가 빈 화면을 오래 봐야 한다.
- **토큰 소비 분리 원칙**: 리다이렉트 페이지에서는 절대 토큰을 소비하지 않는다. 이 페이지는 단순 경유지이며, 실제 인증은 앱이든 웹이든 최종 목적지에서 수행한다. 만약 리다이렉트 단계에서 토큰을 소비하면, 앱과 웹 양쪽에서 동시에 처리 시도 시 충돌이 발생한다.
- **이메일 링크 URL 변경**: `email_service.py`에서 기존 `{FRONTEND_URL}/verify-email?token=`을 `{FRONTEND_URL}/api/v1/auth/verify-email-app?token=`으로 변경했다. 이는 API 서버를 경유하는 구조이므로, 프론트엔드와 백엔드가 같은 도메인에서 서빙되거나 리버스 프록시로 연결되어 있어야 한다.

---

## 5. SMTP 이메일 전송 안정성

### 문제 상황

기존 이메일 전송 코드에 여러 취약점이 있었다.

1. **timeout 미설정**: `smtplib.SMTP(host, port)`에 timeout이 없어서, SMTP 서버가 응답하지 않으면 워커 스레드가 무한 대기 상태에 빠진다.
2. **HTML만 전송**: `MIMEText(html, "html")`만 첨부하여, 일부 보수적인 이메일 클라이언트(기업 메일, 구형 Outlook)에서 HTML 렌더링이 깨지거나 스팸으로 분류된다.
3. **포괄적 예외 처리**: `except Exception as e` 단일 핸들러로 모든 오류를 잡아서, 인증 실패인지 네트워크 문제인지 수신자 거부인지 구분할 수 없었다.
4. **중복 코드**: 인증 이메일과 비밀번호 초기화 이메일의 SMTP 전송 로직이 동일한데 각각 복사-붙여넣기되어 있었다.

### 해결 접근법

1. `smtplib.SMTP(host, port, timeout=30)` 추가하여 30초 초과 시 `TimeoutError`를 발생시킨다.
2. `MIMEMultipart("alternative")`에 `text/plain` 파트를 먼저, `text/html` 파트를 나중에 추가한다. RFC 2046에 따라 "alternative" 타입에서 마지막 파트가 우선 표시되므로, HTML 지원 클라이언트는 HTML을, 미지원 클라이언트는 plain text를 표시한다.
3. SMTP 예외를 세분화하여 각각의 원인에 맞는 로그를 남긴다.
4. 공통 로직을 `_send_email()` 헬퍼로 추출한다.

### 실제 코드

```python
# backend/app/services/email_service.py

def send_verification_email(user: User, token: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.warning("SMTP credentials not configured. Skipping verification email.")
        return False

    verification_url = f"{settings.FRONTEND_URL}/api/v1/auth/verify-email-app?token={token}"
    html_content = _build_verification_html(user.username, verification_url)
    plain_content = _build_verification_plain(user.username, verification_url)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "[나닮] 이메일 인증을 완료해주세요"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = user.email

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))  # plain 먼저
    msg.attach(MIMEText(html_content, "html", "utf-8"))    # html 나중 (우선 표시)

    return _send_email(user.email, msg, "Verification")


def _send_email(recipient: str, msg: MIMEMultipart, email_type: str) -> bool:
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, recipient, msg.as_string())
        logger.info(f"{email_type} email sent to {recipient}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed for {recipient}: {e}")
    except smtplib.SMTPConnectError as e:
        logger.error(f"SMTP connection failed for {recipient}: {e}")
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(f"SMTP recipient refused for {recipient}: {e}")
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error for {recipient}: {e}")
    except TimeoutError as e:
        logger.error(f"SMTP timeout for {recipient}: {e}")
    except Exception as e:
        logger.error(f"Unexpected email error for {recipient}: {e}")
    return False
```

```python
# text/plain 파트 생성 헬퍼

def _build_verification_plain(username: str, verification_url: str) -> str:
    return f"""안녕하세요, {username}님!

나닮에 가입해주셔서 감사합니다.
아래 링크를 클릭하여 이메일 인증을 완료해주세요.

{verification_url}

이 링크는 24시간 동안 유효합니다.
본인이 가입하지 않았다면 이 이메일을 무시해주세요.

나닮 Team"""
```

### 주의사항/교훈

- **`MIMEMultipart("alternative")` 파트 순서**: RFC 2046 명세에 따라, "alternative" MIME 타입에서 파트는 "가장 단순한 것 -> 가장 풍부한 것" 순서로 배치하며, 이메일 클라이언트는 지원 가능한 마지막(가장 풍부한) 파트를 표시한다. 따라서 `text/plain`을 먼저, `text/html`을 나중에 `attach`해야 한다.
- **timeout=30의 근거**: SMTP 서버는 보통 5초 이내에 응답하지만, 네트워크 지연이나 서버 부하 시 10~20초가 걸릴 수 있다. 30초는 충분한 여유를 두면서도 무한 대기를 방지하는 적정값이다. FastAPI의 기본 요청 timeout(60초) 이내여야 한다.
- **세분화된 예외 처리의 가치**: `SMTPAuthenticationError`는 자격 증명 만료를, `SMTPConnectError`는 네트워크/방화벽 문제를, `SMTPRecipientsRefused`는 잘못된 이메일 주소를 의미한다. 각각 대응 방법이 다르므로 로그를 구분하면 디버깅 시간이 크게 단축된다.
- **`_send_email` 헬퍼 추출**: 인증 이메일과 비밀번호 초기화 이메일은 SMTP 전송 로직이 동일하다. 헬퍼로 추출하면 timeout, 예외 처리, 로깅을 한 곳에서만 관리하면 되고, 향후 이메일 유형이 추가되어도 같은 인프라를 재사용할 수 있다.

---

## 핵심 교훈

### 1. iOS 네이티브 통합은 웹/네이티브 양쪽에서 처리해야 한다

키보드 숨김, 배지 동기화, 앱 리다이렉트 등 모든 주제에서 공통적으로, 한쪽만 처리하면 불완전한 결과를 얻는다. 키보드는 웹(`visualViewport`)과 네이티브(`Capacitor Keyboard`)를 모두 지원해야 하고, 배지는 서버(정확한 개수 전송)와 클라이언트(포그라운드 초기화)를 모두 처리해야 하며, 이메일 링크는 앱과 웹 양쪽으로의 경로를 모두 제공해야 한다.

### 2. Capacitor의 네이티브 설정이 웹뷰 동작을 변경한다

`Keyboard.resize: 'none'`처럼 Capacitor 설정 하나가 `visualViewport` 이벤트 발화 여부를 바꾼다. 네이티브 앱에서 웹뷰 기반 기능이 동작하지 않으면, Capacitor 설정이 웹뷰의 기본 동작을 오버라이드하고 있지 않은지 먼저 확인해야 한다.

### 3. data 속성 + CSS 선택자는 강력한 상태 전달 수단이다

`document.body.dataset.keyboardOpen`처럼 `data-*` 속성을 토글하고 CSS에서 `body[data-keyboard-open]`으로 선택하는 패턴은, JavaScript 상태를 CSS에 전달하는 가장 단순하고 성능 좋은 방법이다. React 컴포넌트 트리를 관통하는 props drilling이나 전역 상태 없이도, DOM 트리 어디서든 반응할 수 있다.

### 4. URL scheme + timeout fallback은 실용적인 딥링킹 전략이다

Universal Links / App Links의 완전한 구현이 부담스러울 때, URL scheme 시도 후 1.5초 timeout으로 웹 fallback하는 패턴은 구현이 단순하면서도 대부분의 사용 사례를 커버한다. 단, 토큰이나 1회성 자원의 소비는 반드시 최종 목적지에서만 수행해야 한다.

### 5. 이메일은 항상 방어적으로 전송하라

SMTP는 외부 서비스 의존이므로 실패 가능성이 항상 존재한다. timeout 설정, HTML+Plain 멀티파트, 세분화된 예외 처리, 공통 헬퍼 추출은 "이메일 전송" 기능의 기본 체크리스트로 삼아야 한다. 특히 `timeout` 미설정은 프로덕션에서 워커 스레드 고갈로 이어질 수 있는 치명적 문제이다.

### 6. iOS 배지는 "설정 후 잊기"가 아니다

APNs badge는 한번 설정하면 명시적으로 변경하기 전까지 유지된다. 서버에서 보낸 값이 그대로 아이콘에 남으므로, 알림을 읽은 후 배지를 지우는 로직을 반드시 클라이언트에 구현해야 한다. `applicationDidBecomeActive`는 앱 최초 실행, 백그라운드 복귀, 전화 후 복귀 등 모든 "앱 진입" 시나리오를 커버하는 가장 적합한 위치이다.
