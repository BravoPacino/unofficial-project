import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SITE, COORD } from '../data/site'
import { sunPosition, compass } from '../lib/sun'

const GAP = 2
const OPEN = 88
const SPREAD = 0.45
const HOVER = 16
const REACH = 110
const RIPPLE = 18
const RIPPLE_AT = 0.5
const OPEN_END = 0.3
const WORDS_FROM = 0.22
const WORDS_TO = 0.78
const DIM = 0.18

const RAD = Math.PI / 180
const clamp01 = v => Math.max(0, Math.min(1, v))
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const SKY = [
  [-18, [74, 64, 48], 0.1],
  [-6, [150, 82, 40], 0.3],
  [0, [226, 118, 62], 0.62],
  [8, [255, 172, 96], 0.95],
  [25, [255, 214, 152], 0.9],
  [55, [255, 244, 224], 0.85],
]

function skyAt(alt) {
  if (alt <= SKY[0][0]) return { rgb: SKY[0][1], k: SKY[0][2] }
  for (let i = 1; i < SKY.length; i++) {
    const [a1, c1, k1] = SKY[i], [a0, c0, k0] = SKY[i - 1]
    if (alt <= a1) {
      const t = (alt - a0) / (a1 - a0)
      return { rgb: c0.map((v, j) => Math.round(v + (c1[j] - v) * t)), k: k0 + (k1 - k0) * t }
    }
  }
  const last = SKY[SKY.length - 1]
  return { rgb: last[1], k: last[2] }
}

const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' })

function readSun(date) {
  const { alt, az } = sunPosition(date, SITE.lat, SITE.lon)
  const { rgb, k } = skyAt(alt)
  const x = 50 + 40 * Math.sin(az * RAD)
  const y = 85 - (Math.max(-10, Math.min(70, alt)) / 70) * 95
  const luma = k * (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  const deg = Math.round(Math.abs(alt))
  const where = alt > 88 ? 'directly overhead'
    : `${deg}° ${alt >= 0 ? 'above' : 'below'} the horizon, to the ${compass(az)}`
  return {
    time: clock.format(date).toLowerCase(),
    where, rgb, k, x, y,
    side: (50 - x) / 40,
    ink: luma > 0.45 ? 'rgba(24,18,9,0.82)' : 'rgba(240,232,213,0.85)',
  }
}

export default function Hero() {
  const winRef = useRef()
  const sunRef = useRef(null)
  const rippled = useRef(false)
  const repaint = useRef(null)
  const [geom, setGeom] = useState(null)
  const [sun, setSun] = useState(null)

  useEffect(() => {
    const read = () => setSun(readSun(new Date()))
    const first = setTimeout(read, 0)
    const iv = setInterval(read, 60000)
    return () => { clearTimeout(first); clearInterval(iv) }
  }, [])
  useEffect(() => { sunRef.current = sun; repaint.current?.() }, [sun])

  useEffect(() => {
    const win = winRef.current
    let timer = 0
    const measure = () => {
      const W = win.clientWidth
      const N = Math.max(8, Math.min(32, Math.round(W / (W >= 760 ? 56 : 34))))
      setGeom(g => (g && g.W === W && g.N === N ? g : { W, N }))
    }
    const ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(measure, 120) })
    ro.observe(win)
    const first = setTimeout(measure, 0)
    return () => { ro.disconnect(); clearTimeout(timer); clearTimeout(first) }
  }, [])

  useEffect(() => {
    if (!geom) return
    const win = winRef.current
    const slats = [...win.querySelectorAll('.louvre')]
    const sheens = slats.map(s => s.querySelector('.louvre-sheen'))
    const prints = slats.map(s => s.querySelector('.louvre-print'))
    const behind = win.querySelector('.hero-behind')
    const stage = win.parentElement, section = stage.parentElement
    const N = slats.length, pitch = geom.W / N
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lift = new Float32Array(N), target = new Float32Array(N), shown = new Float32Array(N).fill(NaN)
    let raf = 0, prev = 0, lastLit = -1
    let ripple0 = !reduce && !rippled.current ? performance.now() : -1
    rippled.current = true

    const frame = now => {
      raf = 0
      const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 1 / 60
      prev = now
      const held = Math.max(1, section.offsetHeight - stage.offsetHeight)
      const q = reduce ? 0 : clamp01(window.scrollY / held)
      const p = clamp01(q / OPEN_END)

      const words = behind.children
      const lit = reduce ? 0 : clamp01((q - WORDS_FROM) / (WORDS_TO - WORDS_FROM)) * words.length
      if (Math.abs(lit - lastLit) > 0.01) {
        lastLit = lit
        for (let j = 0; j < words.length; j++) words[j].style.opacity = (DIM + (1 - DIM) * clamp01(lit - j)).toFixed(3)
      }
      const rt = ripple0 >= 0 ? (now - ripple0) / 1000 - RIPPLE_AT : null
      const ease = 1 - Math.exp(-dt / 0.15)
      const side = sunRef.current?.side ?? 0
      let busy = false

      for (let i = 0; i < N; i++) {
        const lag = SPREAD * (N > 1 ? i / (N - 1) : 0)
        const open = OPEN * easeInOut(clamp01((p - lag) / (1 - SPREAD)))
        lift[i] += (target[i] - lift[i]) * ease
        if (Math.abs(target[i] - lift[i]) > 0.05) busy = true
        let wave = 0
        if (rt !== null) {
          const u = clamp01((rt - i * 0.035) / 0.5)
          wave = RIPPLE * Math.sin(Math.PI * u)
          if (u < 1) busy = true
        }
        const a = Math.min(OPEN, open + lift[i] + wave)
        if (Math.abs(a - shown[i]) > 0.05 || Number.isNaN(shown[i])) {
          shown[i] = a
          slats[i].style.transform = `rotateY(${a.toFixed(2)}deg)`
          const s = Math.sin(a * RAD)
          sheens[i].style.opacity = (0.04 + 0.1 * s + 0.4 * Math.max(0, s * side)).toFixed(3)
          prints[i].style.opacity = clamp01((78 - a) / 28).toFixed(3)
          slats[i].style.opacity = (1 - 0.85 * clamp01((a - 70) / 18)).toFixed(3)
        }
      }
      if (rt !== null && !busy) ripple0 = -1
      if (busy) raf = requestAnimationFrame(frame)
      else prev = 0
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }
    repaint.current = () => { lastLit = -1; kick() }

    const onScroll = () => { if (window.scrollY < section.offsetHeight + 100) kick() }
    const onMove = e => {
      const r = win.getBoundingClientRect()
      const inside = e.clientY >= r.top && e.clientY <= r.bottom
      const mx = e.clientX - r.left
      for (let i = 0; i < N; i++) {
        const d = ((i + 0.5) * pitch - mx) / REACH
        target[i] = inside ? HOVER * Math.exp(-d * d) : 0
      }
      kick()
    }
    const onLeave = () => { target.fill(0); kick() }

    window.addEventListener('scroll', onScroll, { passive: true })
    if (!reduce && window.matchMedia('(hover: hover)').matches) {
      win.addEventListener('mousemove', onMove)
      win.addEventListener('mouseleave', onLeave)
    }
    kick()
    return () => {
      cancelAnimationFrame(raf)
      repaint.current = null
      window.removeEventListener('scroll', onScroll)
      win.removeEventListener('mousemove', onMove)
      win.removeEventListener('mouseleave', onLeave)
    }
  }, [geom])

  useEffect(() => {
    gsap.fromTo('.hero-light', { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' })
    gsap.fromTo('.hero-sill > *', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.3 })

    const off = []
    document.querySelectorAll('.magnetic').forEach(el => {
      const move = e => {
        const rect = el.getBoundingClientRect()
        gsap.to(el, {
          x: (e.clientX - rect.left - rect.width / 2) * 0.35,
          y: (e.clientY - rect.top - rect.height / 2) * 0.35,
          duration: 0.45, ease: 'power2.out'
        })
      }
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' })
      el.addEventListener('mousemove', move)
      el.addEventListener('mouseleave', leave)
      off.push(() => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) })
    })
    return () => off.forEach(f => f())
  }, [])

  const c = sun ? sun.rgb.join(',') : '200,168,107'
  const k = sun ? sun.k : 0.5
  const light = sun && {
    background: `radial-gradient(ellipse 75% 95% at ${sun.x.toFixed(1)}% ${sun.y.toFixed(1)}%,
        rgba(${c},${k}) 0%, rgba(${c},${(k * 0.4).toFixed(3)}) 45%, rgba(${c},0) 82%),
      linear-gradient(to bottom, rgba(${c},${(k * 0.22).toFixed(3)}), rgba(${c},${(k * 0.06).toFixed(3)})), #0b0a08`
  }

  const line = sun ? `The light behind these louvres is George Town’s, right now — the sun is ${sun.where}.` : ''

  const print = (
    <div className="louvre-print-inner">
      <span className="louvre-line">A <em>Sanctuary</em></span>
      <span className="louvre-line">Above All</span>
    </div>
  )

  return (
    <section className="hero">
      <h1 className="sr-only">A Sanctuary Above All</h1>

      <div className="hero-stage">
        <div ref={winRef} className="hero-window">
          <div className="hero-light" style={light || undefined} aria-hidden="true">
            <p className="hero-behind" style={{ color: sun?.ink }}>
              {line && line.split(' ').map((w, j) => <span key={j} className="w">{w} </span>)}
            </p>
          </div>

          {geom && (
            <div className="louvres" aria-hidden="true">
              {Array.from({ length: geom.N }, (_, i) => {
                const pitch = geom.W / geom.N
                return (
                  <div key={i} className="louvre" style={{ left: i * pitch, width: pitch - GAP }}>
                    <div className="louvre-print" style={{ left: -i * pitch, width: geom.W }}>{print}</div>
                    <div className="louvre-sheen" style={{ background: `rgb(${c})` }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="hero-sill">
          <div className="hero-sill-main">
            <p className="hero-meta">Unofficial concept <span>·</span> George Town, Penang</p>
            <p className="hero-sub">
              239 exclusive residences within Penang&rsquo;s most coveted enclave.
              Where nature&rsquo;s splendour meets timeless luxury.
            </p>
            <a href="#residences" className="hero-cta magnetic">View Residences →</a>
          </div>
          <div className="hero-sill-side">
            <p>George Town{sun ? ` · ${sun.time}` : ''}</p>
            <p>{COORD}</p>
          </div>
        </div>
      </div>

      <style>{`
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .hero { position: relative; height: 200vh; height: 200svh; background: #080806; }
        .hero-stage {
          position: sticky; top: 0;
          height: 100vh; height: 100svh; min-height: 560px;
          display: flex; flex-direction: column;
        }
        @media (prefers-reduced-motion: reduce) { .hero { height: auto; } }
        .hero-window { position: relative; flex: 1; overflow: hidden; perspective: 1400px; }
        .hero-light { position: absolute; inset: 0; z-index: 0; background: #0b0a08; opacity: 0; }
        @media (prefers-reduced-motion: no-preference) {
          .hero-light::after {
            content: ''; position: absolute; inset: 0; background: inherit;
            animation: hero-breathe 7s ease-in-out infinite alternate;
          }
        }
        @keyframes hero-breathe { from { opacity: 0 } to { opacity: 0.35 } }
        .hero-behind {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          width: min(780px, 84%); margin: 0; text-align: center;
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.4rem, 3vw, 2.4rem); line-height: 1.3;
        }
        .hero-behind .w { opacity: ${DIM}; }
        .louvres { position: absolute; inset: 0; z-index: 1; transform-style: preserve-3d; }
        .louvre {
          position: absolute; top: 0; bottom: 0; overflow: hidden;
          background: linear-gradient(90deg, #15110b 0%, #1d1810 55%, #120e08 100%);
          box-shadow: inset 1px 0 0 rgba(255,255,255,0.03);
          backface-visibility: hidden; will-change: transform;
        }
        .louvre-sheen { position: absolute; inset: 0; opacity: 0.04; pointer-events: none; }
        .louvre-print { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; padding: 0 4rem; }
        .louvre-print-inner {
          font-family: 'Cormorant Garamond', serif; font-weight: 300;
          font-size: clamp(3rem, 8.5vw, 8rem); line-height: 0.95; color: #f0e8d5;
          padding-top: 3rem;
        }
        .louvre-line { display: block; white-space: nowrap; }
        .louvre-print-inner em { font-style: italic; color: #e3cb96; }

        .hero-sill {
          position: relative; z-index: 2;
          display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 2rem;
          padding: 1.8rem 4rem 2.4rem;
          border-top: 1px solid rgba(200,168,107,0.18);
          background: #080806;
        }
        .hero-meta {
          font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase;
          color: #c8a86b; margin: 0 0 0.9rem;
        }
        .hero-meta span { margin: 0 0.6rem; }
        .hero-sub {
          font-size: 0.78rem; letter-spacing: 0.06em; line-height: 1.9;
          color: rgba(240,232,213,0.6); max-width: 420px; margin: 0 0 1.2rem;
        }
        .hero-cta {
          display: inline-block; font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(240,232,213,0.75); text-decoration: none;
        }
        .hero-sill-side {
          text-align: right; font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-size: 0.9rem; line-height: 2; color: rgba(240,232,213,0.45);
        }
        .hero-sill-side p { margin: 0; }

        @media (max-width: 760px) {
          .louvre-print { padding: 0 1.5rem; }
          .louvre-print-inner { font-size: clamp(2.6rem, 12vw, 4rem); padding-top: 2rem; }
          .hero-sill { grid-template-columns: 1fr; gap: 1.2rem; padding: 1.4rem 1.5rem 1.8rem; }
          .hero-sill-side { text-align: left; font-size: 0.82rem; line-height: 1.7; }
        }
      `}</style>
    </section>
  )
}
