import portrait from '../assets/potrait.png'
import { Link } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

export default function About() {
  const { about } = usePortfolioContent()
  const imgRef = useFadeIn()
  const textRef = useFadeIn()
  const statsRef = useFadeIn()

  const titleLines = (about.title || '').split('\n')

  return (
    <section className="section page-section" id="about">
      <div className="section-inner about-inner">
        <div className="about-img-col">
          <div ref={imgRef} className="fade-up">
            <img src={portrait} alt={about.portraitAlt || 'Portrait'} className="about-portrait" />
          </div>
          <div ref={statsRef} className="about-stats stagger fade-up">
            {(about.stats || []).map((stat, idx) => (
              <div key={`${stat.label}-${idx}`} className="stat">
                <span className="stat-num">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="about-text-col fade-up" ref={textRef}>
          <span className="section-label">{about.sectionLabel}</span>
          <h2 className="section-title">
            {titleLines.map((line, idx) => (
              <span key={`${line}-${idx}`}>
                {idx > 0 && <br />}
                {line}
              </span>
            ))}
          </h2>
          {(about.paragraphs || []).map((paragraph, idx) => (
            <p key={`${idx}-${paragraph.slice(0, 20)}`} className="about-p">{paragraph}</p>
          ))}
          <div className="about-details-row stagger fade-up is-visible">
            {(about.details || []).map((detail, idx) => (
              <div key={`${detail.key}-${idx}`} className="detail-chip">
                <span className="detail-key">{detail.key}</span>
                <span>{detail.value}</span>
              </div>
            ))}
          </div>
          <Link to={about.cta?.to || '/contact'} className="btn btn-primary">{about.cta?.label || 'Get Started'}</Link>
        </div>
      </div>
    </section>
  )
}
