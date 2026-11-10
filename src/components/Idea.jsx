import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitText from './SplitText'

// 01 · The Idea — About and the three pillars in one chapter, on the cream "ink" palette.
// Facts only from the brochure copy the site already used; no new claims.
const INK = '#2a2622', SOFT = 'rgba(42,38,34,0.62)', ACC = '#8a6a33', BG = '#efe8da', RULE = 'rgba(42,38,34,0.16)'

const stats = [
  { num: 239, display: '239', label: 'Residences' },
  { num: 12, display: '12', label: 'Acres' },
  { num: null, display: '4–6', label: 'Parking lots per home' },
  { num: null, display: '2028', label: 'Completion' },
]

const pillars = [
  { n: '01', tag: 'Nature', title: 'Courtyards first', body: 'Courtyard-themed layouts, inspired by George Town’s heritage, bring daylight and cross-ventilation into every home. Paths and pedestrian bridges thread through the gardens.' },
  { n: '02', tag: 'Leisure', title: 'Water at the centre', body: 'Lounge decks look out over resort-style pools, with a floating gym and courtyards in between.' },
  { n: '03', tag: 'Space', title: 'Room to park', body: '4 to 6 parking lots for every home — rare on land-scarce Penang Island, and planned for several generations under one roof.' },
]

export default function Idea() {
  const ref = useRef()

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      gsap.fromTo(el.querySelectorAll('.idea-fade'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' })
      el.querySelectorAll('.idea-num').forEach((n) => {
        const target = parseInt(n.dataset.target)
        if (!target) return
        const t0 = performance.now()
        const tick = (now) => {
          const p = Math.min((now - t0) / 1400, 1)
          n.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target)
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      io.disconnect()
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} id="about" className="idea" style={{ background: BG, color: INK }}>
      <div className="idea-head">
        <p className="idea-fade idea-chap">01 — The Idea</p>
        <SplitText style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.4rem,4.6vw,4.4rem)', fontWeight: 300, lineHeight: 1.08, color: INK }} delay={0.1}>
          {`239 homes on 12 acres,\nlaid out around courtyards.`}
        </SplitText>
        <p className="idea-fade idea-body">
          A low-density, gated and guarded enclave in George Town with two home types — Courtyard Homes and
          Courtyard Villas — set among gardens, pools and pedestrian bridges. Dual-key layouts let several
          generations live under one roof.
        </p>
      </div>

      <div className="idea-stats">
        {stats.map((s) => (
          <div key={s.label} className="idea-fade idea-stat">
            <div className="idea-num" data-target={s.num || ''}>{s.display}</div>
            <div className="idea-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="idea-pillars">
        {pillars.map((p) => (
          <article key={p.n} className="idea-fade idea-pillar">
            <div className="idea-pn">{p.n}</div>
            <p className="idea-tag">{p.tag}</p>
            <h3>{p.title}</h3>
            <p className="idea-pbody">{p.body}</p>
          </article>
        ))}
      </div>

      <style>{`
        .idea { padding: 9rem 4rem 8rem; }
        .idea-chap { font-size: 0.62rem; letter-spacing: 0.28em; text-transform: uppercase; color: ${ACC}; margin-bottom: 1.6rem; }
        .idea-head { max-width: 980px; }
        .idea-body { margin-top: 2rem; max-width: 520px; font-size: 0.86rem; line-height: 2; color: ${SOFT}; }
        .idea-stats { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 5.5rem; border-top: 1px solid ${RULE}; }
        .idea-stat { padding: 1.8rem 1.4rem 0 0; }
        .idea-num { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.6rem, 4vw, 3.6rem); font-weight: 300; line-height: 1; color: ${INK}; margin-bottom: 0.5rem; }
        .idea-label { font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase; color: ${SOFT}; }
        .idea-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3rem; margin-top: 6rem; }
        .idea-pillar { border-top: 1px solid ${INK}; padding-top: 1.4rem; }
        .idea-pn { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: ${ACC}; margin-bottom: 1.8rem; }
        .idea-tag { font-size: 0.58rem; letter-spacing: 0.24em; text-transform: uppercase; color: ${SOFT}; margin-bottom: 0.7rem; }
        .idea-pillar h3 { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.7rem, 2.4vw, 2.2rem); font-weight: 300; line-height: 1.1; margin-bottom: 1rem; }
        .idea-pbody { font-size: 0.8rem; line-height: 1.95; color: ${SOFT}; max-width: 360px; }
        @media (max-width: 760px) {
          .idea { padding: 6rem 1.5rem 5rem; }
          .idea-stats { grid-template-columns: 1fr 1fr; margin-top: 3.5rem; }
          .idea-stat { padding: 1.4rem 1rem 1.2rem 0; border-bottom: 1px solid ${RULE}; }
          .idea-pillars { grid-template-columns: 1fr; gap: 2.4rem; margin-top: 3.5rem; }
        }
      `}</style>
    </section>
  )
}
