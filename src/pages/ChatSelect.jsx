export default function ChatSelect({ nav }) {
  return (
    <div style={{ background:'var(--smoke)', minHeight:'100vh' }}>
      <div className="chat-select-wrap">
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
            {/* <div className="cs-card-icon"></div> */}
            <div className="cs-card-title">RAG &amp; Web Search</div>
            <div className="cs-card-desc">
              Upload documents, build a knowledge base, and chat with an AI that searches your files and the web to answer any question.
            </div>
          </div>

          {/* AutoML Card */}
          <div className="cs-card" onClick={nav.launchAutoML}>
            <div className="cs-card-arrow">→</div>
            <div className="cs-card-badge">Machine Learning</div>
            {/* <div className="cs-card-icon"></div> */}
            <div className="cs-card-title">AutoML Studio</div>
            <div className="cs-card-desc">
              Upload a CSV, select your target, and run an automated ML pipeline. Then chat with Groq AI about your results and model performance.
            </div>
          </div>
        </div>

        <button
          onClick={nav.goHome}
          style={{ marginTop:'2.5rem', background:'none', border:'none', fontSize:'.85rem', color:'var(--fog)', cursor:'pointer', display:'flex', alignItems:'center', gap:'.4rem', fontFamily:'var(--sans)' }}
        >
          ← Back to homepage
        </button>
      </div>
    </div>
  )
}
