import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ─── Supabase (direct browser client) ────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats {
  views: number
  rating: number
  reviews: number
  checkins: number
  savedCount: number
}

interface Review {
  id: string
  user_id: string
  rating: number
  text: string
  created_at: string
  profiles?: { name: string; avatar?: string }
  reply?: string
}

interface Promotion {
  id: string
  type: 'featured' | 'boosted' | 'banner'
  starts_at: string
  ends_at: string
  active: boolean
  price_paid?: number
}

interface Business {
  id: string
  name: string
  category: string
  rating: number
  reviews: number
  verified: boolean
  status: string
  description?: string
  phone?: string
  website?: string
  hours?: string
  address?: string
}

const PROMOTION_PLANS = [
  {
    type: 'featured' as const,
    label: 'Featured',
    emoji: '⭐',
    price: 500,
    currency: 'ETB',
    duration: '7 days',
    perks: ['Top placement in search', 'Featured badge', 'Priority in "Near You"'],
    color: '#F59E0B',
  },
  {
    type: 'boosted' as const,
    label: 'Sponsored',
    emoji: '🚀',
    price: 1200,
    currency: 'ETB',
    duration: '14 days',
    perks: ['All Featured perks', 'Homepage carousel', 'Email to 1,000+ users', 'Trending boost'],
    color: '#3B82F6',
    recommended: true,
  },
  {
    type: 'banner' as const,
    label: 'Banner Ad',
    emoji: '📣',
    price: 2500,
    currency: 'ETB',
    duration: '30 days',
    perks: ['All Sponsored perks', 'Top banner placement', 'Category page banner', 'Analytics report'],
    color: '#8B5CF6',
  },
]

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'promote', label: 'Promote', icon: '🚀' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

// ─── Mini chart component ─────────────────────────────────────────────────────
function SparkBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            background: color,
            borderRadius: 3,
            opacity: i === values.length - 1 ? 1 : 0.5,
            transition: 'height 0.5s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Star rating component ────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? '#F59E0B' : '#374151' }}>★</span>
      ))}
    </span>
  )
}

// ─── Rating bar component ─────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <span style={{ color: 'var(--text-sub)', width: 12, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color: 'var(--text-muted)', width: 28, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState<Stats>({ views: 0, rating: 0, reviews: 0, checkins: 0, savedCount: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [settingsForm, setSettingsForm] = useState({ description: '', phone: '', website: '', hours: '' })
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0])
  const [viewsHistory] = useState([180, 210, 190, 320, 280, 410, 380, 490, 520, 480, 600, 540, 620, 680])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Load business data ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // For demo: fetch the first active business (in production, use auth'd business owner)
        const { data: bizData } = await supabase
          .from('businesses')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .single()

        if (bizData) {
          setBusiness(bizData)
          setSettingsForm({
            description: bizData.description || '',
            phone: bizData.phone || '',
            website: bizData.website || '',
            hours: bizData.hours || '',
          })

          // Fetch reviews
          const { data: revData } = await supabase
            .from('reviews')
            .select('*, profiles:user_id(name, avatar)')
            .eq('business_id', bizData.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(20)

          if (revData) {
            setReviews(revData)
            // Compute rating distribution
            const dist = [0, 0, 0, 0, 0]
            revData.forEach((r: Review) => {
              if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++
            })
            setRatingDistribution(dist)
          }

          // Fetch check-ins
          const { count: ciCount } = await supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', bizData.id)

          // Fetch saves
          const { count: saveCount } = await supabase
            .from('saved_places')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', bizData.id)

          // Fetch active promotions
          const now = new Date().toISOString()
          const { data: promoData } = await supabase
            .from('business_promotions')
            .select('*')
            .eq('business_id', bizData.id)
            .order('created_at', { ascending: false })
            .limit(10)

          if (promoData) setPromotions(promoData)

          setStats({
            views: Math.floor(Math.random() * 15000) + 5000, // from analytics table in production
            rating: bizData.rating || 0,
            reviews: bizData.reviews || (revData?.length ?? 0),
            checkins: ciCount || 0,
            savedCount: saveCount || 0,
          })
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Reply to review ────────────────────────────────────────────────────
  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim()
    if (!text) return
    setSaving(true)
    // In production: save to review_replies table
    await new Promise(r => setTimeout(r, 600))
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: text } : r))
    setReplyingTo(null)
    setReplyText(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    showToast('Reply posted ✓')
    setSaving(false)
  }

  // ── Save settings ──────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    if (!business) return
    setSaving(true)
    const { error } = await supabase
      .from('businesses')
      .update({
        description: settingsForm.description,
        phone: settingsForm.phone,
        website: settingsForm.website,
        hours: settingsForm.hours,
      })
      .eq('id', business.id)
    setSaving(false)
    if (!error) showToast('Settings saved ✓')
    else showToast('Error saving settings')
  }

  // ── Create promotion (mock — in production, integrate payment) ────────
  const handleCreatePromo = async (type: 'featured' | 'boosted' | 'banner') => {
    if (!business) return
    setSaving(true)
    const plan = PROMOTION_PLANS.find(p => p.type === type)
    const durationDays = type === 'featured' ? 7 : type === 'boosted' ? 14 : 30

    const { data, error } = await supabase.from('business_promotions').insert({
      business_id: business.id,
      type,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      price_paid: plan?.price,
      active: true,
    }).select().single()

    setSaving(false)
    if (!error && data) {
      setPromotions(prev => [data, ...prev])
      showToast(`${plan?.label} promotion activated! 🚀`)
    } else {
      showToast('Payment integration required for live promotions.')
    }
  }

  if (loading) {
    return (
      <div className="dash-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📍</div>
          <div style={{ color: 'var(--text-sub)', fontSize: 14 }}>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-root">
      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          background: '#10B981', color: '#fff',
          borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
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
              key={item.id}
              className={`sidebar-link ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span style={{ marginRight: 10 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-business">
          <div className="biz-avatar">{business ? business.category?.[0]?.toUpperCase() || '🍽️' : '🍽️'}</div>
          <div>
            <div className="biz-name">{business?.name || 'Your Business'}</div>
            <div className={`biz-status ${business?.verified ? 'verified' : ''}`}>
              {business?.verified ? '✅ Verified' : '⏳ Pending'}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="dash-main">

        {/* ════════════════════════════════════════
            DASHBOARD TAB
           ════════════════════════════════════════ */}
        {activeNav === 'dashboard' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">Welcome back 👋</h1>
                <p className="dash-sub">{business?.name || 'Your Business'} — Here's what's happening today.</p>
              </div>
              <div className="dash-header-actions">
                <button className="btn-outline-sm" onClick={() => setActiveNav('analytics')}>📊 Analytics</button>
                <button className="btn-primary-sm" onClick={() => setActiveNav('promote')}>🚀 Promote</button>
              </div>
            </header>

            {/* Stats */}
            <div className="stats-grid">
              {[
                { icon: '👁️', label: 'Profile Views (Est.)', value: stats.views.toLocaleString(), change: '+18%', up: true, spark: viewsHistory.slice(-7) },
                { icon: '⭐', label: 'Avg. Rating', value: stats.rating.toFixed(1), change: '+0.2', up: true, spark: [4.3, 4.4, 4.5, 4.5, 4.6, 4.7, stats.rating] },
                { icon: '💬', label: 'Total Reviews', value: stats.reviews.toString(), change: `+${Math.round(stats.reviews * 0.07)}`, up: true, spark: [20, 28, 35, 40, 60, 80, stats.reviews] },
                { icon: '📍', label: 'Check-ins', value: stats.checkins.toString(), change: `+${Math.round(stats.checkins * 0.12)}`, up: stats.checkins > 0, spark: [1, 2, 3, 3, 5, 4, stats.checkins] },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-icon">{s.icon}</span>
                    <span className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</span>
                  </div>
                  <SparkBar values={s.spark} color={s.up ? '#10B981' : '#EF4444'} />
                  <div className="stat-val" style={{ marginTop: 8 }}>{s.value}</div>
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
                  <button className="btn-ghost-sm" onClick={() => setActiveNav('reviews')}>View all →</button>
                </div>
                <div className="reviews-list">
                  {reviews.slice(0, 3).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No reviews yet. Share your profile to get started!</p>
                  ) : reviews.slice(0, 3).map(r => (
                    <div key={r.id} className="review-item">
                      <div className="review-avatar">{r.profiles?.name?.[0] || '?'}</div>
                      <div className="review-body">
                        <div className="review-top">
                          <span className="review-name">{r.profiles?.name || 'Anonymous'}</span>
                          <Stars rating={r.rating} size={12} />
                          <span className="review-time">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="review-text">{r.text}</p>
                        <button className="btn-reply" onClick={() => { setReplyingTo(r.id); setActiveNav('reviews') }}>
                          {r.reply ? '✓ Replied' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions + Promotions Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Quick Actions</h2>
                  </div>
                  <div className="actions-list">
                    <button className="action-btn" onClick={() => setActiveNav('settings')}>📝 Edit Business Info</button>
                    <button className="action-btn">📸 Upload Photos</button>
                    <button className="action-btn" onClick={() => setActiveNav('settings')}>⏰ Update Hours</button>
                    <button className="action-btn" onClick={() => setActiveNav('promote')}>📣 Create Promotion</button>
                    <button className="action-btn" onClick={() => setActiveNav('analytics')}>📊 View Analytics</button>
                  </div>
                </div>

                {/* Active Promotion Status */}
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Active Promotions</h2>
                    <button className="btn-ghost-sm" onClick={() => setActiveNav('promote')}>Manage →</button>
                  </div>
                  {promotions.filter(p => p.active && new Date(p.ends_at) > new Date()).length === 0 ? (
                    <div className="upgrade-card">
                      <div className="upgrade-icon">⚡</div>
                      <div>
                        <div className="upgrade-title">Boost Your Listing</div>
                        <div className="upgrade-sub">Reach 5× more customers with a promotion</div>
                      </div>
                      <button className="btn-gold" onClick={() => setActiveNav('promote')}>Promote</button>
                    </div>
                  ) : (
                    promotions.filter(p => p.active && new Date(p.ends_at) > new Date()).slice(0, 2).map(p => (
                      <div key={p.id} style={{
                        background: 'var(--card2)', border: '1px solid var(--border2)',
                        borderRadius: 12, padding: '12px 14px', marginBottom: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{p.type === 'featured' ? '⭐' : p.type === 'boosted' ? '🚀' : '📣'}</span>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{p.type.charAt(0).toUpperCase() + p.type.slice(1)}</span>
                          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Expires: {new Date(p.ends_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            REVIEWS TAB
           ════════════════════════════════════════ */}
        {activeNav === 'reviews' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">⭐ Reviews</h1>
                <p className="dash-sub">Manage and respond to customer feedback</p>
              </div>
            </header>

            {/* Rating Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginBottom: 8 }}>
              <div className="panel" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--text)', letterSpacing: -2 }}>
                  {stats.rating.toFixed(1)}
                </div>
                <Stars rating={Math.round(stats.rating)} size={18} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                  Based on {stats.reviews} reviews
                </div>
              </div>
              <div className="panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[5, 4, 3, 2, 1].map(star => (
                    <RatingBar
                      key={star}
                      label={`${star}★`}
                      count={ratingDistribution[star - 1] || 0}
                      total={reviews.length}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">All Reviews ({reviews.length})</h2>
              </div>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                  No reviews yet. Encourage customers to leave feedback!
                </p>
              ) : (
                <div className="reviews-list">
                  {reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                      <div className="review-item">
                        <div className="review-avatar">{r.profiles?.name?.[0] || '?'}</div>
                        <div className="review-body">
                          <div className="review-top">
                            <span className="review-name">{r.profiles?.name || 'Anonymous'}</span>
                            <Stars rating={r.rating} size={13} />
                            <span className="review-time">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="review-text">{r.text}</p>
                          {r.reply && (
                            <div style={{
                              background: 'var(--card2)', borderLeft: '3px solid var(--primary)',
                              padding: '8px 12px', borderRadius: '0 8px 8px 0', marginBottom: 8
                            }}>
                              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>YOUR REPLY</div>
                              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{r.reply}</div>
                            </div>
                          )}
                          {!r.reply && (
                            replyingTo === r.id ? (
                              <div style={{ marginTop: 8 }}>
                                <textarea
                                  style={{
                                    width: '100%', background: 'var(--card2)', border: '1px solid var(--border2)',
                                    borderRadius: 10, padding: '10px 12px', color: 'var(--text)',
                                    fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 80,
                                    outline: 'none',
                                  }}
                                  placeholder="Write your reply..."
                                  value={replyText[r.id] || ''}
                                  onChange={e => setReplyText(prev => ({ ...prev, [r.id]: e.target.value }))}
                                />
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                  <button
                                    className="btn-primary-sm"
                                    onClick={() => handleReply(r.id)}
                                    disabled={saving}
                                    style={{ fontSize: 13, padding: '8px 16px' }}
                                  >
                                    {saving ? 'Posting...' : 'Post Reply'}
                                  </button>
                                  <button
                                    className="btn-outline-sm"
                                    onClick={() => setReplyingTo(null)}
                                    style={{ fontSize: 13, padding: '8px 16px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button className="btn-reply" onClick={() => setReplyingTo(r.id)}>Reply</button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            ANALYTICS TAB
           ════════════════════════════════════════ */}
        {activeNav === 'analytics' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">📈 Analytics</h1>
                <p className="dash-sub">Track your business performance over time</p>
              </div>
              <div className="dash-header-actions">
                <select style={{
                  background: 'var(--card)', border: '1px solid var(--border2)',
                  color: 'var(--text-sub)', borderRadius: 10, padding: '8px 14px',
                  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                }}>
                  <option>Last 14 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
            </header>

            {/* Key metrics */}
            <div className="stats-grid">
              {[
                { icon: '👁️', label: 'Total Views', value: stats.views.toLocaleString(), sub: '+18% vs last period' },
                { icon: '📍', label: 'Check-ins', value: stats.checkins.toString(), sub: 'Unique visits' },
                { icon: '❤️', label: 'Saves', value: stats.savedCount.toString(), sub: 'Users saved you' },
                { icon: '💬', label: 'Reviews', value: stats.reviews.toString(), sub: `Avg ${stats.rating.toFixed(1)}★` },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-icon">{s.icon}</span>
                  </div>
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Views chart */}
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Profile Views — Last 14 Days</h2>
              </div>
              <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                {viewsHistory.map((v, i) => {
                  const max = Math.max(...viewsHistory)
                  const pct = (v / max) * 100
                  const isLast = i === viewsHistory.length - 1
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div
                        title={`${v} views`}
                        style={{
                          width: '100%',
                          height: `${pct}%`,
                          background: isLast
                            ? 'var(--primary)'
                            : 'linear-gradient(180deg, #3B82F6, #1D4ED8)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.5s ease',
                          cursor: 'pointer',
                          opacity: isLast ? 1 : 0.7,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Engagement breakdown */}
            <div className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Engagement Breakdown</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Profile views', value: stats.views, icon: '👁️', color: '#3B82F6' },
                    { label: 'Saves (bookmarks)', value: stats.savedCount, icon: '❤️', color: '#EF4444' },
                    { label: 'Check-ins', value: stats.checkins, icon: '📍', color: '#FAA330' },
                    { label: 'Review clicks', value: stats.reviews * 3, icon: '💬', color: '#10B981' },
                    { label: 'Direction requests', value: Math.floor(stats.views * 0.08), icon: '🧭', color: '#8B5CF6' },
                    { label: 'Phone taps', value: Math.floor(stats.views * 0.04), icon: '📞', color: '#F59E0B' },
                  ].map(m => {
                    const maxVal = stats.views
                    return (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-sub)', fontWeight: 500 }}>{m.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.value.toLocaleString()}</span>
                          </div>
                          <div style={{ height: 5, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min((m.value / maxVal) * 100, 100)}%`,
                              height: '100%', background: m.color, borderRadius: 3,
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Insights</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: '🔥', text: `You're trending in your category this week!`, color: '#FAA330' },
                    { icon: '📱', text: `${Math.round(stats.views * 0.68)}% of visitors come from mobile`, color: '#3B82F6' },
                    { icon: '🕐', text: 'Most views happen between 12pm–2pm', color: '#10B981' },
                    { icon: '🔍', text: 'Users find you primarily through search', color: '#8B5CF6' },
                    { icon: '💡', text: 'Adding 3 more photos could boost views by 40%', color: '#F59E0B' },
                  ].map((ins, i) => (
                    <div key={i} style={{
                      background: 'var(--card2)', borderRadius: 10,
                      padding: '12px 14px', borderLeft: `3px solid ${ins.color}`,
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            PROMOTE TAB
           ════════════════════════════════════════ */}
        {activeNav === 'promote' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">🚀 Promote Your Business</h1>
                <p className="dash-sub">Reach more customers across Addis Ababa</p>
              </div>
            </header>

            {/* Active promotions */}
            {promotions.filter(p => new Date(p.ends_at) > new Date()).length > 0 && (
              <div className="panel" style={{ marginBottom: 4 }}>
                <div className="panel-header">
                  <h2 className="panel-title">Active Promotions</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {promotions.filter(p => new Date(p.ends_at) > new Date()).map(p => {
                    const plan = PROMOTION_PLANS.find(pl => pl.type === p.type)
                    const daysLeft = Math.max(0, Math.ceil((new Date(p.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    const totalDays = p.type === 'featured' ? 7 : p.type === 'boosted' ? 14 : 30
                    const progress = Math.max(0, ((totalDays - daysLeft) / totalDays) * 100)
                    return (
                      <div key={p.id} style={{
                        background: 'var(--card2)', border: `1px solid ${plan?.color}33`,
                        borderRadius: 14, padding: '16px 18px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 24 }}>{plan?.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{plan?.label} Plan</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {daysLeft} days remaining • Started {new Date(p.starts_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: plan?.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                          Progress: {Math.round(progress)}% complete
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PROMOTION_PLANS.map(plan => (
                <div
                  key={plan.type}
                  style={{
                    background: 'var(--card)',
                    border: `2px solid ${plan.recommended ? plan.color : 'var(--border)'}`,
                    borderRadius: 20,
                    padding: 24,
                    position: 'relative',
                    transition: 'transform 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {plan.recommended && (
                    <div style={{
                      position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: plan.color, color: '#fff',
                      fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                      letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>
                      ⚡ MOST POPULAR
                    </div>
                  )}

                  <div style={{ fontSize: 36, marginBottom: 12 }}>{plan.emoji}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.label}</div>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)' }}>
                      {plan.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
                      {plan.currency} / {plan.duration}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {plan.perks.map((perk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ color: plan.color, fontWeight: 700, fontSize: 16 }}>✓</span>
                        <span style={{ color: 'var(--text-sub)' }}>{perk}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCreatePromo(plan.type)}
                    disabled={saving}
                    style={{
                      width: '100%', padding: '13px 0',
                      background: plan.recommended ? plan.color : 'transparent',
                      border: `2px solid ${plan.color}`,
                      color: plan.recommended ? '#fff' : plan.color,
                      borderRadius: 12, fontWeight: 800, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (!plan.recommended) {
                        e.currentTarget.style.background = plan.color
                        e.currentTarget.style.color = '#fff'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!plan.recommended) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = plan.color
                      }
                    }}
                  >
                    {saving ? 'Processing...' : `Start ${plan.label}`}
                  </button>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 20px',
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
            }}>
              💡 <strong style={{ color: 'var(--text-sub)' }}>Payment Integration:</strong> Connect Telebirr, CBE Birr, or credit card in Settings to enable live promotion billing.
              Promotions are activated immediately upon successful payment. All prices in Ethiopian Birr (ETB).
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            SETTINGS TAB
           ════════════════════════════════════════ */}
        {activeNav === 'settings' && (
          <>
            <header className="dash-header">
              <div>
                <h1 className="dash-title">⚙️ Business Settings</h1>
                <p className="dash-sub">Update your business information and profile</p>
              </div>
              <div className="dash-header-actions">
                <button className="btn-primary-sm" onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </header>

            <div className="content-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Basic Info */}
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Business Information</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      { label: 'Business Name', value: business?.name || '', field: 'name', disabled: true },
                      { label: 'Category', value: business?.category || '', field: 'category', disabled: true },
                      { label: 'Address', value: business?.address || '', field: 'address', disabled: true },
                      { label: 'Phone Number', value: settingsForm.phone, field: 'phone', placeholder: '+251 9X XXX XXXX' },
                      { label: 'Website', value: settingsForm.website, field: 'website', placeholder: 'https://yourbusiness.com' },
                      { label: 'Opening Hours', value: settingsForm.hours, field: 'hours', placeholder: 'Mon–Sat 8am–9pm, Sun Closed' },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {f.label} {f.disabled && <span style={{ color: '#6B7280', fontWeight: 400 }}>(read-only)</span>}
                        </label>
                        <input
                          style={{
                            width: '100%', background: f.disabled ? 'var(--border)' : 'var(--card2)',
                            border: '1px solid var(--border2)', borderRadius: 10,
                            padding: '11px 14px', color: f.disabled ? 'var(--text-muted)' : 'var(--text)',
                            fontSize: 14, fontFamily: 'inherit', outline: 'none',
                          }}
                          value={f.value}
                          placeholder={f.placeholder}
                          disabled={f.disabled}
                          onChange={e => !f.disabled && setSettingsForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Description
                      </label>
                      <textarea
                        style={{
                          width: '100%', background: 'var(--card2)',
                          border: '1px solid var(--border2)', borderRadius: 10,
                          padding: '11px 14px', color: 'var(--text)',
                          fontSize: 14, fontFamily: 'inherit', outline: 'none',
                          minHeight: 100, resize: 'vertical',
                        }}
                        value={settingsForm.description}
                        placeholder="Describe your business..."
                        onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Account Status</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Verification', value: business?.verified ? 'Verified ✅' : 'Pending ⏳', green: business?.verified },
                      { label: 'Listing Status', value: business?.status === 'active' ? 'Active 🟢' : 'Inactive 🔴', green: business?.status === 'active' },
                      { label: 'Plan', value: promotions.length > 0 ? 'Premium 🚀' : 'Free', green: promotions.length > 0 },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 0', borderBottom: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.green ? 'var(--accent)' : 'var(--text)' }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <h2 className="panel-title">Get Verified</h2>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: 16 }}>
                    Verified businesses get a ✅ badge, higher search rankings, and increased customer trust.
                  </p>
                  <button className="btn-primary-sm" style={{ width: '100%' }}>
                    Apply for Verification →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
