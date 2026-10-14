import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { prefersReducedMotion } from '../hooks/useInView'
import { CheckpointDialog } from '../journey/Dialogs'
import { useJourneyLoop } from '../journey/useJourneyLoop'
import { SCROLL_PER_UNIT, SECTIONS, buildWorld, sectionOf } from '../journey/world'
import { setSoundEnabled, sfx } from '../journey/sfx'
import { spriteDataUrl } from '../journey/renderSprite'
import { COIN } from '../journey/sprites/scenery'
import '../journey/Journey.css'

const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap'

// Pixel fonts load only when someone opens the journey.
function usePixelFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONTS_HREF}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

const scrollToX = (x, smooth = true) => window.scrollTo({ top: x * SCROLL_PER_UNIT, behavior: smooth ? 'smooth' : 'auto' })

/**
 * 8-bit side-scrolling version of the portfolio. Scrolling walks the
 * character through the level; each checkpoint opens a dialog with the real
 * portfolio content (kept as DOM text).
 */
export default function JourneyPage() {
  const content = usePortfolioContent()
  const { home, loading } = content
  const [reduced] = useState(prefersReducedMotion)
  const [activeId, setActiveId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [visited, setVisited] = useState([])
  const [coinPops, setCoinPops] = useState(0)
  const [sound, setSound] = useState(false)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const titleRef = useRef(null)
  const progressRef = useRef(null)
  const distanceRef = useRef(null)
  usePixelFonts()

  const { about, skillsPage, projects, experience, contact } = content
  const world = useMemo(
    () => (loading ? null : buildWorld({ about, skillsPage, projects, experience, contact, home })),
    [loading, about, skillsPage, projects, experience, contact, home],
  )

  useEffect(() => {
    document.documentElement.dataset.view = 'journey'
    return () => { delete document.documentElement.dataset.view }
  }, [])

  // one coin per section, the first time you reach it
  const visitedRef = useRef([])
  const onSection = useCallback((id) => {
    setSectionId(id)
    if (!id || visitedRef.current.includes(id)) return
    visitedRef.current = [...visitedRef.current, id]
    setVisited(visitedRef.current)
    setCoinPops((n) => n + 1)
    sfx.coin()
  }, [])

  useJourneyLoop({ canvasRef, stageRef, titleRef, progressRef, distanceRef, world, reduced, onActive: setActiveId, onSection })

  const start = useCallback(() => {
    sfx.start()
    if (world) scrollToX(world.checkpoints[0].x)
  }, [world])

  const restart = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [])

  // deep links: /journey#projects jumps to that world
  useEffect(() => {
    if (!world || reduced) return undefined
    const jump = (smooth) => {
      const id = window.location.hash.slice(1)
      const cp = world.checkpoints.find((c) => c.section === id)
      if (cp) requestAnimationFrame(() => scrollToX(cp.x, smooth))
    }
    jump(false)
    const onHash = () => jump(true)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [world, reduced])

  // keyboard: ←/→ or A/D hop between checkpoints, Enter/Space start, Enter opens the dialog
  useEffect(() => {
    if (!world || reduced) return undefined
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return
      const x = window.scrollY / SCROLL_PER_UNIT
      const key = e.key.toLowerCase()
      if (key === 'arrowright' || key === 'd') {
        const next = world.checkpoints.find((c) => c.x > x + 4)
        if (next) { e.preventDefault(); scrollToX(next.x) }
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault()
        const prev = [...world.checkpoints].reverse().find((c) => c.x < x - 4)
        if (prev) scrollToX(prev.x)
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if ((key === 'enter' || key === ' ') && x < 20 && e.target === document.body) {
        e.preventDefault()
        start()
      } else if (key === 'enter' && e.target === document.body) {
        const dialog = document.querySelector('.j-dialog.is-open')
        dialog?.querySelector('a, button')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [world, reduced, start])

  const toggleSound = () => {
    setSoundEnabled(!sound)
    setSound(!sound)
  }

  const coinSrc = useMemo(() => spriteDataUrl(COIN), [])

  if (!world) {
    return <div className="journey j-loading" role="status"><span>LOADING…</span></div>
  }

  const section = sectionOf(sectionId)
  const subtitle = (home.barRole || '').split('·')[0].trim()
  const height = reduced ? undefined : { height: `calc(100vh + ${Math.round(world.length * SCROLL_PER_UNIT)}px)` }

  return (
    <div className={`journey${reduced ? ' is-static' : ''}`} style={height}>
      <Link className="j-skip" to="/">Skip the game: read the plain version</Link>

      <div className="j-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="j-canvas" aria-hidden="true" />

        <header className="j-hud">
          <p className="j-hud-world">{section ? `${section.world} ${section.label}` : 'PRESS START'}</p>
          <div className="j-hud-progress" aria-hidden="true">
            <span className="j-hud-bar"><span ref={progressRef} /></span>
            <span ref={distanceRef} className="j-hud-distance">0000M</span>
          </div>
          <p className="j-hud-coins" aria-label={`${visited.length} of ${SECTIONS.length} coins`}>
            <img src={coinSrc} alt="" width="16" height="16" />×{visited.length}/{SECTIONS.length}
          </p>
          <button type="button" className="j-hud-btn j-hud-sound" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Mute sound' : 'Turn sound on'}>
            {sound ? '🔊' : '🔇'}
          </button>
          <Link to="/" className="j-hud-btn j-hud-exit">EXIT</Link>
        </header>

        <div className="j-title" ref={titleRef}>
          <h1 className="j-game-title">{home.barName}</h1>
          {subtitle && <p className="j-game-sub">{subtitle}</p>}
          <button type="button" className="j-start" onClick={start}>▶ START JOURNEY</button>
          {!reduced && <p className="j-hint" aria-hidden="true">SCROLL ▼</p>}
          <p className="j-press">© {new Date().getFullYear()} · PRESS START</p>
        </div>

        {!reduced && world.checkpoints.map((cp) => (
          <CheckpointDialog key={cp.id} cp={cp} open={cp.id === activeId} onRestart={restart} />
        ))}

        {!reduced && Array.from({ length: coinPops }, (_, i) => (
          <img key={i} src={coinSrc} alt="" className="j-coin-pop" aria-hidden="true" />
        ))}
      </div>

      {reduced && (
        <main className="j-static-list">
          {world.checkpoints.map((cp) => (
            <CheckpointDialog key={cp.id} cp={cp} open onRestart={restart} />
          ))}
        </main>
      )}
    </div>
  )
}
