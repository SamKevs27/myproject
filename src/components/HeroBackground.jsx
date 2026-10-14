import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'

const COLS = 64 // vertices across
const ROWS = 30 // vertices from near to far
const X_SPAN = 6 // world units either side of centre
const Z_NEAR = 1
const Z_FAR = 10
const CAMERA_HEIGHT = 1
const HORIZON = 0.24 // horizon line as a share of the hero's height
const CURSOR_REACH = 190 // px around the cursor where the water lifts
const CREST = 0.2 // world height above which a vertex counts as a lit crest
const SWELL = 1.6 // overall wave height

// Sea swell: a few overlapping waves travelling at different angles and speeds.
function waveHeight(x, z, t) {
  return SWELL * (
    Math.sin(x * 0.9 + t * 1.1) * 0.09
    + Math.sin(z * 1.3 - t * 1.6) * 0.11
    + Math.sin((x * 0.6 + z) * 1.7 + t * 0.9) * 0.06
    + Math.sin((x - z * 0.5) * 2.6 - t * 2.2) * 0.025
  )
}

/**
 * Wave mesh behind the hero: a perspective grid of dots joined by row, column
 * and diagonal lines, rolling like a sea swell. The water lifts toward the
 * cursor, and a click drops a ripple that spreads across the surface.
 */
export default function HeroBackground({ heroRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = heroRef.current
    if (!canvas || !hero) return undefined
    const ctx = canvas.getContext('2d')
    const reduceMotion = prefersReducedMotion()

    let width = 0
    let height = 0
    let raf = 0
    let onScreen = true
    let lastFrame = 0
    let time = 0

    const pointer = { x: 0, y: 0, last: -Infinity }
    const cursor = { x: 0, y: 0, strength: 0 }
    const ripples = []

    // Flat arrays per vertex: world position, screen position, glow.
    const n = COLS * ROWS
    const wx = new Float32Array(n)
    const wz = new Float32Array(n)
    const sx = new Float32Array(n)
    const sy = new Float32Array(n)
    const glow = new Float32Array(n)
    for (let r = 0; r < ROWS; r++) {
      const z = Z_NEAR + ((Z_FAR - Z_NEAR) * r) / (ROWS - 1)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c
        wx[i] = -X_SPAN + (2 * X_SPAN * c) / (COLS - 1)
        wz[i] = z
      }
    }

    const build = () => {
      const rect = hero.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const project = (i, y, focal, horizonY) => {
      sx[i] = width / 2 + (wx[i] / wz[i]) * focal
      sy[i] = horizonY + ((CAMERA_HEIGHT - y) / wz[i]) * focal
    }

    const step = () => {
      time += 1 / 60
      const live = performance.now() - pointer.last < 2000
      cursor.x += (pointer.x - cursor.x) * 0.2
      cursor.y += (pointer.y - cursor.y) * 0.2
      cursor.strength += ((live ? 1 : 0) - cursor.strength) * 0.05
      for (const rp of ripples) {
        rp.r += 0.07
        rp.life *= 0.985
      }
      while (ripples.length && ripples[0].life < 0.03) ripples.shift()

      const focal = Math.max(width, height) * 0.5
      const horizonY = height * HORIZON
      for (let i = 0; i < n; i++) {
        let y = waveHeight(wx[i], wz[i], time)
        for (const rp of ripples) {
          const band = Math.abs(Math.hypot(wx[i] - rp.x, wz[i] - rp.z) - rp.r)
          if (band < 0.6) y += Math.cos((band / 0.6) * (Math.PI / 2)) * 0.32 * rp.life
        }
        project(i, y, focal, horizonY)
        let g = Math.max(0, (y - CREST) / 0.15)
        if (cursor.strength > 0.01) {
          const d = Math.hypot(sx[i] - cursor.x, sy[i] - cursor.y)
          if (d < CURSOR_REACH) {
            const k = (1 - d / CURSOR_REACH) ** 2 * cursor.strength
            y += k * 0.45
            project(i, y, focal, horizonY)
            g = Math.max(g, k * 1.4)
          }
        }
        glow[i] = Math.min(1, g)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'

      // far rows first; depth fades both lines and dots
      for (let r = ROWS - 1; r >= 0; r--) {
        const depth = 1 - r / (ROWS - 1)
        const lineAlpha = 0.05 + depth * 0.28
        ctx.strokeStyle = `rgba(150, 110, 250, ${lineAlpha})`
        ctx.lineWidth = 0.5 + depth * 0.7
        ctx.beginPath()
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c
          if (c < COLS - 1) { ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[i + 1], sy[i + 1]) }
          if (r > 0) {
            const below = i - COLS
            ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[below], sy[below])
            if (c < COLS - 1) { ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[below + 1], sy[below + 1]) }
          }
        }
        ctx.stroke()

        ctx.fillStyle = `rgba(214, 199, 255, ${0.15 + depth * 0.6})`
        ctx.beginPath()
        const radius = 0.6 + depth * 1.3
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c
          ctx.moveTo(sx[i] + radius, sy[i])
          ctx.arc(sx[i], sy[i], radius, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      // lit crests and the water lifted by the cursor
      ctx.strokeStyle = 'rgba(214, 199, 255, 0.55)'
      ctx.lineWidth = 1.1
      ctx.beginPath()
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const i = r * COLS + c
          if (glow[i] > 0.35 && glow[i + 1] > 0.35) { ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[i + 1], sy[i + 1]) }
          if (r > 0 && glow[i] > 0.35 && glow[i - COLS] > 0.35) { ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[i - COLS], sy[i - COLS]) }
        }
      }
      ctx.stroke()
      ctx.fillStyle = 'rgba(243, 240, 249, 0.95)'
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        if (glow[i] < 0.35) continue
        const radius = 1.2 + glow[i] * 1.6 * (1 - Math.floor(i / COLS) / ROWS)
        ctx.moveTo(sx[i] + radius, sy[i])
        ctx.arc(sx[i], sy[i], radius, 0, Math.PI * 2)
      }
      ctx.fill()
    }

    const frame = (now) => {
      raf = 0
      if (!onScreen || document.hidden) return
      // fixed 60 Hz steps so high-refresh screens don't run faster
      const steps = lastFrame ? Math.min(3, Math.max(1, Math.round((now - lastFrame) / 16.7))) : 1
      lastFrame = now
      for (let i = 0; i < steps; i++) step()
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (reduceMotion || raf || !onScreen || document.hidden) return
      lastFrame = 0
      raf = requestAnimationFrame(frame)
    }

    const local = (e) => {
      const rect = hero.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (e) => {
      const p = local(e)
      if (cursor.strength < 0.02) {
        cursor.x = p.x
        cursor.y = p.y
      }
      pointer.x = p.x
      pointer.y = p.y
      pointer.last = performance.now()
    }
    const onLeave = () => { pointer.last = -Infinity }
    // A click drops a ripple at the nearest point on the water.
    const onDown = (e) => {
      const p = local(e)
      let best = -1
      let bestDist = Infinity
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(sx[i] - p.x, sy[i] - p.y)
        if (d < bestDist) { bestDist = d; best = i }
      }
      if (best >= 0 && bestDist < 120) ripples.push({ x: wx[best], z: wz[best], r: 0, life: 1 })
      onMove(e)
    }

    build()
    step()
    if (reduceMotion) {
      draw()
      const ro = new ResizeObserver(() => { build(); step(); draw() })
      ro.observe(hero)
      return () => ro.disconnect()
    }

    const ro = new ResizeObserver(build)
    ro.observe(hero)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      start()
    })
    io.observe(hero)
    const onVisibility = () => start()
    document.addEventListener('visibilitychange', onVisibility)
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    hero.addEventListener('pointerdown', onDown)
    start()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      hero.removeEventListener('pointerdown', onDown)
    }
  }, [heroRef])

  return <canvas ref={canvasRef} className="hero-bg" aria-hidden="true" />
}
