'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthPage from '@/components/AuthPage'

export type User = {
  name: string
  email: string
  empId: string
  dept: string
}

function OriginalHomePage() {
  const router = useRouter()

  function handleLogout() {
  sessionStorage.removeItem('iocl_session')
  window.location.reload()
}

  return (
    <main className="selector-root">
      <div className="selector-bg" />
      <div className="noise" />
      <div className="selector-container">
        <div className="selector-header">
          <div className="iocl-logo-row">
            <div className="iocl-emblem">
              <div className="emblem-ring outer-ring" />
              <div className="emblem-ring inner-ring" />
              <div className="emblem-core" />
            </div>
            <div className="iocl-wordmark">
              <span className="iocl-name">IndianOil</span>
              <span className="iocl-tagline">PREDICTIVE MAINTENANCE</span>
            </div>
          </div>
          <h1 className="header-title">Fault Detection System</h1>
          <p className="header-sub">ML-powered industrial diagnostics for motors, pumps, compressors &amp; turbines</p>
        </div>

        {/* Dashboard button at TOP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.8rem', fontWeight: 700, letterSpacing: '2px', padding: '10px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #F47920, #c47a10)', border: 'none', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            📊 OPEN FULL DASHBOARD →
          </button>
          <button
            onClick={handleLogout}
            style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px', padding: '9px 20px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#4a5568', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🚪 LOGOUT
          </button>
        </div>

        {/* ALL 4 CARDS IN ONE ROW */}
        <div className="cards-row">
          {/* Motor Card */}
          <button className="machine-card motor-card" onClick={() => router.push('/motor/diagnostics')}>
            <div className="card-streak motor-streak" />
            <div className="card-top">
              <div className="card-icon-wrap motor-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none">
                  <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="3"/>
                  <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.25"/>
                  <circle cx="32" cy="32" r="3" fill="currentColor"/>
                  <line x1="32" y1="4" x2="32" y2="14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="32" y1="50" x2="32" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="4" y1="32" x2="14" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="50" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="11.5" y1="11.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="45.5" y1="45.5" x2="52.5" y2="52.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="52.5" y1="11.5" x2="45.5" y2="18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="18.5" y1="45.5" x2="11.5" y2="52.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="card-label motor-label">MOTOR</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Motor Analysis</h2>
              <p className="card-desc">Vibration &amp; current sensor analysis. Detect bearing faults, winding failures, and rotor imbalance in real time.</p>
              <div className="card-features">
                <span className="feature-tag motor-tag">Vibration</span>
                <span className="feature-tag motor-tag">Current</span>
                <span className="feature-tag motor-tag">Bearing</span>
              </div>
            </div>
            <div className="card-footer motor-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>

          {/* Pump Card */}
          <button className="machine-card pump-card" onClick={() => router.push('/pump/diagnostics')}>
            <div className="card-streak pump-streak" />
            <div className="card-top">
              <div className="card-icon-wrap pump-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none">
                  <rect x="8" y="22" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="3"/>
                  <rect x="36" y="18" width="20" height="28" rx="4" stroke="currentColor" strokeWidth="3"/>
                  <line x1="28" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M18 22 C18 14 26 10 32 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M46 18 C46 10 54 10 56 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <circle cx="18" cy="32" r="3" fill="currentColor" opacity="0.4"/>
                  <circle cx="46" cy="32" r="4" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <div className="card-label pump-label">PUMP</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Pump Analysis</h2>
              <p className="card-desc">52-sensor time-series analysis. Classify Normal, Broken, and Recovering pump states using SMOTE-balanced ML models.</p>
              <div className="card-features">
                <span className="feature-tag pump-tag">52 Sensors</span>
                <span className="feature-tag pump-tag">SMOTE</span>
                <span className="feature-tag pump-tag">3-Class</span>
              </div>
            </div>
            <div className="card-footer pump-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>

          {/* Compressor Card */}
          <button className="machine-card compressor-card" onClick={() => router.push('/compressor/diagnostics')}>
            <div className="card-streak compressor-streak" />
            <div className="card-top">
              <div className="card-icon-wrap compressor-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="32" cy="32" r="18"/>
                  <path d="M20 32 L32 20 L44 32"/>
                  <path d="M20 32 L32 44 L44 32"/>
                  <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.3" stroke="none"/>
                </svg>
              </div>
              <div className="card-label compressor-label">COMPRESSOR</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Compressor Analysis</h2>
              <p className="card-desc">Airflow, pressure and RPM monitoring. Detect degraded performance and fault conditions using multi-parameter ML models.</p>
              <div className="card-features">
                <span className="feature-tag compressor-tag">Pressure</span>
                <span className="feature-tag compressor-tag">Airflow</span>
                <span className="feature-tag compressor-tag">Fault</span>
              </div>
            </div>
            <div className="card-footer compressor-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>

          {/* Turbine Card */}
          <button className="machine-card turbine-card" onClick={() => router.push('/turbine/diagnostics')}>
            <div className="card-streak turbine-streak" />
            <div className="card-top">
              <div className="card-icon-wrap turbine-icon-bg">
                <svg viewBox="0 0 64 64" className="card-icon" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="32" cy="32" r="6"/>
                  <path d="M32 26 C32 18 22 10 16 16 C10 22 18 32 26 32"/>
                  <path d="M38 32 C46 32 54 22 48 16 C42 10 32 18 32 26"/>
                  <path d="M32 38 C32 46 42 54 48 48 C54 42 46 32 38 32"/>
                  <path d="M26 32 C18 32 10 42 16 48 C22 54 32 46 32 38"/>
                </svg>
              </div>
              <div className="card-label turbine-label">TURBINE</div>
            </div>
            <div className="card-content">
              <h2 className="card-title">Turbine Analysis</h2>
              <p className="card-desc">High-speed rotor and blade health monitoring. Detect thermal fatigue, blade erosion, and imbalance in gas turbines.</p>
              <div className="card-features">
                <span className="feature-tag turbine-tag">Blade</span>
                <span className="feature-tag turbine-tag">Thermal</span>
                <span className="feature-tag turbine-tag">Rotor</span>
              </div>
            </div>
            <div className="card-footer turbine-footer">
              <span>Run Diagnostics</span>
              <span className="arrow">→</span>
            </div>
          </button>
        </div>

        <p className="selector-footer">Models trained on real industrial sensor datasets &nbsp;·&nbsp; Binary &amp; multi-class classification</p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --iocl-orange: #F47920; --iocl-blue: #003087; --iocl-teal: #0ea5a0; --iocl-purple: #7c3aed; }
        .selector-root { min-height: 100vh; background: #04091a; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; position: relative; overflow: hidden; }
        .selector-bg { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 50% 90%, rgba(14,165,160,0.04) 0%, transparent 55%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.015) 80px); }
        .noise { position: absolute; inset: 0; pointer-events: none; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }
        .selector-container { position: relative; max-width: 1200px; width: 100%; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .selector-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .iocl-logo-row { display: flex; align-items: center; gap: 16px; }
        .iocl-emblem { position: relative; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; }
        .emblem-ring { position: absolute; border-radius: 50%; border: 3px solid transparent; }
        .outer-ring { inset: 0; border-color: var(--iocl-orange); box-shadow: 0 0 12px rgba(244,121,32,0.4); }
        .inner-ring { inset: 8px; border-color: var(--iocl-blue); box-shadow: 0 0 8px rgba(0,48,135,0.5); }
        .emblem-core { width: 12px; height: 12px; border-radius: 50%; background: var(--iocl-orange); box-shadow: 0 0 8px var(--iocl-orange); }
        .iocl-wordmark { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .iocl-name { font-family: 'Rajdhani', sans-serif; font-size: 1.6rem; font-weight: 700; color: #f0f4ff; letter-spacing: -0.5px; }
        .iocl-tagline { font-family: 'Rajdhani', sans-serif; font-size: 0.62rem; font-weight: 600; letter-spacing: 3px; color: var(--iocl-orange); }
        .header-title { font-family: 'Rajdhani', sans-serif; font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #eef2ff; letter-spacing: -1px; line-height: 1.05; }
        .header-sub { font-size: 0.85rem; color: #5a6a88; max-width: 480px; line-height: 1.65; }
        .cards-row { display: flex; align-items: stretch; gap: 14px; width: 100%; }
        .machine-card { position: relative; flex: 1; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 0; cursor: pointer; text-align: left; display: flex; flex-direction: column; transition: all 0.3s ease; overflow: hidden; min-width: 0; }
        .card-streak { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 20px 20px 0 0; }
        .motor-streak { background: linear-gradient(90deg, var(--iocl-orange), rgba(244,121,32,0.2)); }
        .pump-streak { background: linear-gradient(90deg, var(--iocl-blue), rgba(0,48,135,0.2)); }
        .compressor-streak { background: linear-gradient(90deg, var(--iocl-teal), rgba(14,165,160,0.2)); }
        .turbine-streak { background: linear-gradient(90deg, var(--iocl-purple), rgba(124,58,237,0.2)); }
        .motor-card:hover { transform: translateY(-5px); border-color: rgba(244,121,32,0.35); background: rgba(244,121,32,0.04); box-shadow: 0 20px 60px rgba(244,121,32,0.1); }
        .pump-card:hover { transform: translateY(-5px); border-color: rgba(0,48,135,0.5); background: rgba(0,48,135,0.05); box-shadow: 0 20px 60px rgba(0,48,135,0.15); }
        .compressor-card:hover { transform: translateY(-5px); border-color: rgba(14,165,160,0.4); background: rgba(14,165,160,0.04); box-shadow: 0 20px 60px rgba(14,165,160,0.1); }
        .turbine-card:hover { transform: translateY(-5px); border-color: rgba(124,58,237,0.4); background: rgba(124,58,237,0.04); box-shadow: 0 20px 60px rgba(124,58,237,0.1); }
        .card-top { padding: 22px 20px 0; display: flex; align-items: center; gap: 12px; }
        .card-icon-wrap { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .motor-icon-bg { background: rgba(244,121,32,0.12); color: var(--iocl-orange); }
        .pump-icon-bg { background: rgba(0,48,135,0.15); color: #5b8af0; }
        .compressor-icon-bg { background: rgba(14,165,160,0.12); color: var(--iocl-teal); }
        .turbine-icon-bg { background: rgba(124,58,237,0.12); color: #a78bfa; }
        .card-icon { width: 30px; height: 30px; }
        .card-label { font-family: 'Rajdhani', sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 2.5px; padding: 3px 8px; border-radius: 5px; }
        .motor-label { background: rgba(244,121,32,0.12); color: var(--iocl-orange); border: 1px solid rgba(244,121,32,0.2); }
        .pump-label { background: rgba(0,48,135,0.15); color: #5b8af0; border: 1px solid rgba(0,48,135,0.25); }
        .compressor-label { background: rgba(14,165,160,0.12); color: var(--iocl-teal); border: 1px solid rgba(14,165,160,0.25); }
        .turbine-label { background: rgba(124,58,237,0.12); color: #a78bfa; border: 1px solid rgba(124,58,237,0.25); }
        .card-content { flex: 1; padding: 16px 20px; }
        .card-title { font-family: 'Rajdhani', sans-serif; font-size: 1.3rem; font-weight: 700; color: #e8eeff; margin-bottom: 8px; letter-spacing: -0.3px; }
        .card-desc { font-size: 0.8rem; color: #5a6a88; line-height: 1.6; margin-bottom: 14px; }
        .card-features { display: flex; flex-wrap: wrap; gap: 6px; }
        .feature-tag { font-family: 'Rajdhani', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 5px; }
        .motor-tag { background: rgba(244,121,32,0.08); border: 1px solid rgba(244,121,32,0.15); color: rgba(244,121,32,0.7); }
        .pump-tag { background: rgba(0,48,135,0.1); border: 1px solid rgba(0,48,135,0.2); color: #5b8af0; }
        .compressor-tag { background: rgba(14,165,160,0.08); border: 1px solid rgba(14,165,160,0.15); color: rgba(14,165,160,0.8); }
        .turbine-tag { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15); color: #a78bfa; }
        .motor-card:hover .motor-tag { border-color: rgba(244,121,32,0.35); color: var(--iocl-orange); }
        .pump-card:hover .pump-tag { border-color: rgba(0,48,135,0.45); color: #7aa3f7; }
        .compressor-card:hover .compressor-tag { border-color: rgba(14,165,160,0.4); color: var(--iocl-teal); }
        .turbine-card:hover .turbine-tag { border-color: rgba(124,58,237,0.4); color: #c4b5fd; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.05); font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; transition: all 0.3s ease; }
        .motor-footer { color: rgba(244,121,32,0.6); }
        .pump-footer { color: rgba(91,138,240,0.6); }
        .compressor-footer { color: rgba(14,165,160,0.6); }
        .turbine-footer { color: rgba(167,139,250,0.6); }
        .motor-card:hover .motor-footer { color: var(--iocl-orange); }
        .pump-card:hover .pump-footer { color: #7aa3f7; }
        .compressor-card:hover .compressor-footer { color: var(--iocl-teal); }
        .turbine-card:hover .turbine-footer { color: #c4b5fd; }
        .arrow { transition: transform 0.3s ease; font-size: 1rem; }
        .machine-card:hover .arrow { transform: translateX(5px); }
        .selector-footer { font-family: 'Rajdhani', sans-serif; font-size: 0.7rem; font-weight: 500; color: #2a3450; letter-spacing: 1px; }
        @media (max-width: 900px) { .cards-row { flex-wrap: wrap; } .machine-card { flex: 1 1 calc(50% - 7px); } }
        @media (max-width: 500px) { .machine-card { flex: 1 1 100%; } }
      `}</style>
    </main>
  )
}

export default function RootPage() {
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('iocl_session')
      if (s) setUser(JSON.parse(s))
    } catch {}
    setChecked(true)
  }, [])

  if (!checked) return null
  if (!user) return <AuthPage onLogin={(u) => { sessionStorage.setItem('iocl_session', JSON.stringify(u)); setUser(u) }} />
  return <OriginalHomePage />
}