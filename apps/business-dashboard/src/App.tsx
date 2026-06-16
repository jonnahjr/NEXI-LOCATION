import { useState } from 'react'
import './App.css'

const STATS = [
  { icon: '👁️', label: 'Profile Views', value: '12,840', change: '+18%', up: true },
  { icon: '⭐', label: 'Avg. Rating', value: '4.7', change: '+0.2', up: true },
  { icon: '💬', label: 'Reviews', value: '348', change: '+24', up: true },
  { icon: '📸', label: 'Photos', value: '91', change: '+5', up: true },
]

const RECENT_REVIEWS = [
  { name: 'Abebe T.', rating: 5, text: 'Amazing service! The food was incredible and staff were so welcoming.', time: '2h ago' },
  { name: 'Sara M.', rating: 4, text: 'Great ambiance, very clean. Will definitely come back.', time: '5h ago' },
  { name: 'Yonas K.', rating: 5, text: 'Best traditional restaurant in Addis! Highly recommend the injera.', time: '1d ago' },
]

const NAV = ['Dashboard', 'Listings', 'Reviews', 'Photos', 'Analytics', 'Settings']

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard')

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📍</span>
          <div>
            <div className="brand-name">Nexi<span className="brand-accent">Locate</span></div>
            <div className="brand-sub">Business Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item}
              className={`sidebar-link ${activeNav === item ? 'active' : ''}`}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-business">
          <div className="biz-avatar">🍽️</div>
          <div>
            <div className="biz-name">Yod Abyssinia</div>
            <div className="biz-status verified">✅ Verified</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Welcome back, Yod Abyssinia 👋</h1>
            <p className="dash-sub">Here's what's happening with your business today.</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-outline-sm">📊 Export</button>
            <button className="btn-primary-sm">+ Add Photo</button>
          </div>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-icon">{s.icon}</span>
                <span className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</span>
              </div>
              <div className="stat-val">{s.value}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Recent Reviews */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Recent Reviews</h2>
              <button className="btn-ghost-sm">View all →</button>
            </div>
            <div className="reviews-list">
              {RECENT_REVIEWS.map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-avatar">{r.name[0]}</div>
                  <div className="review-body">
                    <div className="review-top">
                      <span className="review-name">{r.name}</span>
                      <span className="review-stars">{'⭐'.repeat(r.rating)}</span>
                      <span className="review-time">{r.time}</span>
                    </div>
                    <p className="review-text">{r.text}</p>
                    <button className="btn-reply">Reply</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Quick Actions</h2>
            </div>
            <div className="actions-list">
              <button className="action-btn">📝 Edit Business Info</button>
              <button className="action-btn">📸 Upload Photos</button>
              <button className="action-btn">⏰ Update Hours</button>
              <button className="action-btn">📣 Create Promotion</button>
              <button className="action-btn">📊 View Full Analytics</button>
            </div>
            <div className="upgrade-card">
              <div className="upgrade-icon">⚡</div>
              <div>
                <div className="upgrade-title">Go Premium</div>
                <div className="upgrade-sub">Boost your listing and reach 5x more customers</div>
              </div>
              <button className="btn-gold">Upgrade</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
