import InkPlate from './InkPlate'
import { SCENES } from './scenes'

// Test page: every oblique ink scene at its own shape. /unofficial-project/sample.html?plates
export default function PlateTest() {
  return (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 640px), 1fr))', gap: 12, padding: 12, background: '#2a2622' }}>
      {Object.keys(SCENES).map((k) => (
        <figure key={k} style={{ margin: 0 }}>
          <div style={{ position: 'relative', aspectRatio: k === 'aerial' ? '9 / 16' : '2 / 1', maxHeight: k === 'aerial' ? 900 : undefined }}>
            <InkPlate scene={k} still="" alt={k} />
          </div>
          <figcaption style={{ color: '#efe8da', font: '12px monospace', padding: '4px 0' }}>{k}</figcaption>
        </figure>
      ))}
    </main>
  )
}
