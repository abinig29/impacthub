import React, { useEffect, useState } from 'react'
import api from '../utils/api'

const AMOUNTS = [10, 25, 50, 100, 250, 500]

export default function DonatePage() {
  const [goals, setGoals] = useState([])
  const [donations, setDonations] = useState([])
  const [form, setForm] = useState({ donorName: '', donorEmail: '', amount: '', customAmount: '', projectTitle: 'General Fund', message: '' })
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/donations/goals'), api.get('/donations')])
      .then(([gRes, dRes]) => { setGoals(gRes.data); setDonations(dRes.data.donations?.slice(0, 8) || []) })
      .catch(console.error)
      .finally(() => setLoadingData(false))
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const selectAmount = (amount) => {
    setSelectedPreset(amount)
    setForm(p => ({ ...p, amount: String(amount), customAmount: '' }))
  }

  const finalAmount = form.customAmount ? parseFloat(form.customAmount) : parseFloat(form.amount)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!finalAmount || finalAmount < 1) { setError('Minimum donation is $1'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/donations', {
        donorName: form.donorName || 'Anonymous',
        donorEmail: form.donorEmail,
        amount: finalAmount,
        projectTitle: form.projectTitle,
        message: form.message,
      })
      setSuccess(data)
      setForm({ donorName: '', donorEmail: '', amount: '', customAmount: '', projectTitle: 'General Fund', message: '' })
      setSelectedPreset(null)
      // Refresh donations
      api.get('/donations').then(r => setDonations(r.data.donations?.slice(0, 8) || []))
    } catch (err) {
      setError(err.response?.data?.message || 'Donation failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-dark-700">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 to-dark-950" />
        <div className="relative page-container py-14 text-center">
          <div className="text-6xl mb-4">💙</div>
          <h1 className="text-4xl font-black text-white mb-3">Support Our Mission</h1>
          <p className="text-slate-400 max-w-lg mx-auto">Every dollar funds volunteer training, project resources, and community programs that help thousands of people.</p>
        </div>
      </div>

      <div className="page-container">
        <div className="grid lg:grid-cols-5 gap-8 mt-8">
          {/* Donation Form */}
          <div className="lg:col-span-3">
            {success ? (
              <div className="card text-center py-12 animate-slide-up">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-black text-white mb-2">Thank You!</h2>
                <p className="text-slate-400 mb-2">${success.amount} donated to <span className="text-white font-semibold">{success.projectTitle}</span></p>
                <p className="text-slate-500 text-sm">Your generosity makes real change possible.</p>
                <button onClick={() => setSuccess(null)} className="btn-primary mt-6 inline-flex">Donate Again</button>
              </div>
            ) : (
              <div className="card">
                <h2 className="font-bold text-white text-xl mb-6">Make a Donation</h2>

                {error && <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Amount presets */}
                  <div>
                    <label className="label">Choose Amount (USD)</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {AMOUNTS.map(a => (
                        <button key={a} type="button" onClick={() => selectAmount(a)}
                          className={`py-3 rounded-xl font-bold text-sm border transition-all ${selectedPreset === a ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30' : 'bg-dark-700 border-dark-500 text-slate-300 hover:border-brand-600/50'}`}>
                          ${a}
                        </button>
                      ))}
                    </div>
                    <input className="input" name="customAmount" type="number" min="1" step="0.01"
                      placeholder="Or enter custom amount…"
                      value={form.customAmount} onChange={e => { handleChange(e); setSelectedPreset(null) }} />
                  </div>

                  {/* Project */}
                  <div>
                    <label className="label">Fund</label>
                    <select className="input" name="projectTitle" value={form.projectTitle} onChange={handleChange}>
                      <option value="General Fund">General Fund</option>
                      {goals.filter(g => g.id !== 'general').map(g => (
                        <option key={g.id} value={g.title}>{g.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Name <span className="text-slate-600">(optional)</span></label>
                      <input className="input" name="donorName" placeholder="Anonymous" value={form.donorName} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="label">Email <span className="text-slate-600">(optional)</span></label>
                      <input className="input" name="donorEmail" type="email" placeholder="for receipt" value={form.donorEmail} onChange={handleChange} />
                    </div>
                  </div>

                  <div>
                    <label className="label">Message <span className="text-slate-600">(optional)</span></label>
                    <textarea className="input resize-none" name="message" rows={2} placeholder="Leave a note of support…" value={form.message} onChange={handleChange} />
                  </div>

                  {finalAmount >= 1 && (
                    <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-600/20 text-center">
                      <p className="text-2xl font-black text-brand-300">${finalAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">to {form.projectTitle}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !finalAmount || finalAmount < 1} className="btn-primary w-full justify-center py-4 text-base">
                    {loading ? 'Processing…' : `Donate ${finalAmount >= 1 ? `$${finalAmount.toFixed(2)}` : ''} 💙`}
                  </button>
                  <p className="text-xs text-slate-600 text-center">This is a demo platform. No real payment is processed.</p>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar: goals + recent donors */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goals */}
            {!loadingData && goals.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-white mb-4">Funding Goals</h3>
                <div className="space-y-5">
                  {goals.slice(0, 4).map(g => {
                    const pct = Math.min(100, Math.round((g.raised / g.goal) * 100))
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between mb-1.5">
                          <p className="text-sm font-medium text-slate-300">{g.title}</p>
                          <span className="text-xs text-brand-400 font-bold">{pct}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-slate-400">${(g.raised || 0).toLocaleString()} raised</span>
                          <span className="text-xs text-slate-600">Goal: ${g.goal.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent donors */}
            {donations.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-white mb-4">Recent Supporters</h3>
                <div className="space-y-3">
                  {donations.map(d => (
                    <div key={d._id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-slate-400">
                          {d.donorName?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-300">{d.donorName || 'Anonymous'}</p>
                          <p className="text-xs text-slate-600">{d.projectTitle}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-brand-400">${d.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
