import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function Cursor() {
  const dotRef = useRef()
  const ringRef = useRef()
  const mx = useRef(0)
  const my = useRef(0)
  const rx = useRef(0)
  const ry = useRef(0)
  const requestRef = useRef() 
  const [enabled] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    if (!enabled) return
    const onMove = (e) => {
      if (!dotRef.current) return 
      mx.current = e.clientX
      my.current = e.clientY
      gsap.to(dotRef.current, { x: e.clientX, y: e.clientY, duration: 0.05 })
    }
    window.addEventListener('mousemove', onMove)

    const handleMouseOver = (e) => {
      if (!ringRef.current || !dotRef.current) return 
      if (e.target.closest('a, button, input, .facility-item, .interactive-group')) {
        gsap.to(ringRef.current, { scale: 2.2, opacity: 0.4, duration: 0.3 })
        gsap.to(dotRef.current, { scale: 0, duration: 0.2 })
      }
    }

    const handleMouseOut = (e) => {
      if (!ringRef.current || !dotRef.current) return 
      if (e.target.closest('a, button, input, .facility-item, .interactive-group')) {
        gsap.to(ringRef.current, { scale: 1, opacity: 1, duration: 0.3 })
        gsap.to(dotRef.current, { scale: 1, duration: 0.2 })
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    const lerp = () => {
      if (!ringRef.current) return 
      rx.current += (mx.current - rx.current) * 0.1
      ry.current += (my.current - ry.current) * 0.1
      gsap.set(ringRef.current, { x: rx.current, y: ry.current })
      
      
      requestRef.current = requestAnimationFrame(lerp)
    }
    lerp() 

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      
            if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>

      <div ref={dotRef} style={{
        position: 'fixed',
        left: 0, top: 0, 
        width: 5, height: 5,
        background: '#c8a86b',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9999, 
        transform: 'translate(-50%,-50%)'
      }} />

      <div ref={ringRef} style={{
        position: 'fixed',
        left: 0, top: 0, 
        width: 36, height: 36,
        border: '1px solid rgba(200,168,107,0.6)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9998,
        transform: 'translate(-50%,-50%)'
      }} />
    </>
  )
}