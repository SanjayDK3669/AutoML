/**
 * AuthPage.jsx
 * Screens: 'login' | 'signup' | 'forgot' | 'newpass' | 'done'
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

// ── debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 500) {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return d
}

// ── input field ────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, hint, error, success, suffix, autoFocus }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display:'block', fontSize:'.78rem', fontWeight:700, color:'var(--ghost)', letterSpacing:'.03em', marginBottom:'.4rem' }}>
        {label}
      </label>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <input
          autoFocus={autoFocus}
          className="cf-input"
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPass ? 'current-password' : 'off'}
          style={{
            width:'100%',
            borderColor: error ? '#dc2626' : success ? '#16a34a' : undefined,
            paddingRight: (isPass || suffix) ? '2.8rem' : undefined,
          }}
        />
        {isPass && (
          <button type="button" tabIndex={-1} onClick={() => setShow(v => !v)}
            style={{ position:'absolute', right:'.75rem', background:'none', border:'none', cursor:'pointer', color:'var(--fog)', fontSize:'.9rem', lineHeight:1, padding:0 }}>
            {show ? '🙈' : '👁'}
          </button>
        )}
        {!isPass && suffix && (
          <span style={{ position:'absolute', right:'.75rem', fontSize:'.9rem', lineHeight:1 }}>{suffix}</span>
        )}
      </div>
      {error   && <div style={{ fontSize:'.74rem', color:'#dc2626', marginTop:'.3rem' }}>⚠ {error}</div>}
      {success && !error && <div style={{ fontSize:'.74rem', color:'#16a34a', marginTop:'.3rem' }}>✓ {success}</div>}
      {hint && !error && !success && <div style={{ fontSize:'.72rem', color:'var(--fog)', marginTop:'.3rem' }}>{hint}</div>}
    </div>
  )
}

// ── API error box ──────────────────────────────────────────────────────────────
function ApiErr({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#dc2626', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
      ⚠ {msg}
    </div>
  )
}

// ── Logo header ───────────────────────────────────────────────────────────────
function Logo({ onBack }) {
  return (
    <div style={{ textAlign:'center', marginBottom:'2.25rem' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', marginBottom:'1.5rem', cursor:'pointer' }} onClick={onBack}>
        <div className="nav-logo-mark">
          <svg viewBox="0 0 24 24" style={{ width:18, height:18, fill:'none', stroke:'white', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span style={{ fontFamily:'var(--serif)', fontSize:'1.2rem', color:'var(--ink)' }}>
          RaWML<span style={{ color:'var(--fog)' }}>.ai</span>
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Main AuthPage
// ═══════════════════════════════════════════════════════════════════════════════
export default function AuthPage({ onSuccess, onBack }) {
  const { signup, login, checkUsername } = useAuth()

  // screen: 'login' | 'signup' | 'forgot' | 'newpass' | 'done'
  const [screen,  setScreen]  = useState('login')
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  // ── Login ──────────────────────────────────────────────────────────────────
  const [lEmail, setLEmail] = useState('')
  const [lPass,  setLPass]  = useState('')

  // ── Signup ─────────────────────────────────────────────────────────────────
  const [sEmail,      setSEmail]      = useState('')
  const [sUsername,   setSUsername]   = useState('')
  const [sPass,       setSPass]       = useState('')
  const [sConfirm,    setSConfirm]    = useState('')
  const [unameStatus, setUnameStatus] = useState(null)
  const [unameMsg,    setUnameMsg]    = useState('')
  const debouncedUname = useDebounce(sUsername, 500)

  useEffect(() => {
    if (!debouncedUname || debouncedUname.length < 3) { setUnameStatus(null); setUnameMsg(''); return }
    setUnameStatus('checking')
    checkUsername(debouncedUname).then(res => {
      if (!res) return
      setUnameStatus(res.available ? 'available' : 'taken')
      setUnameMsg(res.message)
    }).catch(() => setUnameStatus(null))
  }, [debouncedUname, checkUsername])

  // ── Forgot password state ──────────────────────────────────────────────────
  const [fpEmail,    setFpEmail]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [newConfirm, setNewConfirm] = useState('')

  // ── Validation ─────────────────────────────────────────────────────────────
  const emailErr = v     => v && !/\S+@\S+\.\S+/.test(v) ? 'Enter a valid email address.' : ''
  const passErr  = v     => v && v.length < 8 ? 'At least 8 characters required.' : ''
  const matchErr = (p,c) => c && p !== c ? 'Passwords do not match.' : ''

  function goScreen(s) { setScreen(s); setApiErr('') }

  // ── AUTH: Login ────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    if (emailErr(lEmail) || !lPass) return
    setLoading(true); setApiErr('')
    try { const u = await login({ email: lEmail, password: lPass }); onSuccess(u) }
    catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── AUTH: Signup ───────────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault()
    if (emailErr(sEmail) || unameStatus !== 'available' || passErr(sPass) || matchErr(sPass, sConfirm)) return
    setLoading(true); setApiErr('')
    try { const u = await signup({ email: sEmail, username: sUsername, password: sPass, confirm_password: sConfirm }); onSuccess(u) }
    catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── FORGOT: Step 1 — verify email exists ──────────────────────────────────
  // const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8000'
  const AUTH_URL = "https://automl-auth-backend.onrender.com"

  async function handleForgotSubmit(e) {
    e.preventDefault()
    if (emailErr(fpEmail) || !fpEmail) return
    setLoading(true); setApiErr('')
    try {
      const res  = await fetch(`${AUTH_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'No account found with that email.')
      setNewPass(''); setNewConfirm('')
      goScreen('newpass')
    } catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── FORGOT: Step 2 — set new password ─────────────────────────────────────
  async function handleResetSubmit(e) {
    e.preventDefault()
    if (passErr(newPass) || matchErr(newPass, newConfirm)) return
    setLoading(true); setApiErr('')
    try {
      const res  = await fetch(`${AUTH_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, new_password: newPass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Reset failed.')
      goScreen('done')
    } catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── Shared card wrapper ────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--white)', border: '1px solid var(--smoke-3)',
    borderRadius: 'var(--r-xl)', padding: '2.25rem 2.25rem 2rem',
    boxShadow: 'var(--shadow-md)', animation: 'fadeUp .5s .08s ease both',
  }

  // Progress dots for forgot-password flow (2 steps only)
  const FP_STEPS = ['Email', 'New Password']
  const fpStep   = screen === 'forgot' ? 0 : screen === 'newpass' ? 1 : -1

  function ForgotProgress() {
    if (fpStep < 0) return null
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', marginBottom:'1.5rem' }}>
        {FP_STEPS.map((label, i) => (
          <span key={label} style={{ display:'contents' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.25rem' }}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'.7rem', fontWeight:800,
                background: i < fpStep ? '#22c55e' : i === fpStep ? 'var(--ink)' : 'var(--smoke-3)',
                color: i <= fpStep ? '#fff' : 'var(--fog)',
                transition: 'all .3s',
              }}>
                {i < fpStep ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:'.62rem', fontWeight:700, color: i === fpStep ? 'var(--ink)' : 'var(--fog)', letterSpacing:'.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                {label}
              </span>
            </div>
            {i < FP_STEPS.length - 1 && (
              <div style={{ height:'1px', width:'32px', background: i < fpStep ? '#22c55e' : 'var(--smoke-3)', marginBottom:'18px', transition:'background .3s' }}/>
            )}
          </span>
        ))}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:'100vh', background:'var(--smoke)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'2rem 1.25rem', position:'relative', overflow:'hidden',
    }}>
      {/* Grid texture */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)', backgroundSize:'48px 48px' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 70% 60% at 50% 40%,rgba(248,248,248,0) 0%,rgba(248,248,248,.9) 100%)' }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'440px' }}>

        <Logo onBack={onBack} />

        {/* ════════════════════════════════
            LOGIN
        ════════════════════════════════ */}
        {screen === 'login' && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.7rem,4vw,2.2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.4rem', lineHeight:1.1 }}>
                Welcome <em style={{ fontStyle:'italic', color:'var(--fog)' }}>back</em>
              </h1>
              <p style={{ fontSize:'.88rem', color:'var(--fog)', margin:0 }}>Sign in to your RaWML.ai account</p>
            </div>
            <div style={cardStyle}>
              <TabSwitcher mode="login" onChange={m => { goScreen(m); setApiErr('') }} />
              <form onSubmit={handleLogin} noValidate>
                <Field label="Email address" type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="you@example.com" error={lEmail ? emailErr(lEmail) : ''} autoFocus />
                <Field label="Password" type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="Your password" />
                {/* Forgot password link */}
                <div style={{ textAlign:'right', marginTop:'-.5rem', marginBottom:'1rem' }}>
                  <button type="button" onClick={() => { setFpEmail(lEmail); goScreen('forgot') }}
                    style={{ background:'none', border:'none', color:'var(--fog)', fontSize:'.78rem', cursor:'pointer', fontFamily:'var(--sans)', fontWeight:600, padding:0 }}>
                    Forgot password?
                  </button>
                </div>
                <ApiErr msg={apiErr} />
                <SubmitBtn loading={loading} disabled={!lEmail || !lPass} label="Sign In →" loadingLabel="Signing in…" />
                <SwitchLink mode="login" onChange={m => goScreen(m)} />
              </form>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            SIGNUP
        ════════════════════════════════ */}
        {screen === 'signup' && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.7rem,4vw,2.2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.4rem', lineHeight:1.1 }}>
                Create your <em style={{ fontStyle:'italic', color:'var(--fog)' }}>account</em>
              </h1>
              <p style={{ fontSize:'.88rem', color:'var(--fog)', margin:0 }}>Join RaWML.ai — takes 30 seconds</p>
            </div>
            <div style={cardStyle}>
              <TabSwitcher mode="signup" onChange={m => { goScreen(m); setApiErr('') }} />
              <form onSubmit={handleSignup} noValidate>
                <Field label="Email address" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="you@example.com" error={sEmail ? emailErr(sEmail) : ''} autoFocus />
                <Field label="Username" type="text" value={sUsername} onChange={e => setSUsername(e.target.value)} placeholder="e.g. arjun_rao" hint="3–30 chars · letters, numbers, underscores"
                  error={unameStatus === 'taken' ? unameMsg : ''}
                  success={unameStatus === 'available' ? unameMsg : ''}
                  suffix={unameStatus === 'checking' ? '⏳' : unameStatus === 'available' ? '✅' : unameStatus === 'taken' ? '❌' : null}
                />
                <Field label="Password" type="password" value={sPass} onChange={e => setSPass(e.target.value)} placeholder="Min. 8 characters" error={sPass ? passErr(sPass) : ''} />
                <Field label="Confirm password" type="password" value={sConfirm} onChange={e => setSConfirm(e.target.value)} placeholder="Re-enter password"
                  error={sConfirm ? matchErr(sPass, sConfirm) : ''}
                  success={sConfirm && sPass === sConfirm ? 'Passwords match ✓' : ''}
                />
                <ApiErr msg={apiErr} />
                <SubmitBtn loading={loading}
                  disabled={!sEmail || !!emailErr(sEmail) || unameStatus !== 'available' || !sPass || !!passErr(sPass) || !sConfirm || !!matchErr(sPass, sConfirm)}
                  label="Create Account →" loadingLabel="Creating account…" />
                <SwitchLink mode="signup" onChange={m => goScreen(m)} />
              </form>
            </div>
          </>
        )}

        {/* ════════════════════════════════
            FORGOT — Step 1: enter email
        ════════════════════════════════ */}
        {screen === 'forgot' && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.6rem,4vw,2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.4rem', lineHeight:1.1 }}>
                Reset your <em style={{ fontStyle:'italic', color:'var(--fog)' }}>password</em>
              </h1>
              <p style={{ fontSize:'.88rem', color:'var(--fog)', margin:0 }}>Enter your account email to get started</p>
            </div>
            <div style={cardStyle}>
              <ForgotProgress />
              <form onSubmit={handleForgotSubmit} noValidate>
                <Field label="Your account email" type="email" value={fpEmail} onChange={e => { setFpEmail(e.target.value); setApiErr('') }} placeholder="you@example.com" error={fpEmail ? emailErr(fpEmail) : ''} autoFocus />
                <ApiErr msg={apiErr} />
                <SubmitBtn loading={loading} disabled={!fpEmail || !!emailErr(fpEmail)} label="Continue →" loadingLabel="Checking…" />
              </form>
              <BackLink label="← Back to sign in" onClick={() => goScreen('login')} />
            </div>
          </>
        )}

        {/* ════════════════════════════════
            NEW PASSWORD — Step 2
        ════════════════════════════════ */}
        {screen === 'newpass' && (
          <>
            <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
              <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.6rem,4vw,2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.4rem', lineHeight:1.1 }}>
                Set new <em style={{ fontStyle:'italic', color:'var(--fog)' }}>password</em>
              </h1>
              <p style={{ fontSize:'.88rem', color:'var(--fog)', margin:0 }}>Choose a strong password for your account</p>
            </div>
            <div style={cardStyle}>
              <ForgotProgress />
              <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#15803d', display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'1.25rem' }}>
                ✅ Email confirmed — set your new password below.
              </div>
              <form onSubmit={handleResetSubmit} noValidate>
                <Field label="New password" type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setApiErr('') }} placeholder="Min. 8 characters" error={newPass ? passErr(newPass) : ''} autoFocus />
                <Field label="Confirm new password" type="password" value={newConfirm} onChange={e => { setNewConfirm(e.target.value); setApiErr('') }} placeholder="Re-enter new password"
                  error={newConfirm ? matchErr(newPass, newConfirm) : ''}
                  success={newConfirm && newPass === newConfirm ? 'Passwords match ✓' : ''}
                />
                <ApiErr msg={apiErr} />
                <SubmitBtn loading={loading} disabled={!newPass || !!passErr(newPass) || !newConfirm || !!matchErr(newPass, newConfirm)} label="Update Password →" loadingLabel="Updating…" />
              </form>
              <BackLink label="← Change email" onClick={() => goScreen('forgot')} />
            </div>
          </>
        )}

        {/* ════════════════════════════════
            DONE — success state
        ════════════════════════════════ */}
        {screen === 'done' && (
          <div style={{ ...cardStyle, textAlign:'center', padding:'3rem 2.25rem' }}>
            <div style={{ width:'68px', height:'68px', background:'#f0fdf4', border:'2px solid #86efac', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 1.25rem' }}>
              ✅
            </div>
            <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.6rem', fontWeight:400, color:'var(--ink)', marginBottom:'.5rem', letterSpacing:'-.02em' }}>
              Password Updated!
            </h2>
            <p style={{ fontSize:'.9rem', color:'var(--fog)', marginBottom:'1.75rem', lineHeight:1.6 }}>
              Your password has been changed successfully.<br/>You can now sign in with your new password.
            </p>
            <button className="cf-submit" onClick={() => goScreen('login')}>
              Sign In →
            </button>
          </div>
        )}

        {/* Back to homepage */}
        {screen !== 'done' && (
          <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
            <button type="button" onClick={onBack}
              style={{ background:'none', border:'none', fontSize:'.82rem', color:'var(--fog)', cursor:'pointer', fontFamily:'var(--sans)', display:'inline-flex', alignItems:'center', gap:'.35rem' }}>
              ← Back to homepage
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabSwitcher({ mode, onChange }) {
  return (
    <div style={{ display:'flex', gap:'.35rem', background:'var(--smoke)', borderRadius:'10px', padding:'.25rem', marginBottom:'1.75rem' }}>
      {[['login','Sign In'],['signup','Sign Up']].map(([m, l]) => (
        <button key={m} type="button" onClick={() => onChange(m)} style={{
          flex:1, padding:'.5rem', border:'none', borderRadius:'8px',
          fontFamily:'var(--sans)', fontSize:'.85rem', fontWeight:600, cursor:'pointer', transition:'var(--transition)',
          background: mode === m ? 'var(--white)' : 'transparent',
          color:      mode === m ? 'var(--ink)'   : 'var(--fog)',
          boxShadow:  mode === m ? 'var(--shadow-xs)' : 'none',
        }}>{l}</button>
      ))}
    </div>
  )
}

function SubmitBtn({ loading, disabled, label, loadingLabel }) {
  return (
    <button type="submit" className="cf-submit" disabled={loading || disabled} style={{ marginTop:'.25rem' }}>
      {loading
        ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
            <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
            {loadingLabel}
          </span>
        : label}
    </button>
  )
}

function SwitchLink({ mode, onChange }) {
  const isLogin = mode === 'login'
  return (
    <p style={{ textAlign:'center', fontSize:'.8rem', color:'var(--fog)', marginTop:'1.25rem' }}>
      {isLogin ? "Don't have an account? " : 'Already have an account? '}
      <button type="button" onClick={() => onChange(isLogin ? 'signup' : 'login')}
        style={{ background:'none', border:'none', color:'var(--ink)', fontWeight:700, cursor:'pointer', fontSize:'.8rem', fontFamily:'var(--sans)', padding:0 }}>
        {isLogin ? 'Create one →' : 'Sign in →'}
      </button>
    </p>
  )
}

function BackLink({ label, onClick }) {
  return (
    <div style={{ textAlign:'center', marginTop:'1rem' }}>
      <button type="button" onClick={onClick}
        style={{ background:'none', border:'none', fontSize:'.8rem', color:'var(--fog)', cursor:'pointer', fontFamily:'var(--sans)', fontWeight:500 }}>
        {label}
      </button>
    </div>
  )
}