import Home from './Home'
import About from './About'
import Skills from './Skills'
import Projects from './Projects'
import Experience from './Experience'
import Contact from './Contact'
import { usePortfolioContent } from '../context/PortfolioContentContext'

export default function HomePage() {
  const { loading } = usePortfolioContent()

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
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
    </>
  )
}
