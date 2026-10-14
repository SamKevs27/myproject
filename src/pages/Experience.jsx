import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

function ExpDescription({ text = '' }) {
  const lines = text.split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  if (!lines.length) return null
  if (lines.length === 1) return <p className="exp-desc">{lines[0]}</p>
  return (
    <ul className="exp-desc exp-bullets">
      {lines.map((line, idx) => <li key={idx}>{line}</li>)}
    </ul>
  )
}

function ExpGroup({ title, items }) {
  const listRef = useFadeIn()
  if (!items.length) return null

  return (
    <div className="exp-group">
      {title && <h3 className="exp-group-title">{title}</h3>}
      <div className="exp-list stagger fade-up" ref={listRef}>
        {items.map((e, idx) => (
          <div key={e.id || e.role || idx} className="exp-item">
            <div className="exp-left">
              <span className="exp-period">{e.period}</span>
            </div>
            <div className="exp-dot" />
            <div className="exp-right">
              <h3 className="exp-role">{e.role}</h3>
              <p className="exp-company">{e.company}</p>
              <ExpDescription text={e.desc} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Experience() {
  const { experience } = usePortfolioContent()
  const headRef = useFadeIn()
  const work = experience.filter((e) => e.type !== 'education')
  const education = experience.filter((e) => e.type === 'education')
  const showTitles = work.length > 0 && education.length > 0

  return (
    <section className="section section-alt page-section" id="experience">
      <div className="section-inner">
        <div className="fade-up" ref={headRef}>
          <span className="section-label">Background</span>
          <h2 className="section-title">Experience</h2>
        </div>
        <ExpGroup title={showTitles ? 'Work' : ''} items={work} />
        <ExpGroup title={showTitles ? 'Education' : ''} items={education} />
      </div>
    </section>
  )
}
