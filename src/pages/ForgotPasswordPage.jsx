/**
 * ForgotPasswordPage.jsx
 * 3-step password-reset flow:
 *   Step 1 — Enter email address
 *   Step 2 — Enter 6-digit OTP (1-minute countdown timer)
 *   Step 3 — Enter & confirm new password
 */
import { useState, useEffect, useRef, useCallback } from 'react'

// const AUTH_URL = 'http://localhost:8000'
const AUTH_URL = 'https://automl-auth-backend.onrender.com'

// ── Small reusable field ───────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, error, success, autoFocus }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display:'block', fontSize:'.78rem', fontWeight:600, color:'var(--ghost)', letterSpacing:'.03em', marginBottom:'.4rem' }}>
        {label}
      </label>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <input
          className="cf-input"
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width:'100%',
            borderColor: error ? '#dc2626' : success ? '#16a34a' : undefined,
            paddingRight: isPass ? '2.8rem' : undefined,
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
            style={{ position:'absolute', right:'.75rem', background:'none', border:'none', cursor:'pointer', color:'var(--fog)', fontSize:'.9rem', lineHeight:1, padding:0 }}>
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error   && <div style={{ fontSize:'.74rem', color:'#dc2626', marginTop:'.3rem' }}>⚠ {error}</div>}
      {success && !error && <div style={{ fontSize:'.74rem', color:'#16a34a', marginTop:'.3rem' }}>✓ {success}</div>}
    </div>
  )
}

// ── OTP input: 6 individual digit boxes ────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([])

  function handleKey(i, e) {
    const digits = value.split('')

    if (e.key === 'Backspace') {
      if (digits[i]) {
        digits[i] = ''
        onChange(digits.join(''))
      } else if (i > 0) {
        digits[i - 1] = ''
        onChange(digits.join(''))
        setTimeout(() => inputs.current[i - 1]?.focus(), 0)
      }
      return
    }

    if (e.key === 'ArrowLeft' && i > 0)  { inputs.current[i - 1]?.focus(); return }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return }

    if (/^\d$/.test(e.key)) {
      digits[i] = e.key
      onChange(digits.join(''))
      if (i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0)
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    const lastIdx = Math.min(pasted.length, 5)
    setTimeout(() => inputs.current[lastIdx]?.focus(), 0)
  }

  return (
    <div style={{ display:'flex', gap:'10px', justifyContent:'center', margin:'1.75rem 0' }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const digit = value[i] || ''
        const filled = !!digit
        return (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={i === 0}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            onChange={() => {}}  // controlled via onKeyDown
            style={{
              width:'52px', height:'60px',
              textAlign:'center', fontSize:'1.6rem', fontWeight:700,
              fontFamily:'var(--mono)', lineHeight:1,
              border:`2px solid ${filled ? 'var(--ink)' : 'var(--smoke-3)'}`,
              borderRadius:'10px', outline:'none',
              background: filled ? 'var(--ink)' : 'var(--white)',
              color:       filled ? 'var(--white)' : 'var(--ink)',
              transition: 'all .15s ease',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? .5 : 1,
              caretColor: 'transparent',
            }}
            onFocus={e => {
              if (!disabled) e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,.12)'
            }}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
        )
      })}
    </div>
  )
}

// ── Countdown ring ──────────────────────────────────────────────────────────────
function CountdownRing({ seconds, total = 60 }) {
  const r   = 22
  const circ = 2 * Math.PI * r
  const pct  = seconds / total
  const dash = pct * circ
  const urgent = seconds <= 15

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.35rem', marginBottom:'1.25rem' }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        {/* Track */}
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--smoke-3)" strokeWidth="3.5"/>
        {/* Progress */}
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={urgent ? '#dc2626' : '#0a0a0a'}
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition:'stroke-dasharray .9s linear, stroke .3s' }}
        />
        {/* Number */}
        <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily:'var(--mono)', fontSize:'13px', fontWeight:700,
                   fill: urgent ? '#dc2626' : 'var(--ink)' }}>
          {seconds}
        </text>
      </svg>
      <span style={{ fontSize:'.72rem', color: urgent ? '#dc2626' : 'var(--fog)', fontWeight:600, letterSpacing:'.04em' }}>
        {seconds > 0 ? `${seconds}s remaining` : 'Code expired'}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main ForgotPasswordPage
// ══════════════════════════════════════════════════════════════════════════════
export default function ForgotPasswordPage({ onBack, onDone }) {
  const [step,       setStep]       = useState(1)   // 1 | 2 | 3
  const [email,      setEmail]      = useState('')
  const [otp,        setOtp]        = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [confirmPass,setConfirmPass]= useState('')
  const [loading,    setLoading]    = useState(false)
  const [apiErr,     setApiErr]     = useState('')
  const [timeLeft,   setTimeLeft]   = useState(60)
  const timerRef = useRef(null)

  // ── Timer for step 2 ───────────────────────────────────────────────────────
  function startTimer() {
    setTimeLeft(60)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }
  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setApiErr('Enter a valid email address.'); return }
    setLoading(true); setApiErr('')
    try {
      const res  = await fetch(`${AUTH_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Request failed.')
      setStep(2); startTimer()
    } catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length < 6) { setApiErr('Enter all 6 digits.'); return }
    if (timeLeft === 0) { setApiErr('Code expired. Please request a new one.'); return }
    setLoading(true); setApiErr('')
    try {
      const res  = await fetch(`${AUTH_URL}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid code.')
      clearInterval(timerRef.current)
      setStep(3)
    } catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  async function handleResend() {
    setOtp(''); setApiErr('')
    setLoading(true)
    try {
      await fetch(`${AUTH_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      startTimer()
    } catch(_) {}
    finally { setLoading(false) }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  async function handleReset(e) {
    e.preventDefault()
    if (newPass.length < 8) { setApiErr('Password must be at least 8 characters.'); return }
    if (newPass !== confirmPass) { setApiErr('Passwords do not match.'); return }
    setLoading(true); setApiErr('')
    try {
      const res  = await fetch(`${AUTH_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, new_password: newPass, confirm_password: confirmPass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Reset failed.')
      onDone()   // go back to login with success message
    } catch(err) { setApiErr(err.message) }
    finally { setLoading(false) }
  }

  // ── Step labels ────────────────────────────────────────────────────────────
  const STEPS = [
    { n: 1, label: 'Email' },
    { n: 2, label: 'Verify' },
    { n: 3, label: 'Reset' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--smoke)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem', position: 'relative',
    }}>
      {/* Grid bg */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)',
        backgroundSize:'48px 48px' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 70% 60% at 50% 40%,rgba(248,248,248,0) 0%,rgba(248,248,248,.9) 100%)' }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem', animation:'fadeUp .5s ease both' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', cursor:'pointer', marginBottom:'1.5rem' }} onClick={onBack}>
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
          <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.6rem,4vw,2rem)', fontWeight:400, letterSpacing:'-.03em', color:'var(--ink)', marginBottom:'.35rem', lineHeight:1.1 }}>
            Reset your <em style={{ fontStyle:'italic', color:'var(--fog)' }}>password</em>
          </h1>
          <p style={{ fontSize:'.85rem', color:'var(--fog)' }}>
            {step === 1 && "We'll send a verification code to your email."}
            {step === 2 && `Code sent to ${email}`}
            {step === 3 && 'Almost done — choose a new password.'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:'1.75rem', animation:'fadeUp .5s .06s ease both' }}>
          {STEPS.map((s, i) => (
            <span key={s.n} style={{ display:'contents' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.3rem' }}>
                <div style={{
                  width:'30px', height:'30px', borderRadius:'50%',
                  background: step > s.n ? '#22c55e' : step === s.n ? 'var(--ink)' : 'var(--smoke-3)',
                  color: step >= s.n ? '#fff' : 'var(--fog)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'.7rem', fontWeight:700, transition:'all .3s',
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize:'.65rem', fontWeight:600, color: step === s.n ? 'var(--ink)' : 'var(--fog)', letterSpacing:'.04em', textTransform:'uppercase' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width:'48px', height:'2px', background: step > s.n ? '#22c55e' : 'var(--smoke-3)', margin:'0 4px 18px', transition:'background .3s', borderRadius:'2px' }}/>
              )}
            </span>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background:'var(--white)', border:'1px solid var(--smoke-3)',
          borderRadius:'var(--r-xl)', padding:'2.25rem 2.25rem 2rem',
          boxShadow:'var(--shadow-md)', animation:'fadeUp .5s .1s ease both',
        }}>

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} noValidate>
              <Field
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
              {apiErr && <ErrBox msg={apiErr}/>}
              <SubmitBtn loading={loading} label="Send Verification Code →"/>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate>
              <div style={{ textAlign:'center' }}>
                <CountdownRing seconds={timeLeft}/>
                <p style={{ fontSize:'.82rem', color:'var(--fog)', marginBottom:0 }}>
                  Enter the 6-digit code sent to<br/>
                  <strong style={{ color:'var(--ink)' }}>{email}</strong>
                </p>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={timeLeft === 0}/>

              {timeLeft === 0 && (
                <div style={{ background:'#fff8e1', border:'1.5px solid #fde68a', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#92400e', textAlign:'center', marginBottom:'1rem' }}>
                  ⏱ Code expired.
                </div>
              )}

              {apiErr && <ErrBox msg={apiErr}/>}

              <SubmitBtn loading={loading} disabled={otp.length < 6 || timeLeft === 0} label="Verify Code →"/>

              <div style={{ textAlign:'center', marginTop:'1rem' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || timeLeft > 0}
                  style={{
                    background:'none', border:'none', cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
                    fontSize:'.82rem', color: timeLeft > 0 ? 'var(--mist)' : 'var(--ink)',
                    fontWeight:600, fontFamily:'var(--sans)',
                  }}
                >
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : '↻ Resend new code'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleReset} noValidate>
              <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#15803d', display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'1.25rem' }}>
                ✅ Identity verified — set your new password.
              </div>
              <Field
                label="New password"
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Min. 8 characters"
                error={newPass && newPass.length < 8 ? 'At least 8 characters required.' : ''}
                autoFocus
              />
              <Field
                label="Confirm new password"
                type="password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Re-enter password"
                error={confirmPass && newPass !== confirmPass ? 'Passwords do not match.' : ''}
                success={confirmPass && newPass === confirmPass ? 'Passwords match ✓' : ''}
              />
              {apiErr && <ErrBox msg={apiErr}/>}
              <SubmitBtn
                loading={loading}
                disabled={newPass.length < 8 || newPass !== confirmPass}
                label="Reset Password →"
              />
            </form>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign:'center', marginTop:'1.5rem', animation:'fadeUp .5s .18s ease both' }}>
          <button
            type="button" onClick={onBack}
            style={{ background:'none', border:'none', fontSize:'.82rem', color:'var(--fog)', cursor:'pointer', fontFamily:'var(--sans)', display:'inline-flex', alignItems:'center', gap:'.35rem' }}
          >
            ← Back to sign in
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Tiny shared UI pieces ──────────────────────────────────────────────────────
function ErrBox({ msg }) {
  return (
    <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:'var(--r)', padding:'.65rem .9rem', fontSize:'.82rem', color:'#dc2626', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
      ⚠ {msg}
    </div>
  )
}

function SubmitBtn({ loading, disabled, label }) {
  return (
    <button
      type="submit"
      className="cf-submit"
      disabled={loading || disabled}
      style={{ marginTop:'.25rem' }}
    >
      {loading
        ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
            <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
            Processing…
          </span>
        : label}
    </button>
  )
}
