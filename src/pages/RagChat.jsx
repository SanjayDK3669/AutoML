import { useState, useRef, useEffect, useCallback } from 'react'
import { ragApi } from '../config'
import { genUUID, esc, fmtBytes } from '../utils'
import { useToast } from '../App'

// ── helpers ──
function timeStr() {
  return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
}

// Build trace HTML for a message
function TracePanel({ events }) {
  const [open, setOpen] = useState(false)
  if (!events || events.length === 0) return null
  return (
    <div className="trace-wrapper">
      <button className="trace-toggle" onClick={() => setOpen(v => !v)}>
        🔬 Agent Workflow Trace {open ? '▴' : '▾'}
      </button>
      {open && (
        <div className="trace-panel open">
          {events.map((ev, i) => {
            const icons = { router:'➡️', rag_lookup:'📚', web_search:'🌐', answer:'💡', __end__:'✅' }
            const icon = icons[ev.node_name] || '⚙️'
            return (
              <div key={i} className="trace-step">
                <div className="trace-step-head">
                  {icon} Step {ev.step}: <code>{ev.node_name}</code>
                </div>
                <div className="trace-step-desc">
                  {ev.description || ''}
                  {ev.node_name === 'rag_lookup' && ev.details?.sufficiency_verdict && (
                    <>
                      <span className={`verdict-badge ${ev.details.sufficiency_verdict === 'Sufficient' ? 'sufficient' : 'insufficient'}`}>
                        {ev.details.sufficiency_verdict}
                      </span>
                      {' '}
                      {ev.details.sufficiency_verdict === 'Sufficient'
                        ? <small style={{ color:'#16a34a' }}>Relevant info found.</small>
                        : <small style={{ color:'#e65100' }}>Diverting to Web Search.</small>}
                      {ev.details.retrieved_content_summary && (
                        <div className="trace-json">{ev.details.retrieved_content_summary}</div>
                      )}
                    </>
                  )}
                  {ev.node_name === 'web_search' && ev.details?.retrieved_content_summary && (
                    <div className="trace-json">{ev.details.retrieved_content_summary}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Single message bubble
function Message({ role, content, trace, time }) {
  return (
    <div className={`msg-row ${role}`}>
      <div className={`msg-av ${role === 'assistant' ? 'bot' : 'user'}`}>
        {role === 'assistant' ? 'AI' : 'U'}
      </div>
      <div className="msg-content">
        <div className="msg-bub">
          <span dangerouslySetInnerHTML={{ __html: esc(content).replace(/\n/g,'<br>') }}/>
          {role === 'assistant' && <TracePanel events={trace}/>}
        </div>
        <div className="msg-meta">{time}</div>
      </div>
    </div>
  )
}

// Typing indicator
function Typing() {
  return (
    <div className="typing-row">
      <div className="msg-av bot">AI</div>
      <div className="typing-bub">
        <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
      </div>
    </div>
  )
}

export default function RagChat({ nav }) {
  const toast = useToast()
  const [sessions,    setSessions]    = useState([])
  const [curSessId,   setCurSessId]   = useState(null)
  const [messages,    setMessages]    = useState([]) // { role, content, trace, time }
  const [typing,      setTyping]      = useState(false)
  const [wsOn,        setWsOn]        = useState(true)
  const [attached,    setAttached]    = useState(null)    // filename string
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modal,       setModal]       = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // { type:'success'|'error', text }
  const [input,       setInput]       = useState('')
  const taRef      = useRef(null)
  const areaRef    = useRef(null)
  const fileInputRef = useRef(null)

  // Start a fresh chat on mount
  useEffect(() => { newChat() }, [])

  function newChat() {
    const id = genUUID()
    setCurSessId(id)
    setMessages([{ role:'assistant', content:'Hello! How can I help you today?', time: timeStr() }])
    setSessions(prev => {
      const fresh = { id, name:'New Conversation' }
      return [fresh, ...prev]
    })
  }

  function scrollBottom() {
    setTimeout(() => {
      if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
    }, 50)
  }

  async function sendMessage() {
    const q = input.trim()
    if (!q) return
    setInput('')
    taRef.current && (taRef.current.style.height = 'auto')
    // Name session after first user message
    setSessions(prev => prev.map(s => s.id === curSessId && s.name === 'New Conversation'
      ? { ...s, name: q.length > 38 ? q.slice(0,36)+'…' : q }
      : s))
    setMessages(m => [...m, { role:'user', content:q, time: timeStr() }])
    setTyping(true)
    scrollBottom()
    try {
      const res = await fetch(ragApi('/chat/'), {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ session_id: curSessId, query: q, enable_web_search: wsOn })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const ans = data.response || 'Sorry, no response.'
      setMessages(m => [...m, { role:'assistant', content:ans, trace: data.trace_events || [], time: timeStr() }])
    } catch (err) {
      const msg = err.message.includes('Failed to fetch')
        ? '⚠️ Cannot reach RAG backend.'
        : '⚠️ ' + err.message
      setMessages(m => [...m, { role:'assistant', content:msg, time: timeStr() }])
    } finally {
      setTyping(false)
      scrollBottom()
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function autoResize(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  // Upload modal
  function openModal() { setModal(true); setPendingFile(null); setUploadStatus(null) }
  function closeModal() { setModal(false); setPendingFile(null); setUploadStatus(null) }

  function handleFilePick(f) {
    if (f && f.type === 'application/pdf') { setPendingFile(f); setUploadStatus(null) }
    else toast('Only PDF files allowed', 'error')
  }

  async function doUpload() {
    if (!pendingFile) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', pendingFile, pendingFile.name)
    try {
      const res = await fetch(ragApi('/upload-document/'), { method:'POST', body:fd })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const name = data.filename || pendingFile.name
      setUploadStatus({ type:'success', text:` '${name}' uploaded! ${data.processed_chunks ? data.processed_chunks+' chunks indexed.' : ''}` })
      setAttached(name)
      toast('Document uploaded: ' + name, 'success')
      setTimeout(() => closeModal(), 2000)
    } catch (err) {
      setUploadStatus({ type:'error', text:'❌ Upload failed: ' + err.message })
      toast('Upload failed: ' + err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const SUGGESTIONS = [
    { title:' Summarize document', sub:'Extract key insights from files', q:'Summarize the uploaded document' },
    { title:' Search the web',     sub:'Find current information online',  q:'Search for the latest trends in AI' },
    { title:' Query knowledge base',sub:'Ask about indexed documents',     q:'What does my knowledge base contain?' },
    { title:' Analyze & compare',  sub:'Deep analysis across sources',     q:'Compare and analyze the data from my documents' },
  ]

  const showWelcome = messages.filter(m => m.role === 'user').length === 0

  return (
    <div className="chat-page">
      {/* Nav bar */}
      <div className="chat-nav">
        <div className="chat-nav-left">
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background:'none', border:'none', fontSize:'1.1rem', cursor:'pointer', color:'var(--fog)', padding:'.25rem .35rem' }}>☰</button>
          <span className="chat-nav-logo">AutoML<span style={{ color:'var(--fog)' }}>.ai</span></span>
          <span className="chat-nav-badge">RAG + Web Search</span>
        </div>
        <div className="chat-nav-right">
          <div className="chat-online"><span className="chat-online-dot"/>Online</div>
          <button className="btn-back-home" onClick={nav.goHome}>← Home</button>
        </div>
      </div>

      <div className="chat-layout">
        {/* Sidebar */}
        <div className={`chat-sidebar ${sidebarOpen ? 'sb-open' : 'sb-collapsed'}`}>
          <div className="sb-top">
            <button className="sb-new-btn" onClick={newChat}>✏ New Chat</button>
          </div>
          <div className="sb-label">Recent</div>
          <div className="sb-history">
            {sessions.map(s => (
              <div key={s.id} className={`hi-item ${s.id === curSessId ? 'active' : ''}`} onClick={() => setCurSessId(s.id)}>
                <span>💬</span><span className="hi-text">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="sb-footer">
            <div className="sb-avatar">U</div>
            <div><div className="sb-uname">User</div><div className="sb-urole">Professional Plan</div></div>
          </div>
        </div>

        {/* Main */}
        <div className="chat-main">
          <div className="chat-area" ref={areaRef}>
            <div className="chat-inner">
              {/* Welcome screen if no user messages */}
              {showWelcome && (
                <div className="rag-welcome">
                  {/* <div className="rw-icon"></div> */}
                  <div className="rw-title">Hello, I'm your AI Agent</div>
                  <div className="rw-sub">I can answer questions from your uploaded documents or search the web in real-time.</div>
                  <div className="rw-sugs">
                    {SUGGESTIONS.map(s => (
                      <div key={s.q} className="rw-sug" onClick={() => { setInput(s.q); taRef.current?.focus() }}>
                        <div className="rw-sug-title">{s.title}</div>
                        <div className="rw-sug-sub">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Messages */}
              {messages.map((m, i) => (
                <Message key={i} role={m.role} content={m.content} trace={m.trace} time={m.time}/>
              ))}
              {typing && <Typing/>}
            </div>
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <div className="chat-input-inner">
              <div className="chat-toolbar">
                <div className="tool-chip" onClick={openModal}><span>＋</span><span>Add Document</span></div>
                <div className={`tool-chip ${wsOn ? 'active' : ''}`} onClick={() => { setWsOn(v => !v); toast(wsOn ? 'Web search disabled' : 'Web search enabled') }}>
                  <span className="chip-dot"/>
                  <span>Web Search: {wsOn ? 'ON' : 'OFF'}</span>
                </div>
                {attached && (
                  <div className="file-pill-rag">
                    <span>📎</span>
                    <span className="fpr-name">{attached}</span>
                    <button className="fpr-rm" onClick={() => setAttached(null)}>✕</button>
                  </div>
                )}
              </div>
              <div className="chat-ibox">
                <textarea
                  ref={taRef}
                  className="chat-ta"
                  placeholder="Ask me anything…"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  onInput={autoResize}
                />
                <button className="chat-send" onClick={sendMessage} disabled={!input.trim() || typing}>➤</button>
              </div>
              <div className="chat-hint">Enter to send · Shift+Enter for new line · Powered by RaWML.ai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {modal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-h">Upload Document</div>
            <div className="modal-sub-txt">Add a PDF to your knowledge base for RAG-based answers.</div>
            <div
              className="drop-zone-modal"
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
              onDragLeave={e => e.currentTarget.classList.remove('dragover')}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); const f = e.dataTransfer.files[0]; if (f) handleFilePick(f) }}
            >
              <input type="file" accept=".pdf" ref={fileInputRef} onChange={e => handleFilePick(e.target.files[0])}/>
              <div style={{ fontSize:'2rem', marginBottom:'.6rem' }}></div>
              <div style={{ fontSize:'.9rem', fontWeight:700, color:'var(--ink)' }}>Drag &amp; drop or click to browse</div>
              <div style={{ fontSize:'.78rem', color:'var(--fog)', marginTop:'.3rem' }}>PDF files only · Max 50 MB</div>
            </div>
            {pendingFile && (
              <div className="sel-file-box show">
                <span style={{ fontSize:'1.4rem' }}></span>
                <div>
                  <div className="sf-name">{pendingFile.name}</div>
                  <div className="sf-sz">{fmtBytes(pendingFile.size)}</div>
                </div>
              </div>
            )}
            <button className="upload-modal-btn" onClick={doUpload} disabled={!pendingFile || uploading}>
              {uploading ? 'Uploading…' : '⬆ Upload to Knowledge Base'}
            </button>
            {uploadStatus && (
              <div className={`upload-st ${uploadStatus.type}`}>{uploadStatus.text}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
