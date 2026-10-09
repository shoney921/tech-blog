import { expect, test } from '@playwright/test';

const POST = '/posts/dev-notes/2026-10-05-fcm-push-notifications';

test('글 페이지: 읽기 진행 막대가 스크롤을 따라 찬다', async ({ page }) => {
  await page.goto(POST);
  const bar = page.locator('.reading-progress');
  await expect(bar).toHaveCount(1);
  const scale = () =>
    bar.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  const box = await bar.boundingBox();
  expect(box!.y).toBe(0);
  expect(await scale()).toBeLessThan(0.05);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(scale).toBeGreaterThan(0.95);
});

test('목록 페이지에는 진행 막대가 없다', async ({ page }) => {
  await page.goto('/posts/');
  await expect(page.locator('.post-item').first()).toBeVisible();
  await expect(page.locator('.reading-progress')).toHaveCount(0);
});

test('홈: 등장 애니메이션은 끝나면 멈추고 카드가 그대로 보인다', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(5000);
  const running = await page.evaluate(() =>
    document.getAnimations().filter(a => a.playState === 'running').length,
  );
  expect(running).toBe(0);
  const item = page.locator('.post-item').first();
  expect(await item.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test.describe('prefers-reduced-motion', () => {
  test('장식 애니메이션과 hover 이동이 꺼진다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('load');
    const names = await page.evaluate(() =>
      document.getAnimations().map(a => (a as CSSAnimation).animationName).filter(Boolean),
    );
    expect(names).toEqual([]);
    const card = page.locator('.category-card').first();
    // hover 가 스크롤을 건드리므로 문서 기준 좌표로 비교한다
    const top = () => card.evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const before = await top();
    await card.hover();
    await page.waitForTimeout(300);
    expect(await top()).toBe(before);
  });
});
