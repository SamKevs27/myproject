import { useFadeIn } from '../hooks/useFadeIn'

export default function Contact() {
  const ref = useFadeIn()
  return (
    <section className="section page-section" id="contact">
      <div className="section-inner contact-inner fade-up" ref={ref}>
        <span className="section-label">Let's Talk</span>
        <h2 className="section-title contact-title">
          Turning Concepts Into<br />Aesthetic Realities.
        </h2>
        <p className="contact-sub">Open to internships, freelance projects, and collaborations. Drop a message — I'd love to connect.</p>
        <div className="contact-actions stagger is-visible">
          <a href="mailto:samuelkevinlaluyan@email.com" className="btn btn-primary">Send Email</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="btn btn-outline">GitHub</a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="btn btn-outline">LinkedIn</a>
        </div>
      </div>
    </section>
  )
}
