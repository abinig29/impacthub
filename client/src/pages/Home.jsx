import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/* ── Animated counter ── */
function Counter({ end, duration = 2000, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        const tick = (now) => {
          const p = Math.min((now - startTime) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(ease * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── Feature item ── */
function Feature({ icon, title, desc }) {
  return (
    <div className="group p-6 rounded-2xl transition-all duration-300 cursor-default"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(61,214,138,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
        style={{ background: 'rgba(61,214,138,0.08)', border: '1px solid rgba(61,214,138,0.12)' }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/analytics/public').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14" style={{ background: 'rgba(4,6,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1ec677,#0d6640)', boxShadow: '0 0 12px rgba(30,198,119,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>ImpactHub</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          {[['/#features','Features'],['/#impact','Impact'],['/donate','Donate']].map(([href, label]) => (
            <Link key={href} to={href} style={{ fontSize: '0.875rem', color: 'var(--text-3)', padding: '0.375rem 0.75rem', borderRadius: '8px', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>{label}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary btn-sm">Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary btn-sm">Sign in</Link>
              <Link to="/register" className="btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: '120px', paddingBottom: '100px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(61,214,138,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,77,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(61,214,138,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8"
            style={{ padding: '0.375rem 1rem', borderRadius: '999px', background: 'rgba(61,214,138,0.08)', border: '1px solid rgba(61,214,138,0.15)', fontSize: '0.8125rem', color: '#3dd68a', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3dd68a', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Intelligent Volunteer Management · v3
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', color: 'var(--text-1)', marginBottom: '1.5rem' }}>
            Volunteers who<br />
            <span style={{ background: 'linear-gradient(135deg,#3dd68a 0%,#1ec677 50%,#60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              change the world.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem,2vw,1.1875rem)', color: 'var(--text-2)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
            QR attendance, live missions, AI assistant, real-time collaboration, and fundraising — in one platform built for humanitarian work.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="btn-primary btn-lg"
              style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
              Start for free →
            </Link>
            <Link to="/impact" className="btn-secondary btn-lg"
              style={{ fontSize: '1rem' }}>
              See impact
            </Link>
          </div>

          {/* Social proof */}
          {stats && (
            <p style={{ marginTop: '2rem', fontSize: '0.8125rem', color: 'var(--text-3)' }}>
              Trusted by <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{stats.totalUsers?.toLocaleString()}</strong> volunteers · <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>{stats.peopleHelped?.toLocaleString()}</strong> people helped
            </p>
          )}
        </div>

        {/* Hero visual — abstract grid */}
        <div style={{ maxWidth: '960px', margin: '5rem auto 0', padding: '0 1.5rem' }}>
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', height: '320px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(61,214,138,0.03) 0%, transparent 50%, rgba(124,77,255,0.03) 100%)' }} />
            {/* Fake UI preview */}
            <div className="flex h-full">
              {/* Sidebar preview */}
              <div style={{ width: '160px', borderRight: '1px solid var(--border)', padding: '1rem 0.75rem', flexShrink: 0 }}>
                <div style={{ width: '80px', height: '6px', background: 'var(--surface-4)', borderRadius: '4px', marginBottom: '1.5rem' }} />
                {[80,65,55,70,50,60].map((w,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: 'var(--surface-5)', flexShrink: 0 }} />
                    <div style={{ width: `${w}%`, height: '6px', background: i === 1 ? 'rgba(61,214,138,0.3)' : 'var(--surface-4)', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
              {/* Content preview */}
              <div style={{ flex: 1, padding: '1.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                  {[['52h','Total Hours','#3dd68a'],['847','Impact Score','#9d74ff'],['12','Missions','#60a5fa'],['140','People','#fbbf24']].map(([v,l,c],i) => (
                    <div key={i} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.875rem', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>{l}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: c, letterSpacing: '-0.03em' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', height: '110px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly Activity</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px' }}>
                    {[35,55,40,70,90,60,45].map((h,i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 4 ? 'rgba(61,214,138,0.5)' : 'rgba(61,214,138,0.15)', transition: 'height 0.3s' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Gradient overlay bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, var(--page-bg), transparent)', pointerEvents: 'none' }} />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      {stats && (
        <section id="impact" style={{ padding: '5rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2rem' }} className="sm:grid-cols-4">
            {[
              [Math.round(parseFloat(stats.totalHours||0)), 'h', 'Hours volunteered'],
              [stats.totalUsers||0, '+', 'Active volunteers'],
              [stats.peopleHelped||0, '', 'People helped'],
              [Math.round(stats.totalDonations||0), '', 'USD raised'],
            ].map(([val, suf, label], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1 }}>
                  <Counter end={val} suffix={suf} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginTop: '0.5rem', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '6rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3dd68a', marginBottom: '1rem' }}>Platform</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,3vw,2.5rem)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Built for impact at scale
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-3)', marginTop: '0.75rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Every feature designed to maximize real-world volunteer coordination.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          <Feature icon="📱" title="QR Attendance" desc="Precise seconds-level time tracking. Admin scans volunteer QR codes — first scan checks in, second checks out." />
          <Feature icon="🚀" title="Live Missions" desc="Create, track, and coordinate missions with goal progress, volunteer rosters, urgency flags, and gallery uploads." />
          <Feature icon="🤖" title="AI Assistant" desc="Built-in chatbot recommends missions, shows stats, explains features, and guides volunteers 24/7." />
          <Feature icon="🌍" title="Impact Map" desc="Live Leaflet.js map showing all mission locations with animated markers and real-time volunteer activity." />
          <Feature icon="🏆" title="Gamification" desc="Impact scores, XP levels from Beginner to Hero, badges, daily streaks, and a live leaderboard." />
          <Feature icon="💬" title="Real-Time Chat" desc="Multi-channel chat with typing indicators, emoji reactions, and persistent history — Discord-inspired." />
          <Feature icon="📹" title="WebRTC Video" desc="Peer-to-peer video calls with host controls, mute/kick, raise hand, screen share, and meeting links." />
          <Feature icon="📜" title="Certificates" desc="Auto-generate verified PDF certificates with hours, missions, level, and a unique verification ID." />
          <Feature icon="💰" title="Fundraising" desc="Mission-based donation goals with progress bars, donor walls, and full transparency analytics." />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '0 1.5rem 6rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#071f13 0%,#0a2e1c 40%,#0d3d26 100%)', border: '1px solid rgba(61,214,138,0.12)', padding: '4rem 3rem', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse,rgba(61,214,138,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,3vw,2.5rem)', fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem' }}>
              Start making impact today
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(240,244,255,0.6)', marginBottom: '2rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Join {stats?.totalUsers?.toLocaleString() || 'thousands of'} volunteers changing lives every day.
            </p>
            <Link to="/register" className="btn-primary btn-xl inline-flex"
              style={{ background: '#f0f4ff', color: '#04060f', boxShadow: '0 8px 32px rgba(240,244,255,0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Create free account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1ec677,#0d6640)' }}>
            <svg width="12" height="12" viewBox="0 0 28 28" fill="none"><path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-2)' }}>ImpactHub</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>© {new Date().getFullYear()} ImpactHub. Built for humanitarian volunteer organizations.</p>
        <div className="flex gap-4">
          {[['/impact','Impact'],['/donate','Donate'],['/login','Sign In']].map(([to,l]) => (
            <Link key={to} to={to} style={{ fontSize: '0.8125rem', color: 'var(--text-3)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
