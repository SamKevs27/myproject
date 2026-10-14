import { usePortfolioContent } from '../context/PortfolioContentContext'
import StretchText from '../components/StretchText'
import { useInView } from '../hooks/useInView'
import SectionBackground from '../components/SectionBackground'
import ScrambleText from '../components/ScrambleText'

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
  const [ref, inView] = useInView({ threshold: 0.15 })
  if (!items.length) return null

  return (
    <div ref={ref} className={`exp-group${inView ? ' is-in' : ''}`}>
      {title && <ScrambleText as="h3" className="exp-group-title" text={title} />}
      <div className="exp-list">
        {items.map((e, idx) => (
          <div key={e.id || e.role || idx} className="exp-item" style={{ '--i': idx }}>
            <div className="exp-left">
              <span className="exp-period">{e.period}</span>
              {/present/i.test(e.period || '') && <span className="exp-now">Now</span>}
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
  const { experience: items } = usePortfolioContent()
  const experience = [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  const work = experience.filter((e) => e.type !== 'education')
  const education = experience.filter((e) => e.type === 'education')
  const showTitles = work.length > 0 && education.length > 0

  return (
    <section className="section section-alt page-section" id="experience">
      <SectionBackground variant="stream" />
      <div className="section-inner">
        <StretchText as="h2" className="section-title" text="Experience" />
        <ExpGroup title={showTitles ? 'Work' : ''} items={work} />
        <ExpGroup title={showTitles ? 'Education' : ''} items={education} />
      </div>
    </section>
  )
}
