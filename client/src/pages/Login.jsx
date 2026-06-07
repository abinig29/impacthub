import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #16b36e 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-2xl shadow-brand-900/50 group-hover:scale-105 transition-transform glow-brand">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="white"/></svg>
            </div>
            <div>
              <p className="font-black text-white text-lg leading-none">ImpactHub</p>
              <p className="text-xs text-slate-500">Volunteer Platform</p>
            </div>
          </Link>
        </div>

        <div className="glass-card p-8">
          <div className="mb-6">
            <h1 className="text-xl font-black text-white mb-1">Welcome back</h1>
            <p className="text-sm text-slate-400">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-300 text-sm animate-slide-up">
              <span className="flex-shrink-0">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-dark-600/60">
            <p className="text-xs text-slate-500 text-center mb-2">Demo super admin account:</p>
            <div className="bg-dark-800 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xs text-slate-300 font-mono">fnigus33@gmail.com</p>
              <p className="text-xs text-slate-500 font-mono">Use your registered password</p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
