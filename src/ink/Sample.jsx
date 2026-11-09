import InkDrawing from './InkDrawing'

// The sample sheet: one drawing in a ruled cell, a title strip under it, three short notes.
const INK = '#211e1a', PAPER = '#efe8da', RULE = 'rgba(33,30,26,0.28)', ACC = '#bd7f1f'

export default function Sample() {
  return (
    <div className="sheet">
      <header className="sheet-top">
        <div className="sheet-mark">Unofficial<br />Project</div>
        <div className="sheet-cell">Ink study 01</div>
        <div className="sheet-cell">Courtyard Homes</div>
        <div className="sheet-cell acc">Sample · not live</div>
      </header>

      <section className="sheet-plate">
        <i className="plus tl" /><i className="plus tr" /><i className="plus bl" /><i className="plus br" />
        <div className="ruler top" /><div className="ruler bot" />
        <InkDrawing />
      </section>

      <section className="sheet-title">
        <h1>Courtyard Homes,<br />front elevation</h1>
        <div className="sheet-lede">
          <p>One house from the row, redrawn as an inked plate: stippled tone, hard shadows, hairline edges. The shadows are cast by the sun over George Town at this minute.</p>
          <p className="mono">Drag across the drawing to move the day · tap a square for a note</p>
        </div>
      </section>

      <section className="sheet-notes">
        <div><b>[01] Light</b><p>The time of day is real. How long the shadows are, and which side they fall, follow the sun over George Town. Above 52° the drawn sun is held there, or every recess would sit in full shade at midday.</p></div>
        <div><b>[02] Assumed</b><p>Which way this façade faces is not known, so the light is kept in front of it, as an elevation is conventionally shaded.</p></div>
        <div><b>[03] Source</b><p>Drawn from the developer’s published render. Sizes are estimated. An unofficial concept study, not the developer’s material.</p></div>
      </section>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; background: ${PAPER}; color: ${INK}; }
        body { font-family: 'Jost', sans-serif; font-weight: 300; -webkit-font-smoothing: antialiased; }
        .sheet { max-width: 1680px; margin: 0 auto; padding: 8px; position: relative; }
        .sheet::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 20; opacity: .5; mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .13 0 0 0 0 .12 0 0 0 0 .1 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .sheet > * { border: 1px solid ${RULE}; margin-top: -1px; }
        .mono, .sheet-cell, .sheet-notes b { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }
        .sheet-top { display: grid; grid-template-columns: 1fr repeat(3, minmax(120px, 190px)); }
        .sheet-mark { padding: 14px 18px; font-family: 'Cormorant Garamond', serif; font-size: 15px; letter-spacing: .12em; text-transform: uppercase; line-height: 1.35; }
        .sheet-cell { padding: 14px 12px; border-left: 1px solid ${RULE}; display: flex; align-items: flex-start; }
        .sheet-cell.acc { color: ${ACC}; }
        .sheet-plate { position: relative; padding: 22px 0; }
        .ruler { position: absolute; left: 26px; right: 26px; height: 7px; background: repeating-linear-gradient(to right, ${RULE} 0 1px, transparent 1px 8px); pointer-events: none; }
        .ruler.top { top: 8px; } .ruler.bot { bottom: 8px; }
        .plus { position: absolute; width: 11px; height: 11px; pointer-events: none; }
        .plus::before, .plus::after { content: ''; position: absolute; background: ${INK}; }
        .plus::before { left: 5px; top: 0; width: 1px; height: 11px; } .plus::after { top: 5px; left: 0; height: 1px; width: 11px; }
        .plus.tl { left: 7px; top: 6px; } .plus.tr { right: 7px; top: 6px; } .plus.bl { left: 7px; bottom: 6px; } .plus.br { right: 7px; bottom: 6px; }
        .sheet-title { display: grid; grid-template-columns: 1.25fr 1fr; }
        .sheet-title h1 { margin: 0; padding: 26px 26px 30px; font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(2.2rem, 5vw, 4.4rem); line-height: 1.02; letter-spacing: -.01em; }
        .sheet-lede { border-left: 1px solid ${RULE}; padding: 26px; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; }
        .sheet-lede p { margin: 0; font-size: 16px; line-height: 1.6; max-width: 46ch; }
        .sheet-lede p.mono { font-size: 11px; color: ${ACC}; }
        .sheet-notes { display: grid; grid-template-columns: repeat(3, 1fr); }
        .sheet-notes > div { padding: 20px 26px 26px; }
        .sheet-notes > div + div { border-left: 1px solid ${RULE}; }
        .sheet-notes b { display: block; font-weight: 500; margin-bottom: 12px; }
        .sheet-notes p { margin: 0; font-size: 14.5px; line-height: 1.6; color: rgba(33,30,26,0.78); max-width: 40ch; }
        @media (max-width: 760px) {
          .sheet-top { grid-template-columns: 1fr 1fr; } .sheet-mark { grid-column: 1 / -1; border-bottom: 1px solid ${RULE}; }
          .sheet-top .sheet-cell:nth-child(2) { border-left: 0; } .sheet-top .sheet-cell.acc { display: none; }
          .sheet-title, .sheet-notes { grid-template-columns: 1fr; }
          .sheet-lede, .sheet-notes > div + div { border-left: 0; border-top: 1px solid ${RULE}; }
          .sheet-title h1 { padding: 20px 16px 22px; } .sheet-lede, .sheet-notes > div { padding: 18px 16px 20px; }
        }
      `}</style>
    </div>
  )
}
