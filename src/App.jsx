import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Skills from './pages/Skills'
import Projects from './pages/Projects'
import Experience from './pages/Experience'
import Contact from './pages/Contact'
import './App.css'

// Must be inside BrowserRouter to use useLocation
function AppShell() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      <main>
        {/* key change re-mounts the div, re-triggering the CSS enter animation */}
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/"           element={<Home />} />
            <Route path="/about"      element={<About />} />
            <Route path="/skills"     element={<Skills />} />
            <Route path="/projects"   element={<Projects />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/contact"    element={<Contact />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
