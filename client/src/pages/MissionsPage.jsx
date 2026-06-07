import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const CAT_META = {
  'Food Distribution':  { icon: '🍱', color: '#f59e0b' },
  'School Support':     { icon: '📚', color: '#60a5fa' },
  'Community Cleanup':  { icon: '🧹', color: '#34d399' },
  'Medical Support':    { icon: '🏥', color: '#f87171' },
  'Flood Relief':       { icon: '🌊', color: '#818cf8' },
  'Emergency Response': { icon: '🚨', color: '#ef4444' },
  'Other':              { icon: '🌍', color: '#3dd68a' },
}

const STATUS_META = {
  active:    { label: 'Active',    color: '#3dd68a', bg: 'rgba(61,214,138,0.1)',   border: 'rgba(61,214,138,0.2)' },
  planning:  { label: 'Planning',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)' },
  completed: { label: 'Done',      color: '#8a9bc5', bg: 'rgba(138,155,197,0.1)', border: 'rgba(138,155,197,0.15)' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
}

const Sk = ({ h = '1rem', w = '100%', r = '8px' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />
)

/* ── Mission Card ── */
function MissionCard({ mission, user, onJoin, onLeave, onSelect }) {
  const isJoined = mission.volunteers?.some(v => (v._id || v) === user?._id)
  const pct = Math.min(100, Math.round((mission.goalProgress / Math.max(1, mission.goalTarget)) * 100))
  const isGuest = user?.role === 'guest'
  const cat = CAT_META[mission.category] || CAT_META['Other']
  const status = STATUS_META[mission.status] || STATUS_META.active
  const isAdmin = ['admin', 'super_admin'].includes(user?.role)

  return (
    <div
      onClick={() => onSelect(mission)}
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${mission.isUrgent ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: mission.isUrgent ? '0 0 0 1px rgba(239,68,68,0.08), 0 4px 24px rgba(239,68,68,0.06)' : 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.borderColor = mission.isUrgent ? 'rgba(239,68,68,0.4)' : `${cat.color}30`
        e.currentTarget.style.boxShadow = mission.isUrgent
          ? '0 8px 32px rgba(239,68,68,0.12)'
          : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cat.color}18`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = mission.isUrgent ? 'rgba(239,68,68,0.25)' : 'var(--border)'
        e.currentTarget.style.boxShadow = mission.isUrgent ? '0 0 0 1px rgba(239,68,68,0.08), 0 4px 24px rgba(239,68,68,0.06)' : 'var(--shadow-sm)'
      }}>

      {/* Urgent stripe */}
      {mission.isUrgent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#ef4444,#f87171,#ef4444)', backgroundSize: '200% 100%' }} />
      )}

      {/* Category accent line */}
      {!mission.isUrgent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${cat.color}40,transparent)` }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cat.color}12`, border: `1px solid ${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
            {cat.icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {mission.title}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{mission.category}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {mission.isUrgent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Urgent</span>
            </div>
          )}
          <div style={{ padding: '0.175rem 0.5rem', borderRadius: '999px', background: status.bg, border: `1px solid ${status.border}`, fontSize: '0.65rem', fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {status.label}
          </div>
        </div>
      </div>

      {/* Description */}
      {mission.description && (
        <p className="truncate-2" style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.55 }}>
          {mission.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z"/></svg>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 600 }}>{mission.volunteers?.length || 0}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>volunteers</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 600 }}>{mission.peopleHelped || 0}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>helped</span>
        </div>
        {mission.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-3)', maxWidth: '100px' }}>{mission.location}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{mission.goalDescription || 'Goal progress'}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cat.color }}>{pct}%</span>
        </div>
        <div className="progress-track" style={{ height: '4px', background: 'var(--surface-4)' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${cat.color}88,${cat.color})`, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.375rem' }}>
          {mission.goalProgress} / {mission.goalTarget} {mission.goalUnit || 'people'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
        {mission.startDate && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            📅 {new Date(mission.startDate).toLocaleDateString()}
          </span>
        )}
        {!isGuest && mission.status === 'active' && (
          <div className="flex gap-2 ml-auto">
            {isJoined ? (
              <button className="btn-secondary btn-sm" onClick={() => onLeave(mission._id)}>
                Leave
              </button>
            ) : (
              <button className="btn-primary btn-sm"
                style={{ background: `linear-gradient(135deg,${cat.color},${cat.color}cc)`, boxShadow: `0 2px 8px ${cat.color}30` }}
                onClick={() => onJoin(mission._id)}>
                Join →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Mission Detail ── */
function MissionDetail({ mission, user, onJoin, onLeave, onBack }) {
  const isJoined = mission.volunteers?.some(v => (v._id || v) === user?._id)
  const pct = Math.min(100, Math.round((mission.goalProgress / Math.max(1, mission.goalTarget)) * 100))
  const cat = CAT_META[mission.category] || CAT_META['Other']
  const isGuest = user?.role === 'guest'

  return (
    <div className="page" style={{ maxWidth: '800px' }}>
      <button onClick={onBack} className="btn-ghost btn-sm mb-6 flex items-center gap-2" style={{ paddingLeft: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Missions
      </button>

      {/* Urgent alert */}
      {mission.isUrgent && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-6"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span style={{ fontSize: '1.25rem' }}>🚨</span>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f87171' }}>Urgent Mission</p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(248,113,113,0.7)' }}>{mission.urgencyReason || 'Immediate volunteer help needed'}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card card-lg mb-5">
        <div className="flex items-start gap-4 mb-5">
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${cat.color}12`, border: `1px solid ${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            {cat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {mission.title}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{mission.category}</span>
              <span style={{ color: 'var(--text-3)' }}>·</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{mission.status}</span>
              {mission.location && <>
                <span style={{ color: 'var(--text-3)' }}>·</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>📍 {mission.location}</span>
              </>}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{mission.description}</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            [mission.volunteers?.length || 0, 'Volunteers', '👥'],
            [mission.peopleHelped || 0, 'People Helped', '🤝'],
            [`${pct}%`, 'Goal Progress', '📊'],
            [mission.status, 'Status', '⚡'],
          ].map(([v, l, icon]) => (
            <div key={l} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.875rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{icon}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{String(v)}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.125rem', fontWeight: 500 }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 600 }}>{mission.goalDescription || 'Goal Progress'}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: cat.color }}>{mission.goalProgress} / {mission.goalTarget} {mission.goalUnit}</span>
          </div>
          <div className="progress-track" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${cat.color}88,${cat.color})` }} />
          </div>
        </div>

        {/* Leader */}
        {mission.leader && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(61,214,138,0.1)', color: '#3dd68a', border: '1px solid rgba(61,214,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
              {mission.leader.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mission Leader</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' }}>{mission.leader.name}</p>
            </div>
          </div>
        )}

        {/* Volunteers */}
        {(mission.volunteers || []).length > 0 && (
          <div className="mb-4">
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.75rem' }}>
              Volunteers ({mission.volunteers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {mission.volunteers.slice(0, 12).map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '999px', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(61,214,138,0.15)', color: '#3dd68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                    {(v.name || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{v.name || 'Volunteer'}</span>
                </div>
              ))}
              {mission.volunteers.length > 12 && (
                <div style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', background: 'var(--surface-3)', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-3)' }}>
                  +{mission.volunteers.length - 12} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join/Leave */}
        {!isGuest && mission.status === 'active' && (
          <div className="flex gap-3">
            {isJoined ? (
              <>
                <button className="btn-secondary" onClick={() => { onLeave(mission._id); onBack() }}>Leave Mission</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRadius: '10px', background: 'rgba(61,214,138,0.08)', border: '1px solid rgba(61,214,138,0.2)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3dd68a' }} />
                  <span style={{ fontSize: '0.875rem', color: '#3dd68a', fontWeight: 600 }}>Joined</span>
                </div>
              </>
            ) : (
              <button className="btn-primary" style={{ background: `linear-gradient(135deg,${cat.color},${cat.color}cc)`, boxShadow: `0 4px 16px ${cat.color}30` }}
                onClick={() => { onJoin(mission._id); onBack() }}>
                Join this Mission →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Create form ── */
function CreateForm({ onCreated, onClose }) {
  const CATS = Object.keys(CAT_META)
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', location: '', goalDescription: '', goalTarget: 100, goalUnit: 'people', maxVolunteers: 0, startDate: '', endDate: '', isUrgent: false, urgencyReason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const { data } = await api.post('/missions', form)
      onCreated(data)
    } catch (err) { setError(err.response?.data?.message || 'Failed to create') }
    setSaving(false)
  }

  const f = (name) => ({ value: form[name], onChange: e => setForm(p => ({ ...p, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })) })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card card-lg w-full max-w-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Create Mission</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ color: 'var(--text-3)' }}>×</button>
        </div>

        {error && <div className="px-4 py-3 rounded-xl mb-4" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', fontSize: '0.875rem', color: '#f87171' }}>{error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div><label className="label">Mission Title *</label><input className="input" placeholder="e.g. Community Food Drive" required {...f('title')} /></div>
          <div><label className="label">Description *</label><textarea className="input" rows={3} style={{ resize: 'vertical' }} placeholder="What will volunteers do?" required {...f('description')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input select" {...f('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div><label className="label">Location</label><input className="input" placeholder="City, address" {...f('location')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Goal Target</label><input className="input" type="number" min="1" {...f('goalTarget')} /></div>
            <div><label className="label">Goal Unit</label><input className="input" placeholder="people, meals…" {...f('goalUnit')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date</label><input className="input" type="datetime-local" {...f('startDate')} /></div>
            <div><label className="label">End Date</label><input className="input" type="datetime-local" {...f('endDate')} /></div>
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <input type="checkbox" {...f('isUrgent')} style={{ width: '16px', height: '16px', accentColor: '#ef4444' }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f87171' }}>🚨 Mark as Urgent</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Notifies all volunteers immediately</p>
            </div>
          </label>
          {form.isUrgent && <div><label className="label">Urgency Reason</label><input className="input" placeholder="Why is this urgent?" {...f('urgencyReason')} /></div>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create Mission'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function MissionsPage() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const isAdmin = ['admin','super_admin'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/missions'); setMissions(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const join = async (id) => { try { await api.post(`/missions/${id}/join`); load() } catch (err) { alert(err.response?.data?.message || 'Failed') } }
  const leave = async (id) => { try { await api.post(`/missions/${id}/leave`); load() } catch {} }

  if (selected) return <MissionDetail mission={selected} user={user} onJoin={join} onLeave={leave} onBack={() => setSelected(null)} />

  const urgent = missions.filter(m => m.isUrgent && m.status === 'active')
  const filtered = filter === 'all' ? missions : filter === 'urgent' ? urgent : missions.filter(m => m.status === filter)

  const FILTERS = [
    { id: 'all', label: 'All', count: missions.length },
    { id: 'active', label: 'Active', count: missions.filter(m => m.status === 'active').length },
    { id: 'urgent', label: '🚨 Urgent', count: urgent.length },
    { id: 'planning', label: 'Planning', count: missions.filter(m => m.status === 'planning').length },
    { id: 'completed', label: 'Done', count: missions.filter(m => m.status === 'completed').length },
  ]

  return (
    <div className="page" style={{ maxWidth: '1100px' }}>
      {showCreate && <CreateForm onCreated={m => { setMissions(p => [m, ...p]); setShowCreate(false) }} onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="page-title">Missions</h1>
          <p className="page-subtitle">{missions.length} mission{missions.length !== 1 ? 's' : ''} · {urgent.length} urgent</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Mission
          </button>
        )}
      </div>

      {/* Urgent banner */}
      {urgent.length > 0 && filter !== 'urgent' && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-6 flex-wrap" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f87171', letterSpacing: '-0.01em' }}>Urgent: Immediate Help Needed</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(248,113,113,0.7)' }}>{urgent.length} mission{urgent.length > 1 ? 's' : ''} need{urgent.length === 1 ? 's' : ''} volunteers now</p>
            </div>
          </div>
          <button className="btn-sm ml-auto" onClick={() => setFilter('urgent')} style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '0.375rem 0.875rem', fontWeight: 600, fontSize: '0.8125rem' }}>
            View urgent →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: '8px', whiteSpace: 'nowrap', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid', transition: 'all 0.15s',
              background: filter === f.id ? (f.id === 'urgent' ? 'rgba(239,68,68,0.12)' : 'rgba(61,214,138,0.08)') : 'transparent',
              color: filter === f.id ? (f.id === 'urgent' ? '#f87171' : '#3dd68a') : 'var(--text-3)',
              borderColor: filter === f.id ? (f.id === 'urgent' ? 'rgba(239,68,68,0.25)' : 'rgba(61,214,138,0.2)') : 'var(--border)',
            }}>
            {f.label} <span style={{ opacity: 0.6, marginLeft: '0.25rem', fontSize: '0.75rem' }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: '280px' }}><div className="skeleton" style={{ height: '100%', borderRadius: '16px' }} /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.25rem' }}>🚀</div>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem' }}>No missions found</p>
          <p style={{ fontSize: '0.875rem' }}>
            {isAdmin ? 'Create the first mission to get started.' : 'Check back soon for new volunteer opportunities.'}
          </p>
          {isAdmin && <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>Create Mission</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <MissionCard key={m._id} mission={m} user={user} onJoin={join} onLeave={leave} onSelect={setSelected} />
          ))}
        </div>
      )}
    </div>
  )
}
