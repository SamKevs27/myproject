import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePortfolioContent } from '../context/PortfolioContentContext'

const NAV_LINKS = [
  { label: 'About', sectionId: 'about' },
  { label: 'Skills', sectionId: 'skills' },
  { label: 'Projects', sectionId: 'projects' },
  { label: 'Experience', sectionId: 'experience' },
  { label: 'Contact', sectionId: 'contact' },
]

// A section counts as "current" once its top passes this share of the viewport.
const ACTIVE_LINE = 0.4

function currentSection() {
  const doc = document.documentElement
  if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) return NAV_LINKS.at(-1).sectionId
  const line = window.innerHeight * ACTIVE_LINE
  let current = ''
  for (const { sectionId } of NAV_LINKS) {
    const el = document.getElementById(sectionId)
    if (el && el.getBoundingClientRect().top <= line) current = sectionId
  }
  return current
}

export default function Navbar() {
  const { home } = usePortfolioContent()
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const pillRef = useRef(null)
  const listRef = useRef(null)
  const linkRefs = useRef({})
  const progressRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'
  const active = onHome ? activeSection : ''

  // Track the current section and scroll progress from the scroll position.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      if (onHome) setActiveSection(currentSection())
      const bar = progressRef.current
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
      }
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  }, [onHome])

  // Slide the highlight pill under the active link. Re-measure whenever the
  // list changes size (resize, web fonts finishing loading).
  const measure = useCallback(() => {
    const pill = pillRef.current
    const link = linkRefs.current[active]
    const list = listRef.current
    if (!pill) return
    if (!link || !list || !link.offsetWidth) {
      pill.style.opacity = '0'
      return
    }
    const l = link.getBoundingClientRect()
    const u = list.getBoundingClientRect()
    pill.style.transform = `translateX(${l.left - u.left}px)`
    pill.style.width = `${l.width}px`
    pill.style.opacity = '1'
  }, [active])

  useEffect(() => {
    measure()
    const list = listRef.current
    if (!list) return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure])

  // Mobile menu: lock page scroll while open, close on Escape.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Always scroll on click, even when the hash is already the same.
  const goTo = (e, sectionId) => {
    e.preventDefault()
    setOpen(false)
    if (!onHome) {
      navigate(sectionId ? `/#${sectionId}` : '/')
      return
    }
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${sectionId}`)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.replaceState(null, '', '/')
    }
  }

  return (
    <nav className={`navbar${open ? ' is-open' : ''}`} aria-label="Main">
      <span className="scroll-progress" ref={progressRef} aria-hidden="true" />
      <div className="navbar-inner">
        <a href="/" className="navbar-logo" onClick={(e) => goTo(e, '')}>SKL</a>

        <ul className="navbar-links" ref={listRef}>
          <span className="nav-pill" ref={pillRef} aria-hidden="true" />
          {NAV_LINKS.map((l, i) => (
            <li key={l.sectionId} style={{ '--i': i }}>
              <a
                href={`/#${l.sectionId}`}
                ref={(el) => { linkRefs.current[l.sectionId] = el }}
                className={active === l.sectionId ? 'nav-active' : ''}
                aria-current={active === l.sectionId ? 'true' : undefined}
                onClick={(e) => goTo(e, l.sectionId)}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {home.cvUrl && (
          <a href={home.cvUrl} target="_blank" rel="noreferrer" className="navbar-cv">Download CV</a>
        )}

        <button
          type="button"
          className="hamburger"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <span /><span />
        </button>
      </div>
    </nav>
  )
}
