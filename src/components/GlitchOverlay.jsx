import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'

const BAR_COLORS = ['#ff2bd6', '#2ef2ff', '#c040ff', '#5b3bff']

/**
 * Site-wide CRT atmosphere: scanlines (CSS) plus short-lived horizontal glitch
 * bars that flicker in at random spots, like a signal breaking up. Purely
 * decorative; off for visitors who prefer reduced motion.
 */
export default function GlitchOverlay() {
  const layerRef = useRef(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer || prefersReducedMotion()) return undefined
    let timer = 0

    const burst = () => {
      if (!document.hidden) {
        const count = 1 + Math.floor(Math.random() * 3)
        const baseY = Math.random() * window.innerHeight
        for (let i = 0; i < count; i++) {
          const bar = document.createElement('span')
          bar.className = 'glitch-bar'
          bar.style.top = `${baseY + (Math.random() - 0.5) * 60}px`
          bar.style.left = `${Math.random() * 85}%`
          bar.style.width = `${60 + Math.random() * 340}px`
          bar.style.height = `${2 + Math.random() * 10}px`
          bar.style.background = bar.style.color = BAR_COLORS[Math.floor(Math.random() * BAR_COLORS.length)]
          bar.style.animationDuration = `${180 + Math.random() * 380}ms`
          layer.appendChild(bar)
          setTimeout(() => bar.remove(), 700)
        }
      }
      timer = setTimeout(burst, 700 + Math.random() * 2200)
    }
    timer = setTimeout(burst, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="crt" aria-hidden="true">
      <div className="crt-bars" ref={layerRef} />
    </div>
  )
}
