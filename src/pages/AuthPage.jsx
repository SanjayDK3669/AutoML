/**
 * AuthPage.jsx
 * Login / Signup page — shown when user tries to access chat without being logged in.
 * Matches the existing black-and-white premium SaaS design system exactly.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

// ── tiny debounce hook ────────────────────────────────────────────────────────
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── field component ────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, hint, error, success, suffix }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div className="cf-field" style={{ marginBottom: '1.1rem' }}>
      <label className="cf-label">{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          className="cf-input"
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPass ? 'current-password' : 'off'}
          style={{
            width: '100%',
            borderColor: error ? '#dc2626' : success ? '#16a34a' : undefined,
            paddingRight: (isPass || suffix) ? '2.8rem' : undefined,
          }}
        />
        {/* Show/hide password toggle */}
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={{ position:'absolute', right:'.75rem', background:'none', border:'none', cursor:'pointer', color:'var(--fog)', fontSize:'.9rem', lineHeight:1, padding:0 }}
            tabIndex={-1}
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
        {/* Status icon for non-password fields */}
        {!isPass && suffix && (
          <span style={{ position:'absolute', right:'.75rem', fontSize:'.85rem', lineHeight:1 }}>
            {suffix}
          </span>
        )}
      </div>
      {error   && <div style={{ fontSize:'.74rem', color:'#dc2626', marginTop:'.3rem', display:'flex', alignItems:'center', gap:'.3rem' }}>⚠ {error}</div>}
      {success && !error && <div style={{ fontSize:'.74rem', color:'#16a34a', marginTop:'.3rem', display:'flex', alignItems:'center', gap:'.3rem' }}>✓ {success}</div>}
      {hint && !error && !success && <div style={{ fontSize:'.72rem', color:'var(--fog)', marginTop:'.3rem' }}>{hint}</div>}
    </div>
  )
}

// ── Main AuthPage ──────────────────────────────────────────────────────────────
export default function AuthPage({ onSuccess, onBack }) {
  const { signup, login, checkUsername } = useAuth()
  const [mode,    setMode]    = useState('login')   // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  // ── Login fields ──────────────────────────────────────────────────────────
  const [lEmail, setLEmail] = useState('')
  const [lPass,  setLPass]  = useState('')

  // ── Signup fields ─────────────────────────────────────────────────────────
  const [sEmail,    setSEmail]    = useState('')
  const [sUsername, setSUsername] = useState('')
  const [sPass,     setSPass]     = useState('')
  const [sConfirm,  setSConfirm]  = useState('')

  // username availability
  const [unameStatus, setUnameStatus] = useState(null)  // null | 'checking' | 'available' | 'taken'
  const [unameMsg,    setUnameMsg]    = useState('')
  const debouncedUsername = useDebounce(sUsername, 500)

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUnameStatus(null); setUnameMsg(''); return
    }
    setUnameStatus('checking')
    checkUsername(debouncedUsername).then(res => {
      if (!res) return
      setUnameStatus(res.available ? 'available' : 'taken')
      setUnameMsg(res.message)
    }).catch(() => setUnameStatus(null))
  }, [debouncedUsername, checkUsername])

  // Reset API error when switching modes
  function switchMode(m) { setMode(m); setApiErr('') }

  // ── Validation helpers ────────────────────────────────────────────────────
  function emailError(v)   { if (!v) return ''; if (!/\S+@\S+\.\S+/.test(v)) return 'Enter a valid email address.'; return '' }
  function passError(v)    { if (!v) return ''; if (v.length < 8) return 'Password must be at least 8 characters.'; return '' }
  function confirmError(p, c) { if (!c) return ''; if (p !== c) return 'Passwords do not match.'; return '' }

  // ── Submit: login ─────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    if (emailError(lEmail) || !lPass) return
    setLoading(true); setApiErr('')
    try {
      const user = await login({ email: lEmail, password: lPass })
      onSuccess(user)
    } catch(err) {
      setApiErr(err.message)
    } finally { setLoading(false) }
  }

  // ── Submit: signup ────────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault()
    const hasErr =
      emailError(sEmail) ||
      passError(sPass)   ||
      confirmError(sPass, sConfirm) ||
      unameStatus !== 'available'
    if (hasErr) return
    setLoading(true); setApiErr('')
    try {
      const user = await signup({
        email:            sEmail,
        username:         sUsername,
        password:         sPass,
        confirm_password: sConfirm,
      })
      onSuccess(user)
    } catch(err) {
      setApiErr(err.message)
    } finally { setLoading(false) }
  }

  // ── username suffix icon ──────────────────────────────────────────────────
  const unameSuffix =
    unameStatus === 'checking'  ? '⏳' :
    unameStatus === 'available' ? '✅' :
    unameStatus === 'taken'     ? '❌' : null

  const unameErr     = unameStatus === 'taken' ? unameMsg : ''
  const unameSuccess = unameStatus === 'available' ? unameMsg : ''

  return (
    <div style={{
      minHeight:       '100vh',
      background:      'var(--smoke)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '2rem 1.25rem',
      position:        'relative',
    }}>

      {/* Background grid texture */}
      <div style={{
        position:        'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)',
        backgroundSize:  '48px 48px',
      }}/>
      <div style={{
        position:   'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%,rgba(248,248,248,0) 0%,rgba(248,248,248,.9) 100%)',
      }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'440px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.25rem', animation:'fadeUp .5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', marginBottom:'1.5rem', cursor:'pointer' }} onClick={onBack}>
            <div className="nav-logo-mark">
              <svg viewBox="0 0 24 24" style={{ width:18,height:18,fill:'none',stroke:'white',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round' }}>
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontFamily:'var(--serif)', fontSize:'1.2rem', color:'var(--ink)' }}>
              AutoML<span style={{ color:'var(--fog)' }}>.ai</span>
            </span>
          </div>

          {/* Mode heading */}
          <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.7rem,4vw,2.2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.4rem', lineHeight:1.1 }}>
            {mode === 'login' ? <>Welcome <em style={{ fontStyle:'italic', color:'var(--fog)' }}>back</em></> : <>Create your <em style={{ fontStyle:'italic', color:'var(--fog)' }}>account</em></>}
          </h1>
          <p style={{ fontSize:'.88rem', color:'var(--fog)' }}>
            {mode === 'login'
              ? 'Sign in to access AutoML.ai'
              : 'Join AutoML.ai — it takes 30 seconds'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:   'var(--white)',
          border:       '1px solid var(--smoke-3)',
          borderRadius: 'var(--r-xl)',
          padding:      '2.25rem 2.25rem 2rem',
          boxShadow:    'var(--shadow-md)',
          animation:    'fadeUp .5s .08s ease both',
        }}>

          {/* Mode switcher tabs */}
          <div style={{ display:'flex', gap:'.35rem', background:'var(--smoke)', borderRadius:'10px', padding:'.25rem', marginBottom:'1.75rem' }}>
            {[['login','Sign In'],['signup','Sign Up']].map(([m,l]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex:1, padding:'.5rem', border:'none', borderRadius:'8px', fontFamily:'var(--sans)',
                  fontSize:'.85rem', fontWeight:600, cursor:'pointer', transition:'var(--transition)',
                  background: mode === m ? 'var(--white)' : 'transparent',
                  color:      mode === m ? 'var(--ink)'   : 'var(--fog)',
                  boxShadow:  mode === m ? 'var(--shadow-xs)' : 'none',
                }}
              >{l}</button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              <Field
                label="Email address"
                type="email"
                value={lEmail}
                onChange={e => setLEmail(e.target.value)}
                placeholder="you@example.com"
                error={lEmail ? emailError(lEmail) : ''}
              />
              <Field
                label="Password"
                type="password"
                value={lPass}
                onChange={e => setLPass(e.target.value)}
                placeholder="Your password"
              />

              {apiErr && (
                <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#dc2626', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
                  ⚠ {apiErr}
                </div>
              )}

              <button
                type="submit"
                className="cf-submit"
                disabled={loading || !lEmail || !lPass}
                style={{ marginTop:'.25rem' }}
              >
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
                      <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                      Signing in…
                    </span>
                  : 'Sign In →'}
              </button>

              <p style={{ textAlign:'center', fontSize:'.8rem', color:'var(--fog)', marginTop:'1.25rem' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} style={{ background:'none', border:'none', color:'var(--ink)', fontWeight:700, cursor:'pointer', fontSize:'.8rem', fontFamily:'var(--sans)', padding:0 }}>
                  Create one →
                </button>
              </p>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} noValidate>
              <Field
                label="Email address"
                type="email"
                value={sEmail}
                onChange={e => setSEmail(e.target.value)}
                placeholder="you@example.com"
                error={sEmail ? emailError(sEmail) : ''}
              />

              <Field
                label="Username"
                type="text"
                value={sUsername}
                onChange={e => setSUsername(e.target.value)}
                placeholder="e.g. arjun_rao"
                hint="3–30 chars, letters / numbers / underscores only"
                error={unameErr}
                success={unameSuccess}
                suffix={unameSuffix}
              />

              <Field
                label="Password"
                type="password"
                value={sPass}
                onChange={e => setSPass(e.target.value)}
                placeholder="Min. 8 characters"
                error={sPass ? passError(sPass) : ''}
              />

              <Field
                label="Confirm password"
                type="password"
                value={sConfirm}
                onChange={e => setSConfirm(e.target.value)}
                placeholder="Re-enter password"
                error={sConfirm ? confirmError(sPass, sConfirm) : ''}
                success={sConfirm && sPass === sConfirm ? 'Passwords match ✓' : ''}
              />

              {apiErr && (
                <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#dc2626', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
                  ⚠ {apiErr}
                </div>
              )}

              <button
                type="submit"
                className="cf-submit"
                disabled={
                  loading ||
                  !sEmail || !!emailError(sEmail) ||
                  unameStatus !== 'available' ||
                  !sPass || !!passError(sPass) ||
                  !sConfirm || !!confirmError(sPass, sConfirm)
                }
                style={{ marginTop:'.25rem' }}
              >
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
                      <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                      Creating account…
                    </span>
                  : 'Create Account →'}
              </button>

              <p style={{ textAlign:'center', fontSize:'.8rem', color:'var(--fog)', marginTop:'1.25rem' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} style={{ background:'none', border:'none', color:'var(--ink)', fontWeight:700, cursor:'pointer', fontSize:'.8rem', fontFamily:'var(--sans)', padding:0 }}>
                  Sign in →
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign:'center', marginTop:'1.5rem', animation:'fadeUp .5s .2s ease both' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ background:'none', border:'none', fontSize:'.82rem', color:'var(--fog)', cursor:'pointer', fontFamily:'var(--sans)', display:'inline-flex', alignItems:'center', gap:'.35rem' }}
          >
            ← Back to homepage
          </button>
        </div>
      </div>
    </div>
  )
}
