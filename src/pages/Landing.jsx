import { useEffect, useRef, useState } from 'react'
import { useToast } from '../App'

// ── Animate-on-scroll hook ──
function useScrollAnimate() {
  useEffect(() => {
    const els = document.querySelectorAll('.animate')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.15 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

const TICKER_ITEMS = [
  'Automated Feature Engineering','·','Data Drift Detection','·','Groq LLM Chat','·',
  'RAG Knowledge Base','·','Web Search Intelligence','·','Model Export (.pkl)','·',
  'Evidently Drift Reports','·','Classification & Regression','·',
  'Automated Feature Engineering','·','Data Drift Detection','·','Groq LLM Chat','·',
  'RAG Knowledge Base','·','Web Search Intelligence','·','Model Export (.pkl)','·',
  'Evidently Drift Reports','·','Classification & Regression','·',
]

const PRODUCTS = [
  { num:'01', icon:'', title:'RAG & Web Search Chatbot', desc:'Upload PDFs to a vector knowledge base, then chat with an AI that retrieves context from your documents or searches the web in real-time. Full agent workflow tracing included.', tag:'Document Intelligence' },
  { num:'02', icon:'', title:'AutoML Pipeline Studio',   desc:'Upload a CSV, select your target column, and run a complete AutoML pipeline. Trains 12+ models, detects data drift, exports the best model as .pkl, and lets you chat about results with Groq AI.', tag:'Machine Learning' },
  { num:'03', icon:'', title:'Groq-Accelerated LLM',    desc:"All conversational AI is powered by Groq's ultra-fast inference, giving you near-instant responses when exploring model results, asking data questions, or getting improvement recommendations.", tag:'Groq · Llama 3.3' },
  { num:'04', icon:'', title:'Drift Detection',          desc:'Powered by Evidently AI, our drift engine compares train/test feature distributions column-by-column, flagging statistically significant shifts before you deploy to production.', tag:'Evidently AI' },
  { num:'05', icon:'', title:'Export & Reporting',       desc:'Download your best model as a production-ready .pkl file, get a detailed text report, and export the full Evidently HTML drift report — all in one click from the results dashboard.', tag:'Production Ready' },
  { num:'06', icon:'', title:'Secure & Private',         desc:'Your data never leaves your session. Each pipeline run is isolated with a unique job ID. No data is stored beyond your active session unless you explicitly export it.', tag:'Privacy First' },
]

const ABOUT_FEATURES = [
  { icon:'🧠', title:'Intelligent Pipeline',   sub:'Automatically selects preprocessing, model families, and evaluation metrics based on your data profile.' },
  { icon:'💬', title:'Conversational AI',       sub:'Ask questions about your model results, data quality, and improvement strategies in plain language.' },
  { icon:'📊', title:'Drift Monitoring',        sub:'Evidently-powered drift detection compares train/test distributions before you deploy.' },
]

export default function Landing({ nav }) {
  useScrollAnimate()
  const toast = useToast()
  const [contactSent, setContactSent] = useState(false)

  function submitContact(e) {
    e.preventDefault()
    setContactSent(true)
    toast('Message sent successfully!', 'success')
  }

  return (
    <div id="pgLanding" style={{ overflowY: 'auto' }}>

      {/* ── HERO ── */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot"/>
            Introducing RaWML.ai v3.0
          </div>
          <h1 className="hero-h1">
            Machine learning,<br/><em>without the complexity</em>
          </h1>
          <p className="hero-sub">
            Upload your dataset, define your goal, and let RaWML.ai build, evaluate, and explain the best model — powered by state-of-the-art automation and Groq-accelerated AI.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={nav.openChatSelect}>
              <span>Start for free</span><span>→</span>
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior:'smooth' })}>
              <span>See how it works</span>
            </button>
          </div>
          <div className="hero-stats">
            {[['12+','Models compared'],['99%','Automated pipeline'],['Groq','AI-accelerated chat'],['RAG','Document intelligence']].map(([n,l], i, arr) => (
              <span key={l} style={{ display:'contents' }}>
                <div className="hero-stat">
                  <div className="hero-stat-n">{n}</div>
                  <div className="hero-stat-l">{l}</div>
                </div>
                {i < arr.length - 1 && <div className="hero-stat-div"/>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker">
        <div className="ticker-inner">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="ticker-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section id="about">
        <div className="container">
          <div className="split">
            <div>
              <div className="section-label animate">About</div>
              <h2 className="section-title animate delay-1">
                Built for data teams<br/>who move <em>fast</em>
              </h2>
              <p className="section-sub animate delay-2">
                RaWML.ai eliminates the manual overhead of model selection, hyperparameter tuning, and drift monitoring. From raw CSV to production-ready model in minutes.
              </p>
              <div className="about-feature-list animate delay-3">
                {ABOUT_FEATURES.map(f => (
                  <div key={f.title} className="about-feature">
                    <div className="af-icon">{f.icon}</div>
                    <div>
                      <div className="af-title">{f.title}</div>
                      <div className="af-sub">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-visual animate delay-2">
              <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--fog)', marginBottom:'1.5rem' }}>
                Pipeline Overview
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.65rem', position:'relative', zIndex:1 }}>
                {[
                  { icon:'📂', title:'Upload & Profile',  sub:'Automatic schema detection',    status:'✓ Done',   active:false, done:true },
                  { icon:'🎯', title:'Target Selection',  sub:'Visual column picker',           status:'✓ Done',   active:false, done:true },
                  { icon:'🤖', title:'AutoML Training',   sub:'12+ models, live progress',      status:'→ Active', active:true,  done:false },
                  { icon:'📈', title:'Results & Drift',   sub:'Full report & model download',   status:null,       active:false, done:false, dim:true },
                ].map(row => (
                  <div key={row.title} style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.9rem 1rem', background: row.active ? 'var(--ink)' : 'var(--white)', borderRadius:'10px', border: `1px solid ${row.active ? 'var(--ink)' : 'var(--smoke-3)'}`, opacity: row.dim ? .5 : 1 }}>
                    <span style={{ fontSize:'1.1rem' }}>{row.icon}</span>
                    <div>
                      <div style={{ fontSize:'.82rem', fontWeight:700, color: row.active ? 'var(--white)' : 'var(--ink)' }}>{row.title}</div>
                      <div style={{ fontSize:'.74rem', color: row.active ? 'rgba(255,255,255,.5)' : 'var(--fog)' }}>{row.sub}</div>
                    </div>
                    {row.status && (
                      <span style={{ marginLeft:'auto', fontSize:'.68rem', fontWeight:700, color: row.active ? 'var(--white)' : '#22c55e', background: row.active ? 'rgba(255,255,255,.15)' : '#f0fdf4', border: row.active ? 'none' : '1px solid #86efac', borderRadius:'20px', padding:'.2rem .55rem' }}>
                        {row.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT ── */}
      <section id="product">
        <div className="container">
          <div className="section-label animate" style={{ color:'rgba(255,255,255,.3)' }}>Product</div>
          <h2 className="section-title animate delay-1">Two powerful modes.<br/><em>One platform.</em></h2>
          <p className="section-sub animate delay-2">Whether you need document intelligence or end-to-end machine learning, RaWML.ai has you covered.</p>
          <div className="product-grid animate delay-3">
            {PRODUCTS.map(p => (
              <div key={p.num} className="product-card">
                <div className="pc-num">{p.num}</div>
                <div className="pc-icon">{p.icon}</div>
                <div className="pc-title">{p.title}</div>
                <div className="pc-desc">{p.desc}</div>
                <span className="pc-tag">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team">
        <div className="container">
          <div className="section-label animate">Team</div>
          <h2 className="section-title animate delay-1">The people behind<br/><em>the platform</em></h2>
          <p className="section-sub animate delay-2">A focused team of engineers and data scientists building tools that make machine learning accessible to everyone.</p>
          <div className="team-grid">
            <div className="team-card animate delay-1">
              <div className="tc-photo">
                <img src="https://sandyie.in/images/sanju2.png" alt="Sanjy D K"/>
                <div className="tc-photo-ring"/>
              </div>
              <div className="tc-body">
                <div className="tc-name">Sanjy D K</div>
                <div className="tc-role">Founder &amp; CEO</div>
                <div className="tc-bio">Former ML engineer at a leading fintech. Built and shipped ML pipelines at scale for 1 year before founding RaWML.ai.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background:'var(--smoke)' }}>
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="section-label animate">Contact</div>
              <h2 className="section-title animate delay-1">Get in touch.<br/><em>We reply fast.</em></h2>
              <p className="section-sub animate delay-2">Have a question about our product, a partnership inquiry, or need technical support? We're here to help.</p>
              <div className="contact-info animate delay-3">
                {[
                  { icon:'✉️', label:'Email',  value:<a href="mailto:business@sandyie.in">business@sandyie.in</a> },
                  { icon:'📞', label:'Phone',  value:<a href="tel:+919876543210">+91 901 988 3633</a> },
                  { icon:'📍', label:'Office', value:'Remote' },
                  { icon:'🕐', label:'Hours',  value:'Mon – Fri, 9 AM – 6 PM IST' },
                ].map(r => (
                  <div key={r.label} className="ci-row">
                    <div className="ci-icon">{r.icon}</div>
                    <div>
                      <div className="ci-label">{r.label}</div>
                      <div className="ci-value">{r.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-form animate delay-2">
              <div className="cf-title">Send us a message</div>
              <form onSubmit={submitContact}>
                <div className="cf-row">
                  <div className="cf-field"><label className="cf-label">First name</label><input className="cf-input" type="text" placeholder="First Name"/></div>
                  <div className="cf-field"><label className="cf-label">Last name</label><input className="cf-input" type="text" placeholder="Last Name"/></div>
                </div>
                <div className="cf-field"><label className="cf-label">Email address</label><input className="cf-input" type="email" placeholder="you@company.com"/></div>
                <div className="cf-field"><label className="cf-label">Subject</label><input className="cf-input" type="text" placeholder="Product inquiry…"/></div>
                <div className="cf-field"><label className="cf-label">Message</label><textarea className="cf-input" placeholder="Tell us what you need…"/></div>
                <button className="cf-submit" type="submit" disabled={contactSent}>
                  {contactSent ? 'Message sent ✓' : 'Send Message →'}
                </button>
              </form>
              <div className="cf-note">We typically respond within 24 hours on business days.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-logo" style={{ marginBottom:'.75rem' }}>
                <div className="nav-logo-mark">
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <span className="nav-logo-text" style={{ color:'var(--white)' }}>RaWML<span style={{ color:'rgba(255,255,255,.3)' }}>.ai</span></span>
              </div>
              <p>Intelligent machine learning automation for modern data teams. Build, evaluate, and deploy ML models without the overhead.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                <a href="#" onClick={e => { e.preventDefault(); nav.openChatSelect() }}>RAG Chatbot</a>
                <a href="#" onClick={e => { e.preventDefault(); nav.openChatSelect() }}>AutoML Studio</a>
                <a href="#" onClick={e => { e.preventDefault(); document.getElementById('product')?.scrollIntoView({ behavior:'smooth' }) }}>Features</a>
                <a href="#" onClick={e => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior:'smooth' }) }}>How it works</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                {['about','team','contact'].map(id => (
                  <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }) }}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <div className="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 RaWML.ai. All rights reserved.</span>
            <span>Built with ♥ in India</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
