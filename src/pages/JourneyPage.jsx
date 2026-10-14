import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { prefersReducedMotion } from '../hooks/useInView'
import { usePixelFonts } from '../hooks/usePixelFonts'
import { CardGallery, CardModal, ContactPanel, FullContent, LedgePanel, SkillPanel, SpeechBubble } from '../journey/Dialogs'
import { toBubbles } from '../journey/bubbles'
import { useJourneyLoop } from '../journey/useJourneyLoop'
import { SECTIONS, buildWorld, sectionOf } from '../journey/world'
import { setSoundEnabled, sfx } from '../journey/sfx'
import { spriteDataUrl } from '../journey/renderSprite'
import { COIN } from '../journey/sprites/scenery'
import '../journey/Journey.css'

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

const KEYS = {
  left: ['arrowleft', 'a'],
  right: ['arrowright', 'd'],
  jump: [' ', 'arrowup', 'w'],
}

/**
 * 8-bit platformer version of the portfolio. You play a hero who meets Sam,
 * bonks skill blocks, opens a chest of project cards, climbs the career
 * ledges and reaches the castle. All text stays real DOM text.
 */
export default function JourneyPage() {
  const content = usePortfolioContent()
  const { home, about, skillsPage, projects, experience, contact, loading } = content
  const [reduced] = useState(prefersReducedMotion)
  const touch = useMedia('(pointer: coarse)')
  const narrow = useMedia('(max-width: 640px)')

  const [started, setStarted] = useState(false)
  const [region, setRegion] = useState(null)
  const [near, setNear] = useState(null)
  const [talk, setTalk] = useState(null) // bubble index while talking to Sam
  const [skill, setSkill] = useState(null)
  const [ledge, setLedge] = useState(null)
  const [atCastle, setAtCastle] = useState(false)
  const [gallery, setGallery] = useState(null) // { x, y } chest position on screen
  const [card, setCard] = useState(null)
  const [visited, setVisited] = useState([])
  const [coinPops, setCoinPops] = useState(0)
  const [sound, setSound] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const samRef = useRef(null)
  const chestRef = useRef(null)
  const progressRef = useRef(null)
  const distanceRef = useRef(null)
  const overlays = useMemo(() => ({ sam: samRef, chest: chestRef, progress: progressRef, distance: distanceRef }), [])
  const control = useRef({ input: { left: false, right: false, jump: false }, started: false, paused: false, chestOpen: false, command: null })
  const visitedRef = useRef([])
  usePixelFonts()

  const world = useMemo(
    () => (loading ? null : buildWorld({ about, skillsPage, projects, experience, contact, home })),
    [loading, about, skillsPage, projects, experience, contact, home],
  )

  const bubbles = useMemo(() => {
    const lines = [...(about.paragraphs || []), 'Jump into the ? blocks ahead to see my skills. Good luck!']
    return toBubbles(lines, narrow ? 24 : 34)
  }, [about.paragraphs, narrow])

  useEffect(() => {
    document.documentElement.dataset.view = 'journey'
    return () => { delete document.documentElement.dataset.view }
  }, [])

  // the game freezes while the chest gallery or a card is open
  useEffect(() => {
    control.current.paused = Boolean(gallery) || card !== null
    if (control.current.paused) control.current.input = { left: false, right: false, jump: false }
  }, [gallery, card])

  const events = useMemo(() => ({
    onRegion(id) {
      setRegion(id)
      if (id !== 'skills') setSkill(null)
      if (id !== 'experience') setLedge(null)
      if (!id || visitedRef.current.includes(id)) return
      visitedRef.current = [...visitedRef.current, id]
      setVisited(visitedRef.current)
      setCoinPops((n) => n + 1)
      sfx.coin()
    },
    onNear(target) {
      setNear(target)
      if (target !== 'sam') setTalk(null)
    },
    onBlock: (index) => setSkill(index),
    onLedge: (index) => setLedge(index),
    onCastle: setAtCastle,
  }), [])

  useJourneyLoop({ canvasRef, stageRef, overlays, world, reduced, control, events })

  const start = useCallback(() => {
    if (control.current.started) return
    control.current.started = true
    setStarted(true)
    setShowControls(true)
    sfx.start()
  }, [])

  useEffect(() => {
    if (!showControls) return undefined
    const t = setTimeout(() => setShowControls(false), 7000)
    return () => clearTimeout(t)
  }, [showControls])

  const talkToSam = useCallback(() => {
    start()
    setTalk((i) => (i === null ? 0 : i + 1 < bubbles.length ? i + 1 : null))
  }, [bubbles.length, start])

  const openChest = useCallback(() => {
    start()
    if (!control.current.chestOpen) {
      control.current.chestOpen = true
      sfx.open()
    }
    const r = chestRef.current?.getBoundingClientRect()
    const origin = r ? { x: r.left, y: r.top } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    setTimeout(() => setGallery(origin), 380)
  }, [start])

  const interact = useCallback(() => {
    if (!control.current.started) start()
    else if (near === 'sam') talkToSam()
    else if (near === 'chest') openChest()
  }, [near, start, talkToSam, openChest])

  const restart = useCallback(() => {
    control.current.started = false
    control.current.command = { type: 'teleport', x: world.regions[0].spawn }
    setStarted(false)
    setTalk(null)
    setSkill(null)
    setLedge(null)
  }, [world])

  // deep links: /journey#projects drops you at that part of the level
  useEffect(() => {
    if (!world || reduced) return undefined
    const jump = () => {
      const r = world.regions.find((x) => x.id === window.location.hash.slice(1))
      if (!r) return
      control.current.command = { type: 'teleport', x: r.spawn }
      start()
    }
    jump()
    window.addEventListener('hashchange', jump)
    return () => window.removeEventListener('hashchange', jump)
  }, [world, reduced, start])

  // keyboard: ←/→ or A/D move, Space/↑/W jump, E/Enter interact, Esc closes
  useEffect(() => {
    if (!world || reduced) return undefined
    const set = (e, value) => {
      const key = e.key.toLowerCase()
      for (const [action, keys] of Object.entries(KEYS)) {
        if (keys.includes(key)) {
          control.current.input[action] = value && !control.current.paused
          if (control.current.started) e.preventDefault()
        }
      }
    }
    const onDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === 'escape') {
        if (card !== null) setCard(null)
        else if (gallery) setGallery(null)
        return
      }
      const onControl = e.target.closest?.('button, a, input, textarea, select')
      if (onControl && (key === 'enter' || key === ' ')) return // let the focused control handle it
      if (!control.current.started && (key === 'enter' || key === ' ')) {
        e.preventDefault()
        start()
        return
      }
      if ((key === 'e' || key === 'enter') && !e.repeat) {
        e.preventDefault()
        interact()
        return
      }
      set(e, true)
    }
    const onUp = (e) => set(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [world, reduced, card, gallery, start, interact])

  const hold = (action) => ({
    onPointerDown: (e) => { e.preventDefault(); start(); control.current.input[action] = !control.current.paused },
    onPointerUp: () => { control.current.input[action] = false },
    onPointerLeave: () => { control.current.input[action] = false },
    onPointerCancel: () => { control.current.input[action] = false },
    onContextMenu: (e) => e.preventDefault(),
  })

  const toggleSound = () => {
    setSoundEnabled(!sound)
    setSound(!sound)
  }

  const coinSrc = useMemo(() => spriteDataUrl(COIN), [])

  if (!world) {
    return <div className="journey j-loading" role="status"><span>LOADING…</span></div>
  }

  if (reduced) {
    return (
      <div className="journey is-static">
        <Link className="j-skip" to="/formal">Skip the game: read the formal version</Link>
        <div className="j-stage" ref={stageRef}>
          <canvas ref={canvasRef} className="j-canvas" aria-hidden="true" />
          <div className="j-title">
            <h1 className="j-game-title">{home.barName}</h1>
            <p className="j-game-sub">{(home.barRole || '').split('·')[0].trim()}</p>
          </div>
        </div>
        <FullContent className="j-static-list" world={world} about={about} onOpenCard={setCard} />
        {card !== null && <CardModal project={world.chest.projects[card]} index={card} onClose={() => setCard(null)} />}
      </div>
    )
  }

  const section = sectionOf(region)
  const subtitle = (home.barRole || '').split('·')[0].trim()
  const hint = touch ? 'TAP' : 'PRESS E'

  return (
    <div className="journey">
      <Link className="j-skip" to="/formal">Skip the game: read the formal version</Link>

      <div className="j-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="j-canvas" aria-hidden="true" />

        {/* Sam: clickable, with a hint or his speech bubble above his head */}
        <div className="j-anchor" ref={samRef}>
          <button type="button" className="j-hit" onClick={talkToSam} aria-label="Talk to Samuel" />
          {started && talk === null && near === 'sam' && <p className="j-hint-bubble">{hint} TO TALK</p>}
          {talk !== null && bubbles[talk] && (
            <SpeechBubble lines={bubbles[talk]} index={talk} total={bubbles.length} onNext={talkToSam} />
          )}
        </div>

        <div className="j-anchor" ref={chestRef}>
          <button type="button" className="j-hit j-hit-chest" onClick={openChest} aria-label="Open the treasure chest of projects" />
          {started && near === 'chest' && !gallery && <p className="j-hint-bubble">{hint} TO OPEN</p>}
        </div>

        <header className="j-hud">
          <p className="j-hud-world">{started && section ? `${section.world} ${section.label}` : 'PRESS START'}</p>
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

        {!started && (
          <div className="j-title">
            <h1 className="j-game-title">{home.barName}</h1>
            {subtitle && <p className="j-game-sub">{subtitle}</p>}
            <button type="button" className="j-start" onClick={start}>▶ START JOURNEY</button>
            <p className="j-hint">{touch ? 'USE THE BUTTONS TO PLAY' : 'PRESS ENTER'}</p>
            <p className="j-press">© {new Date().getFullYear()} · PRESS START</p>
          </div>
        )}

        {showControls && (
          <p className="j-controls-hint" aria-live="polite">
            {touch ? '◀ ▶ MOVE · A JUMP · B TALK' : '← → MOVE · SPACE JUMP · E TALK'}
          </p>
        )}

        <div className="j-panel-slot">
          {skill !== null && <SkillPanel group={world.blocks[skill].group} index={skill} total={world.blocks.length} />}
          {ledge !== null && <LedgePanel entry={world.platforms[ledge].entry} index={ledge} total={world.platforms.length} />}
          {atCastle && <ContactPanel data={world.castle.data} onRestart={restart} />}
        </div>

        {Array.from({ length: coinPops }, (_, i) => (
          <img key={i} src={coinSrc} alt="" className="j-coin-pop" aria-hidden="true" />
        ))}

        {touch && (
          <div className="j-pad" aria-hidden="true">
            <div className="j-pad-dir">
              <button type="button" className="j-pad-btn" tabIndex={-1} {...hold('left')}>◀</button>
              <button type="button" className="j-pad-btn" tabIndex={-1} {...hold('right')}>▶</button>
            </div>
            <div className="j-pad-act">
              <button type="button" className="j-pad-btn j-pad-b" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); interact() }}>B</button>
              <button type="button" className="j-pad-btn j-pad-a" tabIndex={-1} {...hold('jump')}>A</button>
            </div>
          </div>
        )}

        {gallery && (
          <CardGallery projects={world.chest.projects} origin={gallery} onOpen={setCard} onClose={() => setGallery(null)} />
        )}
        {card !== null && <CardModal project={world.chest.projects[card]} index={card} onClose={() => setCard(null)} />}
      </div>

      {/* the whole portfolio as plain text, for screen readers and search engines */}
      <FullContent className="j-sr" world={world} about={about} plain />
    </div>
  )
}
