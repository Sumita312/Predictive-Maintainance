'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '../page'
import Dashboard from '@/components/Dashboard'
import AlertsPage from '@/components/AlertsPage'
import HistoryPage from '@/components/HistoryPage'
import ReportPage from '@/components/ReportPage'
import ProfilePage from '@/components/ProfilePage'

type Page = 'dashboard' | 'alerts' | 'history' | 'report' | 'profile'

const NAV: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard'  },
  { id: 'alerts',    icon: '🔔', label: 'Alerts'     },
  { id: 'history',   icon: '📋', label: 'History'    },
  { id: 'report',    icon: '📄', label: 'Reports'    },
  { id: 'profile',   icon: '👤', label: 'Profile'    },
]

export default function DashboardLayout() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const criticalCount = 5

  useEffect(() => {
    try {
      const s = sessionStorage.getItem('iocl_session')
      if (!s) { router.push('/'); return }
      setUser(JSON.parse(s))
    } catch { router.push('/') }
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('iocl_session')
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#04091a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 13, letterSpacing: 3, fontWeight: 700 }}>LOADING...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#04091a', fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #04091a; }
        ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 3px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 13px; border-radius: 0 10px 10px 0; margin: 2px 8px; border-left: 3px solid transparent; font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: 0.5px; transition: all 0.15s; color: #2a3450; }
        .nav-item:hover { color: #e2e8f0; background: rgba(255,255,255,0.04); }
        .nav-item.active { background: linear-gradient(90deg, rgba(244,121,32,0.12), rgba(244,121,32,0.04)); color: #F47920; border-left-color: #F47920; font-weight: 700; }
        .logout-btn { width: 100%; padding: 9px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #2a3450; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; transition: all 0.2s; }
        .logout-btn:hover { border-color: rgba(244,121,32,0.3); color: #F47920; background: rgba(244,121,32,0.05); }
        .machine-suite-btn { display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer; font-size: 13px; border-radius: 0 10px 10px 0; margin: 2px 8px; border-left: 3px solid rgba(14,165,160,0.5); font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: 0.5px; background: rgba(14,165,160,0.06); color: #0ea5a0; border-top: none; border-right: none; border-bottom: none; transition: all 0.15s; width: calc(100% - 16px); }
        .machine-suite-btn:hover { background: rgba(14,165,160,0.12); color: #2dd4d0; border-left-color: #0ea5a0; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.07) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.010) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.010) 80px)` }} />

      <div style={{ width: 230, background: 'rgba(255,255,255,0.018)', borderRight: '1px solid rgba(255,255,255,0.07)', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #F47920', boxShadow: '0 0 10px rgba(244,121,32,0.35)' }} />
              <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '2.5px solid #003087', boxShadow: '0 0 6px rgba(0,48,135,0.4)' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F47920', boxShadow: '0 0 6px #F47920' }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 17, fontWeight: 700, color: '#F47920', letterSpacing: 2 }}>IndianOil</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 8, color: '#2a3450', letterSpacing: 2, fontWeight: 600 }}>PREDICTIVE MAINTENANCE</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#1a2540', marginTop: 6, letterSpacing: 1.5, fontWeight: 600 }}>Guwahati Refinery</div>
        </div>

        <div style={{ flex: 1, paddingTop: 8 }}>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.id === 'alerts' && criticalCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#F47920', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" }}>{criticalCount}</span>
              )}
            </div>
          ))}
          <div style={{ margin: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          <button className="machine-suite-btn" onClick={() => router.push('/')}>
            <span style={{ fontSize: 15 }}>⚙️</span>
            <span>Machine Suite</span>
            <span style={{ marginLeft: 'auto', fontSize: 11 }}>↗</span>
          </button>
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #F47920, #c47a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14, fontFamily: "'Rajdhani', sans-serif", flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: '#2a3450', letterSpacing: 1.5, fontWeight: 600 }}>FIELD ENGINEER</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>🚪 LOGOUT</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(4,9,26,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: '#5b8af0', fontWeight: 700, letterSpacing: 3 }}>
            {NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label?.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {criticalCount > 0 && (
              <div onClick={() => setPage('alerts')} style={{ background: 'rgba(244,121,32,0.1)', border: '1px solid rgba(244,121,32,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#F47920', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: 1 }}>
                🚨 {criticalCount} Critical
              </div>
            )}
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#2a3450', fontWeight: 600, letterSpacing: 1 }}>{user.name.toUpperCase()}</div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #F47920, #c47a10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 12, fontFamily: "'Rajdhani', sans-serif" }}>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {page === 'dashboard' && <Dashboard setPage={setPage} user={user} />}
        {page === 'alerts'    && <AlertsPage />}
        {page === 'history'   && <HistoryPage />}
        {page === 'report'    && <ReportPage />}
        {page === 'profile'   && <ProfilePage user={user} onLogout={handleLogout} />}
      </div>
    </div>
  )
}