import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

export default function Skills() {
  const leftRef = useFadeIn()
  const { skillsPage } = usePortfolioContent()
  const page = skillsPage || {}

  return (
    <section className="section section-alt page-section" id="skills">
      <div className="section-inner skills-inner skills-sections-layout">
        <div className="skills-left fade-up is-visible" ref={leftRef}>
          <span className="section-label">{page.sectionLabel}</span>
          <h2 className="section-title">{page.title}</h2>
          <p className="skills-sub">{page.subtitle}</p>
        </div>
        <div className="skills-right skills-sections">
          {(page.sections || []).map((section) => (
            <div key={section.title} className="skills-section-card fade-up is-visible">
              <h3 className="skills-section-title">{section.title}</h3>
              <ul className="skills-list">
                {section.items.map((item) => (
                  <li key={item} className="skills-list-item">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
