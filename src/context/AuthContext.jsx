/**
 * AuthContext.jsx
 * Global auth state — token stored in localStorage, user object in memory.
 * Wrap <App> with <AuthProvider> to make useAuth() available everywhere.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// const AUTH_URL = 'http://localhost:8000'
const AUTH_URL = 'https://automl-auth-backend.onrender.com'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)   // { id, email, username }
  const [loading, setLoading] = useState(true)   // verifying token on mount

  // ── On mount: validate token stored in localStorage ──────────────────────
  useEffect(() => {
    const token = localStorage.getItem('aml_token')
    if (!token) { setLoading(false); return }

    fetch(`${AUTH_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u  => setUser(u))
      .catch(()  => localStorage.removeItem('aml_token'))
      .finally(() => setLoading(false))
  }, [])

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = useCallback(async ({ email, username, password, confirm_password }) => {
    const res  = await fetch(`${AUTH_URL}/auth/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, username, password, confirm_password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Signup failed.')
    localStorage.setItem('aml_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const res  = await fetch(`${AUTH_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Login failed.')
    localStorage.setItem('aml_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('aml_token')
    setUser(null)
  }, [])

  // ── Check username availability (debounced by caller) ─────────────────────
  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) return null
    const res  = await fetch(`${AUTH_URL}/auth/check-username/${encodeURIComponent(username)}`)
    const data = await res.json()
    return data   // { available: bool, message: string }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, checkUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
