import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const LEVEL_COLOR = { Hero:'#fbbf24', Leader:'#9d74ff', Helper:'#60a5fa', Beginner:'#8a9bc5' }
const LEVEL_EMOJI = { Hero:'🏆', Leader:'⭐', Helper:'💙', Beginner:'🌱' }
const ROLE_COLOR = { super_admin:'#fbbf24', admin:'#9d74ff', volunteer:'#3dd68a', guest:'#8a9bc5' }

const Sk = () => (
  <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'16px', padding:'1.5rem' }}>
    <div className="skeleton" style={{ width:'48px', height:'48px', borderRadius:'12px', marginBottom:'1rem' }} />
    <div className="skeleton" style={{ width:'60%', height:'0.875rem', borderRadius:'4px', marginBottom:'0.5rem' }} />
    <div className="skeleton" style={{ width:'40%', height:'0.75rem', borderRadius:'4px' }} />
  </div>
)

export default function Community() {
  const { user } = useAuth()
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/users/community').then(({data}) => setVolunteers(data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const filtered = volunteers.filter(v => {
    const matchSearch = !search || v.name?.toLowerCase().includes(search.toLowerCase()) || (v.skills||[]).some(s=>s.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter==='all' || v.level===filter
    return matchSearch && matchFilter
  })

  return (
    <div className="page" style={{ maxWidth:'1100px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 className="page-title">Community</h1>
          <p className="page-subtitle">{volunteers.length} volunteers making a difference</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <select style={{ padding:'0.5rem 0.875rem', borderRadius:'10px', background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-2)', fontSize:'0.875rem', outline:'none', cursor:'pointer' }}
            value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="Hero">🏆 Hero</option>
            <option value="Leader">⭐ Leader</option>
            <option value="Helper">💙 Helper</option>
            <option value="Beginner">🌱 Beginner</option>
          </select>
          <input className="input" style={{ width:'220px' }} placeholder="Search name, skill…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
          {[1,2,3,4,5,6].map(i=><Sk key={i}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'5rem 0', color:'var(--text-3)' }}>
          <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>👥</p>
          <p style={{ fontSize:'0.9375rem' }}>No members found</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
          {filtered.map(v => {
            const isMe = v._id===user?._id
            const lc = LEVEL_COLOR[v.level]||'#8a9bc5'
            const rc = ROLE_COLOR[v.role]||'#8a9bc5'
            return (
              <div key={v._id} style={{ background:'var(--surface-2)', border:`1px solid ${isMe?'rgba(61,214,138,0.25)':'var(--border)'}`, borderRadius:'16px', padding:'1.5rem', transition:'all 0.2s', cursor:'default' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=`${lc}22`;e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isMe?'rgba(61,214,138,0.25)':'var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'1rem' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:`${lc}15`, border:`1px solid ${lc}25`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:900, color:lc, flexShrink:0 }}>
                    {v.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', flexWrap:'wrap' }}>
                      <p style={{ fontSize:'0.9375rem', fontWeight:700, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{v.name}</p>
                      {isMe && <span style={{ fontSize:'0.65rem', color:'var(--text-3)' }}>(you)</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.25rem' }}>
                      <span style={{ fontSize:'0.65rem', padding:'0.15rem 0.5rem', borderRadius:'999px', background:`${rc}12`, border:`1px solid ${rc}25`, color:rc, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em' }}>{v.role?.replace('_',' ')}</span>
                      <span style={{ fontSize:'0.8125rem' }}>{LEVEL_EMOJI[v.level]||'🌱'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem', marginBottom:'0.875rem' }}>
                  {[[(v.totalHours||0).toFixed(0)+'h','Hours',lc],[v.impactScore||0,'Score','#9d74ff'],[v.peopleHelped||0,'Helped','#60a5fa']].map(([val,lbl,clr])=>(
                    <div key={lbl} style={{ background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'0.5rem', textAlign:'center' }}>
                      <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:800, color:clr, letterSpacing:'-0.02em', lineHeight:1 }}>{val}</p>
                      <p style={{ fontSize:'0.65rem', color:'var(--text-3)', marginTop:'0.25rem', fontWeight:500 }}>{lbl}</p>
                    </div>
                  ))}
                </div>

                {v.bio && <p style={{ fontSize:'0.8125rem', color:'var(--text-3)', lineHeight:1.5, marginBottom:'0.75rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{v.bio}</p>}
                {(v.skills||[]).length>0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                    {v.skills.slice(0,3).map((s,i)=>(
                      <span key={i} style={{ padding:'0.175rem 0.5rem', borderRadius:'6px', background:'var(--surface-4)', border:'1px solid var(--border)', fontSize:'0.75rem', color:'var(--text-2)', fontWeight:500 }}>{s}</span>
                    ))}
                    {v.skills.length>3 && <span style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>+{v.skills.length-3}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
