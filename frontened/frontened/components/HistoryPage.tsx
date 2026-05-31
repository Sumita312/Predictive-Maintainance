'use client'

import { useState, useEffect } from 'react'

function genDummyHistory() {
  const rows = []
  const machines = ['PA', 'PB', 'PC', 'MA', 'MB', 'CA', 'CB', 'TA', 'TB', 'PD']
  const events = ['Temperature spike', 'Vibration anomaly', 'Pressure drop', 'Wear threshold exceeded', 'Speed deviation', 'Routine inspection', 'Lubrication alert', 'Seal check required', 'Cavitation detected', 'Bearing overload']
  const levels = ['Normal', 'Warning', 'Critical', 'Normal', 'Warning', 'Critical', 'Warning', 'Normal', 'Critical', 'Warning']
  for (let i = 0; i < 50; i++) {
    const d = new Date(); d.setHours(d.getHours() - (i + 10) * 2)
    rows.push({ id: `dummy-${i}`, machine: machines[i % 10], event: events[i % 10], level: levels[i % 10], time: d.toLocaleString(), value: (Math.random() * 100).toFixed(2), isReal: false })
  }
  return rows
}

const DUMMY_HISTORY = genDummyHistory()

function mapLevel(prediction: string, risk_level: string) {
  if (['FAULT', 'FAULTY', 'BROKEN'].includes(prediction)) return 'Critical'
  if (['DEGRADED', 'RECOVERING'].includes(prediction)) return 'Warning'
  if (risk_level === 'High') return 'Critical'
  if (risk_level === 'Medium') return 'Warning'
  return 'Normal'
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    Normal:   ['rgba(14,165,160,0.12)',  '#0ea5a0'],
    Warning:  ['rgba(245,158,11,0.12)',  '#f59e0b'],
    Critical: ['rgba(239,68,68,0.12)',   '#ef4444'],
  }
  const [bg, cl] = map[s] || ['rgba(91,138,240,0.12)', '#5b8af0']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: cl, border: `1px solid ${cl}44`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cl }} />
      {s}
    </span>
  )
}

export default function HistoryPage() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [allRows, setAllRows] = useState(DUMMY_HISTORY as any[])

  useEffect(() => {
    async function fetchReal() {
      try {
        
        const email = localStorage.getItem('user_email') ?? ''
const [motor, pump, compressor, turbine] = await Promise.all([
  fetch(`http://127.0.0.1:5050/motor-history?email=${encodeURIComponent(email)}`).then(r => r.json()),
  fetch(`http://127.0.0.1:5050/pump-history?email=${encodeURIComponent(email)}`).then(r => r.json()),
  fetch(`http://127.0.0.1:5050/compressor-history?email=${encodeURIComponent(email)}`).then(r => r.json()),
  fetch(`http://127.0.0.1:5050/turbine-history?email=${encodeURIComponent(email)}`).then(r => r.json()),
])
        const real = [
  ...motor.map((r: any) => ({ id: `motor-${r.id}`, machine: 'MOTOR', event: `Motor prediction: ${r.prediction}`, level: mapLevel(r.prediction, r.risk_level), time: new Date(r.created_at).toLocaleString(), value: `${r.confidence}%`, isReal: true, rawTime: r.created_at })),
  ...pump.map((r: any) => ({ id: `pump-${r.id}`, machine: 'PUMP', event: `Pump prediction: ${r.prediction}`, level: mapLevel(r.prediction, r.risk_level), time: new Date(r.created_at).toLocaleString(), value: `${r.confidence}%`, isReal: true, rawTime: r.created_at })),
  ...compressor.map((r: any) => ({ id: `comp-${r.id}`, machine: 'COMPRESSOR', event: `Compressor prediction: ${r.prediction}`, level: mapLevel(r.prediction, r.risk_level), time: new Date(r.created_at).toLocaleString(), value: `${r.confidence}%`, isReal: true, rawTime: r.created_at })),
  ...turbine.map((r: any) => ({ id: `turb-${r.id}`, machine: 'TURBINE', event: `Turbine prediction: ${r.prediction}`, level: mapLevel(r.prediction, r.risk_level), time: new Date(r.created_at).toLocaleString(), value: `${r.confidence}%`, isReal: true, rawTime: r.created_at })),
].sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())
        setAllRows([...real, ...DUMMY_HISTORY])
      } catch {
        setAllRows(DUMMY_HISTORY)
      }
    }
    fetchReal()
  }, [])

  const rows = allRows.filter(r =>
    (filter === 'All' || r.level === filter) &&
    (r.machine.toLowerCase().includes(search.toLowerCase()) || r.event.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding: 28, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .hist-input { padding: 9px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.025); color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; width: 240px; transition: border-color 0.2s; }
        .hist-input:focus { border-color: rgba(244,121,32,0.4); }
        .filter-tab { padding: 6px 18px; border-radius: 8px; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #2a3450; }
        .filter-tab.active { background: rgba(244,121,32,0.12); color: #F47920; border-color: rgba(244,121,32,0.35); }
        .filter-tab:not(.active):hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
        .h-th { padding: 10px 16px; text-align: left; font-family: 'Rajdhani', sans-serif; font-size: 11px; color: #2a3450; font-weight: 700; letter-spacing: 0.08em; background: rgba(255,255,255,0.02); }
        .h-td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        tr:hover td { background: rgba(244,121,32,0.02) !important; }
        .real-row { border-left: 3px solid #F47920; }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, padding: '3px 10px', borderRadius: 6, background: 'rgba(91,138,240,0.12)', color: '#5b8af0', border: '1px solid rgba(91,138,240,0.25)' }}>HISTORY</span>
        </div>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", color: '#f0f4ff', fontWeight: 700, fontSize: 28, margin: 0, letterSpacing: '-0.5px' }}>Event History</h2>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", color: '#2a3450', fontSize: 11, marginTop: 4, fontWeight: 600, letterSpacing: 2 }}>SENSOR EVENTS · ALERTS · INSPECTIONS</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="hist-input" placeholder="Search machine or event..." value={search} onChange={e => setSearch(e.target.value)} />
        {['All', 'Normal', 'Warning', 'Critical'].map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: '#2a3450', marginLeft: 'auto', fontWeight: 600, letterSpacing: 1.5 }}>{rows.length} RECORDS</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['#', 'Machine', 'Event', 'Level', 'Value', 'Timestamp'].map(h => <th key={h} className="h-th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={r.isReal ? 'real-row' : ''} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td className="h-td" style={{ color: '#2a3450', fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{i + 1}</td>
                <td className="h-td" style={{ color: r.isReal ? '#F47920' : '#5b8af0', fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", fontSize: 14, letterSpacing: 0.5 }}>
                  {r.machine} {r.isReal && <span style={{ fontSize: 9, color: '#F47920', fontWeight: 700, letterSpacing: 1 }}>●LIVE</span>}
                </td>
                <td className="h-td" style={{ color: '#e2e8f0' }}>{r.event}</td>
                <td className="h-td"><StatusBadge s={r.level} /></td>
                <td className="h-td" style={{ color: '#2a3450', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12 }}>{r.value}</td>
                <td className="h-td" style={{ color: '#2a3450', fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#2a3450', fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 2 }}>NO RECORDS FOUND</div>}
      </div>
    </div>
  )
}