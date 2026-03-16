/**
 * AuthContext.jsx
 * Global auth state + all API methods.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// const AUTH_URL = 'http://localhost:8000'
const AUTH_URL = 'https://automl-auth-backend.onrender.com'


const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('aml_token')
    if (!token) { setLoading(false); return }
    fetch(`${AUTH_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u  => setUser(u))
      .catch(()  => localStorage.removeItem('aml_token'))
      .finally(() => setLoading(false))
  }, [])

  const signup = useCallback(async ({ email, username, password, confirm_password }) => {
    const res  = await fetch(`${AUTH_URL}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, confirm_password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Signup failed.')
    localStorage.setItem('aml_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const res  = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Login failed.')
    localStorage.setItem('aml_token', data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aml_token')
    setUser(null)
  }, [])

  const checkUsername = useCallback(async (username) => {
    if (!username || username.length < 3) return null
    const res  = await fetch(`${AUTH_URL}/auth/check-username/${encodeURIComponent(username)}`)
    return res.json()
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
