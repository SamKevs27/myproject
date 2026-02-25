import { useFadeIn } from '../hooks/useFadeIn'
import { EXPERIENCE } from '../data'

export default function Experience() {
  const headRef = useFadeIn()
  const listRef = useFadeIn()
  return (
    <section className="section section-alt page-section" id="experience">
      <div className="section-inner">
        <div className="fade-up" ref={headRef}>
          <span className="section-label">Background</span>
          <h2 className="section-title">Experience</h2>
        </div>
        <div className="exp-list stagger fade-up" ref={listRef}>
          {EXPERIENCE.map(e => (
            <div key={e.role} className="exp-item">
              <div className="exp-left">
                <span className="exp-period">{e.period}</span>
              </div>
              <div className="exp-dot" />
              <div className="exp-right">
                <h3 className="exp-role">{e.role}</h3>
                <p className="exp-company">{e.company}</p>
                <p className="exp-desc">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
