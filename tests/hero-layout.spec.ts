import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1330]) {
  test(`브랜드와 반응형 홈 (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
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
    const title = page.locator(".hero-artwork-title");
    await expect(title).toContainText("멸종 위기");
    await expect(title).toContainText("개발자");
    const titleBox = await title.boundingBox();
    const figure = await page.locator(".hero-artwork").boundingBox();
    expect(titleBox!.y).toBeGreaterThanOrEqual(figure!.y);
    expect(titleBox!.y + titleBox!.height).toBeLessThan(art!.y + art!.height);
    // Copy and actions occupy the same image banner, with no separate column.
    expect(main!.x).toBeGreaterThanOrEqual(art!.x);
    expect(main!.y).toBeGreaterThanOrEqual(figure!.y);
    expect(main!.x + main!.width).toBeLessThanOrEqual(art!.x + art!.width + 1);
    expect(main!.y + main!.height).toBeLessThanOrEqual(figure!.y + figure!.height + 1);
    const heading = await page.locator(".VPHero .heading").boundingBox();
    expect(titleBox!.y + titleBox!.height).toBeLessThan(heading!.y);
    const tagline = await page.locator(".VPHero .tagline").boundingBox();
    const button = await page.locator(".VPHero .actions a").first().boundingBox();
    expect(Math.abs(heading!.x - tagline!.x)).toBeLessThan(1);
    expect(Math.abs(heading!.x - button!.x)).toBeLessThan(1);
    await page.screenshot({ path: `test-results/brand-${width}.png`, fullPage: false });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: `test-results/brand-${width}-dark.png`, fullPage: false });
  });
}
