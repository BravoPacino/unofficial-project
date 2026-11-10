import InkDrawing from './InkDrawing'

// Test page for the ink drawing: the drawing alone, one line of explanation. The site uses it inside Residences.
const INK = '#211e1a', PAPER = '#efe8da'

export default function Sample() {
  return (
    <main className="ink-test">
      <InkDrawing model={/villas/.test(location.search) ? 'villas' : 'homes'} />
      <p>In ink. Shadows follow the sun over George Town now; drag across the drawing to move the time of day.</p>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; background: ${PAPER}; color: ${INK}; }
        body { font-family: 'Jost', sans-serif; font-weight: 300; }
        .ink-test { max-width: 1600px; margin: 0 auto; padding: 16px; }
        .ink-test p { margin: 14px 0 0; font-size: 14px; color: rgba(33,30,26,0.7); }
      `}</style>
    </main>
  )
}
