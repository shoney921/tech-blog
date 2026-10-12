---
title: "Claude·Codex로 영상 편집 부업 거들기 — 되는 것과 안 되는 것"
date: 2026-10-12T20:50:00
description: Claude와 Codex는 영상을 보지도 듣지도 못하고, Final Cut 화면을 믿을 만하게 조작하지도 못한다. 대신 텍스트와 파일은 잘 다룬다. 기획·대본·컷 목록·자막 정리·자동화 스크립트를 맡기는 법을, 결과를 기계로 검증하는 관문과 함께 정리했다.
---

# Claude·Codex로 영상 편집 부업 거들기 — 되는 것과 안 되는 것

"Claude한테 영상 주고 컷 편집해 달라고 하면 되지 않나?" 처음엔 나도 그렇게 생각했다. 결론부터 말하면 **안 된다.** 적어도 2026년 10월 지금은 그렇다. 그런데 방향을 조금 틀면 꽤 많은 일을 맡길 수 있다.

핵심은 하나다. **편집기 화면이 아니라 파일을 맡긴다.**

## 되는 것과 안 되는 것

공식 문서를 기준으로 나눴다(2026-10-12 확인).

**안 되거나, 기대하지 않는 게 나은 것**

- **영상이나 음성을 직접 이해하기.** Claude 앱에 올릴 수 있는 파일 목록에 오디오와 비디오가 없다. PDF, 문서, CSV, 이미지 같은 것만 받는다([Claude 파일 업로드 도움말](https://support.claude.com/en/articles/8241126-uploading-files-to-claude), 2026-07-23 갱신). 먼저 whisper.cpp로 대본을 만들고, 필요하면 ffmpeg으로 프레임 이미지를 뽑아서 줘야 한다.
- **타임코드를 "기억"해서 만들기.** 모델에게 대본 없이 시간을 물으면 그럴듯한 숫자를 지어낸다. 시간은 항상 전사 결과(SRT)나 ffprobe에서 와야 한다.
- **Final Cut 화면 클릭하기.** Claude의 컴퓨터 사용(computer use)은 맥 데스크톱 앱에서 연구 미리보기로 제공된다. 앤트로픽 스스로 "코딩이나 텍스트 작업에 비하면 아직 초기"라고 말한다([앤트로픽 블로그, 2026-03-23](https://claude.com/blog/dispatch-and-computer-use)). Codex에도 비슷한 기능이 발표됐다는 보도가 있지만, 공식 페이지가 열리지 않아 확인하지 못했다. 고객 납품물을 이런 방식에 맡기기는 어렵다.
- **Final Cut에서 내보내기를 자동으로.** 애플이 문서로 공개한 자동화 경로는 FCPXML을 Final Cut으로 **보내는** 쪽뿐이다([애플 개발자 문서](https://developer.apple.com/documentation/professional-video-applications/sending-data-programmatically-to-final-cut-pro)). 내보내기는 사람이 한다.

**되는 것**

- 기획안, 대본, 촬영 목록 같은 글 쓰기
- **SRT 대본을 읽고 컷 목록(CSV) 만들기.** 시간은 SRT에서 복사하게 한다
- 용어집 후보 뽑기, 맞춤법이나 띄어쓰기 고치기
- ffmpeg, whisper.cpp, Python 스크립트를 짜고 돌리기. Claude Code와 Codex CLI는 내 폴더의 파일을 읽고 쓰고 명령을 실행한다([Claude Code 문서](https://code.claude.com/docs/en/overview), [Codex CLI 문서](https://learn.chatgpt.com/docs/codex/cli))
- FCPXML을 만들어서 Final Cut으로 보내기

## 비용과 설치

- **Claude Code**: Pro 월 $20부터 들어 있다. 무료 플랜에는 없다
- **Codex CLI**: ChatGPT 무료와 Go($8)에서도 가볍게 쓸 수 있고, Plus는 월 $20이다

```bash
curl -fsSL https://claude.ai/install.sh | bash   # Claude Code
npm install -g @openai/codex                     # Codex CLI (또는 brew install --cask codex)
```

출처: [claude.com/pricing](https://claude.com/pricing), [OpenAI 요금 문서](https://learn.chatgpt.com/docs/pricing), [openai/codex](https://github.com/openai/codex). 구독 안에서 쓰는 거라 호출마다 돈이 나가지는 않는다. 대신 플랜 사용량 한도를 나눠 쓴다.

내 맥에는 Claude Code 2.1.292와 codex-cli 0.160.0이 깔려 있다. 아래 명령 형식(`claude -p`, `codex exec`)은 각자의 `--help`로 확인했다.

## 실습: 대본 → 컷 목록 → FCPXML, 관문 세 개

::: danger 이 실습의 AI 단계는 이 글을 쓰며 실행하지 않았다
유료 호출을 하지 않기로 해서, 아래 프롬프트를 Claude나 Codex에 실제로 돌린 결과는 없다. 대신 AI가 내놓을 결과물을 **검사하는 스크립트**는 전부 실행해 봤다. AI가 뭘 내놓든, 이 관문을 통과하지 못하면 다음 단계로 넘기지 않는다.
:::

준비는 [5편](./2026-10-12-hands-on-whisper-srt-fcpxml)의 1~6단계까지다. 폴더에 `sample.mp4`, `clean.srt`, 스크립트들이 있으면 된다.

### 1. 기획 메모 쓰기

`brief.md`라는 파일을 만든다. AI에게 줄 맥락이다. 고객 요청을 그대로 옮기되, 개인정보는 빼고 쓴다.

```markdown
# 의뢰
- 42초 대화 영상을 20초 안팎 숏폼으로 줄인다
- 꼭 남길 것: 주제 소개, 단가 이야기, 결론
- 빼도 되는 것: 질문하는 쪽 대사
- 자막: 한 줄 16자, 최대 2줄 (넷플릭스 한국어 기준)
```

### 2. 컷 목록 만들기

Claude Code라면:

```bash
claude -p "brief.md와 clean.srt를 읽고 cuts.csv를 만들어 줘.
규칙:
- 열은 start,end,note. 시간은 초 단위 소수(예: 10.76)
- start와 end는 반드시 clean.srt에 있는 자막 경계 시각만 쓴다. 새 시간을 만들지 않는다
- 남길 구간만, 타임라인에 놓을 순서대로 적는다
- 다 쓰면 python3 -I cuts_to_fcpxml.py sample.mp4 cuts.csv -o rough.fcpxml 을 실행하고 출력을 보여 줘" \
  --allowedTools "Read,Write,Bash(python3 -I cuts_to_fcpxml.py:*)"
```

Codex라면:

```bash
codex exec --sandbox workspace-write "(위와 같은 지시)"
```

포인트는 두 가지다.

- **시간은 SRT 경계에서만 고르게 한다.** 모델이 시간을 만들어 내는 순간 오차가 생긴다
- **권한을 좁힌다.** Claude Code는 `--allowedTools`로, Codex는 `--sandbox workspace-write`로 이 폴더 안에서만 쓰게 한다. 고객 원본이 있는 폴더에서 "알아서 다 해"는 하지 않는다

### 3. 관문 ①: 구간 검사

`cuts_to_fcpxml.py`는 FCPXML을 만들기 전에 구간이 원본 길이 안에 있는지, 시작이 끝보다 앞인지 검사한다. **실측**으로 일부러 틀린 입력(`5,50`)을 넣었다. `1행: 구간 5~50 이 원본 길이(0~42.10s)를 벗어나거나 거꾸로임`을 내고 멈췄다. SRT식 쉼표 시간을 넣었을 때도 같은 이유로 멈췄다.

여기에 한 가지를 더 해 두면 좋다. "시간이 SRT 경계에서 왔는지"를 확인하는 거다. 직접 짜도 되고 AI에게 짜게 해도 된다.

```bash
python3 -I - <<'EOF'
import csv, re
bounds = set()
for m in re.finditer(r"(\d\d):(\d\d):(\d\d),(\d{3})", open("clean.srt", encoding="utf-8").read()):
    h, mi, s, ms = map(int, m.groups())
    bounds.add(round(h*3600 + mi*60 + s + ms/1000, 2))
for row in csv.DictReader(open("cuts.csv", encoding="utf-8")):
    for k in ("start", "end"):
        if round(float(row[k]), 2) not in bounds:
            print("SRT 경계가 아닌 시간:", k, row[k])
EOF
```

출력이 비어 있으면 통과다. **실측**: 5편의 컷 목록은 통과했고, 끝 시간을 경계가 아닌 `6.3`으로 바꾼 목록은 `SRT 경계가 아닌 시간: end 6.3`으로 걸렸다.

### 4. 관문 ②: FCPXML 문법 검사

```bash
xmllint --noout --dtdvalid ~/sidegig-lab/dtd/FCPXMLv1_11.dtd rough.fcpxml && echo OK
```

Final Cut 앱에 들어 있는 DTD로 검사한다(5편 8단계). **실측**: 손으로 쓴 컷 목록으로 만든 파일은 1.11과 1.14 DTD를 둘 다 통과했다. 태그를 일부러 망가뜨린 파일은 `Opening and ending tag mismatch`로 걸렸다.

FCPXML을 처음부터 AI에게 쓰게 하지 않고 **스크립트가 만들게 한 이유**가 여기 있다. FCPXML의 시간은 `32300/3000s` 같은 유리수다. 프레임 단위로 딱 맞아야 한다. 이런 계산은 코드가 하고, AI는 "어디를 남길지"만 정한다.

### 5. 관문 ③: 사람이 본다

마지막 관문은 사람이다. Final Cut에서 열어 보고 컷이 말 중간에서 잘리지 않았는지 듣는다. 이 단계는 없앨 수 없다. 없애면 안 된다.

## 자막 정리에 쓰기

용어집 만들기는 AI가 잘하는 일이다. 다만 고치는 것까지 맡기지 않는다.

```bash
claude -p "clean.srt를 읽고, 음성 인식이 잘못 들었을 가능성이 높은 단어를
'틀린말,바른말' 형식으로 glossary_candidates.csv에 적어 줘.
확신이 없으면 적지 마. SRT 파일은 수정하지 마."
```

후보 목록을 사람이 보고 맞는 것만 `glossary.csv`로 옮긴다. 그다음 [5편](./2026-10-12-hands-on-whisper-srt-fcpxml)의 `srt_tool.py fix`로 고친다. 이렇게 나누는 이유가 있다. AI가 SRT를 직접 고치면, 시간 줄이나 번호를 슬쩍 바꾸거나 문장을 "더 자연스럽게" 다듬어 버리는 일이 생길 수 있다. 자막은 들리는 그대로가 원칙이다. 고친 다음에는 `srt_tool.py check`와 `cer.py`로 다시 잰다.

## 기획과 대본

이 영역은 사실 설명이 별로 필요 없다. 다만 부업 맥락에서 쓸모 있었던 요청 몇 개를 적어 둔다.

- 고객 채널의 최근 영상 제목 10개를 주고 "다음 숏폼 주제 후보 10개, 각각 첫 3초 대사 포함"
- 긴 대본을 주고 "60초 숏폼 세 개로 나눌 수 있는 구간 후보. 각 구간은 대본 원문 인용으로"
- 견적 메일 초안. 수정 횟수, 납기, 원본 전달 방법, 프로젝트 파일 제공 여부를 빠뜨리지 말 것

**원문 인용으로 달라고 하는 게** 핵심이다. 인용이 있어야 SRT에서 시간을 찾아 컷 목록으로 옮길 수 있다.

## 자동화 스크립트를 짜게 하기

Claude Code나 Codex가 진짜 빛나는 곳은 여기다. 예를 들어 "무음 구간을 찾아서 Final Cut 마커로 넣기" 같은 도구. 요청할 때 **완료 조건을 테스트로** 준다.

```text
ffmpeg silencedetect로 sample.mp4에서 0.5초 이상 무음 구간을 찾아
cuts_to_fcpxml.py와 같은 형식의 FCPXML에 마커로 넣는 silence_markers.py를 만들어 줘.
완료 조건:
1) python3 -I silence_markers.py sample.mp4 -o markers.fcpxml 이 에러 없이 끝난다
2) xmllint --dtdvalid ~/sidegig-lab/dtd/FCPXMLv1_11.dtd markers.fcpxml 통과
3) sample.mp4의 문장 사이 무음(약 0.7초)이 6개 이상 잡힌다
표준 라이브러리와 ffmpeg만 쓴다.
```

완료 조건이 있으면 AI가 스스로 돌려 보고 고친다. 없으면 "만들었습니다"에서 끝난다. 이건 영상 편집만의 이야기는 아니다.

## 커뮤니티 연동 도구들

모두 **커뮤니티 프로젝트**이고, 나는 설치하거나 돌려 보지 않았다(2026-10-12 기준 정보).

- [fcp-mcp-server](https://github.com/DareDev256/fcp-mcp-server): FCPXML 파일을 다루는 MCP 서버. 무음 제거, 러프컷 같은 도구가 있다. README에 Final Cut 내보내기는 스크립트로 못 한다고 적혀 있다. MIT, v0.26.0 (2026-10-09)
- [davinci-resolve-mcp](https://github.com/samuelgursky/davinci-resolve-mcp): Resolve 스크립팅 API를 MCP로 연다. 별 약 3.5k. 다만 Resolve 21.1부터 무료판에서 파이썬 스크립팅이 빠졌다는 보도가 있다([Puget Systems](https://www.pugetsystems.com/blog/2026/09/10/how-davinci-resolve-free-v21-1-scripting-changes-affect-puget-bench/))
- [AdobePremiereProMCP](https://github.com/ayushozha/AdobePremiereProMCP): Premiere용. CEP/ExtendScript로 연결한다. 어도비가 UXP로 옮겨 가는 중이라 오래 쓸 수 있을지는 모르겠다
- [Jumper](https://fcp.cafe/news/20260219/): 상용 영상 검색 도구에 Claude·Codex 데스크톱 앱과 연결하는 실험 기능이 들어갔다는 소식(2026-02-19)

MCP 서버는 편집기 안의 프로젝트를 건드릴 수 있다. 고객 프로젝트에서 처음 써 보는 건 피하자. 복사본 라이브러리에서 먼저 써 본다.

## 아직 고민 중인 것

AI가 컷 목록을 정할 때 무엇을 기준으로 삼아야 하나. 대본만 보면 "말이 재미있는 부분"을 고르지 "그림이 좋은 부분"을 고르지 못한다. 프레임 이미지를 몇 장 같이 주면 나아질 수도 있다. 다음에 실제 의뢰에서 써 보고 기록할 생각이다.

그리고 이건 의견이 갈릴 수 있는데, 고객에게 "AI로 편집합니다"를 밝혀야 할까? 나는 **원본을 어디로 보내는지**는 반드시 밝혀야 한다고 본다. 로컬에서 돌리는 도구라면 그것도 같이 말해 두는 게 신뢰에 도움이 될 것 같다.
