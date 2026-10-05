import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const FONTS = ['300 1em "Cormorant Garamond"', 'italic 300 1em "Cormorant Garamond"', '300 1em "Jost"']
const FONT_WAIT = 1000
const MIN_HOLD = 2500

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

export default function Preloader({ onLift, onDone }) {
  const containerRef = useRef()
  const titleRef = useRef()

  useEffect(() => {
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const fontsReady = Promise.race([
      Promise.all(FONTS.map(f => document.fonts?.load(f))).catch(() => {}),
      wait(FONT_WAIT),
    ])

    fontsReady.then(() => {
      if (cancelled) return
      if (reduce) {
        gsap.set(titleRef.current, { letterSpacing: '0.35em', paddingLeft: '0.35em' })
        gsap.to(titleRef.current, { opacity: 1, duration: 0.6, ease: 'power1.out' })
      } else {
        gsap.to(titleRef.current, { opacity: 1, letterSpacing: '0.35em', paddingLeft: '0.35em', duration: 1.6, ease: 'power3.out' })
      }
    })

    Promise.all([fontsReady, wait(Math.max(0, MIN_HOLD - performance.now()))]).then(() => {
      if (cancelled) return
      onLift()
      gsap.to(containerRef.current, {
        yPercent: -100, duration: 0.7, ease: 'power3.inOut',
        onComplete: onDone
      })
    })

    return () => { cancelled = true }
  }, [onLift, onDone])

  return (
    <div ref={containerRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#080806',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div ref={titleRef} style={{
        fontSize: '0.6rem',
        letterSpacing: '1.1em',
        paddingLeft: '1.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        color: 'rgba(240,232,213,0.6)',
        opacity: 0
      }}>Unofficial Project</div>
    </div>
  )
}
