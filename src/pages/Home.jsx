import { Link } from 'react-router-dom'
import portrait from '../assets/potrait.png'

export default function Home() {
  return (
    <section className="hero" id="hero">
      {/* filled name — behind portrait */}
      <div className="hero-name" aria-hidden="true">
        <span>Samuel</span>
      </div>
      {/* outline name — in front of portrait */}
      <div className="hero-name hero-name-outline" aria-hidden="true">
        <span>Samuel</span>
      </div>

      {/* portrait */}
      <div className="hero-img-wrap">
        <img src={portrait} alt="Samuel Kevin Laluyan" className="hero-img" />
      </div>

      {/* top-right label */}
      <div className="hero-label">
        <span className="hero-label-line" />
        <span>Creative Portfolio</span>
      </div>

      {/* bottom info bar */}
      <div className="hero-bar">
        <div className="hero-bar-left">
          <p className="hero-bar-name">Samuel Kevin Laluyan</p>
          <p className="hero-bar-role">Information Technology Student · Swiss German University</p>
        </div>
        <div className="hero-bar-dividers">
          <span>Design</span><span className="bar-sep" /><span>Build</span><span className="bar-sep" /><span>Style</span>
        </div>
        <div className="hero-bar-ctas">
          <Link to="/projects" className="btn btn-primary">View Work</Link>
          <Link to="/contact" className="btn btn-outline">Contact</Link>
        </div>
      </div>
    </section>
  )
}
