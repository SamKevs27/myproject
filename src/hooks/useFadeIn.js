import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to `ref`. When the element enters the
 * viewport it gets the `is-visible` class which triggers CSS animations.
 */
export function useFadeIn(threshold = 0.15) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return ref
}
