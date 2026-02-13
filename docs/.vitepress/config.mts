import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Shoney Tech Blog',
  description: '개발 경험과 기술 이야기를 공유합니다',
  lang: 'ko-KR',
  cleanUrls: true,
  lastUpdated: false,

  sitemap: {
    hostname: 'https://blog.shoneylife.com',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#5b6af0' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'Shoney Tech Blog' }],
  ],

  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '소개', link: '/about' },
    ],

    sidebar: [
      {
        text: '전체 글',
        link: '/',
      },
      {
        text: 'AI / LLM',
        collapsed: false,
        items: [
          { text: 'RAG vs Graph RAG', link: '/posts/2026-02-13-rag-vs-graph-rag' },
        ],
      },
      {
        text: '블로그',
        collapsed: false,
        items: [
          { text: 'Hello World', link: '/posts/2026-02-13-hello-world' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shoney' },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '검색', buttonAriaLabel: '검색' },
          modal: {
            displayDetails: '상세 목록 표시',
            resetButtonTitle: '검색 초기화',
            backButtonTitle: '검색 닫기',
            noResultsText: '검색 결과 없음',
            footer: {
              selectText: '선택',
              navigateText: '탐색',
              closeText: '닫기',
            },
          },
        },
      },
    },

    docFooter: {
      prev: '이전 글',
      next: '다음 글',
    },

    outline: {
      label: '목차',
    },


    notFound: {
      title: '페이지를 찾을 수 없습니다',
      quote: '요청하신 페이지가 존재하지 않습니다.',
      linkLabel: '홈으로 돌아가기',
      linkText: '홈으로',
    },

    footer: {
      message: 'Shoney Tech Blog',
      copyright: `© ${new Date().getFullYear()} Shoney. All rights reserved.`,
    },
  },
})
