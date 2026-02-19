import { expect, test } from '@playwright/test';

/*
 * 히어로 배너 이미지(1344×768)의 왼쪽 위 흰색 영역 안에
 * 텍스트가 nav 바 아래에서 시작하는지 뷰포트별로 검증한다.
 */

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1200, height: 768 },
];

test.describe('히어로 텍스트가 nav 아래, 왼쪽 위 흰색 영역에 위치', () => {
  for (const vp of viewports) {
    test(`${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const hero = page.locator('.VPHome .VPHero');
      await expect(hero).toBeVisible();

      const nav = page.locator('.VPNav');
      const navBox = await nav.boundingBox();
      const heroBox = await hero.boundingBox();
      const main = page.locator('.VPHome .VPHero .main');
      const mainBox = await main.boundingBox();

      if (!navBox || !heroBox || !mainBox) throw new Error('Element not found');

      const navBottom = navBox.y + navBox.height;

      // 텍스트가 nav 바 아래에서 시작
      expect(mainBox.y).toBeGreaterThanOrEqual(navBottom);

      // 텍스트가 왼쪽에 타이트하게 위치 (왼쪽 여백 10% 이내)
      const leftRatio = (mainBox.x - heroBox.x) / heroBox.width;
      expect(leftRatio).toBeLessThan(0.1);

      // 텍스트 오른쪽 끝이 히어로 너비의 52% 이내 (흰색 안전 영역)
      const rightEdge = (mainBox.x - heroBox.x + mainBox.width) / heroBox.width;
      expect(rightEdge).toBeLessThan(0.52);
    });
  }

  test('데스크톱 히어로 비율 유지 (약 0.57)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 768 });
    await page.goto('/');

    const hero = page.locator('.VPHome .VPHero');
    const heroBox = await hero.boundingBox();
    if (!heroBox) throw new Error('Hero bounding box not found');

    const aspectRatio = heroBox.height / heroBox.width;
    expect(aspectRatio).toBeGreaterThan(0.5);
    expect(aspectRatio).toBeLessThan(0.65);
  });
});
