import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uDistortion;
  uniform vec2 uMouse;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 dir = uv - uMouse;
    float dist = length(dir);
    float strength = uDistortion * smoothstep(0.5, 0.0, dist);
    uv += normalize(dir) * strength * -0.08;
    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`

export default function DistortImage({ src, style }) {
  const containerRef = useRef()
  const canvasRef = useRef()
  const stateRef = useRef({ distortion: 0, mouse: { x: 0.5, y: 0.5 } })

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const w = container.offsetWidth
    const h = container.offsetHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const texture = new THREE.TextureLoader().load(src)
    texture.minFilter = THREE.LinearFilter

    const uniforms = {
      uTexture: { value: texture },
      uDistortion: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    }

    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    scene.add(new THREE.Mesh(geo, mat))

    const onEnter = () => {
      gsap.to(stateRef.current, { distortion: 1, duration: 0.6, ease: 'power2.out' })
    }
    const onLeave = () => {
      gsap.to(stateRef.current, { distortion: 0, duration: 0.8, ease: 'power2.out' })
    }
    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      stateRef.current.mouse.x = (e.clientX - rect.left) / rect.width
      stateRef.current.mouse.y = 1 - (e.clientY - rect.top) / rect.height
    }

    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)
    container.addEventListener('mousemove', onMove)

    let animId
    const tick = () => {
      animId = requestAnimationFrame(tick)
      uniforms.uDistortion.value = stateRef.current.distortion
      uniforms.uMouse.value.x += (stateRef.current.mouse.x - uniforms.uMouse.value.x) * 0.08
      uniforms.uMouse.value.y += (stateRef.current.mouse.y - uniforms.uMouse.value.y) * 0.08
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(animId)
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
      container.removeEventListener('mousemove', onMove)
      
      geo.dispose()
      mat.dispose()
      texture.dispose() 
      renderer.dispose()
      renderer.forceContextLoss() 
    }
  }, [src])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%'
      }} />
    </div>
  )
}