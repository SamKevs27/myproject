import { useEffect, useState } from 'react'
import { usePortfolioContent } from '../context/PortfolioContentContext'

function SkillsPageEditor({ skillsPage, onSave, disabled }) {
  const [draft, setDraft] = useState(skillsPage)

  useEffect(() => {
    setDraft(skillsPage)
  }, [skillsPage])

  const updateHeader = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const updateSectionTitle = (sectionIndex, value) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) => (
        idx === sectionIndex ? { ...section, title: value } : section
      )),
    }))
  }

  const updateSectionItems = (sectionIndex, value) => {
    const items = value.split('\n').map((item) => item.trim()).filter(Boolean)
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section, idx) => (
        idx === sectionIndex ? { ...section, items } : section
      )),
    }))
  }

  const addSection = () => {
    setDraft((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), { title: '', items: [] }]
    }))
  }

  const removeSection = (sectionIndex) => {
    setDraft((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((_, idx) => idx !== sectionIndex)
    }))
  }

  return (
    <div className="admin-card">
      <h3 className="admin-subtitle">Skills Page</h3>
      <div className="admin-row">
        <input
          value={draft.sectionLabel || ''}
          onChange={(e) => updateHeader('sectionLabel', e.target.value)}
          placeholder="Section label"
        />
        <input
          value={draft.title || ''}
          onChange={(e) => updateHeader('title', e.target.value)}
          placeholder="Title"
        />
      </div>
      <textarea
        className="admin-json"
        style={{ minHeight: '80px' }}
        value={draft.subtitle || ''}
        onChange={(e) => updateHeader('subtitle', e.target.value)}
        placeholder="Subtitle"
      />
      <div className="admin-list">
        {(draft.sections || []).map((section, sectionIndex) => (
          <div key={section.title || sectionIndex} className="admin-card admin-card-nested">
            <div className="admin-row">
              <input
                value={section.title || ''}
                onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                placeholder="Section title"
              />
              <button type="button" className="btn btn-outline" onClick={() => removeSection(sectionIndex)} disabled={disabled}>Delete</button>
            </div>
            <textarea
              className="admin-json"
              style={{ minHeight: '160px' }}
              value={(section.items || []).join('\n')}
              onChange={(e) => updateSectionItems(sectionIndex, e.target.value)}
              placeholder="One item per line"
            />
          </div>
        ))}
        <button type="button" className="btn btn-outline" onClick={addSection} disabled={disabled} style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
          + Add Section
        </button>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onSave(draft)} disabled={disabled}>
        Save Skills Page
      </button>
    </div>
  )
}

function JsonEditor({ title, value, onSave, disabled }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setText(JSON.stringify(value, null, 2))
  }, [value])

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(text)
      setError('')
      await onSave(parsed)
    } catch {
      setError('Invalid JSON. Please fix formatting before saving.')
    }
  }

  return (
    <div className="admin-card">
      <h3 className="admin-subtitle">{title}</h3>
      <textarea className="admin-json" value={text} onChange={(e) => setText(e.target.value)} />
      {error && <p className="admin-error">{error}</p>}
      <button type="button" className="btn btn-primary" onClick={handleSave} disabled={disabled}>Save {title}</button>
    </div>
  )
}

function ProjectsEditor({ projects, onCreate, onUpdate, onDelete, disabled }) {
  const [draft, setDraft] = useState({ num: '', title: '', desc: '', tech: '', link: '#' })

  return (
    <div className="admin-card">
      <h3 className="admin-subtitle">Projects</h3>
      <div className="admin-list">
        {projects.map((project) => (
          <div key={project.id} className="admin-stack">
            <div className="admin-row">
              <input value={project.num || ''} onChange={(e) => onUpdate(project.id, { num: e.target.value })} placeholder="Number" />
              <input value={project.title || ''} onChange={(e) => onUpdate(project.id, { title: e.target.value })} placeholder="Title" />
              <button type="button" className="btn btn-outline" onClick={() => onDelete(project)} disabled={disabled}>Delete</button>
            </div>
            <div className="admin-row">
              <input value={project.link || ''} onChange={(e) => onUpdate(project.id, { link: e.target.value })} placeholder="Link" />
              <input
                value={(project.tech || []).join(', ')}
                onChange={(e) => onUpdate(project.id, {
                  tech: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                })}
                placeholder="Tech (comma separated)"
              />
            </div>
            <textarea value={project.desc || ''} onChange={(e) => onUpdate(project.id, { desc: e.target.value })} placeholder="Description" />
          </div>
        ))}
      </div>

      <div className="admin-stack">
        <div className="admin-row">
          <input value={draft.num} onChange={(e) => setDraft((prev) => ({ ...prev, num: e.target.value }))} placeholder="Number" />
          <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" />
        </div>
        <div className="admin-row">
          <input value={draft.link} onChange={(e) => setDraft((prev) => ({ ...prev, link: e.target.value }))} placeholder="Link" />
          <input value={draft.tech} onChange={(e) => setDraft((prev) => ({ ...prev, tech: e.target.value }))} placeholder="Tech (comma separated)" />
        </div>
        <textarea value={draft.desc} onChange={(e) => setDraft((prev) => ({ ...prev, desc: e.target.value }))} placeholder="Description" />
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || !draft.title.trim()}
          onClick={async () => {
            await onCreate({
              ...draft,
              tech: draft.tech.split(',').map((item) => item.trim()).filter(Boolean),
            })
            setDraft({ num: '', title: '', desc: '', tech: '', link: '#' })
          }}
        >
          Add Project
        </button>
      </div>
    </div>
  )
}

function ExperienceEditor({ experience, onCreate, onUpdate, onDelete, disabled }) {
  const [draft, setDraft] = useState({ role: '', company: '', period: '', desc: '' })

  return (
    <div className="admin-card">
      <h3 className="admin-subtitle">Experience</h3>
      <div className="admin-list">
        {experience.map((item) => (
          <div key={item.id} className="admin-stack">
            <div className="admin-row">
              <input value={item.role || ''} onChange={(e) => onUpdate(item.id, { role: e.target.value })} placeholder="Role" />
              <input value={item.company || ''} onChange={(e) => onUpdate(item.id, { company: e.target.value })} placeholder="Company" />
              <input value={item.period || ''} onChange={(e) => onUpdate(item.id, { period: e.target.value })} placeholder="Period" />
              <button type="button" className="btn btn-outline" onClick={() => onDelete(item.id)} disabled={disabled}>Delete</button>
            </div>
            <textarea value={item.desc || ''} onChange={(e) => onUpdate(item.id, { desc: e.target.value })} placeholder="Description" />
          </div>
        ))}
      </div>

      <div className="admin-stack">
        <div className="admin-row">
          <input value={draft.role} onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value }))} placeholder="Role" />
          <input value={draft.company} onChange={(e) => setDraft((prev) => ({ ...prev, company: e.target.value }))} placeholder="Company" />
          <input value={draft.period} onChange={(e) => setDraft((prev) => ({ ...prev, period: e.target.value }))} placeholder="Period" />
        </div>
        <textarea value={draft.desc} onChange={(e) => setDraft((prev) => ({ ...prev, desc: e.target.value }))} placeholder="Description" />
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || !draft.role.trim()}
          onClick={async () => {
            await onCreate(draft)
            setDraft({ role: '', company: '', period: '', desc: '' })
          }}
        >
          Add Experience
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  const {
    home,
    about,
    contact,
    skillsPage,
    projects,
    experience,
    loading,
    saving,
    error,
    hasFirebaseConfig,
    updateSingleton,
    createListItem,
    updateListItem,
    deleteListItem,
  } = usePortfolioContent()

  if (loading) {
    return (
      <section className="section page-section" id="admin">
        <div className="section-inner"><p>Loading content...</p></div>
      </section>
    )
  }

  return (
    <section className="section page-section" id="admin">
      <div className="section-inner admin-inner">
        <span className="section-label">Content Manager</span>
        <h2 className="section-title">Admin CRUD</h2>
        <p className="contact-sub">Edit your website content in one place. Changes save to Firestore.</p>

        {!hasFirebaseConfig && <p className="admin-warning">Firebase is not configured.</p>}
        {!!error && <p className="admin-error">{error}</p>}
        {saving && <p className="admin-saving">Saving...</p>}

        <JsonEditor title="Home" value={home} onSave={(payload) => updateSingleton('home', payload)} disabled={saving || !hasFirebaseConfig} />
        <JsonEditor title="About" value={about} onSave={(payload) => updateSingleton('about', payload)} disabled={saving || !hasFirebaseConfig} />
        <JsonEditor title="Contact" value={contact} onSave={(payload) => updateSingleton('contact', payload)} disabled={saving || !hasFirebaseConfig} />
        <SkillsPageEditor
          skillsPage={skillsPage}
          onSave={(payload) => updateSingleton('skillsPage', payload)}
          disabled={saving || !hasFirebaseConfig}
        />

        <ProjectsEditor
          projects={projects}
          disabled={saving || !hasFirebaseConfig}
          onCreate={(payload) => createListItem('projects', { ...payload, order: projects.length })}
          onUpdate={(id, payload) => updateListItem('projects', id, payload)}
          onDelete={(project) => deleteListItem('projects', project.id, project)}
        />

        <ExperienceEditor
          experience={experience}
          disabled={saving || !hasFirebaseConfig}
          onCreate={(payload) => createListItem('experience', { ...payload, order: experience.length })}
          onUpdate={(id, payload) => updateListItem('experience', id, payload)}
          onDelete={(id) => deleteListItem('experience', id)}
        />
      </div>
    </section>
  )
}
