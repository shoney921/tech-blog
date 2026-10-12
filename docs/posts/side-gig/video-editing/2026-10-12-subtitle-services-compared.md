---
title: "자막·전사 서비스 고르기 — 2026년 10월에 확인한 가격과 제약"
date: 2026-10-12T20:20:00
description: Vrew, CapCut, MacWhisper·Aiko, 클로바노트·다글로, Premiere 내장 기능, 클라우드 전사 API를 한국어, 가격, 업로드 여부, 약관으로 비교했다. 고객 영상은 로컬로 처리하고, 편의가 필요할 때 Vrew를 쓰고, CapCut은 고객 영상에 쓰지 않는 쪽을 추천한다.
---

# 자막·전사 서비스 고르기 — 2026년 10월에 확인한 가격과 제약

자막 도구를 고를 때 사람들은 보통 정확도부터 묻는다. 그런데 부업으로 남의 영상을 받아 쓰는 입장이라면 질문 순서가 바뀐다.

1. 이 영상을 **밖으로 올려도 되나?** 고객이 허락했나
2. 결과를 **SRT로 받을 수 있나?** Final Cut에 넣어야 하니까
3. 그다음이 한국어 정확도와 가격이다

이 글의 가격과 기능은 전부 2026-10-12에 공식 페이지에서 확인한 것이다. 공식 페이지에서 확인하지 못한 건 따로 표시했다. **어떤 서비스도 직접 결제하거나 영상을 올려서 테스트하지 않았다.** 정확도를 비교하고 싶다면 [5편의 비교 표](./2026-10-12-hands-on-whisper-srt-fcpxml#test-table)를 같은 샘플로 채워 보면 된다.

## 먼저 결론

- **기본값: 로컬 전사.** whisper.cpp(무료)나 Aiko($24 1회 구매), MacWhisper 같은 맥 앱. 영상이 내 맥을 떠나지 않는다.
- **편의가 필요하면 Vrew.** 한국어 자막 편집 화면이 편하다. 무료 플랜도 있다. 다만 클라우드로 올라가므로 고객 동의를 받는다.
- **고객 영상에는 CapCut을 쓰지 않는다.** 약관의 콘텐츠 라이선스 범위가 넓다.
- **API는 대량 작업이 생겼을 때.** 분당 몇 원 수준이지만 결제 수단, 키 관리, 데이터 정책을 따져야 한다.

## 서비스별로

### 로컬에서 도는 것

**whisper.cpp** — MIT 라이선스, 무료. 맥에서는 Metal GPU를 쓴다. `-osrt`, `-ovtt`로 SRT·VTT를 바로 뽑는다([GitHub](https://github.com/ggml-org/whisper.cpp), v1.9.5, 2026-10-06). 화면이 없는 명령줄 도구라는 게 단점이다. [5편](./2026-10-12-hands-on-whisper-srt-fcpxml)에서 내 맥으로 직접 돌려 봤다.

**Aiko** — **$24 1회 구매**(예전에는 무료였다). 맥에서 Whisper large v2로 기기 안에서 처리한다. SRT·JSON·CSV로 내보낼 수 있고, 화자 구분은 **없다**고 페이지에 적혀 있다([sindresorhus.com/aiko](https://sindresorhus.com/aiko)).

**MacWhisper** — 로컬 처리. 무료판은 작은 모델만 쓸 수 있고, 유료판에는 큰 모델, 화자 인식, SRT·VTT 내보내기가 있다고 한다. 가격은 공식 판매 페이지가 열리지 않았다. 제3자 페이지에는 €59~64 1회 구매로 나와 있다. 확인 못 함.

**Captionator for Final Cut** — App Store $19.99. 기기 안에서 Whisper를 돌리고 Final Cut 타이틀로 넣어 준다([App Store](https://apps.apple.com/us/app/captionator-for-final-cut/id1627843786?mt=12)). 한국어 품질은 확인하지 않았다.

**Subtitle Edit** — MIT, 무료. v5부터 맥(macOS 12 이상)에서도 돈다. Whisper와 Qwen3-ASR 전사, 하드 자막 OCR, 넷플릭스 규칙 검사기가 들어 있다([공식 사이트](https://subtitleedit.github.io/subtitleedit/), v5.2.0, 2026-09-10). 자막 **검수** 도구로 쓸 만해 보인다. 직접 써 보지는 않았다.

### 클라우드 앱

**Vrew(브루)** — 한국 회사가 만든 자막 중심 편집기. 2026-04-22부터 크레딧 하나로 통합됐다. 월 크레딧은 무료 200, Light 2,000, Standard 10,000, Business 12,000이다. 음성 분석 1분에 1크레딧이 든다. 무료 플랜은 다른 데 크레딧을 안 쓰면 월 200분쯤 전사할 수 있다는 뜻이다([Vrew 공지, 2026-04-22](https://docs.channel.io/vrew-kr/ko/articles/%EA%B3%B5%EC%A7%80-2026422-%ED%86%B5%ED%95%A9-%ED%81%AC%EB%A0%88%EB%94%A7-%EB%B0%A9%EC%8B%9D%EC%9C%BC%EB%A1%9C-%EB%B3%80%EA%B2%BD%EB%90%A9%EB%8B%88%EB%8B%A4-58dfc5fd)).

- 요금표 페이지는 금액이 스크립트로 그려져서 원화 가격을 읽지 못했다. 2025-11-26에 가격을 올렸다는 공지는 있다.
- 요금표 페이지에는 "업로드한 콘텐츠를 AI 학습에 쓰지 않는다"고 적혀 있다([Vrew 요금](https://vrew.ai/ko/payment/pricepolicy)).
- 무료 플랜 워터마크 조건은 제3자 글에만 있어서 확인하지 못했다.

**CapCut** — 한국 요금표 기준 Pro 월 25,000원([capcut.com/pricing](https://www.capcut.com/pricing)). 문제는 약관이다. 2026-04-15에 갱신된 약관에도 사용자 콘텐츠에 대해 "비독점적이고, 로열티가 없고, 양도·재허락 가능하며, 영구적인 전 세계 라이선스"를 회사에 준다는 문장이 있다. 수정과 2차 저작물 작성도 그 범위에 들어간다([CapCut 이용약관](https://www.capcut.com/clause/terms-of-service)). 2025년 6월에 논란이 됐을 때 CapCut은 "소유권을 주장한 적 없다"고 해명했다([CapCut 해명](https://www.capcut.com/resource/about-capcut-terms-of-service)).

내 영상이라면 판단은 각자 할 일이다. 하지만 **남의 영상을 이 약관에 태우는 건** 고객 입장에서 반가울 리 없다. 그래서 고객 영상에는 쓰지 않는 쪽을 추천한다.

**네이버 클로바노트** — 공식 사이트가 열리지 않았다. 제3자 정리로는 무료 월 300분(데이터 활용에 동의하면 600분), 1회 최대 180분, 오디오 파일만 받는다고 한다. 회의 기록용으로 만든 서비스라서 SRT 자막 납품에는 맞지 않아 보인다(추정).

**다글로** — 무료 월 1,000크레딧(약 4시간), Pro 월 11,900원([다글로 요금](https://daglo.ai/pricing)). SRT 내보내기와 화자 구분 여부는 확인하지 못했다.

**Descript, Submagic** — 영어권 크리에이터가 많이 쓴다. Descript 무료 플랜은 월 60분에 720p 워터마크가 붙고, Final Cut으로 타임라인을 내보낼 수 있다([Descript 요금](https://www.descript.com/pricing)). Submagic은 월 $19부터인데 가장 싼 플랜이 영상 길이를 2분으로 제한한다([Submagic 요금](https://www.submagic.co/pricing)). 둘 다 한국어 품질은 확인하지 못했다.

### 편집기 내장

- **Final Cut Pro**: 한국어 자동 자막이 **안 된다**(미국 영어만). SRT 가져오기는 된다. → [2편](./2026-10-12-final-cut-vs-premiere)
- **Premiere Pro**: 한국어 Speech to Text가 된다. 오프라인 언어팩도 있다. 구독료 월 30,800원에 포함된다.
- **DaVinci Resolve Studio**: $295 1회 구매. 오디오로 자막을 만드는 기능이 Studio 전용이고 한국어를 지원한다는 건 제3자 가이드에만 있다. 공식 확인은 못 했다.

### 클라우드 API (개발자용)

직접 파이프라인을 짤 때 쓴다. 2026-10-12 공식 요금표 기준이다. 호출해 보지는 않았다.

| API | 분당 가격 | 메모 |
|---|---|---|
| OpenAI `whisper-1` | $0.006 | SRT·VTT 바로 출력, 파일당 25MB |
| OpenAI `gpt-4o-transcribe-diarize` | $0.006 | 화자 구분, 출력은 JSON |
| Deepgram Nova-3 | $0.0043 (단일 언어) | 한국어 지원, 녹음 파일 화자 구분 포함 |
| AWS Transcribe | $0.006 (1단계, US-East) | 첫 12개월 월 60분 무료 |
| ElevenLabs Scribe v2 | 시간당 $0.22 | 한국어는 자체 등급표에서 "Good"(WER 10~20%) |

출처: [OpenAI 요금](https://developers.openai.com/api/docs/pricing), [OpenAI 음성 인식 가이드](https://developers.openai.com/api/docs/guides/speech-to-text), [Deepgram 요금](https://deepgram.com/pricing), [AWS Transcribe 요금](https://aws.amazon.com/transcribe/pricing/), [ElevenLabs 요금](https://elevenlabs.io/pricing/api).

- 네이버 CLOVA Speech와 리턴제로(RTZR) API는 한국어에 강하다고 스스로 말한다. 하지만 공개 요금을 찾지 못했다. 리턴제로는 600분 무료 제공이 있다([RTZR 문서](https://developers.rtzr.ai/docs/)).
- 데이터 정책은 회사마다 다르다. OpenAI API는 옵트인하지 않으면 학습에 쓰지 않는다. AWS Transcribe는 기본으로 서비스 개선에 쓸 수 있고, 조직 정책으로 거부해야 한다. AssemblyAI 무료 사용자는 거부할 수 없다. 고객 영상을 올리기 전에 꼭 읽는다. 자세한 건 [4편](./2026-10-12-subtitle-extraction-diy#privacy-copyright)에 있다.

42초짜리 숏폼이라면 어느 API든 1센트도 안 나온다. 결국 비용보다는 **데이터를 어디로 보내느냐**가 선택 기준이 된다.

## 상황별 추천

- **고객 영상, 동의 없음** → whisper.cpp 또는 Aiko·MacWhisper(로컬). 검수는 Final Cut이나 Subtitle Edit에서 한다.
- **내 영상, 빨리 끝내고 싶음** → Vrew 무료. 결과를 SRT로 내보내 Final Cut에 넣는다.
- **인터뷰처럼 화자 구분이 필요함** → 로컬에서는 WhisperX + pyannote([4편](./2026-10-12-subtitle-extraction-diy)). 고객이 동의했다면 화자 구분이 있는 API.
- **Premiere를 이미 구독함** → 내장 Speech to Text부터 써 본다.

## 아직 모르는 것

- 한국어 정확도 순위. 업체가 직접 낸 비교표는 있지만 자기 회사가 1등이다. 같은 조건에서 잰 공개 비교는 찾지 못했다.
- Vrew 원화 가격과 무료 플랜 워터마크 조건.
- MacWhisper의 정확한 가격.
