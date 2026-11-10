import { useEffect, useMemo, useRef, useState } from 'react'
import { makeRenderer, makeStage } from './stage'
import { SCENES } from './scenes'
import { dayOf, lightAt } from './light'

// An ink scene that is only looked at (no dragging): its shadows follow the sun over George Town, redrawn once a
// minute. Every plate on the page draws through one shared WebGL context and copies the result into its own canvas,
// so a strip of cards costs one context, not one each. Until it is drawn, and if WebGL cannot start, the still shows.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
let shared = null
const sharedRenderer = () => {
  if (!shared) shared = makeRenderer(document.createElement('canvas'))
  return shared
}

export default function InkPlate({ scene, still, alt, fit = 'contain' }) {
  const boxRef = useRef(), canvasRef = useRef(), stageRef = useRef(null), viewRef = useRef(null)
  const [near, setNear] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [size, setSize] = useState(null)
  const light = useMemo(() => lightAt(now, dayOf(now)), [now])
  const def = SCENES[scene]

  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(iv) }, [])

  useEffect(() => {
    const el = boxRef.current
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true)
      else if (Math.abs(e.boundingClientRect.top) > window.innerHeight * 3) setNear(false)
    }, { rootMargin: '300px 600px' })
    io.observe(el)
    const ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height); if (w && h) setSize({ w, h }) })
    ro.observe(el)
    return () => { io.disconnect(); ro.disconnect() }
  }, [])

  // build the scene when it comes near, free it when it is far away
  useEffect(() => {
    if (!near || !def) return undefined
    let alive = true, stage = null
    def.load().then((mod) => {
      if (!alive) return
      try {
        stage = makeStage(null, { view: { cx: 0, cy: 0, width: 1, eye: 0, dist: 1 }, ink: INK, paper: PAPER, renderer: sharedRenderer() })
        viewRef.current = def.build(mod)(stage.kit)
        stage.finish(); stageRef.current = stage
        setNow(Date.now())
      } catch { /* no WebGL: the still stays */ }
    })
    return () => { alive = false; stageRef.current = null; viewRef.current = null; stage?.dispose(); setDrawn(false) }
  }, [near, def])

  // draw: sun disc on the paper, then the plate copied over it from the shared context
  useEffect(() => {
    const stage = stageRef.current, view = viewRef.current, c = canvasRef.current
    if (!stage || !view || !size || !c) return
    const { w, h } = size, dpr = Math.min(window.devicePixelRatio || 1, 2)
    stage.resize(w, h, view)
    stage.render(light.dir)
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    if (def.disc && light.up) {
      const r = 0.085 * Math.max(w, h * 2) * dpr, x = (0.14 + 0.72 * light.frac) * c.width, y = (0.12 + 0.22 * (1 - Math.min(1, light.alt / 70))) * c.height
      ctx.fillStyle = DISC; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.drawImage(sharedRenderer().domElement, 0, 0, c.width, c.height)
    setDrawn(true)
  }, [size, light, def, near, now])

  return (
    <div ref={boxRef} className="ink-plate" style={{ position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden' }}>
      <img src={still} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit === 'cover' ? 'cover' : 'contain', opacity: drawn ? 0 : 1, transition: 'opacity .4s' }} />
      <canvas ref={canvasRef} role="img" aria-label={`${alt}. Shadows follow the sun over George Town now.`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: drawn ? 1 : 0, transition: 'opacity .4s' }} />
    </div>
  )
}
