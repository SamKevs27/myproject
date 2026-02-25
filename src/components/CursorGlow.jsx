import { useEffect, useRef } from 'react'

/**
 * Renders a fixed div whose transform tracks the cursor in real time
 * via requestAnimationFrame — no CSS transition lag.
 */
export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rafId

    function onMove(e) {
      x = e.clientX
      y = e.clientY
    }

    function loop() {
      el.style.transform = `translate(${x}px, ${y}px)`
      rafId = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 5000,
        height: 5000,
        marginLeft: -2500,
        marginTop: -2500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 35%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'transform',
      }}
    />
  )
}
