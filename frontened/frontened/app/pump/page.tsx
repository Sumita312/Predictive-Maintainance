'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PUMP_API_URL  = process.env.NEXT_PUBLIC_PUMP_API_URL  ?? 'http://127.0.0.1:5050/predict/pump'
const PUMP_SAVE_URL = process.env.NEXT_PUBLIC_PUMP_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_pump_prediction.php'

type PumpResult = {
  status: 'NORMAL' | 'BROKEN' | 'RECOVERING'
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

export default function PumpPage() {
  const router = useRouter()
  const [sensors, setSensors] = useState<Record<string, string>>({})
  const [result, setResult]   = useState<PumpResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const sensorFields = [
    { key: 'sensor_00', label: 'Sensor 00', placeholder: 'e.g. 2.45' },
    { key: 'sensor_02', label: 'Sensor 02', placeholder: 'e.g. 47.3' },
    { key: 'sensor_03', label: 'Sensor 03', placeholder: 'e.g. 0.82' },
    { key: 'sensor_04', label: 'Sensor 04', placeholder: 'e.g. 1.15' },
    { key: 'sensor_05', label: 'Sensor 05', placeholder: 'e.g. 0.64' },
    { key: 'sensor_06', label: 'Sensor 06', placeholder: 'e.g. 3.72' },
    { key: 'sensor_07', label: 'Sensor 07', placeholder: 'e.g. 0.91' },
    { key: 'sensor_08', label: 'Sensor 08', placeholder: 'e.g. 2.18' },
    { key: 'sensor_09', label: 'Sensor 09', placeholder: 'e.g. 0.55' },
    { key: 'sensor_10', label: 'Sensor 10', placeholder: 'e.g. 1.37' },
    { key: 'sensor_11', label: 'Sensor 11', placeholder: 'e.g. 0.79' },
    { key: 'sensor_12', label: 'Sensor 12', placeholder: 'e.g. 4.01' },
  ]

  const handleChange = (key: string, val: string) =>
    setSensors(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)

    try {
      const res = await fetch(PUMP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensors),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)

      setSaved('Result saved to database.')

    } catch (err: any) {
      setError(err.message ?? 'Could not reach the pump prediction API.')
    } finally { setLoading(false) }
  }

  const statusColor =
    result?.status === 'NORMAL'     ? '#10b981' :
    result?.status === 'RECOVERING' ? '#f59e0b' : '#ef4444'

  const statusBg =
    result?.status === 'NORMAL'     ? 'rgba(16,185,129,0.1)' :
    result?.status === 'RECOVERING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => router.push('/pump/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge pump-badge">
              <Activity size={12} /> PUMP DIAGNOSTICS
            </div>
            <h1 className="page-title">Pump Fault Predictor</h1>
            <p className="page-sub">Enter key sensor readings to predict pump status</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Sensor Readings</h2>
            <p className="section-sub">Enter values for the key sensors below (others default to median)</p>

            <div className="sensors-grid">
              {sensorFields.map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={placeholder}
                    value={sensors[key] ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input pump-input"
                  />
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {saved  && <div className="alert alert-info">{saved}</div>}

            <button type="submit" disabled={loading} className="submit-btn pump-btn">
              {loading
                ? <><span className="spin"><Minus size={18}/></span> Analyzing Pump...</>
                : <><Send size={18}/> Run Fault Detection</>}
            </button>
          </form>
        </div>

        {result && (
          <div className="card result-card" style={{ borderColor: statusColor + '44' }}>
            <h2 className="section-title">Prediction Result</h2>
            <div className="result-status-row">
              <div className="status-badge" style={{ background: statusBg, color: statusColor, borderColor: statusColor + '55' }}>
                {result.status}
              </div>
              <div className="status-meta">
                <span className="meta-label">Confidence</span>
                <span className="meta-value" style={{ color: statusColor }}>{result.confidence}%</span>
              </div>
              <div className="status-meta">
                <span className="meta-label">Risk Level</span>
                <span className="meta-value">{result.risk_level}</span>
              </div>
            </div>
            <div className="confidence-bar-wrap">
              <div className="confidence-bar" style={{ width: `${result.confidence}%`, background: statusColor }} />
            </div>
            <div className="recommendation-box" style={{ borderColor: statusColor + '33', background: statusBg }}>
              <p className="rec-label">Recommendation</p>
              <p className="rec-text">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
      <style>{pageStyles('pump')}</style>
    </main>
  )
}

export function pageStyles(type: 'pump' | 'motor' | 'turbine') {
  const accentDim = type === 'pump' ? 'rgba(16,185,129,' : type === 'turbine' ? 'rgba(124,58,237,' : 'rgba(59,130,246,'
  return `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .page-root { min-height: 100vh; background: #0a0e1a; font-family: 'Space Grotesk', sans-serif; position: relative; overflow-x: hidden; }
    .page-bg { position: fixed; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 50% at 15% 20%, ${accentDim}0.06) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.015) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.015) 60px); }
    .page-container { position: relative; max-width: 860px; margin: 0 auto; padding: 40px 20px 80px; display: flex; flex-direction: column; gap: 28px; }
    .page-header { display: flex; align-items: flex-start; gap: 20px; }
    .back-btn { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #8899bb; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-family: 'Space Grotesk', sans-serif; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; margin-top: 4px; }
    .back-btn:hover { background: rgba(255,255,255,0.08); color: #e8eeff; }
    .page-header-text { flex: 1; }
    .page-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 2px; padding: 5px 12px; border-radius: 100px; margin-bottom: 12px; }
    .pump-badge { color: #10b981; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
    .motor-badge { color: #60a5fa; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); }
    .turbine-badge { color: #a78bfa; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); }
    .page-title { font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 700; color: #f0f4ff; letter-spacing: -0.5px; margin-bottom: 6px; }
    .page-sub { font-size: 0.9rem; color: #6b7a99; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 32px; }
    .result-card { transition: border-color 0.3s; }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #e8eeff; margin-bottom: 6px; }
    .section-sub { font-size: 0.85rem; color: #6b7a99; margin-bottom: 24px; }
    .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; margin-bottom: 24px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #6b7a99; }
    .field-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e8eeff; font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; width: 100%; transition: border-color 0.2s; }
    .field-input::placeholder { color: #2d3a55; }
    .field-input:focus { outline: none; }
    .pump-input:focus { border-color: rgba(16,185,129,0.5); }
    .motor-input:focus { border-color: rgba(59,130,246,0.5); }
    .turbine-input:focus { border-color: rgba(124,58,237,0.5); }
    .alert { border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; }
    .alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }
    .alert-info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: #93c5fd; }
    .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; color: #fff; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pump-btn { background: linear-gradient(135deg, #059669, #10b981); }
    .motor-btn { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
    .turbine-btn { background: linear-gradient(135deg, #6d28d9, #7c3aed); }
    .pump-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .motor-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .turbine-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .result-status-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
    .status-badge { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 700; padding: 10px 24px; border-radius: 10px; border: 1px solid; letter-spacing: 2px; }
    .status-meta { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 0.75rem; color: #6b7a99; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
    .meta-value { font-size: 1.2rem; font-weight: 700; color: #e8eeff; }
    .confidence-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; margin-bottom: 24px; }
    .confidence-bar { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
    .recommendation-box { border: 1px solid; border-radius: 12px; padding: 16px 20px; }
    .rec-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #6b7a99; margin-bottom: 6px; }
    .rec-text { font-size: 0.95rem; color: #c8d5f0; line-height: 1.6; }
  `
}