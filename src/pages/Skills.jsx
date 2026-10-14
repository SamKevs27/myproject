import { usePortfolioContent } from '../context/PortfolioContentContext'
import StretchText from '../components/StretchText'
import { useInView } from '../hooks/useInView'
import SectionBackground from '../components/SectionBackground'
import ScrambleText from '../components/ScrambleText'

export default function Skills() {
  const { skillsPage } = usePortfolioContent()
  const page = skillsPage || {}
  const [tableRef, tableInView] = useInView({ threshold: 0.1 })

  return (
    <section className="section section-alt page-section" id="skills">
      <SectionBackground variant="codeField" />
      <div className="section-inner skills-layout">
        <div className="skills-intro">
          {page.sectionLabel && <ScrambleText className="section-label" text={page.sectionLabel} />}
          <StretchText as="h2" className="section-title" text={page.title || ''} />
          {page.subtitle && <p className="skills-sub">{page.subtitle}</p>}
        </div>
        <dl ref={tableRef} className={`skills-table${tableInView ? ' is-in' : ''}`}>
          {(page.sections || []).map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="skills-row" style={{ '--i': idx }}>
              <dt className="skills-group">
                {section.title}
                <span className="skills-count">{(section.items || []).length}</span>
              </dt>
              <dd className="skills-items">
                {(section.items || []).map((item, i, all) => (
                  <span key={item} className="skill" style={{ '--j': i }}>{item}{i < all.length - 1 ? ', ' : ''}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
