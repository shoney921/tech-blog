import { chromium, expect } from '@playwright/test'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const base = process.env.PROFILE_BASE_URL || 'http://127.0.0.1:4174'
const browser = await chromium.launch()
const screenshots = 'test-results/profile'
mkdirSync(screenshots, { recursive: true })
const errors = []
try {
  const page = await browser.newPage()
  page.on('pageerror', error => errors.push(error.message))
  // Ad and analytics hosts are never required to render this personal website.
  const origin = new URL(base).origin
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  await page.addInitScript(() => {
    window.__profileCLS = 0
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__profileCLS += entry.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const response = await page.goto(base, { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('호기심을,')
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await page.locator('canvas').evaluate(node => node.width > 0 && node.height > 0)).toBe(true)
    await page.screenshot({ path: `${screenshots}/home-${width}.png`, fullPage: false })
    await page.getByRole('link', { name: /만든 것 살펴보기/ }).click()
    await expect(page.locator('#work h2')).toBeInViewport()
    const pause = page.getByRole('button', { name: '모션 정지', exact: true })
    await pause.click()
    await expect(page.getByRole('button', { name: '모션 재생', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.screenshot({ path: `${screenshots}/full-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '모션 재생', exact: true }).click()
    // Stability is measured before user scrolling, then reset by each navigation.
    expect(await page.evaluate(() => window.__profileCLS)).toBeLessThan(.1)
    console.log(`PASS viewport ${width}px: headline, canvas, anchor, pause control, no overflow, CLS < 0.1`)
  }
  for (const id of ['nadarm', 'macrelay', 'cutroom', 'darkroom']) {
    const response = await page.goto(`${base}/projects/${id}/`, { waitUntil: 'networkidle' })
    expect(response.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.case-reading section')).toHaveCount(4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `${screenshots}/case-${id}.png`, fullPage: true })
  }
  await page.goto(`${base}/privacy/`)
  await expect(page.getByRole('link', { name: /ddmczp@naver.com/ }).first()).toBeVisible()
  for (const file of ['ads.txt', 'robots.txt', 'sitemap.xml']) {
    const response = await page.request.get(`${base}/${file}`)
    expect(response.status()).toBe(200)
    if (file === 'ads.txt') expect(await response.text()).toContain('google.com, pub-6054380963868861, DIRECT, f08c47fec0942fa0')
  }
  // All internal page and asset references must resolve without relying on JS.
  const htmlFiles = []
  function collect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) collect(file)
      else if (file.endsWith('.html') && !file.endsWith('404.html')) htmlFiles.push(file)
    }
  }
  collect('profile/dist')
  const urls = new Set()
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8')
    expect(html).not.toMatch(/adsbygoogle\.js|googletagmanager|google-analytics/)
    const pathname = path.relative('profile/dist', file).replace(/index\.html$/, '')
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(match[1], `${base}/${pathname}`)
      if (url.origin === origin) { url.hash = ''; urls.add(url.href) }
    }
  }
  for (const url of urls) expect((await page.request.get(url)).ok(), url).toBe(true)
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 375, height: 900 } })
  const rp = await reduced.newPage()
  await rp.goto(base, { waitUntil: 'networkidle' })
  await expect(rp.locator('html')).toHaveClass(/motion-paused/)
  const before = await rp.locator('canvas').evaluate(c => c.toDataURL())
  await rp.waitForTimeout(250)
  expect(await rp.locator('canvas').evaluate(c => c.toDataURL())).toBe(before)
  await rp.locator('#notes').scrollIntoViewIfNeeded()
  await expect(rp.locator('#notes h2')).toBeVisible()
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } })
  const np = await nojs.newPage()
  await np.goto(base)
  await expect(np.locator('h1')).toBeVisible()
  await np.locator('#work').scrollIntoViewIfNeeded()
  await expect(np.locator('#work h2')).toBeVisible()
  expect(errors).toEqual([])
  console.log(`PASS: 4 project stories, privacy, ${urls.size} local URLs, root ads.txt, reduced motion stops canvas, content works without JS; no browser errors`)
} finally {
  await browser.close()
}
