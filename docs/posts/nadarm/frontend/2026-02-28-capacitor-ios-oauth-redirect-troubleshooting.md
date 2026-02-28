---
title: "Capacitor iOS 앱에서 OAuth 로그인 후 앱으로 안 돌아올 때"
date: 2026-02-28T14:00:00
---

# Capacitor iOS 앱에서 OAuth 로그인 후 앱으로 안 돌아올 때

나닮은 Capacitor로 iOS 앱을 띄우고 있다. 카카오/구글/애플 소셜 로그인을 넣었는데, SFSafariViewController에서 로그인은 잘 되는데 **앱으로 돌아오지 않고** 그냥 웹 페이지가 로드되는 문제가 생겼다. 삽질 끝에 원인을 세 가지로 좁혀서 고쳤다. 같은 삽질 하는 사람한테 도움이 되길 바라며 정리해 둔다.

환경은 이랬다. Capacitor 8.1.0 + iOS, `iosScheme: 'https'`로 WKWebView origin이 `https://localhost`, OAuth는 `Browser.open()`으로 SFSafariViewController 띄운 뒤 카카오/구글/애플 로그인 → 백엔드 콜백으로 마무리하는 흐름이다.

---

## 기대했던 흐름 vs 실제

원래 생각한 플로우는 이거다. 사용자가 "카카오로 계속하기" 누름 → `Browser.open(OAuth URL)` → SFSafariViewController 열림 → 소셜 로그인 → 백엔드가 커스텀 URL scheme으로 리다이렉트 → iOS가 scheme 인식해서 앱으로 전환 → `appUrlOpen` 이벤트 → 로그인 완료.

근데 실제로는 로그인까지 하고 백엔드 콜백까지 가는데, 거기서 `https://nadarm.com/auth/callback` 같은 웹 URL로 리다이렉트되어서 SFSafariViewController **안에서** 그 페이지만 뜨고 앱으로는 안 돌아오는 상태였다. "로그인은 됐는데 앱이 안 열린다"는 식의 증상.

---

## 원인 1: `platform=ios`를 안 넘기고 있었음

백엔드에는 이미 네이티브/웹 분기 로직이 있었다. `platform=ios`가 오면 state에 플랫폼을 넣어두고, 콜백에서 커스텀 URL scheme으로 보내주는 식. 근데 프론트에서 그 파라미터를 아예 안 넘기고 있어서, 백엔드는 항상 웹용 콜백 URL로 리다이렉트하고 있었다.

수정은 단순하다. 네이티브일 때만 쿼리에 `platform=ios` 붙여서 `Browser.open()`으로 넘기면 된다.

```typescript
// frontend/src/components/auth/SocialLoginButtons.tsx
if (isNative()) {
  url += '?platform=ios'
  await Browser.open({ url, presentationStyle: 'popover' })
}
```

이걸로 백엔드가 "아, iOS 네이티브구나" 하고 커스텀 scheme으로 보내주게 만들 수 있다. 그런데 이걸로도 앱으로 안 돌아왔다.

---

## 원인 2: HTTP 302 리다이렉트는 커스텀 scheme에서 안 먹힘

`platform=ios`를 넘겨서 백엔드가 `com.nadarm.app://auth/callback?access_token=...` 같은 URL로 302 리다이렉트를 보내도, SFSafariViewController 쪽에서는 **아무 일도 안 일어났다**. 찾아보니 이건 iOS 쪽 의도된 동작이었다.

**SFSafariViewController(와 WKWebView)는 HTTP 302 응답의 Location 헤더가 커스텀 URL scheme이면 무시한다.** 앱으로 넘어가는 건 사용자 제스처나 JavaScript의 `window.location.href` 할당 같은 걸 통해서만 허용된다고 한다.

그래서 백엔드에서 302 대신 **HTML 한 장 뿌리고, 그 안에서 JavaScript로 `window.location.href = scheme URL`** 하는 방식으로 바꿨다. 모바일 OAuth에서 많이 쓰는 패턴이다.

```python
from fastapi.responses import HTMLResponse

def _build_native_redirect_html(scheme_url: str) -> HTMLResponse:
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<p>앱으로 돌아가는 중...</p>
<div id="fallback" style="display:none">
  <a href="{scheme_url}">앱으로 돌아가기</a>
</div>
<script>
window.location.href = "{scheme_url}";
setTimeout(function(){{
  document.getElementById("fallback").style.display = "block";
}}, 1500);
</script>
</body>
</html>"""
    return HTMLResponse(content=html)
```

JS로 scheme을 열고, 1.5초 뒤에 수동 폴백 링크를 보여주는 식이다. 이렇게 하니까 드디어 앱으로 전환이 됐다. 그런데 앱 안에서는 로그인이 완료된 걸 인식 못 하는 문제가 남아 있었다.

---

## 원인 3: `new URL()`이 커스텀 scheme을 이상하게 파싱함

`appUrlOpen`으로 `com.nadarm.app://auth/callback?access_token=TOKEN` 같은 URL이 넘어온다. 이걸 그대로 `new URL(url)`에 넣으면:

```javascript
const parsedUrl = new URL("com.nadarm.app://auth/callback?access_token=TOKEN")
console.log(parsedUrl.hostname)  // "auth"     ← hostname으로 들어감
console.log(parsedUrl.pathname)  // "/callback" ← /auth/callback이 아니라 /callback만
```

RFC 3986 기준으로 `//` 뒤가 authority(host)로 해석되니까, `auth`가 hostname이 되고 pathname은 `/callback`만 남는다. React Router에서 `/auth/callback` 라우트를 쓰고 있으면 매칭이 안 된다.

그래서 커스텀 scheme인 경우에는 `new URL()`을 쓰지 않고, scheme 뒤 문자열만 잘라서 path로 쓰도록 바꿨다.

```typescript
// frontend/src/App.tsx
CapApp.addListener('appUrlOpen', ({ url }) => {
  let path: string

  if (url.startsWith('com.nadarm.app://')) {
    const afterScheme = url.substring('com.nadarm.app://'.length)
    path = '/' + afterScheme
  } else {
    const parsedUrl = new URL(url)
    path = parsedUrl.pathname + parsedUrl.search
  }

  Browser.close().catch(() => {})
  navigate(path, { replace: true })
})
```

이렇게 하니까 OAuth 콜백 라우트까지 제대로 타고 들어가서 로그인 완료 처리가 됐다.

---

## 보너스: CapacitorHttp 안 켜서 API도 안 됐던 이야기

OAuth만의 문제는 아니었는데, 이번에 같이 확인하다 보니 일반 이메일/비밀번호 로그인도 iOS 앱에서 안 되는 걸 발견했다. 원인은 Capacitor 8에서 **CapacitorHttp를 쓰지 않으면** HTTP 요청이 WKWebView의 XHR로 나가는데, WKWebView origin이 `https://localhost`라서 `https://nadarm.com` API 호출이 CORS에 걸리는 거였다.

해결은 설정 한 줄이다.

```typescript
// frontend/capacitor.config.ts
plugins: {
  CapacitorHttp: {
    enabled: true,  // 네이티브 NSURLSession으로 라우팅 → CORS 우회
  },
}
```

---

## 정리

최종적으로 OAuth 흐름은 이렇게 고정됐다. (1) 사용자가 소셜 로그인 버튼 탭 → (2) `Browser.open( authorize URL + ?platform=ios )` → (3) SFSafariViewController에서 소셜 로그인 → (4) 백엔드 콜백에서 state로 platform=ios 확인 → (5) 302 대신 HTMLResponse로 JS 리다이렉트 → (6) `window.location.href = com.nadarm.app://auth/callback?...` → (7) iOS가 scheme 인식해서 앱 전환 → (8) `appUrlOpen`에서 URL 받아서 scheme 부분 직접 파싱 → (9) `Browser.close()` 후 `/auth/callback`으로 navigate → (10) 콜백 페이지에서 토큰 처리.

수정한 파일만 간단히 나열하면:

- **SocialLoginButtons.tsx** — `?platform=ios` 추가
- **auth.py (백엔드)** — 302 대신 HTML+JS 리다이렉트
- **App.tsx** — 커스텀 URL scheme 수동 파싱
- **capacitor.config.ts** — `CapacitorHttp: { enabled: true }`
- **Info.plist** — `CFBundleURLTypes`에 `com.nadarm.app` 등록 (이건 이미 되어 있었을 수도 있다)

핵심만 다시 쓰면, **SFSafariViewController에서는 302 + 커스텀 scheme 조합이 통하지 않으니 HTML+JS 리다이렉트를 써야 하고**, **`new URL()`은 커스텀 scheme을 제대로 안 다루니까 scheme 구간은 직접 잘라서 path로 쓰는 게 낫고**, **Capacitor 8에서는 CapacitorHttp를 켜두는 게 CORS 문제 예방에 도움이 된다** 정도다. 모바일 OAuth 디버깅할 때는 "URL 넘기기 → 인증 → 콜백 → 리다이렉트 → URL 파싱 → 라우팅" 단계를 하나씩 끊어서 확인하는 게 빠르다.
