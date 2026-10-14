import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MotionLayer from './components/MotionLayer'
import GlitchOverlay from './components/GlitchOverlay'
import HomePage from './pages/HomePage'
import FormalPage from './pages/FormalPage'
import { FUN_PATH } from './lib/routes'
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
    if (location.pathname !== '/' && location.pathname !== FUN_PATH) return undefined

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

// Old per-section URLs (/about, /projects…) now land on the formal page's section.
function LegacySectionRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const sectionId = LEGACY_SECTION_PATHS[location.pathname]
    navigate(sectionId ? `/#${sectionId}` : '/', { replace: true })
  }, [location.pathname, navigate])

  return null
}

// The neon site: pointer effects, glitch overlay, navbar and footer.
function FunShell({ children }) {
  const location = useLocation()
  return (
    <div className="app-shell">
      <MotionLayer />
      <GlitchOverlay />
      <Navbar />
      <main className="app-main">
        {/* key change re-mounts the div, re-triggering the CSS enter animation */}
        <div className="page-transition" key={location.pathname}>{children}</div>
      </main>
      <Footer />
    </div>
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<FormalPage />} />
        <Route path={FUN_PATH} element={<FunShell><HomePage /></FunShell>} />
        <Route path="/admin" element={<FunShell><Suspense fallback={null}><Admin /></Suspense></FunShell>} />
        <Route path="*" element={<LegacySectionRedirect />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <PortfolioContentProvider>
        <AppRoutes />
      </PortfolioContentProvider>
    </BrowserRouter>
  )
}

export default App
