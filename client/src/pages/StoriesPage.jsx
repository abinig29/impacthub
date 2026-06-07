import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../utils/socket'
import api from '../utils/api'

const REACTIONS = [{ key: 'heart', emoji: '❤️' }, { key: 'fire', emoji: '🔥' }, { key: 'clap', emoji: '👏' }, { key: 'star', emoji: '⭐' }]

function StoryCard({ story, user, onLike, onReact, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const isLiked = story.likes?.includes(user?._id)
  const isOwner = story.author?._id === user?._id || story.author === user?._id
  const isAdmin = ['admin', 'super_admin'].includes(user?.role)
  const timeAgo = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago` }

  const handleComment = async () => {
    if (!commentText.trim()) return
    await onComment(story._id, commentText)
    setCommentText('')
  }

  const lvlColor = { Hero: 'text-yellow-400', Leader: 'text-purple-400', Helper: 'text-blue-400', Beginner: 'text-slate-400' }[story.author?.level] || 'text-slate-400'

  return (
    <div className="card hover:border-dark-500 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center font-black text-white flex-shrink-0">
            {story.author?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white text-sm">{story.author?.name || 'Unknown'}</p>
              {story.author?.level && <span className={`text-xs font-bold ${lvlColor}`}>· {story.author.level}</span>}
              {story.isAchievement && <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">🏅 Achievement</span>}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">{timeAgo(story.createdAt)}</p>
              {story.missionTitle && <><span className="text-xs text-slate-600">·</span><span className="text-xs text-brand-400">🚀 {story.missionTitle}</span></>}
            </div>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <button onClick={() => onDelete(story._id)} className="text-slate-600 hover:text-red-400 transition-colors text-lg">×</button>
        )}
      </div>

      {/* Content */}
      <p className="text-slate-200 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{story.text}</p>

      {/* Image */}
      {story.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden bg-dark-700 max-h-72">
          <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tags */}
      {(story.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {story.tags.map((t, i) => <span key={i} className="text-xs text-brand-400 bg-brand-600/10 px-2 py-0.5 rounded-lg">#{t}</span>)}
        </div>
      )}

      {/* Reactions summary */}
      {Object.values(story.reactions || {}).some(v => v > 0) && (
        <div className="flex gap-2 mb-3">
          {REACTIONS.filter(r => (story.reactions?.[r.key] || 0) > 0).map(r => (
            <span key={r.key} className="text-xs text-slate-400">{r.emoji} {story.reactions[r.key]}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-3 border-t border-dark-700">
        <button onClick={() => onLike(story._id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all hover:bg-dark-700 ${isLiked ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'}`}>
          {isLiked ? '❤️' : '🤍'} <span>{story.likes?.length || 0}</span>
        </button>

        <div className="relative">
          <button onClick={() => setShowReactions(!showReactions)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-all">
            😊 React
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-dark-800 border border-dark-600 rounded-2xl p-2 shadow-xl z-10">
              {REACTIONS.map(r => (
                <button key={r.key} onClick={() => { onReact(story._id, r.key); setShowReactions(false) }}
                  className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-dark-700">{r.emoji}</button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-dark-700 transition-all">
          💬 <span>{story.comments?.length || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          {(story.comments || []).map((c, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">{c.userName?.[0]?.toUpperCase()}</div>
              <div className="flex-1 bg-dark-700 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-slate-300">{c.userName}</p>
                <p className="text-xs text-slate-400">{c.text}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input className="input flex-1 text-sm rounded-xl py-2" placeholder="Write a comment…" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
            <button onClick={handleComment} disabled={!commentText.trim()} className="btn-primary px-3 py-2 text-sm">Post</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StoriesPage() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [isAchievement, setIsAchievement] = useState(false)
  const [posting, setPosting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef(null)
  const socket = getSocket()
  const isGuest = user?.role === 'guest'

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/stories'); setStories(data) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!socket) return
    const onNew = (story) => setStories(prev => [story, ...prev])
    socket.on('new_story', onNew)
    return () => socket.off('new_story', onNew)
  }, [socket])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file || file.size > 3 * 1024 * 1024) { alert('Max 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const post = async () => {
    if (!text.trim()) return
    setPosting(true)
    try {
      const { data } = await api.post('/stories', { text, imageUrl, tags: tags.split(',').map(t => t.trim()).filter(Boolean), isAchievement })
      setStories(prev => [data, ...prev])
      setText(''); setImageUrl(''); setTags(''); setIsAchievement(false); setShowForm(false)
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    setPosting(false)
  }

  const handleLike = async (id) => {
    try {
      const { data } = await api.post(`/stories/${id}/like`)
      setStories(prev => prev.map(s => s._id === id ? { ...s, likes: data.liked ? [...(s.likes||[]), user._id] : (s.likes||[]).filter(l => l !== user._id) } : s))
    } catch {}
  }

  const handleReact = async (id, reaction) => {
    try {
      const { data } = await api.post(`/stories/${id}/react`, { reaction })
      setStories(prev => prev.map(s => s._id === id ? { ...s, reactions: data.reactions } : s))
    } catch {}
  }

  const handleComment = async (id, text) => {
    try {
      const { data } = await api.post(`/stories/${id}/comment`, { text })
      setStories(prev => prev.map(s => s._id === id ? { ...s, comments: data.comments } : s))
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this story?')) return
    try { await api.delete(`/stories/${id}`); setStories(prev => prev.filter(s => s._id !== id)) } catch {}
  }

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="section-title mb-1">🌟 Impact Stories</h1>
          <p className="text-slate-400 text-sm">Volunteer stories, achievements, and community moments</p>
        </div>
        {!isGuest && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Share Story</button>
        )}
      </div>

      {/* Post form */}
      {showForm && !isGuest && (
        <div className="card mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center font-black text-white">{user?.name?.[0]?.toUpperCase()}</div>
            <div><p className="font-semibold text-white">{user?.name}</p><p className="text-xs text-slate-500">Sharing with the community</p></div>
          </div>
          <textarea
            className="input resize-none mb-3 text-sm"
            placeholder="Share your impact story, achievement, or mission update…"
            rows={4} value={text} onChange={e => setText(e.target.value)} maxLength={1000}
          />
          {imageUrl && (
            <div className="relative mb-3 rounded-xl overflow-hidden max-h-48 bg-dark-700">
              <img src={imageUrl} alt="Preview" className="w-full object-cover max-h-48" />
              <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80">×</button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button onClick={() => fileRef.current?.click()} className="text-sm text-slate-400 hover:text-brand-300 flex items-center gap-1.5 transition-colors">📷 Add Photo</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <input className="input flex-1 text-sm py-1.5 min-w-0" placeholder="Tags (comma separated)…" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAchievement} onChange={e => setIsAchievement(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm text-slate-400">🏅 Mark as Achievement</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
              <button onClick={post} disabled={!text.trim() || posting} className="btn-primary text-sm py-2">{posting ? 'Posting…' : 'Share'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
      ) : stories.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-5xl mb-3">🌟</p>
          <p className="text-slate-400 mb-2">No stories yet</p>
          <p className="text-slate-500 text-sm">Be the first to share your impact story!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(story => (
            <StoryCard key={story._id} story={story} user={user} onLike={handleLike} onReact={handleReact} onComment={handleComment} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
