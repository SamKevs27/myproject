import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'About',      to: '/about' },
  { label: 'Skills',     to: '/skills' },
  { label: 'Projects',   to: '/projects' },
  { label: 'Experience', to: '/experience' },
  { label: 'Contact',    to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const location = useLocation()

  useEffect(() => {
    const idx = NAV_LINKS.findIndex(l => l.to === location.pathname)
    if (idx < 0) { setInd(i => ({ ...i, opacity: 0 })); return }
    const t = setTimeout(() => {
      const li = itemRefs.current[idx]
      const ul = listRef.current
      if (!li || !ul) return
      const ulR = ul.getBoundingClientRect()
      const liR = li.getBoundingClientRect()
      setInd({ left: liR.left - ulR.left, width: liR.width, opacity: 1 })
    }, 30)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">SKL</Link>

        <ul className={`navbar-links${open ? ' open' : ''}`} ref={listRef}>
          <span
            className="nav-indicator"
            style={{ left: ind.left, width: ind.width, opacity: ind.opacity }}
            aria-hidden="true"
          />

          {NAV_LINKS.map((l, i) => (
            <li key={l.label} ref={el => (itemRefs.current[i] = el)}>
              <NavLink
                to={l.to}
                className={({ isActive }) => isActive ? 'nav-active' : ''}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar-social">
          <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub">GH</a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">LI</a>
          <a href="mailto:samuelkevinlaluyan@email.com" aria-label="Email">✉</a>
        </div>
        <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
