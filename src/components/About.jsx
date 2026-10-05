import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitText from './SplitText'

export default function About() {
  const sectionRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.fromTo('.about-tag',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
          )
          gsap.fromTo('.about-body',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
          )
          gsap.fromTo('.stat-card',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
          )
        
          document.querySelectorAll('.stat-num').forEach(el => {
            const target = parseInt(el.dataset.target)
            if (!target) return
            let start = 0
            const duration = 1500
            const startTime = performance.now()
            const tick = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            el.textContent = Math.round(ease * target)
            if (progress < 1) requestAnimationFrame(tick)
               else el.textContent = target
            }
        requestAnimationFrame(tick)
        })
        
        observer.disconnect()
        }
      })
    }, { threshold: 0.2 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const stats = [
  { num: 239, display: '239', label: 'Residences' },
  { num: 12, display: '12', label: 'Acres' },
  { num: null, display: '4–6', label: 'Parking Lots' },
  { num: null, display: '2028', label: 'Completion' },
]

  return (
    <section ref={sectionRef} id="about" style={{
      background: '#0e0d0b',
      padding: '10rem 4rem',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8rem',
      alignItems: 'start'
    }}>
      <div>
        <p className="about-tag" style={{
          fontSize: '0.58rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#c8a86b',
          marginBottom: '1.4rem',
          opacity: 0
        }}>/ Our Enclave /</p>

        <SplitText
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2.4rem,4vw,3.8rem)',
            fontWeight: 300, lineHeight: 1.1,
            marginBottom: '2rem',
            color: '#f0e8d5'
          }}
          delay={0.1}
        >
          {`Live in Nature's\nUnparalleled\nLuxury`}
        </SplitText>

        <p className="about-body" style={{
          fontSize: '0.82rem', lineHeight: 2.1,
          color: 'rgba(240,232,213,0.6)',
          maxWidth: 440,
          opacity: 0
        }}>
          In the prestigious heart of George Town lies Unofficial Project —
          an exquisite sanctuary. Where modern
          sophistication intertwines seamlessly with the tranquil beauty of
          a lush valley. Here, 239 meticulously crafted residences redefine
          what refined living truly means.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        background: 'rgba(200,168,107,0.1)'
      }}>
        
        {stats.map((s, i) => (
  <div key={i} className="stat-card" style={{
    background: '#0e0d0b',
    padding: '2rem 1.5rem',
    borderTop: '1px solid rgba(200,168,107,0.2)',
    opacity: 0
  }}>
    
    <div
        className="stat-num"
        data-target={s.num || ''}
            style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '3rem', fontWeight: 300,
            color: '#c8a86b', lineHeight: 1,
            marginBottom: '0.4rem'
          }}
    >{s.display}</div>
        <div style={{
        fontSize: '0.58rem', letterSpacing: '0.18em',
          textTransform: 'uppercase',
         color: 'rgba(240,232,213,0.5)'
        }}>{s.label}</div>
        </div>
        ))}
      
      </div>
    </section>
  )
}