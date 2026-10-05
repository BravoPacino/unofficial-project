import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
const facilityData = [
  {
    title: 'AERO',
    sections: [
      {
        level: 'Level 2',
        items: [
          { id: 'aero-l2-ad',    label: 'A. Communal Pavilion' },
          { id: 'aero-l2-b',     label: 'B. BBQ Area' },
          { id: 'aero-l2-c',     label: 'C. Herbs Garden' },
          { id: 'aero-l2-ad',    label: 'D. Green Enclave' },
          { id: 'aero-e-aqua-v', label: "E. Kids' Adventure Circuit" },
          { id: 'aero-l2-f',     label: 'F. Observation Pavilion' },
          { id: 'aero-l2-g',     label: 'G. Fitness Zone' },
          { id: 'aero-l2-h',     label: 'H. Multipurpose Track' },
          { id: 'aero-l2-i',     label: 'I. Pedestrian Bridges' },
        ]
      },
      {
        level: 'Level G',
        items: [
          { id: 'aero-lg-a', label: 'A. Guard House' },
          { id: 'aero-lg-b', label: 'B. Mailbox and Parcel Collection' },
          { id: 'aero-lg-c', label: 'C. Lobby' },
        ]
      },
      {
        level: 'Level B1',
        items: [
          { id: 'aero-lb1-d', label: 'D. Nursery Area' },
        ]
      }
    ]
  },
  {
    title: 'AQUA',
    sections: [
      {
        level: 'Level B2',
        items: [
          { id: 'aqua-lb2-a',    label: 'A. Verdant Green Wall' },
          { id: 'aqua-lb2-b',    label: 'B. Resting Nooks' },
          { id: 'aqua-lb2-c',    label: 'C. Poolside Crosswalk' },
          { id: 'aqua-lb2-d',    label: 'D. Lounge Decks' },
          { id: 'aqua-lb2-e',    label: 'E. Aqua Gym' },
          { id: 'aqua-lb2-f',    label: 'F. Designer Landscape' },
          { id: 'aqua-lb2-g',    label: 'G. Swimming Pool' },
          { id: 'aqua-lb2-h',    label: 'H. Reading Nook' },
          { id: 'aqua-lb2-i',    label: 'I. Island Oasis' },
          { id: 'aqua-lb2-j',    label: 'J. Poolside Cabanas' },
          { id: 'aqua-lb2-k',    label: 'K. Floating Gym' },
          { id: 'aqua-lb2-l',    label: 'L. Changing Room' },
          { id: 'aqua-lb2-m',    label: 'M. Sauna' },
          { id: 'aqua-lb2-n',    label: 'N. Fitness Studio' },
          { id: 'aqua-lb2-o',    label: 'O. Jacuzzi Retreat' },
          { id: 'aqua-lb2-p',    label: 'P. Bubbling Relaxation Pool' },
          { id: 'aqua-lb2-q',    label: "Q. Kids' Splash Pool" },
          { id: 'aqua-lb2-r',    label: "R. Kids' Adventure Treehouse" },
          { id: 'aqua-lb2-s',    label: 'S. Social Lawn' },
          { id: 'aqua-lb2-tu',   label: 'T. Games Room' },
          { id: 'aqua-lb2-tu',   label: 'U. Gourmet Pantry' },
          { id: 'aero-e-aqua-v', label: 'V. Resting Lounge' },
          { id: 'aqua-lb2-w',    label: 'W. Function Halls' },
        ]
      }
    ]
  }
]

export default function Masterplan() {
  const sectionRef = useRef()
  const svgWrapRef = useRef()
  const listRef    = useRef()

  useEffect(() => {
    const svgEl  = svgWrapRef.current
    const listEl = listRef.current
    if (!svgEl || !listEl) return

    const activate = (targetId) => {
      const group = svgEl.querySelector(`#${targetId}`)
      if (group) group.classList.add('active')
      listEl.querySelectorAll(`[data-target="${targetId}"]`)
            .forEach(li => li.classList.add('active'))
    }

    const deactivate = (targetId) => {
      const group = svgEl.querySelector(`#${targetId}`)
      if (group) group.classList.remove('active')
      listEl.querySelectorAll(`[data-target="${targetId}"]`)
            .forEach(li => li.classList.remove('active'))
    }

    const listItems = listEl.querySelectorAll('.facility-item')
    listItems.forEach(li => {
      const onEnter = () => activate(li.dataset.target)
      const onLeave = () => deactivate(li.dataset.target)
      li.addEventListener('mouseenter', onEnter)
      li.addEventListener('mouseleave', onLeave)
      li._onEnter = onEnter
      li._onLeave = onLeave
    })

    const svgGroups = svgEl.querySelectorAll('.interactive-group')
    svgGroups.forEach(group => {
      const targetId = group.id
      const onEnter = () => {
        activate(targetId)
        const firstMatch = listEl.querySelector(`[data-target="${targetId}"]`)
        if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      const onLeave = () => deactivate(targetId)
      group.addEventListener('mouseenter', onEnter)
      group.addEventListener('mouseleave', onLeave)
      group._onEnter = onEnter
      group._onLeave = onLeave
    })

    return () => {
      listItems.forEach(li => {
        li.removeEventListener('mouseenter', li._onEnter)
        li.removeEventListener('mouseleave', li._onLeave)
      })
      svgGroups.forEach(group => {
        group.removeEventListener('mouseenter', group._onEnter)
        group.removeEventListener('mouseleave', group._onLeave)
      })
    }
  }, [])
  useEffect(() => {
  const listEl = listRef.current
  const svgEl  = svgWrapRef.current
  if (!listEl || !svgEl) return

  const items = Array.from(listEl.querySelectorAll('.facility-item'))
  const total = items.length

  const resetAll = () => {
    items.forEach(li => li.classList.remove('active'))
    svgEl.querySelectorAll('.interactive-group')
         .forEach(g => g.classList.remove('active'))
  }

  resetAll()

  const st = ScrollTrigger.create({
    trigger: sectionRef.current,
    start: 'top -30%',
    end: () => `+=${total * 130}`,
    pin: true,
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress
      const activeCount = Math.floor(progress * total)

      items.forEach((li, i) => {
        const shouldBeActive = i < activeCount
        const isActive = li.classList.contains('active')

        if (shouldBeActive && !isActive) {
          li.classList.add('active')
          const targetId = li.dataset.target
          const group = svgEl.querySelector(`#${targetId}`)
          if (group) group.classList.add('active')

        } else if (!shouldBeActive && isActive) {
          li.classList.remove('active')
          const targetId = li.dataset.target
          const group = svgEl.querySelector(`#${targetId}`)
          if (group) group.classList.remove('active')
        }
      })
    },
    onLeaveBack: resetAll,
  })

  return () => st.kill()
}, [])

  return (
    <section ref={sectionRef} id="masterplan" style={{
      background: '#0e0d0b',
      padding: '8rem 4rem',
    }}>

      <style>{`
        .facility-item {
          padding: 0.4rem 0.8rem;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: rgba(240,232,213,0.4);
          border-left: 2px solid transparent;
          cursor: crosshair;
          transition: all 0.25s ease;
          list-style: none;
          text-transform: uppercase;
        }
        .facility-item:hover,
        .facility-item.active {
          color: #f0e8d5;
          border-left-color: #c8a86b;
          background: rgba(200,168,107,0.06);
          transform: translateX(8px);
        }
        .interactive-group.active line,
        .interactive-group.active path,
        .interactive-group.active rect,
        .interactive-group.active circle {
          stroke: #f4d03f !important;
          stroke-width: 2.5px !important;
          filter: drop-shadow(0 0 6px rgba(244,208,63,0.7));
        }
      
        .masterplan-list {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .masterplan-list::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }


      `}</style>

      <div style={{ marginBottom: '4rem' }}>
        <p style={{
          fontSize: '0.58rem', letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#c8a86b',
          marginBottom: '0.8rem'
        }}>/ Site Plan /</p>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(2.4rem,4vw,3.5rem)',
          fontWeight: 300, lineHeight: 1.1,
          marginBottom: '0.8rem'
        }}>Explore the<br />Masterplan</h2>
        <p style={{
          fontSize: '0.72rem',
          color: 'rgba(240,232,213,0.4)',
          letterSpacing: '0.06em'
        }}>Hover any zone to discover the facilities within</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '2rem',
        alignItems: 'start',
        height: '70vh',
        maxWidth: '1200px',
        margin:'0 auto'
        
      }}>

        <div style={{ position: 'sticky', top: '6rem', height: '100%' }}>
          <div
            ref={svgWrapRef}
            style={{
              border: 'none',
              background: '#0e0d0b',
              overflow: 'hidden',
              height: '450px',
              
            }}
          >

            

            <svg
              viewBox="0 0 516 789"
              width="100%"
              height="100%" 
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              
<rect width="516" height="789" fill="#0e0d0b"/>
<line x1="34.9918" y1="31.517" x2="212.992" y2="28.5001" stroke="#c8a86b"/>
<line x1="35.5" y1="32" x2="35.5" y2="110" stroke="#c8a86b"/>
<line x1="36.4969" y1="109.002" x2="34.5" y2="755.002" stroke="#c8a86b"/>
<line x1="34.3293" y1="755.624" x2="50.3293" y2="769.624" stroke="#c8a86b"/>
<line x1="49.8982" y1="769.51" x2="251.898" y2="727.51" stroke="#c8a86b"/>
<line x1="252" y1="727.5" x2="483" y2="727.5" stroke="#c8a86b"/>
<line x1="483.5" y1="29" x2="483.5" y2="728" stroke="#c8a86b"/>
<line x1="213.5" y1="28" x2="213.5" y2="37" stroke="#c8a86b"/>
<line x1="212.988" y1="36.5261" x2="483.987" y2="29.5002" stroke="#c8a86b"/>
<line x1="36" y1="78.5" x2="115" y2="78.5" stroke="#c8a86b"/>
<line x1="114.5" y1="30" x2="114.5" y2="90" stroke="#c8a86b"/>
<line x1="443" y1="90.5" x2="114" y2="90.5" stroke="#c8a86b"/>
<line x1="148.5" y1="29" x2="148.5" y2="90" stroke="#c8a86b"/>
<line x1="181.5" y1="29" x2="181.5" y2="90" stroke="#c8a86b"/>
<line x1="213.5" y1="37" x2="213.5" y2="90" stroke="#c8a86b"/>
<line x1="245.5" y1="89.9907" x2="246.5" y2="35.9907" stroke="#c8a86b"/>
<line x1="279.5" y1="35" x2="279.5" y2="90" stroke="#c8a86b"/>
<line x1="312.5" y1="34" x2="312.5" y2="90" stroke="#c8a86b"/>
<line x1="344.5" y1="33" x2="344.5" y2="90" stroke="#c8a86b"/>
<line x1="378.5" y1="32" x2="378.5" y2="90" stroke="#c8a86b"/>
<line x1="410.5" y1="30.994" x2="411.5" y2="113.994" stroke="#c8a86b"/>
<line x1="443.5" y1="31" x2="443.5" y2="116" stroke="#c8a86b"/>
<line x1="119" y1="701.5" x2="34" y2="701.5" stroke="#c8a86b"/>
<line x1="99.5" y1="79" x2="99.4707" y2="702.001" stroke="#c8a86b"/>
<path d="M35.5 405.5H99.5" stroke="#c8a86b"/>
<line x1="35" y1="570.5" x2="99" y2="570.5" stroke="#c8a86b"/>
<line x1="35" y1="604.5" x2="99" y2="604.5" stroke="#c8a86b"/>
<line x1="35" y1="636.5" x2="99" y2="636.5" stroke="#c8a86b"/>
<line x1="35" y1="670.5" x2="99" y2="670.5" stroke="#c8a86b"/>
<line x1="118.5" y1="696" x2="118.5" y2="738" stroke="#c8a86b"/>
<line x1="118.171" y1="738.47" x2="107.171" y2="742.47" stroke="#c8a86b"/>
<line x1="107.5" y1="740" x2="107.5" y2="759" stroke="#c8a86b"/>
<line x1="107" y1="740.5" x2="35" y2="740.5" stroke="#c8a86b"/>
<line x1="142" y1="123.5" x2="218" y2="123.5" stroke="#c8a86b"/>
<line x1="282" y1="124.5" x2="357" y2="124.5" stroke="#c8a86b"/>
<line x1="146.5" y1="124" x2="146.5" y2="254" stroke="#c8a86b"/>
<line x1="353.5" y1="124" x2="353.5" y2="253" stroke="#c8a86b"/>


<g id="aqua-lb2-f" class="interactive-group">
  <line x1="274.5" y1="252" x2="274.5" y2="123" stroke="#c8a86b"/>
  <line x1="276.5" y1="252" x2="276.5" y2="116" stroke="#c8a86b"/>
  <line x1="276.5" y1="484" x2="276.5" y2="268" stroke="#c8a86b"/>
  <line x1="274.5" y1="484" x2="274.5" y2="268" stroke="#c8a86b"/>
  <line x1="276.5" y1="500" x2="276.5" y2="629" stroke="#c8a86b"/>
  <line x1="274.5" y1="500" x2="274.5" y2="629" stroke="#c8a86b"/>
  <line x1="223.5" y1="499" x2="223.5" y2="629" stroke="#c8a86b"/>
  <line x1="225.5" y1="499" x2="225.5" y2="629" stroke="#c8a86b"/>
  <line x1="223.5" y1="484" x2="223.5" y2="268" stroke="#c8a86b"/>
  <line x1="225.5" y1="484" x2="225.5" y2="268" stroke="#c8a86b"/>
  <line x1="222.5" y1="254" x2="222.5" y2="117" stroke="#c8a86b"/>
  <line x1="224.5" y1="254" x2="224.5" y2="119" stroke="#c8a86b"/>
</g>


<line x1="142" y1="145.5" x2="223" y2="145.5" stroke="#c8a86b"/>
<line x1="142" y1="253.5" x2="224" y2="253.5" stroke="#c8a86b"/>
<line x1="142" y1="231.5" x2="223" y2="231.5" stroke="#c8a86b"/>
<line x1="142" y1="209.5" x2="223" y2="209.5" stroke="#c8a86b"/>
<line x1="142" y1="188.5" x2="223" y2="188.5" stroke="#c8a86b"/>
<line x1="142" y1="167.5" x2="223" y2="167.5" stroke="#c8a86b"/>
<line x1="162.5" y1="117" x2="162.5" y2="124" stroke="#c8a86b"/>
<line x1="335.5" y1="117" x2="335.5" y2="124" stroke="#c8a86b"/>
<line x1="350.5" y1="116" x2="350.5" y2="124" stroke="#c8a86b"/>
<line x1="172" y1="140.5" x2="196" y2="140.5" stroke="#c8a86b"/>
<line x1="195.5" y1="145" x2="195.5" y2="141" stroke="#c8a86b"/>
<line x1="172.5" y1="145" x2="172.5" y2="141" stroke="#c8a86b"/>
<line x1="172" y1="140.5" x2="196" y2="140.5" stroke="#c8a86b"/>
<line x1="195.5" y1="145" x2="195.5" y2="141" stroke="#c8a86b"/>
<line x1="172.5" y1="145" x2="172.5" y2="141" stroke="#c8a86b"/>
<line x1="172" y1="249.5" x2="196" y2="249.5" stroke="#c8a86b"/>
<line x1="195.5" y1="254" x2="195.5" y2="250" stroke="#c8a86b"/>
<line x1="172.5" y1="254" x2="172.5" y2="250" stroke="#c8a86b"/>
<line x1="172" y1="227.5" x2="196" y2="227.5" stroke="#c8a86b"/>
<line x1="195.5" y1="232" x2="195.5" y2="228" stroke="#c8a86b"/>
<line x1="172.5" y1="232" x2="172.5" y2="228" stroke="#c8a86b"/>
<line x1="172" y1="205.5" x2="196" y2="205.5" stroke="#c8a86b"/>
<line x1="195.5" y1="210" x2="195.5" y2="206" stroke="#c8a86b"/>
<line x1="172.5" y1="210" x2="172.5" y2="206" stroke="#c8a86b"/>
<line x1="172" y1="184.5" x2="196" y2="184.5" stroke="#c8a86b"/>
<line x1="195.5" y1="189" x2="195.5" y2="185" stroke="#c8a86b"/>
<line x1="172.5" y1="189" x2="172.5" y2="185" stroke="#c8a86b"/>
<line x1="172" y1="162.5" x2="196" y2="162.5" stroke="#c8a86b"/>
<line x1="195.5" y1="167" x2="195.5" y2="163" stroke="#c8a86b"/>
<line x1="172.5" y1="167" x2="172.5" y2="163" stroke="#c8a86b"/>
<line x1="276" y1="145.5" x2="357" y2="145.5" stroke="#c8a86b"/>
<line x1="303" y1="140.5" x2="327" y2="140.5" stroke="#c8a86b"/>
<line x1="326.5" y1="145" x2="326.5" y2="141" stroke="#c8a86b"/>
<line x1="303.5" y1="145" x2="303.5" y2="141" stroke="#c8a86b"/>
<line x1="276" y1="231.5" x2="357" y2="231.5" stroke="#c8a86b"/>
<line x1="303" y1="226.5" x2="327" y2="226.5" stroke="#c8a86b"/>
<line x1="326.5" y1="231" x2="326.5" y2="227" stroke="#c8a86b"/>
<line x1="303.5" y1="231" x2="303.5" y2="227" stroke="#c8a86b"/>
<line x1="274" y1="252.5" x2="357" y2="252.5" stroke="#c8a86b"/>
<line x1="303" y1="247.5" x2="327" y2="247.5" stroke="#c8a86b"/>
<line x1="326.5" y1="252" x2="326.5" y2="248" stroke="#c8a86b"/>
<line x1="303.5" y1="252" x2="303.5" y2="248" stroke="#c8a86b"/>
<line x1="276" y1="210.5" x2="357" y2="210.5" stroke="#c8a86b"/>
<line x1="303" y1="205.5" x2="327" y2="205.5" stroke="#c8a86b"/>
<line x1="326.5" y1="210" x2="326.5" y2="206" stroke="#c8a86b"/>
<line x1="303.5" y1="210" x2="303.5" y2="206" stroke="#c8a86b"/>
<line x1="276" y1="188.5" x2="357" y2="188.5" stroke="#c8a86b"/>
<line x1="303" y1="183.5" x2="327" y2="183.5" stroke="#c8a86b"/>
<line x1="326.5" y1="188" x2="326.5" y2="184" stroke="#c8a86b"/>
<line x1="303.5" y1="188" x2="303.5" y2="184" stroke="#c8a86b"/>
<line x1="276" y1="167.5" x2="357" y2="167.5" stroke="#c8a86b"/>
<line x1="303" y1="162.5" x2="327" y2="162.5" stroke="#c8a86b"/>
<line x1="326.5" y1="167" x2="326.5" y2="163" stroke="#c8a86b"/>
<line x1="303.5" y1="167" x2="303.5" y2="163" stroke="#c8a86b"/>
<line x1="217" y1="130.5" x2="220" y2="130.5" stroke="#c8a86b"/>
<line x1="218" y1="152.5" x2="221" y2="152.5" stroke="#c8a86b"/>
<line x1="218" y1="195.5" x2="221" y2="195.5" stroke="#c8a86b"/>
<line x1="218" y1="216.5" x2="221" y2="216.5" stroke="#c8a86b"/>
<line x1="218" y1="238.5" x2="221" y2="238.5" stroke="#c8a86b"/>
<line x1="218" y1="174.5" x2="221" y2="174.5" stroke="#c8a86b"/>
<line x1="220.5" y1="131" x2="220.5" y2="146" stroke="#c8a86b"/>
<line x1="220.5" y1="153" x2="220.5" y2="168" stroke="#c8a86b"/>
<line x1="220.5" y1="174" x2="220.5" y2="189" stroke="#c8a86b"/>
<line x1="220.5" y1="195" x2="220.5" y2="210" stroke="#c8a86b"/>
<line x1="220.5" y1="216" x2="220.5" y2="231" stroke="#c8a86b"/>
<line x1="220.5" y1="238" x2="220.5" y2="253" stroke="#c8a86b"/>
<line x1="217.5" y1="124" x2="217.5" y2="131" stroke="#c8a86b"/>
<line x1="217.5" y1="232" x2="217.5" y2="239" stroke="#c8a86b"/>
<line x1="217.5" y1="210" x2="217.5" y2="217" stroke="#c8a86b"/>
<line x1="217.5" y1="189" x2="217.5" y2="196" stroke="#c8a86b"/>
<line x1="217.5" y1="168" x2="217.5" y2="175" stroke="#c8a86b"/>
<line x1="217.5" y1="146" x2="217.5" y2="153" stroke="#c8a86b"/>
<line x1="146.5" y1="499" x2="146.5" y2="629" stroke="#c8a86b"/>

<line x1="142" y1="521.5" x2="223" y2="521.5" stroke="#c8a86b"/>
<line x1="143" y1="499.5" x2="226" y2="499.5" stroke="#c8a86b"/>
<line x1="142" y1="606.5" x2="223" y2="606.5" stroke="#c8a86b"/>
<line x1="142" y1="585.5" x2="223" y2="585.5" stroke="#c8a86b"/>
<line x1="142" y1="563.5" x2="223" y2="563.5" stroke="#c8a86b"/>
<line x1="142" y1="542.5" x2="223" y2="542.5" stroke="#c8a86b"/>
<line x1="172" y1="516.5" x2="196" y2="516.5" stroke="#c8a86b"/>
<line x1="195.5" y1="521" x2="195.5" y2="517" stroke="#c8a86b"/>
<line x1="172.5" y1="521" x2="172.5" y2="517" stroke="#c8a86b"/>
<line x1="172" y1="516.5" x2="196" y2="516.5" stroke="#c8a86b"/>
<line x1="195.5" y1="521" x2="195.5" y2="517" stroke="#c8a86b"/>
<line x1="172.5" y1="521" x2="172.5" y2="517" stroke="#c8a86b"/>
<line x1="172" y1="602.5" x2="196" y2="602.5" stroke="#c8a86b"/>
<line x1="195.5" y1="607" x2="195.5" y2="603" stroke="#c8a86b"/>
<line x1="172.5" y1="607" x2="172.5" y2="603" stroke="#c8a86b"/>
<line x1="172" y1="624.5" x2="196" y2="624.5" stroke="#c8a86b"/>
<line x1="195.5" y1="629" x2="195.5" y2="625" stroke="#c8a86b"/>
<line x1="172.5" y1="629" x2="172.5" y2="625" stroke="#c8a86b"/>
<line x1="172" y1="581.5" x2="196" y2="581.5" stroke="#c8a86b"/>
<line x1="195.5" y1="586" x2="195.5" y2="582" stroke="#c8a86b"/>
<line x1="172.5" y1="586" x2="172.5" y2="582" stroke="#c8a86b"/>
<line x1="172" y1="559.5" x2="196" y2="559.5" stroke="#c8a86b"/>
<line x1="195.5" y1="564" x2="195.5" y2="560" stroke="#c8a86b"/>
<line x1="172.5" y1="564" x2="172.5" y2="560" stroke="#c8a86b"/>
<line x1="172" y1="537.5" x2="196" y2="537.5" stroke="#c8a86b"/>
<line x1="195.5" y1="542" x2="195.5" y2="538" stroke="#c8a86b"/>
<line x1="172.5" y1="542" x2="172.5" y2="538" stroke="#c8a86b"/>
<line x1="217" y1="506.5" x2="221" y2="506.5" stroke="#c8a86b"/>
<line x1="218" y1="527.5" x2="221" y2="527.5" stroke="#c8a86b"/>
<line x1="218" y1="570.5" x2="221" y2="570.5" stroke="#c8a86b"/>
<line x1="218" y1="591.5" x2="221" y2="591.5" stroke="#c8a86b"/>
<line x1="218" y1="613.5" x2="221" y2="613.5" stroke="#c8a86b"/>
<line x1="218" y1="549.5" x2="221" y2="549.5" stroke="#c8a86b"/>
<line x1="217.5" y1="500" x2="217.5" y2="507" stroke="#c8a86b"/>
<line x1="217.5" y1="607" x2="217.5" y2="614" stroke="#c8a86b"/>
<line x1="217.5" y1="585" x2="217.5" y2="592" stroke="#c8a86b"/>
<line x1="217.5" y1="564" x2="217.5" y2="571" stroke="#c8a86b"/>
<line x1="217.5" y1="543" x2="217.5" y2="550" stroke="#c8a86b"/>
<line x1="217.5" y1="521" x2="217.5" y2="528" stroke="#c8a86b"/>
<line x1="142" y1="376.5" x2="223" y2="376.5" stroke="#c8a86b"/>
<line x1="142" y1="354.5" x2="223" y2="354.5" stroke="#c8a86b"/>
<line x1="142" y1="332.5" x2="223" y2="332.5" stroke="#c8a86b"/>
<line x1="142" y1="311.5" x2="223" y2="311.5" stroke="#c8a86b"/>
<line x1="142" y1="290.5" x2="223" y2="290.5" stroke="#c8a86b"/>
<line x1="172" y1="372.5" x2="196" y2="372.5" stroke="#c8a86b"/>
<line x1="195.5" y1="377" x2="195.5" y2="373" stroke="#c8a86b"/>
<line x1="172.5" y1="377" x2="172.5" y2="373" stroke="#c8a86b"/>
<line x1="172" y1="350.5" x2="196" y2="350.5" stroke="#c8a86b"/>
<line x1="195.5" y1="355" x2="195.5" y2="351" stroke="#c8a86b"/>
<line x1="172.5" y1="355" x2="172.5" y2="351" stroke="#c8a86b"/>
<line x1="172" y1="328.5" x2="196" y2="328.5" stroke="#c8a86b"/>
<line x1="195.5" y1="333" x2="195.5" y2="329" stroke="#c8a86b"/>
<line x1="172.5" y1="333" x2="172.5" y2="329" stroke="#c8a86b"/>
<line x1="172" y1="307.5" x2="196" y2="307.5" stroke="#c8a86b"/>
<line x1="195.5" y1="312" x2="195.5" y2="308" stroke="#c8a86b"/>
<line x1="172.5" y1="312" x2="172.5" y2="308" stroke="#c8a86b"/>
<line x1="172" y1="285.5" x2="196" y2="285.5" stroke="#c8a86b"/>
<line x1="195.5" y1="290" x2="195.5" y2="286" stroke="#c8a86b"/>
<line x1="172.5" y1="290" x2="172.5" y2="286" stroke="#c8a86b"/>
<line x1="218" y1="275.5" x2="221" y2="275.5" stroke="#c8a86b"/>
<line x1="218" y1="318.5" x2="221" y2="318.5" stroke="#c8a86b"/>
<line x1="218" y1="339.5" x2="221" y2="339.5" stroke="#c8a86b"/>
<line x1="218" y1="361.5" x2="221" y2="361.5" stroke="#c8a86b"/>
<line x1="218" y1="297.5" x2="221" y2="297.5" stroke="#c8a86b"/>
<line x1="220.5" y1="276" x2="220.5" y2="291" stroke="#c8a86b"/>
<line x1="220.5" y1="297" x2="220.5" y2="312" stroke="#c8a86b"/>
<line x1="220.5" y1="318" x2="220.5" y2="333" stroke="#c8a86b"/>
<line x1="220.5" y1="339" x2="220.5" y2="354" stroke="#c8a86b"/>
<line x1="220.5" y1="361" x2="220.5" y2="376" stroke="#c8a86b"/>
<line x1="217.5" y1="355" x2="217.5" y2="362" stroke="#c8a86b"/>
<line x1="217.5" y1="333" x2="217.5" y2="340" stroke="#c8a86b"/>
<line x1="217.5" y1="312" x2="217.5" y2="319" stroke="#c8a86b"/>
<line x1="217.5" y1="291" x2="217.5" y2="298" stroke="#c8a86b"/>
<line x1="217.5" y1="269" x2="217.5" y2="276" stroke="#c8a86b"/>
<line x1="142" y1="483.5" x2="225" y2="483.5" stroke="#c8a86b"/>
<line x1="142" y1="461.5" x2="223" y2="461.5" stroke="#c8a86b"/>
<line x1="142" y1="439.5" x2="223" y2="439.5" stroke="#c8a86b"/>
<line x1="142" y1="418.5" x2="223" y2="418.5" stroke="#c8a86b"/>
<line x1="142" y1="397.5" x2="223" y2="397.5" stroke="#c8a86b"/>
<line x1="172" y1="479.5" x2="196" y2="479.5" stroke="#c8a86b"/>
<line x1="195.5" y1="484" x2="195.5" y2="480" stroke="#c8a86b"/>
<line x1="172.5" y1="484" x2="172.5" y2="480" stroke="#c8a86b"/>
<line x1="172" y1="457.5" x2="196" y2="457.5" stroke="#c8a86b"/>
<line x1="195.5" y1="462" x2="195.5" y2="458" stroke="#c8a86b"/>
<line x1="172.5" y1="462" x2="172.5" y2="458" stroke="#c8a86b"/>
<line x1="172" y1="435.5" x2="196" y2="435.5" stroke="#c8a86b"/>
<line x1="195.5" y1="440" x2="195.5" y2="436" stroke="#c8a86b"/>
<line x1="172.5" y1="440" x2="172.5" y2="436" stroke="#c8a86b"/>
<line x1="172" y1="414.5" x2="196" y2="414.5" stroke="#c8a86b"/>
<line x1="195.5" y1="419" x2="195.5" y2="415" stroke="#c8a86b"/>
<line x1="172.5" y1="419" x2="172.5" y2="415" stroke="#c8a86b"/>
<line x1="172" y1="392.5" x2="196" y2="392.5" stroke="#c8a86b"/>
<line x1="195.5" y1="397" x2="195.5" y2="393" stroke="#c8a86b"/>
<line x1="172.5" y1="397" x2="172.5" y2="393" stroke="#c8a86b"/>
<line x1="218" y1="382.5" x2="221" y2="382.5" stroke="#c8a86b"/>
<line x1="218" y1="425.5" x2="221" y2="425.5" stroke="#c8a86b"/>
<line x1="218" y1="446.5" x2="221" y2="446.5" stroke="#c8a86b"/>
<line x1="218" y1="468.5" x2="221" y2="468.5" stroke="#c8a86b"/>
<line x1="218" y1="404.5" x2="221" y2="404.5" stroke="#c8a86b"/>
<line x1="220.5" y1="383" x2="220.5" y2="398" stroke="#c8a86b"/>
<line x1="220.5" y1="404" x2="220.5" y2="419" stroke="#c8a86b"/>
<line x1="220.5" y1="425" x2="220.5" y2="440" stroke="#c8a86b"/>
<line x1="220.5" y1="446" x2="220.5" y2="461" stroke="#c8a86b"/>
<line x1="220.5" y1="468" x2="220.5" y2="483" stroke="#c8a86b"/>
<line x1="220.5" y1="506" x2="220.5" y2="521" stroke="#c8a86b"/>
<line x1="278.5" y1="528" x2="278.5" y2="543" stroke="#c8a86b"/>
<line x1="278.5" y1="550" x2="278.5" y2="565" stroke="#c8a86b"/>
<line x1="278.5" y1="572" x2="278.5" y2="587" stroke="#c8a86b"/>
<line x1="278.5" y1="614" x2="278.5" y2="629" stroke="#c8a86b"/>
<line x1="278.5" y1="593" x2="278.5" y2="608" stroke="#c8a86b"/>
<line x1="278.5" y1="507" x2="278.5" y2="522" stroke="#c8a86b"/>
<line x1="220.5" y1="592" x2="220.5" y2="607" stroke="#c8a86b"/>
<line x1="220.5" y1="571" x2="220.5" y2="586" stroke="#c8a86b"/>
<line x1="220.5" y1="614" x2="220.5" y2="629" stroke="#c8a86b"/>
<line x1="220.5" y1="528" x2="220.5" y2="543" stroke="#c8a86b"/>
<line x1="220.5" y1="549" x2="220.5" y2="564" stroke="#c8a86b"/>
<line x1="403.5" y1="124" x2="403.5" y2="254" stroke="#c8a86b"/>
<line x1="405.5" y1="124" x2="405.5" y2="254" stroke="#c8a86b"/>
<line x1="403" y1="146.5" x2="484" y2="146.5" stroke="#c8a86b"/>
<line x1="404" y1="124.5" x2="474" y2="124.5" stroke="#c8a86b"/>
<line x1="403" y1="253.5" x2="484" y2="253.5" stroke="#c8a86b"/>
<line x1="403" y1="231.5" x2="484" y2="231.5" stroke="#c8a86b"/>
<line x1="403" y1="210.5" x2="484" y2="210.5" stroke="#c8a86b"/>
<line x1="403" y1="188.5" x2="484" y2="188.5" stroke="#c8a86b"/>
<line x1="403" y1="167.5" x2="484" y2="167.5" stroke="#c8a86b"/>
<line x1="428" y1="141.5" x2="452" y2="141.5" stroke="#c8a86b"/>
<line x1="451.5" y1="146" x2="451.5" y2="142" stroke="#c8a86b"/>
<line x1="428.5" y1="146" x2="428.5" y2="142" stroke="#c8a86b"/>
<line x1="428" y1="141.5" x2="452" y2="141.5" stroke="#c8a86b"/>
<line x1="451.5" y1="146" x2="451.5" y2="142" stroke="#c8a86b"/>
<line x1="428.5" y1="146" x2="428.5" y2="142" stroke="#c8a86b"/>
<line x1="428" y1="227.5" x2="452" y2="227.5" stroke="#c8a86b"/>
<line x1="451.5" y1="232" x2="451.5" y2="228" stroke="#c8a86b"/>
<line x1="428.5" y1="232" x2="428.5" y2="228" stroke="#c8a86b"/>
<line x1="428" y1="249.5" x2="452" y2="249.5" stroke="#c8a86b"/>
<line x1="451.5" y1="254" x2="451.5" y2="250" stroke="#c8a86b"/>
<line x1="428.5" y1="254" x2="428.5" y2="250" stroke="#c8a86b"/>
<line x1="428" y1="206.5" x2="452" y2="206.5" stroke="#c8a86b"/>
<line x1="451.5" y1="211" x2="451.5" y2="207" stroke="#c8a86b"/>
<line x1="428.5" y1="211" x2="428.5" y2="207" stroke="#c8a86b"/>
<line x1="428" y1="184.5" x2="452" y2="184.5" stroke="#c8a86b"/>
<line x1="451.5" y1="189" x2="451.5" y2="185" stroke="#c8a86b"/>
<line x1="428.5" y1="189" x2="428.5" y2="185" stroke="#c8a86b"/>
<line x1="428" y1="162.5" x2="452" y2="162.5" stroke="#c8a86b"/>
<line x1="451.5" y1="167" x2="451.5" y2="163" stroke="#c8a86b"/>
<line x1="428.5" y1="167" x2="428.5" y2="163" stroke="#c8a86b"/>
<line x1="473" y1="131.5" x2="477" y2="131.5" stroke="#c8a86b"/>
<line x1="474" y1="152.5" x2="477" y2="152.5" stroke="#c8a86b"/>
<line x1="474" y1="195.5" x2="477" y2="195.5" stroke="#c8a86b"/>
<line x1="474" y1="216.5" x2="477" y2="216.5" stroke="#c8a86b"/>
<line x1="474" y1="238.5" x2="477" y2="238.5" stroke="#c8a86b"/>
<line x1="474" y1="174.5" x2="477" y2="174.5" stroke="#c8a86b"/>
<line x1="473.5" y1="125" x2="473.5" y2="132" stroke="#c8a86b"/>
<line x1="473.5" y1="232" x2="473.5" y2="239" stroke="#c8a86b"/>
<line x1="473.5" y1="210" x2="473.5" y2="217" stroke="#c8a86b"/>
<line x1="473.5" y1="189" x2="473.5" y2="196" stroke="#c8a86b"/>
<line x1="473.5" y1="168" x2="473.5" y2="175" stroke="#c8a86b"/>
<line x1="473.5" y1="146" x2="473.5" y2="153" stroke="#c8a86b"/>
<line x1="476.5" y1="131" x2="476.5" y2="146" stroke="#c8a86b"/>
<line x1="476.5" y1="217" x2="476.5" y2="232" stroke="#c8a86b"/>
<line x1="476.5" y1="196" x2="476.5" y2="211" stroke="#c8a86b"/>
<line x1="476.5" y1="239" x2="476.5" y2="254" stroke="#c8a86b"/>
<line x1="476.5" y1="153" x2="476.5" y2="168" stroke="#c8a86b"/>
<line x1="476.5" y1="174" x2="476.5" y2="189" stroke="#c8a86b"/>
<line x1="403.5" y1="499" x2="403.5" y2="693" stroke="#c8a86b"/>
<path d="M405.5 499L404.992 694" stroke="#c8a86b"/>
<line x1="403" y1="521.5" x2="484" y2="521.5" stroke="#c8a86b"/>
<line x1="403" y1="499.5" x2="484" y2="499.5" stroke="#c8a86b"/>
<line x1="403" y1="628.5" x2="484" y2="628.5" stroke="#c8a86b"/>
<line x1="403" y1="606.5" x2="484" y2="606.5" stroke="#c8a86b"/>
<line x1="403" y1="585.5" x2="484" y2="585.5" stroke="#c8a86b"/>
<line x1="403" y1="563.5" x2="484" y2="563.5" stroke="#c8a86b"/>
<line x1="403" y1="542.5" x2="484" y2="542.5" stroke="#c8a86b"/>
<line x1="428" y1="516.5" x2="452" y2="516.5" stroke="#c8a86b"/>
<line x1="451.5" y1="521" x2="451.5" y2="517" stroke="#c8a86b"/>
<line x1="428.5" y1="521" x2="428.5" y2="517" stroke="#c8a86b"/>
<line x1="428" y1="516.5" x2="452" y2="516.5" stroke="#c8a86b"/>
<line x1="451.5" y1="521" x2="451.5" y2="517" stroke="#c8a86b"/>
<line x1="428.5" y1="521" x2="428.5" y2="517" stroke="#c8a86b"/>
<line x1="428" y1="602.5" x2="452" y2="602.5" stroke="#c8a86b"/>
<line x1="451.5" y1="607" x2="451.5" y2="603" stroke="#c8a86b"/>
<line x1="428.5" y1="607" x2="428.5" y2="603" stroke="#c8a86b"/>
<line x1="428" y1="624.5" x2="452" y2="624.5" stroke="#c8a86b"/>
<line x1="451.5" y1="629" x2="451.5" y2="625" stroke="#c8a86b"/>
<line x1="428.5" y1="629" x2="428.5" y2="625" stroke="#c8a86b"/>
<line x1="428" y1="581.5" x2="452" y2="581.5" stroke="#c8a86b"/>
<line x1="451.5" y1="586" x2="451.5" y2="582" stroke="#c8a86b"/>
<line x1="428.5" y1="586" x2="428.5" y2="582" stroke="#c8a86b"/>
<line x1="428" y1="559.5" x2="452" y2="559.5" stroke="#c8a86b"/>
<line x1="451.5" y1="564" x2="451.5" y2="560" stroke="#c8a86b"/>
<line x1="428.5" y1="564" x2="428.5" y2="560" stroke="#c8a86b"/>
<line x1="428" y1="537.5" x2="452" y2="537.5" stroke="#c8a86b"/>
<line x1="451.5" y1="542" x2="451.5" y2="538" stroke="#c8a86b"/>
<line x1="428.5" y1="542" x2="428.5" y2="538" stroke="#c8a86b"/>
<line x1="473" y1="506.5" x2="477" y2="506.5" stroke="#c8a86b"/>
<line x1="474" y1="527.5" x2="477" y2="527.5" stroke="#c8a86b"/>
<line x1="474" y1="570.5" x2="477" y2="570.5" stroke="#c8a86b"/>
<line x1="474" y1="591.5" x2="477" y2="591.5" stroke="#c8a86b"/>
<line x1="474" y1="613.5" x2="477" y2="613.5" stroke="#c8a86b"/>
<line x1="474" y1="549.5" x2="477" y2="549.5" stroke="#c8a86b"/>
<line x1="473.5" y1="500" x2="473.5" y2="507" stroke="#c8a86b"/>
<line x1="473.5" y1="607" x2="473.5" y2="614" stroke="#c8a86b"/>
<line x1="473.5" y1="585" x2="473.5" y2="592" stroke="#c8a86b"/>
<line x1="473.5" y1="564" x2="473.5" y2="571" stroke="#c8a86b"/>
<line x1="473.5" y1="543" x2="473.5" y2="550" stroke="#c8a86b"/>
<line x1="473.5" y1="521" x2="473.5" y2="528" stroke="#c8a86b"/>
<line x1="476.5" y1="506" x2="476.5" y2="521" stroke="#c8a86b"/>
<line x1="476.5" y1="592" x2="476.5" y2="607" stroke="#c8a86b"/>
<line x1="476.5" y1="571" x2="476.5" y2="586" stroke="#c8a86b"/>
<line x1="476.5" y1="614" x2="476.5" y2="629" stroke="#c8a86b"/>
<line x1="400" y1="693.5" x2="484" y2="693.5" stroke="#c8a86b"/>
<line x1="428" y1="689.5" x2="452" y2="689.5" stroke="#c8a86b"/>
<line x1="451.5" y1="694" x2="451.5" y2="690" stroke="#c8a86b"/>
<line x1="428.5" y1="694" x2="428.5" y2="690" stroke="#c8a86b"/>
<line x1="474" y1="678.5" x2="477" y2="678.5" stroke="#c8a86b"/>
<line x1="473.5" y1="672" x2="473.5" y2="679" stroke="#c8a86b"/>
<line x1="476.5" y1="679" x2="476.5" y2="694" stroke="#c8a86b"/>
<line x1="403" y1="671.5" x2="484" y2="671.5" stroke="#c8a86b"/>
<line x1="428" y1="667.5" x2="452" y2="667.5" stroke="#c8a86b"/>
<line x1="451.5" y1="672" x2="451.5" y2="668" stroke="#c8a86b"/>
<line x1="428.5" y1="672" x2="428.5" y2="668" stroke="#c8a86b"/>
<line x1="474" y1="656.5" x2="477" y2="656.5" stroke="#c8a86b"/>
<line x1="473.5" y1="650" x2="473.5" y2="657" stroke="#c8a86b"/>
<line x1="476.5" y1="657" x2="476.5" y2="672" stroke="#c8a86b"/>
<line x1="403" y1="650.5" x2="484" y2="650.5" stroke="#c8a86b"/>
<line x1="428" y1="646.5" x2="452" y2="646.5" stroke="#c8a86b"/>
<line x1="451.5" y1="651" x2="451.5" y2="647" stroke="#c8a86b"/>
<line x1="428.5" y1="651" x2="428.5" y2="647" stroke="#c8a86b"/>
<line x1="474" y1="635.5" x2="477" y2="635.5" stroke="#c8a86b"/>
<line x1="473.5" y1="629" x2="473.5" y2="636" stroke="#c8a86b"/>
<line x1="476.5" y1="636" x2="476.5" y2="651" stroke="#c8a86b"/>
<line x1="476.5" y1="528" x2="476.5" y2="543" stroke="#c8a86b"/>
<line x1="476.5" y1="549" x2="476.5" y2="564" stroke="#c8a86b"/>
<line x1="217.5" y1="462" x2="217.5" y2="469" stroke="#c8a86b"/>
<line x1="217.5" y1="440" x2="217.5" y2="447" stroke="#c8a86b"/>
<line x1="217.5" y1="419" x2="217.5" y2="426" stroke="#c8a86b"/>
<line x1="217.5" y1="398" x2="217.5" y2="405" stroke="#c8a86b"/>
<line x1="217.5" y1="376" x2="217.5" y2="383" stroke="#c8a86b"/>
<line x1="338" y1="116.5" x2="350" y2="116.5" stroke="#c8a86b"/>
<line x1="281.5" y1="125" x2="281.5" y2="131" stroke="#c8a86b"/>
<line x1="281.5" y1="146" x2="281.5" y2="152" stroke="#c8a86b"/>
<line x1="281.5" y1="168" x2="281.5" y2="174" stroke="#c8a86b"/>
<line x1="281.5" y1="189" x2="281.5" y2="195" stroke="#c8a86b"/>
<line x1="282" y1="130.5" x2="278" y2="130.5" stroke="#c8a86b"/>
<line x1="282" y1="152.5" x2="278" y2="152.5" stroke="#c8a86b"/>
<line x1="282" y1="173.5" x2="278" y2="173.5" stroke="#c8a86b"/>
<line x1="282" y1="195.5" x2="278" y2="195.5" stroke="#c8a86b"/>
<line x1="282" y1="216.5" x2="278" y2="216.5" stroke="#c8a86b"/>
<line x1="282" y1="238.5" x2="278" y2="238.5" stroke="#c8a86b"/>
<line x1="278.5" y1="145" x2="278.5" y2="130" stroke="#c8a86b"/>
<line x1="278.5" y1="167" x2="278.5" y2="152" stroke="#c8a86b"/>
<line x1="278.5" y1="167" x2="278.5" y2="152" stroke="#c8a86b"/>
<line x1="278.5" y1="188" x2="278.5" y2="173" stroke="#c8a86b"/>
<line x1="278.5" y1="188" x2="278.5" y2="173" stroke="#c8a86b"/>
<line x1="278.5" y1="210" x2="278.5" y2="195" stroke="#c8a86b"/>
<line x1="278.5" y1="210" x2="278.5" y2="195" stroke="#c8a86b"/>
<line x1="278.5" y1="253" x2="278.5" y2="238" stroke="#c8a86b"/>
<line x1="278.5" y1="231" x2="278.5" y2="216" stroke="#c8a86b"/>
<line x1="281.5" y1="211" x2="281.5" y2="217" stroke="#c8a86b"/>
<line x1="281.5" y1="232" x2="281.5" y2="238" stroke="#c8a86b"/>
<line x1="353.5" y1="500" x2="353.5" y2="629" stroke="#c8a86b"/>

<line x1="276" y1="521.5" x2="357" y2="521.5" stroke="#c8a86b"/>
<line x1="274" y1="500.5" x2="357" y2="500.5" stroke="#c8a86b"/>
<line x1="303" y1="516.5" x2="327" y2="516.5" stroke="#c8a86b"/>
<line x1="326.5" y1="521" x2="326.5" y2="517" stroke="#c8a86b"/>
<line x1="303.5" y1="521" x2="303.5" y2="517" stroke="#c8a86b"/>
<line x1="276" y1="607.5" x2="357" y2="607.5" stroke="#c8a86b"/>
<line x1="303" y1="602.5" x2="327" y2="602.5" stroke="#c8a86b"/>
<line x1="326.5" y1="607" x2="326.5" y2="603" stroke="#c8a86b"/>
<line x1="303.5" y1="607" x2="303.5" y2="603" stroke="#c8a86b"/>
<line x1="303" y1="623.5" x2="327" y2="623.5" stroke="#c8a86b"/>
<line x1="326.5" y1="628" x2="326.5" y2="624" stroke="#c8a86b"/>
<line x1="303.5" y1="628" x2="303.5" y2="624" stroke="#c8a86b"/>
<line x1="276" y1="586.5" x2="357" y2="586.5" stroke="#c8a86b"/>
<line x1="303" y1="581.5" x2="327" y2="581.5" stroke="#c8a86b"/>
<line x1="326.5" y1="586" x2="326.5" y2="582" stroke="#c8a86b"/>
<line x1="303.5" y1="586" x2="303.5" y2="582" stroke="#c8a86b"/>
<line x1="276" y1="564.5" x2="357" y2="564.5" stroke="#c8a86b"/>
<line x1="303" y1="559.5" x2="327" y2="559.5" stroke="#c8a86b"/>
<line x1="326.5" y1="564" x2="326.5" y2="560" stroke="#c8a86b"/>
<line x1="303.5" y1="564" x2="303.5" y2="560" stroke="#c8a86b"/>
<line x1="276" y1="543.5" x2="357" y2="543.5" stroke="#c8a86b"/>
<line x1="303" y1="538.5" x2="327" y2="538.5" stroke="#c8a86b"/>
<line x1="326.5" y1="543" x2="326.5" y2="539" stroke="#c8a86b"/>
<line x1="303.5" y1="543" x2="303.5" y2="539" stroke="#c8a86b"/>
<line x1="281.5" y1="501" x2="281.5" y2="507" stroke="#c8a86b"/>
<line x1="281.5" y1="522" x2="281.5" y2="528" stroke="#c8a86b"/>
<line x1="281.5" y1="544" x2="281.5" y2="550" stroke="#c8a86b"/>
<line x1="281.5" y1="565" x2="281.5" y2="571" stroke="#c8a86b"/>
<line x1="282" y1="506.5" x2="278" y2="506.5" stroke="#c8a86b"/>
<line x1="282" y1="528.5" x2="278" y2="528.5" stroke="#c8a86b"/>
<line x1="282" y1="549.5" x2="278" y2="549.5" stroke="#c8a86b"/>
<line x1="282" y1="571.5" x2="278" y2="571.5" stroke="#c8a86b"/>
<line x1="282" y1="592.5" x2="278" y2="592.5" stroke="#c8a86b"/>
<line x1="282" y1="614.5" x2="278" y2="614.5" stroke="#c8a86b"/>
<line x1="281.5" y1="587" x2="281.5" y2="593" stroke="#c8a86b"/>
<line x1="281.5" y1="608" x2="281.5" y2="614" stroke="#c8a86b"/>
<line x1="276" y1="354.5" x2="357" y2="354.5" stroke="#c8a86b"/>
<line x1="274" y1="483.5" x2="357" y2="483.5" stroke="#c8a86b"/>
<line x1="276" y1="376.5" x2="357" y2="376.5" stroke="#c8a86b"/>
<line x1="303" y1="349.5" x2="327" y2="349.5" stroke="#c8a86b"/>
<line x1="326.5" y1="354" x2="326.5" y2="350" stroke="#c8a86b"/>
<line x1="303.5" y1="354" x2="303.5" y2="350" stroke="#c8a86b"/>
<line x1="303" y1="371.5" x2="327" y2="371.5" stroke="#c8a86b"/>
<line x1="326.5" y1="376" x2="326.5" y2="372" stroke="#c8a86b"/>
<line x1="303.5" y1="376" x2="303.5" y2="372" stroke="#c8a86b"/>
<line x1="276" y1="333.5" x2="357" y2="333.5" stroke="#c8a86b"/>
<line x1="303" y1="328.5" x2="327" y2="328.5" stroke="#c8a86b"/>
<line x1="326.5" y1="333" x2="326.5" y2="329" stroke="#c8a86b"/>
<line x1="303.5" y1="333" x2="303.5" y2="329" stroke="#c8a86b"/>
<line x1="276" y1="311.5" x2="357" y2="311.5" stroke="#c8a86b"/>
<line x1="303" y1="306.5" x2="327" y2="306.5" stroke="#c8a86b"/>
<line x1="326.5" y1="311" x2="326.5" y2="307" stroke="#c8a86b"/>
<line x1="303.5" y1="311" x2="303.5" y2="307" stroke="#c8a86b"/>
<line x1="276" y1="290.5" x2="357" y2="290.5" stroke="#c8a86b"/>
<line x1="303" y1="285.5" x2="327" y2="285.5" stroke="#c8a86b"/>
<line x1="326.5" y1="290" x2="326.5" y2="286" stroke="#c8a86b"/>
<line x1="303.5" y1="290" x2="303.5" y2="286" stroke="#c8a86b"/>
<line x1="281.5" y1="269" x2="281.5" y2="275" stroke="#c8a86b"/>
<line x1="281.5" y1="291" x2="281.5" y2="297" stroke="#c8a86b"/>
<line x1="281.5" y1="312" x2="281.5" y2="318" stroke="#c8a86b"/>
<line x1="282" y1="275.5" x2="278" y2="275.5" stroke="#c8a86b"/>
<line x1="282" y1="296.5" x2="278" y2="296.5" stroke="#c8a86b"/>
<line x1="282" y1="318.5" x2="278" y2="318.5" stroke="#c8a86b"/>
<line x1="282" y1="339.5" x2="278" y2="339.5" stroke="#c8a86b"/>
<line x1="282" y1="361.5" x2="278" y2="361.5" stroke="#c8a86b"/>
<line x1="278.5" y1="290" x2="278.5" y2="275" stroke="#c8a86b"/>
<line x1="278.5" y1="290" x2="278.5" y2="275" stroke="#c8a86b"/>
<line x1="278.5" y1="311" x2="278.5" y2="296" stroke="#c8a86b"/>
<line x1="278.5" y1="311" x2="278.5" y2="296" stroke="#c8a86b"/>
<line x1="278.5" y1="333" x2="278.5" y2="318" stroke="#c8a86b"/>
<line x1="278.5" y1="333" x2="278.5" y2="318" stroke="#c8a86b"/>
<line x1="278.5" y1="376" x2="278.5" y2="361" stroke="#c8a86b"/>
<line x1="278.5" y1="354" x2="278.5" y2="339" stroke="#c8a86b"/>
<line x1="281.5" y1="334" x2="281.5" y2="340" stroke="#c8a86b"/>
<line x1="281.5" y1="355" x2="281.5" y2="361" stroke="#c8a86b"/>
<line x1="276" y1="462.5" x2="357" y2="462.5" stroke="#c8a86b"/>
<line x1="303" y1="457.5" x2="327" y2="457.5" stroke="#c8a86b"/>
<line x1="326.5" y1="462" x2="326.5" y2="458" stroke="#c8a86b"/>
<line x1="303.5" y1="462" x2="303.5" y2="458" stroke="#c8a86b"/>
<line x1="303" y1="478.5" x2="327" y2="478.5" stroke="#c8a86b"/>
<line x1="326.5" y1="483" x2="326.5" y2="479" stroke="#c8a86b"/>
<line x1="303.5" y1="483" x2="303.5" y2="479" stroke="#c8a86b"/>
<line x1="276" y1="441.5" x2="357" y2="441.5" stroke="#c8a86b"/>
<line x1="303" y1="436.5" x2="327" y2="436.5" stroke="#c8a86b"/>
<line x1="326.5" y1="441" x2="326.5" y2="437" stroke="#c8a86b"/>
<line x1="303.5" y1="441" x2="303.5" y2="437" stroke="#c8a86b"/>
<line x1="276" y1="419.5" x2="357" y2="419.5" stroke="#c8a86b"/>
<line x1="303" y1="414.5" x2="327" y2="414.5" stroke="#c8a86b"/>
<line x1="326.5" y1="419" x2="326.5" y2="415" stroke="#c8a86b"/>
<line x1="303.5" y1="419" x2="303.5" y2="415" stroke="#c8a86b"/>
<line x1="276" y1="398.5" x2="357" y2="398.5" stroke="#c8a86b"/>
<line x1="303" y1="393.5" x2="327" y2="393.5" stroke="#c8a86b"/>
<line x1="326.5" y1="398" x2="326.5" y2="394" stroke="#c8a86b"/>
<line x1="303.5" y1="398" x2="303.5" y2="394" stroke="#c8a86b"/>
<line x1="281.5" y1="377" x2="281.5" y2="383" stroke="#c8a86b"/>
<line x1="281.5" y1="399" x2="281.5" y2="405" stroke="#c8a86b"/>
<line x1="281.5" y1="420" x2="281.5" y2="426" stroke="#c8a86b"/>
<line x1="282" y1="383.5" x2="278" y2="383.5" stroke="#c8a86b"/>
<line x1="282" y1="404.5" x2="278" y2="404.5" stroke="#c8a86b"/>
<line x1="282" y1="426.5" x2="278" y2="426.5" stroke="#c8a86b"/>
<line x1="282" y1="447.5" x2="278" y2="447.5" stroke="#c8a86b"/>
<line x1="282" y1="469.5" x2="278" y2="469.5" stroke="#c8a86b"/>
<line x1="278.5" y1="398" x2="278.5" y2="383" stroke="#c8a86b"/>
<line x1="278.5" y1="398" x2="278.5" y2="383" stroke="#c8a86b"/>
<line x1="278.5" y1="419" x2="278.5" y2="404" stroke="#c8a86b"/>
<line x1="278.5" y1="419" x2="278.5" y2="404" stroke="#c8a86b"/>
<line x1="278.5" y1="441" x2="278.5" y2="426" stroke="#c8a86b"/>
<line x1="278.5" y1="441" x2="278.5" y2="426" stroke="#c8a86b"/>
<line x1="278.5" y1="484" x2="278.5" y2="469" stroke="#c8a86b"/>
<line x1="278.5" y1="462" x2="278.5" y2="447" stroke="#c8a86b"/>
<line x1="281.5" y1="442" x2="281.5" y2="448" stroke="#c8a86b"/>
<line x1="281.5" y1="463" x2="281.5" y2="469" stroke="#c8a86b"/>
<line x1="146.5" y1="484" x2="146.5" y2="268" stroke="#c8a86b"/>


<line x1="352.5" y1="484" x2="352.5" y2="268" stroke="#c8a86b"/>




<line x1="142" y1="268.5" x2="226" y2="268.5" stroke="#c8a86b"/>
<line x1="274" y1="268.5" x2="357" y2="268.513" stroke="#c8a86b"/>
<line x1="202.5" y1="253" x2="202.5" y2="268" stroke="#c8a86b"/>
<line x1="296.5" y1="253" x2="296.5" y2="268" stroke="#c8a86b"/>
<line x1="335.5" y1="254" x2="335.5" y2="269" stroke="#c8a86b"/>
<line x1="416.5" y1="254" x2="416.5" y2="269" stroke="#c8a86b"/>
<line x1="407.5" y1="254" x2="407.5" y2="269" stroke="#c8a86b"/>
<line x1="163.5" y1="254" x2="163.5" y2="269" stroke="#c8a86b"/>
<path d="M411.418 113.035C411.157 112.94 410.586 112.654 409.976 112.403C409.663 112.274 408.398 112.247 406.715 112.318C405.735 112.359 405.618 113.413 405.262 113.999C404.713 114.586 404.211 114.8 404.032 115.227C403.971 115.536 403.971 116.032 403.971 116.543" stroke="#c8a86b" stroke-linecap="round"/>
<path d="M412.206 113.393C412.467 113.534 413.038 113.917 413.648 114.167C414.312 114.44 415.941 114.538 416.931 114.242C417.586 114.045 418.027 113.37 418.578 112.965C419.128 112.56 419.222 111.654 419.355 110.806C419.459 110.135 419.89 109.576 420.403 109.121C420.99 108.602 421.846 108.596 423.823 108.547C424.744 108.524 425.331 109.166 426.084 109.56C426.411 109.731 426.789 109.811 427.134 109.978C427.815 110.306 427.767 111.481 428.162 112.101C428.356 112.407 429.149 112.318 429.96 112.307C432.549 112.269 436.41 112.105 436.576 111.831C436.919 111.267 437.291 110.674 437.852 110.374C438.519 110.017 439.344 110.076 440.167 109.991C440.371 109.956 440.537 109.885 441.047 109.849C441.558 109.812 442.408 109.812 443.285 109.812" stroke="#c8a86b" stroke-linecap="round"/>
<path d="M387.077 96.5244C387.406 96.458 388.227 96.5018 388.571 96.596C388.915 96.6903 389.246 96.7562 389.584 96.8727C389.868 96.9705 390.132 97.0884 390.376 97.2711C390.625 97.4574 390.907 97.564 391.14 97.7748C391.409 98.0183 391.803 98.1845 392.075 98.3836C392.384 98.6099 392.668 98.7598 392.917 98.9264C393.174 99.0985 393.409 99.2919 393.681 99.4246C393.962 99.5617 394.195 99.7895 394.445 99.9285C394.726 100.086 394.981 100.376 395.214 100.609C395.436 100.831 395.591 101.117 395.79 101.384C395.983 101.642 396.155 101.915 396.382 102.121C396.594 102.312 396.853 102.502 397.074 102.735C397.376 103.052 397.783 103.443 398.004 103.681C398.274 103.97 398.447 104.274 398.614 104.578C398.778 104.879 399.001 105.203 399.123 105.514C399.244 105.823 399.477 106.067 399.627 106.383C399.766 106.674 399.908 106.931 400.059 107.213C400.186 107.474 400.363 107.739 400.479 108.066C400.518 108.138 400.573 108.193 400.629 108.349" stroke="#c8a86b" stroke-linecap="round"/>
<path d="M116.16 96.7311C115.537 96.7311 114.314 96.8774 113.917 97.256C113.384 97.7633 112.873 98.0227 112.503 98.3927C112.133 98.7627 111.765 99.1313 111.367 99.5013C110.899 99.9375 110.49 100.295 110.092 100.638C109.65 101.019 109.215 101.404 108.835 101.774C108.436 102.164 108.217 102.679 107.939 103.187C107.679 103.662 107.349 104.12 107.116 104.591C106.894 105.041 106.608 105.468 106.313 105.885C106.072 106.338 105.888 106.891 105.694 107.474C105.647 107.613 105.61 107.741 105.573 107.873" stroke="#c8a86b" stroke-linecap="round"/>
<line x1="202.5" y1="484" x2="202.5" y2="499" stroke="#c8a86b"/>
<line x1="163.5" y1="484" x2="163.5" y2="499" stroke="#c8a86b"/>
<line x1="403" y1="377.5" x2="483" y2="377.5" stroke="#c8a86b"/>
<line x1="403" y1="355.5" x2="483" y2="355.5" stroke="#c8a86b"/>
<line x1="403" y1="333.5" x2="483" y2="333.5" stroke="#c8a86b"/>
<line x1="403" y1="312.5" x2="483" y2="312.5" stroke="#c8a86b"/>
<line x1="403" y1="291.5" x2="483" y2="291.5" stroke="#c8a86b"/>
<line x1="428" y1="373.5" x2="452" y2="373.5" stroke="#c8a86b"/>
<line x1="451.5" y1="378" x2="451.5" y2="374" stroke="#c8a86b"/>
<line x1="428.5" y1="378" x2="428.5" y2="374" stroke="#c8a86b"/>
<line x1="428" y1="351.5" x2="452" y2="351.5" stroke="#c8a86b"/>
<line x1="451.5" y1="356" x2="451.5" y2="352" stroke="#c8a86b"/>
<line x1="428.5" y1="356" x2="428.5" y2="352" stroke="#c8a86b"/>
<line x1="428" y1="329.5" x2="452" y2="329.5" stroke="#c8a86b"/>
<line x1="451.5" y1="334" x2="451.5" y2="330" stroke="#c8a86b"/>
<line x1="428.5" y1="334" x2="428.5" y2="330" stroke="#c8a86b"/>
<line x1="428" y1="308.5" x2="452" y2="308.5" stroke="#c8a86b"/>
<line x1="451.5" y1="313" x2="451.5" y2="309" stroke="#c8a86b"/>
<line x1="428.5" y1="313" x2="428.5" y2="309" stroke="#c8a86b"/>
<line x1="428" y1="286.5" x2="452" y2="286.5" stroke="#c8a86b"/>
<line x1="451.5" y1="291" x2="451.5" y2="287" stroke="#c8a86b"/>
<line x1="428.5" y1="291" x2="428.5" y2="287" stroke="#c8a86b"/>
<line x1="474" y1="276.5" x2="477" y2="276.5" stroke="#c8a86b"/>
<line x1="474" y1="319.5" x2="477" y2="319.5" stroke="#c8a86b"/>
<line x1="474" y1="340.5" x2="477" y2="340.5" stroke="#c8a86b"/>
<line x1="474" y1="362.5" x2="477" y2="362.5" stroke="#c8a86b"/>
<line x1="474" y1="298.5" x2="477" y2="298.5" stroke="#c8a86b"/>
<line x1="476.5" y1="277" x2="476.5" y2="292" stroke="#c8a86b"/>
<line x1="476.5" y1="298" x2="476.5" y2="313" stroke="#c8a86b"/>
<line x1="476.5" y1="319" x2="476.5" y2="334" stroke="#c8a86b"/>
<line x1="476.5" y1="340" x2="476.5" y2="355" stroke="#c8a86b"/>
<line x1="476.5" y1="362" x2="476.5" y2="377" stroke="#c8a86b"/>
<line x1="473.5" y1="356" x2="473.5" y2="363" stroke="#c8a86b"/>
<line x1="473.5" y1="334" x2="473.5" y2="341" stroke="#c8a86b"/>
<line x1="473.5" y1="313" x2="473.5" y2="320" stroke="#c8a86b"/>
<line x1="473.5" y1="292" x2="473.5" y2="299" stroke="#c8a86b"/>
<line x1="473.5" y1="270" x2="473.5" y2="277" stroke="#c8a86b"/>
<line x1="403" y1="484.5" x2="484" y2="484.5" stroke="#c8a86b"/>
<line x1="403" y1="462.5" x2="483" y2="462.5" stroke="#c8a86b"/>
<line x1="403" y1="440.5" x2="483" y2="440.5" stroke="#c8a86b"/>
<line x1="403" y1="419.5" x2="483" y2="419.5" stroke="#c8a86b"/>
<line x1="403" y1="398.5" x2="483" y2="398.5" stroke="#c8a86b"/>
<line x1="428" y1="480.5" x2="452" y2="480.5" stroke="#c8a86b"/>
<line x1="451.5" y1="485" x2="451.5" y2="481" stroke="#c8a86b"/>
<line x1="428.5" y1="485" x2="428.5" y2="481" stroke="#c8a86b"/>
<line x1="428" y1="458.5" x2="452" y2="458.5" stroke="#c8a86b"/>
<line x1="451.5" y1="463" x2="451.5" y2="459" stroke="#c8a86b"/>
<line x1="428.5" y1="463" x2="428.5" y2="459" stroke="#c8a86b"/>
<line x1="428" y1="436.5" x2="452" y2="436.5" stroke="#c8a86b"/>
<line x1="451.5" y1="441" x2="451.5" y2="437" stroke="#c8a86b"/>
<line x1="428.5" y1="441" x2="428.5" y2="437" stroke="#c8a86b"/>
<line x1="428" y1="415.5" x2="452" y2="415.5" stroke="#c8a86b"/>
<line x1="451.5" y1="420" x2="451.5" y2="416" stroke="#c8a86b"/>
<line x1="428.5" y1="420" x2="428.5" y2="416" stroke="#c8a86b"/>
<line x1="428" y1="393.5" x2="452" y2="393.5" stroke="#c8a86b"/>
<line x1="451.5" y1="398" x2="451.5" y2="394" stroke="#c8a86b"/>
<line x1="428.5" y1="398" x2="428.5" y2="394" stroke="#c8a86b"/>
<line x1="474" y1="383.5" x2="477" y2="383.5" stroke="#c8a86b"/>
<line x1="474" y1="426.5" x2="477" y2="426.5" stroke="#c8a86b"/>
<line x1="474" y1="447.5" x2="477" y2="447.5" stroke="#c8a86b"/>
<line x1="474" y1="469.5" x2="477" y2="469.5" stroke="#c8a86b"/>
<line x1="474" y1="405.5" x2="477" y2="405.5" stroke="#c8a86b"/>
<line x1="476.5" y1="384" x2="476.5" y2="399" stroke="#c8a86b"/>
<line x1="476.5" y1="405" x2="476.5" y2="420" stroke="#c8a86b"/>
<line x1="476.5" y1="426" x2="476.5" y2="441" stroke="#c8a86b"/>
<line x1="476.5" y1="447" x2="476.5" y2="462" stroke="#c8a86b"/>
<line x1="476.5" y1="469" x2="476.5" y2="484" stroke="#c8a86b"/>
<line x1="473.5" y1="463" x2="473.5" y2="470" stroke="#c8a86b"/>
<line x1="473.5" y1="441" x2="473.5" y2="448" stroke="#c8a86b"/>
<line x1="473.5" y1="420" x2="473.5" y2="427" stroke="#c8a86b"/>
<line x1="473.5" y1="399" x2="473.5" y2="406" stroke="#c8a86b"/>
<line x1="473.5" y1="377" x2="473.5" y2="384" stroke="#c8a86b"/>
<line x1="405.5" y1="485" x2="405.5" y2="270" stroke="#c8a86b"/>
<line x1="403.5" y1="485" x2="403.5" y2="269" stroke="#c8a86b"/>
<line x1="403" y1="269.5" x2="483" y2="269.513" stroke="#c8a86b"/>
<line x1="416.5" y1="485" x2="416.5" y2="500" stroke="#c8a86b"/>
<line x1="408.5" y1="485" x2="408.5" y2="500" stroke="#c8a86b"/>
<line x1="335.5" y1="483" x2="335.5" y2="500" stroke="#c8a86b"/>
<line x1="297.5" y1="483" x2="297.5" y2="501" stroke="#c8a86b"/>
<line x1="416.5" y1="710" x2="416.5" y2="694" stroke="#c8a86b"/>
<line x1="417" y1="709.5" x2="484" y2="709.5" stroke="#c8a86b"/>
<line x1="104.5" y1="325" x2="104.5" y2="171" stroke="#c8a86b"/>

<line x1="120.5" y1="198" x2="120.5" y2="236" stroke="#c8a86b"/>
<line x1="120.224" y1="235.553" x2="122.224" y2="236.553" stroke="#c8a86b"/>
<line x1="122" y1="236.5" x2="127" y2="236.5" stroke="#c8a86b"/>


<line x1="121.842" y1="198.526" x2="124.842" y2="197.526" stroke="#c8a86b"/>
<line x1="124.429" y1="197.743" x2="130.429" y2="207.743" stroke="#c8a86b"/>
<line x1="130.5" y1="207" x2="130.5" y2="224" stroke="#c8a86b"/>

<g id="aero-l2-i" class="interactive-group">
  <line x1="126.435" y1="286.246" x2="104.435" y2="325.246" stroke="#c8a86b"/>
  <line x1="134.435" y1="287.247" x2="105.435" y2="338.247" stroke="#c8a86b"/>
  <line x1="126" y1="272.5" x2="135" y2="272.5" stroke="#c8a86b"/>
  <line x1="134.5" y1="273" x2="134.5" y2="288" stroke="#c8a86b"/>
  <line x1="130.5" y1="273" x2="130.5" y2="287" stroke="#c8a86b"/>
  <line x1="130.439" y1="286.239" x2="124.439" y2="297.239" stroke="#c8a86b"/>

  <line x1="321.388" y1="96.3153" x2="308.388" y2="112.315" stroke="#c8a86b"/>
  <line x1="315.386" y1="96.3179" x2="301.386" y2="113.318" stroke="#c8a86b"/>

  <line x1="196.354" y1="96.6464" x2="212.354" y2="112.646" stroke="#c8a86b"/>
  <line x1="191.365" y1="96.658" x2="206.365" y2="112.658" stroke="#c8a86b"/>

  <line x1="362.735" y1="280.576" x2="370.735" y2="275.576" stroke="#c8a86b"/>
  <line x1="363.433" y1="280.75" x2="400.433" y2="344.75" stroke="#c8a86b"/>
  <line x1="370.433" y1="506.75" x2="400.433" y2="558.75" stroke="#c8a86b"/>
  <line x1="370.433" y1="275.75" x2="400.433" y2="327.75" stroke="#c8a86b"/>

  <line x1="363.291" y1="224.593" x2="370.291" y2="229.593" stroke="#c8a86b"/>
  <line x1="400.437" y1="176.243" x2="370.437" y2="230.243" stroke="#c8a86b"/>
  <line x1="400.433" y1="161.25" x2="363.433" y2="225.25" stroke="#c8a86b"/>

  <line x1="127" y1="223.5" x2="135" y2="223.5" stroke="#c8a86b"/>
  <path d="M134.5 206.5V223.5" stroke="#c8a86b"/>
  <line x1="126.5" y1="207" x2="126.5" y2="237" stroke="#c8a86b"/>
  <line x1="104.43" y1="170.744" x2="126.43" y2="207.744" stroke="#c8a86b"/>
  <line x1="105.435" y1="155.753" x2="134.435" y2="206.753" stroke="#c8a86b"/>

  <line x1="400.433" y1="391.25" x2="363.433" y2="455.25" stroke="#c8a86b"/>
  <line x1="400.437" y1="406.243" x2="370.437" y2="460.243" stroke="#c8a86b"/>
  <line x1="363.291" y1="454.593" x2="370.291" y2="459.593" stroke="#c8a86b"/> 

  <line x1="362.735" y1="511.576" x2="370.735" y2="506.576" stroke="#c8a86b"/> 
  <line x1="363.433" y1="511.75" x2="400.433" y2="575.75" stroke="#c8a86b"/>

  <line x1="104.567" y1="570.75" x2="134.567" y2="518.75" stroke="#c8a86b"/>
  <line x1="126.438" y1="517.242" x2="105.438" y2="555.242" stroke="#c8a86b"/>
  <line x1="127" y1="503.5" x2="130" y2="503.5" stroke="#c8a86b"/>
  <line x1="130" y1="503.5" x2="135" y2="503.5" stroke="#c8a86b"/>
  <line x1="121.158" y1="527.526" x2="124.158" y2="528.526" stroke="#c8a86b"/>
  <line x1="130.5" y1="504" x2="130.5" y2="519" stroke="#c8a86b"/>
  <line x1="134.5" y1="504" x2="134.5" y2="519" stroke="#c8a86b"/>
  <line x1="130.429" y1="518.257" x2="124.429" y2="528.257" stroke="#c8a86b"/>
</g>

<g id="aero-l2-h" class="interactive-group">
  <line x1="372.5" y1="116" x2="372.5" y2="210" stroke="#c8a86b"/>
  <line x1="357.5" y1="124" x2="357.5" y2="253" stroke="#c8a86b"/>
  <line x1="372.5" y1="227" x2="372.5" y2="237" stroke="#c8a86b"/>
  <line x1="356.5" y1="484" x2="356.5" y2="268" stroke="#c8a86b"/>
  <line x1="373.5" y1="297" x2="373.5" y2="438" stroke="#c8a86b"/>
  <line x1="357.5" y1="500" x2="357.5" y2="629" stroke="#c8a86b"/>
  <line x1="378.5" y1="538" x2="378.5" y2="624" stroke="#c8a86b"/>
  <line x1="275" y1="628.5" x2="357" y2="628.5" stroke="#c8a86b"/>
  <line x1="142" y1="628.5" x2="225" y2="628.5" stroke="#c8a86b"/>
  <line x1="126.5" y1="592" x2="126.5" y2="610" stroke="#c8a86b"/>
  <line x1="142.5" y1="499" x2="142.5" y2="629" stroke="#c8a86b"/>
  <line x1="126.5" y1="516" x2="126.5" y2="445" stroke="#c8a86b"/>
  <line x1="142.5" y1="484" x2="142.5" y2="268" stroke="#c8a86b"/> 
  <line x1="126.5" y1="303" x2="126.5" y2="428" stroke="#c8a86b"/>
  <line x1="126.5" y1="286" x2="126.5" y2="237" stroke="#c8a86b"/>
  <line x1="142.5" y1="124" x2="142.5" y2="254" stroke="#c8a86b"/>
  <line x1="126.5" y1="117" x2="126.5" y2="192" stroke="#c8a86b"/>
  <path d="M126.763 123.152C126.738 123.181 126.726 123.22 126.73 123.258C126.733 123.297 126.752 123.333 126.781 123.358C126.811 123.382 126.85 123.395 126.888 123.391C126.927 123.388 126.962 123.369 126.987 123.339C126.987 123.339 126.987 123.339 126.987 123.339C127.137 123.106 127.191 122.95 127.304 122.773C127.308 122.765 127.312 122.758 127.317 122.751C127.388 122.636 127.463 122.522 127.542 122.408C127.601 122.323 127.663 122.238 127.727 122.152C127.739 122.136 127.751 122.119 127.763 122.103C127.768 122.096 127.77 122.093 127.775 122.087C127.777 122.084 127.778 122.082 127.78 122.08C127.781 122.079 127.781 122.078 127.781 122.078C127.781 122.078 127.782 122.078 127.778 122.082C127.776 122.083 127.775 122.085 127.772 122.088C127.77 122.09 127.768 122.092 127.764 122.095C127.753 122.076 127.781 122.18 127.59 122.082C127.515 121.932 127.575 121.962 127.566 121.945C127.57 121.937 127.571 121.935 127.572 121.933C127.574 121.929 127.573 121.931 127.574 121.93C127.574 121.93 127.563 121.947 127.556 121.957C127.541 121.979 127.526 122.001 127.511 122.023C127.481 122.067 127.451 122.112 127.421 122.156C127.36 122.251 127.305 122.322 127.241 122.45C127.235 122.462 127.231 122.474 127.227 122.485C127.22 122.504 127.213 122.516 127.204 122.556C127.207 122.571 127.185 122.559 127.216 122.65C127.23 122.704 127.352 122.728 127.372 122.707C127.405 122.692 127.402 122.689 127.409 122.685C127.43 122.667 127.436 122.659 127.444 122.65C127.473 122.615 127.494 122.584 127.515 122.554C127.557 122.493 127.596 122.432 127.635 122.371C127.712 122.25 127.787 122.128 127.862 122.006C128.012 121.764 128.16 121.512 128.307 121.281C128.305 121.283 128.311 121.278 128.296 121.294C128.294 121.296 128.291 121.299 128.285 121.303C128.281 121.306 128.287 121.303 128.268 121.313C128.256 121.323 128.182 121.339 128.14 121.288C128.081 121.156 128.121 121.218 128.114 121.195C128.116 121.183 128.116 121.186 128.117 121.183C128.118 121.179 128.117 121.182 128.117 121.183C128.115 121.187 128.113 121.191 128.111 121.196C128.107 121.205 128.103 121.215 128.098 121.224C128.089 121.244 128.079 121.264 128.07 121.284C128.05 121.323 128.031 121.363 128.011 121.403C128.008 121.409 128.006 121.413 128.004 121.417C128.002 121.422 127.998 121.431 127.995 121.437C127.992 121.459 127.993 121.393 127.985 121.508C127.97 121.553 128.114 121.619 128.131 121.587C128.159 121.574 128.161 121.567 128.166 121.563C128.175 121.553 128.175 121.553 128.176 121.551C128.179 121.548 128.18 121.545 128.182 121.543C128.191 121.528 128.197 121.517 128.202 121.506C128.213 121.483 128.223 121.46 128.232 121.438C128.251 121.392 128.27 121.348 128.294 121.306C128.365 121.178 128.438 121.07 128.519 120.928C128.522 120.922 128.523 120.921 128.527 120.908C128.515 120.889 128.576 120.944 128.492 120.799C128.307 120.763 128.387 120.813 128.362 120.807C128.347 120.822 128.345 120.826 128.339 120.832C128.329 120.843 128.322 120.853 128.314 120.863C128.298 120.882 128.283 120.901 128.268 120.92C128.24 120.956 128.205 121.003 128.185 121.025C128.169 121.042 128.156 121.057 128.142 121.072C128.138 121.077 128.135 121.08 128.132 121.083C128.131 121.085 128.13 121.086 128.129 121.086C128.129 121.086 128.129 121.087 128.129 121.087C128.129 121.087 128.129 121.087 128.129 121.087C128.129 121.087 128.129 121.086 128.129 121.086C128.129 121.086 128.13 121.086 128.132 121.083C128.134 121.081 128.134 121.08 128.143 121.073C128.15 121.069 128.145 121.062 128.196 121.048C128.216 121.035 128.318 121.061 128.333 121.123C128.349 121.174 128.338 121.188 128.337 121.199C128.308 121.264 128.321 121.228 128.319 121.236C128.317 121.238 128.32 121.235 128.321 121.233C128.327 121.227 128.334 121.219 128.342 121.21C128.411 121.131 128.487 121.053 128.553 120.971C128.76 120.712 128.967 120.452 129.177 120.202C129.316 120.038 129.447 119.868 129.573 119.695C129.657 119.58 129.745 119.467 129.833 119.357C129.949 119.216 130.088 119.086 130.229 118.957C130.381 118.818 130.541 118.684 130.704 118.549C130.844 118.432 130.981 118.314 131.117 118.197C131.275 118.061 131.436 117.929 131.595 117.798C131.719 117.697 131.843 117.597 131.965 117.495C132.11 117.374 132.255 117.255 132.404 117.13C132.511 117.041 132.623 116.954 132.739 116.866C132.837 116.792 132.938 116.717 133.04 116.639C133.135 116.567 133.24 116.497 133.349 116.426C133.502 116.328 133.662 116.23 133.824 116.131C133.935 116.063 134.044 115.991 134.15 115.915C134.377 115.755 134.596 115.562 134.774 115.431C134.849 115.377 134.931 115.324 135.017 115.27C135.162 115.179 135.32 115.086 135.484 114.967C135.541 114.926 135.61 114.886 135.684 114.846C135.863 114.749 136.075 114.663 136.301 114.532C136.365 114.495 136.433 114.457 136.502 114.42C136.904 114.2 137.328 113.995 137.739 113.796C137.781 113.776 137.826 113.756 137.872 113.736C138.144 113.619 138.449 113.527 138.795 113.37C138.832 113.353 138.868 113.337 138.904 113.32C139.13 113.217 139.348 113.115 139.553 113.044C139.578 113.035 139.603 113.027 139.628 113.019C139.864 112.942 140.103 112.853 140.357 112.8L140.302 112.804C140.31 112.804 140.319 112.803 140.327 112.803C140.335 112.802 140.344 112.802 140.352 112.801C140.576 112.785 140.791 112.778 141.047 112.72L141.015 112.726C141.018 112.725 141.021 112.724 141.025 112.724C141.087 112.71 141.231 112.495 141.383 112.401C141.388 112.397 141.394 112.39 141.399 112.383C141.403 112.376 141.406 112.37 141.407 112.363C141.408 112.357 141.407 112.35 141.405 112.342C141.402 112.334 141.399 112.325 141.395 112.32C141.395 112.32 141.395 112.32 141.395 112.32C141.28 112.188 141.154 111.939 140.948 111.951C140.939 111.952 140.931 111.953 140.922 111.953L140.889 111.959C140.733 111.982 140.527 111.996 140.331 111.992C140.324 111.992 140.316 111.992 140.309 111.992C140.301 111.992 140.294 111.991 140.287 111.991L140.232 111.996C139.952 112.025 139.66 112.044 139.375 112.112C139.346 112.119 139.316 112.127 139.286 112.134C138.996 112.21 138.738 112.312 138.494 112.423C138.455 112.44 138.417 112.458 138.379 112.476C138.129 112.591 137.807 112.697 137.479 112.845C137.421 112.871 137.362 112.9 137.301 112.932C136.871 113.161 136.466 113.412 136.056 113.676C135.986 113.722 135.916 113.769 135.844 113.819C135.692 113.929 135.498 114.035 135.289 114.163C135.201 114.217 135.109 114.276 135.017 114.349C134.898 114.443 134.755 114.536 134.604 114.639C134.514 114.7 134.42 114.766 134.326 114.84C134.093 115.029 133.927 115.193 133.729 115.338C133.639 115.406 133.546 115.47 133.451 115.53C133.29 115.631 133.128 115.733 132.964 115.843C132.847 115.922 132.729 116.007 132.612 116.104C132.519 116.182 132.423 116.26 132.326 116.339C132.21 116.433 132.092 116.528 131.975 116.631C131.833 116.756 131.687 116.883 131.544 117.015C131.423 117.127 131.305 117.245 131.192 117.365C131.046 117.519 130.905 117.676 130.763 117.829C130.641 117.96 130.52 118.09 130.397 118.215C130.248 118.367 130.097 118.523 129.952 118.687C129.819 118.839 129.694 119 129.581 119.179C129.507 119.299 129.431 119.418 129.348 119.531C129.225 119.7 129.098 119.864 128.964 120.021C128.747 120.278 128.542 120.536 128.334 120.796C128.268 120.879 128.21 120.971 128.148 121.058C128.141 121.067 128.135 121.076 128.129 121.085C128.127 121.088 128.125 121.091 128.122 121.095C128.12 121.102 128.132 121.068 128.103 121.134C128.102 121.145 128.091 121.159 128.107 121.209C128.122 121.271 128.224 121.298 128.244 121.285C128.295 121.27 128.29 121.263 128.297 121.259C128.306 121.252 128.307 121.251 128.308 121.249C128.311 121.246 128.312 121.245 128.313 121.244C128.313 121.244 128.313 121.244 128.313 121.244C128.313 121.243 128.314 121.243 128.314 121.243C128.314 121.242 128.315 121.241 128.315 121.241C128.316 121.239 128.317 121.238 128.319 121.236C128.322 121.231 128.324 121.228 128.328 121.223C128.341 121.206 128.352 121.189 128.366 121.17C128.402 121.115 128.419 121.082 128.444 121.04C128.456 121.02 128.468 121 128.479 120.981C128.485 120.972 128.491 120.962 128.496 120.955C128.497 120.952 128.503 120.945 128.496 120.952C128.473 120.945 128.557 120.992 128.374 120.956C128.291 120.814 128.351 120.873 128.338 120.856C128.34 120.85 128.34 120.852 128.34 120.853C128.292 120.966 128.221 121.104 128.153 121.225C128.129 121.267 128.1 121.305 128.07 121.343C128.056 121.362 128.041 121.381 128.027 121.399C128.02 121.407 128.012 121.419 128.008 121.423C128.008 121.423 128.008 121.423 128.008 121.422C128.009 121.421 128.008 121.422 128.015 121.414C128.02 121.41 128.022 121.404 128.049 121.391C128.065 121.359 128.21 121.425 128.194 121.469C128.187 121.577 128.19 121.509 128.19 121.523C128.191 121.521 128.195 121.515 128.196 121.511C128.198 121.508 128.2 121.504 128.202 121.499C128.222 121.46 128.243 121.42 128.263 121.38C128.274 121.36 128.284 121.339 128.294 121.319C128.299 121.308 128.304 121.298 128.309 121.287C128.312 121.281 128.314 121.276 128.318 121.269C128.319 121.265 128.32 121.262 128.324 121.253C128.325 121.249 128.325 121.251 128.328 121.237C128.32 121.214 128.361 121.275 128.302 121.142C128.259 121.092 128.185 121.107 128.173 121.117C128.154 121.127 128.16 121.124 128.155 121.128C128.15 121.132 128.146 121.135 128.144 121.138C128.126 121.156 128.132 121.152 128.128 121.157C127.964 121.404 127.82 121.642 127.666 121.884C127.59 122.004 127.513 122.125 127.436 122.242C127.397 122.302 127.357 122.36 127.318 122.416C127.299 122.443 127.277 122.473 127.26 122.493C127.257 122.496 127.25 122.502 127.258 122.495C127.262 122.493 127.257 122.493 127.284 122.481C127.299 122.461 127.417 122.484 127.43 122.535C127.458 122.619 127.438 122.595 127.442 122.603C127.442 122.605 127.448 122.585 127.453 122.573C127.457 122.565 127.461 122.555 127.465 122.545C127.498 122.483 127.569 122.38 127.627 122.297C127.657 122.254 127.688 122.211 127.719 122.167C127.734 122.146 127.75 122.124 127.765 122.102C127.774 122.089 127.778 122.084 127.792 122.063C127.793 122.062 127.792 122.064 127.795 122.058C127.796 122.056 127.798 122.054 127.801 122.046C127.792 122.029 127.852 122.058 127.778 121.909C127.586 121.811 127.615 121.914 127.603 121.896C127.599 121.899 127.597 121.901 127.596 121.902C127.592 121.906 127.59 121.908 127.589 121.909C127.584 121.914 127.582 121.917 127.582 121.918C127.58 121.919 127.579 121.921 127.577 121.923C127.574 121.927 127.573 121.929 127.57 121.932C127.565 121.938 127.562 121.942 127.557 121.949C127.545 121.964 127.533 121.98 127.521 121.996C127.456 122.078 127.388 122.161 127.322 122.245C127.233 122.357 127.147 122.473 127.069 122.596C127.064 122.604 127.059 122.612 127.054 122.62C126.943 122.797 126.837 123.032 126.763 123.152Z" fill="#c8a86b"/>
  <line x1="141" y1="112.5" x2="206" y2="112.5" stroke="#c8a86b"/>
  <line x1="212" y1="112.5" x2="302" y2="112.5" stroke="#c8a86b"/>
  <line x1="360" y1="112.5" x2="308" y2="112.5" stroke="#c8a86b"/>
  <path d="M360.25 112.234C360.195 112.222 360.138 112.232 360.09 112.262C360.043 112.293 360.009 112.341 359.997 112.396C359.985 112.451 359.995 112.508 360.025 112.556C360.055 112.603 360.103 112.637 360.158 112.649C360.158 112.649 360.158 112.649 360.158 112.649C360.314 112.697 360.553 112.809 360.746 112.905C360.746 112.905 360.746 112.905 360.746 112.905C360.789 112.926 360.831 112.949 360.873 112.972C361.054 113.073 361.236 113.193 361.439 113.299C361.439 113.299 361.439 113.299 361.439 113.299C361.667 113.42 361.86 113.598 362.062 113.742C362.062 113.742 362.062 113.742 362.062 113.742C362.334 113.929 362.607 114.038 362.859 114.144C362.86 114.144 362.86 114.144 362.86 114.144C363.046 114.221 363.245 114.366 363.473 114.522C363.473 114.522 363.473 114.522 363.473 114.522C363.743 114.704 364.004 114.842 364.226 114.991C364.226 114.991 364.227 114.992 364.227 114.992C364.434 115.13 364.632 115.282 364.827 115.439C364.827 115.439 364.827 115.439 364.827 115.439C365.031 115.604 365.252 115.782 365.508 115.932C365.508 115.932 365.508 115.932 365.508 115.932C365.7 116.044 365.887 116.209 366.119 116.387C366.119 116.388 366.119 116.388 366.119 116.388C366.394 116.596 366.673 116.739 366.87 116.885C366.871 116.885 366.871 116.886 366.872 116.886C367.116 117.063 367.336 117.205 367.531 117.372C367.531 117.372 367.531 117.372 367.532 117.373C367.814 117.611 368.074 117.847 368.343 118.108C368.343 118.108 368.344 118.108 368.344 118.108C368.589 118.341 368.823 118.584 369.059 118.831C369.059 118.831 369.059 118.831 369.059 118.831C369.266 119.046 369.455 119.262 369.642 119.502C369.642 119.502 369.642 119.502 369.642 119.502C369.788 119.689 369.898 119.935 370.065 120.194C370.065 120.194 370.065 120.194 370.065 120.194C370.215 120.427 370.36 120.654 370.49 120.871C370.49 120.871 370.49 120.871 370.49 120.871C370.655 121.142 370.813 121.349 370.884 121.516C370.884 121.517 370.884 121.517 370.885 121.517C371.005 121.791 371.136 122.038 371.249 122.271C371.25 122.271 371.25 122.271 371.25 122.272C371.354 122.484 371.452 122.686 371.525 122.88C371.535 122.905 371.544 122.929 371.553 122.954L371.546 122.935C371.546 122.935 371.546 122.935 371.546 122.935C371.594 123.085 371.628 123.234 371.688 123.365L371.68 123.347C371.68 123.347 371.68 123.347 371.68 123.347C371.708 123.417 371.793 123.545 371.904 123.626C371.986 123.689 372.074 123.745 372.168 123.776C372.263 123.806 372.357 123.808 372.441 123.776C372.525 123.744 372.594 123.68 372.644 123.595C372.694 123.509 372.722 123.409 372.742 123.307C372.742 123.307 372.742 123.307 372.742 123.307C372.766 123.165 372.773 123.069 372.712 122.916C372.712 122.916 372.712 122.916 372.712 122.916L372.704 122.899C372.655 122.792 372.588 122.698 372.553 122.6C372.553 122.6 372.553 122.6 372.552 122.6L372.546 122.581C372.533 122.548 372.52 122.516 372.507 122.484C372.403 122.238 372.288 122.017 372.181 121.806C372.181 121.806 372.181 121.806 372.181 121.806C372.052 121.555 371.925 121.325 371.828 121.103C371.828 121.103 371.827 121.103 371.827 121.102C371.675 120.766 371.488 120.54 371.371 120.341C371.371 120.341 371.371 120.341 371.371 120.341C371.215 120.082 371.041 119.853 370.874 119.631C370.874 119.631 370.874 119.631 370.874 119.631C370.719 119.426 370.541 119.183 370.325 118.935C370.325 118.935 370.325 118.935 370.325 118.935C370.118 118.698 369.894 118.451 369.662 118.229C369.662 118.229 369.661 118.229 369.661 118.229C369.411 117.988 369.152 117.75 368.891 117.516C368.891 117.516 368.89 117.516 368.89 117.516C368.618 117.268 368.322 117.011 368.033 116.774C368.032 116.773 368.032 116.773 368.032 116.773C367.795 116.576 367.54 116.411 367.327 116.259C367.326 116.258 367.326 116.258 367.326 116.258C367.039 116.057 366.778 115.938 366.579 115.784C366.579 115.784 366.579 115.784 366.579 115.784C366.383 115.635 366.167 115.438 365.893 115.277C365.893 115.277 365.893 115.277 365.893 115.277C365.696 115.162 365.505 115.013 365.299 114.849C365.299 114.849 365.299 114.849 365.299 114.849C365.085 114.679 364.857 114.522 364.624 114.376C364.624 114.376 364.624 114.376 364.624 114.376C364.353 114.206 364.088 114.08 363.869 113.934C363.869 113.934 363.869 113.934 363.869 113.934C363.658 113.795 363.431 113.617 363.126 113.492C363.126 113.492 363.126 113.492 363.126 113.492C362.867 113.388 362.62 113.298 362.425 113.185C362.425 113.185 362.425 113.185 362.425 113.185C362.178 113.037 361.899 112.961 361.641 112.859C361.641 112.859 361.641 112.859 361.641 112.859C361.456 112.788 361.269 112.693 361.075 112.594C361.029 112.571 360.983 112.548 360.936 112.524C360.936 112.524 360.936 112.524 360.936 112.524C360.715 112.418 360.537 112.322 360.25 112.234Z" fill="#c8a86b"/>
  <line x1="162" y1="116.5" x2="276" y2="116.5" stroke="#c8a86b"/>
  <line x1="277" y1="116.5" x2="338" y2="116.5" stroke="#c8a86b"/>
  <line x1="121.5" y1="542" x2="121.5" y2="592" stroke="#c8a86b"/>
</g>

<line x1="105.5" y1="338" x2="105.5" y2="395" stroke="#c8a86b"/>
<line x1="120.5" y1="312" x2="120.5" y2="421" stroke="#c8a86b"/>
<line x1="105.429" y1="394.743" x2="126.429" y2="429.743" stroke="#c8a86b"/>
<line x1="105.432" y1="409.748" x2="126.432" y2="445.748" stroke="#c8a86b"/>
<line x1="105.5" y1="410" x2="105.5" y2="555" stroke="#c8a86b"/>

<line x1="120.5" y1="436" x2="120.5" y2="467" stroke="#c8a86b"/>
<line x1="120" y1="466.5" x2="127" y2="466.5" stroke="#c8a86b"/>
<line x1="120.5" y1="517" x2="120.5" y2="528" stroke="#c8a86b"/>


<line x1="120" y1="516.5" x2="127" y2="516.5" stroke="#c8a86b"/>

<line x1="121" y1="591.5" x2="127" y2="591.5" stroke="#c8a86b"/>
<line x1="126.317" y1="609.387" x2="104.317" y2="627.387" stroke="#c8a86b"/>
<line x1="104.5" y1="570" x2="104.5" y2="627" stroke="#c8a86b"/>
<line x1="105.5" y1="632" x2="105.5" y2="696" stroke="#c8a86b"/>
<line x1="105" y1="695.5" x2="119" y2="695.5" stroke="#c8a86b"/>
<line x1="104.683" y1="632.613" x2="126.683" y2="614.613" stroke="#c8a86b"/>
<line x1="120.5" y1="620" x2="120.5" y2="642" stroke="#c8a86b"/>
<line x1="126.5" y1="615" x2="126.5" y2="693" stroke="#c8a86b"/>
<line x1="121" y1="641.5" x2="127" y2="641.5" stroke="#c8a86b"/>
<line x1="124.429" y1="436.743" x2="130.429" y2="446.743" stroke="#c8a86b"/>
<line x1="130.5" y1="446" x2="130.5" y2="463" stroke="#c8a86b"/>
<line x1="127" y1="462.5" x2="135" y2="462.5" stroke="#c8a86b"/>
<line x1="134.5" y1="463" x2="134.5" y2="448" stroke="#c8a86b"/>
<line x1="134.571" y1="448.257" x2="128.571" y2="438.257" stroke="#c8a86b"/>
<line x1="122" y1="437.5" x2="125" y2="437.5" stroke="#c8a86b"/>
<line x1="128.879" y1="438.485" x2="124.879" y2="437.485" stroke="#c8a86b"/>
<line x1="126" y1="692.5" x2="373" y2="692.5" stroke="#c8a86b"/>
<line x1="126" y1="692.5" x2="373" y2="692.5" stroke="#c8a86b"/>
<line x1="373.5" y1="642" x2="373.5" y2="693" stroke="#c8a86b"/>
<line x1="378.317" y1="628.613" x2="400.317" y2="646.613" stroke="#c8a86b"/>
<line x1="378.317" y1="623.613" x2="400.317" y2="641.613" stroke="#c8a86b"/>
<line x1="400.5" y1="647" x2="400.5" y2="694" stroke="#c8a86b"/>



<line x1="366.429" y1="508.743" x2="381.429" y2="533.743" stroke="#c8a86b"/>
<line x1="385.265" y1="531.424" x2="377.265" y2="536.424" stroke="#c8a86b"/>
<line x1="381.5" y1="526" x2="381.5" y2="533" stroke="#c8a86b"/>
<line x1="380.803" y1="533.46" x2="373.803" y2="530.46" stroke="#c8a86b"/>



<line x1="366.429" y1="277.743" x2="381.429" y2="302.743" stroke="#c8a86b"/>
<line x1="385.265" y1="300.424" x2="377.265" y2="305.424" stroke="#c8a86b"/>
<line x1="381.5" y1="295" x2="381.5" y2="302" stroke="#c8a86b"/>
<line x1="380.803" y1="302.46" x2="373.803" y2="299.46" stroke="#c8a86b"/>

<line x1="377.325" y1="430.62" x2="384.325" y2="436.62" stroke="#c8a86b"/>
<line x1="381.432" y1="433.252" x2="367.432" y2="457.252" stroke="#c8a86b"/>
<line x1="373.803" y1="436.54" x2="380.803" y2="433.54" stroke="#c8a86b"/>
<line x1="381.5" y1="434" x2="381.5" y2="441" stroke="#c8a86b"/>



<line x1="377.325" y1="200.62" x2="384.325" y2="206.62" stroke="#c8a86b"/>
<line x1="381.432" y1="203.252" x2="367.432" y2="227.252" stroke="#c8a86b"/>
<line x1="373.803" y1="206.54" x2="380.803" y2="203.54" stroke="#c8a86b"/>
<line x1="381.5" y1="204" x2="381.5" y2="211" stroke="#c8a86b"/>
<line x1="125" y1="198.5" x2="130" y2="198.5" stroke="#c8a86b"/>


<line x1="121.5" y1="116.008" x2="120.484" y2="181.008" stroke="#c8a86b"/>
<line x1="105.5" y1="108" x2="105.5" y2="156" stroke="#c8a86b"/>

<line x1="116" y1="96.5" x2="192" y2="96.5" stroke="#c8a86b"/>
<line x1="121" y1="116.5" x2="127" y2="116.5" stroke="#c8a86b"/>
<path d="M126.663 123.618C126.661 123.649 126.671 123.679 126.691 123.703C126.711 123.727 126.739 123.741 126.77 123.744C126.801 123.746 126.832 123.737 126.855 123.717C126.879 123.697 126.894 123.668 126.896 123.637C126.896 123.637 126.896 123.637 126.896 123.637C126.918 123.447 126.991 123.234 127.08 123.048C127.081 123.048 127.081 123.048 127.081 123.048C127.117 122.975 127.159 122.903 127.206 122.833C127.352 122.616 127.525 122.406 127.679 122.182C127.679 122.182 127.68 122.182 127.68 122.182C127.92 121.834 128.168 121.497 128.409 121.142C128.409 121.142 128.409 121.141 128.409 121.141C128.654 120.775 128.957 120.45 129.262 120.109C129.262 120.108 129.262 120.108 129.263 120.107C129.495 119.844 129.724 119.579 129.96 119.319C129.96 119.319 129.961 119.318 129.961 119.318C130.257 118.99 130.558 118.667 130.856 118.337C130.856 118.337 130.857 118.336 130.858 118.335C131.146 118.014 131.45 117.706 131.77 117.416C131.771 117.415 131.772 117.414 131.773 117.413C132.142 117.08 132.508 116.741 132.884 116.428C132.886 116.427 132.887 116.426 132.888 116.425C133.13 116.224 133.412 116.087 133.701 115.907C133.703 115.906 133.704 115.905 133.705 115.904C134.103 115.638 134.468 115.373 134.872 115.147C134.873 115.146 134.875 115.145 134.876 115.144C135.467 114.801 136.081 114.508 136.679 114.13C136.68 114.129 136.682 114.128 136.683 114.127C136.988 113.922 137.346 113.835 137.728 113.66C137.729 113.659 137.729 113.659 137.73 113.659C138.125 113.469 138.552 113.343 138.994 113.193C138.995 113.193 138.996 113.192 138.997 113.192C139.332 113.078 139.657 112.92 139.954 112.815C140.016 112.793 140.077 112.776 140.133 112.765L140.12 112.768C140.12 112.768 140.12 112.768 140.121 112.768C140.258 112.75 140.395 112.73 140.534 112.71C140.534 112.71 140.534 112.71 140.534 112.71C140.637 112.697 140.752 112.694 140.852 112.68C140.922 112.672 140.983 112.635 141.018 112.574C141.053 112.514 141.061 112.433 141.04 112.356C141.02 112.279 140.973 112.213 140.912 112.178C140.851 112.142 140.781 112.141 140.716 112.168C140.716 112.168 140.716 112.168 140.716 112.168C140.626 112.205 140.55 112.249 140.46 112.265C140.46 112.266 140.459 112.266 140.459 112.266C140.326 112.291 140.192 112.313 140.056 112.336C140.056 112.336 140.056 112.336 140.056 112.336L140.043 112.338C139.958 112.357 139.88 112.384 139.806 112.413C139.463 112.552 139.178 112.713 138.866 112.825C138.865 112.825 138.864 112.825 138.863 112.826C138.444 112.976 137.992 113.109 137.566 113.323C137.565 113.324 137.564 113.324 137.564 113.324C137.243 113.481 136.84 113.613 136.5 113.853C136.499 113.854 136.497 113.855 136.496 113.856C135.942 114.226 135.32 114.538 134.73 114.895C134.729 114.896 134.727 114.897 134.726 114.898C134.32 115.135 133.932 115.423 133.559 115.682C133.558 115.683 133.557 115.684 133.556 115.685C133.296 115.854 132.993 116.016 132.732 116.233C132.731 116.235 132.729 116.236 132.728 116.237C132.34 116.56 131.977 116.897 131.608 117.23C131.607 117.231 131.605 117.232 131.604 117.233C131.279 117.528 130.963 117.837 130.668 118.164C130.667 118.165 130.667 118.166 130.666 118.166C130.37 118.493 130.069 118.817 129.771 119.145C129.77 119.145 129.77 119.146 129.769 119.146C129.533 119.406 129.294 119.664 129.058 119.925C129.058 119.925 129.058 119.926 129.057 119.926C128.756 120.257 128.432 120.592 128.172 120.981C128.172 120.982 128.172 120.982 128.172 120.982C127.937 121.327 127.687 121.672 127.448 122.021C127.448 122.021 127.447 122.022 127.447 122.022C127.296 122.244 127.146 122.466 127.002 122.705C126.956 122.782 126.911 122.862 126.871 122.946C126.871 122.946 126.871 122.946 126.871 122.946C126.77 123.158 126.693 123.369 126.663 123.618Z" fill="#c8a86b"/>
<path d="M131.651 117.531C131.672 117.514 131.685 117.489 131.687 117.462C131.69 117.435 131.682 117.408 131.664 117.388C131.647 117.367 131.622 117.354 131.595 117.351C131.568 117.349 131.541 117.357 131.521 117.374C131.49 117.4 131.46 117.426 131.43 117.452C131.06 117.785 130.706 118.125 130.346 118.463C130.346 118.463 130.346 118.464 130.346 118.464C130.231 118.579 130.117 118.692 130.012 118.812C130.011 118.813 130.011 118.813 130.011 118.813C129.981 118.85 129.946 118.89 129.928 118.966C129.911 119.033 129.948 119.106 129.988 119.131C129.997 119.137 130.006 119.141 130.016 119.143C130.027 119.145 130.036 119.143 130.045 119.138C130.053 119.133 130.059 119.125 130.062 119.115C130.065 119.106 130.065 119.095 130.064 119.085C130.064 119.085 130.064 119.085 130.064 119.085C130.063 119.045 130.08 119.034 130.093 119.028C130.109 119.017 130.141 118.988 130.172 118.954C130.172 118.954 130.172 118.953 130.172 118.953C130.274 118.836 130.378 118.72 130.488 118.61C130.486 118.612 130.486 118.612 130.486 118.612C130.846 118.274 131.202 117.931 131.565 117.605C131.594 117.58 131.623 117.555 131.651 117.531Z" fill="#c8a86b"/>
<path d="M131.358 117.926C131.399 117.885 131.422 117.829 131.422 117.771C131.422 117.713 131.399 117.658 131.358 117.617C131.317 117.576 131.262 117.553 131.204 117.553C131.146 117.553 131.09 117.576 131.049 117.617C131.049 117.617 131.049 117.617 131.049 117.617C130.989 117.68 130.951 117.723 130.901 117.776C130.747 117.942 130.591 118.108 130.434 118.274C130.434 118.274 130.434 118.274 130.434 118.274C129.881 118.854 129.329 119.439 128.788 120.04C128.788 120.041 128.788 120.041 128.788 120.041C128.637 120.212 128.519 120.412 128.419 120.642C128.39 120.712 128.36 120.803 128.372 120.89C128.374 120.904 128.383 120.918 128.394 120.928C128.406 120.938 128.42 120.944 128.434 120.944C128.449 120.944 128.463 120.939 128.475 120.929C128.487 120.919 128.495 120.905 128.498 120.891C128.498 120.891 128.498 120.891 128.498 120.891C128.508 120.836 128.544 120.796 128.589 120.75C128.741 120.604 128.935 120.475 129.085 120.311C129.085 120.311 129.085 120.311 129.085 120.311C129.63 119.729 130.197 119.156 130.751 118.575C130.752 118.574 130.752 118.574 130.752 118.574C130.909 118.407 131.065 118.241 131.221 118.073C131.267 118.024 131.323 117.963 131.358 117.926Z" fill="#c8a86b"/>
<path d="M130.504 118.833C130.583 118.833 130.659 118.802 130.714 118.746C130.77 118.69 130.802 118.614 130.802 118.535C130.802 118.456 130.77 118.38 130.714 118.324C130.659 118.268 130.583 118.237 130.504 118.237C130.315 118.259 130.338 118.292 130.306 118.304C130.285 118.318 130.273 118.328 130.261 118.338C130.239 118.357 130.221 118.374 130.204 118.39C130.171 118.422 130.142 118.452 130.113 118.482C129.999 118.6 129.893 118.717 129.787 118.835C129.787 118.836 129.786 118.836 129.786 118.836C129.106 119.603 128.441 120.339 127.832 121.217L127.837 121.208C127.837 121.208 127.837 121.208 127.837 121.208C127.732 121.362 127.655 121.55 127.571 121.735C127.571 121.735 127.571 121.735 127.571 121.735C127.549 121.783 127.532 121.837 127.519 121.893C127.498 121.98 127.489 122.071 127.475 122.155C127.473 122.17 127.477 122.189 127.485 122.205C127.493 122.222 127.503 122.234 127.516 122.242C127.53 122.25 127.546 122.253 127.564 122.251C127.582 122.25 127.6 122.245 127.612 122.235C127.612 122.235 127.612 122.235 127.612 122.235C127.678 122.183 127.75 122.14 127.819 122.097C127.863 122.069 127.906 122.039 127.944 122.004C127.944 122.004 127.944 122.004 127.944 122.004C128.091 121.868 128.249 121.739 128.366 121.566C128.366 121.566 128.366 121.566 128.366 121.566L128.372 121.557C128.915 120.776 129.568 119.978 130.23 119.234C130.23 119.234 130.231 119.234 130.231 119.234C130.334 119.118 130.439 119.003 130.542 118.896C130.568 118.869 130.593 118.843 130.617 118.82C130.629 118.809 130.64 118.799 130.647 118.793C130.651 118.79 130.653 118.788 130.649 118.791C130.633 118.792 130.672 118.812 130.504 118.833Z" fill="#c8a86b"/>
<path d="M130.345 119.004C130.435 119.004 130.522 118.968 130.586 118.904C130.651 118.84 130.687 118.753 130.687 118.662C130.687 118.572 130.651 118.485 130.586 118.42C130.522 118.356 130.435 118.32 130.345 118.32C130.181 118.334 130.186 118.363 130.157 118.372C130.136 118.385 130.124 118.393 130.113 118.401C130.092 118.417 130.08 118.427 130.067 118.439C130.042 118.46 130.023 118.478 130.003 118.496C129.967 118.532 129.933 118.566 129.9 118.6C129.723 118.787 129.561 118.971 129.397 119.158C129.391 119.166 129.39 119.166 129.39 119.167C128.744 119.956 128.093 120.731 127.475 121.547C127.475 121.547 127.474 121.548 127.474 121.548C127.273 121.826 127.077 122.084 126.94 122.491C126.906 122.601 126.89 122.733 126.896 122.839C126.9 122.905 126.924 122.97 126.969 123.021C127.013 123.071 127.074 123.103 127.139 123.109C127.204 123.115 127.27 123.095 127.323 123.054C127.376 123.012 127.411 122.952 127.428 122.888C127.428 122.888 127.428 122.888 127.428 122.888C127.449 122.818 127.473 122.775 127.506 122.722C127.642 122.516 127.873 122.253 128.066 121.992C128.066 121.992 128.066 121.992 128.067 121.991C128.671 121.193 129.282 120.379 129.918 119.602C129.918 119.601 129.919 119.601 129.919 119.6C130.073 119.425 130.234 119.242 130.394 119.074C130.423 119.044 130.452 119.015 130.478 118.99C130.491 118.977 130.504 118.965 130.513 118.958C130.517 118.954 130.52 118.951 130.518 118.953C130.516 118.955 130.513 118.957 130.501 118.964C130.481 118.968 130.497 118.991 130.345 119.004Z" fill="#c8a86b"/>
<path d="M128.542 121.138C128.6 121.109 128.643 121.059 128.663 120.999C128.684 120.938 128.679 120.872 128.651 120.815C128.622 120.757 128.572 120.714 128.511 120.694C128.451 120.673 128.385 120.678 128.327 120.706C128.327 120.706 128.327 120.706 128.327 120.706C128.21 120.773 128.182 120.819 128.135 120.865C127.734 121.34 127.447 121.81 127.128 122.292C127.124 122.298 127.124 122.298 127.124 122.298C126.967 122.554 126.86 122.84 126.751 123.122C126.751 123.122 126.751 123.122 126.751 123.122C126.71 123.227 126.672 123.347 126.654 123.469C126.646 123.528 126.641 123.585 126.637 123.641C126.636 123.66 126.643 123.68 126.655 123.696C126.667 123.712 126.683 123.723 126.701 123.727C126.719 123.731 126.738 123.728 126.756 123.719C126.774 123.709 126.789 123.694 126.795 123.677C126.795 123.677 126.795 123.677 126.795 123.677C126.815 123.627 126.837 123.58 126.861 123.535C126.91 123.443 126.973 123.361 127.034 123.268C127.035 123.268 127.035 123.268 127.035 123.268C127.196 123.024 127.383 122.798 127.535 122.549C127.535 122.549 127.535 122.549 127.535 122.549C127.841 122.084 128.154 121.587 128.49 121.191C128.516 121.16 128.565 121.122 128.542 121.138Z" fill="#c8a86b"/>



<path d="M359.872 112.289C359.872 112.288 359.872 112.288 359.871 112.288C359.87 112.287 359.87 112.288 359.869 112.288C359.869 112.288 359.868 112.288 359.868 112.289C359.868 112.29 359.868 112.29 359.868 112.291C359.868 112.291 359.868 112.291 359.868 112.291C359.869 112.292 359.869 112.293 359.87 112.294C359.879 112.312 359.888 112.33 359.897 112.348C359.898 112.349 359.898 112.35 359.899 112.351C359.899 112.352 359.899 112.352 359.9 112.353C359.901 112.353 359.901 112.353 359.902 112.352C359.902 112.352 359.903 112.352 359.903 112.351C359.903 112.351 359.903 112.35 359.903 112.35C359.903 112.35 359.903 112.35 359.903 112.35C359.902 112.348 359.902 112.347 359.901 112.346C359.892 112.328 359.883 112.31 359.874 112.292C359.873 112.291 359.873 112.29 359.872 112.289Z" fill="#c8a86b"/>
<path d="M360.073 112.229C360.073 112.143 360.039 112.061 359.978 112C359.917 111.939 359.835 111.905 359.749 111.905C359.663 111.905 359.58 111.939 359.52 112C359.459 112.061 359.425 112.143 359.425 112.229C359.433 112.406 359.52 112.46 359.547 112.488C359.58 112.515 359.6 112.525 359.617 112.534C359.648 112.55 359.667 112.556 359.683 112.562C359.79 112.596 359.843 112.601 359.91 112.614L359.894 112.611C359.895 112.611 359.895 112.611 359.896 112.611C360.039 112.644 360.186 112.671 360.33 112.711L360.32 112.707C360.32 112.707 360.32 112.707 360.32 112.707C360.375 112.724 360.467 112.636 360.583 112.606C360.609 112.599 360.635 112.595 360.66 112.593C360.661 112.569 360.663 112.542 360.664 112.513C360.671 112.39 360.639 112.228 360.563 112.186C360.563 112.186 360.563 112.185 360.563 112.185L360.552 112.181C360.39 112.093 360.22 112.02 360.039 111.979C360.038 111.979 360.037 111.979 360.037 111.978L360.02 111.975C359.969 111.967 359.902 111.952 359.894 111.949C359.895 111.949 359.897 111.95 359.914 111.958C359.923 111.963 359.936 111.969 359.963 111.991C359.984 112.013 360.064 112.061 360.073 112.229Z" fill="#c8a86b"/>
<path d="M360.114 112.042C360.04 112.026 359.963 112.039 359.899 112.08C359.836 112.121 359.791 112.185 359.774 112.259C359.758 112.332 359.772 112.409 359.812 112.473C359.853 112.537 359.917 112.582 359.991 112.598C360.004 112.601 360.053 112.617 360.09 112.631C360.234 112.686 360.381 112.756 360.516 112.834C360.516 112.834 360.516 112.834 360.517 112.834C360.754 112.972 360.975 113.125 361.178 113.27C361.178 113.27 361.178 113.27 361.178 113.27C361.4 113.428 361.623 113.56 361.824 113.703L361.856 113.724C361.856 113.724 361.856 113.724 361.856 113.724C361.964 113.781 362.075 113.823 362.179 113.874C362.179 113.874 362.179 113.874 362.18 113.874C362.208 113.889 362.245 113.89 362.286 113.886C362.351 113.88 362.427 113.863 362.491 113.863C362.497 113.863 362.504 113.861 362.51 113.858C362.516 113.855 362.52 113.852 362.524 113.848C362.527 113.845 362.529 113.84 362.531 113.833C362.533 113.827 362.535 113.819 362.534 113.814C362.534 113.814 362.534 113.814 362.534 113.814C362.525 113.75 362.528 113.671 362.518 113.604C362.512 113.56 362.5 113.523 362.48 113.498C362.48 113.498 362.48 113.498 362.48 113.498C362.379 113.385 362.266 113.286 362.145 113.214C362.145 113.213 362.145 113.213 362.145 113.213L362.178 113.235C361.961 113.061 361.742 112.912 361.537 112.766C361.537 112.766 361.537 112.766 361.537 112.766C361.295 112.594 361.037 112.478 360.802 112.341C360.802 112.341 360.802 112.341 360.802 112.341C360.637 112.246 360.471 112.167 360.291 112.098C360.238 112.079 360.194 112.061 360.114 112.042Z" fill="#c8a86b"/>
<path d="M368.871 112.729C368.958 112.704 369.033 112.646 369.077 112.566C369.122 112.487 369.133 112.393 369.108 112.306C369.084 112.218 369.025 112.144 368.946 112.1C368.866 112.055 368.773 112.044 368.685 112.069C368.685 112.069 368.685 112.069 368.685 112.069C368.453 112.166 368.481 112.185 368.402 112.235C368.16 112.419 367.944 112.599 367.723 112.754C367.722 112.754 367.722 112.755 367.721 112.755C367.354 113.017 367.08 113.326 366.834 113.622C366.834 113.622 366.833 113.623 366.833 113.623C366.597 113.908 366.398 114.222 366.229 114.548C366.229 114.548 366.229 114.549 366.228 114.549C366.143 114.714 366.06 114.888 365.993 115.079L365.989 115.094C365.989 115.094 365.989 115.094 365.989 115.094C365.974 115.141 365.957 115.192 365.94 115.24C365.91 115.323 365.879 115.397 365.857 115.469C365.816 115.594 365.83 115.718 365.913 115.815C365.995 115.913 366.139 115.976 366.296 115.989C366.454 116.002 366.607 115.964 366.704 115.882C366.802 115.799 366.836 115.679 366.817 115.55C366.817 115.55 366.817 115.55 366.817 115.55C366.806 115.486 366.789 115.425 366.78 115.374C366.775 115.345 366.773 115.321 366.777 115.292C366.777 115.292 366.777 115.292 366.777 115.292L366.773 115.307C366.802 115.173 366.852 115.032 366.918 114.894C366.918 114.893 366.918 114.893 366.918 114.893C367.055 114.607 367.223 114.338 367.415 114.089C367.416 114.088 367.416 114.088 367.416 114.087C367.645 113.789 367.858 113.498 368.115 113.316C368.115 113.316 368.116 113.316 368.116 113.315C368.368 113.139 368.596 112.949 368.814 112.783C368.845 112.753 368.978 112.683 368.871 112.729Z" fill="#c8a86b"/>
<path d="M382.365 112.055C382.247 111.936 382.087 111.868 381.92 111.866C381.753 111.865 381.591 111.93 381.472 112.047C381.352 112.165 381.284 112.325 381.283 112.492C381.281 112.66 381.347 112.821 381.464 112.94C381.464 112.94 381.464 112.94 381.464 112.94C381.693 113.144 381.742 113.136 381.839 113.196C382.131 113.347 382.372 113.465 382.61 113.606C382.626 113.616 382.642 113.626 382.658 113.636C383.008 113.85 383.238 114.205 383.632 114.743C383.648 114.765 383.664 114.785 383.68 114.806C383.974 115.188 384.252 115.597 384.539 116.019L384.553 116.039C384.56 116.048 384.567 116.057 384.573 116.065C384.651 116.167 384.69 116.245 384.736 116.362C384.764 116.435 384.789 116.513 384.81 116.595C384.857 116.771 384.997 116.891 385.171 116.94C385.346 116.989 385.545 116.962 385.721 116.868C385.897 116.773 386.029 116.621 386.084 116.449C386.138 116.276 386.115 116.094 385.994 115.957C385.994 115.957 385.994 115.957 385.994 115.957C385.931 115.884 385.871 115.809 385.811 115.731C385.721 115.614 385.611 115.465 385.524 115.353C385.519 115.345 385.513 115.338 385.508 115.331L385.522 115.35C385.241 114.937 384.959 114.504 384.645 114.079C384.628 114.056 384.611 114.033 384.594 114.01C384.324 113.638 383.973 112.964 383.339 112.573C383.311 112.554 383.282 112.537 383.253 112.52C382.973 112.353 382.673 112.206 382.431 112.08C382.376 112.056 382.264 111.97 382.365 112.055Z" fill="#c8a86b"/>
<path d="M384.029 232.755C384.029 232.852 384.067 232.946 384.136 233.014C384.205 233.083 384.299 233.122 384.396 233.122C384.493 233.122 384.587 233.083 384.656 233.014C384.725 232.946 384.763 232.852 384.763 232.755C384.757 232.787 384.783 232.812 384.701 232.954C384.667 233.021 384.519 233.115 384.429 233.112C384.33 233.117 384.292 233.096 384.259 233.084C384.159 233.034 384.17 233.025 384.154 233.014C384.138 232.996 384.139 232.996 384.138 232.996C384.139 232.996 384.145 233.006 384.152 233.017C384.165 233.038 384.18 233.067 384.195 233.096C384.221 233.147 384.246 233.202 384.27 233.259C384.272 233.262 384.273 233.266 384.275 233.269C384.45 233.649 384.181 234.073 383.797 234.565L383.848 234.504C383.842 234.51 383.836 234.516 383.829 234.521C383.438 234.875 382.915 235.066 382.488 235.406C382.486 235.407 382.484 235.409 382.482 235.411C382.384 235.491 382.298 235.555 382.168 235.655C382.111 235.699 382.052 235.746 381.993 235.795C381.894 235.876 381.814 235.983 381.779 236.107C381.743 236.231 381.753 236.362 381.809 236.473C381.864 236.584 381.963 236.67 382.084 236.716C382.205 236.762 382.338 236.762 382.462 236.731C382.462 236.731 382.462 236.731 382.462 236.731C382.543 236.71 382.623 236.686 382.704 236.656C382.87 236.597 383.078 236.492 383.239 236.358C383.241 236.356 383.243 236.354 383.246 236.353C383.672 236.01 384.002 235.514 384.395 235.105C384.402 235.098 384.408 235.091 384.415 235.085L384.466 235.024C384.765 234.569 385.307 233.796 384.953 232.988C384.951 232.982 384.948 232.975 384.945 232.969C384.916 232.901 384.885 232.834 384.85 232.764C384.83 232.724 384.808 232.683 384.781 232.638C384.767 232.615 384.753 232.592 384.73 232.561C384.718 232.545 384.707 232.529 384.677 232.497C384.654 232.479 384.659 232.464 384.549 232.409C384.514 232.396 384.474 232.375 384.372 232.38C384.279 232.377 384.129 232.472 384.094 232.541C384.01 232.687 384.035 232.717 384.029 232.755Z" fill="#c8a86b"/>
<path d="M382.828 286.086C382.722 286.05 382.607 286.058 382.506 286.108C382.406 286.158 382.33 286.245 382.294 286.351C382.259 286.457 382.267 286.573 382.316 286.673C382.366 286.773 382.453 286.849 382.559 286.885C382.559 286.885 382.559 286.885 382.559 286.885C382.454 286.84 382.543 286.88 382.547 286.887C382.567 286.9 382.589 286.915 382.611 286.931C382.816 287.079 383.009 287.266 383.139 287.458C383.14 287.459 383.14 287.46 383.141 287.46C383.364 287.79 383.495 288.189 383.655 288.609L383.62 288.504C383.62 288.505 383.62 288.505 383.62 288.506C383.66 288.792 383.671 289.098 383.678 289.337L383.676 289.29C383.676 289.29 383.676 289.29 383.676 289.29C383.672 289.328 383.654 289.487 383.646 289.601C383.64 289.669 383.635 289.736 383.63 289.803C383.619 289.959 383.67 290.111 383.775 290.227C383.88 290.343 384.03 290.412 384.191 290.42C384.351 290.427 384.507 290.373 384.623 290.268C384.738 290.163 384.804 290.016 384.808 289.86C384.808 289.86 384.808 289.86 384.808 289.86C384.809 289.797 384.811 289.736 384.814 289.675C384.817 289.557 384.828 289.483 384.827 289.288C384.827 289.288 384.827 289.287 384.827 289.287L384.825 289.24C384.777 288.884 384.668 288.603 384.588 288.304C384.587 288.303 384.587 288.302 384.587 288.302L384.552 288.197C384.344 287.812 384.114 287.395 383.84 286.989C383.839 286.988 383.838 286.987 383.838 286.986C383.629 286.682 383.382 286.451 383.103 286.246C383.072 286.224 383.042 286.203 383.008 286.181C382.957 286.153 382.992 286.157 382.828 286.086Z" fill="#c8a86b"/>
<path d="M384.477 463.37C384.446 463.279 384.381 463.205 384.296 463.162C384.21 463.12 384.111 463.113 384.021 463.144C383.93 463.174 383.856 463.239 383.813 463.325C383.771 463.41 383.764 463.509 383.795 463.599C383.795 463.599 383.795 463.599 383.795 463.599C383.771 463.504 383.792 463.614 383.791 463.633C383.793 463.669 383.795 463.708 383.796 463.746C383.802 463.949 383.796 464.157 383.771 464.349C383.771 464.349 383.771 464.349 383.771 464.349C383.73 464.67 383.511 464.961 383.338 465.303C383.338 465.304 383.337 465.304 383.337 465.304C383.21 465.531 382.935 465.736 382.663 466.07C382.663 466.07 382.662 466.071 382.662 466.071C382.407 466.391 382.173 466.684 381.935 466.87L382.016 466.816C382.016 466.816 382.016 466.816 382.016 466.816C381.996 466.828 381.939 466.845 381.848 466.874C381.848 466.874 381.848 466.874 381.848 466.874C381.836 466.878 381.824 466.882 381.812 466.886C381.732 466.913 381.653 466.939 381.573 466.966C381.42 467.017 381.294 467.126 381.222 467.27C381.15 467.414 381.138 467.581 381.189 467.734C381.24 467.887 381.35 468.013 381.494 468.085C381.638 468.157 381.804 468.169 381.957 468.118C382.037 468.091 382.116 468.065 382.196 468.038C382.208 468.034 382.22 468.03 382.232 468.026C382.232 468.026 382.232 468.026 382.232 468.026C382.322 467.996 382.447 467.952 382.594 467.872C382.595 467.871 382.595 467.871 382.595 467.871L382.677 467.818C383.08 467.497 383.35 467.138 383.604 466.824C383.604 466.824 383.604 466.824 383.604 466.823C383.821 466.546 384.108 466.173 384.267 465.659C384.267 465.659 384.267 465.659 384.267 465.659C384.363 465.294 384.429 464.874 384.485 464.441C384.485 464.441 384.485 464.441 384.485 464.441C384.516 464.195 384.522 463.961 384.516 463.723C384.514 463.678 384.512 463.632 384.509 463.585C384.501 463.521 384.518 463.546 384.477 463.37Z" fill="#c8a86b"/>
<path d="M383.905 638.337C383.875 638.249 383.812 638.176 383.729 638.134C383.646 638.093 383.55 638.086 383.462 638.115C383.374 638.144 383.301 638.207 383.26 638.29C383.218 638.373 383.211 638.469 383.241 638.557C383.241 638.557 383.241 638.557 383.241 638.557C383.271 638.646 383.296 638.712 383.322 638.783C383.408 639.02 383.479 639.254 383.52 639.484C383.52 639.484 383.521 639.484 383.521 639.485C383.582 639.814 383.353 640.096 383.054 640.441C383.053 640.442 383.052 640.443 383.051 640.444C382.794 640.745 382.461 640.998 382.179 641.332L382.233 641.276C382.233 641.276 382.232 641.277 382.232 641.277C382.093 641.402 381.987 641.548 381.871 641.657L381.943 641.623C381.943 641.623 381.943 641.623 381.943 641.623C381.948 641.625 381.95 641.631 381.95 641.639C381.948 641.668 381.894 641.718 381.817 641.748C381.752 641.775 381.69 641.836 381.645 641.904C381.599 641.972 381.574 642.04 381.574 642.109C381.574 642.179 381.599 642.247 381.645 642.315C381.69 642.383 381.752 642.444 381.817 642.471C381.893 642.501 381.995 642.552 382.144 642.548C382.187 642.547 382.232 642.541 382.277 642.528C382.277 642.528 382.278 642.528 382.278 642.528L382.351 642.494C382.596 642.394 382.818 642.276 382.99 642.123C382.99 642.122 382.991 642.122 382.991 642.121L383.046 642.065C383.313 641.748 383.55 641.365 383.789 640.971C383.79 640.969 383.791 640.968 383.792 640.966C384.033 640.576 384.335 639.977 384.21 639.362C384.21 639.362 384.209 639.361 384.209 639.361C384.158 639.072 384.073 638.803 383.98 638.546C383.954 638.472 383.924 638.393 383.905 638.337Z" fill="#c8a86b"/>
<line x1="373" y1="642.5" x2="382" y2="642.5" stroke="#c8a86b"/>
<line x1="384" y1="638.5" x2="373" y2="638.5" stroke="#c8a86b"/>
<line x1="378.5" y1="629" x2="378.5" y2="638" stroke="#c8a86b"/>
<line x1="378" y1="520.5" x2="385" y2="520.5" stroke="#c8a86b"/>
<line x1="377" y1="517.5" x2="382" y2="517.5" stroke="#c8a86b"/>
<line x1="384" y1="463.5" x2="373" y2="463.5" stroke="#c8a86b"/>
<line x1="378.5" y1="447" x2="378.5" y2="464" stroke="#c8a86b"/>
<line x1="373" y1="467.5" x2="383" y2="467.5" stroke="#c8a86b"/>
<line x1="383" y1="286.5" x2="377" y2="286.5" stroke="#c8a86b"/>
<line x1="384" y1="289.5" x2="378" y2="289.5" stroke="#c8a86b"/>
<line x1="385" y1="232.5" x2="372" y2="232.5" stroke="#c8a86b"/>
<line x1="382" y1="236.5" x2="372" y2="236.5" stroke="#c8a86b"/>
<line x1="378.5" y1="216" x2="378.5" y2="233" stroke="#c8a86b"/>
<line x1="385" y1="116.5" x2="372" y2="116.5" stroke="#c8a86b"/>
<line x1="369" y1="112.5" x2="382" y2="112.5" stroke="#c8a86b"/>
<line x1="378.5" y1="116" x2="378.5" y2="199" stroke="#c8a86b"/>
<line x1="400.5" y1="108" x2="400.5" y2="162" stroke="#c8a86b"/>
<line x1="387" y1="96.5" x2="321" y2="96.5" stroke="#c8a86b"/>
<line x1="400.5" y1="176" x2="400.5" y2="328" stroke="#c8a86b"/>
<line x1="400.5" y1="344" x2="400.5" y2="392" stroke="#c8a86b"/>
<line x1="400.5" y1="406" x2="400.5" y2="559" stroke="#c8a86b"/>
<line x1="400.5" y1="575" x2="400.5" y2="642" stroke="#c8a86b"/>
<line x1="196" y1="96.5" x2="315" y2="96.5" stroke="#c8a86b"/>
<line x1="378.5" y1="307" x2="378.5" y2="429" stroke="#c8a86b"/>

<g id="aqua-lb2-k" class="interactive-group">
  <line x1="232" y1="346.5" x2="255" y2="346.5" stroke="#c8a86b"/>
  <line x1="254.511" y1="346.894" x2="262.511" y2="309.894" stroke="#c8a86b"/>
  <line x1="263" y1="310.5" x2="236" y2="310.5" stroke="#c8a86b"/>
  <line x1="236.5" y1="310" x2="236.5" y2="346" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-n" class="interactive-group">
  <line x1="245.487" y1="379.115" x2="237.487" y2="413.115" stroke="#c8a86b"/>
  <line x1="245" y1="379.5" x2="263" y2="379.5" stroke="#c8a86b"/>
  <line x1="262.5" y1="380" x2="262.5" y2="413" stroke="#c8a86b"/>
  <line x1="237" y1="412.5" x2="263" y2="412.5" stroke="#c8a86b"/>
</g>



<g id="aqua-lb2-j" class="interactive-group">
  <line x1="231.468" y1="281.824" x2="234.468" y2="289.824" stroke="#c8a86b"/>
  <line x1="230.856" y1="281.521" x2="240.856" y2="278.521" stroke="#c8a86b"/>
  <line x1="240.497" y1="278.945" x2="241.497" y2="287.945" stroke="#c8a86b"/>
  <line x1="233.879" y1="289.515" x2="241.879" y2="287.515" stroke="#c8a86b"/>

  <line x1="266.481" y1="278.137" x2="264.481" y2="285.137" stroke="#c8a86b"/>
  <line x1="265.504" y1="298.062" x2="264.504" y2="290.062" stroke="#c8a86b"/>
  <line x1="265" y1="290.5" x2="259" y2="290.5" stroke="#c8a86b"/>
  <line x1="265" y1="285.5" x2="255" y2="285.5" stroke="#c8a86b"/>
  <line x1="259" y1="290.5" x2="255" y2="290.5" stroke="#c8a86b"/>
  <line x1="255.474" y1="290.842" x2="258.474" y2="299.842" stroke="#c8a86b"/>
  <line x1="259.137" y1="276.519" x2="266.137" y2="278.519" stroke="#c8a86b"/>
  <line x1="257.879" y1="299.515" x2="265.879" y2="297.515" stroke="#c8a86b"/>
  <line x1="259.457" y1="276.203" x2="255.457" y2="285.203" stroke="#c8a86b"/>

</g>


<path d="M243.303 413.316C243.303 413.279 243.288 413.244 243.262 413.218C243.237 413.192 243.201 413.178 243.165 413.178C243.128 413.178 243.093 413.192 243.067 413.218C243.041 413.244 243.027 413.279 243.027 413.316C243.027 413.319 243.027 413.323 243.027 413.326C243.027 413.389 243.027 413.451 243.027 413.514C243.027 413.517 243.027 413.521 243.027 413.524C243.027 413.561 243.041 413.596 243.067 413.622C243.093 413.648 243.128 413.662 243.165 413.662C243.201 413.662 243.237 413.648 243.262 413.622C243.288 413.596 243.303 413.561 243.303 413.524C243.303 413.521 243.303 413.517 243.303 413.514C243.303 413.451 243.303 413.389 243.303 413.326C243.303 413.323 243.303 413.319 243.303 413.316Z" fill="#c8a86b"/>
<path d="M231.756 515.848C231.753 515.841 231.751 515.834 231.749 515.827C231.706 515.699 231.663 515.571 231.62 515.443C231.618 515.435 231.616 515.428 231.613 515.421C231.616 515.428 231.618 515.435 231.62 515.443C231.663 515.571 231.706 515.699 231.749 515.827C231.751 515.834 231.753 515.841 231.756 515.848Z" fill="#c8a86b"/>


<g id="aero-lg-c" class="interactive-group">
  <line x1="241" y1="685.5" x2="258" y2="685.5" stroke="#c8a86b"/>
  <line x1="241.5" y1="656" x2="241.5" y2="686" stroke="#c8a86b"/>
  <line x1="241" y1="655.5" x2="258" y2="655.5" stroke="#c8a86b"/>
  <line x1="257.5" y1="656" x2="257.5" y2="686" stroke="#c8a86b"/>
</g>

<g id="aero-l2-c" class="interactive-group">
<line x1="257.628" y1="655.666" x2="266.628" y2="645.666" stroke="#c8a86b"/>
<line x1="232.372" y1="645.666" x2="241.372" y2="655.666" stroke="#c8a86b"/>
<g filter="url(#filter0_d_0_1)">
</g>

<path d="M232 645.5C246.439 638.43 254.079 638.645 267 645.5" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-l" class="interactive-group">
  <line x1="232.5" y1="353" x2="232.5" y2="374" stroke="#c8a86b"/>
  <line x1="232" y1="373.5" x2="247" y2="373.5" stroke="#c8a86b"/>
  <line x1="247.5" y1="354" x2="247.5" y2="374" stroke="#c8a86b"/>
  <line x1="232" y1="353.5" x2="248" y2="353.5" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-m" class="interactive-group">
  <line x1="252.5" y1="353" x2="252.5" y2="375" stroke="#c8a86b"/>
  <line x1="253" y1="374.5" x2="267" y2="374.5" stroke="#c8a86b"/>
  <line x1="266.5" y1="354" x2="266.5" y2="375" stroke="#c8a86b"/>
  <line x1="253" y1="353.5" x2="267" y2="353.5" stroke="#c8a86b" opacity="0.2"/>
</g>

<path d="M262.498 205.953C256.5 212 256.48 215.329 264.498 226.953" stroke="#c8a86b"/>
<path d="M264.056 226.903C267.445 217.691 267.149 212.727 262 204.291" stroke="#c8a86b"/>

<g id="aqua-lb2-d" class="interactive-group">
  <path d="M257.494 172.925C250 180 251 198.5 262.494 205.925" stroke="#c8a86b"/>
  <path d="M257.494 172.925C269.494 184.337 270.415 191.589 262.494 205.925" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-g" class="interactive-group">
  <path d="M235.707 151C223.74 116.961 278.447 118.38 264.77 151" stroke="#c8a86b"/>
  <path d="M265.474 150.158C263.5 151.5 257.5 168 257.474 174.158" stroke="#c8a86b"/>
  <path d="M235.536 151.02C252.855 163.127 245.947 166.805 239.245 178.481" stroke="#c8a86b"/>
  <path d="M238.716 177.95C233.047 200.189 231.238 204.867 242.045 216.956" stroke="#c8a86b"/>
  <path d="M257.494 172.925C250 180 251 198.5 262.494 205.925" stroke="#c8a86b"/>
  <path d="M262.498 205.953C256.5 212 256.48 215.329 264.498 226.953" stroke="#c8a86b"/>
  <path d="M241.497 216.054C248 229 244.692 255.903 234.497 281.054" stroke="#c8a86b"/>
  <path d="M238 289C239.064 297.191 238.185 300.942 232 305" stroke="#c8a86b"/>
  <path d="M261.507 243.918C259.182 236.582 260 232.655 264.507 225.918" stroke="#c8a86b"/>
  <path d="M259.501 276.97C273.233 270.771 271 261.5 261.501 243.97" stroke="#c8a86b"/>
  <line x1="259.5" y1="285" x2="259.5" y2="291" stroke="#c8a86b"/>
  <path d="M262.47 298.829C262.678 297.755 268.499 302.004 266.47 309.829" stroke="#c8a86b"/>
  <line x1="232.5" y1="304" x2="232.5" y2="347" stroke="#c8a86b"/>
  <line x1="253.5" y1="346" x2="253.5" y2="354" stroke="#c8a86b"/>
  <line x1="253" y1="353.5" x2="267" y2="353.5" stroke="#c8a86b" opacity="1.0"/>
  <line x1="266.5" y1="309" x2="266.5" y2="354" stroke="#c8a86b" opacity="1.0"/>
  <path d="M239.138 444C220.543 406.431 280.66 404.251 263.361 444" stroke="#c8a86b"/>
  <path d="M239.395 443.693C236.722 444.222 254.21 451.959 246 452" stroke="#c8a86b"/>
  <path d="M247.024 452.075C237.719 453.874 236.377 465.158 249.848 461.048" stroke="#c8a86b"/>
  <path d="M263.828 443C257.724 468.994 265.381 493.47 267.891 506.981" stroke="#c8a86b"/>
  <path d="M248.145 460.425C255.346 458.251 259.722 464.828 239 481" stroke="#c8a86b"/>
  <path d="M240 480C231.518 486.858 229.678 502.56 240.999 512.97" stroke="#c8a86b"/>
  <path d="M240.892 512.512C256.086 524.724 265.974 514.055 267.892 506.512" stroke="#c8a86b"/>

</g>


<g id="aqua-lb2-c" class="interactive-group">
  <line x1="246.076" y1="163.506" x2="259.076" y2="165.506" stroke="#c8a86b"/>
  <line x1="245.033" y1="168.702" x2="258.088" y2="170.305" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-r" class="interactive-group">
<mask id="path-814-inside-1_0_1" fill="white">
<path d="M264 561.5H234L249 537L264 561.5Z"/>
</mask>
<path d="M264 561.5V562.5H265.785L264.853 560.978L264 561.5ZM234 561.5L233.147 560.978L232.215 562.5H234V561.5ZM249 537L249.853 536.478L249 535.085L248.147 536.478L249 537ZM264 561.5V560.5H234V561.5V562.5H264V561.5ZM234 561.5L234.853 562.022L249.853 537.522L249 537L248.147 536.478L233.147 560.978L234 561.5ZM249 537L248.147 537.522L263.147 562.022L264 561.5L264.853 560.978L249.853 536.478L249 537Z" fill="#c8a86b" mask="url(#path-814-inside-1_0_1)"/>
<path d="M264 561.5V562.5H265.785L264.853 560.978L264 561.5ZM234 561.5L233.147 560.978L232.215 562.5H234V561.5ZM249 537L249.853 536.478L249 535.085L248.147 536.478L249 537ZM264 561.5V560.5H234V561.5V562.5H264V561.5ZM234 561.5L234.853 562.022L249.853 537.522L249 537L248.147 536.478L233.147 560.978L234 561.5ZM249 537L248.147 537.522L263.147 562.022L264 561.5L264.853 560.978L249.853 536.478L249 537Z" fill="#c8a86b" mask="url(#path-814-inside-1_0_1)"/>
</g>


<g id="aqua-lb2-q" class="interactive-group">
  <circle cx="248.5" cy="525.5" r="11" stroke="#c8a86b"/>
</g>

<line x1="35" y1="537.5" x2="99" y2="537.5" stroke="#c8a86b"/>
<line x1="35" y1="503.5" x2="99" y2="503.5" stroke="#c8a86b"/>
<line x1="35" y1="471.5" x2="100" y2="471.5" stroke="#c8a86b"/>
<line x1="36" y1="438.5" x2="99" y2="438.5" stroke="#c8a86b"/>
<line x1="36" y1="109.5" x2="99" y2="109.5" stroke="#c8a86b"/>
<line x1="99" y1="143.5" x2="36" y2="143.5" stroke="#c8a86b"/>
<line x1="99" y1="175.5" x2="36" y2="175.5" stroke="#c8a86b"/>
<line x1="36" y1="207.5" x2="99" y2="207.5" stroke="#c8a86b"/>
<line x1="36" y1="241.5" x2="100" y2="241.5" stroke="#c8a86b"/>
<line x1="36" y1="274.5" x2="99" y2="274.5" stroke="#c8a86b"/>
<line x1="99" y1="307.5" x2="36" y2="307.5" stroke="#c8a86b"/>
<line x1="36" y1="340.5" x2="100" y2="340.5" stroke="#c8a86b"/>
<line x1="35" y1="372.5" x2="100" y2="372.5" stroke="#c8a86b"/>
<line x1="257.5" y1="686" x2="257.5" y2="728" stroke="#c8a86b"/>
<line x1="242.5" y1="703" x2="242.5" y2="686" stroke="#c8a86b"/>


<g id="aero-lg-b" class="interactive-group">
  <line x1="217" y1="703.5" x2="243" y2="703.5" stroke="#c8a86b"/>
  <line x1="217.5" y1="704" x2="217.5" y2="716" stroke="#c8a86b"/>
  <line x1="217" y1="715.5" x2="243" y2="715.5" stroke="#c8a86b"/>
</g>


<line x1="242.5" y1="716" x2="242.5" y2="720" stroke="#c8a86b"/>

<g id="aero-lg-a" class="interactive-group">
  <line x1="243" y1="720.5" x2="217" y2="720.5" stroke="#c8a86b"/>
  <line x1="217.5" y1="721" x2="217.5" y2="728" stroke="#c8a86b"/>
  <line x1="217" y1="728.5" x2="247" y2="728.5" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-tu" class="interactive-group">
  <line x1="160.956" y1="678.502" x2="216.956" y2="673.502" stroke="#c8a86b"/>
  <line x1="161" y1="663.5" x2="217" y2="663.5" stroke="#c8a86b"/>
  <path d="M161.596 663.099C145.455 662.602 148.482 680.491 161.596 679.001" stroke="#c8a86b"/>
  <path d="M216.5 664C225 663.5 226.5 673 216.5 673" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-w" class="interactive-group">
  <line x1="287.009" y1="661.5" x2="343.009" y2="662.5" stroke="#c8a86b"/>
  <line x1="287.055" y1="675.32" x2="341.048" y2="680.502" stroke="#c8a86b"/>
  <path d="M287.5 662C279.758 662.467 281.5 674 287.5 675" stroke="#c8a86b"/>
  <path d="M343.497 663.058C348.673 671.765 346.016 674.717 341.497 680.058" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-s" class="interactive-group">
  <path d="M246.075 598.214C248.505 599.674 250.374 601.501 251.44 603.25C252.52 605.023 252.71 606.588 252.072 607.65C251.433 608.713 249.962 609.28 247.89 609.158C245.845 609.038 243.355 608.246 240.925 606.786C238.495 605.326 236.626 603.499 235.56 601.75C234.48 599.977 234.29 598.412 234.928 597.35C235.567 596.287 237.038 595.72 239.11 595.842C241.155 595.962 243.645 596.754 246.075 598.214Z" stroke="#c8a86b"/>
  <path d="M256.25 589.234C258.678 587.943 261.147 587.333 263.16 587.37C265.192 587.407 266.638 588.092 267.249 589.241C267.86 590.39 267.619 591.972 266.514 593.678C265.419 595.367 263.533 597.073 261.104 598.365C258.676 599.656 256.207 600.265 254.194 600.229C252.161 600.191 250.714 599.507 250.103 598.358C249.492 597.208 249.734 595.626 250.84 593.92C251.935 592.231 253.821 590.526 256.25 589.234Z" stroke="#c8a86b"/>
</g>

<line x1="400" y1="116.5" x2="484" y2="116.5" stroke="#c8a86b"/>
<path d="M382.047 517.5C382.123 517.5 382.281 517.515 382.391 517.563C382.492 517.607 382.584 517.666 382.687 517.71C382.797 517.757 382.886 517.837 382.995 517.897C383.11 517.96 383.196 518.088 383.275 518.167C383.355 518.247 383.458 518.31 383.55 518.382C383.645 518.456 383.709 518.592 383.788 518.686C383.877 518.791 383.959 518.875 384.009 518.984C384.057 519.089 384.15 519.173 384.214 519.298C384.268 519.406 384.329 519.507 384.4 519.604C384.477 519.708 384.484 519.845 384.526 519.968C384.564 520.091 384.588 520.179 384.592 520.242C384.595 520.274 384.603 520.306 384.611 520.362" stroke="#c8a86b" stroke-linecap="round"/>


<g id="aero-lb1-d" class="interactive-group">
  <rect x="252.5" y="117.5" width="24" height="6" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-a" class="interactive-group">
  <line x1="223" y1="118.5" x2="251" y2="118.5" stroke="#c8a86b"/>
  <line x1="250.5" y1="119" x2="250.5" y2="117" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-b" class="interactive-group">
  <path d="M229.5 151.5C229.715 151.5 230.045 151.669 230.44 152.29C230.82 152.887 231.182 153.784 231.492 154.938C232.111 157.237 232.5 160.441 232.5 164C232.5 167.559 232.111 170.763 231.492 173.062C231.182 174.216 230.82 175.113 230.44 175.71C230.045 176.331 229.715 176.5 229.5 176.5C229.285 176.5 228.955 176.331 228.56 175.71C228.18 175.113 227.818 174.216 227.508 173.062C226.889 170.763 226.5 167.559 226.5 164C226.5 160.441 226.889 157.237 227.508 154.938C227.818 153.784 228.18 152.887 228.56 152.29C228.955 151.669 229.285 151.5 229.5 151.5Z" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-e" class="interactive-group">
  <path d="M229.5 186.5C229.581 186.5 229.702 186.535 229.869 186.686C230.039 186.839 230.227 187.089 230.421 187.453C230.809 188.18 231.175 189.267 231.487 190.65C232.11 193.41 232.5 197.246 232.5 201.5C232.5 205.754 232.11 209.59 231.487 212.35C231.175 213.733 230.809 214.82 230.421 215.547C230.227 215.911 230.039 216.161 229.869 216.314C229.702 216.465 229.581 216.5 229.5 216.5C229.419 216.5 229.298 216.465 229.131 216.314C228.961 216.161 228.773 215.911 228.579 215.547C228.191 214.82 227.825 213.733 227.513 212.35C226.89 209.59 226.5 205.754 226.5 201.5C226.5 197.246 226.89 193.41 227.513 190.65C227.825 189.267 228.191 188.18 228.579 187.453C228.773 187.089 228.961 186.839 229.131 186.686C229.298 186.535 229.419 186.5 229.5 186.5Z" stroke="#c8a86b"/>
</g>


<g id="aqua-lb2-i" class="interactive-group">
  <path d="M259.501 275.968C259.501 275.968 268.5 244.968 259.501 261C250.502 277.032 261.501 244.968 261.501 244.968" stroke="#c8a86b"/>
</g>  

<g id="aqua-lb2-h" class="interactive-group">  
  <rect x="227.5" y="241.5" width="5" height="30" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-o" class="interactive-group">
  <path d="M251.5 416.5C258.109 416.5 263.5 422.078 263.5 429C263.5 435.922 258.109 441.5 251.5 441.5C244.891 441.5 239.5 435.922 239.5 429C239.5 422.078 244.891 416.5 251.5 416.5Z" stroke="#c8a86b"/>
</g>

<g id="aqua-lb2-p" class="interactive-group">
  <path d="M265.49 438.098C254.064 442.204 254.197 445.58 262.49 453.098" stroke="#c8a86b"/>
</g>

<g id="aero-l2-b" class="interactive-group">
  <rect x="243.5" y="621.5" width="13" height="8" stroke="#c8a86b"/>
</g>


<g id="aero-l2-ad" class="interactive-group">
  <rect x="265.5" y="612.5" width="4" height="27" stroke="#c8a86b"/>
</g>

<g id="aero-e-aqua-v" class="interactive-group">
  <path d="M283 639.5C283 639.5 305.5 657.5 316.5 642.5C327.5 627.5 350 639.5 350 639.5" stroke="#c8a86b"/>
  <path d="M282 645.544C282 645.544 304.5 663.544 315.5 648.544C326.5 633.544 349 645.544 349 645.544" stroke="#c8a86b"/>
  <path d="M349 639C355.418 640.404 355.911 647.89 349 645.551" stroke="#c8a86b"/>
  <path d="M283.147 639.407C278.477 635.698 274.741 639.819 283.147 646" stroke="#c8a86b"/>
</g>

<line x1="127" y1="286.5" x2="122" y2="286.5" stroke="#c8a86b"/>
<line x1="122.5" y1="286" x2="122.5" y2="293" stroke="#c8a86b"/>

<g id="aero-l2-g" class="interactive-group">
  <rect x="126.5" y="355.5" width="9" height="26" stroke="#c8a86b"/>
  <rect x="364.5" y="241.5" width="9" height="26" stroke="#c8a86b"/>
  <rect x="364.5" y="355.5" width="9" height="26" stroke="#c8a86b"/>
  <rect x="121.5" y="565.5" width="9" height="26" stroke="#c8a86b"/>
</g>

<g id="aero-l2-f" class="interactive-group">
  <rect x="142.5" y="692.5" width="23" height="10" stroke="#c8a86b"/>
  <rect x="333.5" y="692.5" width="23" height="10" stroke="#c8a86b"/>
</g>
          
            </svg>

            

          </div>
        </div>

        <div
          ref={listRef}
          className="masterplan-list"
          style={{
            height: '100%',
            overflowY: 'auto',
            paddingRight: '0.5rem',
            scrollbarWidth: 'thin',
          }}
        >
          {facilityData.map((block, bi) => (
            <div key={bi} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.6rem', fontWeight: 300,
                color: '#c8a86b',
                letterSpacing: '0.12em',
                marginBottom: '0.8rem',
                marginTop: bi > 0 ? '2rem' : 0,
              }}>{block.title}</h3>

              {block.sections.map((sec, si) => (
                <div key={si} style={{ marginBottom: '1.5rem' }}>
                  <p style={{
                    fontSize: '0.58rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,168,107,0.5)',
                    marginBottom: '0.5rem',
                    paddingLeft: '1rem',
                  }}>{sec.level}</p>

                  <ul style={{ padding: 0, margin: 0 }}>
                    {sec.items.map((item, ii) => (
                      <li
                        key={ii}
                        className="facility-item"
                        data-target={item.id}
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}