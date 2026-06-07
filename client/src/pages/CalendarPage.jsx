import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const TYPE_COLORS = { mission: '#16b36e', meeting: '#818cf8', reminder: '#f59e0b', event: '#60a5fa' }
const TYPE_ICONS = { mission: '🚀', meeting: '📹', reminder: '⏰', event: '📅' }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [today] = useState(new Date())
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() })
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', type: 'event', startDate: '', endDate: '', location: '', isAllDay: false, color: '#16b36e' })
  const [saving, setSaving] = useState(false)

  const isAdmin = ['admin','super_admin'].includes(user?.role)

  const load = async (m = current.month, y = current.year) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/calendar?month=${m+1}&year=${y}`)
      setEvents(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [current])

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay()

  const eventsOnDay = (day) => {
    const d = new Date(current.year, current.month, day)
    return events.filter(ev => {
      const s = new Date(ev.startDate)
      return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth() && s.getDate() === d.getDate()
    })
  }

  const isToday = (day) => {
    return day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear()
  }

  const navigate = (dir) => {
    setCurrent(prev => {
      let m = prev.month + dir, y = prev.year
      if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
      return { month: m, year: y }
    })
  }

  const rsvp = async (eventId, status) => {
    try {
      await api.post(`/calendar/${eventId}/rsvp`, { status })
      load()
    } catch {}
  }

  const createEvent = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/calendar', form)
      setShowForm(false)
      setForm({ title: '', description: '', type: 'event', startDate: '', endDate: '', location: '', isAllDay: false, color: '#16b36e' })
      load()
    } catch {}
    setSaving(false)
  }

  const deleteEvent = async (id) => {
    if (!confirm('Delete event?')) return
    try { await api.delete(`/calendar/${id}`); load(); setSelected(null) } catch {}
  }

  const syncGoogleCalendar = (ev) => {
    const s = new Date(ev.startDate)
    const e = ev.endDate ? new Date(ev.endDate) : new Date(s.getTime() + 3600000)
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${fmt(s)}/${fmt(e)}&details=${encodeURIComponent(ev.description || '')}&location=${encodeURIComponent(ev.location || '')}`
    window.open(url, '_blank')
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="section-title mb-1">📅 Smart Calendar</h1>
          <p className="text-slate-400 text-sm">Missions, meetings, events and reminders</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            + Add Event
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="font-bold text-white mb-4">Create Event</h3>
          <form onSubmit={createEvent} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value,color:TYPE_COLORS[e.target.value]||'#16b36e'}))}>
                {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
              </select>
            </div>
            <div><label className="label">Location</label><input className="input" placeholder="Optional" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} /></div>
            <div><label className="label">Start Date *</label><input className="input" type="datetime-local" value={form.startDate} onChange={e => setForm(p=>({...p,startDate:e.target.value}))} required /></div>
            <div><label className="label">End Date</label><input className="input" type="datetime-local" value={form.endDate} onChange={e => setForm(p=>({...p,endDate:e.target.value}))} /></div>
            <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} /></div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Event'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-3 card p-4">
          {/* Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-slate-300 transition-colors">‹</button>
            <h2 className="font-black text-white text-lg">{MONTHS[current.month]} {current.year}</h2>
            <button onClick={() => navigate(1)} className="w-9 h-9 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-slate-300 transition-colors">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-slate-500 py-2">{d}</div>)}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex gap-1.5">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
            </div>
          ) : (
            <div className="grid grid-cols-7 border-l border-t border-dark-700">
              {Array.from({length: firstDayOfWeek}).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-dark-700 p-1.5 min-h-[70px] bg-dark-900/30" />
              ))}
              {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                const dayEvs = eventsOnDay(day)
                const todayDay = isToday(day)
                return (
                  <div key={day} className={`border-r border-b border-dark-700 p-1.5 min-h-[70px] cursor-pointer hover:bg-dark-700/40 transition-colors ${todayDay ? 'bg-brand-600/10' : ''}`}
                    onClick={() => setSelected(null)}>
                    <p className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${todayDay ? 'bg-brand-600 text-white' : 'text-slate-400'}`}>{day}</p>
                    {dayEvs.slice(0,2).map(ev => (
                      <button key={ev._id} onClick={e => { e.stopPropagation(); setSelected(ev) }}
                        className="w-full text-left px-1.5 py-0.5 rounded-md text-xs mb-0.5 truncate text-white font-medium hover:opacity-80 transition-opacity"
                        style={{ background: (ev.color || TYPE_COLORS[ev.type] || '#16b36e') + '33', borderLeft: `2px solid ${ev.color || TYPE_COLORS[ev.type] || '#16b36e'}` }}>
                        {TYPE_ICONS[ev.type]} {ev.title}
                      </button>
                    ))}
                    {dayEvs.length > 2 && <p className="text-xs text-slate-500 px-1">+{dayEvs.length - 2} more</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="card">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Event Types</p>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-slate-300 capitalize">{TYPE_ICONS[type]} {type}</span>
              </div>
            ))}
          </div>

          {/* Selected event */}
          {selected && (
            <div className="card animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_ICONS[selected.type]}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{selected.title}</p>
                    <span className="text-xs capitalize" style={{ color: TYPE_COLORS[selected.type] }}>{selected.type}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300">×</button>
              </div>
              {selected.description && <p className="text-xs text-slate-400 mb-3">{selected.description}</p>}
              {selected.location && <p className="text-xs text-slate-500 mb-3">📍 {selected.location}</p>}
              <p className="text-xs text-slate-500 mb-4">📅 {new Date(selected.startDate).toLocaleString()}</p>
              {/* RSVP */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Your RSVP:</p>
                <div className="flex gap-1.5">
                  {[['going','✅','Going'],['maybe','🤔','Maybe'],['not_going','❌','No']].map(([s,icon,label]) => (
                    <button key={s} onClick={() => rsvp(selected._id, s)}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:border-brand-600/50 transition-all text-slate-300">
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => syncGoogleCalendar(selected)} className="btn-secondary flex-1 justify-center text-xs py-1.5">
                  📆 Google Cal
                </button>
                {isAdmin && (
                  <button onClick={() => deleteEvent(selected._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                )}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="card">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Upcoming</p>
            {events.filter(ev => new Date(ev.startDate) >= new Date()).slice(0,5).map(ev => (
              <button key={ev._id} onClick={() => setSelected(ev)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-dark-700 transition-colors mb-1 border border-transparent hover:border-dark-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.color || TYPE_COLORS[ev.type] || '#16b36e' }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{ev.title}</p>
                    <p className="text-xs text-slate-500">{new Date(ev.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            ))}
            {events.filter(ev => new Date(ev.startDate) >= new Date()).length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
