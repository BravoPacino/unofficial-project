import { useEffect, useMemo, useRef, useState } from 'react'
import { makeRenderer, makeStage } from './stage'
import { SCENES } from './scenes'
import { dayOf, lightAt } from './light'

// An ink scene that is only looked at (no dragging): its shadows follow the sun over George Town, redrawn once a
// minute while it is on screen. Every plate on the page draws through one shared WebGL context, one at a time: the
// scene is built, drawn, copied into the plate's own canvas, and freed at once, so the GPU never holds more than one
// scene (holding them all made phones run out of memory and reload the page). Until it is drawn, and if WebGL cannot
// start, the still shows.
const INK = '#211e1a', PAPER = '#efe8da', DISC = '#dba84a'
let shared = null, failed = false
const sharedRenderer = () => {
  if (!shared && !failed) {
    try { shared = makeRenderer(document.createElement('canvas')) } catch { failed = true }
  }
  return shared
}
// one job at a time
let chain = Promise.resolve()
const enqueue = (job) => { chain = chain.then(job, job); return chain }
const frame = () => new Promise((r) => requestAnimationFrame(() => r()))

export default function InkPlate({ scene, still, alt, fit = 'contain' }) {
  const boxRef = useRef(), canvasRef = useRef()
  const [seen, setSeen] = useState(false)               // on screen (or about to be)
  const [drawn, setDrawn] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [size, setSize] = useState(null)
  const light = useMemo(() => lightAt(now, dayOf(now)), [now])
  const def = SCENES[scene]

  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(iv) }, [])

  useEffect(() => {
    const el = boxRef.current
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: '200px 300px' })
    io.observe(el)
    const ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height); if (w && h) setSize({ w, h }) })
    ro.observe(el)
    return () => { io.disconnect(); ro.disconnect() }
  }, [])

  // draw when it is on screen, and again when the minute (the sun) or the size changes
  useEffect(() => {
    if (!seen || !size || !def) return undefined
    let alive = true
    enqueue(async () => {
      if (!alive) return
      const renderer = sharedRenderer(); if (!renderer) return
      const mod = await def.load()
      if (!alive) return
      await frame()                                      // let the page breathe between scenes
      if (!alive) return
      let stage = null
      try {
        const { w, h } = size, dpr = Math.min(window.devicePixelRatio || 1, 2)
        stage = makeStage(null, { view: { cx: 0, cy: 0, width: 1, eye: 0, dist: 1 }, ink: INK, paper: PAPER, renderer })
        const view = def.build(mod)(stage.kit)
        stage.finish()
        stage.resize(w, h, view)
        stage.render(light.dir)
        const c = canvasRef.current; if (!c) return
        c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
        const ctx = c.getContext('2d')
        ctx.clearRect(0, 0, c.width, c.height)
        if (def.disc && light.up) {
          const r = 0.085 * Math.max(w, h * 2) * dpr, x = (0.14 + 0.72 * light.frac) * c.width, y = (0.12 + 0.22 * (1 - Math.min(1, light.alt / 70))) * c.height
          ctx.fillStyle = DISC; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
        }
        ctx.drawImage(renderer.domElement, 0, 0, c.width, c.height)
        setDrawn(true)
      } catch { /* the still stays */ } finally {
        stage?.dispose()
        renderer.setSize(1, 1, false)                    // and give back the big drawing buffer
      }
    })
    return () => { alive = false }
  }, [seen, size, light, def])

  return (
    <div ref={boxRef} className="ink-plate" style={{ position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden' }}>
      <img src={still} alt={alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit === 'cover' ? 'cover' : 'contain', opacity: drawn ? 0 : 1, transition: 'opacity .4s' }} />
      <canvas ref={canvasRef} role="img" aria-label={`${alt}. Shadows follow the sun over George Town now.`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: drawn ? 1 : 0, transition: 'opacity .4s' }} />
    </div>
  )
}
