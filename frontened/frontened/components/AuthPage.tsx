'use client'

import { User } from '@/app/page'
import { useState } from 'react'

const IOCL_EMAIL = /^[a-zA-Z0-9._%+-]+@iocl\.co\.in$/

function validatePassword(p: string): string[] {
  const e: string[] = []
  if (p.length < 8) e.push('Min 8 characters')
  if (!/[A-Z]/.test(p)) e.push('1 uppercase letter')
  if (!/[0-9]/.test(p)) e.push('1 number')
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) e.push('1 special character')
  return e
}

export default function AuthPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', empId: '', dept: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function handleRegister() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name required'
    if (!form.empId.trim()) e.empId = 'Employee ID required'
    if (!form.dept) e.dept = 'Department required'
    if (!IOCL_EMAIL.test(form.email)) e.email = 'Must be @iocl.co.in email'
    const pe = validatePassword(form.password)
    if (pe.length) e.password = pe.join(' · ')
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    const users = JSON.parse(localStorage.getItem('iocl_users') || '[]')
    if (users.find((u: any) => u.email === form.email)) {
      setErrors({ email: 'Already registered' }); setLoading(false); return
    }
    users.push({ name: form.name, empId: form.empId, dept: form.dept, email: form.email, password: form.password })
    localStorage.setItem('iocl_users', JSON.stringify(users))
    setMsg('✅ Account created! Please login.')
    setMode('login')
    setForm({ name: '', empId: '', dept: '', email: '', password: '', confirm: '' })
    setLoading(false)
  }

  function handleLogin() {
    const e: Record<string, string> = {}
    if (!IOCL_EMAIL.test(form.email)) e.email = 'Must be @iocl.co.in email'
    if (!form.password) e.password = 'Password required'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    const users = JSON.parse(localStorage.getItem('iocl_users') || '[]')
    const found = users.find((u: any) => u.email === form.email && u.password === form.password)
    if (!found) { setErrors({ password: 'Invalid email or password' }); setLoading(false); return }
    onLogin({ name: found.name, email: found.email, dept: found.dept, empId: found.empId })
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#04091a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-input { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .auth-input:focus { border-color: rgba(244,121,32,0.5); }
        .auth-input option { background: #04091a; }
        .auth-tab { flex: 1; padding: 10px; border: none; cursor: pointer; font-weight: 700; font-size: 13px; border-radius: 8px; font-family: 'Rajdhani', sans-serif; letter-spacing: 1px; transition: all 0.2s; }
        .auth-tab.active { background: linear-gradient(135deg, #F47920, #c47a10); color: #fff; }
        .auth-tab:not(.active) { background: transparent; color: #2a3450; }
        .auth-tab:not(.active):hover { color: #e2e8f0; }
        .auth-btn { width: 100%; padding: 13px; border-radius: 10px; border: none; cursor: pointer; font-weight: 700; font-size: 14px; font-family: 'Rajdhani', sans-serif; letter-spacing: 2px; background: linear-gradient(135deg, #F47920, #c47a10); color: #fff; margin-top: 8px; transition: all 0.2s; }
        .auth-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-err { color: #fca5a5; font-size: 11px; margin-top: 4px; font-family: 'Rajdhani', sans-serif; font-weight: 600; }
        .auth-label { font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; color: #5b8af0; letter-spacing: 1.5px; display: block; margin-bottom: 6px; }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.1) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px)` }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 460, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #F47920', boxShadow: '0 0 12px rgba(244,121,32,0.4)' }} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2.5px solid #003087', boxShadow: '0 0 8px rgba(0,48,135,0.5)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F47920', boxShadow: '0 0 8px #F47920' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, color: '#f0f4ff', letterSpacing: -0.5 }}>IndianOil</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#F47920', letterSpacing: 3, fontWeight: 600 }}>PREDICTIVE MAINTENANCE</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 11, letterSpacing: 1.5, fontWeight: 600 }}>GUWAHATI REFINERY — FAULT DETECTION SYSTEM</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F47920, rgba(244,121,32,0.2))', borderRadius: '20px 20px 0 0' }} />

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 22 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} className={`auth-tab${mode === m ? ' active' : ''}`} onClick={() => { setMode(m); setErrors({}); setMsg('') }}>
                {m === 'login' ? '🔐 LOGIN' : '📝 REGISTER'}
              </button>
            ))}
          </div>

          {msg && (
            <div style={{ background: 'rgba(14,165,160,0.08)', border: '1px solid rgba(14,165,160,0.2)', color: '#0ea5a0', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 16, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: 0.5 }}>{msg}</div>
          )}

          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="auth-label">FULL NAME</label>
                <input className="auth-input" placeholder="e.g. Rajesh Kumar Sharma" value={form.name} onChange={e => f('name', e.target.value)} />
                {errors.name && <div className="auth-err">⚠ {errors.name}</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="auth-label">EMPLOYEE ID</label>
                  <input className="auth-input" placeholder="IOCL-2024-XXXX" value={form.empId} onChange={e => f('empId', e.target.value)} />
                  {errors.empId && <div className="auth-err">⚠ {errors.empId}</div>}
                </div>
                <div>
                  <label className="auth-label">DEPARTMENT</label>
                  <select className="auth-input" value={form.dept} onChange={e => f('dept', e.target.value)}>
                    <option value="">Select</option>
                    {['Maintenance', 'Operations', 'Inspection', 'Electrical', 'Instrumentation', 'Safety', 'IT'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.dept && <div className="auth-err">⚠ {errors.dept}</div>}
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label className="auth-label">IOCL EMAIL</label>
            <input className="auth-input" type="email" placeholder="yourname@iocl.co.in" value={form.email} onChange={e => f('email', e.target.value)} />
            {errors.email && <div className="auth-err">⚠ {errors.email}</div>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="auth-label" style={{ marginBottom: 0 }}>PASSWORD</label>
              <span style={{ cursor: 'pointer', color: '#2a3450', fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }} onClick={() => setShowPwd(p => !p)}>{showPwd ? '🙈 HIDE' : '👁 SHOW'}</span>
            </div>
            <input className="auth-input" type={showPwd ? 'text' : 'password'} placeholder="Enter password" value={form.password} onChange={e => f('password', e.target.value)} />
            {errors.password && <div className="auth-err">⚠ {errors.password}</div>}
          </div>

          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="auth-label">CONFIRM PASSWORD</label>
                <input className="auth-input" type={showPwd ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirm} onChange={e => f('confirm', e.target.value)} />
                {errors.confirm && <div className="auth-err">⚠ {errors.confirm}</div>}
              </div>
              <div style={{ background: 'rgba(0,48,135,0.08)', border: '1px solid rgba(0,48,135,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: '#5b8af0', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: 0.5 }}>
                🔐 8+ chars · 1 uppercase · 1 number · 1 special character
              </div>
            </>
          )}

          <button className="auth-btn" onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
            {loading ? '⏳ PLEASE WAIT...' : mode === 'login' ? 'LOGIN TO SYSTEM →' : 'CREATE ACCOUNT →'}
          </button>
        </div>
      </div>
    </main>
  )
}