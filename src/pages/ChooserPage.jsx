import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import portrait from '../assets/portrait.webp'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { usePixelFonts } from '../hooks/usePixelFonts'
import { FORMAL_PATH, FUN_PATH, JOURNEY_PATH } from '../lib/routes'
import { switchView } from '../lib/switchView'
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
      <p className="ch-fun-word">{word}</p>
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

/**
 * The landing page: three cards, one per way of seeing the portfolio. Each
 * card previews its own look; picking one plays that view's transition.
 */
export default function ChooserPage() {
  const { home } = usePortfolioContent()
  const navigate = useNavigate()
  usePixelFonts()

  useEffect(() => {
    document.documentElement.dataset.view = 'chooser'
    return () => { delete document.documentElement.dataset.view }
  }, [])

  const name = home.barName || 'Samuel Kevin Laluyan'
  const role = (home.barRole || 'Software Engineer').split('·')[0].trim()

  const views = [
    {
      id: 'formal', path: FORMAL_PATH, title: 'Formal', action: 'Open formal view',
      text: 'Straight to the point. Clean and quick to read.',
      preview: <FormalPreview name={name} role={role} />,
    },
    {
      id: 'fun', path: FUN_PATH, title: 'Fun', action: 'Make it fun',
      text: 'Neon, animated and full of little surprises.',
      preview: <FunPreview word={home.heroDisplayName || name.split(' ')[0]} />,
    },
    {
      id: 'journey', path: JOURNEY_PATH, title: 'Journey', action: 'Start journey',
      text: 'Play through my portfolio as an 8-bit game.',
      preview: <JourneyPreview />,
    },
  ]

  const open = (view) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return // let new-tab clicks through
    e.preventDefault()
    switchView(navigate, view.path, view.id)
  }

  return (
    <div className="chooser">
      <header className="ch-header">
        <h1>{name}</h1>
        <p className="ch-role">{role}</p>
        <p className="ch-question">How would you like to see my portfolio?</p>
      </header>

      <ul className="ch-cards">
        {views.map((view) => (
          <li key={view.id}>
            <a className={`ch-card ch-card-${view.id}`} href={view.path} onClick={open(view)}>
              {view.preview}
              <span className="ch-body">
                <span className="ch-title">{view.title}</span>
                <span className="ch-text">{view.text}</span>
                <span className="ch-action">{view.action}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="ch-note">Same content in every view. You can switch at any time.</p>
    </div>
  )
}
