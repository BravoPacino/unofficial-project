import { useEffect, useMemo, useRef, useState } from 'react'
import { makeStage, projector } from './stage'
import homes, { VIEW, GUIDES, SPOTS } from './homes'
import { drawTree } from './trees'
import { dayOf, lightAt, clockOf } from './light'

const INK = '#211e1a', PAPER = '#efe8da', ACC = '#bd7f1f', DISC = '#dba84a'
const MIN = 60000
const TREES = [
  { x: -12.9, h: 6.4, seed: 3, back: true }, { x: 13.2, h: 6.0, seed: 12, back: true },
  { x: -10.3, h: 9.8, seed: 7 }, { x: 10.6, h: 9.2, seed: 21 },
]
// on a narrow screen the sheet shows less street, so the house is drawn larger and the trees move in
const NARROW = 560
const viewFor = (w) => (w < NARROW ? { ...VIEW, width: 24.5, cy: 6.3 } : VIEW)
const treesFor = (w) => (w < NARROW ? [{ x: -8.5, h: 6.4, seed: 7 }, { x: 8.9, h: 6.0, seed: 21 }] : TREES)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function InkDrawing() {
  const boxRef = useRef(), glRef = useRef(), backRef = useRef(), frontRef = useRef(), stageRef = useRef(null)
  const [size, setSize] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [shift, setShift] = useState(0)                 // ms the sun has been moved by hand
  const [ptr, setPtr] = useState(null)                  // pointer inside the drawing, CSS px
  const [open, setOpen] = useState(-1)
  const drag = useRef(null), back = useRef(0)

  const day = useMemo(() => dayOf(now), [now])
  const t = now + shift
  // moving the sun by hand keeps it inside the day
  const moveTo = (target) => setShift((clamp(target, day.rise + 20 * MIN, day.set - 20 * MIN) - now) || 1)
  const light = useMemo(() => lightAt(t, day), [t, day])

  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(iv) }, [])

  // the stage: built once, resized with its box
  useEffect(() => {
    const stage = makeStage(glRef.current, { view: VIEW, ink: INK, paper: PAPER })
    homes(stage.kit); stage.finish(); stageRef.current = stage
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height)
      if (!w || !h) return
      const view = viewFor(w)
      stage.resize(w, h, view.width)
      const dpr = Math.min(window.devicePixelRatio || 1, 2), px = w / view.width
      for (const [ref, isBack] of [[backRef, true], [frontRef, false]]) {
        const c = ref.current; c.width = w * dpr; c.height = h * dpr
        const ctx = c.getContext('2d'); ctx.scale(dpr, dpr)
        const at = projector(view, w, h)
        for (const tr of treesFor(w).filter((tr) => !!tr.back === isBack)) {
          const [x, y] = at(tr.x, 0)
          drawTree(ctx, x, y, px, tr.h, tr.seed, isBack ? 'rgba(33,30,26,0.24)' : INK)
        }
      }
      setSize({ w, h })
    })
    ro.observe(boxRef.current)
    return () => { ro.disconnect(); stage.dispose(); stageRef.current = null }
  }, [])

  useEffect(() => { if (size && stageRef.current) stageRef.current.render(light.dir) }, [size, light])

  // letting go: the sun drifts back to where it really is
  const release = () => {
    cancelAnimationFrame(back.current)
    const from = shift, t0 = performance.now() + 1400
    if (!from) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShift(0); return }
    const step = (n) => {
      const p = clamp((n - t0) / 900, 0, 1)
      setShift(from * (1 - (1 - Math.pow(1 - p, 3))))
      if (p < 1) back.current = requestAnimationFrame(step); else setShift(0)
    }
    back.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(back.current), [])

  const local = (e) => { const r = boxRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  const onDown = (e) => {
    if (e.target.closest('.ink-spot, .ink-card')) return
    cancelAnimationFrame(back.current); setOpen(-1)
    drag.current = { x: e.clientX, y: e.clientY, t0: t, moved: false, id: e.pointerId }
  }
  const onMove = (e) => {
    setPtr(local(e))
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 6) return
    if (!d.moved && e.pointerType === 'touch' && Math.abs(e.clientY - d.y) > Math.abs(dx)) { drag.current = null; return }   // a vertical swipe is a scroll
    if (!d.moved) { d.moved = true; try { boxRef.current.setPointerCapture(d.id) } catch { /* pointer already gone */ } }
    moveTo(d.t0 + (dx / size.w) * (day.set - day.rise))
  }
  const onUp = () => { if (drag.current?.moved) release(); drag.current = null }
  const onKey = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault(); cancelAnimationFrame(back.current)
    moveTo(t + (e.key === 'ArrowRight' ? 20 : -20) * MIN)
  }

  let overlay = null
  if (size) {
    const { w, h } = size, P = projector(viewFor(w), w, h), narrow = w < NARROW
    const right = ptr ? ptr.x > w / 2 : true, below = ptr ? ptr.y > h / 2 : true
    const [gx0] = P(GUIDES.xs[0], 0), [gx1] = P(GUIDES.xs.at(-1), 0)
    const y0 = P(0, 0)[1], yTop = P(0, GUIDES.ys.at(-1))[1]
    const yEnd = below ? h - 22 : 30, xEnd = right ? w - 34 : 34
    // the disc crosses the sheet once a day, and stands higher the higher the sun
    const rDisc = 0.088 * w, dx = (0.14 + 0.72 * light.frac) * w, dy = y0 - rDisc * 0.35 - (Math.max(0, light.alt) / 90) * (y0 - rDisc * 1.5)
    const moved = !!shift
    overlay = <>
      <div className="ink-disc" style={{ left: dx, top: dy, width: rDisc * 2, height: rDisc * 2, background: light.up ? DISC : 'transparent', borderColor: DISC }} />
      <svg className="ink-svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line x1={w * 0.035} x2={w * 0.965} y1={y0} y2={y0} stroke={INK} strokeWidth="2.25" />
        <g className="ink-guide" key={`v${below}`}>
          {GUIDES.xs.map((x) => <line key={x} x1={P(x, 0)[0]} x2={P(x, 0)[0]} y1={below ? y0 : yTop} y2={yEnd} />)}
          <line className="acc" x1={gx0} x2={gx1} y1={yEnd} y2={yEnd} />
        </g>
        <g className="ink-guide" key={`h${right}`}>
          {GUIDES.ys.map((y) => <line key={y} y1={P(0, y)[1]} y2={P(0, y)[1]} x1={right ? gx1 : gx0} x2={xEnd} />)}
          <line className="acc" x1={xEnd} x2={xEnd} y1={y0} y2={yTop} />
        </g>
        {ptr && <g className="ink-cross"><line x1="0" x2={w} y1={ptr.y} y2={ptr.y} /><line x1={ptr.x} x2={ptr.x} y1="0" y2={h} /></g>}
      </svg>
      {SPOTS.map((s, i) => {
        const [x, y] = P(s.x, s.y)
        return <button key={s.title} type="button" className={`ink-spot${open === i ? ' on' : ''}`} style={{ left: x, top: y }}
          aria-expanded={open === i} aria-label={s.title} onClick={() => setOpen(open === i ? -1 : i)} />
      })}
      {open >= 0 && (() => {
        const s = SPOTS[open], [x, y] = P(s.x, s.y), flip = x > w * 0.62
        // beside the square where there is room; across the foot of the sheet on a narrow screen
        const place = narrow ? { left: 8, right: 8, bottom: 8, width: 'auto' } : { left: flip ? undefined : x + 16, right: flip ? w - x + 16 : undefined, top: clamp(y - 14, 8, h - 150) }
        return <div className="ink-card" role="status" style={place}>
          <b>{String(open + 1).padStart(2, '0')} · {s.title}</b><p>{s.body}</p>
        </div>
      })()}
      {ptr && open < 0 && <div className="ink-chip" style={{ left: clamp(ptr.x + 12, 8, w - 232), top: clamp(ptr.y + 14, 8, h - 44) }}>
        {moved ? `${clockOf(t)} · sun ${Math.round(light.alt)}° up` : 'Click and drag to move the sun'}
      </div>}
      {ptr && <div className="ink-xy" style={{ left: clamp(ptr.x - 84, 4, w - 90), top: clamp(ptr.y - 30, 4, h - 30) }}>X:{Math.round(ptr.x)}PX<br />Y:{Math.round(ptr.y)}PX</div>}
      <div className="ink-hud">
        <span>Sun · George Town {clockOf(t)}</span>
        <span>{light.up ? `Alt ${Math.round(light.alt)}° · Az ${Math.round(light.az)}°` : t < day.noon ? 'Before sunrise · drawn in first light' : 'After dark · drawn in the day’s last light'}</span>
        <span className={moved ? 'acc' : ''}>{moved ? 'Moved by hand' : 'Live'}</span>
      </div>
    </>
  }

  return (
    <div ref={boxRef} className="ink" tabIndex={0} role="group"
      aria-label="Courtyard Homes, front elevation in ink. Shadows follow the sun over George Town; drag sideways or use the left and right arrow keys to move the time of day."
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onPointerLeave={() => { if (!drag.current) setPtr(null) }} onKeyDown={onKey} onBlur={() => { if (shift) release() }}>
      <canvas ref={backRef} className="ink-layer" />
      <canvas ref={glRef} className="ink-layer ink-gl" />
      <canvas ref={frontRef} className="ink-layer ink-front" />
      {overlay}
      <style>{`
        .ink { position: relative; width: 100%; aspect-ratio: 2 / 1; background: ${PAPER}; overflow: hidden; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair; outline: none; }
        .ink:focus-visible { box-shadow: inset 0 0 0 2px ${ACC}; }
        .ink-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .ink-gl { z-index: 2; } .ink-front { z-index: 3; }
        .ink-disc { position: absolute; z-index: 0; border-radius: 50%; transform: translate(-50%, -50%); border: 1.5px solid; pointer-events: none; }
        .ink-layer:first-of-type { z-index: 1; }
        .ink-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; overflow: visible; }
        .ink-guide line { stroke: rgba(33,30,26,0.42); stroke-width: 1; stroke-dasharray: 7 4 1.5 4; animation: ink-in .5s ease-out both; }
        .ink-guide line.acc { stroke: ${ACC}; stroke-dasharray: none; stroke-width: 1.25; }
        .ink-cross line { stroke: rgba(33,30,26,0.3); stroke-width: 1; }
        @keyframes ink-in { from { opacity: 0 } to { opacity: 1 } }
        .ink-spot { position: absolute; z-index: 6; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; padding: 0; border: 0; background: ${ACC}; cursor: pointer; }
        .ink-spot::after { content: ''; position: absolute; inset: -9px; }
        .ink-spot::before { content: ''; position: absolute; inset: -4px; border: 1px solid ${ACC}; opacity: 0; transition: opacity .2s; }
        .ink-spot:hover::before, .ink-spot:focus-visible::before, .ink-spot.on::before { opacity: 1; }
        .ink-spot:focus-visible { outline: none; }
        .ink-card, .ink-chip, .ink-xy, .ink-hud { font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; text-transform: uppercase; letter-spacing: .04em; }
        .ink-card { position: absolute; z-index: 7; width: 270px; background: ${INK}; color: ${PAPER}; padding: 12px 14px 13px; cursor: default; }
        .ink-card b { display: block; font-weight: 500; font-size: 10.5px; color: ${DISC}; margin-bottom: 7px; }
        .ink-card p { margin: 0; font-family: 'Jost', sans-serif; text-transform: none; letter-spacing: 0; font-size: 13px; line-height: 1.55; color: rgba(239,232,218,0.86); }
        .ink-chip { position: absolute; z-index: 5; background: ${INK}; color: ${PAPER}; font-size: 10px; line-height: 1.4; padding: 6px 9px; pointer-events: none; white-space: nowrap; }
        .ink-xy { position: absolute; z-index: 5; font-size: 9.5px; line-height: 1.35; color: rgba(33,30,26,0.6); pointer-events: none; }
        .ink-hud { position: absolute; z-index: 5; left: 14px; top: 12px; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 10px; color: rgba(33,30,26,0.72); pointer-events: none; max-width: calc(100% - 28px); }
        .ink-hud .acc { color: ${ACC}; }
        @media (hover: none) { .ink-chip, .ink-xy, .ink-cross { display: none; } }
        @media (max-width: 640px) { .ink { aspect-ratio: 5 / 4; } .ink-card p { font-size: 12.5px; line-height: 1.5; } .ink-hud { font-size: 9px; gap: 2px 10px; } }
        @media (prefers-reduced-motion: reduce) { .ink-guide line { animation: none; } }
      `}</style>
    </div>
  )
}
