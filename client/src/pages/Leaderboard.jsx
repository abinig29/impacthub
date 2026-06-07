import React, { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const LEVEL_CONFIG = {
  Hero:      { emoji: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  Leader:    { emoji: '⭐', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  Helper:    { emoji: '💙', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20'   },
  Beginner:  { emoji: '🌱', color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/20' },
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard() {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(({ data }) => {
        setLeaders(data)
        const me = data.find(u => u._id === user?._id)
        if (me) setMyRank(me)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-container flex items-center justify-center min-h-96">
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
    </div>
  )

  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title mb-1">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm">Top volunteers ranked by impact score</p>
      </div>

      {/* My rank banner */}
      {myRank && (
        <div className="mb-8 p-5 rounded-2xl bg-brand-600/10 border border-brand-600/30 flex items-center justify-between flex-wrap gap-4 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-xl font-black text-brand-300">
              #{myRank.rank}
            </div>
            <div>
              <p className="font-bold text-white">Your Position</p>
              <p className="text-sm text-slate-400">Top <span className="text-brand-300 font-semibold">{100 - myRank.percentile + 1}%</span> of all volunteers</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-brand-400">{myRank.impactScore}</p>
            <p className="text-xs text-slate-500">impact points</p>
          </div>
        </div>
      )}

      {/* Podium — top 3 */}
      {top3.length >= 1 && (
        <div className="flex items-end justify-center gap-4 mb-10 px-4">
          {/* 2nd */}
          {top3[1] && (
            <div className="flex flex-col items-center flex-1 max-w-36">
              <div className="w-16 h-16 rounded-2xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center text-2xl font-black text-slate-300 mb-2">
                {top3[1].name?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-slate-300 truncate w-full text-center">{top3[1].name}</p>
              <p className="text-xs text-slate-500">{top3[1].impactScore} pts</p>
              <div className="w-full mt-3 h-20 bg-slate-500/20 border border-slate-500/20 rounded-t-xl flex items-center justify-center text-3xl">🥈</div>
            </div>
          )}
          {/* 1st */}
          <div className="flex flex-col items-center flex-1 max-w-40">
            <div className="w-20 h-20 rounded-2xl bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center text-3xl font-black text-yellow-300 mb-2 shadow-lg shadow-yellow-900/20">
              {top3[0].name?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate w-full text-center">{top3[0].name}</p>
            <p className="text-xs text-yellow-400 font-semibold">{top3[0].impactScore} pts</p>
            <div className="w-full mt-3 h-28 bg-yellow-400/10 border border-yellow-400/20 rounded-t-xl flex items-center justify-center text-4xl">🥇</div>
          </div>
          {/* 3rd */}
          {top3[2] && (
            <div className="flex flex-col items-center flex-1 max-w-36">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xl font-black text-orange-300 mb-2">
                {top3[2].name?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-slate-300 truncate w-full text-center">{top3[2].name}</p>
              <p className="text-xs text-slate-500">{top3[2].impactScore} pts</p>
              <div className="w-full mt-3 h-14 bg-orange-500/10 border border-orange-500/20 rounded-t-xl flex items-center justify-center text-3xl">🥉</div>
            </div>
          )}
        </div>
      )}

      {/* Full table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-dark-600">
          <h2 className="font-semibold text-white">All Rankings</h2>
        </div>
        <div className="divide-y divide-dark-700">
          {leaders.map((v, i) => {
            const lvl = LEVEL_CONFIG[v.level] || LEVEL_CONFIG.Beginner
            const isMe = v._id === user?._id
            return (
              <div key={v._id} className={`flex items-center gap-4 px-6 py-4 hover:bg-dark-700/30 transition-all ${isMe ? 'bg-brand-600/5 border-l-2 border-brand-500' : ''}`}>
                {/* Rank */}
                <div className="w-10 flex-shrink-0 text-center">
                  {RANK_MEDALS[i + 1] ? (
                    <span className="text-2xl">{RANK_MEDALS[i + 1]}</span>
                  ) : (
                    <span className="text-sm font-bold text-slate-500">#{i + 1}</span>
                  )}
                </div>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${isMe ? 'bg-brand-600' : 'bg-dark-600'}`}>
                  {v.name?.[0]?.toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm">{v.name} {isMe && <span className="text-xs text-brand-400">(you)</span>}</p>
                    <span className={`badge border text-xs ${lvl.bg} ${lvl.color}`}>{lvl.emoji} {v.level}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{(v.totalHours || 0).toFixed(1)}h</span>
                    <span className="text-xs text-slate-500">🤝 {v.peopleHelped || 0} helped</span>
                    <span className="text-xs text-slate-500">🔥 {v.currentStreak || 0} streak</span>
                  </div>
                  {/* Badges */}
                  {(v.badges || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.badges.slice(0, 3).map((b, bi) => (
                        <span key={bi} className="text-xs px-1.5 py-0.5 rounded bg-dark-700 border border-dark-600 text-slate-400">{b}</span>
                      ))}
                      {v.badges.length > 3 && <span className="text-xs text-slate-600">+{v.badges.length - 3}</span>}
                    </div>
                  )}
                </div>
                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-brand-400">{v.impactScore}</p>
                  <p className="text-xs text-slate-500">pts</p>
                  <p className="text-xs text-slate-600 mt-0.5">Top {100 - v.percentile + 1}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
