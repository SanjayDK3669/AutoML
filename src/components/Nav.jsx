import { useState, useEffect } from 'react'

export default function Nav({ onChat, onHome }) {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function navScroll(sectionId) {
    setMobileOpen(false)
    // If landing page is shown, the sections exist in the DOM
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="mainNav">
      <div className="nav-inner">
        {/* Logo */}
        <div className="nav-logo" onClick={onHome}>
          <div className="nav-logo-mark">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="nav-logo-text">AutoML<span>.ai</span></span>
        </div>

        {/* Desktop links */}
        <ul className="nav-links">
          {['about','product','team','contact'].map(id => (
            <li key={id}>
              <a href={`#${id}`} onClick={e => { e.preventDefault(); navScroll(id) }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="nav-right">
          <button className="btn-nav-chat" onClick={onChat}>Chat →</button>
        </div>

        {/* Hamburger */}
        <button className="nav-ham" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="nav-mobile open">
          {['about','product','team','contact'].map(id => (
            <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); navScroll(id) }}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
          <button className="btn-nav-chat" onClick={() => { onChat(); setMobileOpen(false) }}>
            Open Chat →
          </button>
        </div>
      )}
    </nav>
  )
}
