import React, { useEffect, useState, useRef } from 'react'
import api from '../utils/api'
import { getSocket } from '../utils/socket'

// Use CDN Leaflet to avoid SSR/build issues
const L_CDN = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const L_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

const CATEGORY_COLORS = {
  'Food Distribution': '#f59e0b',
  'School Support': '#60a5fa',
  'Community Cleanup': '#34d399',
  'Medical Support': '#f87171',
  'Flood Relief': '#818cf8',
  'Emergency Response': '#ef4444',
  'Other': '#16b36e',
}

const DEFAULT_MISSIONS = [
  { _id: '1', title: 'Food Distribution Drive', category: 'Food Distribution', location: 'Addis Ababa, Ethiopia', coordinates: { lat: 9.0227, lng: 38.7469 }, status: 'active', volunteers: [], goalProgress: 65, goalTarget: 200, goalUnit: 'families', peopleHelped: 130, isUrgent: false },
  { _id: '2', title: 'School Support Program', category: 'School Support', location: 'Debre Markos, Ethiopia', coordinates: { lat: 10.3433, lng: 37.7296 }, status: 'active', volunteers: [], goalProgress: 40, goalTarget: 100, goalUnit: 'students', peopleHelped: 40, isUrgent: false },
  { _id: '3', title: 'Community Cleanup', category: 'Community Cleanup', location: 'Bahir Dar, Ethiopia', coordinates: { lat: 11.5742, lng: 37.3614 }, status: 'active', volunteers: [], goalProgress: 80, goalTarget: 50, goalUnit: 'areas', peopleHelped: 500, isUrgent: false },
  { _id: '4', title: 'Emergency Medical Support', category: 'Medical Support', location: 'Gondar, Ethiopia', coordinates: { lat: 12.6030, lng: 37.4521 }, status: 'active', volunteers: [], goalProgress: 30, goalTarget: 80, goalUnit: 'patients', peopleHelped: 24, isUrgent: true },
  { _id: '5', title: 'Flood Relief Operation', category: 'Flood Relief', location: 'Dire Dawa, Ethiopia', coordinates: { lat: 9.5931, lng: 41.8661 }, status: 'active', volunteers: [], goalProgress: 55, goalTarget: 300, goalUnit: 'people', peopleHelped: 165, isUrgent: true },
]

export default function ImpactMap() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [missions, setMissions] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [liveActivity, setLiveActivity] = useState([])
  const [filter, setFilter] = useState('all')
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load Leaflet from CDN
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setLeafletLoaded(true); return }
    const link = document.createElement('link')
    link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = L_CSS
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = L_CDN
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    Promise.all([api.get('/missions'), api.get('/analytics/public')])
      .then(([mRes, sRes]) => {
        const data = mRes.data.length > 0 ? mRes.data : DEFAULT_MISSIONS
        setMissions(data); setStats(sRes.data)
      })
      .catch(() => { setMissions(DEFAULT_MISSIONS) })
      .finally(() => setLoading(false))
  }, [])

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: [9.5, 40.5], zoom: 6, zoomControl: false,
      attributionControl: false,
    })
    mapInstanceRef.current = map

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    return () => { map.remove(); mapInstanceRef.current = null }
  }, [leafletLoaded])

  // Add markers
  useEffect(() => {
    const L = window.L
    if (!L || !mapInstanceRef.current || missions.length === 0) return
    const map = mapInstanceRef.current

    // Clear old
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const filtered = filter === 'all' ? missions : missions.filter(m => m.status === filter)

    filtered.forEach(mission => {
      const lat = mission.coordinates?.lat || 9.0
      const lng = mission.coordinates?.lng || 38.7
      if (!lat || !lng) return

      const color = CATEGORY_COLORS[mission.category] || '#16b36e'
      const isUrgent = mission.isUrgent
      const size = isUrgent ? 18 : 14

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2px solid white;
          box-shadow:0 0 ${isUrgent ? '16px' : '8px'} ${color};
          ${isUrgent ? 'animation:pulse 1.5s ease-in-out infinite;' : ''}
          cursor:pointer;position:relative;
        ">
          ${isUrgent ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:pulse 1.5s ease-in-out infinite 0.3s;"></div>` : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      })

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
              <strong style="font-size:13px;">${mission.title}</strong>
              ${isUrgent ? '<span style="background:#ef4444;color:white;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:700;">URGENT</span>' : ''}
            </div>
            <p style="font-size:11px;color:#94a3b8;margin-bottom:6px;">📍 ${mission.location || 'Ethiopia'}</p>
            <p style="font-size:11px;color:#94a3b8;margin-bottom:6px;">🏷 ${mission.category}</p>
            <p style="font-size:11px;color:#94a3b8;margin-bottom:8px;">🤝 ${mission.peopleHelped || 0} people helped</p>
            <div style="background:#273042;border-radius:6px;height:6px;overflow:hidden;margin-bottom:4px;">
              <div style="height:100%;width:${Math.min(100,(mission.goalProgress/Math.max(1,mission.goalTarget))*100)}%;background:${color};border-radius:6px;"></div>
            </div>
            <p style="font-size:10px;color:#64748b;">${mission.goalProgress}/${mission.goalTarget} ${mission.goalUnit || 'people'}</p>
          </div>
        `, { className: '' })
        .addTo(map)

      marker.on('click', () => setSelected(mission))
      markersRef.current.push(marker)
    })
  }, [missions, filter, leafletLoaded])

  // Live activity socket
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handler = (data) => {
      setLiveActivity(prev => [data, ...prev].slice(0, 8))
    }
    socket.on('activity_update', handler)
    return () => socket.off('activity_update', handler)
  }, [])

  const FILTERS = ['all', 'active', 'planning', 'completed']

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-dark-900/95 border-b border-dark-700/60 flex-shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="font-black text-white text-lg">🌍 Impact Map</h1>
          <p className="text-xs text-slate-400">Live mission locations and volunteer activity</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all capitalize ${filter === f ? 'bg-brand-600 border-brand-500 text-white' : 'bg-dark-700 border-dark-600 text-slate-400 hover:border-brand-600/40'}`}>
              {f}
            </button>
          ))}
        </div>
        {stats && (
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center"><p className="font-black text-brand-400">{missions.length}</p><p className="text-slate-500">Missions</p></div>
            <div className="text-center"><p className="font-black text-white">{stats.totalUsers}</p><p className="text-slate-500">Volunteers</p></div>
            <div className="text-center"><p className="font-black text-white">{stats.peopleHelped}</p><p className="text-slate-500">Helped</p></div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-950 z-10">
              <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[999] glass-card p-3 max-w-48">
            <p className="text-xs font-bold text-slate-300 mb-2">Categories</p>
            {Object.entries(CATEGORY_COLORS).slice(0,5).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-slate-400 truncate">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-72 flex-shrink-0 bg-dark-900/95 border-l border-dark-700/60 flex flex-col overflow-hidden">
          {selected ? (
            <div className="flex-1 overflow-y-auto p-4">
              <button onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">← Back</button>
              {selected.isUrgent && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-red-900/30 border border-red-700/50 flex items-center gap-2">
                  <span className="animate-pulse">🚨</span>
                  <span className="text-red-300 text-xs font-bold">URGENT MISSION</span>
                </div>
              )}
              <div className="w-full h-32 rounded-xl mb-3 flex items-center justify-center text-4xl" style={{ background: `${CATEGORY_COLORS[selected.category] || '#16b36e'}20`, border: `1px solid ${CATEGORY_COLORS[selected.category] || '#16b36e'}40` }}>
                {{'Food Distribution':'🍱','School Support':'📚','Community Cleanup':'🧹','Medical Support':'🏥','Flood Relief':'🌊','Emergency Response':'🚨'}[selected.category] || '🌍'}
              </div>
              <h2 className="font-black text-white text-base mb-1">{selected.title}</h2>
              <p className="text-xs text-slate-400 mb-3">📍 {selected.location}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['👥', selected.volunteers?.length || 0, 'Volunteers'], ['🤝', selected.peopleHelped || 0, 'Helped'], ['📊', `${Math.round((selected.goalProgress/Math.max(1,selected.goalTarget))*100)}%`, 'Progress'], ['📅', selected.status, 'Status']].map(([icon, val, label]) => (
                  <div key={label} className="p-2 rounded-xl bg-dark-800 border border-dark-600 text-center">
                    <p className="text-base">{icon}</p>
                    <p className="text-sm font-bold text-white">{val}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Goal Progress</span><span>{selected.goalProgress}/{selected.goalTarget} {selected.goalUnit}</span></div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100,(selected.goalProgress/Math.max(1,selected.goalTarget))*100)}%`, background: CATEGORY_COLORS[selected.category] || '#16b36e' }} />
                </div>
              </div>
              <a href={`/missions`} className="btn-primary w-full justify-center text-sm">View Mission →</a>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pt-4 pb-2 border-b border-dark-700/60">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Missions ({missions.filter(m => m.status === 'active').length})</p>
              </div>
              <div className="p-3 space-y-2">
                {missions.filter(m => filter === 'all' || m.status === filter).map(m => (
                  <button key={m._id} onClick={() => setSelected(m)}
                    className={`w-full text-left p-3 rounded-xl border transition-all hover:border-brand-600/40 ${m.isUrgent ? 'mission-urgent bg-red-900/10' : 'bg-dark-800 border-dark-600'}`}>
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: CATEGORY_COLORS[m.category] || '#16b36e' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          {m.isUrgent && <span className="text-xs text-red-400 font-bold">🚨</span>}
                          <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{m.location}</p>
                        <div className="mt-1.5 h-1 bg-dark-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100,(m.goalProgress/Math.max(1,m.goalTarget))*100)}%`, background: CATEGORY_COLORS[m.category] || '#16b36e' }} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live activity feed */}
          <div className="border-t border-dark-700/60 p-3 bg-dark-950/50">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <p className="text-xs font-bold text-slate-400">Live Activity</p>
            </div>
            <div className="space-y-1 max-h-24 overflow-hidden">
              {liveActivity.length === 0 ? (
                <p className="text-xs text-slate-600">Waiting for live updates…</p>
              ) : liveActivity.map((a, i) => (
                <p key={i} className="text-xs text-slate-400 truncate">{a.message}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
