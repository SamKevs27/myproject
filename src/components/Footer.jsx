export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer-logo">SKL</span>
      <span className="footer-copy">© {new Date().getFullYear()} Samuel Kevin Laluyan</span>
      <div className="footer-strip">
        <span>Design</span><span className="bar-sep" /><span>Build</span><span className="bar-sep" /><span>Style</span>
      </div>
    </footer>
  )
}
