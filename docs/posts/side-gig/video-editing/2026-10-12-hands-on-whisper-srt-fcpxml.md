---
title: "따라 하기: 42초 샘플로 전사 → 자막 정리 → FCPXML 러프컷"
date: 2026-10-12T20:40:00
description: 맥 한 대와 무료 도구만으로 한국어 음성을 SRT 자막으로 만들고, 넷플릭스 줄 기준에 맞게 정리하고, 컷 목록을 Final Cut Pro용 FCPXML로 바꾼다. 준비물, 예상 비용, 단계마다 성공 확인 방법, 실패했을 때의 대안, 같은 샘플로 도구를 비교하는 테스트 표까지.
---

# 따라 하기: 42초 샘플로 전사 → 자막 정리 → FCPXML 러프컷

이 글은 처음부터 끝까지 손으로 따라 하는 글이다. 내 맥에서 실제로 돌렸고, 빈 폴더에서 처음부터 한 번 더 돌려 같은 결과가 나오는 것까지 확인했다. 단, **Final Cut Pro에 가져오는 마지막 단계는 직접 누르지 않았다.** 이 단계는 성공 기준만 적어 둔다.

결과물은 세 가지다.

1. `clean.srt` — 한 줄 16자, 최대 2줄에 맞춰 정리한 한국어 자막
2. `clean.vtt` — 웹용 자막
3. `rough.fcpxml` — 남길 구간 세 개를 이어 붙인 Final Cut 타임라인

## 준비물과 비용

- **맥**: 실측은 Apple M4, 24GB, macOS 27.0.1에서 했다. Intel 맥에서도 whisper.cpp는 돌아가지만 확인하지 않았다.
- **Homebrew**: [brew.sh](https://brew.sh)
- **디스크**: 모델과 도구에 약 1.5GB
- **Python 3**: macOS의 `/usr/bin/python3`(Xcode 명령줄 도구)면 된다. 스크립트는 표준 라이브러리만 쓴다.
- **Final Cut Pro**: 마지막 가져오기 단계에만 필요하다
- **비용**: 0원. 유료 API, 구독, 업로드 없음

예상 시간은 처음이면 30~40분이다. 대부분 설치와 모델 다운로드 시간이다.

## 1단계: 도구 설치

```bash
brew install ffmpeg whisper-cpp
```

`whisper-cpp`라는 이름은 `whisper.cpp`로 바뀌었다. 옛 이름으로 설치해도 경고만 뜨고 설치는 된다.

**성공 확인**

```bash
ffmpeg -version | head -1      # ffmpeg version 9.x ...
whisper-cli --help | head -3   # usage: whisper-cli [options] file0 file1 ...
```

**실패하면**: `whisper-cli`를 찾을 수 없다고 나오면 `brew --prefix`의 `bin`이 PATH에 들어 있는지 확인한다. Apple silicon이면 `/opt/homebrew/bin`이다.

## 2단계: 모델 받기

```bash
mkdir -p ~/sidegig-lab/models && cd ~/sidegig-lab/models
curl -L -O https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
curl -L -O https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin
# 비교용(선택)
curl -L -O https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

**성공 확인**: `ls -l` 했을 때 크기가 대략 이렇게 나오면 된다. turbo-q5_0 574MB, silero 0.9MB, small 488MB. 몇 KB짜리 파일이면 다운로드가 아니라 에러 페이지를 받은 것이다.

## 3단계: 스크립트와 샘플 대본 받기

```bash
mkdir -p ~/sidegig-lab/work && cd ~/sidegig-lab/work
B=https://blog.shoneylife.com/downloads/side-gig
for f in make_sample.sh sample-script.tsv srt_tool.py cer.py cuts_to_fcpxml.py ocr.swift ocr_to_srt.py; do
  curl -fsSLO "$B/$f"
done
```

| 파일 | 하는 일 |
|---|---|
| `make_sample.sh` | 대본(TSV)을 macOS 한국어 음성으로 읽어 `sample.wav`, `sample.mp4`를 만든다 |
| `srt_tool.py` | SRT 점검(`check`), 용어집 치환과 줄 나눔(`fix`), VTT 변환(`vtt`) |
| `cer.py` | 정답 대본과 SRT를 비교해 글자 오류율을 계산한다 |
| `cuts_to_fcpxml.py` | 컷 목록 CSV를 FCPXML 1.11로 바꾼다 |
| `ocr.swift`, `ocr_to_srt.py` | 하드 자막 OCR 실험용([4편](./2026-10-12-subtitle-extraction-diy)) |

받은 스크립트는 실행하기 전에 한 번 열어 보길 권한다. 남이 준 스크립트는 원래 그렇게 쓰는 거다. 모두 짧다.

## 4단계: 샘플 만들기

왜 내 영상이 아니라 합성 샘플로 시작하냐면, **정답을 알기 때문이다.** 대본을 내가 썼으니 전사 결과가 몇 글자 틀렸는지 셀 수 있다. 고객 영상으로 시작하면 "잘 된 것 같은데?"에서 멈추게 된다.

```bash
sh make_sample.sh sample-script.tsv
```

**성공 확인**: `sample.wav, sample.mp4 생성 (길이 42.114063초)`. 내 맥에서는 이렇게 나왔다. 맥의 음성 버전에 따라 길이가 조금 다를 수 있다.

**실패하면**: 길이가 1초도 안 되면 음성이 설치되지 않은 것이다. 나도 처음에 다른 한국어 음성(Reed, Eddy 등)으로 시도했다가 전부 0.01초짜리 빈 파일을 받았다. `say -v '?' | grep ko_KR`로 목록에는 보이지만 실제로는 받아져 있지 않은 음성이 많다. 시스템 설정 > 손쉬운 사용 > 읽기 및 말하기에서 '유나(향상됨)'을 내려받는다.

## 5단계: 전사

```bash
M=~/sidegig-lab/models
whisper-cli -m $M/ggml-large-v3-turbo-q5_0.bin -l ko -f sample.wav \
  --vad -vm $M/ggml-silero-v5.1.2.bin -osrt -of raw -np
python3 -I cer.py sample-script.tsv raw.srt
```

- `-l ko`: 한국어로 고정한다. 자동 감지에 맡기면 짧은 파일에서 언어를 틀리게 잡을 때가 있다.
- `--vad`: 무음 구간에서 문장을 지어내지 않게 한다. VAD를 끄면 무슨 일이 생기는지는 [4편](./2026-10-12-subtitle-extraction-diy#hallucination)에 있다.
- `python3 -I`: 현재 폴더의 파일을 파이썬 모듈로 잘못 불러오지 않게 격리 모드로 실행한다.

**성공 확인**: `raw.srt`에 자막이 7~8개 생기고, `cer.py`가 `CER 2.0%` 안팎을 출력하면 된다. 내 결과는 `정답 196자, 편집거리 4, CER 2.0%`였다. 틀린 4글자는 숫자 표기(`2시간`/`두 시간` 등)와 `숏폼`→`쇼폼`이다.

**실패하면**:
- CER이 30%를 넘으면 `-l ko`를 빠뜨렸는지 본다.
- 너무 느리면 `ggml-small.bin`으로 바꾼다. 내 맥에서 여섯 번 잰 중앙값은 small 3.2초, turbo 8.0초였다. 대신 small은 틀린 글자가 더 많았다.

## 6단계: 자막 정리

먼저 무엇이 문제인지 본다.

```bash
python3 -I srt_tool.py check raw.srt
```

```
#1 00:00:00,000 한 줄 42자 > 16자: 안녕하세요. 오늘은 퇴근하고 2시간 동안 ...
...
자막 7개, 문제 5건
```

Whisper는 문장 단위로 끊어 주기 때문에, 넷플릭스 한국어 기준(한 줄 16자, 2줄, 라틴·숫자·공백은 0.5자)에 대부분 걸린다. 용어집을 만들고 고친다.

```bash
printf '쇼폼,숏폼\n' > glossary.csv
python3 -I srt_tool.py fix raw.srt --glossary glossary.csv -o clean.srt
python3 -I srt_tool.py check clean.srt
python3 -I srt_tool.py vtt clean.srt -o clean.vtt
python3 -I cer.py sample-script.tsv clean.srt --digits
```

**성공 확인**: `자막 11개, 문제 0건`, 그리고 `CER 0.0%`(숫자 표기 맞춤 기준).

`fix`가 하는 일은 이렇다.

1. 용어집 치환
2. 2줄에 안 들어가는 자막을 어절 단위로 나누기. 문장 끝(`.?!`)에서 끊는 걸 우선한다
3. 마지막 조각이 "했어요." 한 단어처럼 너무 짧으면 앞 조각에서 어절을 넘겨 균형 맞추기
4. 줄바꿈 위치는 두 줄 길이가 비슷해지게 고르기

**알아 둘 한계**: 자막을 나눌 때 시간은 **글자 수 비율로 나눈 근사치**다. 말 빠르기가 고르지 않으면 자막이 소리보다 조금 먼저 뜨거나 늦게 뜰 수 있다. 정확히 하려면 whisper.cpp의 `-ojf`(단어 단위 JSON) 출력을 써야 한다. 다음에 고칠 목록에 올려 두었다.

용어집은 영상마다 쌓인다. 고객 이름, 제품명, 채널 고유 표현. 이 파일이 쌓이는 게 실은 부업 경쟁력이라고 본다(사견).

## 7단계: Final Cut Pro로 자막 가져오기 (미검증)

**이 단계는 직접 실행하지 않았다.** 애플 도움말 기준 절차다.

1. 테스트용 새 라이브러리를 만든다. 작업 중인 라이브러리에서 실험하지 않는다
2. `sample.mp4`를 가져와 프로젝트에 올린다
3. 파일 > 가져오기 > 자막에서 `clean.srt`를 고른다

**성공 기준**: 타임라인 위에 자막 역할(SRT)로 11개 자막이 뜬다. 첫 자막이 0초에 시작하고, 마지막 자막이 41초 근처에서 끝난다.

**실패하면**: 한글이 깨지면 파일 인코딩을 의심한다(`srt_tool.py`는 UTF-8로 쓴다). 그래도 안 되면 Subtitle Edit 같은 자막 편집기에서 다시 저장해 본다.

## 8단계: 컷 목록 → FCPXML 러프컷

긴 원본에서 남길 구간만 골라 이어 붙인 타임라인을 만든다. 실전에서는 이 컷 목록을 Claude나 Codex에게 만들게 한다([6편](./2026-10-12-claude-codex-for-editors)). 여기서는 손으로 쓴다.

시간은 내 `clean.srt`의 자막 경계에서 가져온다. 맥마다 전사 결과의 경계가 0.0몇 초씩 다를 수 있으니 아래 숫자를 그대로 쓰지 말고 먼저 확인한다.

```bash
grep -- '-->' clean.srt
```

```bash
cat > cuts.csv <<'EOF'
start,end,note
0,6.26,인트로 — 주제 소개
10.78,17.12,단가 이야기 (질문 컷은 뺌)
34.21,40.95,결론
EOF
python3 -I cuts_to_fcpxml.py sample.mp4 cuts.csv -o rough.fcpxml
```

**성공 확인**: `rough.fcpxml: 클립 3개, 총 19.37초 (원본 42.10초)`. 내 경계값 기준이다. 경계값이 다르면 총 길이도 조금 달라진다.

이제 이 파일이 Final Cut이 받아들이는 문법인지 확인한다. Final Cut 앱 안에는 FCPXML 문법 정의(DTD) 파일이 들어 있다. 이걸로 검사할 수 있다.

```bash
mkdir -p ~/sidegig-lab/dtd
cp "/Applications/Final Cut Pro.app/Contents/Frameworks/Interchange.framework/Versions/A/Resources/FCPXMLv1_11.dtd" ~/sidegig-lab/dtd/
xmllint --noout --dtdvalid ~/sidegig-lab/dtd/FCPXMLv1_11.dtd rough.fcpxml && echo OK
```

**성공 확인**: `OK`. 내 맥의 Final Cut 12.4에 들어 있는 1.11과 1.14 DTD로 둘 다 통과했다(실측).

여기서 두 번 삽질했다.

- 처음에 DTD를 앱 안의 경로 그대로 넘겼더니 `Could not parse DTD` 에러가 났다. 경로에 공백이 있어서였다. 위처럼 복사해서 쓰면 된다.
- 컷 목록에 SRT 형식 시간(`00:00:06,280`)을 그대로 넣었더니 CSV가 쉼표에서 열을 갈라 버렸다. 스크립트가 "구간이 원본 길이를 벗어난다"며 멈췄는데, 덕분에 이상한 파일이 만들어지지는 않았다. 초 단위(`6.28`)나 마침표 형식(`00:00:06.280`)을 쓴다.

DTD 검사를 통과했다고 Final Cut이 반드시 잘 가져온다는 보장은 없다. 문법만 맞는 것이다.

**Final Cut으로 가져오기 (미검증)**: 테스트 라이브러리를 연 상태에서 파일 > 가져오기 > XML로 `rough.fcpxml`을 고른다. 성공 기준은 이렇다. "AI 러프컷" 이벤트와 프로젝트가 생기고, 타임라인 길이가 컷 목록 합계(내 경우 19.37초)와 같고, 클립 세 개 첫 프레임에 마커가 붙어 있다. 미디어가 오프라인으로 뜨면 `sample.mp4`를 옮기지 않았는지 확인한다. FCPXML 안에 절대 경로가 들어 있다.

## 같은 샘플로 비교하는 테스트 표 {#test-table}

도구를 고를 때 남의 후기보다 이게 낫다. **같은 샘플**을 각 도구에 넣고 같은 기준으로 잰다. 내가 잰 칸은 실측이고, 나머지는 비워 뒀다. 직접 채워 보면 된다.

| 도구 | CER 그대로 / 숫자 맞춤 | 무음에서 지어냄 |
|---|---|---|
| whisper.cpp small | 3.6% / 2.0% | 있음 |
| whisper.cpp turbo | 2.0% / 0.5% | 있음 |
| turbo + VAD | 2.0% / 0.5% | **없음** |
| 위 + `srt_tool fix` | – / 0.0% | – |
| Vrew 무료 | 미측정 | 미측정 |
| Premiere 체험 | 미측정 | 미측정 |
| Aiko·MacWhisper | 미측정 | 미측정 |
| Final Cut 자동 자막 | 한국어 미지원 | – |

turbo는 `large-v3-turbo-q5_0` 모델이다. 표에 다 못 넣은 실측값은 따로 적는다.

- **지어낸 문장**: small은 "감사합니다.", turbo는 "한글자막 제공 및 자막 제공 및 광고를 포함하고 있습니다."
- **16자 기준 위반**: small 9개 중 7개, turbo 8개 중 6개, turbo+VAD 7개 중 5개, `fix` 후 0개
- **처리 시간**(모델 로딩 포함): small 2.8~9.6초, turbo 3.5~14.3초, turbo+VAD 4.7초(1회), `fix` 0.1초. 다른 작업이 함께 돌던 맥에서 재서 편차가 크다. 참고로만 본다

**재는 방법**

1. 각 도구에 `sample.wav`(또는 `sample.mp4`)를 넣고 SRT로 내보낸다
2. `python3 -I cer.py sample-script.tsv 결과.srt`, 그리고 같은 명령에 `--digits`를 붙여 한 번 더
3. `python3 -I srt_tool.py check 결과.srt`로 줄 기준 위반 개수를 센다
4. 무음 테스트: 앞뒤에 무음을 붙인 파일로 돌리고 첫 자막 앞이나 마지막 자막 뒤에 없는 말이 생겼는지 본다

```bash
ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 30 silence.wav
ffmpeg -f lavfi -i "anoisesrc=d=30:c=pink:r=16000:a=0.02" -ac 1 noise.wav
ffmpeg -i silence.wav -i sample.wav -i noise.wav -filter_complex "[0][1][2]concat=n=3:v=0:a=1" padded.wav
```

5. **클라우드 서비스를 쓸 때는 합성 샘플만 올린다.** 고객 영상으로 비교하지 않는다

**합성 샘플만으로는 부족하다.** 합성 음성에서 다 0%가 나오면 비교가 안 된다. 그래서 다음 행을 하나 추가하길 권한다. 내 목소리로 1분 녹음하기. 대본을 먼저 쓰고, 그대로 읽어서 QuickTime으로 녹음한다. 대본을 `sample-script.tsv`와 같은 형식(`화자<TAB>음성<TAB>문장`)으로 저장하면 `cer.py`를 그대로 쓸 수 있다. 일부러 빠르게 읽고, 영어 단어와 숫자를 섞고, 끝에 웃음소리도 넣어 보자.

## 다음에 할 것

- 단어 단위 타임스탬프로 자막을 나누기. 지금은 글자 비율 근사치다
- 내 목소리 1분 녹음으로 표 채우기
- 실제로 Final Cut에서 SRT와 FCPXML 가져오기 확인하기. 확인하면 이 글을 고친다
