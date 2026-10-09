# AGENTS.md — Codex · Cursor 등 다른 에이전트의 진입 문서

- 이 저장소의 규칙 원본은 같은 폴더의 [`CLAUDE.md`](CLAUDE.md)다. 작업을 시작하기 전에 끝까지 읽고 따른다. 이미 전체 내용이 지금 문맥에 들어 있으면(Cursor 가 규칙으로 실었을 때 등) 다시 읽지 않아도 된다. Codex 는 이 파일만 자동으로 싣고 `CLAUDE.md` 는 싣지 않는다(2026-10-09 `codex debug prompt-input` 으로 확인).
- 규칙을 바꿀 때는 `CLAUDE.md` 를 고친다. 이 파일에는 원본 규칙을 옮겨 적지 않고 Claude 밖에서 달라지는 점만 적는다. 둘이 어긋나 보이면 `CLAUDE.md` 를 따른다 — 아래 "Claude 밖에서" 항목은 원본 규칙을 다른 에이전트에서 지키는 방법이라 예외다. `CLAUDE.md` 는 이 파일을 읽으라고 하지 않는다(참조 순환 없음).
- 지금 사용자의 분명한 요청과 범위가 먼저다. 문서를 읽거나 스킬을 찾았다고 요청 범위가 넓어지지 않는다.

## Claude 밖에서

- Claude Code 의 훅·권한(`.claude/settings*.json`)은 다른 에이전트에 적용되지 않는다. 그 장치가 지키던 규칙은 스스로 지킨다.
- macrelay 의 비밀 건네기 도구(`secret`, 폰 카드)는 클로드 대화에만 붙는다. 비밀 값이 필요하면 값을 묻거나 우회하지 말고 멈춰서, 클로드 대화에서 하거나 사람이 맥에서 직접 넣어야 한다고 알린다.
- `.cursor/rules/*.mdc` 는 Cursor 가 싣는 연결 파일일 뿐 내용은 `CLAUDE.md` 를 가리킨다(예전 사본은 원본과 어긋나 있어서 2026-10-09 에 정리했다 — 아래).
- 사용자가 Claude 에서 쓰는 `/blog`·`/publish` 는 사용자 홈의 Claude 명령(`~/.claude/commands/`)이라 이 저장소에 없고, 다른 에이전트는 부를 수 없다. 글을 쓰라는 요청이면 `CLAUDE.md` 의 "새 글 작성 절차"를 따른다.
- 이 저장소에는 프로젝트 스킬·훅이 없다.

## 어긋났던 것 — 원본(`CLAUDE.md`)을 따른다

예전 `.cursor/rules/shoney-tech-blog.mdc` 사본과 원본이 달랐다. 아래는 원본 쪽이 맞다:
- 커밋 흐름: 피처 브랜치 커밋 → main 에 머지 → main 푸시(사본은 "피처 브랜치를 원격에 푸시 → main 머지").
- 프론트매터: `description` 도 필수(사본에는 없었다).
- 카테고리 추가: `description`·연재(`series`)·카테고리 `index.md` 랜딩·글을 옮기면 `docs/public/_redirects` (사본에는 없었다).
