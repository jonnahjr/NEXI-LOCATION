import { useState } from 'react'
import './App.css'

const STATS = [
  { icon: '👥', label: 'Total Users', value: '52,841', change: '+1,240', up: true },
  { icon: '🏢', label: 'Businesses', value: '3,192', change: '+87', up: true },
  { icon: '💬', label: 'Reviews Today', value: '438', change: '+12%', up: true },
  { icon: '🚨', label: 'Pending Reports', value: '14', change: '-3', up: false },
]

const BUSINESSES = [
  { name: 'Yod Abyssinia Restaurant', city: 'Addis Ababa', status: 'verified', reviews: 348, rating: 4.8 },
  { name: 'Hilton Addis Ababa', city: 'Addis Ababa', status: 'verified', reviews: 912, rating: 4.6 },
  { name: 'Habesha Restaurant', city: 'Bahir Dar', status: 'pending', reviews: 45, rating: 4.3 },
  { name: 'Dire Dawa Motel', city: 'Dire Dawa', status: 'verified', reviews: 121, rating: 4.1 },
  { name: 'Gondar Grand Hotel', city: 'Gondar', status: 'rejected', reviews: 8, rating: 3.2 },
]

const ACTIVITY = [
  { action: 'New business claim', subject: 'Habesha Restaurant', time: '2m ago', type: 'claim' },
  { action: 'Report flagged', subject: 'Review #4421', time: '15m ago', type: 'report' },
  { action: 'New user registered', subject: 'selam@email.com', time: '22m ago', type: 'user' },
  { action: 'Business verified', subject: 'Awash Bank – Bole Branch', time: '1h ago', type: 'verify' },
  { action: 'Photo rejected', subject: 'Upload by user #8821', time: '2h ago', type: 'reject' },
]

const NAV = ['Overview', 'Users', 'Businesses', 'Reviews', 'Reports', 'Rewards', 'Settings']

const statusBadge = (status: string) => {
  if (status === 'verified') return <span className="badge badge-green">Verified</span>
  if (status === 'pending') return <span className="badge badge-yellow">Pending</span>
  if (status === 'rejected') return <span className="badge badge-red">Rejected</span>
  return null
}

const activityIcon = (type: string) => {
  const map: Record<string, string> = { claim: '🏢', report: '🚨', user: '👤', verify: '✅', reject: '❌' }
  return map[type] || '📌'
}

export default function App() {
  const [activeNav, setActiveNav] = useState('Overview')

  return (
    <div className="dash-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📍</span>
          <div>
            <div className="brand-name">Nexi<span className="brand-accent">Locate</span></div>
            <div className="brand-sub">Admin Dashboard</div>
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
          <div className="biz-avatar">🛡️</div>
          <div>
            <div className="biz-name">Admin Panel</div>
            <div className="biz-status verified">● Super Admin</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Platform Overview 🛡️</h1>
            <p className="dash-sub">Monitoring Nexi Locate across all 9 cities in real-time.</p>
          </div>
          <div className="dash-header-actions">
            <button className="btn-outline-sm">📊 Export Report</button>
            <button className="btn-primary-sm">+ Invite Admin</button>
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
          {/* Business Table */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Business Listings</h2>
              <button className="btn-ghost-sm">View all →</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {BUSINESSES.map((biz, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{biz.name}</td>
                    <td>📍 {biz.city}</td>
                    <td>{statusBadge(biz.status)}</td>
                    <td>⭐ {biz.rating}</td>
                    <td>{biz.reviews}</td>
                    <td>
                      <button className="btn-reply">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Activity Feed */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Live Activity</h2>
              <span className="live-dot">🔴 LIVE</span>
            </div>
            <div className="activity-list">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-icon">{activityIcon(a.type)}</div>
                  <div className="activity-body">
                    <div className="activity-action">{a.action}</div>
                    <div className="activity-subject">{a.subject}</div>
                  </div>
                  <div className="activity-time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
