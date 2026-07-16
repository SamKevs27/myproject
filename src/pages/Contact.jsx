import { useFadeIn } from '../hooks/useFadeIn'
import { usePortfolioContent } from '../context/PortfolioContentContext'

function isExternalLink(href = '') {
  return /^https?:\/\//i.test(href)
}

function getContactIconKind(href = '') {
  const value = href.toLowerCase()

  if (value.startsWith('mailto:')) return 'email'
  if (value.includes('wa.me') || value.includes('whatsapp')) return 'whatsapp'
  if (value.includes('github.com')) return 'github'
  if (value.includes('linkedin.com')) return 'linkedin'
  if (value.includes('instagram.com')) return 'instagram'

  return 'link'
}

function ContactIcon({ kind }) {
  switch (kind) {
    case 'email':
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.75h16a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Z" />
          <path d="m4.5 8.25 7.5 5.25 7.5-5.25" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5a8.5 8.5 0 0 0-7.22 13.02L4 20.5l3.63-1.05A8.5 8.5 0 1 0 12 3.5Z" />
          <path d="M9.7 8.7c.2-.4.5-.5.8-.3l1 1c.2.2.3.5.1.8l-.5.8c-.1.2-.1.5 0 .7.5.8 1.2 1.4 2 1.9.2.1.5.1.7-.1l.7-.7c.2-.2.5-.2.8 0l1 1c.2.2.2.6.1.8-.5.7-1.3 1-2.3.9-3-.2-6.5-3.7-6.7-6.7-.1-1 .2-1.8.9-2.3Z" />
        </svg>
      )
    case 'github':
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.5a8.5 8.5 0 0 0-2.7 16.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-1-.9-1.3-.9-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-1.8-.2-3.6-.9-3.6-4.1 0-.9.3-1.6.9-2.2-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.4.9.7-.2 1.4-.3 2.1-.3s1.4.1 2.1.3c1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.3.9 2.2 0 3.2-1.8 3.9-3.6 4.1.3.3.7.8.7 1.7v2.5c0 .2.1.5.5.4A8.5 8.5 0 0 0 12 3.5Z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3" />
          <path d="M8.2 10.2v6.1" />
          <path d="M8.2 7.8v.1" />
          <path d="M11.6 16.3v-3.2c0-1.5.8-2.5 2-2.5 1.3 0 1.9.9 1.9 2.5v3.2" />
          <path d="M13.1 10.6c0-.3.3-.6.7-.6.5 0 .8.3.8.8" />
          <path d="M8.2 10.2c.3-.1.6-.1.9-.1" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="16.6" cy="7.4" r="1" />
        </svg>
      )
    default:
      return (
        <svg className="contact-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8.2 8.2h7.6v7.6H8.2z" />
          <path d="M12 5.5V2.8" />
          <path d="M12 21.2v-2.7" />
          <path d="M5.5 12H2.8" />
          <path d="M21.2 12h-2.7" />
        </svg>
      )
  }
}

export default function Contact() {
  const { contact } = usePortfolioContent()
  const ref = useFadeIn()
  const titleLines = (contact.title || '').split('\n')
  const actions = contact.actions || []
  const primaryActionIndex = actions.findIndex((action) => action.variant === 'primary')
  const primaryAction = actions[primaryActionIndex] || actions[0] || null
  const socialActions = actions.filter((_, idx) => idx !== (primaryActionIndex >= 0 ? primaryActionIndex : 0))

  return (
    <section className="section page-section" id="contact">
      <div className="section-inner contact-inner fade-up" ref={ref}>
        <span className="section-label">{contact.sectionLabel}</span>
        <h2 className="section-title contact-title">
          {titleLines.map((line, idx) => (
            <span key={`${line}-${idx}`}>
              {idx > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
        <p className="contact-sub">{contact.subtitle}</p>
        <div className="contact-actions stagger is-visible">
          {primaryAction && (
            <a
              href={primaryAction.href}
              target={isExternalLink(primaryAction.href) ? '_blank' : undefined}
              rel={isExternalLink(primaryAction.href) ? 'noreferrer' : undefined}
              className="btn btn-primary contact-primary"
            >
              <ContactIcon kind={getContactIconKind(primaryAction.href)} />
              <span>{primaryAction.label}</span>
            </a>
          )}
          {socialActions.length > 0 && (
            <div className="contact-socials stagger is-visible">
              {socialActions.map((action, idx) => (
                <a
                  key={`${action.label}-${idx}`}
                  href={action.href}
                  target={isExternalLink(action.href) ? '_blank' : undefined}
                  rel={isExternalLink(action.href) ? 'noreferrer' : undefined}
                  className="contact-social-link"
                  aria-label={action.label}
                  title={action.label}
                >
                  <ContactIcon kind={getContactIconKind(action.href)} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
