import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

export default function Projects() {
  const { projects } = usePortfolioContent()
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
          {projects.map((p, idx) => (
            <a key={p.id || p.num || idx} href={p.link || '#'} className="proj-item">
              <span className="proj-num">{p.num}</span>
              <div className="proj-body">
                <h3 className="proj-title">{p.title}</h3>
                <p className="proj-desc">{p.desc}</p>
                <div className="proj-tech">
                  {(p.tech || []).map((t) => <span key={`${p.id || p.num}-${t}`} className="tech-chip">{t}</span>)}
                </div>
              </div>
              <span className="proj-arrow">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
