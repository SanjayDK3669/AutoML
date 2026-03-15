import { useState, useCallback, createContext, useContext } from 'react'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import ChatSelect from './pages/ChatSelect'
import RagChat from './pages/RagChat'
import AutoMLPage from './pages/AutoMLPage'
import Toast from './components/Toast'

// ── Toast context so any component can fire toasts ──
export const ToastContext = createContext(null)
export function useToast() { return useContext(ToastContext) }

export default function App() {
  const [page, setPage]     = useState('landing')  // 'landing' | 'chatSelect' | 'ragChat' | 'automl'
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = '') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200)
  }, [])

  const nav = {
    goHome:         () => setPage('landing'),
    openChatSelect: () => setPage('chatSelect'),
    launchRag:      () => setPage('ragChat'),
    launchAutoML:   () => setPage('automl'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {/* Nav is shown on landing + chatSelect only */}
      {(page === 'landing' || page === 'chatSelect') && (
        <Nav onChat={nav.openChatSelect} onHome={nav.goHome} />
      )}

      {page === 'landing'     && <Landing     nav={nav} />}
      {page === 'chatSelect'  && <ChatSelect  nav={nav} />}
      {page === 'ragChat'     && <RagChat     nav={nav} />}
      {page === 'automl'      && <AutoMLPage  nav={nav} />}

      {/* Global toast container */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </ToastContext.Provider>
  )
}
