import { useState, useCallback, createContext, useContext } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import ChatSelect from './pages/ChatSelect'
import RagChat from './pages/RagChat'
import AutoMLPage from './pages/AutoMLPage'
import AuthPage from './pages/AuthPage'
import Toast from './components/Toast'

// ── Toast context so any component can fire toasts ──────────────────────────
export const ToastContext = createContext(null)
export function useToast() { return useContext(ToastContext) }

// ── Inner app — needs AuthProvider to already be mounted ────────────────────
function AppInner() {
  const { user, loading, logout } = useAuth()

  // page:  'landing' | 'chatSelect' | 'auth' | 'ragChat' | 'automl'
  const [page,    setPage]    = useState('landing')
  // where to go after successful auth
  const [authDest, setAuthDest] = useState('chatSelect')
  const [toasts,  setToasts]  = useState([])

  const toast = useCallback((msg, type = '') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  // ── Guard: open chat only if logged in ────────────────────────────────────
  function openChatSelect() {
    if (loading) return
    if (!user) {
      setAuthDest('chatSelect')
      setPage('auth')
    } else {
      setPage('chatSelect')
    }
  }

  function launchRag() {
    if (!user) { setAuthDest('ragChat'); setPage('auth'); return }
    setPage('ragChat')
  }

  function launchAutoML() {
    if (!user) { setAuthDest('automl'); setPage('auth'); return }
    setPage('automl')
  }

  function goHome() { setPage('landing') }

  // Called after successful login / signup
  function onAuthSuccess() {
    toast(`Welcome! You're now signed in.`, 'success')
    setPage(authDest)
  }

  function handleLogout() {
    logout()
    toast('Signed out successfully.')
    setPage('landing')
  }

  const nav = { goHome, openChatSelect, launchRag, launchAutoML }

  return (
    <ToastContext.Provider value={toast}>
      {/* Nav shown on landing + chatSelect pages */}
      {(page === 'landing' || page === 'chatSelect') && (
        <Nav onChat={openChatSelect} onHome={goHome} user={user} onLogout={handleLogout} />
      )}

      {page === 'landing'    && <Landing    nav={nav} />}
      {page === 'chatSelect' && <ChatSelect nav={nav} />}
      {page === 'auth'       && (
        <AuthPage
          onSuccess={onAuthSuccess}
          onBack={goHome}
        />
      )}
      {page === 'ragChat'    && <RagChat    nav={{ ...nav, onLogout: handleLogout }} />}
      {page === 'automl'     && <AutoMLPage nav={{ ...nav, onLogout: handleLogout }} />}

      {/* Global toast container */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </ToastContext.Provider>
  )
}

// ── Root export — AuthProvider wraps everything ──────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
