import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'
import { useIsFormal } from '../context/ViewMode'
import { COLORS, rgba } from '../theme'

const TAU = Math.PI * 2
const rand = (a = 0, b = 1) => a + Math.random() * (b - a)

/* Each scene gets the 2D context and returns { resize(w, h), frame(t, pointer),
   down?(x, y) }. `pointer` is { x, y, active, moved } in section coordinates. */

// About: a drifting neural network; nodes lean toward the cursor and link to it.
function network(ctx) {
  let w = 0
  let h = 0
  let nodes = []
  const LINK = 140
  return {
    resize(W, H) {
      w = W
      h = H
      const count = Math.round(Math.min(110, (W * H) / 11000))
      nodes = Array.from({ length: count }, () => ({ x: rand(0, W), y: rand(0, H), vx: rand(-0.25, 0.25), vy: rand(-0.25, 0.25) }))
    },
    frame(t, p) {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        if (p.active) {
          const dx = p.x - n.x
          const dy = p.y - n.y
          const d = Math.hypot(dx, dy) || 1
          if (d < 240) {
            n.vx += (dx / d) * 0.012
            n.vy += (dy / d) * 0.012
          }
        }
        const speed = Math.hypot(n.vx, n.vy)
        if (speed > 0.7) {
          n.vx *= 0.7 / speed
          n.vy *= 0.7 / speed
        }
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }
      // links batched into a few brightness levels
      const levels = [[], [], [], []]
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
          if (d < LINK) levels[Math.min(3, Math.floor((1 - d / LINK) * 4))].push(nodes[i], nodes[j])
        }
      }
      levels.forEach((list, k) => {
        ctx.strokeStyle = rgba(COLORS.violet, 0.07 + k * 0.07)
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < list.length; i += 2) {
          ctx.moveTo(list[i].x, list[i].y)
          ctx.lineTo(list[i + 1].x, list[i + 1].y)
        }
        ctx.stroke()
      })
      if (p.active) {
        for (const n of nodes) {
          const d = Math.hypot(n.x - p.x, n.y - p.y)
          if (d < 200) {
            ctx.strokeStyle = rgba(COLORS.pink, (1 - d / 200) * 0.6)
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(n.x, n.y)
            ctx.stroke()
          }
        }
      }
      ctx.fillStyle = rgba(COLORS.cyan, 0.6)
      ctx.beginPath()
      for (const n of nodes) {
        ctx.moveTo(n.x + 1.8, n.y)
        ctx.arc(n.x, n.y, 1.8, 0, TAU)
      }
      ctx.fill()
    },
  }
}

// Skills: a field of code symbols that flicker; a light wave passes through,
// and symbols near the cursor scramble and glow.
function codeField(ctx) {
  const CHARS = '{}<>/=;()[]01+*#'
  const CELL = 34
  let w = 0
  let h = 0
  let cells = []
  const pick = () => CHARS[Math.floor(Math.random() * CHARS.length)]
  return {
    fps: 30,
    resize(W, H) {
      w = W
      h = H
      cells = []
      for (let y = CELL / 2; y < H; y += CELL) {
        for (let x = CELL / 2; x < W; x += CELL) cells.push({ x, y, ch: pick(), glow: 0 })
      }
    },
    frame(t, p) {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < 8; i++) {
        const c = cells[Math.floor(Math.random() * cells.length)]
        if (c) c.ch = pick()
      }
      ctx.font = '600 13px "Instrument Sans", system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const wave = Array.from({ length: 6 }, () => [])
      const touched = Array.from({ length: 6 }, () => [])
      for (const c of cells) {
        if (p.active) {
          const d = Math.hypot(c.x - p.x, c.y - p.y)
          if (d < 150) {
            c.glow = Math.max(c.glow, 1 - d / 150)
            if (Math.random() < 0.3) c.ch = pick()
          }
        }
        c.glow *= 0.92
        const sweep = Math.max(0, Math.sin((c.x + c.y) * 0.004 - t * 1.1) - 0.9) * 4.5
        if (c.glow > sweep) touched[Math.min(5, Math.floor(c.glow * 6))].push(c)
        else wave[Math.min(5, Math.floor(sweep * 6))].push(c)
      }
      // resting symbols are violet, the passing wave cyan, the cursor pink
      const paint = (buckets, color) => buckets.forEach((list, k) => {
        ctx.fillStyle = k === 0 ? rgba(COLORS.violet, 0.09) : rgba(color, 0.1 + k * 0.11)
        for (const c of list) ctx.fillText(c.ch, c.x, c.y)
      })
      paint(wave, COLORS.cyan)
      paint(touched, COLORS.pink)
    },
  }
}

// Projects: a slowly panning blueprint grid with a scan line; the cursor gets
// a crosshair with live coordinates.
function blueprint(ctx) {
  const CELL = 48
  let w = 0
  let h = 0
  return {
    resize(W, H) { w = W; h = H },
    frame(t, p) {
      ctx.clearRect(0, 0, w, h)
      const off = (t * 8) % (CELL * 4)
      for (const major of [false, true]) {
        ctx.strokeStyle = major ? rgba(COLORS.cyan, 0.1) : rgba(COLORS.cyan, 0.04)
        ctx.lineWidth = 1
        ctx.beginPath()
        let i = 0
        for (let x = -CELL * 4 + off; x < w; x += CELL, i++) {
          if ((i % 4 === 0) !== major) continue
          ctx.moveTo(Math.round(x) + 0.5, 0)
          ctx.lineTo(Math.round(x) + 0.5, h)
        }
        i = 0
        for (let y = -CELL * 4 + off; y < h; y += CELL, i++) {
          if ((i % 4 === 0) !== major) continue
          ctx.moveTo(0, Math.round(y) + 0.5)
          ctx.lineTo(w, Math.round(y) + 0.5)
        }
        ctx.stroke()
      }
      // scan line sweeping down every 7 s
      const sy = ((t % 7) / 7) * (h + 240) - 120
      const band = ctx.createLinearGradient(0, sy - 120, 0, sy)
      band.addColorStop(0, rgba(COLORS.cyan, 0))
      band.addColorStop(1, rgba(COLORS.cyan, 0.08))
      ctx.fillStyle = band
      ctx.fillRect(0, sy - 120, w, 120)
      ctx.fillStyle = rgba(COLORS.cyan, 0.4)
      ctx.fillRect(0, sy, w, 1)

      if (p.active) {
        ctx.strokeStyle = rgba(COLORS.pink, 0.28)
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.moveTo(0, p.y + 0.5)
        ctx.lineTo(w, p.y + 0.5)
        ctx.moveTo(p.x + 0.5, 0)
        ctx.lineTo(p.x + 0.5, h)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.strokeStyle = rgba(COLORS.pink, 0.75)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 16, 0, TAU)
        ctx.stroke()
        ctx.font = '500 11px "Instrument Sans", system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.fillStyle = rgba(COLORS.pink, 0.85)
        ctx.fillText(`${Math.round(p.x)}, ${Math.round(p.y)}`, p.x + 22, p.y - 12)
      }
    },
  }
}

// Experience: streaks rising along vertical lanes like time passing; streaks
// near the cursor rush and glow.
function stream(ctx) {
  const LANE = 36
  let w = 0
  let h = 0
  let streaks = []
  const reset = (s, anywhere) => {
    s.y = anywhere ? rand(0, h) : h + rand(0, 80)
    s.speed = rand(0.25, 1.3)
    s.len = rand(20, 80)
    s.pink = Math.random() < 0.3
  }
  return {
    resize(W, H) {
      w = W
      h = H
      streaks = []
      for (let x = LANE / 2; x < W; x += LANE) {
        for (let k = 0; k < 2; k++) {
          const s = { x }
          reset(s, true)
          streaks.push(s)
        }
      }
    },
    frame(t, p) {
      ctx.clearRect(0, 0, w, h)
      const dim = []
      const dimPink = []
      const bright = []
      for (const s of streaks) {
        let boost = 1
        if (p.active && Math.abs(s.x - p.x) < 90 && Math.abs(s.y - p.y) < 200) {
          boost = 4 * (1 - Math.abs(s.x - p.x) / 90) + 1
        }
        s.y -= s.speed * boost
        if (s.y + s.len < 0) reset(s, false)
        if (boost > 2) bright.push(s)
        else (s.pink ? dimPink : dim).push(s)
      }
      const strokeAll = (list, color, width) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        for (const s of list) {
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x, s.y + s.len)
        }
        ctx.stroke()
      }
      ctx.lineCap = 'round'
      strokeAll(dim, rgba(COLORS.violet, 0.22), 1)
      strokeAll(dimPink, rgba(COLORS.pink, 0.18), 1)
      strokeAll(bright, rgba(COLORS.cyan, 0.7), 1.5)
      ctx.fillStyle = rgba(COLORS.white, 0.5)
      ctx.beginPath()
      for (const s of [...dim, ...dimPink, ...bright]) {
        ctx.moveTo(s.x + 1.4, s.y)
        ctx.arc(s.x, s.y, 1.4, 0, TAU)
      }
      ctx.fill()
    },
  }
}

// Contact: signal rings broadcast from the open space; moving the cursor sends
// small rings and a click sends a strong pulse.
function signal(ctx) {
  let w = 0
  let h = 0
  let rings = []
  let lastEmit = 0
  let lastSmall = 0
  let emitted = 0
  const source = () => (w < 700 ? [w * 0.5, h * 0.92] : [w * 0.78, h * 0.5])
  return {
    resize(W, H) { w = W; h = H },
    down(x, y) { rings.push({ x, y, r: 0, max: Math.max(w, h) * 0.6, speed: 4, alpha: 0.7, color: COLORS.pink }) },
    frame(t, p) {
      ctx.clearRect(0, 0, w, h)
      const [sx, sy] = source()
      if (t - lastEmit > 1.4) {
        lastEmit = t
        emitted++
        rings.push({ x: sx, y: sy, r: 0, max: Math.hypot(w, h) * 0.75, speed: 1.6, alpha: 0.32, color: emitted % 2 ? COLORS.cyan : COLORS.violet })
      }
      if (p.active && p.moved && t - lastSmall > 0.22) {
        lastSmall = t
        rings.push({ x: p.x, y: p.y, r: 0, max: 160, speed: 2.2, alpha: 0.55, color: COLORS.pink })
      }
      ctx.lineWidth = 1.2
      for (const ring of rings) {
        ring.r += ring.speed
        const life = 1 - ring.r / ring.max
        ctx.strokeStyle = rgba(ring.color, Math.max(0, life) * ring.alpha)
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.r, 0, TAU)
        ctx.stroke()
      }
      rings = rings.filter((ring) => ring.r < ring.max)
      // the transmitter
      const pulse = 0.5 + 0.5 * Math.sin(t * 4)
      ctx.fillStyle = rgba(COLORS.pink, 0.25 + pulse * 0.25)
      ctx.beginPath()
      ctx.arc(sx, sy, 10 + pulse * 6, 0, TAU)
      ctx.fill()
      ctx.fillStyle = rgba(COLORS.white, 0.9)
      ctx.beginPath()
      ctx.arc(sx, sy, 3.5, 0, TAU)
      ctx.fill()
    },
  }
}

const SCENES = { network, codeField, blueprint, stream, signal }

/**
 * A themed, interactive canvas behind a section's content. Runs only while the
 * section is on screen; reduced motion gets a single still frame.
 */
function SectionBackgroundCanvas({ variant }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const make = SCENES[variant]
    if (!canvas || !host || !make) return undefined
    const ctx = canvas.getContext('2d')
    const scene = make(ctx)
    const reduceMotion = prefersReducedMotion()
    const frameGap = 1000 / (scene.fps || 60)

    let raf = 0
    let onScreen = false
    let lastDraw = 0
    let t = 0
    const pointer = { x: 0, y: 0, active: false, moved: false, last: -Infinity }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene.resize(rect.width, rect.height)
      if (reduceMotion) scene.frame(2, pointer)
    }

    const frame = (now) => {
      raf = 0
      if (!onScreen || document.hidden) return
      if (now - lastDraw >= frameGap - 2) {
        const dt = lastDraw ? Math.min(0.1, (now - lastDraw) / 1000) : 1 / 60
        lastDraw = now
        t += dt
        pointer.active = now - pointer.last < 2000
        scene.frame(t, pointer)
        pointer.moved = false
      }
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (reduceMotion || raf || !onScreen || document.hidden) return
      lastDraw = 0
      raf = requestAnimationFrame(frame)
    }

    const local = (e) => {
      const rect = host.getBoundingClientRect()
      return [e.clientX - rect.left, e.clientY - rect.top]
    }
    const onMove = (e) => {
      ;[pointer.x, pointer.y] = local(e)
      pointer.moved = true
      pointer.last = performance.now()
    }
    const onLeave = () => { pointer.last = -Infinity }
    const onDown = (e) => {
      const [x, y] = local(e)
      scene.down?.(x, y)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(host)
    if (reduceMotion) return () => ro.disconnect()

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      start()
    })
    io.observe(host)
    const onVisibility = () => start()
    document.addEventListener('visibilitychange', onVisibility)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointerdown', onDown)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
    }
  }, [variant])

  return <canvas ref={canvasRef} className="section-bg" aria-hidden="true" />
}

// The formal view keeps the layout but drops the animated backgrounds.
export default function SectionBackground(props) {
  return useIsFormal() ? null : <SectionBackgroundCanvas {...props} />
}
