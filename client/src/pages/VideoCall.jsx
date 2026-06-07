import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSocket } from '../utils/socket'

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }

function playTone(freq, dur = 0.3, vol = 0.12) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq; osc.type = 'sine'
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}

/* ── Control button ── */
function CtrlBtn({ onClick, title, active = true, danger = false, children, badge }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
      <button onClick={onClick} title={title}
        style={{
          width: '52px', height: '52px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
          background: danger ? '#ef4444' : active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.18)',
          color: danger ? '#fff' : active ? 'rgba(255,255,255,0.85)' : '#f87171',
          backdropFilter: 'blur(12px)',
          boxShadow: danger ? '0 4px 20px rgba(239,68,68,0.4)' : active ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(239,68,68,0.15)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
          e.currentTarget.style.background = danger ? '#dc2626' : active ? 'rgba(255,255,255,0.14)' : 'rgba(239,68,68,0.28)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.background = danger ? '#ef4444' : active ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.18)'
        }}>
        {children}
        {badge && (
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: '#ef4444', border: '2px solid rgba(8,12,26,0.8)', fontSize: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{badge}</div>
        )}
      </button>
      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{title}</span>
    </div>
  )
}

/* ── Video tile ── */
function VideoTile({ stream, name, isMe, isMuted, isHost, handRaised, isSharing, muted: forceMuted, isSpeaking }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream }, [stream])
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div style={{
      position: 'relative', borderRadius: '16px', overflow: 'hidden',
      background: 'rgba(12,18,32,0.9)', aspectRatio: '16/9',
      border: isSpeaking ? '2px solid #3dd68a' : '2px solid rgba(255,255,255,0.06)',
      boxShadow: isSpeaking ? '0 0 0 3px rgba(61,214,138,0.15)' : '0 4px 24px rgba(0,0,0,0.5)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      {/* Video */}
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={isMe}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, rgba(${isMe ? '61,214,138' : '124,77,255'},0.08), rgba(8,12,26,0.9))` }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: isMe ? 'rgba(61,214,138,0.15)' : 'rgba(124,77,255,0.12)', border: `2px solid ${isMe ? 'rgba(61,214,138,0.3)' : 'rgba(124,77,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: isMe ? '#3dd68a' : '#9d74ff' }}>
            {initials}
          </div>
        </div>
      )}

      {/* Speaking ring */}
      {isSpeaking && (
        <div style={{ position: 'absolute', inset: '0', borderRadius: '14px', border: '2px solid #3dd68a', opacity: 0.6, animation: 'speakPulse 1s ease-in-out infinite', pointerEvents: 'none' }} />
      )}

      {/* Bottom labels */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
            {isMe ? 'You' : name}
          </span>
          {isHost && <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(251,191,36,0.25)', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {handRaised && <span style={{ fontSize: '0.875rem' }}>✋</span>}
          {(isMuted || forceMuted) && (
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239,68,68,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
          )}
          {isSharing && (
            <div style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(59,130,246,0.8)', fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>SHARING</div>
          )}
        </div>
      </div>

      {/* Me indicator */}
      {isMe && (
        <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', width: '6px', height: '6px', borderRadius: '50%', background: '#3dd68a', boxShadow: '0 0 8px rgba(61,214,138,0.6)' }} />
      )}
    </div>
  )
}

/* ── Join screen ── */
function JoinScreen({ urlRoom, onJoin, error }) {
  const [roomId, setRoomId] = useState(urlRoom || '')
  const [previewing, setPreviewing] = useState(false)
  const [stream, setStream] = useState(null)
  const previewRef = useRef(null)

  const startPreview = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(s); setPreviewing(true)
      if (previewRef.current) previewRef.current.srcObject = s
    } catch {}
  }

  const stopPreview = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setPreviewing(false) }
  useEffect(() => () => stopPreview(), [])

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--page-bg)' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(61,214,138,0.15),rgba(61,214,138,0.05))', border: '1px solid rgba(61,214,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>📹</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Join Meeting</h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-3)', lineHeight: 1.6 }}>Enter a room name or paste a meeting link to start or join a video call.</p>
        </div>

        {/* Camera preview */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: '1.5rem', aspectRatio: '16/9', position: 'relative' }}>
          {previewing ? (
            <video ref={previewRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-3)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              <p style={{ fontSize: '0.875rem' }}>Camera preview</p>
              <button onClick={startPreview} className="btn-secondary btn-sm">Enable camera</button>
            </div>
          )}
          {previewing && (
            <button onClick={stopPreview} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>Disable</button>
          )}
        </div>

        {/* Room input */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="label">Room name or meeting link</label>
          <input className="input" value={roomId} onChange={e => setRoomId(e.target.value.replace(/.*\?room=/, ''))}
            placeholder="e.g. team-standup, project-alpha" onKeyDown={e => e.key === 'Enter' && roomId.trim() && onJoin(roomId.trim(), stream)} />
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={() => roomId.trim() && onJoin(roomId.trim(), stream)} disabled={!roomId.trim()}
          className="btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Join Room
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.875rem' }}>Share the room name with others to call together</p>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function VideoCall() {
  const { user } = useAuth()
  const socket = getSocket()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlRoom = searchParams.get('room')

  const [joined, setJoined] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [myStream, setMyStream] = useState(null)
  const [peers, setPeers] = useState([])
  const [audioOn, setAudioOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [hostId, setHostId] = useState(null)
  const [participants, setParticipants] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [meetingLink, setMeetingLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [kickedMsg, setKickedMsg] = useState('')
  const [error, setError] = useState('')
  const [speakingPeers] = useState(new Set())

  const myVideoRef = useRef(null)
  const pcs = useRef({})
  const pendingStreams = useRef({})
  const screenRef = useRef(null)

  useEffect(() => { if (myVideoRef.current && myStream) myVideoRef.current.srcObject = myStream }, [myStream, joined])

  const createPC = useCallback((remoteId, remoteName) => {
    if (pcs.current[remoteId]) return pcs.current[remoteId]
    const pc = new RTCPeerConnection(ICE)
    pcs.current[remoteId] = pc
    myStream?.getTracks().forEach(t => pc.addTrack(t, myStream))
    pc.onicecandidate = ({ candidate }) => candidate && socket?.emit('ice_candidate', { to: remoteId, candidate })
    pc.ontrack = ({ streams: [s] }) => {
      pendingStreams.current[remoteId] = s
      setPeers(prev => {
        const ex = prev.find(p => p.socketId === remoteId)
        return ex ? prev.map(p => p.socketId === remoteId ? { ...p, stream: s } : p) : [...prev, { socketId: remoteId, name: remoteName, stream: s }]
      })
    }
    return pc
  }, [myStream, socket])

  useEffect(() => {
    if (!socket || !joined) return

    const onPeerJoined = async ({ socketId, name }) => {
      playTone(660, 0.3)
      setParticipants(prev => [...prev.filter(p => p.socketId !== socketId), { socketId, name, handRaised: false, muted: false }])
      const pc = createPC(socketId, name)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('webrtc_offer', { to: socketId, offer })
    }
    const onOffer = async ({ from, offer, name }) => {
      const pc = createPC(from, name)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc_answer', { to: from, answer })
      setPeers(prev => prev.find(p => p.socketId === from) ? prev : [...prev, { socketId: from, name, stream: null }])
      setParticipants(prev => [...prev.filter(p => p.socketId !== from), { socketId: from, name, handRaised: false, muted: false }])
    }
    const onAnswer = async ({ from, answer }) => {
      const pc = pcs.current[from]
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {})
    }
    const onIce = async ({ from, candidate }) => {
      const pc = pcs.current[from]
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
    }
    const onPeerLeft = ({ socketId }) => {
      pcs.current[socketId]?.close(); delete pcs.current[socketId]; delete pendingStreams.current[socketId]
      setPeers(prev => prev.filter(p => p.socketId !== socketId))
      setParticipants(prev => prev.filter(p => p.socketId !== socketId))
      playTone(330, 0.3)
    }
    const onRoomParticipants = ({ participants: pts, hostSocketId }) => {
      setHostId(hostSocketId); setIsHost(hostSocketId === socket.id); setParticipants(pts)
    }
    const onForceMuted = () => { setAudioOn(false); myStream?.getAudioTracks().forEach(t => { t.enabled = false }) }
    const onKicked = ({ by }) => { leaveCall(); setKickedMsg(`You were removed from the call by ${by}.`) }
    const onHandRaised = ({ socketId }) => setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, handRaised: true } : p))
    const onHandLowered = ({ socketId }) => setParticipants(prev => prev.map(p => p.socketId === socketId ? { ...p, handRaised: false } : p))
    const onHostTransferred = ({ newHostId }) => { if (newHostId === socket.id) setIsHost(true) }
    const onMeetingLink = ({ link }) => setMeetingLink(link)

    const events = { peer_joined: onPeerJoined, webrtc_offer: onOffer, webrtc_answer: onAnswer, ice_candidate: onIce, peer_left: onPeerLeft, room_participants: onRoomParticipants, force_muted: onForceMuted, kicked_from_room: onKicked, hand_raised: onHandRaised, hand_lowered: onHandLowered, host_transferred: onHostTransferred, meeting_link_generated: onMeetingLink }
    Object.entries(events).forEach(([e, h]) => socket.on(e, h))
    return () => Object.entries(events).forEach(([e, h]) => socket.off(e, h))
  }, [socket, joined, createPC])

  const joinCall = async (room, previewStream) => {
    setError('')
    try {
      let stream = previewStream
      if (!stream) stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setMyStream(stream); setRoomId(room); setJoined(true)
      socket?.emit('join_video_room', room)
      if (['admin', 'super_admin'].includes(user?.role)) socket?.emit('generate_meeting_link', { roomId: room })
      playTone(660, 0.25)
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Camera/microphone permission denied. Please allow access.' : err.message)
    }
  }

  const leaveCall = () => {
    socket?.emit('leave_video_room', roomId)
    Object.values(pcs.current).forEach(pc => pc.close()); pcs.current = {}
    myStream?.getTracks().forEach(t => t.stop())
    screenRef.current?.getTracks().forEach(t => t.stop())
    setMyStream(null); setPeers([]); setJoined(false); setIsSharing(false)
    playTone(330, 0.4)
  }

  const toggleAudio = () => { myStream?.getAudioTracks().forEach(t => { t.enabled = !audioOn }); setAudioOn(a => !a) }
  const toggleVideo = () => { myStream?.getVideoTracks().forEach(t => { t.enabled = !videoOn }); setVideoOn(v => !v) }

  const toggleHand = () => {
    handRaised ? socket?.emit('lower_hand', { roomId }) : socket?.emit('raise_hand', { roomId })
    setHandRaised(h => !h)
  }

  const startScreen = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true })
      screenRef.current = screen
      const track = screen.getVideoTracks()[0]
      Object.values(pcs.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        sender?.replaceTrack(track)
      })
      if (myVideoRef.current) myVideoRef.current.srcObject = screen
      socket?.emit('screen_share_start', { roomId })
      setIsSharing(true)
      track.onended = stopScreen
    } catch {}
  }

  const stopScreen = () => {
    screenRef.current?.getTracks().forEach(t => t.stop())
    const vTrack = myStream?.getVideoTracks()[0]
    if (vTrack) Object.values(pcs.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video')
      sender?.replaceTrack(vTrack)
    })
    if (myVideoRef.current) myVideoRef.current.srcObject = myStream
    socket?.emit('screen_share_stop', { roomId })
    setIsSharing(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink || `${window.location.origin}/video?room=${roomId}`)
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
  }

  const PeerVideo = ({ peer }) => {
    const ref = useRef(null)
    useEffect(() => { if (ref.current && peer.stream) ref.current.srcObject = peer.stream }, [peer.stream])
    const pt = participants.find(p => p.socketId === peer.socketId)
    return (
      <VideoTile
        stream={peer.stream} name={peer.name}
        isMuted={pt?.muted} handRaised={pt?.handRaised}
        isHost={peer.socketId === hostId}
      />
    )
  }

  if (kickedMsg) return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Removed from call</h2>
        <p style={{ color: 'var(--text-3)', marginBottom: '1.5rem' }}>{kickedMsg}</p>
        <button onClick={() => { setKickedMsg(''); navigate('/video') }} className="btn-primary">Back to Video</button>
      </div>
    </div>
  )

  if (!joined) return <JoinScreen urlRoom={urlRoom} onJoin={joinCall} error={error} />

  const totalPeers = peers.length + 1
  const gridCols = totalPeers === 1 ? '1fr' : totalPeers <= 2 ? '1fr 1fr' : totalPeers <= 4 ? '1fr 1fr' : 'repeat(3,1fr)'

  return (
    <div style={{ height: 'calc(100vh - 45px)', display: 'flex', flexDirection: 'column', background: '#04060f', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: 'rgba(8,12,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3dd68a', boxShadow: '0 0 8px rgba(61,214,138,0.6)', animation: 'speakPulse 2s infinite' }} />
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
              {roomId}
              {isHost && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>Host</span>}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{totalPeers} participant{totalPeers !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '8px', background: linkCopied ? 'rgba(61,214,138,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${linkCopied ? 'rgba(61,214,138,0.3)' : 'rgba(255,255,255,0.08)'}`, color: linkCopied ? '#3dd68a' : 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-sans)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{linkCopied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}</svg>
            {linkCopied ? 'Copied!' : 'Copy link'}
          </button>
          <button onClick={() => setShowPanel(p => !p)} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', background: showPanel ? 'rgba(61,214,138,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showPanel ? 'rgba(61,214,138,0.25)' : 'rgba(255,255,255,0.08)'}`, color: showPanel ? '#3dd68a' : 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
            👥 {participants.length + 1}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Video grid */}
        <div style={{ flex: 1, padding: '1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '0.75rem', width: '100%', maxHeight: '100%', alignContent: 'center' }}>
            {/* My tile */}
            <VideoTile stream={myStream} name={user?.name} isMe videoRef={myVideoRef}
              isMuted={!audioOn} handRaised={handRaised} isSharing={isSharing}
              isHost={socket?.id === hostId} />
            {/* Peer tiles */}
            {peers.map(peer => <PeerVideo key={peer.socketId} peer={peer} />)}
            {/* Empty slot */}
            {peers.length === 0 && (
              <div style={{ borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.08)', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Waiting for others…</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Share: <span style={{ fontFamily: 'var(--font-mono)' }}>{roomId}</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Participants panel */}
        {showPanel && (
          <div style={{ width: '240px', flexShrink: 0, background: 'rgba(8,12,26,0.95)', borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff' }}>Participants</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.125rem' }}>{participants.length + 1} in this call</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {/* Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem', borderRadius: '10px', background: 'rgba(61,214,138,0.06)', border: '1px solid rgba(61,214,138,0.12)', marginBottom: '0.5rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(61,214,138,0.15)', color: '#3dd68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f0f4ff', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>You</p>
                  {isHost && <p style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {!audioOn && <span style={{ fontSize: '0.75rem' }}>🔇</span>}
                  {handRaised && <span style={{ fontSize: '0.75rem' }}>✋</span>}
                </div>
              </div>

              {/* Peers */}
              {participants.filter(p => p.socketId !== socket?.id).map(p => (
                <div key={p.socketId} className="group" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '10px', marginBottom: '0.375rem', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(124,77,255,0.15)', color: '#9d74ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, border: '1px solid rgba(124,77,255,0.2)' }}>{p.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    {p.socketId === hostId && <p style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700 }}>Host</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {p.muted && <span style={{ fontSize: '0.75rem' }}>🔇</span>}
                    {p.handRaised && <span style={{ fontSize: '0.75rem' }}>✋</span>}
                    {isHost && (
                      <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.25rem' }}>
                        <button onClick={() => socket?.emit('host_mute_participant', { roomId, targetSocketId: p.socketId })} title="Mute"
                          style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M</button>
                        <button onClick={() => socket?.emit('host_kick_participant', { roomId, targetSocketId: p.socketId })} title="Remove"
                          style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.625rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating controls ── */}
      <div style={{ padding: '1rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(4,6,15,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Mic */}
        <CtrlBtn onClick={toggleAudio} title={audioOn ? 'Mute' : 'Unmute'} active={audioOn}>
          {audioOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/>
            </svg>
          )}
        </CtrlBtn>

        {/* Camera */}
        <CtrlBtn onClick={toggleVideo} title={videoOn ? 'Stop video' : 'Start video'} active={videoOn}>
          {videoOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34"/><path d="M23 7l-7 5 7 5V7z"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </CtrlBtn>

        {/* Screen share */}
        <CtrlBtn onClick={isSharing ? stopScreen : startScreen} title={isSharing ? 'Stop sharing' : 'Share screen'} active={!isSharing}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isSharing ? (
              <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><line x1="2" y1="3" x2="22" y2="17"/></>
            ) : (
              <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M9 9l3-3 3 3M12 6v8"/></>
            )}
          </svg>
        </CtrlBtn>

        {/* Raise hand */}
        <CtrlBtn onClick={toggleHand} title={handRaised ? 'Lower hand' : 'Raise hand'} active={!handRaised}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={handRaised ? '#fbbf24' : 'none'} stroke={handRaised ? '#fbbf24' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 00-2-2 2 2 0 00-2 2M14 10V4a2 2 0 00-2-2 2 2 0 00-2 2v2M10 10.5V6a2 2 0 00-2-2 2 2 0 00-2 2v8a6 6 0 006 6h2.5a5.5 5.5 0 005.5-5.5v-5a2 2 0 00-2-2 2 2 0 00-2 2v1"/>
          </svg>
        </CtrlBtn>

        {/* Participants */}
        <CtrlBtn onClick={() => setShowPanel(p => !p)} title="Participants" active={!showPanel} badge={participants.length + 1 > 1 ? participants.length + 1 : undefined}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </CtrlBtn>

        {/* Divider */}
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.08)', margin: '0 0.25rem' }} />

        {/* Leave */}
        <CtrlBtn onClick={leaveCall} title="Leave" danger>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 012 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.75 19.86 19.86 0 01.36 1.18 2 2 0 012.34-1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.32 7.9a16 16 0 002.6 3.41"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
          </svg>
        </CtrlBtn>
      </div>

      <style>{`
        @keyframes speakPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
      `}</style>
    </div>
  )
}
