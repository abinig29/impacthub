import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../utils/socket'
import api from '../utils/api'

const CHANNELS = [
  { id: 'general',       label: 'general',       desc: 'Team-wide conversation' },
  { id: 'announcements', label: 'announcements', desc: 'Important updates' },
  { id: 'projects',      label: 'projects',      desc: 'Mission coordination' },
  { id: 'random',        label: 'random',         desc: 'Off-topic chat' },
]

const EMOJI = ['👍','❤️','🔥','🎉','😊','🙏','💪','⭐','✅','🌍','💙','🤝','😂','🏆','🚀','💯']

const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return new Date(d).toLocaleDateString()
}

const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/* ── Role color ── */
const roleColor = { super_admin: '#fbbf24', admin: '#9d74ff', volunteer: '#3dd68a', guest: '#8a9bc5' }

export default function ChatPage() {
  const { user } = useAuth()
  const [channel, setChannel] = useState('general')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState([])
  const [online, setOnline] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState({})
  const [showEmoji, setShowEmoji] = useState(false)
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimer = useRef(null)
  const socket = getSocket()

  /* Load history */
  useEffect(() => {
    setLoading(true)
    setMessages([])
    api.get(`/messages/${channel}`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channel])

  /* Socket events */
  useEffect(() => {
    if (!socket) return
    socket.emit('join_room', channel)

    const onMsg = (msg) => {
      if (msg.roomId === channel || msg.senderId?.roomId === channel) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg])
      } else {
        setUnread(p => ({ ...p, [msg.roomId]: (p[msg.roomId] || 0) + 1 }))
      }
    }
    const onTyping = ({ name, roomId }) => {
      if (roomId === channel && name !== user?.name) {
        setTyping(prev => prev.includes(name) ? prev : [...prev, name])
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTyping([]), 2500)
      }
    }
    const onStopTyping = ({ name }) => setTyping(prev => prev.filter(n => n !== name))
    const onOnline = (users) => setOnline(users)
    const onJoined = ({ name }) => { /* silent */ }

    socket.on('receive_message', onMsg)
    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)
    socket.on('online_users', onOnline)
    socket.on('user_joined', onJoined)

    return () => {
      socket.emit('leave_room', channel)
      socket.off('receive_message', onMsg)
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
      socket.off('online_users', onOnline)
      socket.off('user_joined', onJoined)
    }
  }, [channel, socket, user?.name])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback((e) => {
    e?.preventDefault()
    if (!text.trim() || !socket) return
    socket.emit('send_message', { roomId: channel, text: text.trim() })
    setText('')
    socket.emit('stop_typing', { roomId: channel })
    setShowEmoji(false)
  }, [text, channel, socket])

  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket) return
    socket.emit('typing', { roomId: channel })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('stop_typing', { roomId: channel }), 1500)
  }

  const switchChannel = (id) => {
    if (id === channel) return
    socket?.emit('leave_room', channel)
    setChannel(id)
    setTyping([])
    setUnread(p => ({ ...p, [id]: 0 }))
  }

  const addEmoji = (em) => {
    setText(p => p + em)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  /* Group messages by author + time */
  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1]
    const same = prev && prev.senderId?._id === msg.senderId?._id &&
      (new Date(msg.timestamp) - new Date(prev.timestamp)) < 5 * 60 * 1000
    return { ...msg, isGrouped: same }
  })

  const isGuest = user?.role === 'guest'

  return (
    <div className="flex" style={{ height: 'calc(100vh - 45px)', background: 'var(--page-bg)' }}>

      {/* ── Channel sidebar ── */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: '220px', background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Messages</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{online.length} online</p>
        </div>

        {/* Channels */}
        <div className="px-2 py-3 flex-1 overflow-y-auto">
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', padding: '0 0.5rem', marginBottom: '0.375rem' }}>Channels</p>
          {CHANNELS.map(ch => {
            const isActive = channel === ch.id
            const count = unread[ch.id]
            return (
              <button key={ch.id} onClick={() => switchChannel(ch.id)}
                className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg mb-0.5 transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(61,214,138,0.08)' : 'transparent',
                  color: isActive ? '#3dd68a' : 'var(--text-2)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  border: 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-1)' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' } }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: isActive ? '#3dd68a' : 'var(--text-3)', fontSize: '0.875rem' }}>#</span>
                  {ch.label}
                </span>
                {count > 0 && (
                  <span style={{ minWidth: '18px', height: '18px', borderRadius: '999px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Online users */}
          <div className="mt-4">
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
              Online — {online.length}
            </p>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {online.map(u => (
                <div key={u.socketId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{ marginBottom: '0.125rem' }}>
                  <div className="relative flex-shrink-0">
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${roleColor[u.role] || '#8a9bc5'}22`, color: roleColor[u.role] || '#8a9bc5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, border: `1px solid ${roleColor[u.role] || '#8a9bc5'}33` }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="dot-online absolute -bottom-0.5 -right-0.5" style={{ width: '7px', height: '7px' }} />
                  </div>
                  <span className="truncate" style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)', minHeight: '52px' }}>
          <span style={{ color: 'var(--text-3)', fontSize: '1.125rem', fontWeight: 700 }}>#</span>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{channel}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{CHANNELS.find(c => c.id === channel)?.desc}</p>
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{messages.length} messages</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4"
          style={{ background: 'radial-gradient(ellipse at top, rgba(10,20,36,0.5) 0%, var(--page-bg) 60%)' }}>
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-start gap-3">
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '4px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: `${60 + i * 10}%`, height: '14px', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-3)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>💬</div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem' }}>No messages yet</p>
              <p style={{ fontSize: '0.875rem' }}>Be the first to say something in #{channel}</p>
            </div>
          ) : (
            <div>
              {grouped.map((msg, i) => {
                const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id
                const senderName = msg.senderId?.name || 'Unknown'
                const senderRole = msg.senderId?.role || 'volunteer'
                const color = roleColor[senderRole] || '#8a9bc5'

                return (
                  <div key={msg._id}
                    className={`group flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2.5 ${msg.isGrouped ? 'mt-0.5' : 'mt-5'}`}
                    onMouseEnter={() => setHoveredMsg(msg._id)}
                    onMouseLeave={() => setHoveredMsg(null)}>
                    {/* Avatar */}
                    {!msg.isGrouped ? (
                      <div className="flex-shrink-0" style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, border: `1px solid ${color}28`, alignSelf: 'flex-start', marginTop: '2px' }}>
                        {senderName[0]?.toUpperCase()}
                      </div>
                    ) : (
                      <div className="flex-shrink-0" style={{ width: '36px' }} />
                    )}

                    {/* Message content */}
                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!msg.isGrouped && (
                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color, letterSpacing: '-0.01em' }}>{isMe ? 'You' : senderName}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <div className={isMe ? 'msg-bubble msg-mine' : 'msg-bubble msg-theirs'}>
                        {msg.text}
                      </div>
                    </div>

                    {/* Timestamp on hover (grouped) */}
                    {msg.isGrouped && hoveredMsg === msg._id && (
                      <div style={{ alignSelf: 'center', fontSize: '0.6875rem', color: 'var(--text-3)' }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Typing indicator */}
        <div style={{ height: '24px', paddingLeft: '1.25rem', display: 'flex', alignItems: 'center' }}>
          {typing.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full animate-bounce-soft" style={{ background: 'var(--text-3)', animationDelay: `${i*0.15}s` }} />)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing…
              </span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-5 pb-5 flex-shrink-0">
          {showEmoji && (
            <div className="rounded-xl mb-2 p-3 flex flex-wrap gap-1.5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              {EMOJI.map(em => (
                <button key={em} onClick={() => addEmoji(em)}
                  className="text-xl hover:scale-125 transition-transform rounded-lg p-1"
                  style={{ background: 'transparent', border: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {em}
                </button>
              ))}
            </div>
          )}

          {isGuest ? (
            <div className="flex items-center justify-center py-3 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>Guests can read but not send messages.</p>
            </div>
          ) : (
            <div className="flex items-end gap-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0.75rem 0.875rem', boxShadow: 'var(--shadow-sm)' }}
              onFocus={() => document.querySelector('.chat-input-wrap')?.setAttribute('style', 'border-color: rgba(61,214,138,0.3)')}>
              <button onClick={() => setShowEmoji(o => !o)}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all"
                style={{ background: showEmoji ? 'var(--surface-4)' : 'transparent', border: 'none', color: 'var(--text-3)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-4)'; e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = showEmoji ? 'var(--surface-4)' : 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}>
                😊
              </button>
              <textarea ref={inputRef}
                rows={1}
                className="flex-1 resize-none bg-transparent outline-none"
                placeholder={`Message #${channel}…`}
                value={text}
                onChange={handleTyping}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                maxLength={1000}
                style={{ fontSize: '0.9375rem', color: 'var(--text-1)', lineHeight: 1.5, maxHeight: '120px', fontFamily: 'var(--font-sans)', border: 'none', background: 'transparent' }} />
              <button onClick={send} disabled={!text.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: text.trim() ? 'linear-gradient(135deg,#1ec677,#0d6640)' : 'var(--surface-4)', border: 'none', opacity: text.trim() ? 1 : 0.4, boxShadow: text.trim() ? '0 2px 8px rgba(30,198,119,0.3)' : 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
