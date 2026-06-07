import React, { useEffect, useState, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/* ── Skeleton ── */
const Sk = ({ h = '1rem', w = '100%', r = '6px' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
)

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, color = '#3dd68a', loading }) {
  return (
    <div className="stat-card group" style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}14`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}>
      {/* Color accent top */}
      <div style={{ position: 'absolute', top: 0, left: '1.5rem', right: '1.5rem', height: '1px', background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      
      <div className="flex items-start justify-between mb-4">
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '-0.005em' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12`, fontSize: '1rem' }}>{icon}</div>
      </div>
      {loading ? (
        <div><Sk h="2.25rem" w="60%" r="8px" /><Sk h="0.75rem" w="40%" r="4px" style={{ marginTop: '0.5rem' }} /></div>
      ) : (
        <>
          <div className="stat-value">{value}</div>
          {sub && <p className="stat-label">{sub}</p>}
        </>
      )}
    </div>
  )
}

/* ── Chart tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.625rem 0.875rem', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#3dd68a' }}>{payload[0].value}h</p>
    </div>
  )
}

/* ── Quick action ── */
function QuickAction({ icon, label, to, color = 'var(--text-3)' }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 group"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <span style={{ fontSize: '1.375rem' }}>{icon}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.005em' }}>{label}</span>
    </Link>
  )
}

/* ── Level config ── */
const LEVELS = { Beginner: { color: '#8a9bc5', next: 50 }, Helper: { color: '#60a5fa', next: 200 }, Leader: { color: '#9d74ff', next: 500 }, Hero: { color: '#fbbf24', next: 500 } }

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [recs, setRecs] = useState(null)
  const [logs, setLogs] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, lRes, sRes] = await Promise.all([
          api.get(`/analytics/user/${user._id}`),
          api.get('/timelogs/my'),
          api.get('/sessions'),
        ])
        setAnalytics(aRes.data)
        setLogs(lRes.data)
        setSessions(sRes.data)
        if (user.role !== 'guest') {
          const rRes = await api.get(`/users/recommendations/${user._id}`)
          setRecs(rRes.data)
        }
        await refreshUser()
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const done = logs.filter(l => l.status === 'completed')
  const active = logs.find(l => l.status === 'active')
  const activeSessions = sessions.filter(s => s.activeStatus)
  const lvl = LEVELS[user?.level] || LEVELS.Beginner
  const xpPct = Math.min(100, ((user?.xp || 0) / lvl.next) * 100)
  const chartData = analytics?.chartData || []

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page" style={{ maxWidth: '1100px' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500, marginBottom: '0.375rem' }}>{greeting}</p>
          <h1 className="page-title">{user?.name?.split(' ')[0]} 👋</h1>
          {recs?.pattern && <p className="page-subtitle">{recs.pattern}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {analytics?.percentile && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill"
              style={{ background: 'rgba(61,214,138,0.08)', border: '1px solid rgba(61,214,138,0.15)' }}>
              <span style={{ fontSize: '0.75rem' }}>🏆</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#3dd68a' }}>
                Top {100 - analytics.percentile + 1}% volunteer
              </span>
            </div>
          )}
          <span className="badge" style={{
            background: lvl.color + '18', color: lvl.color,
            border: `1px solid ${lvl.color}30`, fontSize: '0.75rem', padding: '0.25rem 0.75rem'
          }}>
            ★ {user?.level}
          </span>
        </div>
      </div>

      {/* ── Active check-in alert ── */}
      {active && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl mb-6 flex-wrap"
          style={{ background: 'rgba(61,214,138,0.06)', border: '1px solid rgba(61,214,138,0.15)' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3dd68a', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3dd68a' }}>Active check-in</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
                {active.sessionId?.title || 'Session'} · Started {new Date(active.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {['admin','super_admin'].includes(user?.role) && (
            <Link to="/scanner" className="btn-primary btn-sm">Scan to check out →</Link>
          )}
        </div>
      )}

      {/* ── Impact banner ── */}
      {user?.role !== 'guest' && (
        <div className="relative rounded-2xl overflow-hidden mb-6 p-6"
          style={{ background: 'linear-gradient(135deg,#061610 0%,#0a2419 50%,#0d3326 100%)', border: '1px solid rgba(61,214,138,0.1)' }}>
          <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle,rgba(61,214,138,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(61,214,138,0.7)', marginBottom: '0.5rem' }}>Your Impact</p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#f0f4ff', lineHeight: 1 }}>
                {user?.impactScore || 0}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.375rem' }}>
                You helped <strong style={{ color: '#3dd68a' }}>{user?.peopleHelped || 0}</strong> people this month
              </p>
            </div>
            <div className="flex items-center gap-6">
              {[
                [`🔥 ${user?.currentStreak || 0}`, 'day streak'],
                [`#${analytics?.rank || '–'}`, 'global rank'],
              ].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>{v}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.4)', marginTop: '0.125rem' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Badges */}
          {(user?.badges || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 relative z-10">
              {user.badges.map((b, i) => (
                <span key={i} style={{ padding: '0.2rem 0.625rem', borderRadius: '999px', background: 'rgba(61,214,138,0.12)', border: '1px solid rgba(61,214,138,0.18)', fontSize: '0.75rem', color: '#3dd68a', fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Time" value={loading ? '–' : `${(user?.totalHours||0).toFixed(1)}h`} sub={`${user?.totalMinutes ? Math.round(user.totalMinutes % 60) : 0}m this session`} icon="⏱" color="#3dd68a" loading={loading} />
        <StatCard label="Impact Score" value={loading ? '–' : user?.impactScore || 0} sub="points earned" icon="⚡" color="#9d74ff" loading={loading} />
        <StatCard label="People Helped" value={loading ? '–' : user?.peopleHelped || 0} sub="this month" icon="🤝" color="#60a5fa" loading={loading} />
        <StatCard label="Sessions" value={loading ? '–' : done.length} sub="completed" icon="✅" color="#fbbf24" loading={loading} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Activity chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Weekly Activity</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>Hours per day</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>Last 7 days</span>
          </div>
          {loading ? (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3dd68a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3dd68a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--font-sans)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="hours" stroke="#3dd68a" strokeWidth={2} fill="url(#grad)"
                  dot={{ fill: '#3dd68a', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#3dd68a', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</span>
              <p style={{ fontSize: '0.875rem' }}>No activity yet</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Scan a QR code to start tracking</p>
            </div>
          )}
        </div>

        {/* Level + streak */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500, marginBottom: '0.75rem' }}>Level Progress</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${lvl.color}12`, border: `1px solid ${lvl.color}22` }}>
                {{ Beginner: '🌱', Helper: '💙', Leader: '⭐', Hero: '🏆' }[user?.level] || '🌱'}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 800, color: lvl.color, letterSpacing: '-0.02em' }}>{user?.level}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{user?.xp || 0} XP</p>
              </div>
            </div>
            <div className="progress-track" style={{ height: '5px' }}>
              <div className="progress-fill" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${lvl.color}88, ${lvl.color})` }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
              {Math.max(0, lvl.next - (user?.xp || 0))} XP to next level
            </p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500 }}>Streak</p>
              <span style={{ fontSize: '1.25rem' }}>🔥</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1, margin: '0.5rem 0 0.25rem' }}>
              {user?.currentStreak || 0}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>days · best: {user?.longestStreak || 0}</p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      {user?.role !== 'guest' && (
        <div className="mb-6">
          <p className="section-label">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {user?.role !== 'volunteer' && <QuickAction icon="📱" label="QR Scanner" to="/scanner" />}
            <QuickAction icon="🚀" label="Missions" to="/missions" />
            <QuickAction icon="💬" label="Chat" to="/chat" />
            <QuickAction icon="📹" label="Video" to="/video" />
          </div>
        </div>
      )}

      {/* ── Bottom grid ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent logs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Recent Activity</h2>
            <Link to="/certificates" style={{ fontSize: '0.8125rem', color: '#3dd68a', fontWeight: 600 }}>View all →</Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <Sk key={i} h="3rem" r="10px" />)}</div>
          ) : done.length === 0 ? (
            <div className="flex flex-col items-center py-8" style={{ color: 'var(--text-3)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</span>
              <p style={{ fontSize: '0.875rem' }}>No activity yet</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Scan a QR code to get started</p>
            </div>
          ) : done.slice(0, 5).map(log => (
            <div key={log._id} className="flex items-center justify-between py-3 divide-subtle"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--surface-3)', fontSize: '0.875rem' }}>⏱</div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{log.sessionId?.title || 'Session'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{new Date(log.startTime).toLocaleDateString()}</p>
                </div>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#3dd68a', fontFamily: 'var(--font-mono)' }}>
                {log.formattedDuration || (log.totalHours >= 1 ? `${log.totalHours.toFixed(1)}h` : `${Math.round((log.totalHours || 0) * 60)}m`)}
              </span>
            </div>
          ))}
        </div>

        {/* Recommendations / Active sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {recs?.recommended?.length > 0 ? 'Recommended' : 'Active Sessions'}
            </h2>
            <Link to="/missions" style={{ fontSize: '0.8125rem', color: '#3dd68a', fontWeight: 600 }}>Browse →</Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map(i => <Sk key={i} h="3rem" r="10px" />)}</div>
          ) : (recs?.recommended?.length > 0 ? recs.recommended : activeSessions).slice(0, 4).map(item => (
            <Link key={item._id} to="/missions"
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.isUrgent ? 'rgba(239,68,68,0.1)' : 'var(--surface-3)', fontSize: '0.875rem' }}>
                  {item.isUrgent ? '🚨' : '🚀'}
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{item.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{item.location || item.category || 'Mission'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {item.activeStatus && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3dd68a', animation: 'pulse 2s infinite' }} />}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>→</span>
              </div>
            </Link>
          ))}
          {(recs?.recommended || activeSessions).length === 0 && (
            <div className="flex flex-col items-center py-8" style={{ color: 'var(--text-3)' }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</span>
              <p style={{ fontSize: '0.875rem' }}>No missions available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
