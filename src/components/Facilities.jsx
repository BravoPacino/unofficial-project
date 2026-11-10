import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitText from './SplitText'
import { lenisRef } from '../lib/lenis'
import InkPlate from '../ink/InkPlate'

gsap.registerPlugin(ScrollTrigger)

const facilities = [
  { label: 'Resort-Style Pool', img: `${import.meta.env.BASE_URL}drawings/pool-gold.webp`, ar: 2, plate: 'pool' },
  { label: 'Pedestrian Bridges', img: `${import.meta.env.BASE_URL}drawings/walkway-ink.webp`, ar: 2, plate: 'walkway' },
  { label: 'Lounge Decks', img: `${import.meta.env.BASE_URL}drawings/lounge-gold.webp`, ar: 2, plate: 'lounge' },
  { label: 'Floating Gym', img: `${import.meta.env.BASE_URL}drawings/gym-gold.webp`, ar: 2, plate: 'gym' },
  { label: 'Serene Courtyards', img: `${import.meta.env.BASE_URL}drawings/aerial-gold.webp`, ar: 0.5625, plate: 'aerial' },
]

const REST = 0.15

const clamp01 = v => Math.max(0, Math.min(1, v))

export default function Facilities() {
  const sectionRef = useRef()
  const stageRef = useRef()
  const trackRef = useRef()

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const track = trackRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let travel = 0, raf = 0, timer = 0

    const slide = () => {
      raf = 0
      const p = clamp01(-section.getBoundingClientRect().top / (travel || 1))
      track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px, 0, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(slide) }

    const layout = () => {
      if (reduce) return
      const last = track.querySelector('.fac-card:last-child')
      const padEnd = parseFloat(getComputedStyle(track).paddingRight) || 0
      travel = Math.max(0, last.offsetLeft + last.offsetWidth + padEnd - stage.clientWidth)
      section.style.height = `${stage.offsetHeight + travel + REST * window.innerHeight}px`
      ScrollTrigger.refresh()
      slide()
    }
    const onResize = () => { clearTimeout(timer); timer = setTimeout(layout, 150) }

    let dragX = null
    const onDown = e => { dragX = e.clientX; track.style.cursor = 'grabbing' }
    const onMove = e => {
      if (dragX === null) return
      e.preventDefault()
      const dx = dragX - e.clientX
      dragX = e.clientX
      const lenis = lenisRef.current
      if (lenis) lenis.scrollTo(lenis.animatedScroll + dx, { immediate: true })
      else window.scrollBy(0, dx)
    }
    const onUp = () => { dragX = null; track.style.cursor = 'grab' }

    layout()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    if (!reduce) {
      track.addEventListener('mousedown', onDown)
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    const ctx = gsap.context(() => {
      gsap.fromTo('.fac-header',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.fac-header',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      )

      gsap.utils.toArray('.fac-card').forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 0.8, ease: 'power3.out',
            delay: i * 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    }, sectionRef)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      track.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={sectionRef} id="facilities" className="fac" style={{ background: '#080806' }}>
      <div ref={stageRef} className="fac-stage">
        <div className="fac-header" style={{ opacity: 0 }}>
          <p style={{
            fontSize: '0.58rem', letterSpacing: '0.28em',
            textTransform: 'uppercase', color: '#c8a86b',
            marginBottom: '0.8rem'
          }}>05 — Amenities</p>
          <SplitText
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(2.4rem,4vw,3.5rem)',
              fontWeight: 300, lineHeight: 1.1
            }}
            delay={0.1}
          >
            {`Where Life\nThrives`}
          </SplitText>
          <p style={{
            fontSize: '0.65rem', letterSpacing: '0.12em',
            color: 'rgba(240,232,213,0.3)',
            marginTop: '1rem'
          }}>— drag or scroll to explore · shadows follow the sun over George Town now · drawn from the developer’s renders, sizes estimated</p>
        </div>

        <div ref={trackRef} className="fac-track">
          {facilities.map((f, i) => (
            <div key={i} className="fac-card" style={{ opacity: 0, '--ar': f.ar }}
              onMouseEnter={e => {
                gsap.to(e.currentTarget.querySelector('.fac-img'), {
                  scale: 1.04,
                  duration: 0.7, ease: 'power2.out'
                })
              }}
              onMouseLeave={e => {
                gsap.to(e.currentTarget.querySelector('.fac-img'), {
                  scale: 1,
                  duration: 0.7, ease: 'power2.out'
                })
              }}
            >
              <div className="fac-img" style={{ position: 'absolute', inset: 0 }}>
                <InkPlate scene={f.plate} still={f.img} alt={`${f.label}, drawing`} fit="cover" />
              </div>

              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(8,8,6,0.62) 0%, transparent 26%)'
              }} />

              <div style={{
                position: 'absolute',
                top: '1.2rem', left: '1.5rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '5rem', fontWeight: 300,
                color: 'rgba(33,30,26,0.16)',
                lineHeight: 1, userSelect: 'none'
              }}>0{i + 1}</div>

              <p style={{
                position: 'absolute',
                bottom: '1.5rem', left: '1.5rem',
                fontSize: '0.7rem', letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#f0e8d5'
              }}>{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .fac-stage {
          position: sticky; top: 0;
          height: 100vh; height: 100svh;
          display: flex; flex-direction: column; justify-content: center;
          overflow: hidden; padding-top: 4.5rem;
        }
        .fac-header { padding: 0 4rem; margin: 0 0 2.2rem; }
        .fac-track {
          position: relative; display: flex; gap: 1.5rem; padding: 0 4rem;
          width: max-content; cursor: grab; will-change: transform; user-select: none; align-items: flex-start;
        }
        .fac-card { position: relative; height: clamp(220px, calc(100svh - 21rem), 600px); aspect-ratio: var(--ar); flex-shrink: 0; overflow: hidden; border: 1px solid rgba(200,168,107,0.14); }
        @media (max-width: 760px) {
          .fac-header { padding: 0 1.5rem; margin-bottom: 1.6rem; }
          .fac-track { gap: 1rem; padding: 0 1.5rem; }
          .fac-card { height: 42vh; height: 42svh; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fac-stage { position: static; height: auto; padding: 8rem 0 6rem; }
          .fac-track { width: auto; overflow-x: auto; scrollbar-width: none; }
        }
      `}</style>
    </section>
  )
}
