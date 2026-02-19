---
title: "DearMe 백엔드 — Apple 로그인만 405가 뜨는데, 카카오랑 구글은 멀쩡하다"
date: 2026-02-19T10:00:00
---

# DearMe 백엔드 — Apple 로그인만 405가 뜨는데, 카카오랑 구글은 멀쩡하다

DearMe에 소셜 로그인을 붙이면서 카카오, 구글, Apple 세 가지를 지원하기로 했다. 카카오와 구글은 순탄하게 붙었다. OAuth 흐름 자체가 비슷하니까, 하나 해봤으면 나머지는 복붙에 가까웠다. 그런데 Apple 로그인을 추가한 순간부터 이상한 일이 벌어졌다.

Apple로 로그인하면 **405 Not Allowed**가 뜬다.

백엔드 로그를 보면 더 혼란스러웠다. 계정 연동까지 성공한 것으로 찍힌다.

```
INFO: OAuth account linked: apple -> user 1
INFO: "POST /api/v1/auth/oauth/apple/callback" 307 Temporary Redirect
```

유저도 만들어졌고, 토큰 교환도 끝났다. 그런데 사용자 화면에는 405. 처음에는 Nginx 설정을 잘못 건드렸나 싶어서 한참 뒤졌다. 결론부터 말하면 Nginx 문제가 맞긴 한데, 근본 원인은 전혀 다른 곳에 있었다.

---

## 삽질의 시작

에러를 처음 봤을 때 의심한 순서는 이랬다.

1. Apple Developer Console 설정이 잘못됐나?
2. 콜백 URL이 틀렸나?
3. Nginx에서 뭔가 막고 있나?

1번과 2번은 빠르게 배제했다. 백엔드 로그에 "OAuth account linked"가 찍히는 걸 보면 콜백까지는 정상적으로 도달한 거다. 인가 코드를 받아서 토큰 교환하고 유저를 생성하는 것까지 전부 성공. 그 **이후** 단계에서 뭔가 터지고 있었다.

3번을 파고들면서 결국 답을 찾았는데, 원인을 알고 나니 "아, 이건 모르면 절대 못 찾겠다" 싶었다.

---

## Apple은 POST로 콜백한다

OAuth 소셜 로그인 흐름을 간단히 정리하면 이렇다. 사용자가 제공자(카카오/구글/Apple) 페이지에서 인증을 마치면, 제공자가 우리 서버의 콜백 URL로 인가 코드를 보내준다.

여기서 카카오와 구글은 **GET**으로 보낸다. URL 쿼리 파라미터에 코드를 실어서.

```
GET /api/v1/auth/oauth/kakao/callback?code=xxx&state=yyy
```

그런데 Apple은 다르다. Apple은 `response_mode=form_post`를 사용하기 때문에 콜백이 **POST**로 온다.

```
POST /api/v1/auth/oauth/apple/callback
Content-Type: application/x-www-form-urlencoded
Body: code=xxx&state=yyy
```

솔직히 이 차이를 처음에는 대수롭지 않게 봤다. GET이든 POST든 서버에서 잘 받으면 되는 거 아닌가? 실제로 백엔드에서는 잘 받았다. 문제는 그 다음이다.

---

## FastAPI RedirectResponse의 함정

콜백을 받은 백엔드는 인가 코드로 토큰을 교환하고, 유저 처리를 한 뒤, JWT를 생성해서 프론트엔드 페이지로 리다이렉트한다. 코드는 이랬다.

```python
return RedirectResponse(
    url=f"{frontend_url}/auth/callback?access_token={token}"
)
```

깔끔해 보인다. 근데 여기에 함정이 있다. **FastAPI의 `RedirectResponse`는 기본 status_code가 307이다.**

이걸 몰랐다. 정확히는, 알고 있었어도 이게 문제가 될 거라고 생각하지 못했다.

---

## 307과 302, 한 끗 차이가 만든 대참사

HTTP 리다이렉트 상태 코드에 302와 307이 있는데, 이 둘의 차이가 핵심이다.

| 상태 코드 | 리다이렉트 시 HTTP 메서드 |
|-----------|-------------------------|
| **302** Found | **GET으로 변경** |
| **307** Temporary Redirect | **원래 메서드 유지** |

307은 "원래 요청의 HTTP 메서드를 그대로 유지한 채 리다이렉트하라"는 뜻이다. REST API 설계에서는 이게 올바른 동작이다. POST 요청이 리다이렉트됐다고 갑자기 GET으로 바뀌면 안 되니까. FastAPI가 307을 기본값으로 쓰는 데는 합리적인 이유가 있는 셈이다.

그런데 OAuth 콜백 시나리오에서는 이게 독이 된다.

Apple이 POST로 콜백 → FastAPI가 307 리다이렉트 → 브라우저가 프론트엔드 URL로 **POST** 요청을 보냄.

카카오/구글은? GET으로 콜백 → FastAPI가 307 리다이렉트 → 브라우저가 GET 유지 → 아무 문제 없음.

GET에서 GET으로의 307은 눈에 안 띄는 거다. 내가 카카오/구글 구현할 때 `status_code`를 명시하지 않고도 잘 돌아갔으니까 "이대로 괜찮구나" 하고 넘어간 것이다. Apple이 POST를 쓴다는 걸 안 순간에도 "서버에서 받기만 하면 되지" 했지, 리다이렉트 이후까지는 생각이 미치지 못했다.

---

## Nginx가 POST를 거부하는 이유

React SPA를 서빙하는 Nginx 설정은 보통 이렇게 생겼다.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

`try_files`는 요청된 경로에 해당하는 정적 파일을 찾아서 반환하는 디렉티브다. `/auth/callback`이라는 경로로 요청이 오면, 실제로는 그런 파일이 없으니 폴백으로 `index.html`을 반환한다. SPA 라우팅의 핵심 설정이다.

근데 `try_files`는 **GET 요청만 처리**할 수 있다. POST 요청이 정적 파일 경로로 들어오면? **405 Not Allowed**.

전체 흐름을 이어서 보면 이렇다.

```
[Apple] ── POST /api/v1/auth/oauth/apple/callback ──▶ [Nginx] ──▶ [FastAPI]
                                                                       │
                                                          토큰 교환, 유저 처리 ✅
                                                          RedirectResponse (307)
                                                                       │
[브라우저] ◀── 307 Temporary Redirect ─────────────────────────────────┘
    │
    ├── 307이니까 POST 메서드 유지
    ├── POST /auth/callback?access_token=xxx  ──▶ [Nginx]
    │                                                 │
    │                                        try_files + POST = 405 ❌
    ▼
[사용자] 405 Not Allowed 🤯
```

백엔드 로직은 전부 성공했는데, 마지막 리다이렉트에서 브라우저가 POST를 들고 Nginx한테 갔다가 거절당한 거다.

---

## 수정은 한 줄이었다

```python
return RedirectResponse(
    url=f"{frontend_url}/auth/callback?access_token={token}",
    status_code=302,
)
```

`status_code=302`를 추가하면 끝이다. 302를 받은 브라우저는 리다이렉트할 때 메서드를 GET으로 바꾼다. 그러면 Nginx의 `try_files`가 정상적으로 `index.html`을 반환하고, React 라우터가 `/auth/callback`을 처리한다.

실제로는 에러 케이스와 프로필 완성 페이지 리다이렉트까지 전부 수정했다.

```python
async def _handle_oauth_callback(provider, code, state, error, db, apple_user_name=None):
    frontend_url = settings.FRONTEND_URL

    if error:
        return RedirectResponse(
            url=f"{frontend_url}/login?oauth_error={error}",
            status_code=302,
        )

    # ... 토큰 교환, 유저 처리 ...

    if result.get("needs_profile"):
        return RedirectResponse(
            url=f"{frontend_url}/auth/complete-profile?temp_token={temp_token}",
            status_code=302,
        )
    else:
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback?access_token={access_token}",
            status_code=302,
        )
```

카카오/구글은 GET 콜백이라 302든 307이든 결과가 같지만, 어차피 명시적으로 적어두는 게 낫다. 다음에 POST 콜백을 쓰는 다른 제공자를 추가할 수도 있고, 코드만 봤을 때 의도가 드러나니까.

---

## 왜 이 버그가 찾기 어려웠나

돌이켜보면 이 버그가 교활했던 이유가 몇 가지 있다.

**백엔드는 완벽하게 성공한다.** 로그에 에러가 하나도 안 찍힌다. 계정 연동 성공, 리다이렉트 성공. 백엔드 입장에서는 할 일을 다 한 거다. 문제는 그 이후 브라우저와 Nginx 사이에서 벌어지는 일이니까.

**카카오/구글이 정상이다.** 2개는 되고 1개만 안 되니까, 자연스럽게 "Apple 쪽 설정이 잘못됐겠지"라는 방향으로 디버깅하게 된다. 실제로는 세 제공자 모두 같은 코드를 타는데, GET/POST 차이 때문에 하나만 터진 거다.

**307이 기본값이라는 걸 의식하지 못했다.** `RedirectResponse`를 쓸 때 status_code를 명시하지 않으면 307이라는 건, 한번 겪어보지 않으면 잘 모르는 사실이다. Django의 `HttpResponseRedirect`는 기본이 302이고, Express의 `res.redirect()`도 기본이 302다. FastAPI만 다르다.

---

## 얻은 교훈

OAuth 콜백에서 프론트엔드로 리다이렉트할 때는 반드시 302(또는 303)를 사용해야 한다. 이건 Apple 뿐만 아니라 앞으로 POST 콜백을 쓰는 어떤 제공자에도 해당되는 규칙이다.

그리고 프레임워크의 기본값을 맹신하면 안 된다는 것도 새삼 느꼈다. FastAPI의 307 기본값은 REST API 관점에서는 올바르지만, 브라우저 리다이렉트 시나리오에서는 적합하지 않다. "기본값이니까 괜찮겠지" 하고 넘어간 게 결국 삽질로 돌아왔다.

솔직히 이 글을 쓰면서도 "이걸 왜 바로 못 찾았지?" 싶긴 하다. 알고 나면 너무 당연한 건데, 모를 때는 정말 안 보인다. 디버깅이라는 게 원래 그렇긴 하지만.
