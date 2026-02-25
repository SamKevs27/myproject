import { useEffect, useRef } from 'react'
import { SKILL_BARS } from '../data'
import { useFadeIn } from '../hooks/useFadeIn'

function SkillRow({ name, pct }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="skill-row fade-up" style={{ '--bar-width': `${pct}%` }}>
      <div className="skill-row-top">
        <span className="skill-name">{name}</span>
        <span className="skill-pct">{pct}%</span>
      </div>
      <div className="skill-track">
        <div className="skill-fill" />
      </div>
    </div>
  )
}

export default function Skills() {
  const leftRef = useFadeIn()
  return (
    <section className="section section-alt page-section" id="skills">
      <div className="section-inner skills-inner">
        <div className="skills-left fade-up is-visible" ref={leftRef}>
          <span className="section-label">Technical Proficiency</span>
          <h2 className="section-title">Skills &amp;<br />Toolset</h2>
          <p className="skills-sub">Continuously growing across the full stack — from pixel-perfect frontends to robust backends and databases.</p>
        </div>
        <div className="skills-right">
          {SKILL_BARS.map((s, i) => (
            <SkillRow key={s.name} name={s.name} pct={s.pct} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  )
}
