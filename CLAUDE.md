# Shoney Tech Blog

VitePress 기반 기술 블로그. Cloudflare Pages로 `blog.shoneylife.com`에 배포.

## 프로젝트 구조

```
docs/
├── index.md                    # 홈페이지
├── about.md                    # 소개 페이지
├── posts/
│   ├── index.md                # 글 목록 (PostList 컴포넌트로 자동 생성)
│   └── YYYY-MM-DD-제목.md      # 포스트
└── .vitepress/
    ├── config.mts              # VitePress 설정
    └── theme/
        ├── index.ts            # 테마 진입점
        └── style.css           # 커스텀 CSS
```

## 새 글 작성 절차

"새 글 써줘", "포스트 작성해줘" 등의 요청을 받으면 아래 절차를 따른다.

### 1. 포스트 파일 생성

`docs/posts/YYYY-MM-DD-제목.md` 파일 생성. 파일명은 영문 kebab-case 사용.

프론트매터 필수:

```markdown
---
title: 글 제목
date: YYYY-MM-DD
---
```

### 2. 로컬 빌드 확인

```bash
pnpm docs:build
```

빌드 에러가 없는지 확인.

### 3. 커밋 & 푸시

사용자가 요청하면 커밋하고 푸시한다.

```bash
git add docs/posts/새파일.md
git commit -m "post: 글 제목"
git push
```

푸시하면 Cloudflare Pages가 자동 빌드 & 배포한다.

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
