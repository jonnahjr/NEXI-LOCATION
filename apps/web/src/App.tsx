import { useState } from 'react'
import './index.css'
import './App.css'

const NAV_LINKS = ['Features', 'How it Works', 'For Business', 'Rewards', 'Download']

const FEATURES = [
  { icon: '🗺️', title: 'Smart Discovery', desc: 'Find verified places, restaurants, hospitals, hotels and more across Ethiopia with AI-powered recommendations.' },
  { icon: '⚡', title: 'Nexi Points', desc: 'Earn reward points for every check-in, review, and photo you contribute to the community.' },
  { icon: '🏢', title: 'Business Hub', desc: 'Claim your business, manage listings, respond to reviews and access analytics — all in one place.' },
  { icon: '🤖', title: 'AI Assistant', desc: 'Ask anything in Amharic or English. Get smart recommendations tailored to your exact needs.' },
  { icon: '✅', title: 'Community Verified', desc: 'Every listing is verified by our community of contributors ensuring accurate, trustworthy information.' },
  { icon: '📡', title: 'Offline-First', desc: 'Access your saved places and maps even without an internet connection — built for Ethiopian realities.' },
]

const STATS = [
  { value: '10K+', label: 'Places Listed' },
  { value: '50K+', label: 'App Users' },
  { value: '9', label: 'Major Cities' },
  { value: '4.8★', label: 'App Rating' },
]

const STEPS = [
  { step: '01', title: 'Download the App', desc: 'Get Nexi Locate on Android or iOS. Free forever for users.' },
  { step: '02', title: 'Discover Nearby', desc: 'See places around you on an interactive map. Filter by category.' },
  { step: '03', title: 'Review & Earn', desc: 'Leave reviews, upload photos, and earn Nexi Points redeemable for rewards.' },
]

const CITIES = ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Hawassa', 'Gondar', 'Mekelle', 'Adama', 'Jimma', 'Dessie']

export default function App() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <div className="app">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-icon">📍</span>
            <span className="brand-name">Nexi<span className="brand-accent">Locate</span></span>
          </div>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {NAV_LINKS.map(link => (
              <a key={link} href="#" className="nav-link" onClick={() => setMenuOpen(false)}>{link}</a>
            ))}
          </div>
          <div className="nav-actions">
            <a href="#" className="btn-ghost">Login</a>
            <a href="#" className="btn-primary-sm">Get App</a>
          </div>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span>🇪🇹</span>
            <span>Ethiopia's Digital Location Ecosystem</span>
          </div>
          <h1 className="hero-title">
            Discover. Earn.<br />
            <span className="hero-title-accent">Promote. Connect.</span>
          </h1>
          <p className="hero-sub">
            Nexi Locate is not just a map. It's how Ethiopia's people, businesses,
            and communities become digitally connected — powered by AI.
          </p>

          <form className="hero-form" onSubmit={handleWaitlist}>
            {submitted ? (
              <div className="form-success">
                <span>✅</span>
                <span>You're on the list! We'll notify you at launch.</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  className="hero-input"
                  placeholder="Enter your email for early access"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">
                  Get Early Access →
                </button>
              </>
            )}
          </form>

          <div className="hero-store-btns">
            <button className="store-btn">
              <span>▶</span> Google Play
            </button>
            <button className="store-btn">
              <span></span> App Store
            </button>
          </div>
        </div>

        {/* Mock Phone */}
        <div className="phone-mockup">
          <div className="phone-frame">
            <div className="phone-screen">
              <div className="phone-header">
                <div>
                  <div className="phone-greeting">Good morning 👋</div>
                  <div className="phone-location">📍 Addis Ababa</div>
                </div>
                <div className="phone-points">⚡ 1,240 pts</div>
              </div>
              <div className="phone-search">🔍 Search places... <span className="phone-ai-tag">AI</span></div>
              <div className="phone-banner">
                <span>🌍</span>
                <div>
                  <div className="phone-banner-title">Discover Ethiopia</div>
                  <div className="phone-banner-sub">10,000+ places near you</div>
                </div>
              </div>
              <div className="phone-cats">
                {['🍽️', '🏨', '🏥', '🛒', '⛽', '🎓'].map((c, i) => (
                  <div key={i} className="phone-cat">{c}</div>
                ))}
              </div>
              <div className="phone-place">
                <div className="phone-place-icon">📌</div>
                <div>
                  <div className="phone-place-name">Yod Abyssinia</div>
                  <div className="phone-place-meta">Restaurant · 0.3 km · ⭐ 4.8</div>
                </div>
              </div>
              <div className="phone-place">
                <div className="phone-place-icon">📌</div>
                <div>
                  <div className="phone-place-name">Hilton Addis</div>
                  <div className="phone-place-meta">Hotel · 0.7 km · ⭐ 4.6</div>
                </div>
              </div>
              <div className="phone-nav">
                {['🏠', '🗺️', '🔖', '⚡', '👤'].map((icon, i) => (
                  <div key={i} className={`phone-nav-tab ${i === 0 ? 'active' : ''}`}>{icon}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        {STATS.map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="section-inner">
          <div className="section-label">What We Offer</div>
          <h2 className="section-title">Everything Your City Needs</h2>
          <p className="section-sub">One platform. Every place. All of Ethiopia.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="section how-section">
        <div className="section-inner">
          <div className="section-label">Simple Process</div>
          <h2 className="section-title">How Nexi Locate Works</h2>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="section cities-section">
        <div className="section-inner">
          <div className="section-label">Phase 1 Coverage</div>
          <h2 className="section-title">Across Ethiopia</h2>
          <p className="section-sub">Launching in 9 major cities with rural areas coming soon</p>
          <div className="cities-grid">
            {CITIES.map(city => (
              <div key={city} className="city-pill">
                <span>📍</span> {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="cta-glow" />
        <div className="section-inner cta-inner">
          <h2 className="cta-title">Ready to Discover Ethiopia?</h2>
          <p className="cta-sub">Join thousands of Ethiopians already using Nexi Locate</p>
          <div className="cta-btns">
            <button className="btn-primary btn-lg">Download Free App →</button>
            <button className="btn-outline">List Your Business</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-icon">📍</span>
            <span className="brand-name">Nexi<span className="brand-accent">Locate</span></span>
          </div>
          <p className="footer-tagline">Discover. Earn. Promote. Connect.</p>
          <p className="footer-copy">© 2025 Nexi Locate. Made with ❤️ in Ethiopia.</p>
        </div>
      </footer>
    </div>
  )
}
