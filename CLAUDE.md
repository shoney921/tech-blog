# Shoney Tech Blog

VitePress 기반 기술 블로그. Cloudflare Pages로 `blog.shoneylife.com`에 배포.

> **Cursor 사용 시**: 동일 내용이 `.cursor/rules/`에 룰로 등록되어 있어, 채팅/에이전트에서 자동으로 참고됩니다. 프로젝트 룰(`shoney-tech-blog.mdc`)은 항상 적용, 글쓰기 스타일(`post-writing-style.mdc`)은 `docs/posts/**/*.md` 작업 시 적용됩니다.

## 프로젝트 구조

```
docs/
├── index.md                    # 홈페이지
├── about.md                    # 소개 페이지
├── posts/
│   ├── index.md                # 글 목록 (PostList 컴포넌트로 자동 생성)
│   ├── ai-llm/                 # AI / LLM 카테고리
│   │   └── YYYY-MM-DD-제목.md
│   ├── blog/                   # 블로그 카테고리
│   │   └── YYYY-MM-DD-제목.md
│   └── <카테고리>/              # 카테고리별 디렉토리
│       └── YYYY-MM-DD-제목.md
└── .vitepress/
    ├── config.mts              # VitePress 설정
    ├── categories.ts           # 카테고리 설정 (한글명, 순서)
    └── theme/
        ├── index.ts            # 테마 진입점
        └── style.css           # 커스텀 CSS
```

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
---
```

- `date`: 시간까지 포함 (정렬 순서 결정에 사용)
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

1. `docs/.vitepress/categories.ts`에 새 카테고리 추가 (id, label, order)
2. `docs/posts/<새카테고리>/` 디렉토리 생성
3. 해당 디렉토리에 포스트 파일 작성

### 2. 로컬 빌드 확인

```bash
pnpm docs:build
```

빌드 에러가 없는지 확인.

### 3. 커밋 & 배포

작업 완료 시 피처 브랜치에서 커밋 후 main에 머지하고 푸시한다.

```bash
# 1. 피처 브랜치 생성 & 커밋
git checkout -b <브랜치명>
git add docs/posts/새파일.md
git commit -m "post: 글 제목"

# 2. main에 머지 & 푸시
git checkout main
git merge <브랜치명>
git push

# 3. 피처 브랜치 정리
git branch -d <브랜치명>
```

- 브랜치명 컨벤션: `post/YYYY-MM-DD-제목` (포스트), `feat/설명` (기능), `fix/설명` (수정)
- main 푸시하면 Cloudflare Pages가 자동 빌드 & 배포한다.

## 명령어

| 명령어 | 용도 |
|--------|------|
| `pnpm docs:dev` | 로컬 개발 서버 (localhost:5173) |
| `pnpm docs:build` | 프로덕션 빌드 |
| `pnpm docs:preview` | 빌드 결과 미리보기 |

## 배포

- GitHub: `shoney921/tech-blog`
- 호스팅: Cloudflare Pages
- 도메인: `blog.shoneylife.com`
- `main` 브랜치에 푸시하면 자동 배포
