import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function SplitText({ children, className, style, delay = 0, threshold = 0.3 }) {
  const ref = useRef()
  const animated = useRef(false)

  const lines = typeof children === 'string'
    ? children.split('\n')
    : [children]

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const spans = el.querySelectorAll('.split-inner')

    gsap.set(spans, { yPercent: 110 })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !animated.current) {
          animated.current = true
          gsap.to(spans, {
            yPercent: 0,
            duration: 1.1,
            ease: 'power4.out',
            stagger: 0.08,
            delay
          })
        }

        if (!e.isIntersecting && animated.current) {
          animated.current = false
          gsap.set(spans, { yPercent: 110 })
        }
      })
    }, { threshold })

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <div ref={ref} className={className} style={style}>
      {lines.map((line, i) => (
        <div key={i} style={{
          overflow: 'hidden',
          display: 'block',
          lineHeight: 1.15,
          paddingBottom: '0.05em'
        }}>
          <span className="split-inner" style={{ display: 'block' }}>
            {line}
          </span>
        </div>
      ))}
    </div>
  )
}