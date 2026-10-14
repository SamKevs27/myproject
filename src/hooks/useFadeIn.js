import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to `ref`. When the element enters the
 * viewport it gets the `is-visible` class which triggers CSS animations.
 * Content is revealed immediately when the visitor prefers reduced motion
 * or the browser can't observe intersections, so nothing stays hidden.
 */
export function useFadeIn(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.disconnect() } },
      { threshold, rootMargin: '0px 0px 10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}
