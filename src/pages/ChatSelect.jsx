import { useAuth } from '../context/AuthContext'

export default function ChatSelect({ nav }) {
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    nav.goHome()
  }

  return (
    <div style={{ background:'var(--smoke)', minHeight:'100vh' }}>
      <div className="chat-select-wrap">

        {/* User greeting pill */}
        {user && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'.6rem',
            background:'var(--white)', border:'1px solid var(--smoke-3)',
            borderRadius:'100px', padding:'.35rem 1rem .35rem .45rem',
            marginBottom:'1.5rem', boxShadow:'var(--shadow-xs)',
            animation:'fadeUp .4s ease both',
          }}>
            <span style={{ width:'26px', height:'26px', background:'var(--ink)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.68rem', fontWeight:800, color:'var(--white)', textTransform:'uppercase', flexShrink:0 }}>
              {user.username?.[0]}
            </span>
            <span style={{ fontSize:'.82rem', color:'var(--fog)' }}>
              Signed in as <strong style={{ color:'var(--ink)' }}>@{user.username}</strong>
            </span>
          </div>
        )}

        <div className="cs-eyebrow">Choose your assistant</div>
        <h2 className="cs-title-big">
          What would you like<br/>to work on today?
        </h2>
        <p className="cs-sub">Select a mode to continue. Each is powered by a dedicated AI backend.</p>

        <div className="cs-cards">
          {/* RAG Card */}
          <div className="cs-card" onClick={nav.launchRag}>
            <div className="cs-card-arrow">→</div>
            <div className="cs-card-badge">Document AI</div>
            <div className="cs-card-title">RAG &amp; Web Search</div>
            <div className="cs-card-desc">
              Upload documents, build a knowledge base, and chat with an AI that searches your files and the web to answer any question.
            </div>
          </div>

          {/* AutoML Card */}
          <div className="cs-card" onClick={nav.launchAutoML}>
            <div className="cs-card-arrow">→</div>
            <div className="cs-card-badge">Machine Learning</div>
            <div className="cs-card-title">AutoML Studio</div>
            <div className="cs-card-desc">
              Upload a CSV, select your target, and run an automated ML pipeline. Then chat with Groq AI about your results and model performance.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginTop:'2.5rem', flexWrap:'wrap', justifyContent:'center' }}>
          <button
            onClick={nav.goHome}
            style={{ background:'none', border:'none', fontSize:'.85rem', color:'var(--fog)', cursor:'pointer', display:'flex', alignItems:'center', gap:'.4rem', fontFamily:'var(--sans)' }}
          >
            ← Back to homepage
          </button>
          {user && (
            <button
              onClick={handleLogout}
              style={{ background:'none', border:'1.5px solid #fecaca', borderRadius:'7px', fontSize:'.82rem', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', gap:'.4rem', fontFamily:'var(--sans)', fontWeight:600, padding:'.35rem .85rem', transition:'var(--transition)' }}
            >
              ↩ Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
