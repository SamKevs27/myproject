import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MotionLayer from './components/MotionLayer'
import GlitchOverlay from './components/GlitchOverlay'
import HomePage from './pages/HomePage'
import ChooserPage from './pages/ChooserPage'
import { FORMAL_PATH, FUN_PATH, JOURNEY_PATH } from './lib/routes'
import { ViewModeContext } from './context/ViewMode'
import { PortfolioContentProvider } from './context/PortfolioContentContext'
import './App.css'

// Admin (and Firebase Auth) is split into its own chunk so visitors never download it.
const Admin = lazy(() => import('./pages/Admin'))
// The 8-bit journey is its own chunk too, with its pixel fonts loaded on demand.
const JourneyPage = lazy(() => import('./pages/JourneyPage'))

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
    if (location.pathname !== FORMAL_PATH && location.pathname !== FUN_PATH) return undefined

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

// Old per-section URLs (/about, /projects…) land on that section of the formal view.
function LegacySectionRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const sectionId = LEGACY_SECTION_PATHS[location.pathname]
    navigate(sectionId ? `${FORMAL_PATH}#${sectionId}` : '/', { replace: true })
  }, [location.pathname, navigate])

  return null
}

// Shared layout for the fun and formal views. Fun adds the pointer effects
// and glitch overlay; formal keeps the same layout and turns the motion off.
function SiteShell({ mode, children }) {
  const location = useLocation()
  const formal = mode === 'formal'

  useEffect(() => {
    if (!formal) return undefined
    document.documentElement.dataset.view = 'formal'
    return () => { delete document.documentElement.dataset.view }
  }, [formal])

  return (
    <ViewModeContext.Provider value={mode}>
      <div className={`app-shell${formal ? ' view-formal' : ''}`}>
        {!formal && <MotionLayer />}
        {!formal && <GlitchOverlay />}
        <Navbar />
        <main className="app-main">
          {/* key change re-mounts the div, re-triggering the CSS enter animation */}
          <div className="page-transition" key={location.pathname}>{children}</div>
        </main>
        <Footer />
      </div>
    </ViewModeContext.Provider>
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<ChooserPage />} />
        <Route path={FORMAL_PATH} element={<SiteShell mode="formal"><HomePage /></SiteShell>} />
        <Route path={FUN_PATH} element={<SiteShell mode="fun"><HomePage /></SiteShell>} />
        <Route path={JOURNEY_PATH} element={<Suspense fallback={<div style={{ minHeight: '100vh', background: '#5aa8f0' }} />}><JourneyPage /></Suspense>} />
        <Route path="/admin" element={<SiteShell mode="fun"><Suspense fallback={null}><Admin /></Suspense></SiteShell>} />
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
