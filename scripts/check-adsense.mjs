import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = path.join(root, 'docs/.vitepress/dist')
const env = { ...process.env, ADSENSE_PUBLISHER_ID: '' }
const testId = `pub-${'0'.repeat(16)}` // Local fixture only; never a seller record.
const markers = /adsbygoogle|pagead2\.googlesyndication\.com|ca-pub-/

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? files(file) : [file]
  })
}

function build(publisherId) {
  execFileSync('pnpm', ['docs:build'], {
    cwd: root, env: { ...env, ADSENSE_PUBLISHER_ID: publisherId }, stdio: 'inherit',
  })
}

function checkDisabled() {
  const output = files(dist).filter(file => /\.(html|js)$/.test(file))
  assert(output.length > 0, 'Build output missing')
  for (const file of output) assert(!markers.test(readFileSync(file, 'utf8')), `Ad code in ${file}`)
  for (const route of ['about', 'privacy', 'contact']) {
    const html = readFileSync(path.join(dist, `${route}.html`), 'utf8')
    assert(/<h1\b/.test(html), `${route}: page heading missing`)
    for (const link of ['about', 'privacy', 'contact']) {
      assert(html.includes(`href="/${link}"`), `${route}: missing ${link} link`)
    }
  }
  const source = readFileSync(path.join(root, 'docs/public/ads.txt'), 'utf8')
  assert.equal(readFileSync(path.join(dist, 'ads.txt'), 'utf8'), source)
  // Accept real seller records once configured, but never a test ID or placeholder.
  const records = source.split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean)
  for (const record of records) {
    assert(!record.includes(testId), 'Test ID must never be written to ads.txt')
    assert(/^google\.com,\s*pub-\d{16},\s*DIRECT,\s*[a-f0-9]+$/i.test(record), 'Review ads.txt record')
  }
  console.log(`PASS default: ${output.length} HTML/JS files without ad code; pages, links and ads.txt checked`)
}

try {
  build(testId)
  const htmlFiles = files(dist).filter(file => file.endsWith('.html'))
  assert(htmlFiles.length > 0)
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8')
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
    const scripts = head.match(/<script\b[^>]*\bsrc="[^"]*adsbygoogle\.js[^"]*"[^>]*>/g) ?? []
    assert.equal(scripts.length, 1, `Expected exactly one loader in head: ${file}`)
    assert(scripts[0].includes(`client=ca-${testId}`), `Wrong test client: ${file}`)
    assert(/\sasync(?:[\s=>])/.test(scripts[0]), `Missing async: ${file}`)
    assert(scripts[0].includes('crossorigin="anonymous"'), `Missing crossorigin: ${file}`)
  }
  console.log(`PASS enabled: one async loader in head of ${htmlFiles.length} HTML pages`)
  let rejected = false
  try {
    execFileSync('pnpm', ['docs:build'], {
      cwd: root, env: { ...env, ADSENSE_PUBLISHER_ID: 'invalid' }, stdio: 'pipe',
    })
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    assert.match(output, /ADSENSE_PUBLISHER_ID must use pub-/)
    rejected = true
  }
  assert(rejected, 'Invalid publisher ID must fail the build')
  console.log('PASS invalid ID rejected')
} finally {
  // Leave local preview safe even if the enabled-build checks fail.
  build('')
  checkDisabled()
}
