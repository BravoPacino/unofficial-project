import { lazy, Suspense, useEffect, useRef, useState } from 'react'

// The ink drawing as it sits in the site: WebGL starts only when the drawing comes near the screen and is
// released again once it is far away, so the page never holds more than it needs. Until then, and wherever
// WebGL cannot start, the still drawing is shown instead.
const InkDrawing = lazy(() => import('./InkDrawing'))

export default function LiveInk({ still, alt, ...props }) {
  const ref = useRef()
  const [near, setNear] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = ref.current
    // build when it comes within a screen, free it as soon as it is a screen away (a fast scroll past must free it too)
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '100% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const fallback = <img src={still} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  return (
    <div ref={ref} className="live-ink" style={{ position: 'relative', width: '100%' }}>
      {near && !failed
        ? <Suspense fallback={<div style={{ aspectRatio: '2 / 1' }}>{fallback}</div>}><InkDrawing {...props} onFail={() => setFailed(true)} /></Suspense>
        : <div style={{ aspectRatio: '2 / 1' }}>{fallback}</div>}
    </div>
  )
}
