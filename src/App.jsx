import { useState } from 'react'
import './App.css'

const NAV_LINKS = ['About', 'Skills', 'Projects', 'Experience', 'Contact']

const SKILLS = {
  'Frontend': ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS'],
  'Backend': ['Node.js', 'Python', 'PHP', 'REST APIs'],
  'Database': ['MySQL', 'PostgreSQL', 'MongoDB'],
  'Tools & Others': ['Git', 'GitHub', 'VS Code', 'Figma', 'Linux'],
}

const PROJECTS = [
  {
    title: 'Campus Event Management System',
    description:
      'A full-stack web application for managing university events, registrations, and announcements. Features role-based access control and real-time notifications.',
    tech: ['React', 'Node.js', 'MySQL'],
    link: '#',
  },
  {
    title: 'Personal Finance Tracker',
    description:
      'A responsive web app that helps users track income and expenses with interactive charts, category breakdowns, and monthly summaries.',
    tech: ['React', 'Chart.js', 'localStorage'],
    link: '#',
  },
  {
    title: 'Student Study Planner',
    description:
      'A productivity tool designed for students to schedule tasks, set deadlines, and track academic progress with a clean calendar interface.',
    tech: ['HTML', 'CSS', 'JavaScript'],
    link: '#',
  },
]

const EXPERIENCE = [
  {
    role: 'IT Student – Swiss German University',
    period: '2022 – Present',
    description:
      'Pursuing a Bachelor of Science in Information Technology, gaining hands-on experience in software engineering, networking, database systems, and web development through coursework and project-based learning.',
  },
  {
    role: 'Web Development Intern',
    period: '2024',
    description:
      'Assisted in developing and maintaining internal web tools, collaborated with the development team on UI improvements, and learned industry best practices in version control and agile workflows.',
  },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-logo">SKL</span>
        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a href={`#${link.toLowerCase()}`} onClick={() => setMenuOpen(false)}>
                {link}
              </a>
            </li>
          ))}
        </ul>
        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <p className="hero-greeting">Hi, I'm</p>
        <h1 className="hero-name">Samuel Kevin Laluyan</h1>
        <h2 className="hero-title">Information Technology Student</h2>
        <p className="hero-bio">
          A passionate IT student at Swiss German University with a strong foundation
          in web development and software engineering. I build clean, purposeful digital
          experiences and am always eager to learn and grow in the ever-evolving world
          of technology.
        </p>
        <div className="hero-ctas">
          <a href="#projects" className="btn btn-primary">View My Work</a>
          <a href="#contact" className="btn btn-secondary">Get In Touch</a>
        </div>
      </div>
      <div className="hero-avatar">
        <div className="avatar-placeholder">SKL</div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="section" id="about">
      <div className="section-inner">
        <h2 className="section-title">About Me</h2>
        <div className="about-grid">
          <div className="about-text">
            <p>
              I'm <strong>Samuel Kevin Laluyan</strong>, an Information Technology student
              at Swiss German University (SGU), Indonesia. My academic journey has equipped me
              with solid skills in software development, problem-solving, and analytical thinking.
            </p>
            <p>
              I have a particular interest in <strong>web development</strong> and enjoy creating
              applications that are both functional and aesthetically refined. Outside of
              coding, I love exploring new technologies, contributing to team projects, and
              continuously challenging myself with real-world problems.
            </p>
            <p>
              My goal is to grow into a well-rounded software engineer who delivers
              high-quality, impactful solutions.
            </p>
          </div>
          <div className="about-details">
            <div className="detail-item"><span className="detail-label">Name</span><span>Samuel Kevin Laluyan</span></div>
            <div className="detail-item"><span className="detail-label">University</span><span>Swiss German University</span></div>
            <div className="detail-item"><span className="detail-label">Major</span><span>Information Technology</span></div>
            <div className="detail-item"><span className="detail-label">Location</span><span>Indonesia</span></div>
            <div className="detail-item"><span className="detail-label">Available</span><span>Open to Internships</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Skills() {
  return (
    <section className="section section-alt" id="skills">
      <div className="section-inner">
        <h2 className="section-title">Skills</h2>
        <div className="skills-grid">
          {Object.entries(SKILLS).map(([category, items]) => (
            <div key={category} className="skill-card">
              <h3 className="skill-category">{category}</h3>
              <ul className="skill-list">
                {items.map((skill) => (
                  <li key={skill} className="skill-tag">{skill}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Projects() {
  return (
    <section className="section" id="projects">
      <div className="section-inner">
        <h2 className="section-title">Projects</h2>
        <div className="projects-grid">
          {PROJECTS.map((project) => (
            <div key={project.title} className="project-card">
              <div className="project-header">
                <h3 className="project-title">{project.title}</h3>
                <a href={project.link} className="project-link" aria-label="View project">↗</a>
              </div>
              <p className="project-desc">{project.description}</p>
              <div className="project-tech">
                {project.tech.map((t) => (
                  <span key={t} className="tech-tag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Experience() {
  return (
    <section className="section section-alt" id="experience">
      <div className="section-inner">
        <h2 className="section-title">Experience</h2>
        <div className="timeline">
          {EXPERIENCE.map((exp) => (
            <div key={exp.role} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-header">
                  <h3 className="timeline-role">{exp.role}</h3>
                  <span className="timeline-period">{exp.period}</span>
                </div>
                <p className="timeline-desc">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="section" id="contact">
      <div className="section-inner contact-inner">
        <h2 className="section-title">Get In Touch</h2>
        <p className="contact-subtitle">
          I'm currently open to internship opportunities and collaborative projects.
          Feel free to reach out — I'd love to connect!
        </p>
        <div className="contact-links">
          <a href="mailto:samuelkevinlaluyan@email.com" className="contact-btn">
            <span>✉</span> Email Me
          </a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="contact-btn">
            <span>⌥</span> GitHub
          </a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="contact-btn">
            <span>in</span> LinkedIn
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Samuel Kevin Laluyan. Built with React & Vite.</p>
    </footer>
  )
}

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default App
