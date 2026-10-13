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
