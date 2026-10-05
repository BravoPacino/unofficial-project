import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const pillars = [
  {
    num: '01',
    tag: 'Beyond Nature',
    title: 'Live in\nNature\'s\nEmbrace',
    body: 'Courtyard-themed layouts inspired by George Town\'s rich heritage — every residence harnesses natural light and ventilation. Verdant paths and pedestrian bridges thread through the landscape.',
    img: `${import.meta.env.BASE_URL}images/trail.webp`,
    align: 'left'
  },
  {
    num: '02',
    tag: 'Beyond Elegance',
    title: 'Live with\nRefined\nGrace',
    body: 'Surrender to serenity as you relax on luxurious lounge decks overlooking resort-style pools. Each element curated to perfection — where elegance and serenity converge.',
    img: `${import.meta.env.BASE_URL}images/lounge.webp`,
    align: 'right'
  },
  {
    num: '03',
    tag: 'Beyond Exclusivity',
    title: 'Live\nUncom-\npromised',
    body: '4 to 6 dedicated parking lots per unit — a rare luxury on land-scarce Penang Island. Multi-generational living reimagined for those who accept no compromise.',
    img: `${import.meta.env.BASE_URL}images/pool.webp`,
    align: 'left'
  }
]

export default function Pillars() {
  const sectionRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      pillars.forEach((p, i) => {
        const bg = document.querySelector(`.pillar-bg-${i}`)
        const content = document.querySelector(`.pillar-content-${i}`)

        gsap.fromTo(bg,
          { yPercent: -12 },
          {
            yPercent: 12,
            ease: 'none',
            scrollTrigger: {
              trigger: `.pillar-wrap-${i}`,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        )

        gsap.fromTo(content,
          { opacity: 0, x: p.align === 'left' ? -50 : 50 },
          {
            opacity: 1, x: 0,
            duration: 1, ease: 'power3.out',
            scrollTrigger: {
              trigger: `.pillar-wrap-${i}`,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef}>
      {pillars.map((p, i) => (
        <div key={i} className={`pillar-wrap-${i}`} style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className={`pillar-bg-${i}`} style={{
            position: 'absolute',
            inset: '-15%',
            backgroundImage: `url(${p.img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)',
            willChange: 'transform'
          }} />

          <div style={{
            position: 'absolute', inset: 0,
            background: p.align === 'left'
              ? 'linear-gradient(to right, rgba(8,8,6,0.92) 0%, rgba(8,8,6,0.15) 100%)'
              : 'linear-gradient(to left, rgba(8,8,6,0.92) 0%, rgba(8,8,6,0.15) 100%)'
          }} />

          <div className={`pillar-content-${i}`} style={{
            position: 'relative', zIndex: 2,
            padding: '0 4rem',
            maxWidth: 560,
            marginLeft: p.align === 'right' ? 'auto' : '0',
            opacity: 0
          }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '8rem', fontWeight: 300,
              color: 'rgba(200,168,107,0.1)',
              lineHeight: 1, marginBottom: '-2rem',
              userSelect: 'none'
            }}>{p.num}</div>

            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.25em',
              textTransform: 'uppercase', color: '#c8a86b',
              marginBottom: '0.9rem'
            }}>{p.tag}</p>

            <h3 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(2.5rem,4.5vw,4rem)',
              fontWeight: 300, lineHeight: 1.05,
              marginBottom: '1.4rem',
              whiteSpace: 'pre-line'
            }}>{p.title}</h3>

            <div style={{
              width: 40, height: 1,
              background: '#c8a86b',
              opacity: 0.5, marginBottom: '1.5rem'
            }} />

            <p style={{
              fontSize: '0.8rem', lineHeight: 2,
              color: 'rgba(240,232,213,0.6)',
              maxWidth: 380
            }}>{p.body}</p>

            <div style={{
              display: 'flex', gap: '0.5rem',
              marginTop: '2.5rem'
            }}>
              {pillars.map((_, j) => (
                <div key={j} style={{
                  width: j === i ? 24 : 6,
                  height: 1,
                  background: j === i
                    ? '#c8a86b'
                    : 'rgba(200,168,107,0.3)',
                }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}