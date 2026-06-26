import { useState, useEffect } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers: number
  totalBusinesses: number
  pendingBusinesses: number
  totalReviews: number
  pendingReports: number
  activePromotions: number
}

const NAV = [
  { id: 'overview',   label: 'Overview',   icon: '🛡️' },
  { id: 'businesses', label: 'Businesses',  icon: '🏢' },
  { id: 'users',      label: 'Users',       icon: '👥' },
  { id: 'reports',    label: 'Reports',     icon: '🚨' },
  { id: 'promotions', label: 'Promotions',  icon: '📣' },
  { id: 'rewards',    label: 'Rewards',     icon: '🎁' },
]

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    verified: 'badge-green', active: 'badge-green',
    pending: 'badge-yellow',
    rejected: 'badge-red', dismissed: 'badge-red',
    actioned: 'badge-green',
  }
  return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>
}

const typeIcon: Record<string, string> = {
  claim: '🏢', report: '🚨', user: '👤', verify: '✅', reject: '❌',
  review: '💬', promotion: '📣', system: '⚙️',
}

export default function App() {
  const [activeNav, setActiveNav] = useState('overview')
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, totalBusinesses: 0, pendingBusinesses: 0,
    totalReviews: 0, pendingReports: 0, activePromotions: 0,
  })
  const [businesses, setBusinesses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [bizFilter, setBizFilter] = useState('all')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Load all platform data ──────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const [bizRes, usersRes, reviewsRes, reportsRes, promosRes] = await Promise.all([
          supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('reviews').select('id', { count: 'exact', head: true }),
          supabase.from('reports').select('*, profiles:reporter_id(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
          supabase.from('business_promotions').select('*, businesses:business_id(name, category)').order('created_at', { ascending: false }).limit(50),
        ])

        const bizData = bizRes.data || []
        const userData = usersRes.data || []
        const reportData = reportsRes.data || []
        const promoData = promosRes.data || []

        setBusinesses(bizData)
        setUsers(userData)
        setReports(reportData)
        setPromotions(promoData)

        setStats({
          totalUsers: userData.length,
          totalBusinesses: bizData.length,
          pendingBusinesses: bizData.filter((b: any) => b.status === 'pending').length,
          totalReviews: reviewsRes.count || 0,
          pendingReports: reportData.length,
          activePromotions: promoData.filter((p: any) => p.active && new Date(p.ends_at) > new Date()).length,
        })
      } catch (err) {
        console.error('Admin load error:', err)
      }
      setLoading(false)
    }
    loadAll()
  }, [])

  // ── Business actions ────────────────────────────────────────────────────
  const updateBizStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('businesses').update({ status, verified: status === 'active' }).eq('id', id)
    if (!error) {
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status, verified: status === 'active' } : b))
      showToast(`Business ${status === 'active' ? 'approved ✅' : 'rejected ❌'}`)
    }
  }

  // ── Report actions ──────────────────────────────────────────────────────
  const resolveReport = async (id: string, resolution: 'dismissed' | 'actioned') => {
    const { error } = await supabase.from('reports').update({ status: resolution }).eq('id', id)
    if (!error) {
      setReports(prev => prev.filter(r => r.id !== id))
      showToast(resolution === 'actioned' ? 'Content removed ✅' : 'Report dismissed')
    }
  }

  // ── Promotion toggle ─────────────────────────────────────────────────────
  const togglePromotion = async (id: string, active: boolean) => {
    const { error } = await supabase.from('business_promotions').update({ active: !active }).eq('id', id)
    if (!error) {
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p))
      showToast(active ? 'Promotion deactivated' : 'Promotion activated ✅')
    }
  }

  // ── Filtered businesses ──────────────────────────────────────────────────
  const filteredBiz = businesses.filter(b => {
    const matchesSearch = !searchQ || b.name?.toLowerCase().includes(searchQ.toLowerCase()) || b.address?.toLowerCase().includes(searchQ.toLowerCase())
    const matchesFilter = bizFilter === 'all' || b.status === bizFilter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="dash-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🛡️</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 14, marginTop: 12 }}>Loading admin panel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-root">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          background: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff', borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 700, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📍</span>
          <div>
            <div className="brand-name">Nexi<span className="brand-accent">Locate</span></div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-link ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span style={{ marginRight: 10 }}>{item.icon}</span>
              {item.label}
              {item.id === 'reports' && stats.pendingReports > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#EF4444', color: '#fff',
                  borderRadius: 10, fontSize: 11, fontWeight: 800,
                  padding: '2px 7px', minWidth: 20, textAlign: 'center',
                }}>
                  {stats.pendingReports}
                </span>
              )}
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

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="dash-main">

        {/* ════════════════════════ OVERVIEW ════════════════════════════ */}
        {activeNav === 'overview' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">Platform Overview 🛡️</h1>
                <p className="dash-sub">Monitoring Nexi Locate across all cities in real-time.</p>
              </div>
              <div className="dash-header-actions">
                <button className="btn-outline-sm" onClick={() => setActiveNav('reports')} style={{ position: 'relative' }}>
                  🚨 Reports {stats.pendingReports > 0 && <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 800, padding: '2px 7px' }}>{stats.pendingReports}</span>}
                </button>
                <button className="btn-primary-sm">+ Invite Admin</button>
              </div>
            </header>

            <div className="stats-grid">
              {[
                { icon: '👥', label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: 'Registered', up: true },
                { icon: '🏢', label: 'Businesses', value: stats.totalBusinesses.toLocaleString(), change: `${stats.pendingBusinesses} pending`, up: stats.pendingBusinesses === 0 },
                { icon: '💬', label: 'Total Reviews', value: stats.totalReviews.toLocaleString(), change: 'All time', up: true },
                { icon: '🚨', label: 'Open Reports', value: stats.pendingReports.toString(), change: 'Need action', up: stats.pendingReports === 0 },
              ].map(s => (
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

            <div className="content-grid">
              {/* Pending businesses */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Pending Approval ({stats.pendingBusinesses})</h2>
                  <button className="btn-ghost-sm" onClick={() => setActiveNav('businesses')}>View all →</button>
                </div>
                {businesses.filter(b => b.status === 'pending').length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>✅ No pending businesses — all clear!</p>
                ) : (
                  <table className="admin-table">
                    <thead><tr><th>Business</th><th>Category</th><th>Actions</th></tr></thead>
                    <tbody>
                      {businesses.filter(b => b.status === 'pending').slice(0, 5).map((biz) => (
                        <tr key={biz.id}>
                          <td style={{ color: 'var(--text)', fontWeight: 600 }}>{biz.name}</td>
                          <td>{biz.category}</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                              onClick={() => updateBizStatus(biz.id, 'active')}
                            >✅ Approve</button>
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                              onClick={() => updateBizStatus(biz.id, 'rejected')}
                            >❌ Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Open reports */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">🚨 Open Reports</h2>
                  <button className="btn-ghost-sm" onClick={() => setActiveNav('reports')}>View all →</button>
                </div>
                {reports.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>✅ No pending reports!</p>
                ) : reports.slice(0, 4).map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 20 }}>{typeIcon[r.content_type] || '🚨'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {r.content_type} • {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-reply" style={{ color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: 11 }} onClick={() => resolveReport(r.id, 'actioned')}>Action</button>
                      <button className="btn-reply" style={{ fontSize: 11 }} onClick={() => resolveReport(r.id, 'dismissed')}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════ BUSINESSES ══════════════════════════ */}
        {activeNav === 'businesses' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">🏢 Business Listings</h1>
                <p className="dash-sub">Review, approve, and manage all registered businesses</p>
              </div>
            </header>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                style={{
                  flex: 1, minWidth: 200, background: 'var(--card)', border: '1px solid var(--border2)',
                  borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                }}
                placeholder="Search businesses..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {['all', 'active', 'pending', 'rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setBizFilter(f)}
                  style={{
                    padding: '9px 16px', borderRadius: 10, border: '1px solid',
                    borderColor: bizFilter === f ? 'var(--primary)' : 'var(--border2)',
                    background: bizFilter === f ? 'var(--primary-glow)' : 'transparent',
                    color: bizFilter === f ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: bizFilter === f ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >{f} {f === 'all' ? `(${businesses.length})` : `(${businesses.filter(b => b.status === f).length})`}</button>
              ))}
            </div>
            <div className="panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Category</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBiz.slice(0, 50).map(biz => (
                    <tr key={biz.id}>
                      <td style={{ color: 'var(--text)', fontWeight: 600, maxWidth: 200 }}>{biz.name}</td>
                      <td>{biz.category}</td>
                      <td>📍 {biz.city_id || 'Addis'}</td>
                      <td>{statusBadge(biz.status || 'active')}</td>
                      <td>⭐ {biz.rating?.toFixed(1) || '—'}</td>
                      <td>{biz.reviews || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {biz.status === 'pending' && (
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                              onClick={() => updateBizStatus(biz.id, 'active')}
                            >✅ Approve</button>
                          )}
                          {biz.status === 'active' && (
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                              onClick={() => updateBizStatus(biz.id, 'rejected')}
                            >Suspend</button>
                          )}
                          {biz.status === 'rejected' && (
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                              onClick={() => updateBizStatus(biz.id, 'active')}
                            >Restore</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBiz.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
                  No businesses match your search.
                </p>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════ USERS ═══════════════════════════════ */}
        {activeNav === 'users' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">👥 Users</h1>
                <p className="dash-sub">{users.length} registered users</p>
              </div>
            </header>
            <div className="panel">
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Points</th><th>Reviews</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {users.slice(0, 50).map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>{u.name || 'Anonymous'}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'business' ? 'badge-blue' : 'badge-green'}`}>{u.role || 'user'}</span></td>
                      <td>🏆 {u.points || 0}</td>
                      <td>💬 {u.review_count || 0}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ════════════════════════ REPORTS ════════════════════════════ */}
        {activeNav === 'reports' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">🚨 Content Reports</h1>
                <p className="dash-sub">{reports.length} pending reports need review</p>
              </div>
            </header>
            <div className="panel">
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No pending reports — everything is clean!</div>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Type</th><th>Reason</th><th>Reporter</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td>
                          <span style={{ fontSize: 18, marginRight: 6 }}>{typeIcon[r.content_type] || '🚨'}</span>
                          {r.content_type}
                        </td>
                        <td style={{ maxWidth: 250, color: 'var(--text)' }}>{r.reason}</td>
                        <td>{r.profiles?.name || 'Unknown'}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn-reply"
                              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                              onClick={() => resolveReport(r.id, 'actioned')}
                            >Remove Content</button>
                            <button
                              className="btn-reply"
                              onClick={() => resolveReport(r.id, 'dismissed')}
                            >Dismiss</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════ PROMOTIONS ═════════════════════════ */}
        {activeNav === 'promotions' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">📣 Promotions</h1>
                <p className="dash-sub">{stats.activePromotions} active promotions generating revenue</p>
              </div>
            </header>
            <div className="panel">
              <table className="admin-table">
                <thead>
                  <tr><th>Business</th><th>Type</th><th>Starts</th><th>Ends</th><th>Price</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {promotions.map(p => {
                    const isActive = p.active && new Date(p.ends_at) > new Date()
                    return (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text)', fontWeight: 600 }}>{p.businesses?.name || '—'}</td>
                        <td>
                          <span style={{ fontSize: 16 }}>
                            {p.type === 'featured' ? '⭐' : p.type === 'boosted' ? '🚀' : '📣'}
                          </span>{' '}
                          {p.type}
                        </td>
                        <td>{new Date(p.starts_at).toLocaleDateString()}</td>
                        <td>{new Date(p.ends_at).toLocaleDateString()}</td>
                        <td>{p.price_paid ? `${p.price_paid.toLocaleString()} ETB` : '—'}</td>
                        <td>{isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-yellow">Expired</span>}</td>
                        <td>
                          <button
                            className="btn-reply"
                            style={{ color: isActive ? 'var(--red)' : 'var(--accent)', borderColor: isActive ? 'var(--red)' : 'var(--accent)' }}
                            onClick={() => togglePromotion(p.id, p.active)}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {promotions.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 14 }}>
                  No promotions created yet.
                </p>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════ REWARDS ════════════════════════════ */}
        {activeNav === 'rewards' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">🎁 Rewards Program</h1>
                <p className="dash-sub">Monitor point distribution and redemptions</p>
              </div>
            </header>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="panel">
                <div className="panel-header"><h2 className="panel-title">Top Earners</h2></div>
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Points</th><th>Reviews</th></tr></thead>
                  <tbody>
                    {[...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10).map(u => (
                      <tr key={u.id}>
                        <td style={{ color: 'var(--text)', fontWeight: 600 }}>{u.name || 'Anonymous'}</td>
                        <td>🏆 {u.points || 0}</td>
                        <td>💬 {u.review_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel">
                <div className="panel-header"><h2 className="panel-title">Point Actions</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { action: 'Review written', points: 50, icon: '✍️' },
                    { action: 'Check-in', points: 10, icon: '📍' },
                    { action: 'Photo uploaded', points: 25, icon: '📸' },
                    { action: 'Place shared', points: 15, icon: '🔗' },
                    { action: 'First review bonus', points: 100, icon: '🎉' },
                    { action: 'First check-in bonus', points: 50, icon: '⭐' },
                  ].map(a => (
                    <div key={a.action} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--card2)', borderRadius: 10, padding: '10px 14px',
                    }}>
                      <span style={{ fontSize: 20 }}>{a.icon}</span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-sub)' }}>{a.action}</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 14 }}>+{a.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
