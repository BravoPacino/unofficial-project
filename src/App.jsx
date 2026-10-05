import { useState, useEffect, useCallback } from 'react'
import Lenis from 'lenis'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Grain from './components/Grain'
import Transition from './components/Transition'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Pillars from './components/Pillars'
import Residences from './components/Residences'
import Facilities from './components/Facilities'
import Location from './components/Location'
import Enquire from './components/Enquire'
import Footer from './components/Footer'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap } from 'gsap'
import Masterplan from './components/Masterplan'
import { lenisRef } from './lib/lenis'

gsap.registerPlugin(ScrollTrigger)
function App() {
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
              <Hero />
              <About />
              <Pillars />
              <Residences />
              <Masterplan />
              <Facilities />
              <Location />
              <Enquire />
            </main>
            <Footer />
          </>}
    </div>
  )
}

export default App