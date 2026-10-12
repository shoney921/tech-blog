---
title: "자막 추출을 직접 만든다면 — 음성 전사, 자막 트랙, OCR은 다른 문제다"
date: 2026-10-12T20:30:00
description: 자막 추출이라는 말에는 세 가지 다른 일이 섞여 있다. 음성 전사, 영상에 들어 있는 자막 트랙 추출, 화면에 박힌 자막 OCR. 각각을 맥에서 로컬로 실측하고, 한국어 정확도, 타임코드, 화자 구분, SRT/VTT, 개인정보, 비용, 저작권까지 정리했다.
---

# 자막 추출을 직접 만든다면 — 음성 전사, 자막 트랙, OCR은 다른 문제다

"영상에서 자막 뽑는 거 하나 만들어 볼까?" 개발자라면 한 번쯤 해 보는 생각이다. 나도 그랬다. 그런데 막상 손대 보니 "자막 추출"이라는 말 안에 서로 전혀 다른 문제가 세 개 들어 있었다.

| 상황 | 필요한 것 | 난이도 |
|---|---|---|
| 자막이 없고 말소리만 있다 | **음성 전사**(STT) | 정확도와 타임코드가 관건 |
| 파일 안에 자막 트랙이 따로 있다(소프트 자막) | **트랙 추출** | 쉽다. 손실 없이 그대로 뽑힌다 |
| 화면에 글자로 박혀 있다(하드 자막) | **OCR** | 프레임 샘플링, 노이즈, 시간 해상도 |

이 셋을 구분하지 않고 "자막 추출기"를 만들면 엉뚱한 데서 시간을 쓴다. 혹시 MKV 파일에 들어 있는 자막을 꺼내려고 Whisper를 돌려 본 적이 있다면, 그게 바로 그 경우다.

## 테스트 조건 (실측)

아래 **실측**이라고 적은 숫자는 전부 이 조건에서 나왔다.

- 맥: Apple M4, 메모리 24GB, macOS 27.0.1
- 도구: whisper.cpp 1.9.5, ffmpeg 9.0.2(Homebrew), Python 3.9.6, Apple Vision(Swift)
- 샘플: macOS `say`의 한국어 음성 '유나'로 만든 42.1초짜리 두 사람 대화. 일곱 문장, 공백과 문장부호를 빼면 196자다. 두 번째 화자는 같은 음성의 음높이를 낮춘 것이다. 대본과 생성 스크립트는 [5편](./2026-10-12-hands-on-whisper-srt-fcpxml)에 공개해 두었다.

이 샘플의 한계도 분명하다. 합성 음성은 발음이 또렷하고 잡음이 없고 말이 겹치지 않는다. **실제 사람 말에서는 오류율이 훨씬 높을 것이다.** 아래 숫자는 "도구가 제대로 도는지"를 확인하는 정도로만 읽어 주면 좋겠다.

## 1. 음성 전사

### 로컬 선택지

- **whisper.cpp**: C/C++ 구현이고 맥 GPU(Metal)를 쓴다. SRT와 VTT를 바로 출력하고, 0.9MB짜리 Silero VAD 모델을 붙일 수 있다. MIT 라이선스([GitHub](https://github.com/ggml-org/whisper.cpp)).
- **faster-whisper**: 파이썬. 같은 정확도에서 openai/whisper보다 최대 4배 빠르다고 주장한다. 단어 단위 타임스탬프를 준다([GitHub](https://github.com/SYSTRAN/faster-whisper), v1.2.1).
- **mlx-whisper**: 애플 MLX로 돌린다. `pip install mlx-whisper`([GitHub](https://github.com/ml-explore/mlx-examples/tree/main/whisper)).
- **WhisperX**: 강제 정렬(forced alignment)로 단어 타임코드를 더 정확하게 잡고, pyannote로 화자를 나눈다([GitHub](https://github.com/m-bain/whisperX), v3.8.6).
- **Qwen3-ASR**: 2026년 1월 공개, Apache-2.0. 한국어를 포함한 30개 언어를 지원하고, 타임스탬프용 ForcedAligner도 한국어를 지원한다고 README에 적혀 있다([GitHub](https://github.com/QwenLM/Qwen3-ASR)). 한국어만 따로 잰 성능은 공개되지 않았다. 나도 돌려 보지 않았다.

### 실측: whisper.cpp 모델 두 개

```bash
whisper-cli -m ggml-small.bin              -l ko -f sample.wav -osrt -of out_small
whisper-cli -m ggml-large-v3-turbo-q5_0.bin -l ko -f sample.wav -osrt -of out_turbo
```

| 모델(파일 크기) | 걸린 시간 (6회, 중앙값) | CER 그대로 | CER 숫자 표기 맞춤 |
|---|---|---|---|
| small (488MB) | 2.8~9.6초 (3.2초) | 3.6% | 2.0% |
| large-v3-turbo-q5_0 (574MB) | 3.5~14.3초 (8.0초) | 2.0% | 0.5% |

- CER은 글자 오류율이다. 공백과 문장부호를 지우고 정답 대본과 편집 거리로 비교했다.
- "숫자 표기 맞춤"은 `2시간` ↔ `두 시간`처럼 뜻은 같고 표기만 다른 경우를 정답 쪽으로 맞춘 값이다. 자막에서는 어느 쪽이 맞는지가 고객 취향이라서 두 값을 같이 적었다.
- 걸린 시간은 모델 로딩을 포함한 벽시계 시간이다. 처음에 한 번만 재고 "turbo가 small보다 빠르다"고 적을 뻔했다. 여섯 번 다시 재 보니 편차가 너무 컸다. 같은 맥에서 다른 작업이 돌고 있었으니 속도 비교로는 믿기 어렵다. 42초짜리를 몇 초 안에 끝낸다는 것까지만 말할 수 있다.

남은 오류가 재밌다. 두 모델 모두 **"숏폼"을 "쇼폼"으로** 들었다. small은 "뭔가요"를 "무엇인가요"로 바꿨고, "클로드 코드"를 "클로드, 코드"로 끊었다. 고유명사와 신조어는 모델이 커져도 틀린다. 이런 건 용어집 치환으로 잡는 게 확실하다. `쇼폼,숏폼` 한 줄을 넣고 다시 쟀더니 turbo 결과가 0.0%가 됐다.

### 실측: 타임코드

turbo 모델이 잡은 문장 시작 시각을, 샘플을 만들 때 알고 있던 실제 시작 시각과 비교했다.

```
실제   7.27  10.76  18.27  22.59  31.55  34.48 (초)
전사   7.30  10.76  18.26  22.58  31.52  34.44
```

차이는 최대 0.04초였다. 깨끗한 합성 음성에 문장 사이 0.7초 무음이 있으니 쉬운 조건이다. 실제 대화에서는 말이 붙어 나오고 문장 경계가 흐려진다. 그때는 단어 단위 정렬(WhisperX)이 필요할 수 있다.

### 실측: 무음에서 지어내기 {#hallucination}

이번 테스트에서 가장 기억에 남는 결과다. 샘플 앞에 무음 30초, 뒤에 작은 핑크 노이즈 30초를 붙여서 돌려 봤다.

- small: 무음 구간에 **"감사합니다."**를 지어냈다
- turbo: 무음과 노이즈 구간에 **"한글자막 제공 및 자막 제공 및 광고를 포함하고 있습니다."**를 지어냈다

말한 적 없는 문장이 자막에 들어가는 거다. 학습 데이터에 섞여 있던 자막 크레딧 문구가 튀어나오는 것으로 보인다. Whisper가 쉬는 구간에서 문장을 지어낸다는 건 논문으로도 보고됐다([Koenecke 외, "Careless Whisper", FAccT 2024](https://arxiv.org/abs/2402.08021)).

해결책은 VAD(음성 구간 검출)다.

```bash
whisper-cli -m ggml-large-v3-turbo-q5_0.bin -l ko -f padded.wav \
  --vad -vm ggml-silero-v5.1.2.bin -osrt -of out_vad
```

VAD를 켜니 지어낸 문장이 사라졌다. 자막은 8개, CER은 0.5%로 원래와 같았다. 첫 자막 시작도 30.02초로 무음 길이만큼 정확히 밀렸다. **인트로 음악이나 긴 침묵이 있는 영상이라면 VAD는 기본으로 켜는 게 맞다.** 이걸 모르고 납품했으면 꽤 민망했을 것이다.

### 한국어 정확도, 공개 자료는

- whisper-large-v3의 FLEURS 한국어 CER은 5.31%로 보고된다. 같은 논문의 한국어 미세조정 모델은 5.16%로 조금 낫다([BuzzASR/korean 모델 카드](https://huggingface.co/BuzzASR/korean)).
- 리턴제로가 공개한 비교에서는 자사 6.77%, 네이버 CLOVA 7.96%, Whisper 11.34%였다([rtzr/Awesome-Korean-Speech-Recognition](https://github.com/rtzr/Awesome-Korean-Speech-Recognition)). **경쟁사가 만든 표**이고 비교한 모델 버전도 안 나와 있다.
- 유명한 Open ASR Leaderboard의 다국어 항목에는 한국어가 없다.

정리하면, 공개된 숫자로는 "깨끗한 낭독은 5% 안팎, 대화체는 10% 안팎"쯤으로 짐작만 할 수 있다. 내 콘텐츠로 직접 재 보는 게 제일 정확하다.

### 화자 구분

whisper.cpp에도 화자 구분 옵션(`--tinydiarize`)이 있지만, 영어 전용 모델에서만 동작한다. 한국어로 화자를 나누려면 이렇게 한다.

- **로컬**: WhisperX + pyannote `speaker-diarization-community-1`. 모델은 CC-BY-4.0이지만 **게이트가 걸려 있다.** Hugging Face 토큰을 만들고 사용 조건에 동의해야 받을 수 있다([모델 카드](https://huggingface.co/pyannote/speaker-diarization-community-1)). 이번에는 비밀 값을 입력하지 않기로 해서 **테스트하지 않았다.**
- **클라우드**: Deepgram, OpenAI `gpt-4o-transcribe-diarize`, ElevenLabs Scribe 등. [3편](./2026-10-12-subtitle-services-compared) 참고.

숏폼 자막이라면 화자 구분이 필요한 경우가 드물다. 인터뷰나 팟캐스트 클립에서만 고민하면 된다(사견).

## 2. 이미 있는 자막 트랙 꺼내기

MP4(mov_text)나 MKV(SRT/ASS) 안에 텍스트 자막 트랙이 있으면 전사할 필요가 없다. 그냥 꺼내면 된다.

```bash
ffprobe -v error -show_entries stream=index,codec_type,codec_name -of compact input.mp4
ffmpeg -i input.mp4 -map 0:s:0 out.srt      # 첫 번째 자막 트랙
mkvextract input.mkv tracks 2:out.srt        # MKVToolNix, 트랙 번호는 mkvmerge -i 로 확인
```

**실측**: 위에서 정리한 SRT를 MP4(mov_text)와 MKV(SRT) 트랙으로 넣었다가 ffmpeg으로 다시 꺼냈다. MKV에서 꺼낸 건 원본과 똑같았고, MP4에서 꺼낸 것도 정답 대비 CER 0.0%였다.

예외도 있다. DVD(VobSub)나 블루레이(PGS) 자막은 텍스트가 아니라 **그림**이다. 이건 OCR을 해야 한다. Subtitle Edit가 이런 그림 자막을 OCR하는 기능을 갖고 있다.

유튜브 자막은 이야기가 다르다. `yt-dlp --write-subs --skip-download` 같은 명령이 기술적으로는 된다([yt-dlp](https://github.com/yt-dlp/yt-dlp)). 하지만 유튜브 약관은 허가 없는 다운로드와 자동화된 수집을 금지한다([YouTube 서비스 약관](https://www.youtube.com/static?template=terms)). 공식 API로 자막을 받으려면 그 영상을 편집할 권한, 사실상 소유자 권한이 있어야 한다. 고객이 자기 채널 영상의 자막을 원하면, 고객이 YouTube Studio에서 직접 내려받아 주는 게 깔끔하다.

## 3. 화면에 박힌 자막 OCR

자막이 영상 그림의 일부라면 프레임을 뽑아서 글자를 읽는 수밖에 없다.

### 실측: Apple Vision으로

테스트용 하드 자막 영상을 만들었다. 정리된 SRT를 Apple SD Gothic Neo Bold 64px, 흰 글자에 검은 외곽선으로 그려서 컬러 바 화면 위에 입혔다. 그다음 이렇게 돌렸다.

```bash
# 초당 2장, 화면 아래 자막 영역만 잘라서 저장
ffmpeg -i hard.mp4 -vf "fps=2,crop=1080:420:0:1300" frames/f%04d.png
# Apple Vision OCR (ko-KR, en-US)
swift ocr.swift frames/*.png > ocr_raw.tsv
# 같은 글자가 이어지는 프레임을 묶어 SRT로
python3 ocr_to_srt.py ocr_raw.tsv 2 > ocr.srt
```

- 84장을 OCR하는 데 13.5초 걸렸다(Swift 컴파일 포함).
- 원시 결과에는 배경 무늬를 글자로 잘못 읽은 `3000`, `•@`, `2` 같은 쓰레기가 섞여 있었다. 한글이 하나도 없는 토큰을 버리는 필터를 넣었다.
- 필터를 거친 뒤 자막은 12개, 정답 대비 CER 0.0%였다.
- 시간 정확도는 프레임 간격(0.5초)에 묶인다. 더 촘촘히 뽑으면 정확해지지만 OCR할 프레임이 늘어난다.

이번에도 삽질이 하나 있었다. 처음에는 OCR 결과가 전부 비어 있었다. 알고 보니 Swift로 그린 자막 PNG가 레티나 배율 때문에 2160×3840으로 저장됐고, 그래서 자막이 화면 밖에 붙어 있었다. OCR 문제가 아니라 테스트 데이터 문제였다. 어디서 틀렸는지 확인하려면 **중간 프레임을 눈으로 한 장 보는 게** 제일 빠르다.

깨끗한 고딕체를 단색 외곽선으로 그린 합성 자막이라 0%가 나온 것이다. 실제 예능 자막처럼 그러데이션, 기울어진 글씨, 배경과 비슷한 색, 화면 곳곳의 다른 글자가 있으면 결과가 많이 나빠질 거다. 그리고 OCR 결과는 **이미 누군가 만든 자막**이라는 걸 잊으면 안 된다. 저작권 이야기는 아래에서 한다.

다른 OCR 도구도 있다(돌려 보지는 않았다).

- [VideOCR](https://github.com/timminator/VideOCR): PaddleOCR 기반 GUI·CLI, SRT 출력, MIT
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR): 한국어 모델이 있다

## SRT와 VTT

- **SRT**: 정식 표준 문서는 없다. 사실상 표준이다. 시간이 `00:00:01,000`처럼 **쉼표**로 쓰인다. Final Cut은 SRT를 가져올 수 있다.
- **WebVTT**: W3C 문서가 있다. 파일이 `WEBVTT`로 시작하고 시간에 **마침표**를 쓴다(`00:00:01.000`). 웹 플레이어용이다([W3C WebVTT](https://www.w3.org/TR/webvtt1/)).

변환은 쉽다. 오히려 **CSV에 SRT 시간을 그대로 넣으면 쉼표 때문에 열이 갈린다.** 이번에 실제로 이걸로 한 번 막혔다. CSV에는 `10.76`처럼 초 단위나 마침표 형식을 쓰는 게 낫다.

## 한국어 자막 줄 길이

넷플릭스 한국어 자막 가이드가 좋은 기준이 된다([넷플릭스 한국어 Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/216001127), 2025-07-07 갱신).

- 한 줄 16자, 최대 2줄
- 라틴 문자, 숫자, 공백, 문장부호는 0.5자로 센다
- 성인 콘텐츠의 읽기 속도는 초당 12자 이하

**실측**: turbo 전사 결과 8개 중 6개가 이 기준을 넘었다. Whisper는 문장 단위로 끊어 주지 자막 줄 단위로 끊어 주지 않는다. whisper.cpp의 `-ml`(최대 길이) 옵션도 써 봤다. 그런데 "합니다." 한 단어만 따로 떨어진 자막이 생겼다. 그래서 줄을 다시 나누는 작은 스크립트를 따로 만들었다([5편](./2026-10-12-hands-on-whisper-srt-fcpxml)).

## 개인정보와 저작권 {#privacy-copyright}

법률 자문이 아니라, 부업하면서 걸릴 만한 지점을 정리한 것이다.

- **고객 음성은 개인정보일 수 있다.** 인터뷰 녹음을 해외 클라우드 전사 API로 보내면 개인정보 국외 이전 문제가 생길 수 있다. 개인정보보호법 제28조의8은 정보주체의 별도 동의 같은 요건을 둔다. 로컬 전사는 이 고민을 통째로 없애 준다.
- **클라우드를 쓴다면 데이터 정책을 읽는다.** OpenAI API는 옵트인하지 않으면 학습에 쓰지 않는다([OpenAI 데이터 정책](https://developers.openai.com/api/docs/guides/your-data)). AWS Transcribe는 서비스 개선에 쓸 수 있고 조직 정책으로 거부해야 한다([AWS FAQ](https://aws.amazon.com/transcribe/faqs/)). 고객에게는 "어떤 서비스에 올려도 되는지"를 계약 전에 묻는다.
- **남의 영상 자막은 저작물이다.** 번역 자막은 2차적저작물이다. 허락 없이 만들어 공개하면 저작권 침해가 될 수 있다. 하드 자막 OCR이나 유튜브 자막 다운로드도 마찬가지다. 고객 소유 영상이거나 권리자에게 허락을 받은 경우에만 작업한다.

## 비용

- **로컬**: 0원. 모델 파일(small 488MB, turbo q5 574MB, VAD 0.9MB)을 받을 디스크와 전기 정도.
- **클라우드 API**: 분당 $0.003~0.006 수준이다. 10분짜리 영상이면 몇십 원에서 100원 안팎이다([3편](./2026-10-12-subtitle-services-compared)). 돈보다는 결제 등록, API 키 관리, 데이터 정책을 따지는 수고가 더 크다.

## 그래서 직접 만들 만한가

전사 엔진을 직접 만들 이유는 없다. whisper.cpp가 이미 있다. 만들 가치가 있는 건 그 **앞뒤**다.

- 앞: VAD 켜기, 입력 정규화(ffmpeg으로 16kHz 모노 변환)
- 뒤: 용어집 치환, 넷플릭스 기준 줄 나눔, 겹침 검사, SRT/VTT 변환, 정답 대본과 비교하는 CER 측정

이 "뒤" 부분이 실제로 시간을 아껴 준다. [5편](./2026-10-12-hands-on-whisper-srt-fcpxml)에서 이걸 스크립트로 만들어 돌린다.

아직 고민 중인 건 화자 구분이다. pyannote를 붙이면 Hugging Face 토큰과 파이썬 환경이 따라온다. 부업용 도구치고는 무겁다. 인터뷰 의뢰가 실제로 들어오면 그때 다시 볼 생각이다.
