import { PRIVATE_MARK, hasProjectLink, linkLabel } from '../lib/projects'
import { sectionOf } from './world'

const external = (href = '') => /^https?:/i.test(href)
const GEMS = ['#f8c838', '#3fae3a', '#e03c28', '#5aa8f0', '#c06aff', '#fcfcfc', '#b8682a']

// Short intro line that types itself out when the dialog opens.
function TypeLine({ text, as = 'h2' }) {
  const Tag = as
  return <Tag className="j-type" style={{ '--n': text.length }}>{text}</Tag>
}

function Bullets({ text = '' }) {
  const lines = text.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  if (!lines.length) return null
  return <ul className="j-list">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
}

function About({ data }) {
  return (
    <>
      {(data.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
      {(data.stats || []).length > 0 && (
        <ul className="j-stats">
          {data.stats.map((s) => <li key={s.label}><strong>{s.value}</strong> {s.label}</li>)}
        </ul>
      )}
      {(data.details || []).length > 0 && (
        <dl className="j-facts">
          {data.details.map((d) => <div key={d.key}><dt>{d.key}</dt><dd>{d.value}</dd></div>)}
        </dl>
      )}
    </>
  )
}

function Skills({ data }) {
  return (
    <div className="j-inventory">
      {(data.sections || []).map((group, g) => (
        <section key={group.title} className="j-pouch">
          <h3>{group.title}</h3>
          <ul>
            {(group.items || []).map((item) => (
              <li key={item} className="j-slot">
                <span className="j-gem" style={{ '--gem': GEMS[g % GEMS.length] }} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Job({ data, index, total }) {
  return (
    <>
      <p className="j-kicker">{data.type === 'education' ? 'EDUCATION' : 'CHECKPOINT'} {index + 1}/{total}</p>
      <h3 className="j-heading">{data.role}</h3>
      <p className="j-sub">{data.company}{data.period ? ` / ${data.period}` : ''}</p>
      <Bullets text={data.desc} />
    </>
  )
}

function Project({ data, index, total }) {
  const isPrivate = PRIVATE_MARK.test(data.title || '')
  const title = (data.title || '').replace(PRIVATE_MARK, '')
  const meta = [data.role, data.year].filter(Boolean).join(', ')
  const hasLink = hasProjectLink(data.link)
  return (
    <>
      <p className="j-kicker">ITEM {index + 1}/{total}{isPrivate ? ' / PRIVATE CLIENT WORK' : ''}</p>
      <h3 className="j-heading">{title}</h3>
      {meta && <p className="j-sub">{meta}</p>}
      <p>{data.desc}</p>
      {(data.tech || []).length > 0 && (
        <ul className="j-tags">{data.tech.map((t) => <li key={t}>{t}</li>)}</ul>
      )}
      {hasLink && (
        <a className="j-btn" href={data.link} target={external(data.link) ? '_blank' : undefined} rel={external(data.link) ? 'noreferrer' : undefined}>
          ▶ {linkLabel(data.link).toUpperCase()}
        </a>
      )}
    </>
  )
}

function Contact({ data, onRestart }) {
  const { contact = {}, home = {} } = data
  const actions = contact.actions || []
  return (
    <>
      {contact.subtitle && <p>{contact.subtitle}</p>}
      <ul className="j-links">
        {actions.map((a) => (
          <li key={a.href}>
            <a className="j-btn j-btn-small" href={a.href} target={external(a.href) ? '_blank' : undefined} rel={external(a.href) ? 'noreferrer' : undefined}>
              {a.label.toUpperCase()}
            </a>
          </li>
        ))}
      </ul>
      <div className="j-actions">
        {home.cvUrl && <a className="j-btn j-btn-gold" href={home.cvUrl} target="_blank" rel="noreferrer">▼ DOWNLOAD CV</a>}
        {onRestart && <button type="button" className="j-btn" onClick={onRestart}>↺ RESTART</button>}
      </div>
    </>
  )
}

/** One checkpoint's RPG dialog box. Closed dialogs stay in the DOM but inert. */
export function CheckpointDialog({ cp, open, onRestart }) {
  const section = sectionOf(cp.section)
  const intro = cp.section === 'contact' ? 'JOURNEY COMPLETE!' : `${section.world}: ${section.label}`
  return (
    <section
      className={`j-dialog j-dialog-${cp.section}${open ? ' is-open' : ''}`}
      aria-label={`${section.world} ${section.label}`}
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
    >
      <TypeLine text={intro} />
      <div className="j-body">
        {cp.section === 'about' && <About data={cp.data} />}
        {cp.section === 'skills' && <Skills data={cp.data} />}
        {cp.section === 'experience' && <Job data={cp.data} index={cp.index} total={cp.total} />}
        {cp.section === 'projects' && <Project data={cp.data} index={cp.index} total={cp.total} />}
        {cp.section === 'contact' && <Contact data={cp.data} onRestart={onRestart} />}
      </div>
    </section>
  )
}
