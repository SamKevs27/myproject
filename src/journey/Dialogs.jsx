import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PRIVATE_MARK, categoryOf, hasProjectLink, linkLabel } from '../lib/projects'
import { spriteDataUrl } from './renderSprite'
import { ART_AI, ART_DESIGN, ART_LOCK, ART_MOBILE, ART_WEB } from './sprites/cardArt'

const external = (href = '') => /^https?:/i.test(href)
const GEMS = ['#f8c838', '#3fae3a', '#e03c28', '#5aa8f0', '#c06aff', '#fcfcfc', '#b8682a']
const ART = { ai: ART_AI, design: ART_DESIGN, mobile: ART_MOBILE, web: ART_WEB }

/* ---------- helpers ---------- */

function TypeLine({ text, as = 'h2' }) {
  const Tag = as
  return <Tag className="j-type" style={{ '--n': text.length }}>{text}</Tag>
}

function Bullets({ text = '' }) {
  const lines = text.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
  if (!lines.length) return null
  return <ul className="j-list">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
}

/* ---------- Sam's speech bubble ---------- */

export function SpeechBubble({ lines, index, total, onNext }) {
  const width = Math.max(...lines.map((l) => l.length))
  return (
    <button type="button" className="j-bubble" style={{ '--w': width }} onClick={onNext} aria-live="polite">
      <span className="j-bubble-name">SAMUEL</span>
      {lines.map((line, i) => <span key={`${index}-${i}`} className="j-bubble-line">{line}</span>)}
      <span className="j-bubble-next" aria-hidden="true">{index + 1}/{total} {index + 1 < total ? '▼' : '✕'}</span>
    </button>
  )
}

/* ---------- panels ---------- */

export function SkillPanel({ group, index, total }) {
  return (
    <section className="j-dialog is-open" aria-label={`Skill ${index + 1} of ${total}: ${group.title}`}>
      <TypeLine key={group.title} text={`SKILL ${index + 1}/${total}: ${group.title.toUpperCase()}`} />
      <ul className="j-slots">
        {group.items.map((item, i) => (
          <li key={item} className="j-slot" style={{ '--i': i }}>
            <span className="j-gem" style={{ '--gem': GEMS[index % GEMS.length] }} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LedgePanel({ entry, index, total }) {
  return (
    <section className="j-dialog is-open" aria-label={`${entry.role} at ${entry.company}`}>
      <TypeLine key={entry.id} text={`JUMP ${index + 1}/${total}: ${entry.type === 'education' ? 'EDUCATION' : 'EXPERIENCE'}`} />
      <h3 className="j-heading">{entry.role}</h3>
      <p className="j-sub">{entry.company}{entry.period ? ` / ${entry.period}` : ''}</p>
      <Bullets text={entry.desc} />
    </section>
  )
}

export function ContactPanel({ data, onRestart }) {
  const { contact = {}, home = {} } = data
  const actions = contact.actions || []
  return (
    <section className="j-dialog is-open" aria-label="Contact">
      <TypeLine text="JOURNEY COMPLETE!" />
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
    </section>
  )
}

/* ---------- project trading cards ---------- */

function cardInfo(project) {
  const isPrivate = PRIVATE_MARK.test(project.title || '')
  const category = categoryOf(project)
  return {
    isPrivate,
    category,
    title: (project.title || '').replace(PRIVATE_MARK, ''),
    meta: [project.role, project.year].filter(Boolean).join(', '),
    tier: project.year ? 'gold' : isPrivate ? 'violet' : 'stone',
    art: spriteDataUrl(isPrivate ? ART_LOCK : ART[category.key]),
  }
}

export function ProjectCard({ project, index, onOpen, style, cardRef }) {
  const info = cardInfo(project)
  return (
    <button
      type="button"
      ref={cardRef}
      className={`tc tc-${info.tier}`}
      style={style}
      onClick={() => onOpen(index)}
      aria-label={`${info.title}: open card`}
    >
      <span className="tc-banner">
        <span className="tc-name">{info.title}</span>
        <span className="tc-num">{index + 1}</span>
      </span>
      <span className="tc-art"><img src={info.art} alt="" /></span>
      <span className="tc-icons">
        <span className="tc-chip">{info.category.label}</span>
        {info.isPrivate && <span className="tc-chip">PRIVATE</span>}
      </span>
      <span className="tc-text">{info.meta || project.desc}</span>
    </button>
  )
}

/**
 * Cards fly out of the chest (from `origin`, a screen point) into a grid.
 * Each card starts at the chest and transitions to its slot, staggered.
 */
export function CardGallery({ projects, origin, onOpen, onClose }) {
  const refs = useRef([])
  const [dealt, setDealt] = useState(false)

  // measure each card's slot, park it at the chest, then let it fly home
  useLayoutEffect(() => {
    refs.current.forEach((el) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--dx', `${origin.x - (r.left + r.width / 2)}px`)
      el.style.setProperty('--dy', `${origin.y - (r.top + r.height / 2)}px`)
    })
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setDealt(true))
    })
    return () => cancelAnimationFrame(id)
  }, [origin, projects])

  return (
    <div className="j-gallery" role="dialog" aria-modal="true" aria-label="Projects from the treasure chest">
      <div className="j-gallery-head">
        <h2 className="j-type" style={{ '--n': 14 }}>TREASURE FOUND!</h2>
        <p>{projects.length} project cards. Pick one to read it.</p>
        <button type="button" className="j-btn j-btn-small" onClick={onClose}>✕ CLOSE</button>
      </div>
      <div className={`j-cards${dealt ? ' is-dealt' : ''}`}>
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id || i}
            project={project}
            index={i}
            onOpen={onOpen}
            cardRef={(el) => { refs.current[i] = el }}
            style={{ '--i': i }}
          />
        ))}
      </div>
    </div>
  )
}

export function CardModal({ project, index, onClose }) {
  const info = cardInfo(project)
  const hasLink = hasProjectLink(project.link)
  const closeRef = useRef(null)
  useEffect(() => { closeRef.current?.focus() }, [])
  return (
    <div className="j-modal" role="dialog" aria-modal="true" aria-label={info.title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <article className={`tc tc-big tc-${info.tier}`}>
        <span className="tc-banner">
          <span className="tc-name">{info.title}</span>
          <span className="tc-num">{index + 1}</span>
        </span>
        <span className="tc-art"><img src={info.art} alt="" /></span>
        <span className="tc-icons">
          <span className="tc-chip">{info.category.label}</span>
          {info.isPrivate && <span className="tc-chip">PRIVATE CLIENT WORK</span>}
        </span>
        <div className="tc-text">
          {info.meta && <p className="tc-meta">{info.meta}</p>}
          <p>{project.desc}</p>
          {(project.tech || []).length > 0 && <ul className="j-tags">{project.tech.map((t) => <li key={t}>{t}</li>)}</ul>}
        </div>
        <div className="tc-actions">
          {hasLink && (
            <a className="j-btn j-btn-gold" href={project.link} target={external(project.link) ? '_blank' : undefined} rel={external(project.link) ? 'noreferrer' : undefined}>
              ▶ {linkLabel(project.link).toUpperCase()}
            </a>
          )}
          <button ref={closeRef} type="button" className="j-btn" onClick={onClose}>✕ BACK</button>
        </div>
      </article>
    </div>
  )
}

/* ---------- everything, as plain content (reduced motion + screen readers) ---------- */

export function FullContent({ world, about, onOpenCard, onRestart, className, plain = false }) {
  const { contact = {} } = world.castle.data
  return (
    <main className={className}>
      <section className="j-dialog is-open" aria-label="About Samuel">
        <TypeLine text="WORLD 1-1: MEET SAM" />
        {(about.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
      </section>
      {world.blocks.map((b) => <SkillPanel key={b.id} group={b.group} index={b.index} total={world.blocks.length} />)}
      <section className="j-dialog is-open" aria-label="Projects">
        <TypeLine text="WORLD 1-3: PROJECTS" />
        {plain ? (
          <ul>
            {world.chest.projects.map((project) => (
              <li key={project.id}>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                {(project.tech || []).length > 0 && <p>{project.tech.join(', ')}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="j-cards is-dealt is-static">
            {world.chest.projects.map((project, i) => (
              <ProjectCard key={project.id || i} project={project} index={i} onOpen={onOpenCard} />
            ))}
          </div>
        )}
      </section>
      {world.platforms.map((p) => <LedgePanel key={p.id} entry={p.entry} index={p.index} total={world.platforms.length} />)}
      {plain ? (
        <section aria-label="Contact">
          <h2>Contact</h2>
          {contact.subtitle && <p>{contact.subtitle}</p>}
          <ul>{(contact.actions || []).map((a) => <li key={a.href}>{a.label}: {a.href.replace(/^mailto:/, '')}</li>)}</ul>
        </section>
      ) : (
        <ContactPanel data={world.castle.data} onRestart={onRestart} />
      )}
    </main>
  )
}
