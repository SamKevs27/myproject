import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import portrait from '../assets/portrait.webp'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import StretchText from '../components/StretchText'
import HeroBackground from '../components/HeroBackground'
import { prefersReducedMotion } from '../hooks/useInView'
import { funSection } from '../lib/routes'

const SECTION_PATHS = new Set(['/about', '/skills', '/projects', '/experience', '/contact'])

function toSectionLink(to, fallback) {
  const target = to || fallback
  return SECTION_PATHS.has(target) ? funSection(target.slice(1)) : target
}

// Letters within this many px of the cursor widen and thicken.
const REACH = 340

// The big name reacts to the cursor: nearby letters stretch wider and heavier.
function useNameProximity(heroRef) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return undefined

    const chars = [...hero.querySelectorAll('.hero-name .st-char')]
    let raf = 0
    let pointer = null

    const paint = () => {
      raf = 0
      for (const el of chars) {
        let pull = 0
        if (pointer) {
          const r = el.getBoundingClientRect()
          const dx = pointer.x - (r.left + r.width / 2)
          const dy = pointer.y - (r.top + r.height / 2)
          pull = Math.max(0, 1 - Math.hypot(dx, dy * 0.6) / REACH)
        }
        el.style.setProperty('--pull', pull.toFixed(3))
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint) }
    const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY }; schedule() }
    const onLeave = () => { pointer = null; schedule() }

    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    return () => {
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [heroRef])
}

// As the hero scrolls away, the name and portrait drift at different depths.
function useHeroParallax(heroRef) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || prefersReducedMotion()) return undefined
    let raf = 0
    const update = () => {
      raf = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight))
      hero.style.setProperty('--hs', progress.toFixed(3))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [heroRef])
}

export default function Home() {
  const { home } = usePortfolioContent()
  const heroRef = useRef(null)
  useNameProximity(heroRef)
  useHeroParallax(heroRef)
  const tags = home.barTags || []
  const primaryCtaTo = toSectionLink(home.primaryCta?.to, '/projects')
  const secondaryCtaTo = toSectionLink(home.secondaryCta?.to, '/contact')

  return (
    <section className="hero" id="hero" ref={heroRef}>
      <HeroBackground heroRef={heroRef} />
      {/* decorative neon signs: "Samuel" and "engineer" in katakana */}
      <span className="neon-sign neon-sign-name" aria-hidden="true">サミュエル</span>
      <span className="neon-sign neon-sign-role" aria-hidden="true">エンジニア</span>
      {/* the giant name below is decorative (aria-hidden), so this is the real page heading */}
      <h1 className="sr-only">{[home.barName, home.barRole].filter(Boolean).join(' — ')}</h1>
      <div className="hero-name" aria-hidden="true">
        <StretchText text={home.heroDisplayName || ''} className="hero-name-text" immediate />
      </div>

      {/* portrait */}
      <div className="hero-img-wrap">
        <img src={portrait} alt={home.portraitAlt} className="hero-img" />
      </div>

      {/* top-right label */}
      <div className="hero-label">
        <span className="hero-label-line" />
        <span>{home.topLabel}</span>
      </div>

      {/* bottom info bar */}
      <div className="hero-bar">
        <div className="hero-bar-left">
          <p className="hero-bar-name">{home.barName}</p>
          <p className="hero-bar-role">{home.barRole}</p>
        </div>
        <div className="hero-bar-dividers">
          {tags.map((tag, idx) => <span key={`${tag}-${idx}`} style={{ '--i': idx }}>{tag}</span>)}
        </div>
        <div className="hero-bar-ctas">
          <Link to={primaryCtaTo} className="btn btn-primary">{home.primaryCta?.label || 'View Work'}</Link>
          <Link to={secondaryCtaTo} className="btn btn-outline">{home.secondaryCta?.label || 'Contact'}</Link>
          {home.cvUrl && (
            <a href={home.cvUrl} target="_blank" rel="noreferrer" className="btn btn-outline">Download CV</a>
          )}
        </div>
      </div>
    </section>
  )
}
