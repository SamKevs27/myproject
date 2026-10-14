import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import portrait from '../assets/portrait.webp'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { usePixelFonts } from '../hooks/usePixelFonts'
import { prefersReducedMotion } from '../hooks/useInView'
import { FORMAL_PATH, FUN_PATH, JOURNEY_PATH } from '../lib/routes'
import { switchView } from '../lib/switchView'
import DotField from '../components/DotField'
import { FormalStage, FunStage, JourneyStage } from '../chooser/Stages'
import Twigs from '../chooser/Twigs'
import { spriteCanvas, spriteDataUrl } from '../journey/renderSprite'
import { HERO, SAM, characterFrames } from '../journey/sprites/character'
import { CLOUD } from '../journey/sprites/scenery'
import './ChooserPage.css'

// The hero's 4 walk frames side by side, for a CSS steps() walk cycle.
function walkSheet() {
  const frames = characterFrames(HERO).walk
  const canvas = document.createElement('canvas')
  canvas.width = 16 * frames.length
  canvas.height = 24
  const ctx = canvas.getContext('2d')
  frames.forEach((f, i) => ctx.drawImage(spriteCanvas(f), i * 16, 0))
  return canvas.toDataURL('image/png')
}

function FormalPreview({ name, role }) {
  return (
    <div className="ch-preview ch-preview-formal" aria-hidden="true">
      <div className="ch-formal-head">
        <img src={portrait} alt="" />
        <div>
          <p className="ch-formal-name">{name}</p>
          <p className="ch-formal-role">{role}</p>
        </div>
      </div>
      <p className="ch-formal-nav">About&ensp;Skills&ensp;Projects&ensp;Experience&ensp;Contact</p>
    </div>
  )
}

function FunPreview({ word }) {
  return (
    <div className="ch-preview ch-preview-fun" aria-hidden="true">
      <span className="ch-fun-bar ch-fun-bar-a" />
      <span className="ch-fun-bar ch-fun-bar-b" />
      {/* data-text feeds the cyan/magenta copies that slice during a glitch */}
      <p className="ch-fun-word" data-text={word}>{word}</p>
    </div>
  )
}

function JourneyPreview() {
  const art = useMemo(() => ({
    hero: spriteDataUrl(characterFrames(HERO).idle),
    walk: walkSheet(),
    sam: spriteDataUrl(characterFrames(SAM).idle),
    cloud: spriteDataUrl(CLOUD),
  }), [])
  return (
    <div className="ch-preview ch-preview-journey" aria-hidden="true">
      <img className="ch-cloud" src={art.cloud} alt="" />
      <p className="ch-journey-start">▶ START</p>
      <img className="ch-sam" src={art.sam} alt="" />
      <span className="ch-hero" style={{ '--idle': `url(${art.hero})`, '--walk': `url(${art.walk})` }} />
      <span className="ch-ground" />
    </div>
  )
}

// A view's world, grown out of the clicked card's outline until it fills the screen.
function ThemeLayer({ layer, name, onOpened }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const r = layer.rect
    const clip = `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 14px)`
    el.style.setProperty('--clip', clip)
    if (prefersReducedMotion()) {
      el.classList.add('is-open')
      onOpened(layer.key)
      return undefined
    }
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => el.classList.add('is-open'))
    })
    return () => cancelAnimationFrame(id)
  }, [layer, onOpened])

  return (
    <div
      ref={ref}
      className={`ch-layer ch-layer-${layer.id}`}
      onTransitionEnd={(e) => { if (e.target === ref.current && e.propertyName === 'clip-path') onOpened(layer.key) }}
    >
      {layer.id === 'formal' && <FormalStage name={name} />}
      {layer.id === 'fun' && <FunStage />}
      {layer.id === 'journey' && <JourneyStage />}
    </div>
  )
}

/**
 * The landing page. Three floating cards over a reactive dot field; picking
 * one grows its world out of the card, shows a themed "Get started" button,
 * and docks the other two cards at the bottom so you can still switch.
 */
export default function ChooserPage() {
  const { home } = usePortfolioContent()
  const navigate = useNavigate()
  usePixelFonts()

  const [chosen, setChosen] = useState(null)
  const [layers, setLayers] = useState([])
  const [hovered, setHovered] = useState(null)
  const itemRefs = useRef({})
  const cardRefs = useRef({})
  const flipFrom = useRef(null)
  const layerKey = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.view = 'chooser'
    return () => { delete document.documentElement.dataset.view }
  }, [])

  const name = home.barName || 'Samuel Kevin Laluyan'
  const role = (home.barRole || 'Software Engineer').split('·')[0].trim()

  const views = [
    {
      id: 'formal', path: FORMAL_PATH, title: 'Formal',
      text: 'Straight to the point. Clean and quick to read.',
      intro: 'A clean, quick read of my work.',
      preview: <FormalPreview name={name} role={role} />,
    },
    {
      id: 'fun', path: FUN_PATH, title: 'Fun',
      text: 'Neon, animated and full of little surprises.',
      intro: 'Neon, motion and a few surprises.',
      preview: <FunPreview word={home.heroDisplayName || name.split(' ')[0]} />,
    },
    {
      id: 'journey', path: JOURNEY_PATH, title: 'Journey',
      text: 'Play through my portfolio as an 8-bit game.',
      intro: 'Play through my portfolio as an 8\u2011bit game.',
      preview: <JourneyPreview />,
    },
  ]
  const current = views.find((v) => v.id === chosen)

  // FLIP: remember where every card was, then animate into the new layout.
  const recordPositions = () => {
    flipFrom.current = Object.fromEntries(
      Object.entries(itemRefs.current).filter(([, el]) => el).map(([id, el]) => [id, el.getBoundingClientRect()]),
    )
  }

  useLayoutEffect(() => {
    const from = flipFrom.current
    flipFrom.current = null
    if (!from || prefersReducedMotion()) return
    for (const [id, el] of Object.entries(itemRefs.current)) {
      if (!el || !from[id]) continue
      const to = el.getBoundingClientRect()
      if (!to.width) continue
      const dx = from[id].left - to.left
      const dy = from[id].top - to.top
      const sx = from[id].width / to.width
      const sy = from[id].height / to.height
      el.style.transition = 'none'
      el.style.transformOrigin = 'top left'
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
      el.getBoundingClientRect() // flush so the inverted position applies
      el.style.transition = 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
      el.style.transform = ''
    }
  }, [chosen])

  const choose = (view) => {
    if (view.id === chosen) return
    const rect = cardRefs.current[view.id]?.getBoundingClientRect()
    recordPositions()
    layerKey.current += 1
    setLayers((prev) => [...prev, { key: layerKey.current, id: view.id, rect }])
    setChosen(view.id)
    setHovered(null)
  }

  // once the newest world has fully grown, drop the ones underneath it
  const onOpened = useMemo(() => (key) => setLayers((prev) => prev.filter((l) => l.key >= key)), [])

  const backToMenu = () => {
    recordPositions()
    setChosen(null)
    setLayers([])
  }

  const getStarted = () => { if (current) switchView(navigate, current?.path, current?.id) }

  return (
    <div className={`chooser${chosen ? ` is-chosen is-${chosen}` : ''}`}>
      <DotField className="ch-dots" />
      {layers.map((layer) => <ThemeLayer key={layer.key} layer={layer} name={name} onOpened={onOpened} />)}

      <header className="ch-header">
        <h1>{name}</h1>
        <p className="ch-role">{role}</p>
        <p className="ch-question">How would you like to see my portfolio?</p>
      </header>

      {current && (
        <section key={current.id} className={`ch-intro ch-intro-${current.id}`} aria-live="polite">
          <button type="button" className="ch-back" onClick={backToMenu}>All views</button>
          <p className="ch-intro-name">{name}</p>
          <h2 className="ch-intro-title">{current.title}</h2>
          <p className="ch-intro-text">{current.intro}</p>
          <button type="button" className={`ch-start ch-start-${current.id}`} onClick={getStarted}>
            <span>{current.id === 'journey' ? '▶ GET STARTED' : 'Get started'}</span>
          </button>
        </section>
      )}

      <ul className={`ch-cards${chosen ? ' is-docked' : ''}`}>
        {views.map((view, i) => (
          <li
            key={view.id}
            ref={(el) => { itemRefs.current[view.id] = el }}
            className={`ch-item${view.id === chosen ? ' is-hidden' : ''}`}
            style={{ '--float': `${2.9 + i * 0.45}s`, '--delay': `${-i * 1.3}s` }}
          >
            <div className="ch-float">
              {view.id === 'journey' && <Twigs active={hovered === 'journey'} />}
              <a
                ref={(el) => { cardRefs.current[view.id] = el }}
                className={`ch-card ch-card-${view.id}`}
                href={view.path}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return // new-tab clicks go straight there
                  e.preventDefault()
                  choose(view)
                }}
                onPointerEnter={() => setHovered(view.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(view.id)}
                onBlur={() => setHovered(null)}
                aria-label={`${view.title}: ${view.text}`}
              >
                {view.preview}
                <span className="ch-body">
                  <span className="ch-title">{view.title}</span>
                  <span className="ch-text">{view.text}</span>
                </span>
              </a>
            </div>
          </li>
        ))}
      </ul>

      {!chosen && <p className="ch-note">Same content in every view. You can switch at any time.</p>}
    </div>
  )
}
