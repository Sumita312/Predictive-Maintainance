'use client'

import { useState, useEffect, useRef } from 'react'

const DUMMY_ALERTS = [
  { id: 'PH', name: 'Pump Unit H',   type: '💧 Pump',       block: 'Block 3', health: 22, status: 'BROKEN',      days: 4,  critical: true,  isReal: false },
  { id: 'MF', name: 'Motor Unit 6',  type: '⚡ Motor',      block: 'Block 4', health: 28, status: 'HIGH RISK',   days: 9,  critical: true,  isReal: false },
  { id: 'PC', name: 'Pump Unit C',   type: '💧 Pump',       block: 'Block 2', health: 31, status: 'BROKEN',      days: 6,  critical: true,  isReal: false },
  { id: 'MB', name: 'Motor Unit 2',  type: '⚡ Motor',      block: 'Block 2', health: 38, status: 'HIGH RISK',   days: 14, critical: true,  isReal: false },
  { id: 'MJ', name: 'Motor Unit 10', type: '⚡ Motor',      block: 'Block 3', health: 42, status: 'HIGH RISK',   days: 21, critical: true,  isReal: false },
  { id: 'PB', name: 'Pump Unit B',   type: '💧 Pump',       block: 'Block 1', health: 45, status: 'RECOVERING',  days: 22, critical: false, isReal: false },
  { id: 'PF', name: 'Pump Unit F',   type: '💧 Pump',       block: 'Block 4', health: 48, status: 'RECOVERING',  days: 25, critical: false, isReal: false },
  { id: 'MC', name: 'Motor Unit 3',  type: '⚡ Motor',      block: 'Block 3', health: 52, status: 'MEDIUM RISK', days: 28, critical: false, isReal: false },
]

const MACHINE_ICON: Record<string, string> = {
  MOTOR: '⚡ Motor', PUMP: '💧 Pump', COMPRESSOR: '🌀 Compressor', TURBINE: '⚙️ Turbine',
}

function mapStatus(prediction: string, risk_level: string) {
  if (['FAULT', 'FAULTY', 'BROKEN'].includes(prediction)) return 'BROKEN'
  if (prediction === 'DEGRADED') return 'MEDIUM RISK'
  if (prediction === 'RECOVERING') return 'RECOVERING'
  if (risk_level === 'High') return 'HIGH RISK'
  return 'MEDIUM RISK'
}

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
    BROKEN:        ['rgba(239,68,68,0.12)',   '#ef4444'],
    'HIGH RISK':   ['rgba(244,121,32,0.12)',  '#F47920'],
    RECOVERING:    ['rgba(245,158,11,0.12)',  '#f59e0b'],
    'MEDIUM RISK': ['rgba(245,158,11,0.1)',   '#f59e0b'],
    FAULT:         ['rgba(239,68,68,0.12)',   '#ef4444'],
    FAULTY:        ['rgba(239,68,68,0.12)',   '#ef4444'],
    DEGRADED:      ['rgba(245,158,11,0.12)',  '#f59e0b'],
  }
  const [bg, cl] = map[s] || ['rgba(91,138,240,0.12)', '#5b8af0']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cl, border: `1px solid ${cl}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cl }} />
      {s}
    </span>
  )
}

export default function AlertsPage() {
  const [allAlerts, setAllAlerts] = useState(DUMMY_ALERTS as any[])
  const [muted, setMuted] = useState(false)
  const [acked, setAcked] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})
  const audioCtx = useRef<AudioContext | null>(null)

  useEffect(() => {
    async function fetchReal() {
      try {
        const [motor, pump, compressor, turbine] = await Promise.all([
          fetch('http://127.0.0.1:5050/motor-history').then(r => r.json()),
          fetch('http://127.0.0.1:5050/pump-history').then(r => r.json()),
          fetch('http://127.0.0.1:5050/compressor-history').then(r => r.json()),
          fetch('http://127.0.0.1:5050/turbine-history').then(r => r.json()),
        ])
        const all = [
          ...motor.map((r: any) => ({ ...r, machine: 'MOTOR' })),
          ...pump.map((r: any) => ({ ...r, machine: 'PUMP' })),
          ...compressor.map((r: any) => ({ ...r, machine: 'COMPRESSOR' })),
          ...turbine.map((r: any) => ({ ...r, machine: 'TURBINE' })),
        ]
        const realAlerts = all
          .filter(r => ['FAULT', 'FAULTY', 'BROKEN', 'DEGRADED', 'RECOVERING'].includes(r.prediction))
          .map(r => ({
            id: `real-${r.machine}-${r.id}`,
            name: `${MACHINE_ICON[r.machine] || r.machine} — Live`,
            type: MACHINE_ICON[r.machine] || r.machine,
            block: 'Live Data',
            health: Math.round(100 - r.confidence),
            status: mapStatus(r.prediction, r.risk_level),
            days: r.risk_level === 'High' ? 3 : r.risk_level === 'Medium' ? 14 : 30,
            critical: r.risk_level === 'High',
            isReal: true,
            time: new Date(r.created_at).toLocaleString(),
          }))
        setAllAlerts([...realAlerts, ...DUMMY_ALERTS])
      } catch {
        setAllAlerts(DUMMY_ALERTS)
      }
    }
    fetchReal()
  }, [])

  const criticalUnacked = allAlerts.filter(a => a.critical && !acked.includes(a.id)).length

  function beep() {
    if (muted) return
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const ctx = audioCtx.current, osc = ctx.createOscillator(), g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'square'; osc.frequency.value = 780
      g.gain.setValueAtTime(0.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  useEffect(() => { if (!muted && criticalUnacked > 0) beep() }, [muted])
  useEffect(() => {
    if (muted || criticalUnacked === 0) return
    const t = setInterval(beep, 6000)
    return () => clearInterval(t)
  }, [muted, criticalUnacked])

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        .alert-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px 24px; transition: all 0.2s; position: relative; overflow: hidden; }
        .ack-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(14,165,160,0.3); background: rgba(14,165,160,0.08); color: #0ea5a0; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; transition: all 0.2s; }
        .ack-btn:hover { background: rgba(14,165,160,0.15); border-color: rgba(14,165,160,0.5); }
        .mute-btn { padding: 8px 20px; border-radius: 10px; border: 1px solid; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1.5px; background: transparent; transition: all 0.2s; }
        .note-input { flex: 1; padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 12px; outline: none; }
        .note-input:focus { border-color: rgba(244,121,32,0.4); }
        .save-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #5b8af0; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; transition: all 0.2s; }
        .save-btn:hover { border-color: rgba(91,138,240,0.4); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, padding: '3px 10px', borderRadius: 6, background: 'rgba(244,121,32,0.12)', color: '#F47920', border: '1px solid rgba(244,121,32,0.25)' }}>ALERTS</span>
          </div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f0f4ff', fontWeight: 700, fontSize: 28, margin: 0, letterSpacing: '-0.5px' }}>Active Alerts</h2>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 11, marginTop: 4, fontWeight: 600, letterSpacing: 2 }}>{criticalUnacked} UNACKNOWLEDGED CRITICAL</div>
        </div>
        <button className="mute-btn" onClick={() => setMuted(m => !m)}
          style={{ borderColor: muted ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.4)', color: muted ? '#2a3450' : '#ef4444' }}>
          {muted ? '🔇 UNMUTE' : '🔊 MUTE ALARM'}
        </button>
      </div>

      {!muted && criticalUnacked > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '14px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26, animation: 'blink 1s infinite' }}>🚨</span>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#ef4444', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>CRITICAL ALARM ACTIVE</div>
            <div style={{ color: '#fca5a5', fontSize: 13, marginTop: 2 }}>{criticalUnacked} machine(s) require immediate intervention</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allAlerts.map(a => {
          const isAcked = acked.includes(a.id)
          const streakColor = a.critical ? '#ef4444' : '#f59e0b'
          const borderColor = a.isReal
            ? 'rgba(244,121,32,0.4)'
            : a.critical ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'
          return (
            <div key={a.id} className="alert-card" style={{ border: `1px solid ${borderColor}`, opacity: isAcked ? 0.4 : 1 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${streakColor}, ${streakColor}22)`, borderRadius: '16px 16px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <HealthRing value={a.health} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 15, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.3 }}>
                      {a.name}
                      {a.isReal && <span style={{ marginLeft: 8, fontSize: 9, color: '#F47920', fontWeight: 700, letterSpacing: 1 }}>●LIVE</span>}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: '#2a3450', marginTop: 3, fontWeight: 600, letterSpacing: 1 }}>{a.type} · {a.block}</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: '#2a3450', marginTop: 3, fontWeight: 600, letterSpacing: 1 }}>
                      {a.isReal
                        ? <span style={{ color: '#5b8af0' }}>{a.time}</span>
                        : <span>FORECAST: <span style={{ color: a.days <= 14 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>~{a.days} DAYS</span></span>
                      }
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <StatusBadge s={a.status} />
                  {!isAcked && a.critical && <button className="ack-btn" onClick={() => setAcked(p => [...p, a.id])}>✓ ACKNOWLEDGE</button>}
                  {isAcked && <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: '#0ea5a0', fontWeight: 700, letterSpacing: 1 }}>✓ ACKNOWLEDGED</span>}
                </div>
              </div>
              {!isAcked && (
                <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: '#2a3450', fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>MAINTENANCE NOTE</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="note-input" placeholder="e.g. Scheduled inspection for tomorrow 9AM..."
                      value={noteInput[a.id] || ''} onChange={e => setNoteInput(p => ({ ...p, [a.id]: e.target.value }))} />
                    <button className="save-btn" onClick={() => setNotes(p => ({ ...p, [a.id]: noteInput[a.id] || '' }))}>SAVE</button>
                  </div>
                  {notes[a.id] && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>📝 {notes[a.id]}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}