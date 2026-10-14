import { useEffect, useRef } from 'react'
import { PALETTE as C } from '../journey/sprites/palette'

const PX = 3 // CSS pixels per twig pixel
const MARGIN = 20 // twig pixels the drawing extends beyond the card on each side
const GROW_SPEED = 85 // twig pixels of growth per second
const RETRACT_SPEED = 160

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/*
 * Branches start behind the card and grow outward. The part over the card is
 * hidden behind it, so they appear to sprout from behind. Some branches curl
 * back once outside and creep over the card's front edge; those points go on
 * the front canvas.
 */
function generate(w, h) {
  const rand = rng(7)
  const points = []
  const inCard = (x, y) => x >= MARGIN && x < MARGIN + w && y >= MARGIN && y < MARGIN + h

  const grow = (x, y, angle, length, depth, t0, curl, exited) => {
    let turned = 0
    for (let i = 0; i < length; i++) {
      angle += (rand() - 0.5) * 0.45
      if (exited && curl && Math.abs(turned) < Math.PI * 0.95) {
        angle += curl
        turned += curl
      }
      x += Math.cos(angle)
      y += Math.sin(angle)
      const inside = inCard(x, y)
      if (!inside) exited = true
      const t = t0 + i
      points.push({ x, y, t, kind: depth === 0 ? 'trunk' : 'twig', front: exited && inside })
      if (i % 3 === 1 && i > 2) {
        const side = (i / 3) % 2 < 1 ? 1 : -1
        const lx = x + Math.cos(angle + side * 1.57) * 2
        const ly = y + Math.sin(angle + side * 1.57) * 2
        points.push({ x: lx, y: ly, t: t + 3, kind: 'leaf', front: exited && inCard(lx, ly) })
      }
      if (depth < 2 && i === Math.floor(length * 0.5)) {
        const dir = rand() < 0.5 ? -1 : 1
        grow(x, y, angle + dir * (0.6 + rand() * 0.4), Math.floor(length * 0.55), depth + 1, t, 0, exited)
      }
    }
  }

  // roots: a little inside each edge, pointing out
  const roots = [
    [0.08, 0.14, Math.PI * 1.1, 1], [0.06, 0.4, Math.PI, -1], [0.07, 0.66, Math.PI, 1], [0.1, 0.9, Math.PI * 0.85, -1],
    [0.92, 0.12, -Math.PI * 0.1, -1], [0.94, 0.38, 0, 1], [0.93, 0.64, 0, -1], [0.9, 0.88, Math.PI * 0.15, 1],
    [0.22, 0.06, -Math.PI / 2, 1], [0.5, 0.05, -Math.PI / 2, -1], [0.78, 0.06, -Math.PI / 2, 1],
    [0.36, 0.95, Math.PI / 2, -1],
  ]
  roots.forEach(([fx, fy, angle, curlDir], i) => {
    const x = MARGIN + fx * w
    const y = MARGIN + fy * h
    const curl = i % 2 === 0 ? curlDir * 0.16 : 0 // every other branch creeps back over the front
    grow(x, y, angle + (rand() - 0.5) * 0.5, 38 + Math.floor(rand() * 14), 0, i * 2, curl, false)
  })
  return points
}

function drawPoints(ctx, points, progress, front) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const p of points) {
    if (p.front !== front || p.t > progress) continue
    const x = Math.round(p.x)
    const y = Math.round(p.y)
    if (p.kind === 'leaf') {
      ctx.fillStyle = C.green1
      ctx.fillRect(x - 1, y, 3, 2)
      ctx.fillStyle = C.green3
      ctx.fillRect(x, y - 1, 2, 2)
      ctx.fillStyle = C.green4
      ctx.fillRect(x, y - 1, 1, 1)
    } else {
      ctx.fillStyle = p.kind === 'trunk' ? C.brown1 : C.brown2
      ctx.fillRect(x, y, p.kind === 'trunk' ? 2 : 1, p.kind === 'trunk' ? 2 : 1)
    }
  }
}

/** Twigs and leaves that creep out from behind the card while `active`. */
export default function Twigs({ active }) {
  const backRef = useRef(null)
  const frontRef = useRef(null)
  const state = useRef({ points: [], progress: 0, max: 0, target: 0, raf: 0, last: 0, shown: -1 })

  // size the canvases to the card (+ margin) and generate the branches
  useEffect(() => {
    const back = backRef.current
    const front = frontRef.current
    const host = back?.parentElement
    if (!back || !front || !host) return undefined
    const setup = () => {
      const w = Math.round(host.clientWidth / PX)
      const h = Math.round(host.clientHeight / PX)
      for (const c of [back, front]) {
        c.width = w + MARGIN * 2
        c.height = h + MARGIN * 2
        c.style.width = `${c.width * PX}px`
        c.style.height = `${c.height * PX}px`
        c.style.left = `${-MARGIN * PX}px`
        c.style.top = `${-MARGIN * PX}px`
      }
      const s = state.current
      s.points = generate(w, h)
      s.max = Math.max(0, ...s.points.map((p) => p.t))
      s.shown = -1
    }
    setup()
    const ro = new ResizeObserver(setup)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  // grow toward full while active, retract when not
  useEffect(() => {
    const s = state.current
    const back = backRef.current?.getContext('2d')
    const front = frontRef.current?.getContext('2d')
    if (!back || !front) return undefined
    s.target = active ? s.max : 0
    cancelAnimationFrame(s.raf)
    s.last = 0
    const frame = (now) => {
      const dt = s.last ? (now - s.last) / 1000 : 0
      s.last = now
      const speed = s.target > s.progress ? GROW_SPEED : -RETRACT_SPEED
      s.progress = speed > 0 ? Math.min(s.target, s.progress + speed * dt) : Math.max(s.target, s.progress + speed * dt)
      const stepped = Math.floor(s.progress / 3) * 3 // grow in small jumps, 8-bit style
      if (stepped !== s.shown) {
        s.shown = stepped
        drawPoints(back, s.points, stepped, false)
        drawPoints(front, s.points, stepped, true)
      }
      if (s.progress !== s.target) s.raf = requestAnimationFrame(frame)
    }
    s.raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(s.raf)
  }, [active])

  return (
    <>
      <canvas ref={backRef} className="ch-twigs ch-twigs-back" aria-hidden="true" />
      <canvas ref={frontRef} className="ch-twigs ch-twigs-front" aria-hidden="true" />
    </>
  )
}
