import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from '../profile/projects.mjs'

const source = fileURLToPath(new URL('../profile/', import.meta.url))
const output = path.join(source, 'dist')
const origin = 'https://shoneylife.com'
const publisher = JSON.parse(readFileSync(new URL('../docs/.vitepress/adsense.config.json', import.meta.url), 'utf8')).publisherId
if (!/^pub-\d{16}$/.test(publisher)) throw new Error('A real publisher ID is required for ownership metadata')
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
cpSync(path.join(source, 'assets'), path.join(output, 'assets'), { recursive: true })
let home = readFileSync(path.join(source, 'home.html'), 'utf8')
home = home.replace(/ca-pub-\d{16}/g, `ca-${publisher}`)
writeFileSync(path.join(output, 'index.html'), home)

const header = `<a class="skip-link" href="#main">본문으로 바로가기</a><header class="site-header wrap"><a class="wordmark" href="/" aria-label="Shoney 홈">shoney<span class="brand-star" aria-hidden="true">✳</span></a><nav aria-label="주요 메뉴"><a href="/#work">만든 것</a><a href="/#notes">기록</a><a href="/#about">소개</a></nav><a class="header-contact" href="mailto:ddmczp@naver.com">이야기 나누기 ↗</a></header>`
const footer = `<footer class="site-footer wrap"><a class="wordmark" href="/">shoney<span class="brand-star" aria-hidden="true">✳</span></a><span class="footer-note">생각하고, 만들고, 다시 배웁니다.</span><div><a href="https://github.com/shoney921">GitHub ↗</a><a href="/privacy/">개인정보 안내</a><span>© <span data-year>2026</span> Shoney</span></div></footer>`
const shell = (title, description, route, content) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#eeeee8"><meta name="description" content="${escape(description)}"><meta name="google-adsense-account" content="ca-${publisher}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${origin}${route}"><meta property="og:image" content="${origin}/assets/social.png"><link rel="canonical" href="${origin}${route}"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/style.css"><title>${escape(title)}</title><script type="module" src="/assets/main.js"></script></head><body>${header}<main id="main" class="case-main wrap">${content}</main>${footer}<button class="motion-toggle" type="button" aria-pressed="false" aria-label="모션 정지"><span aria-hidden="true">Ⅱ</span><span class="motion-label">모션 정지</span></button></body></html>`
for (const project of projects) {
  const next = projects.find(p => p.id === project.next)
  const sections = project.sections.map(([title, paragraphs]) => `<section><h2>${escape(title)}</h2>${paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</section>`).join('')
  const content = `<a class="case-back" href="/#work">↖ <span>모든 프로젝트</span></a><div class="case-heading"><p class="eyebrow">PERSONAL PROJECT / ${escape(project.type)}</p><h1>${escape(project.name)}</h1><p class="case-tagline">${escape(project.tagline)}</p><div class="case-meta">${project.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div></div><div class="case-banner"><strong>${project.phrase}</strong><span aria-hidden="true">✳</span></div><div class="case-reading">${sections}<section><h2>프로젝트 상태</h2><p class="case-status">${escape(project.status)}</p></section><a class="button button-dark" href="${escape(project.link.href)}">${escape(project.link.label)} <span aria-hidden="true">↗</span></a><a class="case-next" href="/projects/${next.id}/"><div><span>NEXT PROJECT</span><strong style="display:block;margin-top:10px">${escape(next.name)}</strong></div><span aria-hidden="true">↗</span></a></div>`
  const dir = path.join(output, 'projects', project.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), shell(`${project.name} — Shoney`, project.tagline, `/projects/${project.id}/`, content))
}
const privacy = `<a class="case-back" href="/">↖ <span>홈으로</span></a><div class="case-heading"><p class="eyebrow">YOUR PRIVACY</p><h1 style="font-size:clamp(35px,6vw,70px)">개인정보 안내</h1><p class="case-tagline">개인 홈페이지 이용과 외부 서비스에 관한 안내입니다.</p></div><div class="case-reading"><section><h2>이 사이트에 대해</h2><p>Shoney가 개인적으로 운영하는 프로필·프로젝트 소개 사이트입니다. 별도의 회원가입, 댓글, 문의 입력 폼을 제공하지 않습니다. 자체 분석 도구나 광고 게재 스크립트를 사용하지 않으며, Google AdSense 사이트 소유권 확인을 위한 메타 태그만 포함합니다.</p></section><section><h2>호스팅과 이용 설정</h2><p>사이트 파일은 Cloudflare를 통해 제공됩니다. 페이지 요청 과정에서 IP 주소와 브라우저 등 접속 정보가 Cloudflare에 전달될 수 있습니다. 해당 서비스의 처리 방식은 <a class="text-link" href="https://www.cloudflare.com/privacypolicy/">Cloudflare 개인정보 안내 ↗</a>에서 확인할 수 있습니다.</p><p>모션 정지 여부는 현재 브라우저 탭의 sessionStorage에 저장합니다. 이 설정은 서버로 전송하지 않습니다. 브라우저의 모션 줄이기 설정도 반영합니다.</p></section><section><h2>이메일과 외부 링크</h2><p>이메일 링크를 누르면 사용자의 메일 앱이 열립니다. 문의를 보내면 발신 주소와 문의 내용이 네이버 메일을 통해 운영자에게 전달됩니다. 문의 자료의 보관·삭제 기준은 운영자가 확정해야 할 항목이며, 현재 임의의 기간이나 자동 삭제를 약속하지 않습니다.</p><p>기술 블로그, GitHub 등 외부 사이트로 이동하면 각 서비스의 개인정보 안내가 적용됩니다.</p></section><section><h2>문의</h2><p>개인정보 관련 문의는 <a class="text-link" href="mailto:ddmczp@naver.com">ddmczp@naver.com ↗</a>으로 보내 주세요. 비밀번호나 인증 코드 등 민감한 정보는 보내지 마세요.</p><p>안내 작성일: 2026년 10월 27일. 사이트의 기능이나 정보 처리 방식이 달라지면 이 안내를 갱신합니다.</p></section></div>`
mkdirSync(path.join(output, 'privacy'), { recursive: true })
writeFileSync(path.join(output, 'privacy/index.html'), shell('개인정보 안내 — Shoney', '개인 홈페이지의 호스팅, 이용 설정, 이메일 및 외부 링크에 관한 안내입니다.', '/privacy/', privacy))
writeFileSync(path.join(output, '404.html'), shell('페이지를 찾을 수 없습니다 — Shoney', '요청한 페이지가 없습니다.', '/404', '<div class="case-heading"><p class="eyebrow">404 / A WRONG TURN</p><h1>여기는 아직<br>만들지 않았어요.</h1><p class="case-tagline">찾으시는 페이지가 없거나 주소가 변경됐습니다.</p><a class="text-link" href="/">홈으로 돌아가기 ↗</a></div>'))
writeFileSync(path.join(output, 'ads.txt'), `# Same publisher as blog.shoneylife.com\ngoogle.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`)
writeFileSync(path.join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
const routes = ['/', ...projects.map(p => `/projects/${p.id}/`), '/privacy/']
writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${origin}${route}</loc></url>`).join('')}</urlset>`)
writeFileSync(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/assets/*\n  Cache-Control: public, max-age=3600\n')
console.log(`Built personal site: ${routes.length} pages + 404, assets, root ads.txt and sitemap → profile/dist`)
