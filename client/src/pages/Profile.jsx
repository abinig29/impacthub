import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const LEVEL_META = {
  Hero:     { emoji: '🏆', color: '#fbbf24', label: 'Hero',     nextXp: 500 },
  Leader:   { emoji: '⭐', color: '#9d74ff', label: 'Leader',   nextXp: 500 },
  Helper:   { emoji: '💙', color: '#60a5fa', label: 'Helper',   nextXp: 200 },
  Beginner: { emoji: '🌱', color: '#8a9bc5', label: 'Beginner', nextXp: 50  },
}

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)' },
  admin:       { label: 'Admin',       color: '#9d74ff', bg: 'rgba(157,116,255,0.1)', border: 'rgba(157,116,255,0.2)' },
  volunteer:   { label: 'Volunteer',   color: '#3dd68a', bg: 'rgba(61,214,138,0.1)',  border: 'rgba(61,214,138,0.2)' },
  guest:       { label: 'Guest',       color: '#8a9bc5', bg: 'rgba(138,155,197,0.1)', border: 'rgba(138,155,197,0.15)' },
}

const Sk = ({ h = '1rem', w = '100%', r = '8px' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
)

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-sans)',
        fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
        background: active ? 'var(--surface-3)' : 'transparent',
        color: active ? 'var(--text-1)' : 'var(--text-3)',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'var(--surface-2)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' } }}>
      {children}
    </button>
  )
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState('overview')
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    location: user?.location || '',
    emergencyContact: user?.emergencyContact || '',
    emergencyPhone: user?.emergencyPhone || '',
  })
  const [logs, setLogs] = useState([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (tab === 'activity') {
      setLoadingLogs(true)
      api.get('/timelogs/my').then(r => setLogs(r.data)).catch(() => {}).finally(() => setLoadingLogs(false))
    }
  }, [tab])

  const lvl = LEVEL_META[user?.level] || LEVEL_META.Beginner
  const role = ROLE_META[user?.role] || ROLE_META.guest
  const xpPct = Math.min(100, ((user?.xp || 0) / lvl.nextXp) * 100)

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess(false)
    try {
      await api.put(`/users/${user._id}`, {
        name: form.name, bio: form.bio,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        location: form.location,
      })
      await refreshUser()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save') }
    setSaving(false)
  }

  return (
    <div className="page" style={{ maxWidth: '900px' }}>

      {/* ── Profile hero ── */}
      <div className="card card-lg mb-5 relative overflow-hidden">
        {/* Background gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: `linear-gradient(135deg, ${lvl.color}08, ${role.color}06)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '1px', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${lvl.color}40,transparent)`, pointerEvents: 'none' }} />

        <div className="flex items-start gap-5 relative flex-wrap">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: `linear-gradient(135deg,${lvl.color}25,${lvl.color}10)`, border: `2px solid ${lvl.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: lvl.color }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'var(--surface-3)', border: `1px solid ${lvl.color}30`, fontSize: '0.65rem', fontWeight: 800, color: lvl.color, whiteSpace: 'nowrap' }}>
              {lvl.emoji} {lvl.label}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 mt-1">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{user?.name}</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>{user?.email}</p>
                {user?.location && <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>📍 {user.location}</p>}
              </div>
              <div style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', background: role.bg, border: `1px solid ${role.border}`, fontSize: '0.75rem', fontWeight: 700, color: role.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {role.label}
              </div>
            </div>
            {user?.bio && <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginTop: '0.75rem', lineHeight: 1.6 }}>{user.bio}</p>}
            {(user?.skills || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.skills.map((s, i) => <span key={i} className="tag">{s}</span>)}
              </div>
            )}
          </div>

          {/* Stats column */}
          <div className="flex gap-5 flex-shrink-0">
            {[
              [(user?.totalHours || 0).toFixed(1) + 'h', 'Total Time'],
              [user?.impactScore || 0, 'Impact'],
              [user?.peopleHelped || 0, 'Helped'],
              [user?.currentStreak || 0, 'Streak 🔥'],
            ].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1 }}>{v}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.25rem', fontWeight: 500 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* XP bar */}
        {user?.role !== 'guest' && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500 }}>Level Progress</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: lvl.color }}>{user?.xp || 0} / {lvl.nextXp} XP</span>
            </div>
            <div className="progress-track" style={{ height: '6px' }}>
              <div className="progress-fill" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg,${lvl.color}88,${lvl.color})` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {[['overview','Overview'],['activity','Activity'],['edit','Edit Profile'],['qr','QR Code']].map(([id, label]) => (
          <TabBtn key={id} active={tab === id} onClick={() => setTab(id)}>{label}</TabBtn>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Badges */}
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>Earned Badges</h2>
            {(user?.badges || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-3)' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>🏅</p>
                <p style={{ fontSize: '0.875rem' }}>No badges yet — keep volunteering!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '10px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1rem' }}>{b.split(' ')[0]}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>{b.split(' ').slice(1).join(' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Impact stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['⏱', (user?.totalHours || 0).toFixed(1) + 'h', 'Total Hours', '#3dd68a'],
              ['🤝', user?.peopleHelped || 0, 'People Helped', '#60a5fa'],
              ['🔥', user?.currentStreak || 0, 'Day Streak', '#f59e0b'],
              ['📋', user?.sessionsAttended || 0, 'Sessions', '#9d74ff'],
            ].map(([icon, val, label, color]) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{icon}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Emergency contact */}
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
              Emergency Contact
            </h2>
            {user?.emergencyContact ? (
              <div className="flex items-center gap-3">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🆘</div>
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-1)' }}>{user.emergencyContact}</p>
                  {user.emergencyPhone && <p style={{ fontSize: '0.875rem', color: '#60a5fa', fontFamily: 'var(--font-mono)', marginTop: '0.125rem' }}>{user.emergencyPhone}</p>}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-3)' }}>
                <p style={{ fontSize: '0.875rem' }}>No emergency contact set. Add one in <button onClick={() => setTab('edit')} style={{ color: '#3dd68a', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Edit Profile</button>.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {tab === 'activity' && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>Volunteer History</h2>
          {loadingLogs ? (
            <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <Sk key={i} h="56px" r="10px" />)}</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-3)' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>📋</p>
              <p style={{ fontSize: '0.875rem' }}>No sessions logged yet.</p>
            </div>
          ) : logs.map(log => (
            <div key={log._id} className="flex items-center justify-between py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: log.status === 'completed' ? 'rgba(61,214,138,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${log.status === 'completed' ? 'rgba(61,214,138,0.2)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                  {log.status === 'completed' ? '✅' : '⏱'}
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{log.sessionId?.title || 'Session'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>
                    {new Date(log.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {log.status === 'completed' ? (
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#3dd68a', fontFamily: 'var(--font-mono)' }}>
                    {log.formattedDuration || `${(log.totalHours || 0).toFixed(1)}h`}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Active</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EDIT ── */}
      {tab === 'edit' && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>Edit Profile</h2>
          {success && <div className="px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(61,214,138,0.08)', border: '1px solid rgba(61,214,138,0.2)', fontSize: '0.875rem', color: '#3dd68a', fontWeight: 500 }}>✅ Profile updated successfully</div>}
          {error && <div className="px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '0.875rem', color: '#f87171' }}>{error}</div>}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Email <span style={{ color: 'var(--text-3)' }}>(locked)</span></label>
                <input className="input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="input" rows={3} style={{ resize: 'vertical' }} placeholder="Tell your story as a volunteer…" value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="City, Country" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
            </div>
            <div>
              <label className="label">Skills <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma-separated)</span></label>
              <input className="input" placeholder="Teaching, First Aid, Translation…" value={form.skills} onChange={e => setForm(p => ({...p, skills: e.target.value}))} />
            </div>
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.875rem' }}>🆘 Emergency Contact</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Name</label>
                  <input className="input" placeholder="Full name" value={form.emergencyContact} onChange={e => setForm(p => ({...p, emergencyContact: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="+1 234 567 8900" type="tel" value={form.emergencyPhone} onChange={e => setForm(p => ({...p, emergencyPhone: e.target.value}))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── QR ── */}
      {tab === 'qr' && (
        <div className="card card-lg" style={{ maxWidth: '440px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Your Volunteer QR Code</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Show this to an admin to be checked in or out of a volunteer session. Your time is tracked automatically.
          </p>
          {user?.qrCodeImage ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', padding: '1.25rem', borderRadius: '16px', background: '#fff', marginBottom: '1rem' }}>
                <img src={user.qrCodeImage} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>
              <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>QR Code ID</p>
                <p style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)', wordBreak: 'break-all' }}>{user.qrCode}</p>
              </div>
              <a href={user.qrCodeImage} download="my-volunteer-qr.png" className="btn-secondary inline-flex" style={{ width: '100%', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download QR Code
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-3)' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📱</p>
              <p style={{ fontSize: '0.875rem' }}>QR code not available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
