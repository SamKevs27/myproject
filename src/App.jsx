import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MotionLayer from './components/MotionLayer'
import HomePage from './pages/HomePage'
import { PortfolioContentProvider } from './context/PortfolioContentContext'
import './App.css'

// Admin (and Firebase Auth) is split into its own chunk so visitors never download it.
const Admin = lazy(() => import('./pages/Admin'))

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
    if (location.pathname !== '/') return undefined

    const id = location.hash.slice(1)
    if (!id || id === 'hero') {
      window.scrollTo(0, 0)
      return undefined
    }

    // Content may still be loading on a first visit, so wait for the section.
    let tries = 0
    let timer = 0
    const attempt = () => {
      const target = document.getElementById(id)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else if (tries++ < 40) timer = window.setTimeout(attempt, 100)
    }
    timer = window.setTimeout(attempt, 50)
    return () => window.clearTimeout(timer)
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
      <MotionLayer />
      <Navbar />
      <main className="app-main">
        {/* key change re-mounts the div, re-triggering the CSS enter animation */}
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
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
