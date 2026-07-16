import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import Admin from './pages/Admin'
import { PortfolioContentProvider } from './context/PortfolioContentContext'
import './App.css'

const LEGACY_SECTION_PATHS = {
  '/about': 'about',
  '/skills': 'skills',
  '/projects': 'projects',
  '/experience': 'experience',
  '/contact': 'contact',
}

function ScrollToHash() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/') return

    const id = location.hash ? location.hash.slice(1) : 'hero'
    const scrollToSection = () => {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    const t = window.setTimeout(scrollToSection, 50)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.hash])

  return null
}

function LegacySectionRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const sectionId = LEGACY_SECTION_PATHS[location.pathname]
    navigate(sectionId ? `/#${sectionId}` : '/', { replace: true })
  }, [location.pathname, navigate])

  return <HomePage />
}

// Must be inside BrowserRouter to use useLocation
function AppShell() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <ScrollToHash />
      <Navbar />
      <main className="app-main">
        {/* key change re-mounts the div, re-triggering the CSS enter animation */}
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<LegacySectionRedirect />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <PortfolioContentProvider>
        <AppShell />
      </PortfolioContentProvider>
    </BrowserRouter>
  )
}

export default App
