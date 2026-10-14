import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../hooks/useInView'
import { spawnBurst } from './burst'


// Hovering these starts a one-shot animation that always plays to the end.
const PLAY_ON_ENTER = '.skills-row, .section-title, .contact-social-link, .btn-primary'
// Hovering these speeds up their looping drawings.
const SPEED_ON_HOVER = '.pc'

const entered = (e, el) => !el.contains(e.relatedTarget)

// Run the element's hover animation once; only remove the trigger class after
// every animation it started has finished, so leaving early can't cut it off.
function playOnce(el) {
  if (el.classList.contains('is-playing')) return
  el.classList.add('is-playing')
  requestAnimationFrame(() => {
    const running = el.getAnimations({ subtree: true }).filter((a) => (
      a instanceof CSSAnimation && a.effect?.getTiming().iterations !== Infinity
    ))
    Promise.all(running.map((a) => a.finished.catch(() => {})))
      .then(() => el.classList.remove('is-playing'))
  })
}

// Change speed without restarting: updatePlaybackRate keeps each loop where it is.
function setLoopSpeed(el, rate) {
  for (const a of el.getAnimations({ subtree: true })) {
    if (a.effect?.getTiming().iterations === Infinity) a.updatePlaybackRate(rate)
  }
}

/**
 * Site-wide pointer effects: a violet glow and a trailing ring that swells
 * over anything clickable, buttons that lean toward the cursor, and click
 * bursts. Mouse-only effects stay off on touch screens; everything stays off
 * for visitors who prefer reduced motion.
 */
export default function MotionLayer() {
  const glowRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return undefined

    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest('input, textarea, select, #admin')) return
      spawnBurst(e.clientX, e.clientY)
    }
    window.addEventListener('pointerdown', onDown)

    const onEnter = (e) => {
      const play = e.target.closest?.(PLAY_ON_ENTER)
      if (play && entered(e, play)) playOnce(play)
      const fast = e.target.closest?.(SPEED_ON_HOVER)
      if (fast && entered(e, fast)) setLoopSpeed(fast, 2.6)
    }
    const onExit = (e) => {
      const fast = e.target.closest?.(SPEED_ON_HOVER)
      if (fast && !fast.contains(e.relatedTarget)) setLoopSpeed(fast, 1)
    }
    window.addEventListener('pointerover', onEnter, { passive: true })
    window.addEventListener('pointerout', onExit, { passive: true })
    const removeShared = () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerover', onEnter)
      window.removeEventListener('pointerout', onExit)
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!finePointer) return removeShared

    const glow = glowRef.current
    const ring = ringRef.current
    const target = { x: -100, y: -100 }
    const pos = { x: -100, y: -100 }
    let magnet = null
    let magnetRect = null
    let raf = 0

    const releaseMagnet = () => {
      if (!magnet) return
      magnet.style.removeProperty('--mx')
      magnet.style.removeProperty('--my')
      magnet = null
    }

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      ring.classList.add('is-on')

      const btn = e.target.closest('.btn, .dance-btn')
      if (btn !== magnet) {
        releaseMagnet()
        if (btn && !btn.disabled) {
          magnet = btn
          magnetRect = btn.getBoundingClientRect()
        }
      }
      if (magnet) {
        const dx = e.clientX - (magnetRect.left + magnetRect.width / 2)
        const dy = e.clientY - (magnetRect.top + magnetRect.height / 2)
        magnet.style.setProperty('--mx', `${dx * 0.28}px`)
        magnet.style.setProperty('--my', `${dy * 0.38}px`)
      }
    }

    const onOver = (e) => {
      ring.classList.toggle('is-link', !!e.target.closest('a, button, [role="button"], label, select'))
    }

    const onLeaveWindow = () => {
      ring.classList.remove('is-on')
      releaseMagnet()
    }

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.2
      pos.y += (target.y - pos.y) * 0.2
      ring.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      glow.style.transform = `translate(${target.x}px, ${target.y}px)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)
    raf = requestAnimationFrame(loop)

    return () => {
      removeShared()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      cancelAnimationFrame(raf)
      releaseMagnet()
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
