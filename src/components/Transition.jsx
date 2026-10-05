import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function Transition() {
  const curtainRef = useRef()

  useEffect(() => {
    const curtain = curtainRef.current

    const handleClick = (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link) return

      e.preventDefault()
      const href = link.getAttribute('href')
      const target = href === '#' ? document.documentElement : document.querySelector(href)
      if (!target) return

      gsap.fromTo(curtain,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 0.5,
          ease: 'power4.inOut',
          onComplete: () => {
            const spot = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target
            window.scrollTo({ top: spot.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
            gsap.fromTo(curtain,
              { scaleX: 1, transformOrigin: 'right center' },
              { scaleX: 0, duration: 0.5, ease: 'power4.inOut', delay: 0.1 }
            )
          }
        }
      )
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <div ref={curtainRef} style={{
      position: 'fixed',
      inset: 0,
      background: '#c8a86b',
      zIndex: 9995,
      transform: 'scaleX(0)',
      transformOrigin: 'left center',
      pointerEvents: 'none'
    }} />
  )
}