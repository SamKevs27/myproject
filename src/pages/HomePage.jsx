import Home from './Home'
import About from './About'
import Skills from './Skills'
import Projects from './Projects'
import Experience from './Experience'
import Contact from './Contact'
import SkillsMarquee from '../components/SkillsMarquee'
import { usePortfolioContent } from '../context/PortfolioContentContext'
import { useIsFormal } from '../context/ViewMode'

export default function HomePage() {
  const { loading } = usePortfolioContent()
  const formal = useIsFormal()

  // Only shown on a first visit; repeat visits render instantly from cache.
  if (loading) {
    return (
      <div className="page-loader" role="status" aria-label="Loading">
        <span className="page-loader-logo">SKL</span>
      </div>
    )
  }

  return (
    <>
      <Home />
      {!formal && <SkillsMarquee />}
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
    </>
  )
}
