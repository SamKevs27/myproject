import { useEffect, useRef, useState } from 'react'

/**
 * Returns [ref, inView]. `inView` flips to true the first time the element
 * scrolls into view and stays true, so entrance animations only play once.
 */
export function useInView({ threshold = 0.2, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return undefined
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, { threshold, rootMargin })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rootMargin, inView])

  return [ref, inView]
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
