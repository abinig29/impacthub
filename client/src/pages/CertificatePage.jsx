import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function CertificatePage() {
  const { user } = useAuth()
  const [certs, setCerts] = useState([])
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [verifyId, setVerifyId] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my')
  const certRef = useRef(null)

  useEffect(() => {
    api.get('/certificates/my').then(r => setCerts(r.data)).catch(() => {})
  }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/certificates/generate')
      setCerts(prev => [data, ...prev])
      setSelected(data)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate')
    } finally { setGenerating(false) }
  }

  const verify = async () => {
    if (!verifyId.trim()) return
    setVerifyLoading(true); setVerifyResult(null)
    try {
      const { data } = await api.get(`/certificates/verify/${verifyId.trim()}`)
      setVerifyResult({ valid: true, cert: data.certificate })
    } catch {
      setVerifyResult({ valid: false })
    } finally { setVerifyLoading(false) }
  }

  const printCert = () => {
    const el = document.getElementById('cert-printable')
    if (!el) return
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Certificate</title>
      <style>
        body{margin:0;background:#0d1117;font-family:'Georgia',serif;display:flex;justify-content:center;align-items:center;min-height:100vh;}
        @media print{body{background:white;}.no-print{display:none;}}
      </style></head><body>
      ${el.outerHTML}
      <script>setTimeout(()=>{window.print();window.close();},500)</script>
      </body></html>`)
    w.document.close()
  }

  const CertView = ({ cert }) => (
    <div id="cert-printable" className="cert-border rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161c25 50%, #0d1117 100%)' }}>
      {/* Decorative corners */}
      {[['top-4 left-4', ''], ['top-4 right-4', 'rotate-90'], ['bottom-4 left-4', '-rotate-90'], ['bottom-4 right-4', 'rotate-180']].map(([pos, rot], i) => (
        <div key={i} className={`absolute ${pos} w-10 h-10 opacity-40`}>
          <svg viewBox="0 0 40 40" fill="none" className={rot}><path d="M0 0h16v2H2v14H0V0z" fill="#16b36e"/></svg>
        </div>
      ))}
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
        <svg width="300" height="300" viewBox="0 0 28 28" fill="none"><path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="#16b36e"/></svg>
      </div>
      <div className="relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-2xl glow-brand">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none"><path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white"/></svg>
          </div>
        </div>
        <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-1">ImpactHub Volunteer Platform</p>
        <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>Certificate of Volunteer Service</h1>
        <p className="text-slate-400 text-sm mb-6">This certifies that</p>
        <p className="text-4xl font-black text-brand-300 mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 0 40px rgba(22,179,110,0.4)' }}>{cert.recipientName}</p>
        <p className="text-slate-400 text-sm mb-6">has dedicated their time and service to the community</p>
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-sm mx-auto">
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <p className="text-2xl font-black text-brand-400">{cert.formattedDuration || `${(cert.totalHours || 0).toFixed(1)}h`}</p>
            <p className="text-xs text-slate-500">Total Time</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <p className="text-2xl font-black text-white">{cert.missionsCompleted || 0}</p>
            <p className="text-xs text-slate-500">Missions</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <p className="text-2xl font-black text-yellow-400">{{ Beginner:'🌱', Helper:'💙', Leader:'⭐', Hero:'🏆' }[cert.level] || '🌱'}</p>
            <p className="text-xs text-slate-500">{cert.level}</p>
          </div>
        </div>
        {(cert.badges || []).length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {cert.badges.map((b, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-brand-600/20 border border-brand-600/30 text-brand-300">{b}</span>)}
          </div>
        )}
        <div className="border-t border-dark-600/50 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
          <div><p>Issued: {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
          <div className="text-center">
            <div className="w-16 h-px bg-brand-600/50 mx-auto mb-1" />
            <p>Authorized Signature</p>
            <p className="text-brand-400">ImpactHub</p>
          </div>
          <div className="text-right"><p>Verification ID:</p><p className="font-mono text-brand-300">{cert.verificationId}</p></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title mb-1">📜 Certificates</h1>
        <p className="text-slate-400 text-sm">Generate, download, and verify your volunteer service certificates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-800 border border-dark-600 rounded-2xl p-1 w-fit">
        {[{ id: 'my', label: 'My Certificates' }, { id: 'verify', label: 'Verify Certificate' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'my' && (
        <div>
          {selected ? (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary text-sm py-2">← Back</button>
                <button onClick={printCert} className="btn-primary text-sm py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                  Print / Download PDF
                </button>
              </div>
              <CertView cert={selected} />
            </div>
          ) : (
            <div>
              <div className="card mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold text-white mb-1">Generate New Certificate</p>
                  <p className="text-sm text-slate-400">Creates a verified certificate with your current stats</p>
                </div>
                <button onClick={generate} disabled={generating} className="btn-primary">
                  {generating ? 'Generating…' : '+ Generate Certificate'}
                </button>
              </div>
              {certs.length === 0 ? (
                <div className="card text-center py-16">
                  <p className="text-4xl mb-3">📜</p>
                  <p className="text-slate-400">No certificates yet.</p>
                  <p className="text-slate-500 text-sm mt-1">Generate your first one above!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certs.map(cert => (
                    <div key={cert._id} className="card-hover" onClick={() => setSelected(cert)}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/20 to-brand-800/20 border border-brand-600/30 flex items-center justify-center text-2xl flex-shrink-0">📜</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">Certificate of Service</p>
                          <p className="text-xs text-slate-400 mt-0.5">{cert.formattedDuration || `${cert.totalHours?.toFixed(1) || 0}h`} · {cert.level}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                          <p className="text-xs font-mono text-brand-400 mt-1">{cert.verificationId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="card max-w-lg">
          <h2 className="font-bold text-white mb-2">Verify Certificate</h2>
          <p className="text-sm text-slate-400 mb-5">Enter a certificate verification ID to check its authenticity.</p>
          <div className="flex gap-3 mb-5">
            <input className="input flex-1 font-mono" placeholder="e.g. A1B2C3D4E5F6" value={verifyId} onChange={e => setVerifyId(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && verify()} />
            <button onClick={verify} disabled={verifyLoading || !verifyId.trim()} className="btn-primary">Verify</button>
          </div>
          {verifyResult && (
            <div className={`p-5 rounded-2xl border animate-slide-up ${verifyResult.valid ? 'bg-brand-600/10 border-brand-600/30' : 'bg-red-900/20 border-red-700/40'}`}>
              {verifyResult.valid ? (
                <div>
                  <div className="flex items-center gap-2 mb-3"><span className="text-xl">✅</span><p className="font-bold text-brand-300">Certificate Valid</p></div>
                  <p className="text-sm text-white mb-1">{verifyResult.cert.recipientName}</p>
                  <p className="text-xs text-slate-400">Time: {verifyResult.cert.formattedDuration || `${verifyResult.cert.totalHours?.toFixed(1)}h`}</p>
                  <p className="text-xs text-slate-400">Level: {verifyResult.cert.level}</p>
                  <p className="text-xs text-slate-400">Issued: {new Date(verifyResult.cert.issuedAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2"><span className="text-xl">❌</span><p className="text-red-400 font-bold">Certificate Not Found</p></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
