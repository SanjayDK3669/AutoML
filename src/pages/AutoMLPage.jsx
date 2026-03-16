import { useState, useRef, useEffect } from 'react'
import { amlApi } from '../config'
import { AML_STEPS, AML_SUGG } from '../config'
import { isNumericDtype, amlFmt } from '../utils'
import { useToast } from '../App'

// ─────────────────────────────────────────────────
// Stage tracker strip at top
// ─────────────────────────────────────────────────
function StageTrack({ step }) {
  const labels = ['Upload','Target','Pipeline','Results','AI Chat']
  return (
    <div className="stage-track">
      {labels.map((label, i) => {
        const idx = i + 1
        const active = idx === step
        const done   = idx < step
        return (
          <span key={label} style={{ display:'contents' }}>
            <div className={`st-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="st-num">{idx}</div>
              <span className="st-label">{label}</span>
            </div>
            {i < labels.length - 1 && <div className="st-sep"/>}
          </span>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────
// S1 — Upload
// ─────────────────────────────────────────────────
function S1Upload({ onUploaded }) {
  const [file,       setFile]       = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState('')
  const [dragover,   setDragover]   = useState(false)
  const fileRef = useRef()

  function pick(f) {
    if (!f?.name.endsWith('.csv')) { setError('Only CSV files are supported.'); return }
    setError(''); setFile(f)
  }

  async function upload() {
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(amlApi('/api/upload'), { method:'POST', body:fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      onUploaded(data)
    } catch(e) { setError(e.message) }
    finally { setUploading(false) }
  }

  return (
    <div className="aml-body"><div className="pw">
      <div className="panel">
        <div className="panel-title">Upload Dataset</div>
        <div className="panel-sub">Upload a cleaned CSV file to begin the AutoML pipeline.</div>
        <div
          className={`aml-drop ${dragover ? 'over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragover(true) }}
          onDragLeave={() => setDragover(false)}
          onDrop={e => { e.preventDefault(); setDragover(false); pick(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => pick(e.target.files[0])}/>
          <span className="dz-icon"></span>
          <div className="dz-head">Drag &amp; Drop or Click to Browse</div>
          <div className="dz-sub">Accepts .csv files</div>
        </div>
        {file && (
          <div>
            <div className="file-chip-aml">
               {file.name} · {(file.size/1024).toFixed(1)}KB
              <button className="chip-rm" onClick={() => setFile(null)}>✕</button>
            </div>
          </div>
        )}
        {error && <div className="alert alert-err" style={{ marginTop:'.75rem' }}>⚠ {error}</div>}
        {file && (
          <div style={{ marginTop:'1.25rem' }}>
            <button className="btn btn-ink btn-lg" onClick={upload} disabled={uploading}>
              {uploading ? 'Uploading…' : '⬆ Upload File'}
            </button>
          </div>
        )}
      </div>
    </div></div>
  )
}

// ─────────────────────────────────────────────────
// S2 — Target column picker
// ─────────────────────────────────────────────────
function S2Target({ meta, onStart }) {
  const [target,    setTarget]    = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const { columns, dtypes, missing, shape } = meta
  const nc = columns.filter(c => isNumericDtype(dtypes[c])).length

  // Reset checkbox whenever target changes
  function pickTarget(col) {
    setTarget(col)
    setConfirmed(false)
  }

  // Inline styles for column tiles based on type
  function tileStyle(col, isPicked) {
    const isNum = isNumericDtype(dtypes[col])
    if (isPicked) return {}   // .picked class handles selected state
    if (isNum) return {
      borderColor: '#1a1a1a',
      color: '#0a0a0a',
      background: '#f0f0f0',
    }
    return {
      borderColor: '#94a3b8',
      color: '#64748b',
      background: '#f8fafc',
    }
  }

  return (
    <div className="aml-body"><div className="pw">
      <div className="panel">
        <div className="panel-title">Choose Target Column</div>
        <div className="panel-sub">Click a column to set it as the prediction target.</div>
        <div className="meta-row">
          {[['Rows',shape.rows.toLocaleString()],['Columns',shape.cols],['Numeric',nc],['Categorical',columns.length-nc]].map(([l,v]) => (
            <div key={l} className="meta-box"><div className="lbl">{l}</div><div className="val">{v}</div></div>
          ))}
        </div>

        {/* Legend */}
        <div className="legend-row">
          <span style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.2rem .7rem', borderRadius:'6px', border:'1.5px solid #1a1a1a', background:'#f0f0f0', fontSize:'.73rem', fontWeight:700, color:'#0a0a0a' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#0a0a0a', display:'inline-block' }}/>
            Numeric
          </span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'.4rem', padding:'.2rem .7rem', borderRadius:'6px', border:'1.5px solid #94a3b8', background:'#f8fafc', fontSize:'.73rem', fontWeight:700, color:'#64748b' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#94a3b8', display:'inline-block' }}/>
            Categorical
          </span>
        </div>

        {/* Column grid */}
        <div className="col-grid">
          {columns.map(col => {
            const isPicked = target === col
            const isNum    = isNumericDtype(dtypes[col])
            return (
              <div
                key={col}
                className={`col-tile ${isPicked ? 'picked' : ''}`}
                title={`${col} (${dtypes[col]})`}
                style={{ position: 'relative', ...tileStyle(col, isPicked) }}
                onClick={() => pickTarget(col)}
              >
                {/* Small type badge in top-right */}
                {!isPicked && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '5px',
                    fontSize: '.55rem', fontWeight: 800, letterSpacing: '.04em',
                    color: isNum ? '#0a0a0a' : '#94a3b8', opacity: .7,
                    lineHeight: 1,
                  }}>
                    {isNum ? 'NUM' : 'CAT'}
                  </span>
                )}
                {col}
              </div>
            )
          })}
        </div>

        {/* Target info alert */}
        {target && (
          <div className="target-alert" style={{ marginTop:'1rem' }}>
            ✅ Target: <strong>{target}</strong> · Type: <strong>{dtypes[target]}</strong> · Missing: <strong>{missing[target]||0}</strong>
          </div>
        )}

        {/* ── Confirmation checkbox ── */}
        {target && (
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '.65rem',
            padding: '.9rem 1.1rem', marginTop: '.75rem',
            background: confirmed ? '#f0fdf4' : 'var(--smoke)',
            border: `1.5px solid ${confirmed ? '#86efac' : 'var(--smoke-3)'}`,
            borderRadius: 'var(--r)', cursor: 'pointer',
            transition: 'all .2s ease', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: '2px', width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0a0a0a', flexShrink: 0 }}
            />
            <span style={{ fontSize: '.88rem', color: 'var(--ink)', lineHeight: 1.5 }}>
              I confirm that{' '}
              <strong style={{ background: 'var(--ink)', color: '#fff', padding: '.1rem .45rem', borderRadius: '5px', fontFamily: 'var(--mono)', fontSize: '.82rem' }}>
                {target}
              </strong>
              {' '}should be used as the <strong>target column</strong> for this AutoML pipeline.
            </span>
          </label>
        )}

        <button
          className="btn btn-ink btn-lg"
          disabled={!target || !confirmed}
          style={{ marginTop: '1rem' }}
          onClick={() => onStart(target)}
        >
          Start RaWML Pipeline
        </button>
      </div>
    </div></div>
  )
}

// ─────────────────────────────────────────────────
// S3 — Progress
// ─────────────────────────────────────────────────
function S3Progress({ jobStatus, onBack }) {
  const pct  = jobStatus?.progress || 0
  const step = jobStatus?.step
  const msg  = jobStatus?.message || 'Initialising…'
  const isRunning = jobStatus?.status === 'running'

  function rowClass(s) {
    if (!step) return 's-wait'
    if (step === 'error') return s.key === step ? 's-error' : 's-wait'
    const idx     = AML_STEPS.findIndex(x => x.key === step)
    const thisIdx = AML_STEPS.findIndex(x => x.key === s.key)
    if (thisIdx < idx) return 's-done'
    if (thisIdx === idx) return 's-active'
    return 's-wait'
  }

  function rowMsg(s) {
    const cls = rowClass(s)
    if (cls === 's-done')   return 'Complete ✓'
    if (cls === 's-active') return msg
    if (cls === 's-error')  return msg
    return 'Waiting…'
  }

  return (
    <div className="aml-body"><div className="prog-wrap">
      <div className="prog-hero">
        <div className="prog-pct">{pct}%</div>
        <h2>Running RaWML Pipeline</h2>
        <p>{msg}</p>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width:`${pct}%` }}/></div>
      <div className="steps-list">
        {AML_STEPS.map(s => (
          <div key={s.key} className={`step-row ${rowClass(s)}`}>
            <div className="step-ico">{s.icon}</div>
            <div>
              <div className="step-lbl">{s.label}</div>
              <div className="step-msg">{rowMsg(s)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Back button ── */}
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--smoke-3)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-outline-ink btn-sm"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}
        >
          ← Change Target Column
        </button>
        {isRunning && (
          <span style={{ fontSize: '.78rem', color: 'var(--fog)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <span style={{ width: '7px', height: '7px', background: '#f59e0b', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }}/>
            Pipeline is still running in the background
          </span>
        )}
      </div>
    </div></div>
  )
}

// ─────────────────────────────────────────────────
// S4 — Results
// ─────────────────────────────────────────────────
function DriftPanel({ drift }) {
  if (!drift || drift.error) return <div className="alert alert-warn">⚡ {drift?.error || 'Drift data unavailable.'}</div>
  const cols = drift.column_results || []
  const dN   = cols.filter(c => c.drift_detected).length
  return (
    <>
      <div className="drift-stats">
        {[['Checked',cols.length,''],['Drifted',dN,dN?'#dc2626':'#16a34a'],['Stable',cols.length-dN,'#16a34a']].map(([l,v,c]) => (
          <div key={l} className="drift-stat">
            <div className="ds-n" style={c?{color:c}:{}}>{v}</div>
            <div className="ds-l">{l}</div>
          </div>
        ))}
      </div>
      {dN === 0
        ? <div className="alert alert-ok"> No drift detected.</div>
        : <div className="alert alert-warn"> {dN} column(s) drifted — review before deployment.</div>}
      <div className="drift-grid">
        {cols.map(c => (
          <div key={c.column} className={`drift-card ${c.drift_detected ? 'drifted' : 'stable'}`}>
            <div className="dc-name" title={c.column}>{c.column}</div>
            <div className="dc-flag">{c.drift_detected ? ' Drifted' : ' Stable'}</div>
            {c.drift_score != null && <div className="dc-score">Score: {Number(c.drift_score).toFixed(4)} · {c.stattest}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

function ModelsPanel({ results, best, task }) {
  if (!results?.length) return <div className="alert alert-warn">No results.</div>
  const ranked = [...results].filter(r => r.primary != null).sort((a,b) => b.primary - a.primary)
  const maxP   = ranked[0]?.primary || 1
  const mkeys  = task === 'classification' ? ['accuracy','f1','precision','recall'] : ['r2','mse','mae','rmse']
  return (
    <>
      <div style={{ marginBottom:'1.25rem' }}>
        {ranked.map(r => (
          <div key={r.name} className="mr-row">
            <div className="mr-head">
              <div className="mr-name">{r.name === best ? ' ' : ''}{r.name}{r.name === best && <span className="badge b-best" style={{ marginLeft:'.35rem' }}>BEST</span>}</div>
              <div className="mr-score">{r.primary.toFixed(4)}</div>
            </div>
            <div className="mr-bar-track">
              <div className="mr-bar-fill" style={{ width:`${Math.max(2,(r.primary/maxP)*100)}%` }}>
                <span className="bar-lbl">{r.primary.toFixed(3)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Rank</th><th>Model</th>{mkeys.map(k=><th key={k}>{k.toUpperCase()}</th>)}</tr></thead>
          <tbody>
            {ranked.map((r,i) => (
              <tr key={r.name}>
                <td style={{ fontFamily:'var(--mono)' }}>{i+1}</td>
                <td>{r.name}{r.name===best&&<span className="badge b-best" style={{ marginLeft:'.35rem' }}>BEST</span>}</td>
                {mkeys.map(k=><td key={k} style={{ fontFamily:'var(--mono)' }}>{r.metrics[k]??'—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function S4Results({ job, meta, jobId, onOpenChat }) {
  const [tab, setTab] = useState('overview')
  const d    = job
  const pk   = d.task === 'classification' ? 'Accuracy' : 'R²'
  const allCols = [...(d.feature_cols||[]), meta.target].filter(Boolean)
  const da   = d.drift_summary?.html_available

  return (
    <div className="aml-body"><div className="results-wrap">
      <div className="results-banner">
        <div className="rb-left">
          <h2>Best Model: {d.best_model}</h2>
          <p>{pk}: {d.best_score} · Task: {d.task} · {(d.n_rows||0).toLocaleString()} rows</p>
        </div>
        <div className="rb-right">
          <button className="btn btn-ghost-inv btn-sm" onClick={() => window.open(amlApi('/api/download-model/'+jobId),'_blank')}>⬇ Model (.pkl)</button>
          <button className="btn btn-ghost-inv btn-sm" onClick={() => window.open(amlApi('/api/download-report/'+jobId),'_blank')}>📄 Report</button>
          <button className="btn btn-ghost-inv btn-sm" style={{ opacity: da?1:.5 }}
            onClick={() => da ? window.open(amlApi('/api/download-drift-report/'+jobId),'_blank') : alert('Drift HTML report not available.')}>
            Drift Report
          </button>
          <button className="btn btn-ink" style={{ background:'#fff', color:'var(--ink)' }} onClick={onOpenChat}>💬 Open AI Chat →</button>
        </div>
      </div>

      <div className="tabs-row">
        {[['overview','Overview'],['columns','Columns'],['drift','Drift Analysis'],['models','Model Results']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'on':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            {[['Rows',(d.n_rows||0).toLocaleString(),''],['Features',(d.feature_cols||[]).length,''],['Numeric',(d.num_cols||[]).length,'features'],['Categorical',(d.cat_cols||[]).length,'features'],['Task',d.task||'—',''],['Best Score',d.best_score||'—',pk]].map(([l,v,s]) => {
              const strVal = String(v)
              const valStyle = {
                fontSize: strVal.length > 10 ? '.82rem' : strVal.length > 7 ? '1rem' : '1.4rem',
                fontWeight: 700,
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: 1.3,
                marginTop: '.1rem',
              }
              return (
                <div key={l} className="stat-box" style={{ overflow:'hidden' }}>
                  <div className="s-lbl">{l}</div>
                  <div style={valStyle}>{v}</div>
                  {s && <div className="s-sub">{s}</div>}
                </div>
              )
            })}
          </div>
          <div className="alert alert-ok">
             <strong>{d.best_model}</strong> — {pk}: <strong>{d.best_score}</strong> — saved as <code>best_model.pkl</code>
          </div>
        </>
      )}

      {tab === 'columns' && (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>#</th><th>Column</th><th>Type</th><th>Role</th><th>Missing</th><th>Dtype</th></tr></thead>
            <tbody>
              {allCols.map((col,i) => (
                <tr key={col}>
                  <td>{i+1}</td>
                  <td>{col}</td>
                  <td><span className={`badge ${(d.num_cols||[]).includes(col)?'b-num':'b-cat'}`}>{(d.num_cols||[]).includes(col)?'Numeric':'Categorical'}</span></td>
                  <td>{col===meta.target?<span className="badge b-tgt">Target</span>:'Feature'}</td>
                  <td>{meta.missing[col]||0}</td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:'.74rem' }}>{meta.dtypes[col]||''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'drift' && <DriftPanel drift={d.drift_summary}/>}
      {tab === 'models' && <ModelsPanel results={d.model_results} best={d.best_model} task={d.task}/>}
    </div></div>
  )
}

// ─────────────────────────────────────────────────
// S5 — AML Chat
// ─────────────────────────────────────────────────
function AMLChatMsg({ role, text }) {
  return (
    <div className={`aml-brow ${role==='user'?'urow':'brow'}`}>
      <div className="aml-bav">{role==='user'?'U':'AI'}</div>
      <div className="aml-bubble" dangerouslySetInnerHTML={{ __html: amlFmt(text) }}/>
    </div>
  )
}

function S5Chat({ job, meta, jobId, onBack }) {
  const toast = useToast()
  const [msgs,      setMsgs]      = useState([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile')
  const [groqModels,setGroqModels]= useState([{ id:'llama-3.3-70b-versatile', label:'Llama 3.3 · 70B' }])
  const msgRef = useRef()
  const d      = job
  const pk     = d.task === 'classification' ? 'Accuracy' : 'R²'
  const da     = d.drift_summary?.html_available

  useEffect(() => {
    fetch(amlApi('/api/models'))
      .then(r => r.json())
      .then(data => {
        setGroqModels(data.models)
        setGroqModel(data.default)
      }).catch(() => {})
  }, [])

  function scrollBottom() {
    setTimeout(() => { if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight }, 50)
  }

  async function chat(q) {
    const question = q || input.trim()
    if (!question || !jobId) return
    setInput('')
    setMsgs(m => [...m, { role:'user', text:question }])
    setThinking(true); scrollBottom()
    try {
      const res = await fetch(amlApi('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ job_id:jobId, question, groq_model:groqModel })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Chat failed')
      setMsgs(m => [...m, { role:'bot', text:data.answer }])
    } catch(e) {
      setMsgs(m => [...m, { role:'bot', text:'❌ '+e.message }])
    } finally {
      setThinking(false); scrollBottom()
    }
  }

  const showWelcome = msgs.length === 0

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden', flexDirection:'column' }}>
      <div className="aml-chat-layout" style={{ flex:1, height:'100%', overflow:'hidden' }}>
        {/* Sidebar */}
        <aside className="aml-chat-sb">
          <div className="cs-title">Session Info</div>
          <div className="cs-model-card">
            <div className="cs-mc-lbl">Best Model</div>
            <div className="cs-mc-name">{d.best_model||'—'}</div>
            <div className="cs-mc-score">{pk}: {d.best_score}</div>
          </div>
          {[['Task',d.task],['Rows',(d.n_rows||0).toLocaleString()],['Features',(d.feature_cols||[]).length],['Target',meta.target]].map(([l,v]) => (
            <div key={l} className="cs-stat">
              <span className="cs-stat-l">{l}</span>
              <span className="cs-stat-r">{v}</span>
            </div>
          ))}
          <div className="cs-groq-sel">
            <label>Groq Model</label>
            <select value={groqModel} onChange={e => setGroqModel(e.target.value)}>
              {groqModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className="cs-actions">
            <button className="btn btn-outline-ink btn-sm" onClick={() => window.open(amlApi('/api/download-model/'+jobId),'_blank')}>⬇ Download Model</button>
            <button className="btn btn-outline-ink btn-sm" onClick={() => window.open(amlApi('/api/download-report/'+jobId),'_blank')}>📄 Report</button>
            <button className="btn btn-outline-ink btn-sm" style={{ opacity:da?1:.5 }}
              onClick={() => da ? window.open(amlApi('/api/download-drift-report/'+jobId),'_blank') : alert('Drift report not available.')}>
              Drift Report
            </button>
            <button className="btn btn-ink btn-sm" onClick={onBack}>← Back to Results</button>
          </div>
        </aside>

        {/* Chat main */}
        <div className="aml-chat-main">
          <div className="aml-chat-topbar">
            <div>
              <div className="ct-title">Data &amp; Model Assistant</div>
              <div className="ct-sub">Powered by Groq</div>
            </div>
            <span className="ct-badge"> Live</span>
          </div>

          <div className="aml-messages" ref={msgRef}>
            {showWelcome && (
              <div className="cw-aml">
                {/* <span className="cw-icon">🤖</span> */}
                <div className="cw-head">Ask me anything</div>
                <div className="cw-sub">I've read your full pipeline report. Ask about columns, missing values, model performance, drift, or recommendations.</div>
                <div className="cw-sugs">
                  {AML_SUGG.slice(0,4).map(q => (
                    <button key={q} className="cw-sug" onClick={() => chat(q)}>💬 {q}</button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m,i) => <AMLChatMsg key={i} role={m.role} text={m.text}/>)}
            {thinking && (
              <div className="aml-brow brow">
                <div className="aml-bav">AI</div>
                <div className="aml-bubble">
                  <div className="aml-dots"><span/><span/><span/></div>
                </div>
              </div>
            )}
          </div>

          <div className="aml-inputbar">
            <div className="aml-ibox">
              <textarea
                className="aml-ta"
                rows={1}
                placeholder="Ask about your dataset or model results…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chat()} }}
              />
              <button className="aml-sbtn" onClick={() => chat()} disabled={!input.trim()||thinking}>➤</button>
            </div>
            <div className="chat-hint">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// Main AutoMLPage
// ─────────────────────────────────────────────────
export default function AutoMLPage({ nav }) {
  const [step,   setStep]   = useState(1)   // 1-5
  const [meta,   setMeta]   = useState(null) // { filename, columns, dtypes, missing, shape, target }
  const [jobId,  setJobId]  = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const pollRef = useRef(null)

  function onUploaded(data) {
    setMeta({ filename:data.filename, columns:data.columns, dtypes:data.dtypes, missing:data.missing, shape:data.shape, target:null })
    setStep(2)
  }

  async function onStart(target) {
    const id = 'job_' + Date.now()
    setJobId(id)
    setMeta(m => ({ ...m, target }))
    setJobStatus({ progress:0, step:'loading', message:'Initialising…', status:'running' })
    setStep(3)
    try {
      const res = await fetch(amlApi('/api/start-pipeline'), {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ filename:meta.filename, target_column:target, job_id:id })
      })
      if (!res.ok) throw new Error('Failed to start pipeline')
      startPolling(id)
    } catch(e) {
      setJobStatus(j => ({ ...j, status:'error', message:'❌ '+e.message }))
    }
  }

  function startPolling(id) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(amlApi('/api/pipeline-status/'+id))
        const data = await res.json()
        setJobStatus(data)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          setTimeout(() => setStep(4), 700)
        }
        if (data.status === 'error') clearInterval(pollRef.current)
      } catch(_) {}
    }, 1100)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  return (
    <div className="aml-page">
      {/* Top nav */}
      <div className="aml-nav">
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <span style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', color:'var(--ink)' }}>
            RaWML<span style={{ color:'var(--fog)' }}>.ai</span>
          </span>
          <span style={{ fontSize:'.68rem', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', background:'var(--smoke)', color:'var(--ghost)', borderRadius:'20px', padding:'.25rem .75rem', border:'1px solid var(--smoke-3)' }}>
            RaWML Studio
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          <span style={{ fontSize:'.68rem', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--fog)' }}>Groq · Powered</span>
          <button className="btn btn-outline-ink btn-sm" onClick={nav.goHome}>← Home</button>
        </div>
      </div>

      <StageTrack step={step}/>

      {step === 1 && <S1Upload onUploaded={onUploaded}/>}
      {step === 2 && <S2Target meta={meta} onStart={onStart}/>}
      {step === 3 && <S3Progress jobStatus={jobStatus} onBack={() => { if (pollRef.current) clearInterval(pollRef.current); setStep(2) }}/>}
      {step === 4 && jobStatus?.status === 'done' && (
        <S4Results job={jobStatus} meta={meta} jobId={jobId} onOpenChat={() => setStep(5)}/>
      )}
      {step === 5 && jobStatus?.status === 'done' && (
        <S5Chat job={jobStatus} meta={meta} jobId={jobId} onBack={() => setStep(4)}/>
      )}
    </div>
  )
}