import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

function hasProjectLink(link = '') {
  const value = link.trim()
  return Boolean(value) && value !== '#'
}

export default function Projects() {
  const { projects: items } = usePortfolioContent()
  const projects = [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  const headRef = useFadeIn()
  const listRef = useFadeIn()
  return (
    <section className="section page-section" id="projects">
      <div className="section-inner">
        <div className="projects-header fade-up" ref={headRef}>
          <span className="section-label">Selected Works</span>
          <h2 className="section-title">Projects</h2>
        </div>
        <div className="projects-list stagger fade-up" ref={listRef}>
          {projects.map((p, idx) => {
            const hasLink = hasProjectLink(p.link)

            const meta = [p.role, p.year].filter(Boolean).join(' · ')

            return (
              <a
                key={p.id || p.num || idx}
                href={hasLink ? p.link : undefined}
                target={hasLink && /^https?:/i.test(p.link) ? '_blank' : undefined}
                rel={hasLink ? 'noreferrer' : undefined}
                className={`proj-item${hasLink ? ' has-link' : ''}${p.image ? ' has-image' : ''}`}
              >
                <span className="proj-num">{p.num}</span>
                <div className="proj-body">
                  <h3 className="proj-title">{p.title}</h3>
                  {meta && <p className="proj-meta">{meta}</p>}
                  <p className="proj-desc">{p.desc}</p>
                  <div className="proj-tech">
                    {(p.tech || []).map((t) => <span key={`${p.id || p.num}-${t}`} className="tech-chip">{t}</span>)}
                  </div>
                </div>
                {p.image && <img src={p.image} alt={`${p.title} screenshot`} className="proj-thumb" loading="lazy" />}
                <span className="proj-arrow" aria-hidden="true">{hasLink ? '↗' : ''}</span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
