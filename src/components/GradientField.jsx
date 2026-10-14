import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'
import './GradientField.css'

const SCALE = 10 // the canvas is 1/10th of the screen; stretching it blurs the blobs together
const BASE = '#9c9c9c'

// Soft monochrome blobs, each drifting on its own loop. The first is the big
// dark circle that roams the whole screen; the rest are white and greys.
// [r, g, b], radius (share of the longer screen side), path centre, path size, speeds, phase, alpha
const BLOBS = [
  { c: [0, 0, 0], r: 0.42, cx: 0.5, cy: 0.5, ax: 0.38, ay: 0.32, sx: 0.23, sy: 0.31, p: 0, a: 1 }, // the big dark circle
  { c: [255, 255, 255], r: 0.5, cx: 0.15, cy: 0.2, ax: 0.14, ay: 0.12, sx: 0.18, sy: 0.14, p: 1.7, a: 1 },
  { c: [255, 255, 255], r: 0.55, cx: 0.85, cy: 0.8, ax: 0.14, ay: 0.12, sx: 0.15, sy: 0.21, p: 3.1, a: 1 },
  { c: [40, 40, 40], r: 0.4, cx: 0.8, cy: 0.15, ax: 0.12, ay: 0.14, sx: 0.24, sy: 0.17, p: 4.4, a: 0.85 },
  { c: [255, 255, 255], r: 0.35, cx: 0.4, cy: 0.9, ax: 0.2, ay: 0.08, sx: 0.2, sy: 0.16, p: 2.4, a: 1 },
]

/**
 * A slowly moving monochrome gradient: a big dark circle roams the screen
 * among soft white and grey blobs, all melted together by a heavy blur.
 * The dark circle leans gently toward the cursor.
 */
export default function GradientField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduceMotion = prefersReducedMotion()
    let w = 0
    let h = 0
    let raf = 0
    const pointer = { x: 0.6, y: 0.4, tx: 0.6, ty: 0.4 }

    const resize = () => {
      w = Math.ceil(window.innerWidth / SCALE)
      h = Math.ceil(window.innerHeight / SCALE)
      canvas.width = w
      canvas.height = h
    }

    const draw = (time) => {
      const t = time / 1000
      const size = Math.max(w, h)
      ctx.fillStyle = BASE
      ctx.fillRect(0, 0, w, h)
      pointer.x += (pointer.tx - pointer.x) * 0.02
      pointer.y += (pointer.ty - pointer.y) * 0.02
      BLOBS.forEach((b, i) => {
        let x = (b.cx + Math.sin(t * b.sx + b.p) * b.ax) * w
        let y = (b.cy + Math.cos(t * b.sy + b.p) * b.ay) * h
        if (i === 0) {
          // the big circle leans toward the cursor
          x += (pointer.x * w - x) * 0.35
          y += (pointer.y * h - y) * 0.35
        }
        const r = b.r * size * (1 + Math.sin(t * 0.5 + b.p) * 0.1)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        const [cr, cg, cb] = b.c
        g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${b.a})`)
        g.addColorStop(0.55, `rgba(${cr}, ${cg}, ${cb}, ${b.a * 0.75})`)
        g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      })
    }

    const frame = (time) => {
      draw(time)
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      pointer.tx = e.clientX / window.innerWidth
      pointer.ty = e.clientY / window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduceMotion) {
      draw(12000)
      const redraw = () => draw(12000)
      window.addEventListener('resize', redraw)
      return () => {
        window.removeEventListener('resize', resize)
        window.removeEventListener('resize', redraw)
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="gf-canvas" />
      <span className="gf-grain" />
    </div>
  )
}
