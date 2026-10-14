import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import portrait from '../assets/portrait.webp'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { PRIVATE_MARK, hasProjectLink, linkLabel, sortByOrder } from '../lib/projects'
import { FUN_PATH } from '../lib/routes'
import { switchView } from '../lib/switchView'
import './FormalPage.css'

const external = (href = '') => /^https?:/i.test(href)

function Bullets({ text = '' }) {
  const lines = text.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  if (!lines.length) return null
  if (lines.length === 1) return <p className="f-text">{lines[0]}</p>
  return <ul className="f-bullets">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
}

function Section({ id, title, children }) {
  return (
    <section className="f-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 className="f-section-title" id={`${id}-title`}>{title}</h2>
      <div className="f-section-body">{children}</div>
    </section>
  )
}

function Entry({ period, title, subtitle, children }) {
  return (
    <article className="f-entry">
      <p className="f-period">{period}</p>
      <div>
        <h3 className="f-entry-title">{title}</h3>
        {subtitle && <p className="f-entry-sub">{subtitle}</p>}
        {children}
      </div>
    </article>
  )
}

/**
 * The formal, minimalist view of the portfolio: the same content as the fun
 * site, set as a calm one-column résumé. "Make it fun" switches to FUN_PATH.
 */
export default function FormalPage() {
  const { home, about, contact, skillsPage, projects, experience, loading } = usePortfolioContent()
  const navigate = useNavigate()

  // The page sets its own light background; the fun site's body styles stay out of the way.
  useEffect(() => {
    document.documentElement.dataset.view = 'formal'
    return () => { delete document.documentElement.dataset.view }
  }, [])

  const goFun = () => switchView(navigate, FUN_PATH, 'fun')

  if (loading) return <div className="formal f-loading" role="status">Loading…</div>

  const jobs = sortByOrder(experience)
  const work = jobs.filter((e) => e.type !== 'education')
  const education = jobs.filter((e) => e.type === 'education')
  const actions = contact.actions || []
  const email = (actions.find((a) => /^mailto:/i.test(a.href || ''))?.href || '').replace(/^mailto:/i, '')
  const profiles = actions.filter((a) => !/^mailto:/i.test(a.href || ''))

  return (
    <div className="formal">
      <a className="f-skip" href="#about">Skip to content</a>
      <header className="f-header">
        <div className="f-identity">
          <span className="f-photo"><img src={portrait} alt={home.portraitAlt || ''} /></span>
          <div>
            <h1 className="f-name">{home.barName}</h1>
            <p className="f-role">{home.barRole}</p>
          </div>
        </div>
        <button type="button" className="f-fun" onClick={goFun}>
          <span>Make it fun</span>
        </button>
      </header>

      <nav className="f-links" aria-label="Contact and profiles">
        {email && <a href={`mailto:${email}`}>{email}</a>}
        {profiles.map((a) => (
          <a key={a.href} href={a.href} target={external(a.href) ? '_blank' : undefined} rel={external(a.href) ? 'noreferrer' : undefined}>
            {a.label}
          </a>
        ))}
        {home.cvUrl && <a href={home.cvUrl} target="_blank" rel="noreferrer">Download CV</a>}
      </nav>

      <main>
        <Section id="about" title="About">
          {(about.paragraphs || []).map((p, i) => <p key={i} className="f-text">{p}</p>)}
          {(about.details || []).length > 0 && (
            <dl className="f-facts">
              {about.details.map((d) => (
                <div key={d.key}><dt>{d.key}</dt><dd>{d.value}</dd></div>
              ))}
              {(about.stats || []).map((s) => (
                <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
              ))}
            </dl>
          )}
        </Section>

        {work.length > 0 && (
          <Section id="experience" title="Experience">
            {work.map((e) => (
              <Entry key={e.id} period={e.period} title={e.role} subtitle={e.company}>
                <Bullets text={e.desc} />
              </Entry>
            ))}
          </Section>
        )}

        <Section id="projects" title="Projects">
          {sortByOrder(projects).map((p) => {
            const hasLink = hasProjectLink(p.link)
            const isPrivate = PRIVATE_MARK.test(p.title || '')
            const title = (p.title || '').replace(PRIVATE_MARK, '')
            return (
              <Entry
                key={p.id}
                period={p.year || ''}
                title={title}
                subtitle={[p.role, isPrivate && !hasLink ? 'Private client work' : ''].filter(Boolean).join(', ')}
              >
                <p className="f-text">{p.desc}</p>
                {(p.tech || []).length > 0 && <p className="f-meta">{p.tech.join(', ')}</p>}
                {hasLink && (
                  <a className="f-link" href={p.link} target={external(p.link) ? '_blank' : undefined} rel={external(p.link) ? 'noreferrer' : undefined}>
                    {linkLabel(p.link)}
                  </a>
                )}
              </Entry>
            )
          })}
        </Section>

        <Section id="skills" title="Skills">
          <dl className="f-skills">
            {(skillsPage.sections || []).map((s) => (
              <div key={s.title}>
                <dt>{s.title}</dt>
                <dd>{(s.items || []).join(', ')}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {education.length > 0 && (
          <Section id="education" title="Education">
            {education.map((e) => (
              <Entry key={e.id} period={e.period} title={e.role} subtitle={e.company}>
                <Bullets text={e.desc} />
              </Entry>
            ))}
          </Section>
        )}

        <Section id="contact" title="Contact">
          {contact.subtitle && <p className="f-text">{contact.subtitle}</p>}
          {email && <p className="f-text"><a className="f-link" href={`mailto:${email}`}>{email}</a></p>}
        </Section>
      </main>

      <footer className="f-footer">
        <span>© {new Date().getFullYear()} {home.barName}</span>
        <button type="button" className="f-fun f-fun-small" onClick={goFun}><span>Make it fun</span></button>
      </footer>
    </div>
  )
}
