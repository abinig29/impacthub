import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

const CounterCard = ({ value, label, icon, suffix = '' }) => (
  <div className="card text-center group hover:border-brand-600/40 transition-all">
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-4xl font-black text-white mb-1">{value}{suffix}</p>
    <p className="text-sm text-slate-400">{label}</p>
  </div>
)

const ActivityFeed = ({ items }) => (
  <div className="space-y-3">
    {items.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>}
    {items.map((item, i) => (
      <div key={i} className="flex items-start gap-3 py-2.5 border-b border-dark-700 last:border-0 animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-sm flex-shrink-0">
          {{ checkin: '🟢', checkout: '🏁', chat: '💬', video: '📹', badge: '🏅', donation: '💰', system: '⚙️' }[item.type] || '📌'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300">{item.action}</p>
          {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
        </div>
        <span className="text-xs text-slate-600 flex-shrink-0">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    ))}
  </div>
)

export default function ImpactPage() {
  const [stats, setStats] = useState(null)
  const [posts, setPosts] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/public'),
      api.get('/blog?type=blog'),
      api.get('/blog?type=event'),
    ]).then(([statsRes, postsRes, eventsRes]) => {
      setStats(statsRes.data)
      setPosts(postsRes.data.slice(0, 4))
      setEvents(eventsRes.data.slice(0, 3))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-96">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-dark-700">
        <div className="absolute inset-0 impact-gradient opacity-20" />
        <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2316b36e' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative page-container py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 text-brand-300 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Live impact data
          </div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Our Collective<br /><span className="text-brand-400">Impact</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">Every hour volunteered, every session attended, every connection made — it all adds up to real change.</p>
          <Link to="/register" className="btn-primary px-8 py-3 text-base inline-flex">Join the movement →</Link>
        </div>
      </div>

      <div className="page-container">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 -mt-8">
            <CounterCard value={stats.totalHours} label="Hours Volunteered" icon="⏱" suffix="h" />
            <CounterCard value={stats.totalUsers} label="Active Volunteers" icon="👥" />
            <CounterCard value={stats.peopleHelped} label="People Helped" icon="🤝" />
            <CounterCard value={`$${(stats.totalDonations || 0).toLocaleString()}`} label="Total Raised" icon="💰" />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <h2 className="font-bold text-white">Live Activity</h2>
              </div>
              <ActivityFeed items={stats?.activity || []} />
            </div>
          </div>

          {/* Blog Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-xl">Latest Stories</h2>
            </div>
            {posts.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-slate-400">No posts yet. Admins can publish stories from the admin panel.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {posts.map(post => (
                  <div key={post._id} className="card-hover">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge badge-volunteer">{post.type}</span>
                      <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-3">{post.excerpt}</p>
                    <div className="mt-3 pt-3 border-t border-dark-600 flex items-center justify-between">
                      <span className="text-xs text-slate-500">by {post.author?.name}</span>
                      <span className="text-xs text-slate-600">👁 {post.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events */}
        {events.length > 0 && (
          <div className="mb-12">
            <h2 className="font-bold text-white text-xl mb-5">Upcoming Events</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {events.map(ev => (
                <div key={ev._id} className="card-hover">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📅</span>
                    {ev.eventDate && <span className="text-xs text-brand-400 font-semibold">{new Date(ev.eventDate).toLocaleDateString()}</span>}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{ev.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{ev.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl impact-gradient p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative">
            <h2 className="text-3xl font-black text-white mb-3">Ready to make an impact?</h2>
            <p className="text-white/70 mb-6">Join thousands of volunteers changing lives every day.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register" className="px-8 py-3 rounded-xl bg-white text-dark-950 font-bold hover:bg-slate-100 transition-all">Get Started Free</Link>
              <Link to="/donate" className="px-8 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-bold hover:bg-white/30 transition-all">Support Us 💙</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
