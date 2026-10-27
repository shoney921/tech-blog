// Motion is decorative: no scroll hijacking, trackers, or third-party runtime.
const root = document.documentElement
const media = matchMedia('(prefers-reduced-motion: reduce)')
const toggle = document.querySelector('.motion-toggle')
let saved
try { saved = sessionStorage.getItem('shoney-motion') } catch {}
let paused = media.matches || saved === 'paused'
let renderStill = () => {}

function setMotion(value) {
  paused = value
  root.classList.toggle('motion-paused', value)
  toggle?.setAttribute('aria-pressed', String(value))
  toggle?.setAttribute('aria-label', value ? '모션 재생' : '모션 정지')
  const label = toggle?.querySelector('.motion-label')
  if (label) label.textContent = value ? '모션 재생' : '모션 정지'
  if (toggle?.firstElementChild) toggle.firstElementChild.textContent = value ? '▷' : 'Ⅱ'
  renderStill()
}
setMotion(paused)
toggle?.addEventListener('click', () => {
  setMotion(!paused)
  try { sessionStorage.setItem('shoney-motion', paused ? 'paused' : 'playing') } catch {}
})
media.addEventListener('change', event => setMotion(event.matches))
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()) })

// Install reveal styling only after the observer is ready.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('in-view')
      observer.unobserve(entry.target)
    }
  }, { threshold: 0.07, rootMargin: '0px 0px -12px 0px' })
  document.querySelectorAll('.reveal').forEach(node => observer.observe(node))
  root.classList.add('motion-ready')
}

const canvas = document.querySelector('#idea-canvas')
if (canvas instanceof HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: true })
  if (context) {
    const host = canvas.parentElement
    const points = []
    const fine = matchMedia('(pointer: fine)').matches
    const mobile = matchMedia('(max-width: 540px)').matches
    const rings = mobile ? 48 : 66
    const sides = mobile ? 28 : 38
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
      const u = i / rings * Math.PI * 2
      const v = j / sides * Math.PI * 2
      const r = 1.1 + .36 * Math.cos(v)
      // A toroidal form folded through two axes, like an idea becoming a shape.
      const wave = .17 * Math.sin(3 * u)
      points.push({ x: r * Math.cos(u), y: r * Math.sin(u), z: .4 * Math.sin(v) + wave, group: j % 6 === 0 })
    }
    let width = 0, height = 0, angle = .4, time = 0
    let pointer = { x: 0, y: 0 }, current = { x: 0, y: 0 }
    let visible = true, frame = 0, previous = 0
    const resize = () => {
      const box = host.getBoundingClientRect()
      width = box.width; height = box.height
      const dpr = Math.min(devicePixelRatio || 1, 1.75)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }
    function draw() {
      if (!width || !height) return
      context.clearRect(0, 0, width, height)
      const tiltX = .88 + current.y * .23
      const tiltY = angle + current.x * .3
      const cx = Math.cos(tiltX), sx = Math.sin(tiltX)
      const cy = Math.cos(tiltY), sy = Math.sin(tiltY)
      const spin = Math.sin(time * .13) * .12 - .38
      const cz = Math.cos(spin), sz = Math.sin(spin)
      const scale = Math.min(width * .262, height * .25)
      const projected = points.map(p => {
        const x = p.x * cy + p.z * sy
        const z = -p.x * sy + p.z * cy
        const y = p.y * cx - z * sx
        const depth = p.y * sx + z * cx
        const perspective = 4.8 / (4.8 - depth)
        return { x: (x * cz - y * sz) * scale * perspective + width * .5, y: (x * sz + y * cz) * scale * perspective + height * .49, depth, group: p.group, perspective }
      }).sort((a, b) => a.depth - b.depth)
      for (const p of projected) {
        const alpha = .18 + (p.depth + 1.7) / 3.4 * .75
        context.fillStyle = `rgba(${p.group ? '222,249,178' : '182,218,131'},${Math.min(.95, alpha)})`
        const size = (p.group ? 1.22 : .76) * p.perspective
        context.beginPath(); context.arc(p.x, p.y, size, 0, Math.PI * 2); context.fill()
      }
      // Orbit hairlines give the sculpture scale without covering the headline.
      context.strokeStyle = '#c6e6a01e'; context.lineWidth = .7
      context.beginPath(); context.ellipse(width / 2, height * .49, scale * 1.75, scale * .57, -.45, 0, Math.PI * 2); context.stroke()
    }
    function tick(now) {
      frame = 0
      if (paused || !visible || document.hidden) return
      if (now - previous > 1000 / 30) {
        const dt = Math.min((now - previous) / 1000 || .033, .05)
        previous = now; time += dt; angle += dt * .12
        current.x += (pointer.x - current.x) * .05
        current.y += (pointer.y - current.y) * .05
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    function resume() {
      if (!paused && visible && !document.hidden && !frame) { previous = performance.now(); frame = requestAnimationFrame(tick) }
    }
    renderStill = () => {
      if (frame) { cancelAnimationFrame(frame); frame = 0 }
      draw(); resume()
    }
    new ResizeObserver(resize).observe(host)
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0 }
      resume()
    }, { threshold: .01 }).observe(host)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0 }
      resume()
    })
    if (fine) {
      host.addEventListener('pointermove', event => {
        const box = host.getBoundingClientRect()
        pointer = { x: (event.clientX - box.left) / box.width * 2 - 1, y: (event.clientY - box.top) / box.height * 2 - 1 }
      }, { passive: true })
      host.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 } })
    }
    host.classList.add('canvas-ready')
    resize(); resume()
  }
}
