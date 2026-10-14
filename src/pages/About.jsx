import portrait from '../assets/portrait.webp'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import PoseTrace, { LANDMARK_COUNT } from '../components/PoseTrace'
import StretchText from '../components/StretchText'
import CountUp from '../components/CountUp'
import { prefersReducedMotion, useInView } from '../hooks/useInView'
import SectionBackground from '../components/SectionBackground'
import ScrambleText from '../components/ScrambleText'
import { sectionHref } from '../lib/routes'
import { useViewMode } from '../context/ViewMode'

const SECTION_PATHS = new Set(['/about', '/skills', '/projects', '/experience', '/contact'])

function toSectionLink(mode, to, fallback) {
  const target = to || fallback
  return SECTION_PATHS.has(target) ? sectionHref(mode, target.slice(1)) : target
}

export default function About() {
  const { about } = usePortfolioContent()
  const mode = useViewMode()
  const formal = mode === 'formal'
  const ctaTo = toSectionLink(mode, about.cta?.to, '/contact')

  const [portraitRef, portraitInView] = useInView({ threshold: 0.45 })
  const [textRef, textInView] = useInView({ threshold: 0.15 })
  const poseRef = useRef(null)
  const [dance, setDance] = useState({ state: 'idle', score: 0 })

  // The skeleton dances, then grades itself the way the thesis grades dancers.
  const startDance = async () => {
    if (dance.state === 'dancing') return
    setDance({ state: 'dancing', score: 0 })
    if (!prefersReducedMotion()) await poseRef.current?.dance()
    setDance({ state: 'scored', score: 86 + Math.floor(Math.random() * 14) })
  }

  return (
    <section className="section page-section" id="about">
      <SectionBackground variant="network" />
      <div className="section-inner about-inner">
        <div className="about-img-col">
          <figure ref={portraitRef} className={`about-figure${portraitInView ? ' is-in' : ''} is-${dance.state}`}>
            <img src={portrait} alt={about.portraitAlt || 'Portrait'} className="about-portrait" />
            {!formal && (
              <>
                <PoseTrace ref={poseRef} active={portraitInView} height={1600} />
                <figcaption className="pose-readout" aria-live="polite">
                  <span className="pose-live" aria-hidden="true" />
                  {dance.state === 'dancing' && 'Scoring moves…'}
                  {dance.state === 'scored' && <>Dance score <strong>{dance.score}/100</strong></>}
                  {dance.state === 'idle' && `Tracking ${LANDMARK_COUNT} landmarks`}
                </figcaption>
                <button type="button" className="dance-btn" onClick={startDance} disabled={dance.state === 'dancing'}>
                  {dance.state === 'scored' ? 'Again!' : 'Make it dance'}
                </button>
              </>
            )}
          </figure>
          <div className={`about-stats${portraitInView ? ' is-in' : ''}`}>
            {(about.stats || []).map((stat, idx) => (
              <div key={`${stat.label}-${idx}`} className="stat" style={{ '--i': idx }}>
                <span className="stat-num">{formal ? stat.value : <CountUp value={stat.value} active={portraitInView} />}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          {!formal && <Link to={sectionHref(mode, 'projects')} className="pose-note">This is how my thesis sees dancers</Link>}
        </div>
        <div ref={textRef} className={`about-text-col rise-group${textInView ? ' is-in' : ''}`}>
          <ScrambleText className="section-label" text={about.sectionLabel || ''} />
          <StretchText as="h2" className="section-title" text={about.title || ''} />
          {(about.paragraphs || []).map((paragraph, idx) => (
            <p key={`${idx}-${paragraph.slice(0, 20)}`} className="about-p rise" style={{ '--i': idx + 1 }}>{paragraph}</p>
          ))}
          <div className="about-details-row">
            {(about.details || []).map((detail, idx) => (
              <div key={`${detail.key}-${idx}`} className="detail-chip pop" style={{ '--i': idx + 3 }}>
                <span className="detail-key">{detail.key}</span>
                <span>{detail.value}</span>
              </div>
            ))}
          </div>
          <Link to={ctaTo} className="btn btn-primary rise" style={{ '--i': 6 }}>{about.cta?.label || 'Get Started'}</Link>
        </div>
      </div>
    </section>
  )
}
