import { useEffect, useState } from 'react'
import { COORD } from '../data/site'
import PlanDraw from '../ink/PlanDraw'

// The sectioned page's opening (?sections, reduced motion, no WebGL): the same title and words as the one take's hero,
// with the masterplan drawn in gold on the dark page, as the page's own Masterplan section draws it. On the one take the
// hero is the take itself (src/ink/Take.jsx, docs/hero-plan.md): the plan draws itself on paper and the estate rises out.
const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' })

export default function Hero() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const read = () => setTime(clock.format(new Date()).toLowerCase())
    const first = setTimeout(read, 0), iv = setInterval(read, 60000)
    return () => { clearTimeout(first); clearInterval(iv) }
  }, [])

  return (
    <section className="hero">
      <div className="hero-text">
        <p className="hero-meta">Unofficial concept <span>·</span> George Town, Penang</p>
        <h1 className="hero-title">A <em>Sanctuary</em><br />Above All</h1>
        <p className="hero-sub">239 exclusive residences within Penang&rsquo;s most coveted enclave. Where nature&rsquo;s splendour meets timeless luxury.</p>
        <a href="#residences" className="hero-cta">View Residences →</a>
        <p className="hero-where">George Town{time ? ` · ${time}` : ''}<br />{COORD}</p>
      </div>
      <div className="hero-plan"><PlanDraw tone="dark" fit /></div>

      <style>{`
        .hero {
          position: relative; min-height: 100vh; min-height: 100svh; background: #080806;
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr); align-items: center; gap: 3rem;
          padding: 8rem 4rem 4rem;
        }
        .hero p { margin: 0; }
        .hero-meta { font-size: 0.6rem; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a86b; }
        .hero-meta span { margin: 0 0.6rem; }
        .hero-title { margin: 1.2rem 0 1.6rem; font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(3rem, 7vw, 7rem); line-height: 0.98; color: #f0e8d5; }
        .hero-title em { font-style: italic; color: #e3cb96; }
        .hero-sub { font-size: 0.78rem; letter-spacing: 0.06em; line-height: 1.9; color: rgba(240,232,213,0.6); max-width: 420px; }
        .hero-cta { display: inline-block; margin: 1.6rem 0 2.4rem; font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(240,232,213,0.75); text-decoration: none; }
        .hero-where { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.9rem; line-height: 1.8; color: rgba(240,232,213,0.45); }
        .hero-plan { position: relative; height: min(78svh, 760px); }
        @media (max-width: 760px) {
          .hero { grid-template-columns: 1fr; gap: 2rem; padding: 7rem 1.5rem 3rem; }
          .hero-plan { height: 60svh; order: -1; }
        }
      `}</style>
    </section>
  )
}
