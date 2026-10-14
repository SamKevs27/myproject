import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'

const SPACING = 34 // px between grid dots
const REACH = 170 // px around the tracked ball that dots react to
const TRAIL_MS = 650 // how long the motion trail lingers
const IDLE_MS = 2500 // after this long without the pointer, the autopilot takes over
const GLOW_BUCKETS = 8 // dots are batched by brightness so each frame draws only a few paths

/**
 * Full-screen motion-capture floor: a grid of dots that springs away from a
 * glowing ball following the cursor, with a fading motion trail. Clicks send a
 * ripple through the grid; with no pointer around, the ball drifts in a slow
 * figure-eight on its own.
 */
export default function DotField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduceMotion = prefersReducedMotion()

    let width = 0
    let height = 0
    let dots = []
    let raf = 0
    let last = 0

    const pointer = { x: 0, y: 0, last: -Infinity }
    const ball = { x: 0, y: 0, strength: 0.4 }
    const trail = []
    const ripples = []

    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cols = Math.ceil(width / SPACING) + 1
      const rows = Math.ceil(height / SPACING) + 1
      const ox = (width - (cols - 1) * SPACING) / 2
      const oy = (height - (rows - 1) * SPACING) / 2
      dots = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * SPACING
          const y = oy + r * SPACING
          dots.push({ bx: x, by: y, x, y, vx: 0, vy: 0, glow: 0 })
        }
      }
      if (!ball.x) {
        ball.x = width / 2
        ball.y = height / 2
      }
    }

    const step = (now) => {
      const t = now / 1000
      const live = now - pointer.last < IDLE_MS
      // autopilot: a slow figure-eight
      const tx = live ? pointer.x : width * (0.5 + 0.34 * Math.sin(t * 0.42))
      const ty = live ? pointer.y : height * (0.45 + 0.22 * Math.sin(t * 0.84 + 1.2))
      const follow = live ? 0.32 : 0.035
      ball.x += (tx - ball.x) * follow
      ball.y += (ty - ball.y) * follow
      ball.strength += ((live ? 1 : 0.45) - ball.strength) * 0.05

      trail.push({ x: ball.x, y: ball.y, at: now })
      while (trail.length && now - trail[0].at > TRAIL_MS) trail.shift()

      for (const rp of ripples) {
        rp.r += 9
        rp.life -= 0.014
      }
      while (ripples.length && ripples[0].life <= 0) ripples.shift()

      for (const d of dots) {
        const dx = d.bx - ball.x
        const dy = d.by - ball.y
        const dist = Math.hypot(dx, dy) || 1
        let near = 0
        if (dist < REACH) {
          near = 1 - dist / REACH
          const push = near * near * 3.2 * ball.strength
          d.vx += (dx / dist) * push
          d.vy += (dy / dist) * push
        }
        for (const rp of ripples) {
          const rx = d.bx - rp.x
          const ry = d.by - rp.y
          const rd = Math.hypot(rx, ry) || 1
          const band = Math.abs(rd - rp.r)
          if (band < 46) {
            const push = (1 - band / 46) * rp.life * 2.4
            d.vx += (rx / rd) * push
            d.vy += (ry / rd) * push
          }
        }
        d.vx = (d.vx + (d.bx - d.x) * 0.07) * 0.82
        d.vy = (d.vy + (d.by - d.y) * 0.07) * 0.82
        d.x += d.vx
        d.y += d.vy
        d.glow = Math.min(1, Math.hypot(d.x - d.bx, d.y - d.by) / 16 + near * 0.55 * ball.strength)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const buckets = Array.from({ length: GLOW_BUCKETS }, () => [])
      for (const d of dots) buckets[Math.min(GLOW_BUCKETS - 1, Math.floor(d.glow * GLOW_BUCKETS))].push(d)
      buckets.forEach((list, i) => {
        if (!list.length) return
        const g = i / (GLOW_BUCKETS - 1)
        const radius = 1 + g * 1.7
        ctx.fillStyle = `rgba(${Math.round(183 + g * 60)}, ${Math.round(156 + g * 84)}, 255, ${0.16 + g * 0.8})`
        ctx.beginPath()
        for (const d of list) {
          ctx.moveTo(d.x + radius, d.y)
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2)
        }
        ctx.fill()
      })

      for (const rp of ripples) {
        ctx.strokeStyle = `rgba(139, 92, 246, ${rp.life * 0.4})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // motion trail: thin and faint at the tail, bright at the head
      ctx.lineCap = 'round'
      for (let i = 1; i < trail.length; i++) {
        const k = i / trail.length
        ctx.strokeStyle = `rgba(183, 156, 255, ${k * 0.75 * ball.strength})`
        ctx.lineWidth = 0.5 + k * 2.5
        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.stroke()
      }

      // the ball itself
      const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, 60)
      glow.addColorStop(0, `rgba(139, 92, 246, ${0.35 * ball.strength})`)
      glow.addColorStop(1, 'rgba(139, 92, 246, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(ball.x - 60, ball.y - 60, 120, 120)
      ctx.fillStyle = `rgba(243, 240, 249, ${0.9 * ball.strength})`
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    const frame = (now) => {
      raf = 0
      if (document.hidden) return
      const steps = last ? Math.min(3, Math.max(1, Math.round((now - last) / 16.7))) : 1
      last = now
      for (let i = 0; i < steps; i++) step(now)
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (reduceMotion || raf || document.hidden) return
      last = 0
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.last = performance.now()
    }
    const onLeave = () => { pointer.last = -Infinity }
    const onDown = (e) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 })
      onMove(e)
    }
    const onResize = () => {
      build()
      if (reduceMotion) draw()
    }

    build()
    if (reduceMotion) {
      draw()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', start)
    start()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', start)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
