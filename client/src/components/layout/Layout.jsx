import React, { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import api from '../../utils/api'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n/index.js'

/* ── Nav config ── */
const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard',   label: 'Dashboard',   icon: 'home',       roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/missions',    label: 'Missions',    icon: 'missions',   roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/stories',     label: 'Stories',     icon: 'stories',    roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/scanner',     label: 'QR Scanner',  icon: 'qr',         roles: ['super_admin','admin'] },
  ]},
  { section: 'Connect', items: [
    { to: '/chat',    label: 'Chat',       icon: 'chat',    roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/video',   label: 'Video',      icon: 'video',   roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/community',label:'Community',  icon: 'people',  roles: ['super_admin','admin','volunteer','guest'] },
  ]},
  { section: 'Explore', items: [
    { to: '/map',          label: 'Impact Map',  icon: 'map',      roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/gallery',      label: 'Gallery',     icon: 'gallery',  roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/leaderboard',  label: 'Leaderboard', icon: 'trophy',   roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/calendar',     label: 'Calendar',    icon: 'calendar', roles: ['super_admin','admin','volunteer','guest'] },
  ]},
  { section: 'More', items: [
    { to: '/certificates', label: 'Certificates', icon: 'cert',   roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/impact',       label: 'Impact Page',  icon: 'globe',  roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/donate',       label: 'Donate',       icon: 'heart',  roles: ['super_admin','admin','volunteer','guest'] },
    { to: '/admin',        label: 'Admin Panel',  icon: 'admin',  roles: ['super_admin','admin'] },
  ]},
]

/* ── SVG Icon set ── */
const ICONS = {
  home:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  missions: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  stories:  'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  qr:       'M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 9h10M7 12h10M7 15h10',
  chat:     'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  video:    'M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  people:   'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  map:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  gallery:  'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14',
  trophy:   'M8 21H5a2 2 0 01-2-2v-2m18 4h-3M12 3v18M5 7l7-4 7 4M5 17l7 4 7-4',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  cert:     'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  globe:    'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
  heart:    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  admin:    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  bell:     'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
}

const Icon = ({ id, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[id] || ''} />
  </svg>
)

/* ── Role config ── */
const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)' },
  admin:       { label: 'Admin',       color: '#9d74ff', bg: 'rgba(157,116,255,0.1)', border: 'rgba(157,116,255,0.2)' },
  volunteer:   { label: 'Volunteer',   color: '#3dd68a', bg: 'rgba(61,214,138,0.1)',  border: 'rgba(61,214,138,0.2)' },
  guest:       { label: 'Guest',       color: '#8a9bc5', bg: 'rgba(138,155,197,0.1)', border: 'rgba(138,155,197,0.15)' },
}

const LEVEL_COLOR = { Hero: '#fbbf24', Leader: '#9d74ff', Helper: '#60a5fa', Beginner: '#8a9bc5' }

/* ── Notification Bell ── */
function NotifBell() {
  const { notifications, unread, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
        style={{ color: 'var(--text-3)', background: open ? 'var(--surface-3)' : 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'var(--surface-3)' : 'transparent'}>
        <Icon id="bell" size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
            style={{ fontSize: '9px', background: '#ef4444', boxShadow: '0 0 0 2px var(--surface-1)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden animate-fade-down"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>
              Notifications {unread > 0 && <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>({unread})</span>}
            </p>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}
                className="hover:text-white transition-colors">Mark read</button>
            )}
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8" style={{ color: 'var(--text-3)' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>🔔</span>
                <p style={{ fontSize: '0.8125rem' }}>All caught up</p>
              </div>
            ) : notifications.slice(0, 10).map(n => (
              <div key={n._id} className="flex items-start gap-3 px-4 py-3 transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  borderLeft: !n.read ? '2px solid var(--accent)' : '2px solid transparent',
                  background: !n.read ? 'rgba(61,214,138,0.03)' : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(61,214,138,0.03)' : 'transparent'}>
                <span style={{ fontSize: '1rem', marginTop: '0.125rem', flexShrink: 0 }}>
                  {{ mission:'🚀', urgent:'🚨', approval:'✅', badge:'🏅', donation:'💰', system:'⚙️', story:'🌟' }[n.type] || '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>{n.title}</p>
                  <p className="truncate-2" style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem', lineHeight: 1.45 }}>{n.message}</p>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent)' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Urgent Banner ── */
function UrgentBanner() {
  const [urgent, setUrgent] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    api.get('/missions?urgent=true&status=active')
      .then(({ data }) => { if (data.length > 0) setUrgent(data[0]) })
      .catch(() => {})
  }, [])

  if (!urgent || dismissed) return null
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 flex-shrink-0"
      style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
      <span className="text-sm animate-pulse-slow flex-shrink-0">🚨</span>
      <p style={{ fontSize: '0.8125rem', color: '#fca5a5', flex: 1, minWidth: 0 }} className="truncate">
        <strong style={{ color: '#f87171', fontWeight: 700 }}>URGENT: </strong>
        {urgent.title}{urgent.urgencyReason && ` — ${urgent.urgencyReason}`}
      </p>
      <Link to="/missions" className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
        View
      </Link>
      <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-lg leading-none transition-opacity opacity-40 hover:opacity-80"
        style={{ color: '#f87171' }}>×</button>
    </div>
  )
}

/* ── Main Layout ── */
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const role = user?.role
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.guest
  const lvlColor = LEVEL_COLOR[user?.level] || '#8a9bc5'
  const xpPct = Math.min(100, ((user?.xp || 0) / 500) * 100)

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'am' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('impacthub_lang', next)
  }

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1ec677, #0d6640)', boxShadow: '0 0 16px rgba(30,198,119,0.2)' }}>
            <svg width="17" height="17" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-1)', fontSize: '0.9375rem', letterSpacing: '-0.02em', lineHeight: 1 }}>ImpactHub</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '1px' }}>v3.0</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" style={{ gap: '0.125rem' }}>
        {NAV.map(section => {
          const visible = section.items.filter(item => item.roles.includes(role))
          if (!visible.length) return null
          return (
            <div key={section.section} className="mb-5">
              <p className="px-3 mb-1.5" style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                {section.section}
              </p>
              {visible.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 mb-0.5 ${isActive ? 'active-nav' : 'inactive-nav'}`}
                  style={({ isActive }) => isActive ? {
                    background: 'rgba(61,214,138,0.08)',
                    color: '#3dd68a',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  } : {
                    color: 'var(--text-2)',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={e => { if (!e.currentTarget.classList.contains('active-nav')) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)' } }}
                  onMouseLeave={e => { if (!e.currentTarget.classList.contains('active-nav')) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)' } }}>
                  <Icon id={item.icon} size={15} />
                  <span>{t(`nav.${item.label.toLowerCase().replace(/\s/g,'_')}`, item.label)}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* XP bar */}
      {role !== 'guest' && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>Impact Score</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: lvlColor }}>{user?.level}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${lvlColor}aa, ${lvlColor})` }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.375rem' }}>
              <span style={{ color: lvlColor, fontWeight: 700 }}>{user?.impactScore || 0}</span> pts · {(user?.totalHours || 0).toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <NavLink to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-1"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div className="avatar avatar-md flex-shrink-0 font-bold"
            style={{ background: `linear-gradient(135deg, ${roleConf.color}40, ${roleConf.color}20)`, color: roleConf.color, border: `1px solid ${roleConf.border}` }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{user?.name}</p>
            <span className="badge" style={{ background: roleConf.bg, color: roleConf.color, border: `1px solid ${roleConf.border}`, fontSize: '0.6rem', padding: '1px 7px', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px', display: 'inline-flex' }}>
              {roleConf.label}
            </span>
          </div>
        </NavLink>

        <div className="flex gap-1.5 px-1 mt-1">
          <button onClick={toggleLang}
            className="flex-1 py-1.5 rounded-lg text-center transition-colors"
            style={{ fontSize: '0.7rem', color: 'var(--text-3)', background: 'var(--surface-3)', border: '1px solid var(--border)', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            {i18n.language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}
          </button>
          <button onClick={handleLogout}
            className="flex-1 py-1.5 rounded-lg text-center transition-colors"
            style={{ fontSize: '0.7rem', color: 'var(--text-3)', background: 'var(--surface-3)', border: '1px solid var(--border)', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-3)'; }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: 'var(--sidebar-w)', background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden transition-transform duration-300 ease-spring ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-w)', background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="flex lg:hidden items-center justify-between px-4 h-14 flex-shrink-0 frosted">
          <button onClick={() => setMobileOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-2)', background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>ImpactHub</span>
          <NotifBell />
        </header>

        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-end px-6 h-11 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
          <NotifBell />
        </div>

        {/* Urgent banner */}
        <UrgentBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
