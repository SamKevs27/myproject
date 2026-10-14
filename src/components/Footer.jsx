import { useEffect, useState } from 'react'
import { usePortfolioContent } from '../context/PortfolioContentContext'

// Tangerang and Jakarta share this zone (WIB, UTC+7).
const TIME_ZONE = 'Asia/Jakarta'

function useLocalTime() {
  const format = () => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date())
  const [time, setTime] = useState(format)
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 20000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function Footer() {
  const { about } = usePortfolioContent()
  const time = useLocalTime()
  const location = (about.details || []).find((d) => /location/i.test(d.key || ''))?.value

  return (
    <footer className="footer">
      <div className="footer-left">
        <span className="footer-logo">SKL</span>
        <span className="footer-copy">© {new Date().getFullYear()} Samuel Kevin Laluyan</span>
      </div>
      {location && (
        <p className="footer-time">
          <span className="footer-time-dot" aria-hidden="true" />
          {time} in {location.split(',')[0]}
        </p>
      )}
      <div className="footer-right">
        <div className="footer-strip">
          <span>Design</span><span className="bar-sep" /><span>Build</span><span className="bar-sep" /><span>Style</span>
        </div>
        <button type="button" className="footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          <span aria-hidden="true" />
        </button>
      </div>
    </footer>
  )
}
