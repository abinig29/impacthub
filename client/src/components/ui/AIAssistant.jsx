import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

const FAQ_RESPONSES = {
  'how do i check in': 'To check in: An admin will scan your personal QR code (found in your Profile page) at the session. First scan = check-in, second scan = check-out. Your time is tracked automatically! ⏱',
  'how does qr work': 'QR attendance works in 2 steps: 1️⃣ Admin creates a session and shows it as active. 2️⃣ Admin scans your personal QR code → first scan starts your timer, second scan stops it and saves your hours.',
  'what is impact score': 'Your Impact Score = Hours×10 + Projects×15 + Chat Messages×2 + Streak Days×5. It determines your level (Beginner → Helper → Leader → Hero) and your rank on the leaderboard! 🏆',
  'how do i get badges': 'Badges are awarded automatically: 🔥 10 Hours, ⭐ 50 Hours, 💎 100 Hours, 💙 Communicator (50 chats), 🌍 Impact Maker (5 projects), 🔄 Week Streak (7 days), 🏆 Month Streak (30 days).',
  'what are missions': 'Missions are volunteer projects you can join! Examples: Food Distribution, School Support, Community Cleanup. Go to the Missions page to browse active missions and join ones that match your skills.',
  'how do i join a mission': 'Go to the Missions page → click any mission card → click "Join Mission". You\'ll be added to the volunteer list. The mission leader will coordinate with you!',
  'how does video call work': 'Go to Video Call page → enter a room name → click Join. Share the room name with others. The first person is the host and can mute or remove participants.',
  'what is guest role': 'Guests have read-only access. They can view missions, community, impact page, and join video calls, but cannot post stories, join missions, or be checked in/out via QR.',
  'how to get certificate': 'Go to your Profile → Certificates tab → click "Generate Certificate". A verified PDF certificate with your hours, missions, and impact level will be created!',
  'help': 'I can help you with: 📋 Missions & joining, ⏱ QR attendance, 🏆 Badges & levels, 📹 Video calls, 📜 Certificates, 📊 Your stats. Just ask me anything!',
}

function getResponse(input, user, missions, analytics) {
  const q = input.toLowerCase()

  // Stats queries
  if (q.includes('my hours') || q.includes('volunteer hours') || q.includes('my stats')) {
    const hrs = user?.totalHours?.toFixed(1) || '0'
    const mins = Math.round((user?.totalMinutes || 0) % 60)
    return `📊 Your Stats:\n• Total Time: ${hrs}h ${mins}m\n• Impact Score: ${user?.impactScore || 0} pts\n• Level: ${user?.level || 'Beginner'}\n• Streak: 🔥 ${user?.currentStreak || 0} days\n• People Helped: 🤝 ${user?.peopleHelped || 0}\n• Badges: ${(user?.badges || []).length > 0 ? user.badges.join(', ') : 'None yet — keep going!'}`
  }

  if (q.includes('mission') && (q.includes('active') || q.includes('available') || q.includes('recommend') || q.includes('join'))) {
    if (!missions || missions.length === 0) return '🔍 No active missions found right now. Check back soon or ask an admin to create one!'
    const active = missions.filter(m => m.status === 'active').slice(0, 3)
    if (active.length === 0) return '🔍 No active missions right now. Check back soon!'
    return `🚀 Active Missions for you:\n${active.map((m, i) => `${i+1}. ${m.isUrgent ? '🚨 ' : ''}${m.title}\n   📍 ${m.location || 'TBD'} · ${m.category}\n   👥 ${m.volunteers?.length || 0} volunteers`).join('\n\n')}\n\nGo to the Missions page to join!`
  }

  if (q.includes('urgent') || q.includes('emergency')) {
    const urgent = missions?.filter(m => m.isUrgent && m.status === 'active')
    if (!urgent?.length) return '✅ No urgent missions right now. The platform is running normally.'
    return `🚨 URGENT missions needing help:\n${urgent.map(m => `• ${m.title} — ${m.location}`).join('\n')}\n\nPlease go to Missions to volunteer immediately!`
  }

  if (q.includes('leaderboard') || q.includes('rank') || q.includes('top volunteer')) {
    return `🏆 Leaderboard Info:\nYour current rank is based on Impact Score. To climb:\n• Log more volunteer hours (10 pts/hour)\n• Join more missions (+15 pts each)\n• Chat with your team (+2 pts/message)\n• Maintain daily streaks (+5 pts/day)\n\nVisit the Leaderboard page to see your rank!`
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hey ${user?.name?.split(' ')[0] || 'Volunteer'}! 👋 I'm your ImpactHub AI Assistant. I can help you with missions, stats, badges, certificates, and more. What would you like to know?`
  }

  if (q.includes('level') || q.includes('how to level')) {
    const lvl = user?.level || 'Beginner'
    const next = { Beginner: 'Helper (50 pts)', Helper: 'Leader (200 pts)', Leader: 'Hero (500 pts)', Hero: 'Max level reached!' }[lvl]
    return `🎮 Your Level: ${lvl}\nNext: ${next}\nCurrent XP: ${user?.xp || 0}\n\nTo earn XP faster: volunteer more hours, join missions, stay consistent, and engage in chat!`
  }

  if (q.includes('platform') || q.includes('what can i do') || q.includes('features')) {
    return '🌟 ImpactHub Features:\n📱 QR attendance tracking\n🚀 Mission management\n💬 Real-time team chat\n📹 Video calls with host controls\n🌍 Impact map\n🏆 Gamification & leaderboard\n📜 Certificates\n📊 Analytics dashboard\n💰 Fundraising\n📅 Smart calendar\n\nWhat would you like to explore?'
  }

  // Check FAQ
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (q.includes(key)) return response
  }

  // Default
  return `🤔 I'm not sure about that specific question. Here's what I can help with:\n\n• "Show my stats" — your volunteer hours\n• "Active missions" — available missions\n• "How do I get badges?" — badge guide\n• "What is impact score?" — scoring system\n• "How does QR work?" — attendance guide\n\nOr try asking differently!`
}

export default function AIAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your ImpactHub AI Assistant. Ask me about missions, your stats, badges, how things work, or anything else!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [missions, setMissions] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/missions').then(r => setMissions(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const response = getResponse(text, user, missions, null)
    setMessages(prev => [...prev, { role: 'assistant', text: response }])
    setLoading(false)
  }

  const SUGGESTIONS = ['Show my stats', 'Active missions', 'How do I get badges?', 'Urgent missions']

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-900/50 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 glow-brand"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0110 10c0 5.52-4.48 10-10 10a10 10 0 01-10-10 10 10 0 0110-10z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
        )}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-400 border-2 border-dark-950 animate-pulse" />
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[1000] w-80 sm:w-96 glass-card shadow-2xl flex flex-col animate-slide-up" style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-dark-700/60 bg-dark-900/80 rounded-t-2xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-lg glow-brand">🤖</div>
            <div>
              <p className="font-bold text-white text-sm">ImpactHub AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs text-slate-400">Online · Always available</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-dark-700 text-slate-200 rounded-bl-sm border border-dark-600'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                <div className="bg-dark-700 border border-dark-600 rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-xs px-2.5 py-1 rounded-lg bg-dark-700 border border-dark-600 text-slate-300 hover:border-brand-600/50 hover:text-brand-300 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-dark-700/60">
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm rounded-xl py-2"
                placeholder="Ask anything…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
              />
              <button onClick={() => send(input)} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 flex items-center justify-center text-white transition-all flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
