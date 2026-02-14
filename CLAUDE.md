# Shoney Tech Blog

VitePress 기반 기술 블로그. Cloudflare Pages로 `blog.shoneylife.com`에 배포.

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
