import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import portrait from '../assets/potrait.png'
import { usePortfolioContent } from '../context/PortfolioContentContext'

const SECTION_PATHS = new Set(['/about', '/skills', '/projects', '/experience', '/contact'])

function toSectionLink(to, fallback) {
  const target = to || fallback
  return SECTION_PATHS.has(target) ? `/#${target.slice(1)}` : target
}

export default function Home() {
  const { home } = usePortfolioContent()
  const tags = home.barTags || []
  const primaryCtaTo = toSectionLink(home.primaryCta?.to, '/projects')
  const secondaryCtaTo = toSectionLink(home.secondaryCta?.to, '/contact')

  return (
    <section className="hero" id="hero">
      {/* filled name — behind portrait */}
      <div className="hero-name" aria-hidden="true">
        <span>{home.heroDisplayName}</span>
      </div>
      {/* outline name — in front of portrait */}
      <div className="hero-name hero-name-outline" aria-hidden="true">
        <span>{home.heroDisplayName}</span>
      </div>

      {/* portrait */}
      <div className="hero-img-wrap">
        <img src={portrait} alt={home.portraitAlt} className="hero-img" />
      </div>

      {/* top-right label */}
      <div className="hero-label">
        <span className="hero-label-line" />
        <span>{home.topLabel}</span>
      </div>

      {/* bottom info bar */}
      <div className="hero-bar">
        <div className="hero-bar-left">
          <p className="hero-bar-name">{home.barName}</p>
          <p className="hero-bar-role">{home.barRole}</p>
        </div>
        <div className="hero-bar-dividers">
          {tags.map((tag, idx) => (
            <Fragment key={`${tag}-${idx}`}>
              {idx > 0 && <span className="bar-sep" />}
              <span>{tag}</span>
            </Fragment>
          ))}
        </div>
        <div className="hero-bar-ctas">
          <Link to={primaryCtaTo} className="btn btn-primary">{home.primaryCta?.label || 'View Work'}</Link>
          <Link to={secondaryCtaTo} className="btn btn-outline">{home.secondaryCta?.label || 'Contact'}</Link>
        </div>
      </div>
    </section>
  )
}
