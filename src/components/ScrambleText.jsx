import { useEffect, useRef } from 'react'
import { prefersReducedMotion, useInView } from '../hooks/useInView'

const GLYPHS = '!<>-_\\/[]{}=+*^?#01'
const DURATION = 750 // ms for the whole label to resolve

/**
 * A label that "decodes" when it scrolls into view: characters cycle through
 * random symbols and lock in left to right. Writes straight to the DOM each
 * frame (no re-renders); screen readers get the real text via aria-label.
 */
export default function ScrambleText({ text = '', as = 'span', className = '' }) {
  const Tag = as
  const [ref, inView] = useInView({ threshold: 0.6 })
  const outRef = useRef(null)

  useEffect(() => {
    const out = outRef.current
    if (!out || !inView || prefersReducedMotion()) return undefined
    let raf = 0
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / DURATION)
      const locked = Math.floor(progress * text.length)
      let next = text.slice(0, locked)
      for (let i = locked; i < text.length; i++) {
        next += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      out.textContent = next
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, text])

  return (
    <Tag ref={ref} className={`scramble${className ? ` ${className}` : ''}`} aria-label={text}>
      <span ref={outRef} aria-hidden="true">{text}</span>
    </Tag>
  )
}
