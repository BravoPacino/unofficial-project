import { useState, useEffect, useCallback } from 'react'
import Lenis from 'lenis'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Grain from './components/Grain'
import Transition from './components/Transition'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Idea from './components/Idea'
import Residences from './components/Residences'
import Facilities from './components/Facilities'
import Location from './components/Location'
import Enquire from './components/Enquire'
import Footer from './components/Footer'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap } from 'gsap'
import Masterplan from './components/Masterplan'
import Take from './ink/Take'
import { lenisRef } from './lib/lenis'

gsap.registerPlugin(ScrollTrigger)

// The one take (docs/animation-plan.md) is the page, unless it cannot or should not run: then the sectioned page,
// which says the same things. ?sections asks for it; reduced motion and no WebGL get it without asking.
const canWebGL = () => {
  try { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); return !!g } catch { return false }
}
const wantSections = () => /sections/.test(location.search) || matchMedia('(prefers-reduced-motion: reduce)').matches || !canWebGL()

function App() {
  const [sections, setSections] = useState(wantSections)
  const onFail = useCallback(() => setSections(true), [])
  const [loaded, setLoaded] = useState(false)
  const [curtain, setCurtain] = useState(true)
  const onLift = useCallback(() => setLoaded(true), [])
  const onDone = useCallback(() => setCurtain(false), [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => { lenisRef.current = null; lenis.destroy() }
  }, [])

  return (
    <div style={{ background: '#080806', minHeight: '100vh' }}>
      <Grain />
      <Cursor />
      <Transition />
      {curtain && <Preloader onLift={onLift} onDone={onDone} />}
      {loaded && <>
            <Navbar />
            <main>
              <Hero push={!sections} />
              {sections ? <>
                <Idea />
                <Location />
                <Masterplan />
                <Residences />
                <Facilities />
                <Enquire />
              </> : <>
                <Location scrub />
                <Masterplan />
                <Take onFail={onFail} />
              </>}
            </main>
            <Footer />
          </>}
    </div>
  )
}

export default App