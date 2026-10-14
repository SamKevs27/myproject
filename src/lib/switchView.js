import { prefersReducedMotion } from '../hooks/useInView'
import './switchView.css'

const NAVIGATE_AT = { fun: 420, formal: 260, journey: 480 } // ms into the effect when the page swaps
const REMOVE_AT = { fun: 900, formal: 620, journey: 950 }

/**
 * Switches between the formal and fun views with a short transition: a burst
 * of neon glitch bars going to the fun site, a clean fade coming back. The
 * overlay lives on <body> so it survives the route change underneath it.
 */
export function switchView(navigate, to, target) {
  if (prefersReducedMotion()) {
    navigate(to)
    return
  }
  const overlay = document.createElement('div')
  overlay.className = `view-switch view-switch-${target}`
  overlay.setAttribute('aria-hidden', 'true')
  if (target === 'fun') {
    const colors = ['#ff2bd6', '#2ef2ff', '#c040ff', '#ffb238']
    for (let i = 0; i < 8; i++) {
      const bar = document.createElement('span')
      bar.style.top = `${Math.random() * 100}%`
      bar.style.height = `${1 + Math.random() * 6}vh`
      bar.style.left = `${Math.random() * 30}%`
      bar.style.right = `${Math.random() * 30}%`
      bar.style.background = bar.style.color = colors[i % colors.length]
      bar.style.animationDelay = `${Math.random() * 260}ms`
      overlay.appendChild(bar)
    }
  }
  if (target === 'journey') {
    // a blocky wipe: rows of 8-bit sky tiles stepping in
    for (let i = 0; i < 8; i++) {
      const row = document.createElement('span')
      row.style.top = `${i * 12.5}%`
      row.style.animationDelay = `${i * 30}ms`
      overlay.appendChild(row)
    }
  }
  document.body.appendChild(overlay)
  setTimeout(() => {
    navigate(to)
    window.scrollTo(0, 0)
  }, NAVIGATE_AT[target])
  setTimeout(() => overlay.remove(), REMOVE_AT[target])
}
