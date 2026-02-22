---
title: "OpenAI `images.edit`에서 `gpt-image-1`이 거부될 때: 파일 전달 방식으로 해결한 기록"
date: 2026-02-22T14:20:00
---

# OpenAI `images.edit`에서 `gpt-image-1`이 거부될 때: 파일 전달 방식으로 해결한 기록

같은 모델인데 왜 어떤 엔드포인트에서는 되고, 어떤 엔드포인트에서는 안 될까. 이번에 `images.generate`는 정상인데 `images.edit`만 계속 400을 뱉는 상황을 만났고, 결론적으로는 "모델 문제가 아니라 파일 전달 방식 문제"였다.

처음에는 계정 티어나 SDK 버전을 의심했다. 솔직히 나도 처음엔 그쪽이 더 그럴듯해 보였다. 그런데 파고들수록 원인은 전혀 다른 데 있었다.

---

## 증상은 단순했다

`images.edit` 호출 시 아래 에러가 반복됐다.

```text
Error code: 400
"Invalid value: 'gpt-image-1'. Value must be 'dall-e-2'."
```

이 메시지 때문에 모델 자체가 edit 미지원처럼 보이는데, 실제로는 그렇지 않았다. 같은 시점에 `images.generate(model="gpt-image-1")`은 정상 동작했고, 심지어 REST API로 직접 보낼 때 `images.edit`도 성공했다.

---

## 삽질 포인트: "파일 객체면 되겠지"가 아니었다

처음에 실패했던 패턴은 이런 쪽이었다.

```python
with open("avatar.webp", "rb") as f:
    client.images.edit(image=f, model="gpt-image-1", prompt="...")

buf = io.BytesIO(webp_data)
client.images.edit(image=buf, model="gpt-image-1", prompt="...")
```

대충 보면 문제 없어 보인다. 그런데 이 방식은 서버 쪽에서 파일 메타데이터를 충분히 해석하지 못하는 경우가 있고, 그때 검증 경로가 `dall-e-2` 전용 쪽으로 폴백되면서 `gpt-image-1`이 거부됐다.

정확히 내부 구현을 다 아는 건 아니지만, 내 경험상 여기서 핵심은 "바이너리만 보내는 것"보다 "파일명 + MIME 타입까지 명시하는 것"이었다.

---

## 실제로 통과한 패턴

가장 안정적이었던 건 `(filename, data, content_type)` 튜플 전달이다.

```python
img = Image.open(io.BytesIO(prev_image_data))
png_buf = io.BytesIO()
img.save(png_buf, format="PNG")
png_buf.seek(0)

response = client.images.edit(
    image=("avatar.png", png_buf, "image/png"),
    prompt="기존 캐릭터 스타일은 유지하고 표정만 미소로 바꿔줘",
    model="gpt-image-1",
    size="1024x1024",
    quality="low",
)
```

WebP 원본이어도 튜플로 명시하면 동작했다.

```python
client.images.edit(
    image=("avatar.webp", io.BytesIO(webp_data), "image/webp"),
    prompt="...",
    model="gpt-image-1",
)
```

---

## 왜 PNG 변환을 기본값으로 잡았나

운영 관점에서는 "가끔 성공"보다 "항상 예측 가능"이 훨씬 중요했다. WebP도 튜플이면 통과했지만, 파이프라인 전체에서 변수를 줄이려고 최종 입력을 PNG로 통일했다.

이 선택 덕분에 재현성이 좋아졌고, 장애 대응할 때도 확인 포인트가 간단해졌다.

:::tip
`images.edit`에 참조 이미지를 넣을 때는 파일 객체를 그대로 넘기기보다, `(filename, bytes_or_stream, content_type)`을 명시적으로 전달하는 습관이 안전했다.
:::

---

## 트러블슈팅 순서 (이번에 효과 있었던 것만)

- `images.generate`와 `images.edit`를 분리해서 실패 지점을 먼저 확정
- SDK 업그레이드로 해결 가능한지 확인 (`openai` 1.109.1에서도 동일)
- 계정/권한 이슈인지 점검
- REST 직접 호출로 SDK 레이어 문제인지 교차 검증
- 마지막으로 파일 전달 포맷을 바꿔가며 A/B 테스트

이 순서가 좋았던 이유는, "의심 후보를 넓게 잡고 빨리 제거"할 수 있었기 때문이다.

---

## 비용도 조금 줄었다

이전에는 `generate + reproduction prompt`로 우회하느라 호출 수가 더 많았다. edit 경로를 안정화한 뒤에는 진화 1회 기준 호출이 줄어서 비용도 소폭 내려갔다(대략 `$0.017 -> $0.015` 수준).

큰 차이는 아니지만, 일 단위로 쌓이면 무시하기 어렵다.

---

## 지금도 남아 있는 고민

여기까지는 Python SDK 기준 검증 결과다. 다른 런타임/SDK에서도 같은 형태로 100% 재현되는지는 아직 더 확인이 필요하다. 그래도 한 가지는 분명했다.

**모델 에러 메시지를 곧이곧대로 믿기보다, 업로드 포맷부터 의심하는 편이 빠르다.**

비슷한 에러를 만나면, 먼저 파일 전달 구조를 바꿔보자. 내 경우엔 그게 정답에 가장 가까운 지름길이었다.
