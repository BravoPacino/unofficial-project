import { useEffect, useRef } from 'react'
import { makeStage } from './stage'
import { estate } from './estate'
import { dayOf, lightAt } from './light'

// Test page: the estate in mass (estate.js), from straight above and from the south-west, high, as the brochure's
// aerial looks at it. /unofficial-project/sample.html?estate
const VIEWS = [
  { name: 'plan', look: { eye: [0, 340, 6], at: [0, 0, 0], fov: 48, aspect: 0.62 }, shadow: { x: 0, z: 0, r: 160 } },
  { name: 'aerial', look: { eye: [-150, 120, 210], at: [0, 2, 10], fov: 34, aspect: 16 / 9 }, shadow: { x: 0, z: 20, r: 170 } },
]

function View({ v }) {
  const ref = useRef()
  useEffect(() => {
    const c = ref.current, w = c.clientWidth, h = c.clientHeight
    const st = makeStage(c, { view: v })
    estate(st.kit); st.finish()
    st.resize(w, h, v)
    const now = Date.now()
    st.render(lightAt(now, dayOf(now)).dir)
    return () => st.dispose()
  }, [v])
  return <figure style={{ margin: 0 }}><canvas ref={ref} style={{ width: '100%', aspectRatio: v.look.aspect, display: 'block', background: '#efe8da' }} /><figcaption style={{ font: '12px monospace', color: '#efe8da' }}>{v.name}</figcaption></figure>
}

export default function EstateTest() {
  return (
    <main style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.4fr', gap: 12, padding: 12, background: '#2a2622', alignItems: 'start' }}>
      {VIEWS.map((v) => <View key={v.name} v={v} />)}
    </main>
  )
}
