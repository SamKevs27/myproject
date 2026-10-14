import { useEffect, useRef } from 'react'
import { PALETTE as C } from '../journey/sprites/palette'

const PX = 3 // CSS pixels per vine pixel
const GROW_MS = 700

/**
 * 8-bit vines that grow around the card's edge while `active`, in stepped
 * frames, starting from both bottom corners and meeting at the top.
 */
export default function Vines({ active }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const w = Math.round(canvas.parentElement.clientWidth / PX)
    const h = Math.round(canvas.parentElement.clientHeight / PX)
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)
    if (!active) return undefined

    // one path up the left side and across the top half, mirrored for the right
    const half = (h - 3) + (w / 2)
    const point = (d, side) => {
      const x = d < h - 3 ? 1 : 1 + (d - (h - 3))
      const y = d < h - 3 ? h - 2 - d : 1
      return side < 0 ? [x, y] : [w - 1 - x, y]
    }
    const pixel = (x, y, color) => {
      ctx.fillStyle = color
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1)
    }
    const drawTo = (progress) => {
      ctx.clearRect(0, 0, w, h)
      const end = Math.floor(half * progress)
      for (const side of [-1, 1]) {
        for (let d = 0; d < end; d++) {
          const [x, y] = point(d, side)
          const wiggle = Math.round(Math.sin(d / 3) * 1)
          const onSide = d < h - 3
          const vx = onSide ? x + wiggle * side * -1 : x
          const vy = onSide ? y : y + Math.abs(wiggle)
          pixel(vx, vy, C.green2)
          pixel(vx + (onSide ? side * -1 : 0), vy + (onSide ? 0 : 1), C.green1)
          // leaves every few pixels, alternating sides
          if (d % 7 === 3) {
            const flip = (d / 7) % 2 < 1 ? 1 : -1
            const lx = onSide ? vx + flip * 2 : vx
            const ly = onSide ? vy : vy + 2 * (flip > 0 ? 1 : 0)
            pixel(lx, ly, C.green3)
            pixel(lx + (onSide ? flip : 1), ly, C.green4)
            pixel(lx, ly - 1, C.green3)
          }
          if (d % 23 === 11) pixel(vx, vy - 1, C.red) // a tiny berry
        }
      }
    }

    let raf = 0
    let start = 0
    let shown = -1
    const frame = (now) => {
      if (!start) start = now
      const p = Math.min(1, (now - start) / GROW_MS)
      const stepped = Math.floor(p * 10) / 10 // 8-bit feel: grow in jumps
      if (stepped !== shown) {
        shown = stepped
        drawTo(stepped)
      }
      if (p < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [active])

  return <canvas ref={ref} className="ch-vines" aria-hidden="true" />
}
