'use client'

import { User } from '@/app/page'

export default function ProfilePage({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div style={{ padding: 28, maxWidth: 580, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .prof-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logout-red { width: 100%; padding: 13px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.3); cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'Rajdhani', sans-serif; letter-spacing: 2px; background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08)); color: #ef4444; margin-top: 22px; transition: all 0.2s; }
        .logout-red:hover { background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15)); border-color: rgba(239,68,68,0.5); }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, padding: '3px 10px', borderRadius: 6, background: 'rgba(244,121,32,0.12)', color: '#F47920', border: '1px solid rgba(244,121,32,0.25)' }}>PROFILE</span>
        </div>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f0f4ff', fontWeight: 700, fontSize: 28, margin: 0, letterSpacing: '-0.5px' }}>My Profile</h2>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 11, marginTop: 4, fontWeight: 600, letterSpacing: 2 }}>ACCOUNT DETAILS · ACCESS LEVEL</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F47920, rgba(244,121,32,0.2))', borderRadius: '20px 20px 0 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid #F47920', boxShadow: '0 0 12px rgba(244,121,32,0.3)' }} />
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid #003087' }} />
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, color: '#F47920' }}>{user.name?.[0]?.toUpperCase() || 'U'}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.3px' }}>{user.name}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#F47920', fontSize: 10, fontWeight: 700, letterSpacing: 2.5, marginTop: 4 }}>FIELD ENGINEER</div>
            <div style={{ color: '#2a3450', fontSize: 13, marginTop: 4 }}>{user.dept || 'Maintenance'} Department</div>
          </div>
        </div>
        {[
          ['📧 EMAIL',        user.email],
          ['🪪 EMPLOYEE ID',  user.empId || '—'],
          ['🏢 ORGANISATION', 'Indian Oil Corporation Limited'],
          ['📍 PLANT',        'Guwahati Refinery, Assam'],
          ['🔐 ACCESS',       'Field Engineer — Monitor & Predict'],
        ].map(([k, v]) => (
          <div key={k} className="prof-row">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", color: '#5b8af0', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>{k}</span>
            <span style={{ color: '#8899bb', fontSize: 13 }}>{v}</span>
          </div>
        ))}
        <button className="logout-red" onClick={onLogout}>🚪 LOGOUT FROM SYSTEM</button>
      </div>
    </div>
  )
}