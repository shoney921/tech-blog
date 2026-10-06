---
title: "FCM으로 앱에 푸시 알림 보내기 — 토큰 한 줄에서 '서버는 내용을 모르는 알림'까지"
description: 파이어베이스 클라우드 메시징(FCM)이 뭔지, 토큰 등록부터 알림이 폰에 뜨기까지의 흐름을 처음부터 따라가고, 맥릴레이에서 데이터 메시지·암호화된 봉투·알림 채널·알림 단추로 한 단계 더 써 본 기록.
date: 2026-10-05T10:00:00
---

# FCM으로 앱에 푸시 알림 보내기 — 토큰 한 줄에서 '서버는 내용을 모르는 알림'까지

맥릴레이라는 걸 만들고 있다. 폰에서 맥의 클로드코드나 커서에 일을 시키는 앱이다. 일은 맥에서 돌고, 폰은 화면만 본다.

이런 앱은 알림이 핵심이다. 일을 시켜 놓고 폰을 주머니에 넣었는데, 끝났을 때 아무 말이 없으면 앱을 계속 열어 봐야 한다. 그러면 굳이 폰으로 시키는 의미가 반쯤 사라진다.

웹 버전은 Web Push로 알림을 보내고 있었다. 그런데 안드로이드 앱(Capacitor로 감싼 것)을 만들고 나서 알았다. 앱의 WebView 안에는 서비스 워커가 없다. 그래서 Web Push가 아예 안 돈다. 앱은 다른 길, FCM을 타야 했다.

이 글 앞쪽은 FCM이 뭔지, 알림 하나가 폰에 뜨기까지 무슨 일이 일어나는지를 처음 보는 사람 기준으로 적는다. 뒤쪽은 "그냥 알림 보내기"를 넘어서 맥릴레이에서 실제로 해 본 것들이다.

## FCM은 뭘 해 주나

FCM(Firebase Cloud Messaging)은 구글이 운영하는 우체국이라고 생각하면 편하다.

내 서버가 폰에 직접 말을 걸 수 있으면 좋겠지만, 그게 안 된다. 폰은 와이파이와 LTE를 오가고, 잠들고, 배터리 아끼려고 앱을 얼린다. 앱마다 서버와 연결을 하나씩 붙잡고 있으면 배터리가 버티질 못한다. 그래서 안드로이드는 구글 쪽과 연결 **하나**만 유지하고, 모든 앱의 알림이 그 연결을 같이 탄다.

등장인물은 셋이다.

- 앱 — FCM에게 "나한테 오는 우편은 이 주소로" 하고 등록 토큰을 받는다
- 내 서버 — 그 토큰을 보관하고, 보낼 일이 생기면 FCM에게 "이 토큰으로 이거 보내 줘"라고 부탁한다
- FCM — 받아서 폰까지 배달하고, 폰에서 잠든 앱을 깨운다

결국 핵심은 등록 토큰이다. 토큰은 "이 폰의 이 앱"을 가리키는 주소다. 비밀번호 같은 건 아니지만, 그렇다고 아무 데나 흘려도 되는 값도 아니다.

## 알림 하나가 뜨기까지

순서대로 따라가 보자.

### 1. 앱에 파이어베이스를 붙인다

파이어베이스 콘솔에서 프로젝트를 만들고 안드로이드 앱을 등록하면 `google-services.json`이 나온다. 이걸 앱 빌드에 넣어야 FCM이 동작한다.

여기서 한 번 크게 데였다. 전에 만든 다른 앱에서, `google-services.json` 없이 빌드한 APK가 알림 등록(`register()`)을 부르자 **앱이 그냥 죽었다.**

그래서 맥릴레이는 빌드할 때 "이 APK에 파이어베이스가 들어갔나"를 작은 파일(`native.json`의 `fcm` 값)에 적어 두고, 앱은 그걸 먼저 읽는다. 못 읽으면 없는 것으로 친다.

```js
// Firebase 없이 빌드한 APK 인가. 못 읽으면 없는 것으로 친다 —
// 틀려서 단추가 안 뜨는 쪽이 틀려서 앱이 죽는 쪽보다 낫다.
function fcmBuilt() {
  return cfg ||= fetch(new URL('../native.json', import.meta.url), { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(j => j?.fcm === true)
    .catch(() => false);
}
```

코드 주석이 결론을 다 말해 준다. 단추가 안 뜨는 쪽이 앱이 죽는 쪽보다 낫다.

### 2. 허락을 묻는다

안드로이드 13부터는 알림을 띄우려면 사용자 허락이 필요하다. 이건 아무 때나 묻지 않는다. 맥릴레이는 사용자가 "알림 켜기"를 눌렀을 때만 `requestPermissions()`를 부른다. 앱을 열 때는 지금 허락 상태만 조용히 확인한다.

### 3. 토큰을 받는다

Capacitor의 푸시 플러그인은 `register()`가 토큰을 바로 돌려주지 않는다. 이벤트로 준다. 혹시 `await pn.register()`의 반환값을 기다리고 있다면 영원히 안 온다.

그래서 리스너를 달고, 답이 오거나 20초가 지나면 걷는 작은 함수로 감쌌다.

```js
function awaitToken(pn) {
  return new Promise((resolve, reject) => {
    // ... 끝나면 리스너를 걷는 finish() 생략
    const t = setTimeout(() => finish(reject)(new Error('알림 등록이 응답하지 않아요')), 20000);
    handles.push(pn.addListener('registration', d => finish(resolve)(d?.value || null)));
    handles.push(pn.addListener('registrationError', e => finish(reject)(new Error(e?.error))));
    pn.register();
  });
}
```

### 4. 토큰을 서버에 올린다

받은 토큰을 서버에 올린다. 맥릴레이는 `{ kind: 'fcm', token, labels }` 모양으로 올린다. `kind`는 웹 구독(Web Push)과 앱 구독(FCM)을 가르는 표시다. 한 사람이 폰 앱과 PC 브라우저를 같이 쓰니까 두 종류가 서버에 같이 산다. `labels`는 뒤에서 다시 나온다 — 꽤 중요하다.

토큰은 바뀔 수 있다. 앱을 다시 깔거나, 데이터를 지우거나, FCM이 갈아 끼우기도 한다. 그래서 앱을 열 때마다 다시 올린다(`sync`).

### 5. 서버가 FCM에게 부탁한다

요즘 FCM은 HTTP v1 API를 쓴다. 인증은 서비스 계정으로 한다. 서비스 계정 JSON 안의 개인키로 JWT를 서명하고, 그걸 구글 OAuth에 내밀어 한 시간짜리 액세스 토큰과 바꾼다.

맥릴레이 서버는 Cloudflare Worker라 구글 SDK를 안 쓰고 Web Crypto로 직접 서명했다(RS256). 액세스 토큰은 한 시간짜리라 인스턴스 안에 들고 있다가, 만료 1분 전까지는 다시 받지 않는다.

서비스 계정 JSON은 당연히 저장소에 넣지 않는다. Worker의 secret으로 넣는다. 이건 정말 몇 번을 말해도 모자라다.

보내는 요청은 대략 이렇다.

```js
const body = {
  message: {
    token: sub.token,
    android: { priority: 'HIGH', collapse_key: topic, ttl: `${ttl}s` },
    data: { t: which, sid: String(payload?.sid || ''), title: label.title, body: label.body }
  }
};
await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
  method: 'POST',
  headers: { authorization: 'Bearer ' + access, 'content-type': 'application/json' },
  body: JSON.stringify(body)
});
```

몇 개만 짚으면:

- `collapse_key` — 아직 배달 못 한 알림이 쌓이면 하나로 접는다. 밤새 쌓인 스무 개가 아침에 스무 번 울리지 않게.
- `ttl` — 맥릴레이는 기본 하루(86400초).
- 응답이 404거나 `UNREGISTERED`면 그 토큰은 죽은 거다. 앱을 지웠거나 토큰이 갈린 기기. 서버는 그 구독을 지운다. 이걸 안 하면 죽은 주소로 계속 보낸다.

그리고 눈치챈 사람도 있을 텐데, `notification` 필드가 없다. `data`만 있다. 이게 이 글 뒷부분의 출발점이다.

### 6. 폰이 받아서 띄운다

FCM 메시지를 받는 쪽은 `FirebaseMessagingService`를 상속한 클래스다. 맥릴레이에서는 `DoneMessagingService`. `onMessageReceived`에서 데이터를 꺼내 알림을 직접 만든다.

```java
@Override
public void onMessageReceived(RemoteMessage m) {
    Map<String, String> d = m.getData();
    String kind = /* d.get("t") 로 done · ask · todo · aide · ready 를 고른다 */;
    String title = d.get("title");
    String body = d.get("body");
    show(this, kind, sid, title, body, ...);
}
```

토큰이 갈렸을 때 불리는 `onNewToken`은 Capacitor 플러그인의 정적 메서드로 그대로 넘긴다. 플러그인도 자기 서비스를 갖고 있는데, 매니페스트의 intent-filter 우선순위를 높여서 메시지는 이쪽이 받게 해 뒀다.

여기까지가 "FCM으로 알림 보내기"의 기본이다. 사실 이 정도면 대부분의 앱은 충분하다.

## notification 메시지와 data 메시지

FCM 메시지에는 크게 두 종류가 있다.

| | notification 메시지 | data 메시지 |
|---|---|---|
| 앱이 꺼져 있을 때 | 시스템이 실린 문구를 그대로 띄운다 | 앱의 `onMessageReceived`가 깨어난다 |
| 문구를 누가 정하나 | 서버 | 앱 |
| 손이 덜 가는 쪽 | 이쪽 | 알림을 직접 만들어야 한다 |

notification 메시지는 편하다. 서버가 제목과 본문을 실어 보내면 끝이다. 대신 앱이 꺼져 있으면 앱 코드가 끼어들 틈이 없다. 서버가 보낸 문구가 그대로 뜬다.

그 말은, 알림에 뭐라도 의미 있는 내용을 띄우려면 **서버가 그 내용을 알아야 한다**는 뜻이다.

맥릴레이에서는 이게 곤란했다.

## 서버는 내용을 모른다

맥릴레이에서 폰과 맥이 주고받는 말은 전부 봉투에 담겨 간다. 비밀번호에서 뽑은 AES 열쇠로 잠근 봉투다. 중간의 서버(Cloudflare Worker)는 봉투를 전달만 하고 열지 못한다. 대화 내용을 서버가 모르게 하려고 처음부터 그렇게 짰다.

그런데 notification 메시지로 "빌드가 끝났어요, 테스트 3개 실패" 같은 걸 띄우려면 서버가 그 문장을 알아야 한다. 그러면 지금까지 지킨 게 다 무너진다.

그래서 서버는 데이터 메시지만, 그것도 이 네 가지만 보낸다.

```
{ t, sid, title, body }
```

- `t` — 무슨 일인가. `done`(끝남) · `ask`(질문) · `todo`(사람 차례로 끝남) · `aide`(비서가 먼저 알림) · `ready`(사용량 한도가 풀림)
- `sid` — 어느 대화인가. 서버가 원래 아는 값이다
- `title`, `body` — **폰이 미리 올려 둔 고정 문구**

앞에서 토큰을 올릴 때 같이 보낸 `labels`가 이거다. "새 답이 있어요", "답을 기다려요", "이어서 할 일이 있어요" 같은 문구를 폰이 처음부터 서버에 맡겨 두고, 서버는 `t`에 맞는 걸 골라 그대로 실을 뿐이다. 서버 입장에서 대화 내용은 한 글자도 이 길을 타지 않는다.

여담인데, 문구를 서버 코드에 박지 않고 폰이 올리게 한 건 꽤 마음에 든다. 문구를 고치고 싶으면 앱만 고치면 된다. 서버에도 기본값은 있지만 폰이 올린 게 우선이다.

## 고정 문구로 먼저 띄우고, 봉투를 풀어 한 줄로 갈아 끼운다

고정 문구만 뜨면 알림이 심심하다. "새 답이 있어요"만 보고는 열어 보기 전까지 아무것도 모른다.

그래서 `DoneMessagingService`는 알림을 두 번 띄운다.

**첫 번째**는 받자마자 고정 문구로 띄운다. 여기에 대화 제목 정도는 붙인다. 제목은 폰이 원래 아는 것이다. 앱이 `sid → 제목` 표를 네이티브 쪽(`Notify.titles`)에 넘겨 두고, 알림은 거기서 찾는다. 서버가 보낸 게 아니다.

```
"로그인 화면 고치기" — 새 답이 있어요
```

**두 번째**로, 열쇠가 있으면 그 대화의 최근 줄(최대 8개)을 서버에서 받아 와서 폰 안에서 봉투를 푼다. 맥이 보낸 줄 중에 맞는 종류를 찾아 한 줄을 골라내고, 같은 알림을 그 한 줄로 갈아 끼운다.

```java
show(this, kind, sid, title, body, null, null, null, null);   // 1. 고정 문구로 먼저
if ("ready".equals(kind) || sid.isEmpty()) return;

JSONObject opened = peek(this, kind, sid);   // 2. 최근 줄을 받아 봉투를 연다
if (opened == null) return;                  //    못 열면 고정 문구로 남는다
String line = Envelope.line(opened);
if (line.isEmpty()) return;
show(this, kind, sid, head, line, body, go, qid, say);   // 3. 같은 자리에 한 줄로
```

같은 대화의 같은 종류는 tag가 같아서 앞 알림을 덮어쓴다. 그리고 `setOnlyAlertOnce(true)`를 걸어 둬서, 갈아 끼울 때 소리가 한 번 더 나지는 않는다.

왜 굳이 먼저 띄우나 싶을 수 있다. 내 생각엔 네트워크 때문이다. 봉투를 받아 오는 건 HTTP 요청이고, 지하철에서는 9초 타임아웃까지 다 기다릴 수도 있다. 그동안 알림이 아예 없는 것보다는 고정 문구라도 먼저 뜨는 게 낫다. 실패하면 그냥 고정 문구로 남는다. 망가지는 게 아니라 덜 친절해질 뿐이다.

"한 줄"을 고르는 규칙도 나름 고민했다.

- 맥이 판정할 때 남긴 `note`가 있으면 그것
- 없으면 답의 첫 문장. 단 "알겠습니다." "네." 같은 맞장구는 건너뛴다
- 파일을 고쳤으면 앞에 "파일 3개 고쳤어요."를 붙인다
- 오류로 끝났으면 "오류: …"
- 질문이면 첫 질문 문장

이 규칙은 웹(`assets/notice.js`)과 자바(`Envelope.java`)에 똑같이 두 벌 있다. 웹 화면도 같은 한 줄을 쓰니까. 한쪽을 고치면 다른 쪽도 맞춰야 하는데, 지금은 주석으로 "여기를 바꾸면 거기도 맞춘다"라고 적어 둔 게 전부다. 이건 언젠가 사고가 날 것 같다.

### 열쇠는 어디에 두나

봉투를 풀려면 네이티브 코드가 열쇠를 가져야 한다. 알림은 앱이 꺼져 있을 때도 오니까, 자바스크립트 쪽이 들고 있는 열쇠로는 안 된다.

맥릴레이는 연결을 기억해 둔 폰에서만, 자바스크립트가 이미 만들어 둔 AES 열쇠 32바이트와 서버 토큰·주소를 네이티브 `Vault`에 건넨다. `Vault`는 그걸 안드로이드 Keystore의 키로 한 번 더 잠가서 저장한다. 비밀번호 자체는 넘어가지 않는다. 사용자가 "잠그기"를 누르면 이 열쇠를 지우고, 그 뒤로 알림은 고정 문구까지만 뜬다.

## 잠금 화면에는 고정 문구만

한 줄로 갈아 끼울 때, 알림을 두 겹으로 만든다.

```java
if (lockBody != null) {
    b.setVisibility(NotificationCompat.VISIBILITY_PRIVATE);
    b.setPublicVersion(new NotificationCompat.Builder(c, channel)
        .setContentTitle("macrelay")
        .setContentText(lockBody)   // 처음 띄웠던 고정 문구
        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        .build());
}
```

`VISIBILITY_PRIVATE`인 알림은 잠금 화면에서 본문 대신 `setPublicVersion`으로 준 "공개용" 알림을 보여 준다. 그 공개용에 고정 문구를 넣었다. 그러니까 잠금 화면에는 "macrelay — 새 답이 있어요"만 보이고, 봉투에서 꺼낸 한 줄은 잠금을 풀어야 보인다. 알림 채널 자체도 잠금 화면 표시를 `VISIBILITY_PRIVATE`으로 만든다.

이유는 단순하다고 본다. 봉투에서 꺼낸 한 줄은 대화 내용의 평문이다. 서버에도 안 보여 주려고 그 고생을 했는데, 책상 위에 엎어 둔 폰 잠금 화면에 띄우면 지나가는 아무나 읽는다. 앞뒤가 안 맞는다.

## 알림 종류를 셋으로 나눴다

안드로이드 8부터 알림은 채널에 속한다. 사용자는 폰 설정에서 채널마다 소리·진동·표시를 따로 끌 수 있다. 채널이 하나뿐이면 사용자가 고를 수 있는 건 "전부 켜기"와 "전부 끄기"뿐이다.

지금은 셋이다.

| 채널 이름 (폰 설정에 보이는 이름) | 무엇이 오나 | 중요도 |
|---|---|---|
| 내가 할 일이 있을 때 | 질문(`ask`), 사람 차례로 끝난 답(`todo`) | 높음 — 화면 위로 튀어나온다 |
| 일이 끝났을 때 | 끝난 답(`done`), 사용량 한도가 풀림(`ready`) | 높음 |
| 비서가 먼저 알릴 때 | 맥의 비서가 먼저 꺼내는 이야기(`aide`) | 기본 — 소리는 나지만 튀어나오지 않는다 |

나눈 기준은 "누가 기다리고 있나"다. 질문은 내가 답해야 맥이 움직인다. 끝난 답은 맥이 다 했다는 소식이다. 비서 알림은 내가 부탁한 일의 답이 아니라 비서가 먼저 꺼낸 이야기라서, 한 단계 낮게 뒀다.

그래서 "일이 끝났을 때"는 조용히 두고 "내가 할 일이 있을 때"만 울리게 할 수 있다.

하나 알아 둘 것. 이미 있는 채널에 `createNotificationChannel`을 다시 부르면 이름만 맞춰지고 소리·진동은 사용자가 고른 대로 남는다. 앱이 중요도를 나중에 바꿔도 이미 깐 폰에는 안 먹는다는 뜻이기도 하다. 처음 만들 때 신중해야 한다.

## 알림 단추가 곧 보내는 글

이게 제일 재미있었던 부분이다.

맥의 답이 "배포할까요?"처럼 한마디를 기다리며 끝나는 경우가 많다. 그럴 때 맥은 답에 `next: 'say'`와 함께 그 한마디(`say`, 예를 들면 "배포해 줘")를 실어 보낸다. 봉투 안에 들어 있으니 서버는 모른다.

폰은 알림을 갈아 끼울 때 그 한마디를 꺼내서 **단추 글자로** 단다. 누르면 그 글자가 그대로 맥에게 간다. 앱을 열지 않고.

```java
static NotificationCompat.Action sayAction(Context ctx, String sid, String say) {
    Intent i = new Intent(ctx, ReplyReceiver.class).setAction(ACTION_SAY)
        .putExtra("sid", sid).putExtra("say", say);
    PendingIntent pi = PendingIntent.getBroadcast(ctx, ..., i, FLAG_UPDATE_CURRENT | FLAG_IMMUTABLE);
    return new NotificationCompat.Action.Builder(0, say, pi)   // 단추 글자 = 보낼 글
        .setAuthenticationRequired(true)                       // 잠금을 푼 뒤에만
        .build();
}
```

단추를 누르면 `ReplyReceiver`가 `{ kind: 'prompt', sid, text }`를 폰 안에서 봉투로 잠가 방에 넣는다. 화면에서 보내기를 누른 것과 같은 모양이다. 모드나 모델은 안 싣는다. 맥이 그 대화가 쓰던 것으로 이어 간다. 보내지면 알림을 걷고, 못 보내면 "보내지 못했어요. 앱을 열어 보내 주세요"로 바꿔 띄운다.

단추를 다는 조건은 꽤 깐깐하게 걸었다. 오류 없이 끝난 답이어야 하고, 한마디가 24자 이하에 한 줄이어야 한다. 단추에 긴 글이 잘려 보이면 뭘 보내는지 모르고 누르게 되니까.

`setAuthenticationRequired(true)`가 중요하다. 이 단추는 맥에게 일을 시킨다. 잠금 화면에서 아무나 눌러 "배포해 줘"를 보낼 수 있으면 안 된다.

질문 알림에도 비슷한 단추가 있다. 예/아니오로 끝나는 질문이면 "이대로 진행"이 달린다. 다만 비서가 세운 계획은 알림에서 한 번에 승인하지 않게 막아 뒀다. 내가 부탁하지 않은 일을 알림 단추 하나로 시작시키는 건 좀 무섭다.

## 폰이 보고 있으면 서버가 미룬다

마지막은 반대 방향의 고민이다. 알림을 안 보내는 것.

폰으로 대화를 보고 있는데 답이 오면, 화면에 이미 답이 뜬다. 거기에 알림까지 울리면 시끄럽다. 그래서 두 겹으로 막는다.

**서버 쪽.** 폰은 웹소켓으로 서버의 방(Durable Object)에 붙어 있고, 화면이 보이는지 숨었는지를 `vis` 메시지로 알린다. 맥의 답이 오면 서버는 먼저 "지금 이 방에 보고 있는 폰이 있나"를 본다. 15분 넘게 소식이 없는 연결은 믿지 않는다.

```js
if (watching) {
  // 바로 보내지 않고 20초 뒤 알람을 건다
  await this.ctx.storage.put('deferred', { seq, kind, sid });
  await this.ctx.storage.setAlarm(Date.now() + DEFER);   // DEFER = 20초
  return;
}
```

20초 뒤 알람이 울리면, 그 사이 폰이 그 줄을 읽었는지(읽음 표시)를 확인한다. 읽었으면 안 보낸다. 아직 안 읽었으면 그때 보낸다. 보고 있는 줄 알았는데 실은 폰을 내려놓은 경우를 이렇게 받아 낸다.

**폰 쪽.** 서버가 보냈더라도, 알림을 받는 순간 앱이 화면에 떠 있으면 안 띄운다. `MainActivity`의 `onResume`/`onPause`에서 플래그를 맞춰 두고 `DoneMessagingService`가 그걸 본다. 한도가 풀렸다는 `ready`만 예외다.

플래그를 플러그인이 아니라 `MainActivity`에 둔 데도 이유가 있다. 코드 주석에 따르면 플러그인이 늦게 뜨면 첫 `onResume`을 놓친다. 이런 건 직접 겪기 전엔 절대 모른다.

20초가 적당한지는 솔직히 잘 모르겠다. 실제로 며칠 써 보면서 맞춰 갈 숫자라고 생각한다.

## 아직 고민 중인 것

에뮬레이터에서는 진짜 FCM으로 끝남·질문 알림이 오고, 누르면 그 대화로 가고, 보고 있을 땐 안 울리는 것까지 확인했다. 그런데 실기기에서 아직 못 본 게 남아 있다.

- 한마디 단추가 잠금 화면에서 정말 잠금 해제를 요구하는지
- 알림 종류 셋이 폰 설정에 의도한 이름으로 보이는지
- 비서 알림의 머리("비서")와 한 줄이 실제로 어떻게 보이는지

컴파일과 로컬 테스트로는 여기까지가 한계다. 그리고 `onMessageReceived` 안에서 네트워크를 타는 구조가 배터리 절약 모드나 오래된 폰에서 늘 제때 끝날지도 확신이 없다. 실패하면 고정 문구로 남게 짜 두긴 했지만.

돌아보면 FCM 자체는 금방 붙는다. 토큰 받고, 서버에 올리고, HTTP v1로 보내면 끝이다. 시간이 오래 걸린 건 그다음이었다. 무엇을 실을지, 어디에 보여 줄지, 언제 안 보낼지. 혹시 지금 notification 메시지로 알림을 보내고 있다면, data 메시지로 바꿨을 때 앱이 할 수 있는 일이 생각보다 많다는 것 정도는 기억해 두면 좋겠다.

## 참고자료

- [FCM 메시지 유형 (notification vs data)](https://firebase.google.com/docs/cloud-messaging/concept-options)
- [FCM HTTP v1 API로 이전하기](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [안드로이드 알림 채널 만들기 및 관리](https://developer.android.com/develop/ui/views/notifications/channels)
- [Capacitor Push Notifications 플러그인](https://capacitorjs.com/docs/apis/push-notifications)
