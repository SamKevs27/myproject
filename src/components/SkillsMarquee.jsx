import { useEffect, useRef } from 'react'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { prefersReducedMotion } from '../hooks/useInView'

const BASE_SPEED = 45 // px per second
const MIN_ITEMS = 24 // enough for one copy of the band to outrun a wide screen

/**
 * A band of skills that drifts sideways. Scrolling speeds it up, flips its
 * direction to match, and leans it into the motion. Decorative: the same
 * skills are listed properly in the Skills section, so it's aria-hidden.
 */
export default function SkillsMarquee() {
  const { skillsPage } = usePortfolioContent()
  const trackRef = useRef(null)

  const skills = (skillsPage?.sections || [])
    .filter((s) => !/spoken|certif/i.test(s.title || ''))
    .flatMap((s) => s.items || [])
  const copy = []
  while (skills.length && copy.length < MIN_ITEMS) copy.push(...skills)

  useEffect(() => {
    const track = trackRef.current
    if (!track || !copy.length || prefersReducedMotion()) return undefined

    let x = 0
    let dir = -1
    let boost = 0
    let lastScroll = window.scrollY
    let last = performance.now()
    let raf = 0

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const scrolled = window.scrollY - lastScroll
      lastScroll = window.scrollY
      if (scrolled !== 0) {
        dir = scrolled > 0 ? -1 : 1
        boost = Math.min(900, boost + Math.abs(scrolled) * 6)
      }
      boost *= 0.92
      x += dir * (BASE_SPEED + boost) * dt
      const half = track.scrollWidth / 2
      if (half > 0) {
        if (x <= -half) x += half
        if (x > 0) x -= half
      }
      const lean = Math.max(-14, Math.min(14, dir * -boost / 40))
      track.style.transform = `translateX(${x}px) skewX(${lean}deg)`
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [copy.length])

  if (!copy.length) return null

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" ref={trackRef}>
        {[...copy, ...copy].map((skill, i) => (
          <span key={i} className={`marquee-item${i % 2 ? ' is-outline' : ''}`}>{skill}</span>
        ))}
      </div>
    </div>
  )
}
