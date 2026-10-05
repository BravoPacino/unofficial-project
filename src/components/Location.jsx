import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitText from './SplitText'
import map from '../data/penangMap'
import { COORD } from '../data/site'

const nearby = map.pois

export default function Location() {
  const sectionRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.to('.loc-left', { opacity: 1, x: 0, duration: 1, ease: 'power3.out' })
          gsap.to('.loc-right', { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.15 })
          gsap.to('.loc-item', { opacity: 1, x: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.3 })
          observer.disconnect()
        }
      })
    }, { threshold: 0.15 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="location" className="loc" style={{
      background: '#161512',
      alignItems: 'start'
    }}>
      <div className="loc-left" style={{
        opacity: 0, transform: 'translateX(-40px)'
      }}>
        <p style={{
          fontSize: '0.58rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#c8a86b',
          marginBottom: '1.4rem'
        }}>/ Location /</p>

        <SplitText
            style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2.4rem,4vw,3.5rem)',
            fontWeight: 300, lineHeight: 1.1,
            marginBottom: '1.5rem'
            }}
            delay={0.1}
        >
            {`A Coveted\nAddress in\nGeorge Town`}
        </SplitText>

        <p style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic', fontSize: '0.9rem',
          color: '#c8a86b', letterSpacing: '0.06em',
          marginBottom: '2rem'
        }}>{COORD}</p>

        <p style={{
          fontSize: '0.8rem', lineHeight: 2,
          color: 'rgba(240,232,213,0.6)',
          marginBottom: '2.5rem'
        }}>
          Strategically beside the Penang Turf Club and Kensington Gardens,
          offering effortless access to international schools, world-class
          healthcare, and the finest dining — while cocooned in tranquil seclusion.
        </p>

        <ul style={{ listStyle: 'none' }}>
          {nearby.map((n, i) => (
            <li key={i} className="loc-item" style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.85rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.74rem', color: 'rgba(240,232,213,0.6)',
              opacity: 0, transform: 'translateX(-16px)'
            }}>
              <span style={{ color: '#c8a86b', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1 }}>{n.n}</span>
              <span style={{ color: '#c8a86b', fontSize: '0.65rem' }}>{n.km.toFixed(1)} km</span>
            </li>
          ))}
        </ul>
        <p style={{
          marginTop: '1rem', fontSize: '0.6rem', lineHeight: 1.8,
          letterSpacing: '0.04em', color: 'rgba(240,232,213,0.35)'
        }}>
          Straight-line distance from the site. The heritage zone is measured to its nearest edge.
        </p>
      </div>

      <div className="loc-right" style={{
        opacity: 0, transform: 'translateX(40px)'
      }}>
        <PullOutMap />
      </div>

      <style>{`
        .loc {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 6rem; padding: 8rem 4rem;
          overflow-x: clip;
        }
        @media (max-width: 860px) {
          .loc { grid-template-columns: 1fr; gap: 3.5rem; padding: 6rem 1.5rem; }
        }
        .loc-pin-ring {
          transform-box: fill-box; transform-origin: center;
          animation: loc-pulse 2.5s ease-in-out infinite;
        }
        @keyframes loc-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.35; }
          50%      { transform: scale(1.6); opacity: 0.12; }
        }
      `}</style>
    </section>
  )
}

const GOLD = '#c8a86b'
const HOLD = 1.2
const PULL = 2.8
const R0 = 4.2
const PAD = 28

const STYLE = {
  0: { size: 11, family: 'Cormorant Garamond, serif', italic: true, upper: false, track: '0.02em', fill: 'rgba(240,232,213,0.45)' },
  1: { size: 8.5, family: 'Jost, sans-serif', upper: true, track: '0.16em', fill: 'rgba(240,232,213,0.45)' },
  2: { size: 9, family: 'Jost, sans-serif', upper: true, track: '0.2em', fill: 'rgba(240,232,213,0.6)' },
  3: { size: 10, family: 'Jost, sans-serif', upper: true, track: '0.24em', fill: 'rgba(240,232,213,0.78)' },
  4: { size: 16, family: 'Cormorant Garamond, serif', italic: true, upper: false, track: '0.06em', fill: 'rgba(200,168,107,0.6)' },
}

function inLod(rank, R) {
  if (rank === 0) return R < 5.5
  if (rank === 1) return R > 3 && R < 9
  if (rank === 2) return R > 6
  if (rank === 4) return R > 9
  return true
}

const LABELS = [
  { n: 'Penang Island', r: 4, x: map.islandLabel.x, y: map.islandLabel.y },
  ...map.names,
]

const SPOT = [[0, 0], [0, 1], [0, -1], [1, 0]]

const clamp01 = v => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function pathOf(a, X, Y) {
  let d = 'M' + X(a[0]).toFixed(1) + ' ' + Y(a[1]).toFixed(1)
  for (let i = 2; i < a.length; i += 2) d += 'L' + X(a[i]).toFixed(1) + ' ' + Y(a[i + 1]).toFixed(1)
  return d
}

function overlaps(a, b) {
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
}

function PullOutMap() {
  const wrapRef = useRef()

  useEffect(() => {
    const wrap = wrapRef.current
    const r = {}
    wrap.querySelectorAll('[data-k]').forEach(el => { r[el.dataset.k] = el })
    const labelEls = wrap.querySelectorAll('[data-label]'), poiEls = wrap.querySelectorAll('[data-poi]')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const labels = LABELS.map((l, i) => ({ ...l, el: labelEls[i], a: 0, w: 0, k: 0 }))
    const pois = map.pois.map((p, i) => ({ ...p, el: poiEls[i] }))

    let W = 0, H = 0, s0 = 1, s1 = 1, end = { x: 0, y: 0 }
    let t = 0, start = 0, last = 0, raf = 0, playing = false

    const measure = () => {
      for (const l of labels) l.w = l.el.getBBox().width
    }

    const layout = () => {
      W = wrap.clientWidth; H = wrap.clientHeight
      s0 = (Math.min(W, H) / 2 - 26) / R0
      const [x0, x1, y0, y1] = map.islandBox
      s1 = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0))
      end = { x: W / 2 - ((x0 + x1) / 2) * s1, y: H / 2 + ((y0 + y1) / 2) * s1 }
      r.svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    }

    const draw = (sec, snap, dt = 1 / 60) => {
      const e = easeInOut(clamp01((sec - HOLD) / PULL))
      const s = Math.exp(lerp(Math.log(s0), Math.log(s1), e))
      const ax = lerp(W / 2, end.x, e), ay = lerp(H / 2, end.y, e)
      const X = x => ax + x * s, Y = y => ay - y * s
      const R = (Math.min(W, H) / 2) / s

      const grow = easeInOut(clamp01((sec - 0.15) / (HOLD + PULL - 0.5)))
      r.coastA.setAttribute('d', pathOf(map.island.a, X, Y))
      r.coastB.setAttribute('d', pathOf(map.island.b, X, Y))
      r.coastA.style.strokeDashoffset = r.coastB.style.strokeDashoffset = String(1 - grow)
      const oa = 0.45 * clamp01((sec - HOLD - 0.6) / 1.2)
      if (oa > 0) r.others.setAttribute('d', map.coast.map(c => pathOf(c, X, Y)).join(''))
      r.others.style.opacity = String(oa)
      r.heritage.setAttribute('d', pathOf(map.heritage, X, Y) + 'Z')
      r.heritage.style.opacity = String(0.6 * clamp01(sec / 0.6))

      r.site.setAttribute('transform', `translate(${ax.toFixed(1)} ${ay.toFixed(1)})`)

      const pa = clamp01(sec / 0.5) * (1 - clamp01((R - 6) / 3))
      const taken = [[ax - 132, ay - 9, ax + 7, ay + 9]]
      for (const p of pois) {
        if (pa === 0) { if (!p.off) { p.el.style.opacity = '0'; p.off = true } continue }
        p.off = false
        const px = X(p.x), py = Y(p.y)
        p.el.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`)
        p.el.style.opacity = String(pa)
        if (pa > 0.05) taken.push([px - 4, py - 14, px + 19, py + 4])
      }

      const step = [0.5, 1, 2, 5, 10].find(k => k * s >= 48) ?? 10
      r.bar.setAttribute('d', `M16 ${H - 20}h${(step * s).toFixed(1)}M16 ${H - 24}v8M${(16 + step * s).toFixed(1)} ${H - 24}v8`)
      r.barText.textContent = `${step} km`
      r.barText.setAttribute('y', H - 28)
      taken.push([0, H - 44, 130, H], [W - 170, H - 22, W, H], [W - 36, 0, W, 44])

      const fade = 1 - Math.exp(-dt / 0.12)
      for (const l of labels) {
        const st = STYLE[l.r]
        const px = X(l.x), py = Y(l.y)
        const hw = l.w / 2 + 3, hh = st.size * 0.65
        const at = k => [px + SPOT[k][0] * (hw + 4), py + SPOT[k][1] * st.size * 1.3]
        let ok = false
        if (inLod(l.r, R)) {
          for (const k of [l.k, 0, 1, 2, 3]) {
            const [lx, ly] = at(k)
            const box = [lx - hw, ly - hh, lx + hw, ly + hh]
            if (box[0] > 4 && box[2] < W - 4 && box[1] > 4 && box[3] < H - 4 && !taken.some(b => overlaps(b, box))) {
              taken.push(box); l.k = k; ok = true
              break
            }
          }
        }
        l.a = snap ? +ok : l.a + ((ok ? 1 : 0) - l.a) * fade
        if (l.a < 0.005 && !ok) {
          if (!l.off) { l.el.style.visibility = 'hidden'; l.off = true }
          continue
        }
        if (l.off) { l.el.style.visibility = ''; l.off = false }
        const [lx, ly] = at(l.k)
        l.el.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly.toFixed(1)})`)
        l.el.style.opacity = l.a.toFixed(3)
      }
      return labels.every(l => Math.abs(l.a - Math.round(l.a)) < 0.01)
    }

    const total = HOLD + PULL
    const tick = now => {
      if (!start) start = last = now
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      t = Math.min(total, (now - start) / 1000)
      const settled = draw(t, false, dt)
      if (t < total || !settled) raf = requestAnimationFrame(tick)
      else playing = false
    }

    const play = () => {
      cancelAnimationFrame(raf)
      if (reduce) { t = total; draw(t, true); return }
      playing = true; start = 0
      raf = requestAnimationFrame(tick)
    }

    const reset = () => {
      cancelAnimationFrame(raf); playing = false; t = 0
      for (const l of labels) l.a = 0
      draw(0, false)
    }

    const redraw = () => { if (!playing) draw(t, t > 0, 0) }

    layout(); measure(); reset()
    document.fonts?.ready?.then(() => { if (wrap.isConnected) { measure(); redraw() } })

    let played = false
    const io = new IntersectionObserver(([en]) => {
      if (en.intersectionRatio >= 0.35 && !played) { played = true; play() }
      else if (!en.isIntersecting && played) { played = false; reset() }
    }, { threshold: [0, 0.35] })
    io.observe(wrap)

    let timer = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => { layout(); redraw() }, 120)
    })
    ro.observe(wrap)

    return () => { cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); ro.disconnect() }
  }, [])

  return (
    <div ref={wrapRef} style={{
      height: 440,
      background: '#1e1d1a',
      border: '1px solid rgba(200,168,107,0.12)',
      position: 'relative', overflow: 'hidden'
    }}>
      <svg data-k="svg" role="img"
        aria-label="Map of Penang Island. Unofficial Project sits in the north-east, about 3.7 km west of George Town's heritage zone."
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path data-k="others" fill="none" stroke={GOLD} strokeWidth="0.8" />
        <path data-k="heritage" fill="rgba(200,168,107,0.05)" stroke={GOLD} strokeWidth="0.8" strokeDasharray="2 3" />
        <path data-k="coastA" fill="none" stroke={GOLD} strokeWidth="1" pathLength="1" strokeDasharray="1 1" strokeLinejoin="round" />
        <path data-k="coastB" fill="none" stroke={GOLD} strokeWidth="1" pathLength="1" strokeDasharray="1 1" strokeLinejoin="round" />

        {LABELS.map((l, i) => {
          const st = STYLE[l.r]
          return (
            <text key={i} data-label textAnchor="middle" dominantBaseline="central"
              style={{ opacity: 0, fontFamily: st.family, fontSize: st.size, fontStyle: st.italic ? 'italic' : 'normal',
                letterSpacing: st.track, textTransform: st.upper ? 'uppercase' : 'none', fill: st.fill }}>
              {l.n}
            </text>
          )
        })}

        {map.pois.map((p, i) => (
          <g key={i} data-poi style={{ opacity: 0 }}>
            <circle r="2.2" fill={GOLD} />
            <text x="5" y="-5" style={{ fontFamily: 'Jost, sans-serif', fontSize: 8.5, letterSpacing: '0.1em', fill: GOLD }}>
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        ))}

        <g data-k="site">
          <circle className="loc-pin-ring" r="9" fill={GOLD} />
          <circle r="4" fill={GOLD} />
          <text x="-14" y="1" textAnchor="end" dominantBaseline="central"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, fill: GOLD }}>
            Unofficial Project
          </text>
        </g>

        <path data-k="bar" fill="none" stroke="rgba(240,232,213,0.55)" strokeWidth="1" />
        <text data-k="barText" x="16"
          style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, letterSpacing: '0.16em', fill: 'rgba(240,232,213,0.55)' }} />
      </svg>

      <div style={{
        position: 'absolute', top: 14, right: 16, textAlign: 'center',
        fontSize: '0.55rem', letterSpacing: '0.2em', color: 'rgba(240,232,213,0.5)'
      }}>
        N
        <div style={{ width: 1, height: 18, margin: '4px auto 0', background: 'rgba(240,232,213,0.5)' }} />
      </div>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{
        position: 'absolute', right: 12, bottom: 8,
        fontSize: '0.55rem', letterSpacing: '0.06em',
        color: 'rgba(240,232,213,0.35)', textDecoration: 'none'
      }}>
        © OpenStreetMap contributors
      </a>
    </div>
  )
}
