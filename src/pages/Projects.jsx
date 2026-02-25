import { useFadeIn } from '../hooks/useFadeIn'
import { PROJECTS } from '../data'

export default function Projects() {
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
          {PROJECTS.map(p => (
            <a key={p.num} href={p.link} className="proj-item">
              <span className="proj-num">{p.num}</span>
              <div className="proj-body">
                <h3 className="proj-title">{p.title}</h3>
                <p className="proj-desc">{p.desc}</p>
                <div className="proj-tech">
                  {p.tech.map(t => <span key={t} className="tech-chip">{t}</span>)}
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
