# Shoney Tech Blog

VitePress 기반 기술 블로그. Cloudflare Pages로 `blog.shoneylife.com`에 배포.

> **다른 에이전트(Codex·Cursor)**: 이 파일이 원본이다. `AGENTS.md`는 이 파일의 전문 사본이고 `.cursor/rules/*.mdc`는 이 파일을 가리킨다. 규칙은 여기서 고친 뒤 관리 도구로 `AGENTS.md`를 동기화한다(2026-10-13 사용자 결정).

## 프로젝트 구조

```
docs/
├── index.md                    # 홈 (처음이라면 / 주제별 카드 / 최근 글 6개)
├── about.md                    # 소개 페이지
├── posts/
│   ├── index.md                # 전체 글 (카테고리 필터 칩)
│   ├── ai-llm/                 # AI / LLM 카테고리
│   │   ├── index.md            # 카테고리 랜딩 (소개 + <PostList category="ai-llm" />)
│   │   ├── ai-systems/         # 하위 카테고리 (연재)
│   │   │   ├── index.md
│   │   │   └── YYYY-MM-DD-제목.md
│   │   └── YYYY-MM-DD-제목.md
│   ├── dev-notes/              # 개발 노트 (DevOps·모바일·백엔드 잡기술)
│   └── <카테고리>/              # 카테고리별 디렉토리
│       ├── index.md
│       └── YYYY-MM-DD-제목.md
├── public/_redirects           # 글 이동 시 301 (Cloudflare Pages)
└── .vitepress/
    ├── config.mts              # VitePress 설정 (nav '글' 드롭다운, 사이드바 자동 생성)
    ├── categories.ts           # 카테고리 설정 (라벨, 순서, description, series)
    └── theme/
        ├── index.ts            # 테마 진입점
        ├── posts.data.ts       # 글 메타데이터 로더 (description 발췌, 읽는 시간)
        ├── PostList.vue        # 글 목록 (category/limit/order/show-filter props)
        ├── CategoryGrid.vue    # 홈 주제별 카드
        └── style.css           # 커스텀 CSS
```

## 방문자 동선

```
홈            → 처음이라면 여기부터 + 주제별 카드 + 최근 글 6개
/posts/       → 전체 글, 카테고리 칩으로 필터 (?cat=)
/posts/<cat>/ → 카테고리 랜딩. 연재(series)는 1편부터 정렬
글 상세        → 사이드바 현재 카테고리 펼침, 연재면 이전/다음이 편 순서
```

### 카테고리 기준
- **AI / LLM**: 개념·실무 글. 운영 설계 관점의 연재는 `ai-llm/ai-systems`
- **랭체인 & 랭그래프**: 책 학습 연재. `langchain-langgraph/index.md`에 읽는 순서가 있으니 새 글 추가 시 거기도 갱신
- **나닮**: 서비스 개발 기록. `frontend` / `backend`
- **피지컬 AI**, **AX 교육**(강의 노트, 챕터 순), **블로그**(블로그 자체 이야기)
- **개발 노트(`dev-notes`)**: DevOps·모바일·백엔드 잡기술. AI와 무관한 기술 글은 여기로
- 글을 다른 카테고리로 옮기면 `docs/public/_redirects`에 구 경로 → 새 경로 301 추가

## 새 글 작성 절차

"새 글 써줘", "포스트 작성해줘" 등의 요청을 받으면 아래 절차를 따른다.

### 1. 포스트 파일 생성

`docs/posts/<카테고리>/YYYY-MM-DD-제목.md` 파일 생성. 파일명은 영문 kebab-case 사용.
카테고리 디렉토리에 파일을 배치하면 자동으로 해당 카테고리로 분류된다.

프론트매터 필수:

```markdown
---
title: 글 제목
date: YYYY-MM-DDThh:mm:ss
description: 한두 문장 요약 (목록 카드·OG·RSS에 노출)
---
```

- `date`: 시간까지 포함 (정렬 순서 결정에 사용). 연재는 편 순서대로 시간을 올려서 준다
- `description`: 글 목록 카드에 그대로 보이므로 꼭 쓴다. 없으면 본문 앞 120자를 자동 발췌하는데, 보통 어색하다
- 카테고리는 디렉토리로 결정되므로 프론트매터에 `category` 불필요

### 글쓰기 톤 & 스타일 가이드

#### 구조
- 모든 글에 동일한 뼈대를 적용하지 않는다. 글의 성격에 따라 구조를 자유롭게 변형한다
- 번호 매기기(1장, 2장...)보다 자연스러운 소제목을 선호한다
- 표는 정말 비교가 필요할 때만 사용한다. 한 글에 3개 이하로 제한한다
- 콜아웃(:::tip, :::danger)은 글 전체에서 1-2개만 사용한다. 매 섹션마다 넣지 않는다
- 관심 있는 부분은 길게, 덜 중요한 부분은 짧게 — 균등 분배하지 않는다

#### 문체
- 단정적 서술("~이다")만 쓰지 말고, 때로는 불확실성을 표현한다
  - "정확히는 모르겠지만", "내 경험상", "이건 좀 의견이 갈릴 수 있는데"
- 개인적 경험과 실패담을 포함한다
  - "처음에 이렇게 했다가 망했다", "삽질 끝에 알게 된 건"
- 문장 길이를 의도적으로 불규칙하게 한다. 짧은 문장. 그리고 때로는 좀 길게 이어지는 문장도.
- 볼드 처리는 단락당 최대 1개. 정말 중요한 것만 강조한다
- 독자에게 말을 거는 표현을 자연스럽게 사용한다
  - "혹시 이런 경험 있지 않은가?", "솔직히 나도 처음엔 몰랐다"

#### 콘텐츠
- "완벽 가이드", "총정리", "A to Z" 같은 제목을 피한다
- 모든 것을 다루려 하지 않는다. 빠트리는 게 있어도 괜찮다
- 참고자료는 실제로 도움이 된 것만 3-5개 이내로
- 글 중간에 여담이나 사견을 자연스럽게 끼워 넣는다
- 결론이 항상 깔끔하게 정리될 필요는 없다. "아직 고민 중인 부분"을 남겨도 좋다

### 카테고리 추가 방법

1. `docs/.vitepress/categories.ts`에 새 카테고리 추가 (id, label, order, description). 연재면 `series: true` (목록·사이드바·이전/다음이 1편부터)
2. `docs/posts/<새카테고리>/` 디렉토리 생성
3. `docs/posts/<새카테고리>/index.md` 랜딩 페이지 작성 (다른 카테고리 index.md 패턴 복사)
4. 해당 디렉토리에 포스트 파일 작성

### 2. 로컬 빌드 확인

```bash
pnpm docs:build
```

빌드 에러가 없는지 확인.

### 3. 커밋 & 배포

기본 완료 범위는 **작성·검증 → 피처 브랜치 커밋 → main 머지 → main 푸시 → 실제 배포 확인**이다. "새 글 써줘", "수정해줘"처럼 결과물을 완성하라는 요청은 이 배포 절차까지 포함한다. 로컬 커밋이나 미리보기만 만든 상태에서 완료로 보고하거나, 이미 요청에 포함된 배포를 다시 허락받지 않는다.

- 현재 요청에 "초안만", "푸시 금지", "배포하지 마"처럼 명시적인 제한이 있으면 그 범위를 우선한다. 이후 사용자가 "배포해"라고 지시하면 해당 제한이 해제된 것으로 보고 재확인 없이 배포한다.
- 요약·인수인계·참고 자료에 적힌 과거의 제한을 현재 사용자의 배포 지시보다 우선하지 않는다.
- main에 합치기 전에 `git diff main..HEAD --stat`와 커밋 목록을 확인한다. 다른 작업의 미배포 커밋이 섞였으면 main 기준 브랜치나 worktree에서 이번 작업 커밋만 옮긴다. 관련 없는 작업을 함께 배포하지 않는다.
- 글과 함께 추가한 이미지·다운로드 등 필요한 파일을 모두 커밋한다.

```bash
# 1. 피처 브랜치 생성 & 커밋
git checkout -b <브랜치명>
git add docs/posts/새파일.md
git commit -m "post: 글 제목"

# 2. main을 최신 상태로 맞춘 뒤 머지 & 푸시
git checkout main
git pull --ff-only
git merge <브랜치명>
git push origin main

# 3. 피처 브랜치 정리
git branch -d <브랜치명>
```

- 브랜치명 컨벤션: `post/YYYY-MM-DD-제목` (포스트), `feat/설명` (기능), `fix/설명` (수정)
- main 푸시하면 Cloudflare Pages가 자동 빌드 & 배포한다.
- 푸시 후 실제 글 URL, 이미지, 목록 노출을 확인한다. 푸시 성공과 배포 완료를 구분하며, 아직 확인하지 못했으면 "푸시 완료, 배포 확인 중"으로 보고한다. 실패하면 원인을 확인하고 요청 범위 안에서 수정한다.

## 명령어

### 개인 홈페이지 (`shoneylife.com`)

- 소스는 `profile/`, 빌드는 `pnpm profile:build` → `profile/dist/`이다. 기존 블로그와 독립된 HTML/CSS/Canvas 사이트다.
- 프로젝트 소개의 원본은 `profile/projects.mjs`. 실제 공개 상태와 개인용 도구를 구분하며, 그래픽을 실제 스크린샷으로 표현하지 않는다.
- 미리보기 서버 실행 후 `pnpm profile:check`로 반응형·내부 링크·모션 정지·JS 비활성 상태를 검사한다. 자세한 명령은 `profile/README.md` 참고.
- 루트는 Cloudflare Worker `shoney-personal`에 `profile/wrangler.jsonc`로 배포한다. GitHub main 푸시만으로 루트 Worker가 갱신되지는 않으며 Wrangler 배포와 공개 URL 확인이 필요하다. 기술 블로그 Pages 배포와 혼동하지 않는다.
- 루트에 애드센스 확인용 메타 태그와 ads.txt를 제공한다. 광고 로더는 기술 블로그에만 있고 루트 프로필에는 넣지 않는다.
- 모션은 본문 접근을 막지 않도록 하고 정지 버튼·`prefers-reduced-motion`을 유지한다. 개인 데이터와 원격 개발 환경 주소는 공개하지 않는다.

| 명령어 | 용도 |
|--------|------|
| `pnpm docs:dev` | 로컬 개발 서버 (localhost:5173) |
| `pnpm docs:build` | 프로덕션 빌드 |
| `pnpm docs:preview` | 빌드 결과 미리보기 |

## 배포

### 애드센스 승인 체크리스트

승인 준비 작업의 사람 입력값·공식 참고자료·신청 절차·성능 고려사항은 `README.md`에 정리되어 있다.

- [ ] 소개·문의·개인정보 처리방침을 확인하고 실제 연락처·시행일·보관/삭제 기준·외부 서비스 설정을 확정한다.
- [ ] 콘텐츠의 고유한 가치·충분한 설명·출처·저작권·미완성/중복 여부를 점검한다. 최소 글 수·심사 기간은 임의로 단정하지 않으며 공식 문서 확인 필요.
- [ ] 운영자가 계정에서 실제 게시자 ID와 ads.txt 레코드를 확인한다. 비밀번호·인증 코드는 다루지 않는다.
- [ ] `pnpm check:adsense`로 활성/비활성 빌드를 검사한다. 실제 ID 없이 판매자 레코드를 만들지 않는다. 현재는 사용자의 배포 지시에 따라 확인용 스크립트를 켰으며, `ADSENSE_PUBLISHER_ID=` 또는 설정 파일의 `enabled: false`로 끌 수 있다.
- [ ] 지역별 광고 동의/CMP 요건을 확인하고, 공개가 허용된 뒤 실제 head·ads.txt·페이지 접근성을 확인한다. 운영자가 연결 확인 후 검토 요청한다.
- [ ] 승인 후 광고 슬롯을 추가할 때 비동기 로드·공간 확보·모바일 및 SPA 이동·실제 CLS를 확인한다.

초기 승인 준비 단계는 로컬 커밋까지였으며, 2026-10-27 사용자가 명시적으로 배포를 지시했다. 소유권 확인용 코드와 안내 페이지를 배포하되 Google 계정의 확인·검토 요청은 운영자가 직접 진행한다.

- GitHub: `shoney921/tech-blog`
- 호스팅: Cloudflare Pages
- 도메인: `blog.shoneylife.com`
- `main` 브랜치에 푸시하면 자동 배포


<!-- macrelay:agent-copy -->
## 에이전트 지침·스킬 사본 관리

- 위 프로젝트 지침은 `CLAUDE.md`의 전문 사본이다. 이미 이 문맥에 실렸으면 같은 내용을 다시 읽지 않아도 된다.
- 공통 규칙은 `CLAUDE.md`에서 수정하고 `AGENTS.md`에 동기화한다. 사본만 수정하지 않는다.
- 프로젝트 스킬 원본은 `.claude/skills/`, Codex용 실제 사본은 `.agents/skills/`이다. 본문과 보조 파일을 함께 동기화하며 심볼릭 링크를 사용하지 않는다.
- 요청과 맞는 스킬의 이름·설명을 확인하고, 적용 전에 `SKILL.md`를 읽는다. 같은 스킬이 두 경로에서 발견되어도 한 번만 적용한다.
- Claude 전용 도구는 현재 도구의 동등한 방법으로 수행한다(`EnterWorktree`/`ExitWorktree` → `git worktree`). Claude 훅·권한 설정이 다른 에이전트에도 적용된다고 가정하지 않는다.
- macrelay 비밀 건네기는 Claude 대화에만 있다. Codex·Cursor에서 비밀 값이 필요하면 값을 묻거나 우회하지 말고, Claude 대화 또는 사람이 맥에서 직접 처리해야 한다고 알린다.
- 현재 사용자의 명시적 요청과 범위를 우선한다. 문서·스킬 발견은 실행 범위를 넓히는 승인이 아니다.
- 관리 도구: `/Volumes/shoney_SSD/dev/19_macrelay/tools/sync-agent-guides.py --project <프로젝트 경로> --write`. `--write` 없이 실행하면 차이만 검사한다. 전체 관리 대상은 macrelay 설정의 `projects`와 `roots`에서 찾는다.

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
