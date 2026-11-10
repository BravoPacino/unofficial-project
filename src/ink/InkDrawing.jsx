import { useEffect, useMemo, useRef, useState } from 'react'
import { makeStage, projector, scaleAt } from './stage'
import { MODELS } from './models'
import { drawTree } from './trees'
import { dayOf, lightAt, clockOf } from './light'

const INK = '#211e1a', PAPER = '#efe8da', ACC = '#bd7f1f', DISC = '#dba84a'
const MIN = 60000
// trees stand in the gaps between the houses, a little in front of the deck
// a smaller or squarer box shows less street, so the house is drawn larger
const NARROW = 560
const viewOf = (M, w, h) => (h / w > 0.6 ? M.NARROW_VIEW : w < 900 ? M.CARD_VIEW : M.VIEW)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/**
 * Courtyard Homes as an inked plate whose shadows follow the sun over George Town.
 * hud: the time and sun readout · spots: squares that open notes · guides: dashed extension lines from the main edges
 * onFail: called if WebGL cannot start (the caller shows a still instead)
 */
export default function InkDrawing({ model = 'homes', hud = true, spots = true, guides = false, onFail }) {
  const M = MODELS[model]
  const { SPOTS, OUTLINE, GROUND_Z } = M
  const viewFor = (w, h) => viewOf(M, w, h)
  const boxRef = useRef(), glRef = useRef(), frontRef = useRef(), stageRef = useRef(null)
  const [size, setSize] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [shift, setShift] = useState(0)                 // ms the sun has been moved by hand
  const [open, setOpen] = useState(-1)
  const drag = useRef(null), back = useRef(0), failRef = useRef(onFail)

  const day = useMemo(() => dayOf(now), [now])
  const t = now + shift
  // moving the sun by hand keeps it inside the day
  const moveTo = (target) => setShift((clamp(target, day.rise + 20 * MIN, day.set - 20 * MIN) - now) || 1)
  const light = useMemo(() => lightAt(t, day), [t, day])

  useEffect(() => { failRef.current = onFail }, [onFail])
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(iv) }, [])

  // the stage: built once, resized with its box
  useEffect(() => {
    let stage
    try {
      stage = makeStage(glRef.current, { view: M.VIEW, ink: INK, paper: PAPER })
    } catch (err) {
      failRef.current?.(err)
      return undefined
    }
    M.build(stage.kit); stage.finish(); stageRef.current = stage
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height)
      if (!w || !h) return
      const view = viewOf(M, w, h)
      stage.resize(w, h, view)
      const dpr = Math.min(window.devicePixelRatio || 1, 2), at = projector(view, w, h)
      const c = frontRef.current; c.width = w * dpr; c.height = h * dpr
      const ctx = c.getContext('2d'); ctx.scale(dpr, dpr)
      for (const tr of M.TREES) {
        const [x, y] = at(tr.x, 0, tr.z)
        drawTree(ctx, x, y, scaleAt(view, w, tr.z), tr.h, tr.seed, INK)
      }
      setSize({ w, h })
    })
    ro.observe(boxRef.current)
    return () => { ro.disconnect(); stage.dispose(); stageRef.current = null }
  }, [M])

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

  const onDown = (e) => {
    if (e.target.closest('.ink-spot, .ink-card')) return
    cancelAnimationFrame(back.current); setOpen(-1)
    drag.current = { x: e.clientX, y: e.clientY, t0: t, moved: false, id: e.pointerId }
  }
  const onMove = (e) => {
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
    const { w, h } = size, P = projector(viewFor(w, h), w, h), narrow = w < NARROW
    const y0 = P(0, 0, GROUND_Z)[1]
    // the disc crosses the sheet once a day, and stands higher the higher the sun
    const rDisc = 0.088 * w, dx = (0.14 + 0.72 * light.frac) * w, dy = y0 - rDisc * 0.35 - (Math.max(0, light.alt) / 90) * (y0 - rDisc * 1.5)
    const frame = OUTLINE[0] || [0, 0, 0, 0], [fx0, fyTop] = P(frame[0], frame[3]), [fx1] = P(frame[2], frame[3])
    overlay = <>
      <div className="ink-disc" style={{ left: dx, top: dy, width: rDisc * 2, height: rDisc * 2, background: light.up ? DISC : 'transparent', borderColor: DISC }} />
      <svg className="ink-svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line x1={w * 0.02} x2={w * 0.98} y1={y0} y2={y0} stroke={INK} strokeWidth="2.25" />
        {guides && OUTLINE.length > 0 && <g className="ink-guide">
          {[fx0, fx1].map((x) => <line key={x} x1={x} x2={x} y1={fyTop - 6} y2={Math.max(14, fyTop - 0.09 * h)} />)}
          <line className="acc" x1={fx0} x2={fx1} y1={Math.max(14, fyTop - 0.07 * h)} y2={Math.max(14, fyTop - 0.07 * h)} />
        </g>}
      </svg>
      {spots && SPOTS.map((s, i) => {
        const [x, y] = P(s.x, s.y, s.z)
        return <button key={s.title} type="button" className={`ink-spot${open === i ? ' on' : ''}`} style={{ left: x, top: y }}
          aria-expanded={open === i} aria-label={s.title} onClick={() => setOpen(open === i ? -1 : i)} />
      })}
      {spots && open >= 0 && (() => {
        const s = SPOTS[open], [x, y] = P(s.x, s.y, s.z), flip = x > w * 0.6
        // beside the square where there is room; across the foot of the sheet on a narrow screen
        const place = narrow ? { left: 8, right: 8, bottom: 8, width: 'auto' } : { left: flip ? undefined : x + 16, right: flip ? w - x + 16 : undefined, top: clamp(y - 14, 8, h - 140) }
        return <div className="ink-card" role="status" style={place}>
          <b>{String(open + 1).padStart(2, '0')} · {s.title}</b><p>{s.body}</p>
        </div>
      })()}
      {hud && <div className="ink-hud">
        <span>Sun · George Town {clockOf(t)}</span>
        <span>{light.up ? `Alt ${Math.round(light.alt)}° · Az ${Math.round(light.az)}°` : t < day.noon ? 'Before sunrise · drawn in first light' : 'After dark · drawn in the day’s last light'}</span>
        <span className={shift ? 'acc' : ''}>{shift ? 'Moved by hand' : 'Live'}</span>
      </div>}
    </>
  }

  return (
    <div ref={boxRef} className="ink" tabIndex={0} role="group"
      aria-label={`${M.label} in ink. Shadows follow the sun over George Town; drag sideways or use the left and right arrow keys to move the time of day.`}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onKeyDown={onKey} onBlur={() => { if (shift) release() }}>
      <canvas ref={glRef} className="ink-layer ink-gl" />
      <canvas ref={frontRef} className="ink-layer ink-front" />
      {overlay}
      <style>{`
        .ink { position: relative; width: 100%; aspect-ratio: 2 / 1; background: ${PAPER}; overflow: hidden; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: var(--ink-cursor, grab); outline: none; }
        .ink:active { cursor: var(--ink-cursor, grabbing); }
        .ink:focus-visible { box-shadow: inset 0 0 0 2px ${ACC}; }
        .ink-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .ink-gl { z-index: 2; } .ink-front { z-index: 3; }
        .ink-disc { position: absolute; z-index: 1; border-radius: 50%; transform: translate(-50%, -50%); border: 1.5px solid; pointer-events: none; }
        .ink-svg { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; overflow: visible; }
        .ink-guide line { stroke: rgba(33,30,26,0.42); stroke-width: 1; stroke-dasharray: 7 4 1.5 4; }
        .ink-guide line.acc { stroke: ${ACC}; stroke-dasharray: none; stroke-width: 1.25; }
        .ink-spot { position: absolute; z-index: 6; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; padding: 0; border: 0; background: ${ACC}; cursor: var(--ink-cursor, pointer); }
        .ink-spot::after { content: ''; position: absolute; inset: -9px; }
        .ink-spot::before { content: ''; position: absolute; inset: -4px; border: 1px solid ${ACC}; opacity: 0; transition: opacity .2s; }
        .ink-spot:hover::before, .ink-spot:focus-visible::before, .ink-spot.on::before { opacity: 1; }
        .ink-spot:focus-visible { outline: none; }
        .ink-card, .ink-hud { font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace; text-transform: uppercase; letter-spacing: .04em; }
        .ink-card { position: absolute; z-index: 7; width: 260px; background: ${INK}; color: ${PAPER}; padding: 12px 14px 13px; cursor: default; }
        .ink-card b { display: block; font-weight: 500; font-size: 10.5px; color: ${DISC}; margin-bottom: 7px; }
        .ink-card p { margin: 0; font-family: 'Jost', sans-serif; text-transform: none; letter-spacing: 0; font-size: 13px; line-height: 1.55; color: rgba(239,232,218,0.86); }
        .ink-hud { position: absolute; z-index: 5; left: 14px; top: 12px; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 10px; color: rgba(33,30,26,0.72); pointer-events: none; max-width: calc(100% - 28px); }
        .ink-hud .acc { color: ${ACC}; }
        @media (max-width: 640px) { .ink { aspect-ratio: 5 / 4; } .ink-card p { font-size: 12.5px; line-height: 1.5; } .ink-hud { font-size: 9px; gap: 2px 10px; } }
      `}</style>
    </div>
  )
}
