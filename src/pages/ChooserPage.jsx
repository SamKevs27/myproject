import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import portrait from '../assets/portrait.webp'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { usePixelFonts } from '../hooks/usePixelFonts'
import { prefersReducedMotion } from '../hooks/useInView'
import { FORMAL_PATH, FUN_PATH, JOURNEY_PATH } from '../lib/routes'
import { switchView } from '../lib/switchView'
import GradientField from '../components/GradientField'
import { FormalStage, FunStage, JourneyStage } from '../chooser/Stages'
import { spriteCanvas, spriteDataUrl } from '../journey/renderSprite'
import { HERO, characterFrames } from '../journey/sprites/character'
import { BUSH, CHEST_CLOSED, CHEST_OPEN, CLOUD, COIN, PALM_FRONDS } from '../journey/sprites/scenery'
import { PALETTE } from '../journey/sprites/palette'
import './ChooserPage.css'

/* ---- card faces: each one an object from its own world ---- */

// Formal: an ID card on a lanyard.
function FormalFace({ name, role }) {
  return (
    <div className="ch-face ch-face-formal" aria-hidden="true">
      <span className="cf-slot" />
      <span className="cf-band"><span>SKL</span><span>Portfolio</span></span>
      <span className="cf-photo"><img src={portrait} alt="" /></span>
      <span className="cf-name">{name}</span>
      <span className="cf-role">{role}</span>
      <span className="cf-barcode" />
    </div>
  )
}

// Fun: an agent card in the neon style.
function FunFace({ word }) {
  return (
    <div className="ch-face ch-face-fun" aria-hidden="true">
      <span className="cv-side cv-side-l" />
      <span className="cv-side cv-side-r" />
      <span className="cv-strip" />
      <span className="cv-panel">
        <span className="cv-vert">{word}</span>
        <span className="cv-tag">SKL</span>
        <span className="cv-window">
          <img src={portrait} alt="" />
          <span className="cv-tick cv-tick-a" />
          <span className="cv-tick cv-tick-b" />
        </span>
        <span className="cv-hud">
          <span className="cv-cross"><span>01_SK</span></span>
          <span className="cv-lines" />
          <span className="cv-num">26</span>
          <span className="cv-mark" />
        </span>
      </span>
      <span className="cn-holo" />
    </div>
  )
}

// A small pixel palm (trunk + fronds) drawn once.
function palmImage() {
  const fronds = spriteCanvas(PALM_FRONDS)
  const canvas = document.createElement('canvas')
  canvas.width = fronds.width
  canvas.height = 46
  const ctx = canvas.getContext('2d')
  for (let y = 0; y < 34; y += 3) {
    const x = 14 + Math.floor((y / 34) ** 2 * 3)
    ctx.fillStyle = PALETTE.outline
    ctx.fillRect(x - 1, 46 - y - 3, 6, 3)
    ctx.fillStyle = (y / 3) % 2 ? PALETTE.brown2 : PALETTE.brown1
    ctx.fillRect(x, 46 - y - 3, 4, 3)
  }
  ctx.drawImage(fronds, 0, 4)
  return canvas.toDataURL('image/png')
}

// Journey: an 8-bit cartridge; the label is a tiny level that comes alive on hover.
function JourneyFace() {
  const art = useMemo(() => {
    const frames = characterFrames(HERO)
    return {
      idle: spriteDataUrl(frames.idle),
      jump: spriteDataUrl(frames.jump),
      cloud: spriteDataUrl(CLOUD),
      palm: palmImage(),
      bush: spriteDataUrl(BUSH),
      chest: spriteDataUrl(CHEST_CLOSED),
      chestOpen: spriteDataUrl(CHEST_OPEN),
      coin: spriteDataUrl(COIN),
    }
  }, [])
  return (
    <div className="ch-face ch-face-journey" aria-hidden="true">
      <span className="cc-grip" />
      <span className="cc-label">
        <span className="cc-title">JOURNEY</span>
        <img className="cc-cloud cc-cloud-a" src={art.cloud} alt="" />
        <img className="cc-cloud cc-cloud-b" src={art.cloud} alt="" />
        <img className="cc-palm cc-palm-a" src={art.palm} alt="" />
        <img className="cc-palm cc-palm-b" src={art.palm} alt="" />
        <img className="cc-bush" src={art.bush} alt="" />
        <span className="cc-chest">
          <img className="cc-chest-closed" src={art.chest} alt="" />
          <img className="cc-chest-open" src={art.chestOpen} alt="" />
          <img className="cc-coin" src={art.coin} alt="" />
        </span>
        <span className="cc-hero">
          <img className="cc-hero-idle" src={art.idle} alt="" />
          <img className="cc-hero-jump" src={art.jump} alt="" />
        </span>
        <span className="cc-ground" />
      </span>
      <span className="cc-arrow">▼</span>
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
 * The landing page. Three floating cards over a slowly moving gradient; picking
 * one grows its world out of the card, shows a themed "Get started" button,
 * and docks the other two cards at the bottom so you can still switch.
 */
export default function ChooserPage() {
  const { home } = usePortfolioContent()
  const navigate = useNavigate()
  usePixelFonts()

  const [chosen, setChosen] = useState(null)
  const [layers, setLayers] = useState([])
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
      face: <FormalFace name={name} role={role} />,
    },
    {
      id: 'fun', path: FUN_PATH, title: 'Fun',
      text: 'Neon, animated and full of little surprises.',
      intro: 'Neon, motion and a few surprises.',
      face: <FunFace word={home.heroDisplayName || name.split(' ')[0]} />,
    },
    {
      id: 'journey', path: JOURNEY_PATH, title: 'Journey',
      text: 'Play through my portfolio as an 8-bit game.',
      intro: 'Play through my portfolio as an 8\u2011bit game.',
      face: <JourneyFace />,
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
  }

  // once the newest world has fully grown, drop the ones underneath it
  const onOpened = useMemo(() => (key) => setLayers((prev) => prev.filter((l) => l.key >= key)), [])

  const backToMenu = () => {
    recordPositions()
    setChosen(null)
    setLayers([])
  }

  // cards lean toward the cursor, with a glare that follows it
  const tilt = (e) => {
    if (prefersReducedMotion() || e.pointerType !== 'mouse') return
    const card = e.currentTarget.querySelector('.ch-card')
    const r = card.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    card.style.setProperty('--ry', `${(px - 0.5) * 16}deg`)
    card.style.setProperty('--rx', `${(0.5 - py) * 12}deg`)
    card.style.setProperty('--gx', `${px * 100}%`)
    card.style.setProperty('--gy', `${py * 100}%`)
  }
  const resetTilt = (e) => {
    const card = e.currentTarget.querySelector('.ch-card')
    for (const v of ['--rx', '--ry', '--gx', '--gy']) card.style.removeProperty(v)
  }

  const getStarted = () => { if (current) switchView(navigate, current?.path, current?.id) }

  return (
    <div className={`chooser${chosen ? ` is-chosen is-${chosen}` : ''}`}>
      <GradientField className="ch-gradient" />
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
              <a
                className={`ch-pick ch-pick-${view.id}`}
                href={view.path}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return // new-tab clicks go straight there
                  e.preventDefault()
                  choose(view)
                }}
                onPointerLeave={resetTilt}
                onPointerMove={tilt}
                aria-label={`${view.title}: ${view.text}`}
              >
                <span className="ch-object">
                  {view.id === 'formal' && <span className="cf-lanyard" aria-hidden="true"><span className="cf-clip" /></span>}
                  <span ref={(el) => { cardRefs.current[view.id] = el }} className={`ch-card ch-card-${view.id}`}>
                    {view.face}
                    <span className="ch-glare" />
                  </span>
                </span>
                <span className="ch-caption">
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
