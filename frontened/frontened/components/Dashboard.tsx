'use client'

import { useState, useEffect } from 'react'
import { User } from '@/app/page'

type Page = 'dashboard' | 'alerts' | 'history' | 'report' | 'profile'

function MiniChart({ color, base, variance }: { color: string; base: number; variance: number }) {
  const MAX = 20
  const init = () => Array.from({ length: MAX }, () => base + (Math.random() - 0.5) * variance * 2)
  const [pts, setPts] = useState<number[]>(init)
  useEffect(() => {
    const t = setInterval(() => {
      setPts(prev => {
        const next = [...prev.slice(1)]
        next.push(Math.max(0, prev[prev.length - 1] + (Math.random() - 0.48) * variance))
        return next
      })
    }, 1500)
    return () => clearInterval(t)
  }, [variance])

  const w = 300, h = 70
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
  const path = pts.map((v, i) => {
    const x = ((i / (pts.length - 1)) * w).toFixed(1)
    const y = (h - 4 - ((v - min) / range) * (h - 16)).toFixed(1)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
  const area = `M0,${h} L${pts.map((v, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / range) * (h - 16)).toFixed(1)}`).join(' L')} L${w},${h} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(f => <line key={f} x1={0} y1={h - 4 - f * (h - 16)} x2={w} y2={h - 4 - f * (h - 16)} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} strokeDasharray="4,4" />)}
      <path d={area} fill={`url(#g-${color.replace('#', '')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {(() => { const last = pts[pts.length - 1]; const cy = h - 4 - ((last - min) / range) * (h - 16); return <circle cx={w} cy={cy} r={4} fill={color} /> })()}
    </svg>
  )
}

const STATS = [
  { label: 'PUMPS',      val: 10, color: '#5b8af0', icon: '💧' },
  { label: 'MOTORS',     val: 10, color: '#F47920',  icon: '⚡' },
  { label: 'CRITICAL',   val: 5,  color: '#ef4444',  icon: '🚨' },
  { label: 'WARNINGS',   val: 7,  color: '#f59e0b',  icon: '⚠️' },
  { label: 'NORMAL',     val: 8,  color: '#0ea5a0',  icon: '✅' },
  { label: 'AVG HEALTH', val: 71, color: '#a78bfa',  icon: '❤️', suffix: '%' },
]

const ATTENTION = [
  { name: 'Pump Unit C',  type: '💧 Pump',  block: 'Block 2', health: 31, status: 'BROKEN',    days: 6  },
  { name: 'Motor Unit 6', type: '⚡ Motor', block: 'Block 4', health: 28, status: 'HIGH RISK',  days: 9  },
  { name: 'Pump Unit H',  type: '💧 Pump',  block: 'Block 3', health: 22, status: 'BROKEN',    days: 4  },
  { name: 'Motor Unit 2', type: '⚡ Motor', block: 'Block 2', health: 38, status: 'HIGH RISK',  days: 14 },
  { name: 'Pump Unit B',  type: '💧 Pump',  block: 'Block 1', health: 45, status: 'RECOVERING', days: 22 },
]

function HealthRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = 18, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
  const color = value > 70 ? '#0ea5a0' : value > 40 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${(value / 100) * circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize={10} fontWeight="700" fontFamily="'Rajdhani', sans-serif">{value}</text>
    </svg>
  )
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    BROKEN:      ['rgba(239,68,68,0.12)',   '#ef4444'],
    'HIGH RISK': ['rgba(244,121,32,0.12)',  '#F47920'],
    RECOVERING:  ['rgba(245,158,11,0.12)',  '#f59e0b'],
    HEALTHY:     ['rgba(14,165,160,0.12)',  '#0ea5a0'],
  }
  const [bg, cl] = map[s] || ['rgba(91,138,240,0.12)', '#5b8af0']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cl, border: `1px solid ${cl}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cl, display: 'inline-block' }} />
      {s}
    </span>
  )
}

export default function Dashboard({ setPage, user }: { setPage: (p: Page) => void; user: User }) {
  const [bars, setBars] = useState(() => Array.from({ length: 24 }, () => 50 + Math.random() * 40))
  useEffect(() => {
    const t = setInterval(() => setBars(prev => { const n = [...prev.slice(1)]; n.push(Math.max(20, Math.min(100, prev[prev.length - 1] + (Math.random() - 0.5) * 12))); return n }), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .d-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; position: relative; overflow: hidden; }
        .d-th { padding: 10px 16px; text-align: left; font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #2a3450; font-weight: 700; letter-spacing: 0.08em; background: rgba(255,255,255,0.02); }
        .d-td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .d-nav-btn { padding: 6px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Rajdhani', sans-serif; background: rgba(255,255,255,0.04); color: #5b8af0; letter-spacing: 1px; transition: all 0.15s; }
        .d-nav-btn:hover { border-color: rgba(244,121,32,0.4); color: #F47920; background: rgba(244,121,32,0.06); }
        tr:hover td { background: rgba(244,121,32,0.02) !important; }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #F47920', boxShadow: '0 0 8px rgba(244,121,32,0.3)' }} />
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid #003087' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F47920' }} />
          </div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f0f4ff', fontWeight: 700, fontSize: 28, margin: 0, letterSpacing: '-0.5px' }}>System Dashboard</h2>
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 11, marginTop: 4, fontWeight: 600, letterSpacing: 2 }}>
          IOCL GUWAHATI REFINERY · {user.name.toUpperCase()} · {new Date().toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14, marginBottom: 24 }}>
        {STATS.map(c => (
          <div key={c.label} className="d-card" style={{ padding: '16px 18px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c.color}, ${c.color}33)`, borderRadius: '16px 16px 0 0' }} />
            <div style={{ fontSize: 20, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}{(c as any).suffix || ''}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: '#2a3450', marginTop: 5, fontWeight: 700, letterSpacing: '0.1em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="d-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5b8af0, rgba(91,138,240,0.2))', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#5b8af0', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>💧 PUMP PRESSURE TREND</div>
          <MiniChart color="#5b8af0" base={52} variance={8} />
        </div>
        <div className="d-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F47920, rgba(244,121,32,0.2))', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#F47920', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>⚡ MOTOR TEMP TREND</div>
          <MiniChart color="#F47920" base={308} variance={4} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="d-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #a78bfa, rgba(167,139,250,0.2))', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#5b8af0', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 }}>24-HOUR SYSTEM HEALTH</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 70 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, height: `${b}%`, borderRadius: '2px 2px 0 0', background: b > 70 ? '#0ea5a0' : b > 40 ? '#f59e0b' : '#ef4444', opacity: 0.8, transition: 'height 0.6s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: '#2a3450', marginTop: 8, fontWeight: 600, letterSpacing: 1 }}>
            <span>00:00</span><span>12:00</span><span>NOW</span>
          </div>
        </div>
        <div className="d-card">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F47920, rgba(244,121,32,0.2))', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#5b8af0', fontWeight: 700, fontSize: 11, letterSpacing: 2.5, marginBottom: 16 }}>FLEET STATUS</div>
          {[['Critical', 5, '#ef4444'], ['Warning', 7, '#f59e0b'], ['Normal', 8, '#0ea5a0']].map(([s, n, c]) => (
            <div key={s as string} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Rajdhani', sans-serif", fontSize: 11, marginBottom: 5, fontWeight: 700 }}>
                <span style={{ color: c as string }}>{s}</span>
                <span style={{ color: '#2a3450' }}>{n as number}/20</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 5 }}>
                <div style={{ width: `${((n as number) / 20) * 100}%`, height: 5, background: c as string, borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: '#2a3450', fontWeight: 600, letterSpacing: 1.5 }}>OVERALL HEALTH</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 30, fontWeight: 700, color: '#f59e0b' }}>71%</div>
          </div>
        </div>
      </div>

      <div className="d-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px' }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#5b8af0', fontWeight: 700, fontSize: 11, letterSpacing: 2.5 }}>⚠ MACHINES NEEDING ATTENTION</div>
          <button className="d-nav-btn" onClick={() => setPage('alerts')}>Alerts →</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Machine', 'Type', 'Block', 'Health', 'Status', 'Forecast'].map(h => <th key={h} className="d-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {ATTENTION.map((m, i) => (
              <tr key={m.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td className="d-td" style={{ color: '#f0f4ff', fontWeight: 600, fontFamily: "'Rajdhani', sans-serif" }}>{m.name}</td>
                <td className="d-td" style={{ color: '#2a3450', fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{m.type}</td>
                <td className="d-td" style={{ color: '#2a3450', fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{m.block}</td>
                <td className="d-td"><HealthRing value={m.health} /></td>
                <td className="d-td"><StatusBadge s={m.status} /></td>
                <td className="d-td" style={{ color: m.days <= 14 ? '#ef4444' : m.days <= 30 ? '#f59e0b' : '#0ea5a0', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>~{m.days}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}