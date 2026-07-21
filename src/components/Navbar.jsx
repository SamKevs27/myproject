import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'About', sectionId: 'about' },
  { label: 'Skills', sectionId: 'skills' },
  { label: 'Projects', sectionId: 'projects' },
  { label: 'Experience', sectionId: 'experience' },
  { label: 'Contact', sectionId: 'contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const location = useLocation()
  const activeNavSection = location.pathname === '/' ? activeSection : ''

  useEffect(() => {
    if (location.pathname !== '/') {
      return
    }

    const hashSection = location.hash.slice(1)
    const hashTimer = window.setTimeout(() => {
      if (!hashSection) return
      setActiveSection(hashSection)
    }, 0)

    const sections = NAV_LINKS
      .map((link) => document.getElementById(link.sectionId))
      .filter(Boolean)

    if (!sections.length) {
      return () => window.clearTimeout(hashTimer)
    }

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      if (visible[0]) {
        setActiveSection(visible[0].target.id)
      }
    }, {
      rootMargin: '-35% 0px -45% 0px',
      threshold: [0.08, 0.2, 0.4, 0.6],
    })

    sections.forEach((section) => observer.observe(section))
    return () => {
      window.clearTimeout(hashTimer)
      observer.disconnect()
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    const idx = NAV_LINKS.findIndex(l => l.sectionId === activeNavSection)
    const t = setTimeout(() => {
      if (idx < 0) {
        setInd(i => ({ ...i, opacity: 0 }))
        return
      }
      const li = itemRefs.current[idx]
      const ul = listRef.current
      if (!li || !ul) return
      const ulR = ul.getBoundingClientRect()
      const liR = li.getBoundingClientRect()
      setInd({ left: liR.left - ulR.left, width: liR.width, opacity: 1 })
    }, 30)
    return () => clearTimeout(t)
  }, [activeNavSection])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/#hero" className="navbar-logo" onClick={() => setOpen(false)}>SKL</Link>

        <ul className={`navbar-links${open ? ' open' : ''}`} ref={listRef}>
          <span
            className="nav-indicator"
            style={{ left: ind.left, width: ind.width, opacity: ind.opacity }}
            aria-hidden="true"
          />

          {NAV_LINKS.map((l, i) => (
            <li key={l.label} ref={el => (itemRefs.current[i] = el)}>
              <Link
                to={`/#${l.sectionId}`}
                className={activeNavSection === l.sectionId ? 'nav-active' : ''}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
