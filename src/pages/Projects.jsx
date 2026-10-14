import { useState } from 'react'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import StretchText from '../components/StretchText'
import ProjectGlyph from '../components/ProjectGlyph'
import { useInView } from '../hooks/useInView'
import SectionBackground from '../components/SectionBackground'

const PRIVATE_MARK = /\s*\(classified\)\s*$/i

// Categories are read from each project's tags; first match wins.
const CATEGORIES = [
  { key: 'ai', label: 'AI', match: /^(ai|mediapipe|machine learning|computer vision)$/i },
  { key: 'design', label: 'UI/UX', match: /^(ui\/ux|prototype|figma)$/i },
  { key: 'mobile', label: 'Mobile', match: /^(mobile|flutter|dart)$/i },
  { key: 'web', label: 'Web', match: /^(web|javascript|react|next\.js|responsive design)$/i },
]

function categoryOf(project) {
  const tags = project.tech || []
  return CATEGORIES.find((c) => tags.some((t) => c.match.test(t))) || CATEGORIES.at(-1)
}

function hasProjectLink(link = '') {
  const value = link.trim()
  return Boolean(value) && value !== '#'
}

// Name the link by what it opens, so visitors know what they'll get.
function linkLabel(link) {
  if (/github\.com|gitlab\.com/i.test(link)) return 'View code'
  if (/figma\.com/i.test(link)) return 'View prototype'
  return 'Visit site'
}

function ProjectCard({ project, featured, index }) {
  const category = categoryOf(project)
  const hasLink = hasProjectLink(project.link)
  const isPrivate = PRIVATE_MARK.test(project.title || '')
  const title = (project.title || '').replace(PRIVATE_MARK, '')
  const meta = [project.role, project.year].filter(Boolean).join(', ')
  const external = hasLink && /^https?:/i.test(project.link)

  return (
    <article className={`pc${featured ? ' pc-featured' : ''}${hasLink ? ' has-link' : ''}`} data-cat={category.key} style={{ '--i': index }}>
      <div className="pc-art">
        {project.image
          ? <img src={project.image} alt={`${title} screenshot`} className="pc-thumb" loading="lazy" />
          : <ProjectGlyph kind={category.key} />}
        <span className="pc-cat">{category.label}</span>
      </div>
      <div className="pc-body">
        <h3 className="pc-title">
          {hasLink ? (
            <a href={project.link} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{title}</a>
          ) : title}
        </h3>
        {meta && <p className="pc-meta">{meta}</p>}
        <p className="pc-desc">{project.desc}</p>
        {(project.tech || []).length > 0 && (
          <ul className="pc-tech">
            {project.tech.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        <div className="pc-foot">
          {hasLink && <span className="pc-action" aria-hidden="true">{linkLabel(project.link)}</span>}
          {!hasLink && isPrivate && <span className="pc-private">Private client work</span>}
        </div>
      </div>
    </article>
  )
}

export default function Projects() {
  const { projects: items } = usePortfolioContent()
  const [filter, setFilter] = useState('all')
  const [gridRef, gridInView] = useInView({ threshold: 0.05 })

  const projects = [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, projects.filter((p) => categoryOf(p).key === c.key).length]))
  const shown = filter === 'all' ? projects : projects.filter((p) => categoryOf(p).key === filter)
  // Projects with a year and role carry the most context, so they lead as large cards.
  const featured = shown.filter((p) => p.year)
  const rest = shown.filter((p) => !p.year)

  return (
    <section className="section page-section" id="projects">
      <SectionBackground variant="blueprint" />
      <div className="section-inner">
        <div className="title-row">
          <StretchText as="h2" className="section-title" text="Projects" />
          <span className="title-count">{projects.length}</span>
        </div>

        <div className="proj-filters" role="group" aria-label="Filter projects">
          <button type="button" className={filter === 'all' ? 'is-active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All <span>{projects.length}</span>
          </button>
          {CATEGORIES.filter((c) => counts[c.key]).map((c) => (
            <button key={c.key} type="button" data-cat={c.key} className={filter === c.key ? 'is-active' : ''} aria-pressed={filter === c.key} onClick={() => setFilter(c.key)}>
              {c.label} <span>{counts[c.key]}</span>
            </button>
          ))}
        </div>

        <div ref={gridRef} key={filter} className={`proj-layout${gridInView ? ' is-in' : ''}`}>
          {featured.length > 0 && (
            <div className="proj-featured">
              {featured.map((p, i) => <ProjectCard key={p.id || i} project={p} featured index={i} />)}
            </div>
          )}
          {rest.length > 0 && (
            <div className="proj-grid">
              {rest.map((p, i) => <ProjectCard key={p.id || i} project={p} index={i + featured.length} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
