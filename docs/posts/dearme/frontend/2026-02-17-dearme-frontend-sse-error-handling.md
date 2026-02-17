---
title: "DearMe 프론트엔드 — SSE로 AI 대화 스트리밍하기, 그리고 에러를 한국어로"
date: 2026-02-17T15:00:00
---

# DearMe 프론트엔드 — SSE로 AI 대화 스트리밍하기, 그리고 에러를 한국어로

DearMe에서 AI 페르소나와 대화하는 기능을 만들 때, 처음에는 단순한 POST 요청으로 구현했다. 메시지를 보내면 서버가 LLM 응답을 생성해서 통째로 돌려주는 방식. 작동은 했다. 근데 문제는 **체감 속도**였다. LLM이 응답을 만드는 데 3~5초 정도 걸리는데, 그 동안 화면에는 아무것도 안 나온다. 로딩 스피너만 빙빙 도는 걸 보고 있으면 "이거 죽은 거 아냐?" 하는 느낌이 든다.

ChatGPT를 써본 사람이라면 알겠지만, 글자가 한 글자씩 타닥타닥 나타나는 경험은 생각보다 중요하다. 실제로 응답 완료까지 걸리는 시간은 비슷한데, 사용자가 느끼는 대기감이 완전히 다르다. 그래서 스트리밍을 도입하기로 했다.

---

## SSE를 선택한 이유

스트리밍 하면 보통 WebSocket이 먼저 떠오른다. 근데 AI 대화의 통신 패턴을 생각해보면, 사용자가 메시지를 보내는 건 일반 HTTP POST면 충분하다. 서버가 응답을 실시간으로 흘려보내는 것만 스트리밍이 필요하다. 즉, 단방향이다.

WebSocket은 양방향 통신을 위한 프로토콜이다. 채팅방에서 여러 명이 동시에 메시지를 주고받는 상황이라면 WebSocket이 맞다. 하지만 "사용자 1명이 메시지 보내기 -> 서버가 응답 스트리밍"이라는 패턴에서는 SSE(Server-Sent Events)가 훨씬 간단하다.

실무적으로 비교하면 이런 차이가 있다.

| | SSE | WebSocket |
|------|-----|-----------|
| 방향 | 서버 -> 클라이언트 | 양방향 |
| 프로토콜 | 그냥 HTTP | WS 별도 프로토콜 |
| Nginx 설정 | `proxy_buffering off` 한 줄 | upgrade 헤더 처리 필요 |
| 자동 재연결 | 브라우저가 알아서 해줌 | 직접 구현해야 함 |

내 경우 1인 개발이라 인프라를 최대한 단순하게 유지하고 싶었다. WebSocket을 쓰면 Nginx에서 프로토콜 업그레이드 설정을 해야 하고, 연결 관리 로직도 별도로 짜야 한다. SSE는 그냥 HTTP 요청이니까 기존 인프라를 거의 건드리지 않아도 된다. 적어도 그때는 그렇게 생각했다. (나중에 Nginx에서 삽질하게 될 줄은 몰랐지만.)

---

## fetch API로 스트리밍 구현하기

DearMe의 다른 API 호출은 전부 Axios를 쓴다. 근데 SSE 스트리밍만큼은 fetch API를 써야 했다. 이유가 있다.

Axios는 응답을 받으면 `response.data`에 전체 데이터를 한꺼번에 담아서 돌려준다. 스트리밍 응답을 청크 단위로 읽으려면 `ReadableStream`에 접근해야 하는데, 이건 fetch API의 `response.body.getReader()`로만 가능하다. Axios가 나쁜 게 아니라, 설계 목적이 다른 거다.

실제 구현 코드는 이렇다.

```typescript
// services/chatService.ts
async sendMessageStream(
  chatId: number,
  content: string,
  onChunk: (chunk: string) => void,
  onUserMessage: (msg: ChatMessage) => void,
  onDone: (msg: ChatMessage) => void,
  onError: (error: string) => void
): Promise<void> {
  const response = await fetch(
    `${apiUrl}/api/v1/chats/${chatId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  )

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        switch (data.type) {
          case 'user_message': onUserMessage(data.message); break
          case 'chunk':        onChunk(data.content); break
          case 'done':         onDone(data.message); break
          case 'error':        onError(data.content); break
        }
      }
    }
  }
}
```

콜백 기반으로 설계한 이유는, 스트리밍이라는 특성상 데이터가 비동기로 계속 들어오기 때문이다. Promise 하나로 끝나는 게 아니라, 청크가 올 때마다 UI를 업데이트해야 한다. `onChunk`가 호출될 때마다 채팅 메시지에 글자를 하나씩 이어붙이는 식이다.

### 왜 버퍼가 필요한가

이 코드에서 `buffer`가 하는 역할이 꽤 중요하다. SSE 데이터는 `data: {...}\n` 형식으로 오는데, 네트워크에서 데이터는 TCP 패킷 단위로 도착한다. 하나의 `reader.read()` 호출에서 메시지가 깔끔하게 끊어져 올 거라는 보장이 없다.

실제로 이런 일이 벌어진다.

```
// 첫 번째 read()
"data: {\"type\":\"chunk\",\"content\":\"안\"}\ndata: {\"type\":\"ch"

// 두 번째 read()
"unk\",\"content\":\"녕\"}\n"
```

첫 번째 read에서 두 번째 메시지가 중간에 잘려서 왔다. 이걸 그대로 `JSON.parse`하면 당연히 터진다. 그래서 `split('\n')`으로 줄을 나눈 뒤, 마지막 불완전한 줄은 `buffer`에 보관하고 다음 read에서 이어붙여서 완성된 줄만 파싱한다. `lines.pop()`이 하는 일이 바로 이거다.

처음에 이 버퍼 처리 없이 구현했다가, 간헐적으로 JSON 파싱 에러가 터지는 걸 보고 한참 헤맸다. 로컬에서는 거의 재현이 안 되는데 프로덕션에서만 가끔 터져서 디버깅이 까다로웠다. 네트워크 환경에 따라 패킷이 어디서 잘리느냐가 달라지니까.

### data: 프로토콜 파싱

백엔드에서 보내는 SSE 이벤트는 네 가지 타입이 있다.

- `user_message`: 사용자가 보낸 메시지의 서버 확인. DB에 저장된 메시지 객체가 돌아온다.
- `chunk`: AI 응답의 조각. 한 글자에서 한 단어 정도 단위로 온다.
- `done`: 스트리밍 완료. 최종 완성된 AI 메시지 객체가 함께 온다.
- `error`: 스트리밍 도중 에러 발생.

`user_message`가 별도 이벤트로 오는 이유가 있다. 사용자가 메시지를 보내면, 일단 UI에 낙관적으로 메시지를 표시하고 서버로 보낸다. 서버가 `user_message` 이벤트를 보내면 그때 실제 DB에 저장된 메시지(ID 포함)로 교체한다. 이렇게 하면 사용자 입장에서는 메시지 전송이 즉시 반영되는 것처럼 보인다.

---

## 그리고 Nginx 삽질

솔직히 이 글에서 가장 하고 싶은 얘기가 이 부분이다.

로컬 개발 환경에서는 모든 게 완벽했다. Vite 개발 서버에서 직접 백엔드로 요청을 보내니까, 글자가 한 글자씩 타닥타닥 나타났다. "오, 됐다!" 하고 프로덕션에 배포했다.

그런데 프로덕션에서 테스트해보니 **글자가 하나씩 안 나오고 전체 응답이 한꺼번에 뿅 하고 나타났다.** 스트리밍이 아니라 일반 API 호출처럼 동작하는 거다. 백엔드 로그를 보면 분명히 청크를 하나씩 보내고 있는데, 프론트엔드에서는 다 모아져서 한꺼번에 도착했다.

한참 삽질한 끝에 원인을 찾았다. **Nginx의 `proxy_buffering`**.

Nginx는 기본적으로 백엔드 응답을 내부 버퍼에 모았다가 한번에 클라이언트에 전달한다. 일반적인 API 응답에서는 이게 성능 최적화다. 백엔드가 느리게 데이터를 보내도 Nginx가 버퍼에 다 모은 다음 클라이언트에 빠르게 전달하니까. 근데 SSE에서는 이 버퍼링이 치명적이다. 실시간으로 흘려보내야 하는 데이터를 중간에서 붙잡고 있으니까.

해결은 의외로 간단했다.

```nginx
location /api/ {
    proxy_pass http://backend:8000;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
    proxy_read_timeout 120s;
}
```

`proxy_buffering off` 한 줄이 핵심이다. 이걸 추가하고 나니 프로덕션에서도 글자가 하나씩 나타났다. `proxy_read_timeout 120s`는 AI 응답이 길어질 때를 대비한 건데, LLM이 긴 응답을 생성하면 2분 가까이 걸릴 수도 있어서 넉넉하게 잡았다.

:::tip
개발 환경에서는 Vite 개발 서버가 직접 백엔드와 통신하지만, 프로덕션에서는 Nginx가 중간에 끼어든다. 스트리밍이 "개발에서는 되는데 프로덕션에서 안 되면" Nginx 버퍼링을 의심해보자.
:::

이 경험에서 배운 건, 개발 환경과 프로덕션 환경의 차이를 항상 의식해야 한다는 거다. 특히 프로덕션에서만 존재하는 계층 -- Nginx, CDN, 로드밸런서 같은 것들 -- 이 예상 못한 방식으로 동작할 수 있다. 개발환경에서 잘 되니까 당연히 프로덕션에서도 되겠지, 하는 생각이 가장 위험하다.

---

## 에러를 한국어로 번역하기

SSE 스트리밍 얘기에서 좀 벗어나지만, DearMe 프론트엔드의 에러 처리 패턴도 같이 다루고 싶다. SSE 스트리밍의 `error` 이벤트 처리와도 연결되는 부분이기도 하고.

### 왜 백엔드는 영어, 프론트는 한국어인가

DearMe의 백엔드 에러 메시지는 전부 영어다. 처음부터 의도한 설계인데, 이유가 몇 가지 있다.

하나는 로그 추적이다. 서버 로그를 grep할 때 영어가 편하다. "Diary already exists"를 검색하는 게 "이미 일기가 존재합니다"를 검색하는 것보다 낫다. 뭔가 인코딩 문제가 끼어들 여지도 줄어든다.

또 하나는 관심사 분리다. 사용자에게 보여줄 메시지를 어떻게 표현할지는 프론트엔드의 책임이다. 나중에 영어 UI를 지원하게 되더라도 백엔드는 건드릴 필요가 없다. 물론 1인 개발 프로젝트에서 다국어 지원까지 갈 일이 있을지는 솔직히 모르겠지만, 구조적으로 깔끔한 건 확실하다.

### 번역 맵

가장 단순한 방법은 정적 매핑이다. 백엔드 에러 메시지와 한국어 메시지를 1:1로 대응시킨다.

```typescript
// lib/error.ts
const translations: Record<string, string> = {
  'Incorrect email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email already registered': '이미 등록된 이메일입니다.',
  'Diary already exists for this date': '해당 날짜에 이미 일기가 존재합니다.',
  'Cannot write diary for future dates': '미래 날짜에는 일기를 작성할 수 없습니다.',
  // ... 40개 이상
}
```

40개 이상의 매핑이 있다. 처음에는 "이거 너무 수동 아닌가?" 싶었는데, 실제로 운영해보니 에러 메시지가 그렇게 폭발적으로 늘어나지는 않는다. 새 API 엔드포인트를 추가할 때 에러 케이스를 같이 정의하고, 그때 번역도 같이 추가하면 관리할 만하다.

### 동적 에러 처리

문제는 에러 메시지에 변수가 들어가는 경우다. "Username can be changed after 23 days"처럼 숫자가 매번 바뀌면 정적 매핑으로는 안 된다. 이런 건 정규식 매칭으로 처리한다.

```typescript
const usernameMatch = detail.match(
  /^Username can be changed after (\d+) days$/
)
if (usernameMatch) {
  return `닉네임은 ${usernameMatch[1]}일 후에 변경할 수 있습니다.`
}
```

정규식 매칭이 정적 맵에 없는 에러를 잡아주는 보조 역할을 한다. 물론 이 방식도 패턴이 늘어나면 복잡해질 수 있는데, 현재 DearMe 규모에서는 동적 패턴이 서너 개 정도라 충분히 감당 가능하다.

### HTTP 상태 코드 기본 메시지

번역 맵에도 없고 정규식에도 안 걸리면? 그래도 사용자에게 영어 에러를 그대로 보여주면 안 된다. 마지막 방어선으로 HTTP 상태 코드별 기본 한국어 메시지를 둔다.

```typescript
switch (status) {
  case 400: return translateErrorDetail(detail) || '잘못된 요청입니다.'
  case 401: return '인증에 실패했습니다. 다시 로그인해주세요.'
  case 403: return translateErrorDetail(detail) || '접근 권한이 없습니다.'
  case 404: return '요청한 리소스를 찾을 수 없습니다.'
  case 409: return '이미 존재하는 데이터입니다.'
  case 422: /* Validation 에러 배열 처리 */
  case 429: return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  case 500: return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
```

400이나 403은 `translateErrorDetail`을 먼저 시도하고, 번역이 없으면 기본 메시지를 쓴다. 401은 번역 없이 바로 고정 메시지를 쓰는데, 어차피 인증 실패 메시지는 뻔하기 때문이다.

그리고 네트워크 에러는 아예 별도로 잡는다.

```typescript
if (!error.response) {
  return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
}
```

서버가 응답 자체를 안 보내는 경우 -- 서버 다운, 네트워크 끊김 등 -- 는 `error.response`가 undefined다. 이 케이스를 놓치면 "Cannot read property 'status' of undefined" 같은 런타임 에러가 터진다.

### 실제 사용은 이렇게

이 번역 로직을 `getApiErrorMessage`라는 함수 하나로 감싸서, 프로젝트 전체에서 일관되게 쓴다.

```typescript
import { getApiErrorMessage } from '@/lib/error'

const mutation = useMutation({
  mutationFn: diaryService.create,
  onError: (err) => {
    const message = getApiErrorMessage(err)
    toast.error(message)
  },
})
```

어디서 에러가 나든 `getApiErrorMessage`만 거치면 한국어 메시지가 나온다. 개별 컴포넌트에서 에러 번역을 신경 쓸 필요가 없다는 게 이 패턴의 핵심이다.

---

## 돌아보며

SSE 스트리밍 자체는 구현이 어렵지 않았다. fetch API로 ReadableStream 읽고, 버퍼 처리하고, SSE 프로토콜 파싱하는 것까지는 공식 문서 보면 금방 따라할 수 있다. 진짜 시간을 잡아먹은 건 Nginx 버퍼링 같은 인프라 레벨 이슈였다. 코드는 맞는데 환경이 다르니까 동작이 달라지는 류의 문제.

에러 번역 패턴은 지금까지 꽤 잘 동작하고 있다. 새 에러 메시지가 추가될 때 번역을 깜빡할 수는 있는데, 그래도 상태 코드 기본 메시지가 있으니까 사용자가 완전히 이해 불가능한 영어 에러를 보게 되는 일은 없다. 완벽하지는 않지만, 이 정도면 괜찮다고 생각한다.

아직 고민되는 부분도 있다. SSE 연결이 중간에 끊기는 경우의 재시도 로직이라든가, 에러 번역 맵이 더 커지면 JSON 파일로 분리할지 말지 같은 것들. 하지만 지금은 현재 구조로 충분히 돌아가고 있으니, 실제로 문제가 생길 때 개선하는 게 맞다고 본다.
