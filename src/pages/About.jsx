import portrait from '../assets/potrait.png'
import { Link } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'

export default function About() {
  const imgRef = useFadeIn()
  const textRef = useFadeIn()
  const statsRef = useFadeIn()
  return (
    <section className="section page-section" id="about">
      <div className="section-inner about-inner">
        <div className="about-img-col">
          <div ref={imgRef} className="fade-up">
            <img src={portrait} alt="Samuel Kevin Laluyan" className="about-portrait" />
          </div>
          <div ref={statsRef} className="about-stats stagger fade-up">
            <div className="stat"><span className="stat-num">20+</span><span className="stat-label">Projects</span></div>
            <div className="stat"><span className="stat-num">98%</span><span className="stat-label">Success Rate</span></div>
            <div className="stat"><span className="stat-num">40+</span><span className="stat-label">Collaborators</span></div>
          </div>
        </div>
        <div className="about-text-col fade-up" ref={textRef}>
          <span className="section-label">Creative Portfolio</span>
          <h2 className="section-title">Design with intention<br />— code that flows.</h2>
          <p className="about-p">
            I'm <strong>Samuel Kevin Laluyan</strong>, an IT student at Swiss German University (SGU), Indonesia.
            I specialise in transforming ideas into polished digital products — combining thoughtful
            UI design with solid engineering fundamentals.
          </p>
          <p className="about-p">
            My interest spans web and mobile development. I love collaborative work, learning rapidly,
            and delivering solutions that are both beautiful and functional.
          </p>
          <div className="about-details-row stagger fade-up is-visible">
            <div className="detail-chip"><span className="detail-key">Major</span><span>Information Technology</span></div>
            <div className="detail-chip"><span className="detail-key">Location</span><span>Indonesia</span></div>
            <div className="detail-chip"><span className="detail-key">Status</span><span>Open to Internships</span></div>
          </div>
          <Link to="/contact" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </section>
  )
}
