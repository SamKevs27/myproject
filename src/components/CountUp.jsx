import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'

/** Counts the leading number in `value` (e.g. "2+", "10+") up from zero once `active`. */
export default function CountUp({ value = '', active, duration = 1200 }) {
  const match = String(value).match(/^(\d+)(.*)$/)
  const target = match ? Number(match[1]) : null
  const suffix = match ? match[2] : ''
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!active || target === null || prefersReducedMotion()) return undefined
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setCurrent(Math.round(target * (1 - (1 - t) ** 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])

  if (target === null || prefersReducedMotion()) return value
  return `${active ? current : 0}${suffix}`
}
