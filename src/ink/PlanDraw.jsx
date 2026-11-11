import { useMemo } from 'react'
import plan from '../data/sitePlan.js'

// The masterplan drawing itself in ink (docs/hero-plan.md): every line of the plan (src/data/sitePlan.js, in plan units,
// 516 × 789, north up) is a path that draws from end to end, the long lines first (the site's edge and the drives), then the
// plots row by row from north to south, then the pool valley and its facilities. The paths sit in a <g> whose transform the
// owner sets (gRef), so the plan can lie exactly on the three-dimensional estate seen from above.
// still: drawn at once (reduced motion; or a page with no scroll-driven estate behind it).
const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x) }

function pieces() {
  const out = []
  const len = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
  plan.lines.forEach(([x1, y1, x2, y2, g], i) => out.push({ d: `M${x1} ${y1}L${x2} ${y2}`, g, y: (y1 + y2) / 2, n: len(x1, y1, x2, y2), i }))
  plan.paths.forEach(({ d, g }, i) => {
    const m = d.match(/-?\d+\.?\d*/g)?.map(Number) || [0, 0]
    out.push({ d, g, y: m[1], n: 60, i: 1000 + i })
  })
  plan.rects.forEach(([x, y, w, h, g, fill], i) => { if (!fill) out.push({ d: `M${x} ${y}h${w}v${h}h${-w}Z`, g, y: y + h / 2, n: 2 * (w + h), i: 2000 + i }) })
  plan.circles.forEach(([cx, cy, r, g], i) => out.push({ d: `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, g, y: cy, n: 2 * Math.PI * r, i: 3000 + i }))
  // when each line starts (s) and how long it takes (s): the edge and drives, then the plots north to south, then the valley
  const long = out.filter((p) => !p.g && p.n > 150).sort((a, b) => b.n - a.n)
  long.forEach((p, k) => { p.t = 0.05 + 0.5 * (k / Math.max(1, long.length - 1)); p.dur = 0.9 })
  for (const p of out) {
    if (p.t !== undefined) continue
    if (!p.g) { p.t = 0.45 + 1.25 * Math.max(0, Math.min(1, (p.y - 30) / 740)) + 0.12 * rnd(p.i); p.dur = 0.5 }
    else { p.t = 1.55 + 0.6 * rnd(p.i); p.dur = 0.6 }
  }
  return out
}

export default function PlanDraw({ gRef, tone = 'paper', still = false, className = '' }) {
  const all = useMemo(() => pieces(), [])
  return (
    <svg className={`plan-draw plan-${tone}${still ? ' plan-still' : ''} ${className}`} aria-hidden="true">
      <g ref={gRef}>
        {all.map((p) => (
          <path key={p.i} d={p.d} pathLength="1" className={p.g ? 'pg' : undefined} style={{ animationDelay: `${p.t.toFixed(2)}s`, animationDuration: `${p.dur}s` }} />
        ))}
      </g>
      <style>{`
        .plan-draw { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
        .plan-draw path { fill: none; stroke: var(--plan-ink); stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 1 1; stroke-dashoffset: 1; animation-name: plan-draw; animation-timing-function: cubic-bezier(.4,.1,.3,1); animation-fill-mode: forwards; }
        .plan-draw path.pg { stroke: var(--plan-ink-2); }
        .plan-paper { --plan-ink: rgba(33,30,26,.82); --plan-ink-2: rgba(33,30,26,.55); }
        .plan-dark { --plan-ink: rgba(200,168,107,.75); --plan-ink-2: rgba(200,168,107,.5); }
        .plan-still path { animation: none; stroke-dashoffset: 0; }
        @keyframes plan-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { .plan-draw path { animation: none; stroke-dashoffset: 0; } }
      `}</style>
    </svg>
  )
}
