import { useCallback, useEffect, useRef, useState } from 'react'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { ADMIN_EMAIL, isAdminUser, signInWithGoogle, signOutAdmin, useAuthUser } from '../firebase/auth'
import { RECOMMENDED_UPDATES } from './admin/recommendedUpdates'
import StretchText from '../components/StretchText'
import ScrambleText from '../components/ScrambleText'
import SectionBackground from '../components/SectionBackground'
import { spawnBurst } from '../components/burst'
import { prefersReducedMotion } from '../hooks/useInView'

const SECTION_TARGETS = [
  { value: '/about', label: 'About section' },
  { value: '/skills', label: 'Skills section' },
  { value: '/projects', label: 'Projects section' },
  { value: '/experience', label: 'Experience section' },
  { value: '/contact', label: 'Contact section' },
]

const TABS = [
  { id: 'home', label: 'Home', description: 'The hero area at the very top of your site.', anchor: 'hero' },
  { id: 'about', label: 'About', description: 'Your story, quick stats and personal details.', anchor: 'about' },
  { id: 'skills', label: 'Skills', description: 'Skill groups shown as cards.', anchor: 'skills' },
  { id: 'projects', label: 'Projects', description: 'Work you want to show off. Use the arrows to reorder.', anchor: 'projects' },
  { id: 'experience', label: 'Experience', description: 'Your work history timeline.', anchor: 'experience' },
  { id: 'contact', label: 'Contact', description: 'How people can reach you.', anchor: 'contact' },
]

/* ---------- helpers ---------- */

function isEmptyEntry(value) {
  if (typeof value === 'string') return !value.trim()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).every((v) => (
      v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0)
    ))
  }
  return false
}

// Drops blank rows from lists so empty "Add" rows never get saved.
function cleanValue(value) {
  if (Array.isArray(value)) return value.map(cleanValue).filter((v) => !isEmptyEntry(v))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanValue(v)]))
  }
  return value
}

// eslint-disable-next-line no-unused-vars
function toPayload({ id, order, ...rest }) {
  return cleanValue(rest)
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function hasChanges(draft, saved) {
  return stableStringify(toPayload(draft)) !== stableStringify(toPayload(saved))
}

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function useSaveStatus() {
  const [status, setStatus] = useState('idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const run = async (action) => {
    const ok = await action()
    setStatus(ok ? 'saved' : 'error')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('idle'), 2500)
    return ok
  }

  return [status, run]
}

/* ---------- form primitives ---------- */

function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span className="admin-label">{label}</span>
      {children}
      {hint && <span className="admin-hint">{hint}</span>}
    </label>
  )
}

function FieldGroup({ label, hint, children }) {
  return (
    <div className="admin-field">
      <span className="admin-label">{label}</span>
      {hint && <span className="admin-hint">{hint}</span>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, ...props }) {
  return <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} {...props} />
}

function TextArea({ value, onChange, rows = 3, ...props }) {
  return <textarea rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} {...props} />
}

function RowControls({ index, length, onMove, onRemove, removeLabel = 'Remove' }) {
  return (
    <div className="admin-row-controls">
      <button type="button" className="admin-icon-btn" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label="Move up" title="Move up">↑</button>
      <button type="button" className="admin-icon-btn" onClick={() => onMove(index, index + 1)} disabled={index === length - 1} aria-label="Move down" title="Move down">↓</button>
      <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => onRemove(index)} aria-label={removeLabel} title={removeLabel}>✕</button>
    </div>
  )
}

function StringListEditor({ items = [], onChange, placeholder, addLabel = 'Add item', multiline = false }) {
  const update = (index, value) => onChange(items.map((item, idx) => (idx === index ? value : item)))
  const remove = (index) => onChange(items.filter((_, idx) => idx !== index))
  const reorder = (from, to) => onChange(move(items, from, to))

  return (
    <div className="admin-list">
      {items.map((item, index) => (
        <div key={index} className="admin-list-row">
          {multiline
            ? <TextArea value={item} onChange={(v) => update(index, v)} placeholder={placeholder} rows={4} />
            : <TextInput value={item} onChange={(v) => update(index, v)} placeholder={placeholder} />}
          <RowControls index={index} length={items.length} onMove={reorder} onRemove={remove} />
        </div>
      ))}
      <button type="button" className="admin-add-btn" onClick={() => onChange([...items, ''])}>+ {addLabel}</button>
    </div>
  )
}

// fields: [{ key, label, placeholder, type?: 'text' | 'exclusive', on? }]
// 'exclusive' renders a radio-like toggle where only one row can be selected.
function ObjectListEditor({ items = [], onChange, fields, addLabel = 'Add item' }) {
  const update = (index, key, value) => onChange(items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)))
  const setExclusive = (index, field) => onChange(items.map((item, idx) => ({
    ...item,
    [field.key]: idx === index ? field.on : '',
  })))
  const remove = (index) => onChange(items.filter((_, idx) => idx !== index))
  const reorder = (from, to) => onChange(move(items, from, to))
  const blank = Object.fromEntries(fields.map((f) => [f.key, '']))

  return (
    <div className="admin-list">
      {items.map((item, index) => (
        <div key={index} className="admin-list-row">
          <div className="admin-inline-fields">
            {fields.map((field) => (
              field.type === 'exclusive' ? (
                <label key={field.key} className="admin-toggle">
                  <input
                    type="radio"
                    checked={item[field.key] === field.on}
                    onChange={() => setExclusive(index, field)}
                  />
                  <span>{field.label}</span>
                </label>
              ) : (
                <label key={field.key} className="admin-mini-field">
                  <span>{field.label}</span>
                  <TextInput value={item[field.key]} onChange={(v) => update(index, field.key, v)} placeholder={field.placeholder} />
                </label>
              )
            ))}
          </div>
          <RowControls index={index} length={items.length} onMove={reorder} onRemove={remove} />
        </div>
      ))}
      <button type="button" className="admin-add-btn" onClick={() => onChange([...items, blank])}>+ {addLabel}</button>
    </div>
  )
}

function TagInput({ tags = [], onChange, placeholder = 'Type and press Enter' }) {
  const [text, setText] = useState('')

  const commit = () => {
    const value = text.trim().replace(/,$/, '')
    if (value && !tags.includes(value)) onChange([...tags, value])
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !text && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="admin-tags">
      {tags.map((tag) => (
        <span key={tag} className="admin-tag">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>×</button>
        </span>
      ))}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length ? '' : placeholder}
      />
    </div>
  )
}

function LinkTargetSelect({ value, onChange }) {
  const isSection = SECTION_TARGETS.some((t) => t.value === value)
  const [custom, setCustom] = useState(!!value && !isSection)

  return (
    <div className="admin-link-target">
      <select
        value={custom ? '__custom' : (value || '')}
        onChange={(e) => {
          if (e.target.value === '__custom') {
            setCustom(true)
            onChange('')
          } else {
            setCustom(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="" disabled>Choose where it goes…</option>
        {SECTION_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        <option value="__custom">Custom link…</option>
      </select>
      {custom && <TextInput value={value} onChange={onChange} placeholder="https://…" />}
    </div>
  )
}

function ButtonEditor({ label, value = {}, onChange }) {
  return (
    <FieldGroup label={label}>
      <div className="admin-grid-2">
        <label className="admin-mini-field">
          <span>Button text</span>
          <TextInput value={value.label} onChange={(v) => onChange({ ...value, label: v })} placeholder="e.g. View Work" />
        </label>
        <label className="admin-mini-field">
          <span>Goes to</span>
          <LinkTargetSelect value={value.to} onChange={(v) => onChange({ ...value, to: v })} />
        </label>
      </div>
    </FieldGroup>
  )
}

function SaveBar({ dirty, disabled, status, onSave, onDiscard, saveLabel = 'Save changes' }) {
  const saveRef = useRef(null)

  // A successful save throws a few neon sparks off the Save button.
  useEffect(() => {
    const btn = saveRef.current
    if (status !== 'saved' || !btn || prefersReducedMotion()) return undefined
    const r = btn.getBoundingClientRect()
    const timers = [0, 120, 240].map((delay, i) => setTimeout(() => {
      spawnBurst(r.left + r.width * (0.3 + i * 0.2), r.top + r.height / 2)
    }, delay))
    return () => timers.forEach(clearTimeout)
  }, [status])

  let message = 'All changes saved'
  if (status === 'saved') message = 'Saved ✓'
  else if (status === 'error') message = 'Could not save — see error above'
  else if (dirty) message = 'You have unsaved changes'

  return (
    <div className={`admin-savebar${dirty ? ' is-dirty' : ''}`}>
      <span className={`admin-savebar-msg admin-status-${dirty && status === 'idle' ? 'dirty' : status}`}>{message}</span>
      <div className="admin-savebar-actions">
        {onDiscard && (
          <button type="button" className="btn btn-outline" onClick={onDiscard} disabled={!dirty || disabled}>Discard</button>
        )}
        <button ref={saveRef} type="button" className="btn btn-primary" onClick={onSave} disabled={!dirty || disabled}>{saveLabel}</button>
      </div>
    </div>
  )
}

/* ---------- singleton editors (Home / About / Skills / Contact) ---------- */

function SingletonEditor({ tab, value, onSave, disabled, onDirtyChange, children }) {
  const [draft, setDraft] = useState(value)
  const [status, runSave] = useSaveStatus()
  const dirty = hasChanges(draft, value)

  useEffect(() => {
    onDirtyChange(tab, dirty)
  }, [tab, dirty, onDirtyChange])

  const setField = (key, fieldValue) => setDraft((prev) => ({ ...prev, [key]: fieldValue }))

  return (
    <div className="admin-panel-body">
      <div className="admin-card">{children(draft, setField)}</div>
      <SaveBar
        dirty={dirty}
        disabled={disabled}
        status={status}
        onSave={() => runSave(() => onSave(toPayload(draft)))}
        onDiscard={() => setDraft(value)}
      />
    </div>
  )
}

function HomeFields(draft, setField) {
  return (
    <>
      <div className="admin-grid-2">
        <Field label="Your name" hint="Shown bottom-left of the hero.">
          <TextInput value={draft.barName} onChange={(v) => setField('barName', v)} placeholder="Samuel Kevin" />
        </Field>
        <Field label="Your role" hint="Shown under your name.">
          <TextInput value={draft.barRole} onChange={(v) => setField('barRole', v)} placeholder="Frontend Developer" />
        </Field>
      </div>
      <div className="admin-grid-2">
        <Field label="Big background name" hint="The huge text behind your portrait.">
          <TextInput value={draft.heroDisplayName} onChange={(v) => setField('heroDisplayName', v)} placeholder="SAMUEL" />
        </Field>
        <Field label="Top-right label" hint="Small tagline in the top corner.">
          <TextInput value={draft.topLabel} onChange={(v) => setField('topLabel', v)} placeholder="Based in Jakarta" />
        </Field>
      </div>
      <FieldGroup label="Highlight tags" hint="Short words shown in the bottom bar. Press Enter after each one.">
        <TagInput tags={draft.barTags} onChange={(v) => setField('barTags', v)} placeholder="e.g. Design, Build, Ship" />
      </FieldGroup>
      <ButtonEditor label="Main button" value={draft.primaryCta} onChange={(v) => setField('primaryCta', v)} />
      <ButtonEditor label="Second button" value={draft.secondaryCta} onChange={(v) => setField('secondaryCta', v)} />
      <Field label="CV / résumé link (optional)" hint="Adds a “Download CV” button to the hero and contact section. Paste a Google Drive / PDF link.">
        <TextInput value={draft.cvUrl} onChange={(v) => setField('cvUrl', v)} placeholder="https://drive.google.com/…" />
      </Field>
      <Field label="Photo description" hint="Read aloud by screen readers. Describe the portrait briefly.">
        <TextInput value={draft.portraitAlt} onChange={(v) => setField('portraitAlt', v)} placeholder="Portrait of Samuel smiling" />
      </Field>
    </>
  )
}

function AboutFields(draft, setField) {
  return (
    <>
      <div className="admin-grid-2">
        <Field label="Small label" hint="Appears above the heading.">
          <TextInput value={draft.sectionLabel} onChange={(v) => setField('sectionLabel', v)} placeholder="About me" />
        </Field>
        <Field label="Heading" hint="Press Enter to break onto a new line.">
          <TextArea value={draft.title} onChange={(v) => setField('title', v)} rows={2} placeholder="Building things that feel good" />
        </Field>
      </div>
      <FieldGroup label="Paragraphs" hint="Each box is one paragraph.">
        <StringListEditor items={draft.paragraphs} onChange={(v) => setField('paragraphs', v)} placeholder="Tell your story…" addLabel="Add paragraph" multiline />
      </FieldGroup>
      <FieldGroup label="Stats" hint="Big numbers under your photo, e.g. “5+” / “Years experience”.">
        <ObjectListEditor
          items={draft.stats}
          onChange={(v) => setField('stats', v)}
          addLabel="Add stat"
          fields={[
            { key: 'value', label: 'Number', placeholder: '5+' },
            { key: 'label', label: 'Label', placeholder: 'Years experience' },
          ]}
        />
      </FieldGroup>
      <FieldGroup label="Details" hint="Small info chips, e.g. “Location” / “Jakarta”.">
        <ObjectListEditor
          items={draft.details}
          onChange={(v) => setField('details', v)}
          addLabel="Add detail"
          fields={[
            { key: 'key', label: 'Label', placeholder: 'Location' },
            { key: 'value', label: 'Value', placeholder: 'Jakarta, ID' },
          ]}
        />
      </FieldGroup>
      <ButtonEditor label="Button" value={draft.cta} onChange={(v) => setField('cta', v)} />
      <Field label="Photo description" hint="Read aloud by screen readers.">
        <TextInput value={draft.portraitAlt} onChange={(v) => setField('portraitAlt', v)} placeholder="Portrait" />
      </Field>
    </>
  )
}

function SkillsFields(draft, setField) {
  const sections = draft.sections || []
  const updateSection = (index, patch) => setField('sections', sections.map((s, idx) => (idx === index ? { ...s, ...patch } : s)))
  const reorder = (from, to) => setField('sections', move(sections, from, to))
  const remove = (index) => {
    const name = sections[index]?.title || 'this group'
    if (window.confirm(`Remove ${name}?`)) setField('sections', sections.filter((_, idx) => idx !== index))
  }

  return (
    <>
      <div className="admin-grid-2">
        <Field label="Small label">
          <TextInput value={draft.sectionLabel} onChange={(v) => setField('sectionLabel', v)} placeholder="Skills" />
        </Field>
        <Field label="Heading">
          <TextInput value={draft.title} onChange={(v) => setField('title', v)} placeholder="What I work with" />
        </Field>
      </div>
      <Field label="Intro text">
        <TextArea value={draft.subtitle} onChange={(v) => setField('subtitle', v)} placeholder="A short sentence about your toolkit" />
      </Field>
      <FieldGroup label="Skill groups" hint="Each group becomes a card on your site.">
        <div className="admin-list">
          {sections.map((section, index) => (
            <div key={index} className="admin-card admin-card-nested">
              <div className="admin-list-row">
                <label className="admin-mini-field admin-grow">
                  <span>Group name</span>
                  <TextInput value={section.title} onChange={(v) => updateSection(index, { title: v })} placeholder="e.g. Frontend" />
                </label>
                <RowControls index={index} length={sections.length} onMove={reorder} onRemove={remove} removeLabel="Remove group" />
              </div>
              <StringListEditor
                items={section.items}
                onChange={(v) => updateSection(index, { items: v })}
                placeholder="e.g. React"
                addLabel="Add skill"
              />
            </div>
          ))}
          <button type="button" className="admin-add-btn" onClick={() => setField('sections', [...sections, { title: '', items: [''] }])}>
            + Add skill group
          </button>
        </div>
      </FieldGroup>
    </>
  )
}

function ContactFields(draft, setField) {
  return (
    <>
      <div className="admin-grid-2">
        <Field label="Small label">
          <TextInput value={draft.sectionLabel} onChange={(v) => setField('sectionLabel', v)} placeholder="Contact" />
        </Field>
        <Field label="Heading" hint="Press Enter to break onto a new line.">
          <TextArea value={draft.title} onChange={(v) => setField('title', v)} rows={2} placeholder="Let's work together" />
        </Field>
      </div>
      <Field label="Intro text">
        <TextArea value={draft.subtitle} onChange={(v) => setField('subtitle', v)} placeholder="I'm open to new opportunities…" />
      </Field>
      <FieldGroup
        label="Contact links"
        hint="Icons are picked automatically from the link (email, WhatsApp, GitHub, LinkedIn, Instagram). Mark one as the main button — the rest show as icons."
      >
        <ObjectListEditor
          items={draft.actions}
          onChange={(v) => setField('actions', v)}
          addLabel="Add link"
          fields={[
            { key: 'label', label: 'Name', placeholder: 'Email me' },
            { key: 'href', label: 'Link', placeholder: 'mailto:you@example.com' },
            { key: 'variant', label: 'Main button', type: 'exclusive', on: 'primary' },
          ]}
        />
      </FieldGroup>
    </>
  )
}

/* ---------- collection editors (Projects / Experience) ---------- */

function ProjectFields({ draft, setField }) {
  return (
    <>
      <div className="admin-grid-project">
        <Field label="No.">
          <TextInput value={draft.num} onChange={(v) => setField('num', v)} placeholder="01" />
        </Field>
        <Field label="Project name">
          <TextInput value={draft.title} onChange={(v) => setField('title', v)} placeholder="My cool app" />
        </Field>
      </div>
      <Field label="Description">
        <TextArea value={draft.desc} onChange={(v) => setField('desc', v)} placeholder="What it is and what you did" />
      </Field>
      <div className="admin-grid-2">
        <Field label="Your role (optional)" hint="What you personally did.">
          <TextInput value={draft.role} onChange={(v) => setField('role', v)} placeholder="Lead mobile developer" />
        </Field>
        <Field label="Year (optional)">
          <TextInput value={draft.year} onChange={(v) => setField('year', v)} placeholder="2025" />
        </Field>
      </div>
      <Field label="Screenshot (optional)" hint="Image URL, or a file you put in public/projects/ (e.g. /projects/doggo.png). Landscape works best.">
        <TextInput value={draft.image} onChange={(v) => setField('image', v)} placeholder="/projects/my-app.png" />
      </Field>
      {draft.image && <img src={draft.image} alt="" className="admin-image-preview" />}
      <FieldGroup label="Tech used" hint="Press Enter after each one.">
        <TagInput tags={draft.tech} onChange={(v) => setField('tech', v)} placeholder="e.g. React, Firebase" />
      </FieldGroup>
      <Field label="Link (optional)" hint="Makes the project clickable.">
        <TextInput value={draft.link} onChange={(v) => setField('link', v)} placeholder="https://…" />
      </Field>
    </>
  )
}

function ExperienceFields({ draft, setField }) {
  return (
    <>
      <div className="admin-grid-2">
        <Field label="Role">
          <TextInput value={draft.role} onChange={(v) => setField('role', v)} placeholder="Frontend Developer" />
        </Field>
        <Field label="Company">
          <TextInput value={draft.company} onChange={(v) => setField('company', v)} placeholder="Acme Inc." />
        </Field>
      </div>
      <div className="admin-grid-2">
        <Field label="Period">
          <TextInput value={draft.period} onChange={(v) => setField('period', v)} placeholder="2022 — Present" />
        </Field>
        <Field label="Type">
          <select value={draft.type || 'work'} onChange={(e) => setField('type', e.target.value)}>
            <option value="work">Work</option>
            <option value="education">Education</option>
          </select>
        </Field>
      </div>
      <Field label="What you did" hint="Put each point on its own line and it shows as a bullet list. Aim for 2–3 points: what you built, the tech, and one result.">
        <TextArea value={draft.desc} onChange={(v) => setField('desc', v)} rows={5} placeholder={'Built a Flutter app for …\nIntegrated REST APIs with …\nCut stock-count time by …'} />
      </Field>
    </>
  )
}

function useItemDraft(initial) {
  const [draft, setDraft] = useState(initial)
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }))
  return { draft, setDraft, setField }
}

function CollectionItem({ item, index, length, fieldsComponent, summary, onMove, onUpdate, onDelete, disabled, onDirtyChange }) {
  const Fields = fieldsComponent
  const { draft, setDraft, setField } = useItemDraft(item)
  const [open, setOpen] = useState(false)
  const [status, runSave] = useSaveStatus()
  const dirty = hasChanges(draft, item)

  useEffect(() => {
    onDirtyChange(item.id, dirty)
    return () => onDirtyChange(item.id, false)
  }, [item.id, dirty, onDirtyChange])

  const { title, subtitle } = summary(draft)

  return (
    <div className={`admin-item${open ? ' is-open' : ''}`}>
      <div className="admin-item-head">
        <button type="button" className="admin-item-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="admin-item-caret">{open ? '▾' : '▸'}</span>
          <span className="admin-item-title">{title || <em>Untitled</em>}</span>
          {subtitle && <span className="admin-item-sub">{subtitle}</span>}
          {dirty && <span className="admin-dot" title="Unsaved changes" />}
        </button>
        <div className="admin-row-controls">
          <button type="button" className="admin-icon-btn" onClick={() => onMove(index, index - 1)} disabled={disabled || index === 0} aria-label="Move up" title="Move up">↑</button>
          <button type="button" className="admin-icon-btn" onClick={() => onMove(index, index + 1)} disabled={disabled || index === length - 1} aria-label="Move down" title="Move down">↓</button>
          <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => onDelete(item)} disabled={disabled} aria-label="Delete" title="Delete">✕</button>
        </div>
      </div>
      {open && (
        <div className="admin-item-body">
          <Fields draft={draft} setField={setField} />
          <SaveBar
            dirty={dirty}
            disabled={disabled}
            status={status}
            onSave={() => runSave(() => onUpdate(item.id, toPayload(draft)))}
            onDiscard={() => setDraft(item)}
          />
        </div>
      )}
    </div>
  )
}

function NewItemForm({ emptyItem, fieldsComponent, requiredKey, noun, onCreate, onCancel, disabled }) {
  const Fields = fieldsComponent
  const { draft, setField } = useItemDraft(emptyItem)

  return (
    <div className="admin-item is-open admin-item-new">
      <div className="admin-item-body">
        <h4 className="admin-new-title">New {noun}</h4>
        <Fields draft={draft} setField={setField} />
        <div className="admin-savebar-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={disabled || !String(draft[requiredKey] || '').trim()}
            onClick={async () => {
              if (await onCreate(toPayload(draft))) onCancel()
            }}
          >
            Add {noun}
          </button>
        </div>
      </div>
    </div>
  )
}

function CollectionEditor({ tab, items, noun, Fields, summary, emptyItem, requiredKey, onCreate, onUpdate, onDelete, disabled, onDirtyChange }) {
  const [adding, setAdding] = useState(false)
  const [dirtyIds, setDirtyIds] = useState({})
  const sorted = [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))

  const markItemDirty = useCallback((id, dirty) => {
    setDirtyIds((prev) => (!!prev[id] === dirty ? prev : { ...prev, [id]: dirty }))
  }, [])

  const anyDirty = Object.values(dirtyIds).some(Boolean)
  useEffect(() => {
    onDirtyChange(tab, anyDirty)
  }, [tab, anyDirty, onDirtyChange])

  const reorder = async (from, to) => {
    const next = move(sorted, from, to)
    for (const [idx, item] of next.entries()) {
      if (item.order !== idx) await onUpdate(item.id, { order: idx })
    }
  }

  const confirmDelete = (item) => {
    const name = summary(item).title || `this ${noun}`
    if (window.confirm(`Delete “${name}”? This can't be undone.`)) onDelete(item)
  }

  return (
    <div className="admin-panel-body">
      {sorted.length === 0 && !adding && <p className="admin-empty">No {noun}s yet.</p>}
      <div className="admin-list">
        {sorted.map((item, index) => (
          <CollectionItem
            key={item.id}
            item={item}
            index={index}
            length={sorted.length}
            fieldsComponent={Fields}
            summary={summary}
            onMove={reorder}
            onUpdate={onUpdate}
            onDelete={confirmDelete}
            disabled={disabled}
            onDirtyChange={markItemDirty}
          />
        ))}
      </div>
      {adding ? (
        <NewItemForm
          emptyItem={emptyItem}
          fieldsComponent={Fields}
          requiredKey={requiredKey}
          noun={noun}
          disabled={disabled}
          onCreate={(payload) => onCreate({ ...payload, order: sorted.length })}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="admin-add-btn admin-add-btn-lg" onClick={() => setAdding(true)} disabled={disabled}>
          + Add {noun}
        </button>
      )}
    </div>
  )
}

/* ---------- page ---------- */

function RecommendedUpdatesBanner({ content, api, disabled, onApplied }) {
  const [running, setRunning] = useState(false)
  const [failed, setFailed] = useState(false)
  const pending = RECOMMENDED_UPDATES.filter((u) => !u.isApplied(content))
  if (!pending.length) return null

  const applyAll = async () => {
    setRunning(true)
    setFailed(false)
    let ok = true
    for (const update of pending) {
      // Each update reads the latest content it was given; they touch separate fields.
      if (!(await update.apply(content, api))) ok = false
    }
    setRunning(false)
    setFailed(!ok)
    onApplied()
  }

  return (
    <div className="admin-banner admin-banner-info">
      <strong>{pending.length} recommended update{pending.length > 1 ? 's' : ''} from your site audit</strong>
      <ul>
        {pending.map((u) => <li key={u.id}>{u.label}</li>)}
      </ul>
      {failed && <p className="admin-banner-note">Some updates failed. Check the error above and try again.</p>}
      {disabled && !running && <p className="admin-banner-note">Save or discard your open edits first.</p>}
      <button type="button" className="btn btn-primary" onClick={applyAll} disabled={disabled || running}>
        {running ? 'Applying…' : 'Apply all'}
      </button>
    </div>
  )
}

function SignInScreen({ user, onSignIn, error }) {
  return (
    <section className="section page-section" id="admin">
      <SectionBackground variant="blueprint" />
      <span className="neon-sign admin-neon" aria-hidden="true">アクセス</span>
      <div className="section-inner admin-inner admin-signin">
        <ScrambleText className="section-label" text="Content Manager" />
        <StretchText as="h2" className="section-title admin-title" text="Sign in to edit" />
        {user ? (
          <>
            <p className="admin-panel-desc">
              <strong>{user.email}</strong> isn't allowed to edit this site{ADMIN_EMAIL ? ` — sign in as ${ADMIN_EMAIL}` : ''}.
            </p>
            <button type="button" className="btn btn-outline" onClick={signOutAdmin}>Use a different account</button>
          </>
        ) : (
          <>
            <p className="admin-panel-desc">Only the site owner can make changes.</p>
            <button type="button" className="btn btn-primary" onClick={onSignIn}>Sign in with Google</button>
          </>
        )}
        {error && <p className="admin-banner admin-banner-error">{error}</p>}
      </div>
    </section>
  )
}

export default function Admin() {
  const { user, ready } = useAuthUser()
  const [signInError, setSignInError] = useState('')

  if (!ready) {
    return (
      <section className="section page-section" id="admin">
        <div className="section-inner"><p>Checking sign-in…</p></div>
      </section>
    )
  }

  if (!isAdminUser(user)) {
    const handleSignIn = async () => {
      setSignInError('')
      try {
        await signInWithGoogle()
      } catch (err) {
        if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
          setSignInError('Google sign-in is not enabled yet. Turn it on in Firebase Console → Authentication → Sign-in method.')
        } else if (err?.code !== 'auth/popup-closed-by-user') {
          setSignInError(err?.message || 'Sign-in failed.')
        }
      }
    }
    return <SignInScreen user={user} onSignIn={handleSignIn} error={signInError} />
  }

  return <AdminEditor user={user} />
}

function AdminEditor({ user }) {
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

  const [activeTab, setActiveTab] = useState('home')
  const [dirtyTabs, setDirtyTabs] = useState({})
  const [revision, setRevision] = useState(0)

  const markDirty = useCallback((tab, dirty) => {
    setDirtyTabs((prev) => (!!prev[tab] === dirty ? prev : { ...prev, [tab]: dirty }))
  }, [])

  const anyDirty = Object.values(dirtyTabs).some(Boolean)
  useEffect(() => {
    if (!anyDirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [anyDirty])

  if (loading) {
    return (
      <section className="section page-section" id="admin">
        <div className="section-inner"><p>Loading content...</p></div>
      </section>
    )
  }

  const disabled = saving || !hasFirebaseConfig
  const current = TABS.find((t) => t.id === activeTab)

  const singleton = (tab, value, docId, renderFields) => (
    <SingletonEditor
      tab={tab}
      value={value}
      disabled={disabled}
      onDirtyChange={markDirty}
      onSave={(payload) => updateSingleton(docId, payload)}
    >
      {renderFields}
    </SingletonEditor>
  )

  // Every panel stays mounted (just hidden) so unsaved edits survive tab switches.
  const panels = {
    home: singleton('home', home, 'home', HomeFields),
    about: singleton('about', about, 'about', AboutFields),
    skills: singleton('skills', skillsPage, 'skillsPage', SkillsFields),
    contact: singleton('contact', contact, 'contact', ContactFields),
    projects: (
      <CollectionEditor
        tab="projects"
        items={projects}
        noun="project"
        Fields={ProjectFields}
        summary={(p) => ({ title: [p.num, p.title].filter(Boolean).join('  ·  '), subtitle: (p.tech || []).join(', ') })}
        emptyItem={{ num: '', title: '', desc: '', role: '', year: '', image: '', tech: [], link: '' }}
        requiredKey="title"
        disabled={disabled}
        onDirtyChange={markDirty}
        onCreate={(payload) => createListItem('projects', payload)}
        onUpdate={(id, payload) => updateListItem('projects', id, payload)}
        onDelete={(project) => deleteListItem('projects', project.id, project)}
      />
    ),
    experience: (
      <CollectionEditor
        tab="experience"
        items={experience}
        noun="role"
        Fields={ExperienceFields}
        summary={(e) => ({ title: [e.role, e.company].filter(Boolean).join(' @ '), subtitle: e.period })}
        emptyItem={{ role: '', company: '', period: '', type: 'work', desc: '' }}
        requiredKey="role"
        disabled={disabled}
        onDirtyChange={markDirty}
        onCreate={(payload) => createListItem('experience', payload)}
        onUpdate={(id, payload) => updateListItem('experience', id, payload)}
        onDelete={(item) => deleteListItem('experience', item.id)}
      />
    ),
  }

  return (
    <section className="section page-section" id="admin">
      <div className="section-inner admin-inner">
        <header className="admin-header">
          <div>
            <ScrambleText className="section-label" text="Content Manager" />
            <StretchText as="h2" className="section-title admin-title" text="Edit your site" />
          </div>
          <div className="admin-account">
            <span className={`admin-sync${saving ? ' is-saving' : ''}`}>
              {saving ? 'Saving…' : hasFirebaseConfig ? 'Connected' : 'Offline'}
            </span>
            <span className="admin-account-email">{user.email}</span>
            <button type="button" className="admin-link-btn" onClick={signOutAdmin}>Sign out</button>
          </div>
        </header>

        <RecommendedUpdatesBanner
          content={{ home, about, contact, skillsPage, projects, experience }}
          api={{ updateSingleton, createListItem, updateListItem }}
          disabled={disabled || anyDirty}
          onApplied={() => setRevision((r) => r + 1)}
        />

        {!hasFirebaseConfig && <p className="admin-banner admin-banner-warn">Firebase is not configured, so changes can't be saved.</p>}
        {!!error && <p className="admin-banner admin-banner-error">{error}</p>}

        <nav className="admin-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`admin-tab${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {dirtyTabs[tab.id] && <span className="admin-dot" title="Unsaved changes" />}
            </button>
          ))}
        </nav>

        <div className="admin-panel-head">
          <p className="admin-panel-desc">{current.description}</p>
          <a href={`/#${current.anchor}`} target="_blank" rel="noreferrer" className="admin-view-link">View on site ↗</a>
        </div>

        {TABS.map((tab) => (
          <div key={`${tab.id}-${revision}`} role="tabpanel" hidden={activeTab !== tab.id}>
            {panels[tab.id]}
          </div>
        ))}
      </div>
    </section>
  )
}
