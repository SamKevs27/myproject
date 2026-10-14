import { useEffect, useRef } from 'react'
import HeroBackground from '../components/HeroBackground'
import { prefersReducedMotion } from '../hooks/useInView'
import { createScene } from '../journey/scene'

/* Signature full-screen backgrounds for each view on the chooser. */

// Formal: white paper with the name set huge and faint behind everything.
export function FormalStage({ name }) {
  return (
    <div className="st st-formal" aria-hidden="true">
      <p className="st-formal-mark">{name.split(' ')[0]}</p>
    </div>
  )
}

// Fun: the neon wave sea, scanlines and a couple of signal glitches.
export function FunStage() {
  const ref = useRef(null)
  return (
    <div className="st st-fun" ref={ref} aria-hidden="true">
      <HeroBackground heroRef={ref} />
      <span className="st-fun-sign">サミュエル</span>
      <span className="st-fun-bar st-fun-bar-a" />
      <span className="st-fun-bar st-fun-bar-b" />
    </div>
  )
}

const PERIOD = 900 // the props repeat every this many world px

// Props for the stretch of level around the camera, repeating forever.
function worldAround(cam) {
  const blocks = []
  const platforms = []
  let chestX = -1e6
  let samX = -1e6
  for (const k of [-1, 0, 1]) {
    const base = Math.floor(cam / PERIOD) * PERIOD + k * PERIOD
    for (let i = 0; i < 3; i++) blocks.push({ id: `b${k}-${i}`, x: base + 360 + i * 40 })
    platforms.push({ x1: base + 700, x2: base + 748, top: 32 })
    if (Math.abs(base + 560 - cam) < Math.abs(chestX - cam)) chestX = base + 560
    if (Math.abs(base + 160 - cam) < Math.abs(samX - cam)) samX = base + 160
  }
  return { blocks, platforms, chest: { x: chestX }, sam: { x: samX }, castle: { x: -1e6 } }
}

// Journey: the 8-bit jungle scrolling by while the hero walks along.
export function JourneyStage() {
  const stageRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return undefined
    const ctx = canvas.getContext('2d')
    const scene = createScene(ctx)
    const reduced = prefersReducedMotion()
    const state = {
      time: 0,
      camX: 120,
      player: { x: 120, h: 0, facing: 1, walking: !reduced, walkFrame: 0, airborne: false },
      sam: { facing: -1, blink: false, breathe: false },
      blocks: {},
      flags: [0, 0, 0],
      castleRaise: 0,
      chestOpen: false,
      chestGlow: 0,
      dust: [],
    }

    const resize = () => {
      const vw = stage.clientWidth
      const vh = stage.clientHeight
      let scale = Math.max(2, Math.floor(vh / 216))
      if (vw < 640) scale = Math.min(scale, 3)
      const W = Math.ceil(vw / scale)
      const H = Math.ceil(vh / scale)
      canvas.width = W
      canvas.height = H
      canvas.style.width = `${W * scale}px`
      canvas.style.height = `${H * scale}px`
      scene.resize(W, H, Math.max(36, Math.round(H * 0.2)))
      scene.draw(state, worldAround(state.camX))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    if (reduced) return () => ro.disconnect()

    let raf = 0
    let last = 0
    const frame = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      state.time += dt
      state.camX += 38 * dt
      state.player.x = state.camX
      state.player.walkFrame = Math.floor(state.camX / 5)
      state.sam.breathe = Math.floor(state.time * 1.3) % 2 === 1
      scene.draw(state, worldAround(state.camX))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="st st-journey" ref={stageRef} aria-hidden="true">
      <canvas ref={canvasRef} className="st-journey-canvas" />
    </div>
  )
}
