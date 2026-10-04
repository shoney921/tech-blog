import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1200]) {
  test(`브랜드와 반응형 홈 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page).toHaveTitle(/멸종 위기 개발자/);
    await expect(page.locator('.VPNavBarTitle')).toContainText('멸종 위기 개발자');
    await expect(page.locator('.VPHero .tagline')).toBeVisible();
    const image = page.locator('.VPHero .image-src');
    await expect(image).toBeVisible();
    expect(await image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    const main = await page.locator('.VPHero .main').boundingBox();
    const art = await image.boundingBox();
    expect(main).not.toBeNull();
    const nav = await page.locator(".VPNav").boundingBox();
    expect(main!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
    expect(art).not.toBeNull();
    if (width < 960) expect(art!.y).toBeGreaterThanOrEqual(main!.y + main!.height);
    else expect(art!.x).toBeGreaterThanOrEqual(main!.x + main!.width);
    await page.screenshot({ path: `test-results/brand-${width}.png`, fullPage: false });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: `test-results/brand-${width}-dark.png`, fullPage: false });
  });
}
