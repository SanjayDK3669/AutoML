import { useState, useEffect } from 'react'

export default function Nav({ onChat, onHome, user, onLogout }) {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)  // user dropdown

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function navScroll(sectionId) {
    setMobileOpen(false)
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
          <span className="nav-logo-text">RaWML<span>.ai</span></span>
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

        {/* Right side */}
        <div className="nav-right">
          {user ? (
            /* ── Logged-in: avatar + dropdown ── */
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display:'flex', alignItems:'center', gap:'.55rem',
                  background:'var(--smoke)', border:'1.5px solid var(--smoke-3)',
                  borderRadius:'100px', padding:'.35rem .85rem .35rem .45rem',
                  cursor:'pointer', transition:'var(--transition)', fontFamily:'var(--sans)',
                }}
              >
                {/* Avatar circle */}
                <span style={{
                  width:'28px', height:'28px', background:'var(--ink)', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'.7rem', fontWeight:800, color:'var(--white)', flexShrink:0,
                  textTransform:'uppercase',
                }}>
                  {user.username?.[0] || user.email?.[0] || 'U'}
                </span>
                <span style={{ fontSize:'.82rem', fontWeight:600, color:'var(--ink)', maxWidth:'90px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.username}
                </span>
                <span style={{ fontSize:'.65rem', color:'var(--fog)', marginLeft:'-.1rem' }}>▾</span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={() => setMenuOpen(false)}/>
                  <div style={{
                    position:'absolute', top:'calc(100% + .5rem)', right:0, zIndex:999,
                    background:'var(--white)', border:'1px solid var(--smoke-3)', borderRadius:'var(--r-lg)',
                    boxShadow:'var(--shadow-md)', minWidth:'200px', overflow:'hidden',
                    animation:'fadeUp .15s ease',
                  }}>
                    {/* User info header */}
                    <div style={{ padding:'.85rem 1.1rem', borderBottom:'1px solid var(--smoke-3)' }}>
                      <div style={{ fontSize:'.82rem', fontWeight:700, color:'var(--ink)' }}>@{user.username}</div>
                      <div style={{ fontSize:'.75rem', color:'var(--fog)', marginTop:'.15rem', overflow:'hidden', textOverflow:'ellipsis' }}>{user.email}</div>
                    </div>
                    {/* Open Chat */}
                    <button
                      onClick={() => { setMenuOpen(false); onChat() }}
                      style={{ width:'100%', padding:'.7rem 1.1rem', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:'.85rem', color:'var(--ink)', fontFamily:'var(--sans)', fontWeight:500, display:'flex', alignItems:'center', gap:'.5rem', transition:'var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--smoke)'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      💬 Open Chat
                    </button>
                    {/* Logout */}
                    <button
                      onClick={() => { setMenuOpen(false); onLogout() }}
                      style={{ width:'100%', padding:'.7rem 1.1rem', background:'none', border:'none', borderTop:'1px solid var(--smoke-3)', textAlign:'left', cursor:'pointer', fontSize:'.85rem', color:'#dc2626', fontFamily:'var(--sans)', fontWeight:600, display:'flex', alignItems:'center', gap:'.5rem', transition:'var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}
                    >
                      ↩ Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Logged-out: Chat CTA ── */
            <button className="btn-nav-chat" onClick={onChat}>Chat →</button>
          )}
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
          {user ? (
            <>
              <button className="btn-nav-chat" onClick={() => { setMobileOpen(false); onChat() }}>💬 Open Chat →</button>
              <button
                onClick={() => { setMobileOpen(false); onLogout() }}
                style={{ marginTop:'.25rem', padding:'.75rem', background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'8px', color:'#dc2626', fontWeight:700, cursor:'pointer', fontFamily:'var(--sans)' }}
              >
                ↩ Sign Out
              </button>
            </>
          ) : (
            <button className="btn-nav-chat" onClick={() => { onChat(); setMobileOpen(false) }}>
              Open Chat →
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
