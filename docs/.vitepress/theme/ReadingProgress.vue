<!-- 글 상단 읽기 진행 막대. CSS 스크롤 연동 애니메이션만 써서 JS·스크롤 리스너가 없다.
     지원하지 않는 브라우저(Firefox 기본값 등)에서는 막대 자체를 숨긴다. -->
<template>
  <div class="reading-progress" aria-hidden="true" />
</template>

<style scoped>
.reading-progress {
  display: none;
}

@supports (animation-timeline: scroll()) {
  .reading-progress {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: calc(var(--vp-z-index-nav) + 1);
    height: 3px;
    background: var(--vp-c-brand-1);
    transform-origin: 0 50%;
    transform: scaleX(0);
    pointer-events: none;
    animation: reading-progress linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes reading-progress {
  to { transform: scaleX(1); }
}
</style>
