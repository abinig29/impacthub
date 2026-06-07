import React, { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../utils/api'

/* ── Helpers ── */
const Sk = ({ h = '1rem', w = '100%', r = '8px' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
)

const fmtDur = (secs) => {
  if (!secs) return '0m'
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-3)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontWeight: 700, color: '#3dd68a' }}>{payload[0].value}{payload[0].name === 'hours' ? 'h' : ''}</p>
    </div>
  )
}

const TABS = ['overview', 'sessions', 'users', 'logs', 'blog']
const TAB_LABELS = { overview: 'Overview', sessions: 'Sessions', users: 'Users', logs: 'Time Logs', blog: 'Blog' }

/* ── Stat card ── */
function StatCard({ label, value, sub, icon, color = '#3dd68a', loading }) {
  return (
    <div className="stat-card" style={{ transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}22`}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ position: 'absolute', top: 0, left: '1.5rem', right: '1.5rem', height: '1px', background: `linear-gradient(90deg,transparent,${color}40,transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500 }}>{label}</p>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem' }}>{icon}</div>
      </div>
      {loading ? (
        <div><Sk h="2rem" w="50%" r="6px" /><Sk h="0.625rem" w="35%" r="4px" style={{ marginTop: '0.5rem' }} /></div>
      ) : (
        <>
          <div className="stat-value">{value}</div>
          {sub && <p className="stat-label">{sub}</p>}
        </>
      )}
    </div>
  )
}

/* ── Blog form ── */
function BlogForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', excerpt: '', type: 'blog', eventDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try { const { data } = await api.post('/blog', form); onCreated(data); setForm({ title: '', content: '', excerpt: '', type: 'blog', eventDate: '' }) }
    catch (err) { setError(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  return (
    <div className="card mb-5">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>Publish Post</h3>
      {error && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required placeholder="Post title" /></div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
              <option value="blog">Blog Post</option>
              <option value="event">Event</option>
              <option value="news">News</option>
            </select>
          </div>
        </div>
        {form.type === 'event' && <div><label className="label">Event Date</label><input className="input" type="datetime-local" value={form.eventDate} onChange={e => setForm(p => ({...p, eventDate: e.target.value}))} /></div>}
        <div><label className="label">Excerpt</label><input className="input" placeholder="Brief summary…" value={form.excerpt} onChange={e => setForm(p => ({...p, excerpt: e.target.value}))} /></div>
        <div><label className="label">Content *</label><textarea className="input" rows={4} style={{ resize: 'vertical' }} value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} required /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Publishing…' : 'Publish'}</button>
        </div>
      </form>
    </div>
  )
}

/* ── Session form ── */
function SessionForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', maxVolunteers: 0 })
  const [saving, setSaving] = useState(false)
  const [newSession, setNewSession] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await api.post('/sessions', form)
      setNewSession(data); onCreated(data)
      setForm({ title: '', description: '', location: '', maxVolunteers: 0 })
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  return (
    <div className="card mb-5">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>Create QR Session</h3>
      <div className="grid sm:grid-cols-2 gap-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div><label className="label">Session Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required placeholder="e.g. Community Clean-Up" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} style={{ resize: 'none' }} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} /></div>
            <div><label className="label">Max Volunteers</label><input className="input" type="number" min="0" value={form.maxVolunteers} onChange={e => setForm(p => ({...p, maxVolunteers: parseInt(e.target.value)||0}))} /></div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create & Generate QR'}</button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {newSession?.qrCodeImage ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Session QR Code</p>
              <div style={{ padding: '1rem', background: '#fff', borderRadius: '12px', display: 'inline-block', marginBottom: '0.75rem' }}>
                <img src={newSession.qrCodeImage} alt="QR" style={{ width: '140px', height: '140px', display: 'block' }} />
              </div>
              <a href={newSession.qrCodeImage} download="session-qr.png" className="btn-secondary btn-sm inline-flex">↓ Download</a>
            </div>
          ) : (
            <div style={{ width: '140px', height: '140px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.8125rem', textAlign: 'center', lineHeight: 1.5 }}>
              QR appears<br />after creation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Guest create form ── */
function GuestCreateForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try { await api.post('/users/create-guest', form); setMsg({ ok: true, text: '✅ Guest account created' }); setForm({ name: '', email: '', password: '' }); onCreated() }
    catch (err) { setMsg({ ok: false, text: err.response?.data?.message || 'Failed' }) }
    setSaving(false)
  }

  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Create Guest Account</h3>
      {msg && <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', marginBottom: '0.875rem', background: msg.ok ? 'rgba(61,214,138,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${msg.ok ? 'rgba(61,214,138,0.2)' : 'rgba(248,113,113,0.2)'}`, color: msg.ok ? '#3dd68a' : '#f87171', fontSize: '0.8125rem' }}>{msg.text}</div>}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
        <input className="input" type="password" placeholder="Password (min 6)" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} />
        <button type="submit" disabled={saving} className="btn-secondary">{saving ? 'Creating…' : 'Create Guest'}</button>
      </form>
    </div>
  )
}

/* ── Data table ── */
function DataTable({ columns, rows, emptyMsg = 'No data', loading, skRows = 5 }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skRows }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map(col => <td key={col.key} style={{ padding: '0.875rem 1rem' }}><Sk h="0.875rem" w={col.skW || '80%'} /></td>)}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-3)' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
                <p>{emptyMsg}</p>
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={row._id || i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '0.875rem 1rem', color: 'var(--text-2)', verticalAlign: 'middle', whiteSpace: col.wrap ? 'normal' : 'nowrap' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main component ── */
export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [analytics, setAnalytics] = useState(null)
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, sRes, uRes, lRes, bRes] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/sessions'),
        api.get('/users'),
        api.get('/timelogs'),
        api.get('/blog'),
      ])
      setAnalytics(aRes.data)
      setSessions(sRes.data)
      setUsers(uRes.data)
      setLogs(lRes.data)
      setPosts(bRes.data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Actions ── */
  const setRole = async (uid, role) => {
    try { await api.put(`/users/${uid}/role`, { role }); load() } catch {}
  }
  const toggleApproval = async (uid, current) => {
    try { await api.put(`/users/${uid}/approve`, { isApproved: !current }); load() } catch {}
  }
  const deleteUser = async (uid) => {
    if (!confirm('Delete this user permanently?')) return
    try { await api.delete(`/users/${uid}`); load() } catch {}
  }
  const toggleSession = async (id, active) => {
    try { await api.put(`/sessions/${id}`, { activeStatus: !active }); load() } catch {}
  }
  const deleteSession = async (id) => {
    if (!confirm('Delete this session?')) return
    try { await api.delete(`/sessions/${id}`); load() } catch {}
  }
  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return
    try { await api.delete(`/blog/${id}`); load() } catch {}
  }

  const roleColors = { super_admin: '#fbbf24', admin: '#9d74ff', volunteer: '#3dd68a', guest: '#8a9bc5' }

  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page" style={{ maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Platform operations and management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {analytics?.urgentMissions > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.875rem', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8125rem', color: '#f87171', fontWeight: 600 }}>
              🚨 {analytics.urgentMissions} urgent
            </div>
          )}
          <button onClick={load} className="btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Top stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={loading ? '–' : analytics?.totalUsers ?? 0} sub="all roles" icon="👥" color="#60a5fa" loading={loading} />
        <StatCard label="Active Sessions" value={loading ? '–' : analytics?.activeSessions ?? 0} sub="currently live" icon="⚡" color="#3dd68a" loading={loading} />
        <StatCard label="Weekly Hours" value={loading ? '–' : analytics?.weeklyFormattedTime || `${analytics?.weeklyHours || 0}h`} sub={`${analytics?.weeklyCheckins || 0} check-ins`} icon="⏱" color="#9d74ff" loading={loading} />
        <StatCard label="Donations" value={loading ? '–' : `$${(analytics?.totalDonations || 0).toLocaleString()}`} sub="total raised" icon="💰" color="#f59e0b" loading={loading} />
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 600,
              border: '1px solid', transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              background: tab === t ? 'var(--surface-3)' : 'transparent',
              color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
              borderColor: tab === t ? 'var(--border-hover)' : 'transparent',
            }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Weekly chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Weekly Activity</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Hours per day</span>
              </div>
              {loading ? <div className="skeleton" style={{ height: '180px', borderRadius: '10px' }} /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analytics?.dailyData || []} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="hours" fill="#3dd68a" radius={[5, 5, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top contributors */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Top Contributors</h3>
              {loading ? (
                <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Sk key={i} h="40px" r="8px" />)}</div>
              ) : (analytics?.topContributors || []).slice(0, 6).map((v, i) => {
                const maxScore = analytics?.topContributors?.[0]?.impactScore || 1
                return (
                  <div key={v._id} className="flex items-center gap-3 mb-3">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', width: '16px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(61,214,138,0.1)', color: '#3dd68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                      {v.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="truncate" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>{v.name}</p>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3dd68a', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '0.5rem' }}>{v.impactScore}</span>
                      </div>
                      <div className="progress-track" style={{ height: '3px' }}>
                        <div className="progress-fill" style={{ width: `${(v.impactScore / maxScore) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent activity + Guest create */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Recent Activity</h3>
              {loading ? <div className="flex flex-col gap-2">{[1,2,3,4,5].map(i => <Sk key={i} h="36px" r="8px" />)}</div> : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {(analytics?.recentActivity || []).map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>{{ checkin: '🟢', checkout: '🏁', chat: '💬', donation: '💰', system: '⚙️', badge: '🏅' }[a.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{a.action}</p>
                        {a.detail && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{a.detail}</p>}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', flexShrink: 0 }}>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <GuestCreateForm onCreated={load} />
          </div>
        </div>
      )}

      {/* ══ SESSIONS ══ */}
      {tab === 'sessions' && (
        <div>
          <SessionForm onCreated={s => setSessions(p => [s, ...p])} />
          <div className="card">
            <DataTable
              loading={loading}
              emptyMsg="No sessions yet — create one above"
              columns={[
                { key: 'title', label: 'Session', wrap: true, skW: '60%',
                  render: (v, row) => (
                    <div className="flex items-center gap-3">
                      {row.qrCodeImage && <div style={{ padding: '3px', background: '#fff', borderRadius: '6px', flexShrink: 0 }}><img src={row.qrCodeImage} alt="QR" style={{ width: '32px', height: '32px', display: 'block' }} /></div>}
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v}</p>
                        {row.location && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>📍 {row.location}</p>}
                      </div>
                    </div>
                  )},
                { key: 'activeStatus', label: 'Status', skW: '50px',
                  render: v => <div style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-block', background: v ? 'rgba(61,214,138,0.1)' : 'rgba(138,155,197,0.1)', color: v ? '#3dd68a' : '#8a9bc5', border: `1px solid ${v ? 'rgba(61,214,138,0.2)' : 'rgba(138,155,197,0.15)'}`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v ? 'Live' : 'Off'}</div> },
                { key: 'createdAt', label: 'Created', skW: '80px',
                  render: v => <span style={{ color: 'var(--text-3)' }}>{new Date(v).toLocaleDateString()}</span> },
                { key: '_id', label: 'Actions', skW: '100px',
                  render: (v, row) => (
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSession(row._id, row.activeStatus)} style={{ padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', borderColor: 'var(--border)', color: 'var(--text-2)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                        {row.activeStatus ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteSession(row._id)} style={{ padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', cursor: 'pointer', color: '#f87171', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Delete
                      </button>
                    </div>
                  )},
              ]}
              rows={sessions}
            />
          </div>
        </div>
      )}

      {/* ══ USERS ══ */}
      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>All Users ({users.length})</h3>
            <input className="input" style={{ width: '220px' }} placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <DataTable
            loading={loading}
            skRows={6}
            emptyMsg="No users found"
            rows={filteredUsers}
            columns={[
              { key: 'name', label: 'User', wrap: true, skW: '140px',
                render: (v, row) => (
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${roleColors[row.role] || '#8a9bc5'}18`, color: roleColors[row.role] || '#8a9bc5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, border: `1px solid ${roleColors[row.role] || '#8a9bc5'}28`, flexShrink: 0 }}>
                      {v?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{row.email}</p>
                    </div>
                  </div>
                ) },
              { key: 'role', label: 'Role', skW: '70px',
                render: (v, row) => (
                  <select value={v} onChange={e => setRole(row._id, e.target.value)} style={{ fontSize: '0.8125rem', fontWeight: 600, background: 'var(--surface-4)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.3rem 0.625rem', color: roleColors[v] || 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font-sans)', outline: 'none' }}>
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                ) },
              { key: 'totalHours', label: 'Hours', skW: '50px',
                render: v => <span style={{ color: '#3dd68a', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{(v || 0).toFixed(1)}h</span> },
              { key: 'impactScore', label: 'Score', skW: '50px',
                render: v => <span style={{ color: '#9d74ff', fontWeight: 700 }}>{v || 0}</span> },
              { key: 'isApproved', label: 'Status', skW: '60px',
                render: (v, row) => (
                  <button onClick={() => toggleApproval(row._id, v !== false)} style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em', borderColor: v !== false ? 'rgba(61,214,138,0.2)' : 'rgba(248,113,113,0.2)', color: v !== false ? '#3dd68a' : '#f87171' }}>
                    {v !== false ? '✓ Active' : '✗ Suspend'}
                  </button>
                ) },
              { key: '_id', label: '', skW: '50px',
                render: (v) => (
                  <button onClick={() => deleteUser(v)} style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', cursor: 'pointer', color: '#f87171', fontFamily: 'var(--font-sans)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Delete
                  </button>
                ) },
            ]}
          />
        </div>
      )}

      {/* ══ LOGS ══ */}
      {tab === 'logs' && (
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Time Logs ({logs.length})</h3>
          <DataTable
            loading={loading}
            emptyMsg="No time logs recorded yet"
            rows={logs}
            columns={[
              { key: 'userId', label: 'Volunteer', wrap: true,
                render: v => <div><p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v?.name || '—'}</p><p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{v?.email}</p></div> },
              { key: 'sessionId', label: 'Session', render: v => <span style={{ color: 'var(--text-2)' }}>{v?.title || '—'}</span> },
              { key: 'startTime', label: 'Start', render: v => <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{v ? new Date(v).toLocaleString() : '—'}</span> },
              { key: 'formattedDuration', label: 'Duration',
                render: (v, row) => row.status === 'completed'
                  ? <span style={{ color: '#3dd68a', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v || `${(row.totalHours || 0).toFixed(1)}h`}</span>
                  : <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', padding: '0.175rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>Active</span> },
              { key: 'status', label: 'Status', render: v => <div style={{ display: 'inline-block', padding: '0.175rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: v === 'completed' ? 'rgba(61,214,138,0.08)' : 'rgba(251,191,36,0.08)', color: v === 'completed' ? '#3dd68a' : '#fbbf24', border: `1px solid ${v === 'completed' ? 'rgba(61,214,138,0.2)' : 'rgba(251,191,36,0.2)'}` }}>{v}</div> },
            ]}
          />
        </div>
      )}

      {/* ══ BLOG ══ */}
      {tab === 'blog' && (
        <div>
          <BlogForm onCreated={p => setPosts(prev => [p, ...prev])} />
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Published Content ({posts.length})</h3>
            <DataTable
              loading={loading}
              emptyMsg="No posts published yet"
              rows={posts}
              columns={[
                { key: 'title', label: 'Title', wrap: true, skW: '200px',
                  render: (v, row) => (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{row.excerpt?.slice(0, 60)}…</p>
                    </div>
                  ) },
                { key: 'type', label: 'Type', render: v => <span style={{ textTransform: 'capitalize', color: 'var(--text-2)', fontWeight: 500 }}>{v}</span> },
                { key: 'views', label: 'Views', render: v => <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>👁 {v || 0}</span> },
                { key: 'createdAt', label: 'Date', render: v => <span style={{ color: 'var(--text-3)', fontSize: '0.8125rem' }}>{new Date(v).toLocaleDateString()}</span> },
                { key: '_id', label: '', render: v => (
                  <button onClick={() => deletePost(v)} style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', cursor: 'pointer', color: '#f87171', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Delete
                  </button>
                ) },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}
