---
title: Hello World - 블로그를 시작합니다
date: 2026-02-13
---

# Hello World - 블로그를 시작합니다

첫 번째 포스트입니다. 이 블로그는 [VitePress](https://vitepress.dev/)로 만들었고, [Cloudflare Pages](https://pages.cloudflare.com/)에 배포했습니다.

## 기술 스택

이 블로그는 다음 기술로 구성되어 있습니다:

```yaml
framework: VitePress
hosting: Cloudflare Pages
domain: blog.shoneylife.com
```

## 코드 하이라이팅 예시

VitePress는 [Shiki](https://shiki.style/)를 사용한 코드 하이라이팅을 지원합니다.

```typescript
interface BlogPost {
  title: string
  date: string
  tags?: string[]
}

function getLatestPosts(posts: BlogPost[], count: number): BlogPost[] {
  return posts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count)
}
```

::: tip
VitePress는 마크다운 기반으로 콘텐츠를 작성할 수 있어 블로그에 적합합니다.
:::

::: info
더 많은 글이 곧 올라올 예정입니다.
:::

## 앞으로의 계획

- 개발하면서 배운 것들을 꾸준히 기록
- 프로젝트 경험 공유
- 유용한 도구와 팁 소개
