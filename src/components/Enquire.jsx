import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function Enquire() {
  const sectionRef = useRef()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.to('.enq-title', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' })
          gsap.to('.enq-form', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 })
          observer.disconnect()
        }
      })
    }, { threshold: 0.2 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id="enquire" style={{
      minHeight: '80vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${import.meta.env.BASE_URL}images/entrance.webp)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.25)',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(8,8,6,0.5)'
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center',
        padding: '5rem 2rem',
        maxWidth: 560,
        width: '100%'
      }}>
        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: '#c8a86b',
          marginBottom: '1.5rem'
        }}>/ Register Interest · Demo /</p>

        <h2 className="enq-title" style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(3rem,6vw,5rem)',
          fontWeight: 300, lineHeight: 1.05,
          marginBottom: '3rem',
          opacity: 0, transform: 'translateY(30px)'
        }}>
          Discover<br />
          <em style={{ fontStyle: 'italic', color: '#e3cb96' }}>Exclusive</em><br />
          Living
        </h2>

        {sent && (
          <p role="status" style={{
            fontSize: '0.8rem', lineHeight: 1.9, color: 'rgba(240,232,213,0.75)',
            border: '1px solid rgba(200,168,107,0.35)', padding: '1.4rem 1.5rem',
            marginBottom: '1.2rem'
          }}>
            Nothing was sent &mdash; this is an unofficial concept site, not the developer&rsquo;s.
          </p>
        )}
        <form className="enq-form" onSubmit={e => { e.preventDefault(); setSent(true) }} style={{
          display: sent ? 'none' : 'flex', flexDirection: 'column',
          gap: 0, marginBottom: '1.2rem',
          opacity: 0, transform: 'translateY(20px)'
        }}>
          {[
            { id: 'name', label: 'Full Name', type: 'text' },
            { id: 'email', label: 'Email Address', type: 'email' },
            { id: 'phone', label: 'Mobile Number', type: 'tel' },
          ].map((f, i, arr) => (
            <input key={f.id} type={f.type} placeholder={f.label} aria-label={f.label}
              style={{
                width: '100%',
                background: 'rgba(8,8,6,0.75)',
                border: '1px solid rgba(200,168,107,0.25)',
                borderBottom: i === arr.length - 1 ? '1px solid rgba(200,168,107,0.25)' : 'none',
                color: '#f0e8d5',
                padding: '1.1rem 1.2rem',
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.78rem', fontWeight: 300,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,168,107,0.6)'}
              onBlur={e => e.target.style.borderColor = i === arr.length - 1
                ? 'rgba(200,168,107,0.25)'
                : 'rgba(200,168,107,0.25)'}
            />
          ))}
          <button type="submit" style={{
            width: '100%',
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.62rem', letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#080806', background: '#c8a86b',
            border: 'none', padding: '1.1rem',
            cursor: 'none',
            transition: 'background 0.3s'
          }}
            onMouseEnter={e => e.target.style.background = '#e3cb96'}
            onMouseLeave={e => e.target.style.background = '#c8a86b'}
          >Submit Interest (Demo)</button>
          <p style={{
            marginTop: '0.8rem', fontSize: '0.6rem', letterSpacing: '0.06em',
            color: 'rgba(240,232,213,0.45)'
          }}>Demo form: nothing you type here is sent or stored.</p>
        </form>

      </div>
    </section>
  )
}