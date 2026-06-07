import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

// Beep sound via Web Audio API
function playBeep(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = type === 'success' ? 880 : 220
    osc.type = type === 'success' ? 'sine' : 'square'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function QRScanner() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Admin-only guard
  if (user?.role !== 'admin') {
    return (
      <div className="page-container flex items-center justify-center min-h-96">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Only</h2>
          <p className="text-slate-400 text-sm mb-6">QR Scanner is restricted to administrators only.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full justify-center">← Back to Dashboard</button>
        </div>
      </div>
    )
  }

  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [elapsedTime, setElapsedTime] = useState(null)
  const html5QrRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => () => { stopScanner(); clearInterval(timerRef.current) }, [])

  const processQR = async (qrCode) => {
    if (loading) return
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await api.post('/timelogs/scan', { qrCode })
      setResult(data)
      playBeep(data.action === 'started' || data.action === 'stopped' ? 'success' : 'error')
      if (data.action === 'started') {
        setElapsedTime(0)
        timerRef.current = setInterval(() => setElapsedTime(p => p + 1), 1000)
      } else {
        clearInterval(timerRef.current)
        setElapsedTime(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process QR')
      playBeep('error')
    } finally { setLoading(false) }
  }

  const startScanner = async () => {
    setError(''); setResult(null)
    try {
      const h = new Html5Qrcode('qr-reader')
      html5QrRef.current = h
      await h.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => { await stopScanner(); await processQR(text) },
        () => {}
      )
      setScanning(true)
    } catch (err) {
      const msg = err.toString()
      if (msg.includes('NotAllowed') || msg.includes('Permission')) setError('Camera permission denied.')
      else setError('Camera error: ' + msg)
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); html5QrRef.current.clear() } catch {}
      html5QrRef.current = null
    }
    setScanning(false)
  }

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-brand-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
          </div>
          <span className="badge badge-admin">Admin Scanner</span>
        </div>
        <h1 className="section-title mb-1">QR Attendance</h1>
        <p className="text-slate-400 text-sm">Scan a volunteer's personal QR code to check them in/out of the latest active session.</p>
      </div>

      {/* Timer display */}
      {elapsedTime !== null && (
        <div className="mb-4 px-5 py-4 rounded-2xl bg-brand-600/10 border border-brand-600/30 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
            <div>
              <p className="text-brand-300 font-semibold text-sm">Session Timer Active</p>
              <p className="text-xs text-slate-400">{result?.volunteerName} is checked in</p>
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-brand-300">{fmtTime(elapsedTime)}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mb-5 p-5 rounded-2xl border animate-slide-up ${
          result.action === 'started' ? 'bg-brand-600/10 border-brand-600/30' :
          result.action === 'stopped' ? 'bg-purple-600/10 border-purple-600/30' :
          'bg-blue-600/10 border-blue-600/30'}`}>
          <p className="font-bold text-white text-lg mb-1">
            {result.action === 'started' ? '🟢 Checked In' : result.action === 'stopped' ? '🏁 Checked Out' : 'ℹ️ Session Info'}
          </p>
          <p className="text-slate-300 text-sm">{result.message}</p>
          {result.action === 'stopped' && (
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-3">
              <div><p className="text-xs text-slate-500">Impact Score</p><p className="text-sm font-bold text-brand-300">{result.impactScore}</p></div>
              <div><p className="text-xs text-slate-500">Level</p><p className="text-sm font-bold text-white">{result.level}</p></div>
              <div><p className="text-xs text-slate-500">Badges</p><p className="text-sm">{(result.badges || []).slice(0,2).join(' ') || '—'}</p></div>
            </div>
          )}
          <button onClick={() => setResult(null)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">✕ Dismiss</button>
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 rounded-2xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Camera */}
      <div className="card mb-5">
        <div className="relative overflow-hidden rounded-2xl bg-dark-900 border border-dark-600" style={{ minHeight: 300 }}>
          <div id="qr-reader" />

          {/* Scan frame overlay */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-56">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                <div className="absolute left-4 right-4 h-0.5 bg-brand-400/70 scan-line" style={{ top: '50%' }} />
              </div>
            </div>
          )}

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-dark-700 border-2 border-dashed border-dark-500 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M8 12h8M12 8v8"/></svg>
              </div>
              <p className="text-slate-500 text-sm">Camera not started</p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
              <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button onClick={startScanner} disabled={loading} className="btn-primary flex-1 justify-center py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              Start Camera
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-danger flex-1 justify-center py-3">
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Manual */}
      <div className="card">
        <h3 className="font-semibold text-slate-300 mb-3 text-sm">Manual QR Code Entry</h3>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Paste volunteer QR code UUID…" value={manualCode} onChange={e => setManualCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && processQR(manualCode.trim())} />
          <button onClick={() => processQR(manualCode.trim())} disabled={loading || !manualCode.trim()} className="btn-primary">Submit</button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Volunteer's QR code UUID is visible in their profile page.</p>
      </div>
    </div>
  )
}
