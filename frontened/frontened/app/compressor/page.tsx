'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Wind } from 'lucide-react'
import { useRouter } from 'next/navigation'

const COMPRESSOR_API_URL  = process.env.NEXT_PUBLIC_COMPRESSOR_API_URL  ?? 'http://127.0.0.1:5050/predict/compressor'
const COMPRESSOR_SAVE_URL = process.env.NEXT_PUBLIC_COMPRESSOR_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_compressor_prediction.php'

type CompressorResult = {
  status: 'NORMAL' | 'FAULT' | 'DEGRADED'
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

export default function CompressorPage() {
  const router = useRouter()
  const [inputs, setInputs]   = useState<Record<string, string>>({})
  const [result, setResult]   = useState<CompressorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const fields = [
    { key: 'rpm',                 label: 'RPM',                   placeholder: 'e.g. 2950' },
    { key: 'motor_power',         label: 'Motor Power (kW)',       placeholder: 'e.g. 15.4' },
    { key: 'torque',              label: 'Torque (Nm)',            placeholder: 'e.g. 48.2' },
    { key: 'outlet_pressure_bar', label: 'Outlet Pressure (bar)', placeholder: 'e.g. 7.5'  },
    { key: 'air_flow',            label: 'Air Flow (CFM)',         placeholder: 'e.g. 320'  },
    { key: 'noise_db',            label: 'Noise (dB)',             placeholder: 'e.g. 72'   },
    { key: 'outlet_temp',         label: 'Outlet Temp (°C)',       placeholder: 'e.g. 85'   },
    { key: 'gaccx',               label: 'Accel X (G)',            placeholder: 'e.g. 0.12' },
    { key: 'gaccy',               label: 'Accel Y (G)',            placeholder: 'e.g. 0.09' },
    { key: 'gaccz',               label: 'Accel Z (G)',            placeholder: 'e.g. 0.15' },
    { key: 'haccx',               label: 'H-Accel X',              placeholder: 'e.g. 0.04' },
    { key: 'haccy',               label: 'H-Accel Y',              placeholder: 'e.g. 0.06' },
    { key: 'haccz',               label: 'H-Accel Z',              placeholder: 'e.g. 0.03' },
    { key: 'bearings',            label: 'Bearings',               placeholder: 'e.g. 0.21' },
  ]

  const handleChange = (key: string, val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)
    try {
      const res = await fetch(COMPRESSOR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, user_email: localStorage.getItem('user_email') ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)
      setSaved('Result saved to database.')
    } catch (err: any) {
      setError(err.message ?? 'Could not reach the compressor prediction API.')
    } finally { setLoading(false) }
  }

  const statusColor =
    result?.status === 'NORMAL'   ? '#0ea5a0' :
    result?.status === 'DEGRADED' ? '#f59e0b' : '#F47920'

  const statusBg =
    result?.status === 'NORMAL'   ? 'rgba(14,165,160,0.1)' :
    result?.status === 'DEGRADED' ? 'rgba(245,158,11,0.1)' : 'rgba(244,121,32,0.1)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => router.push('/compressor/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge compressor-badge">
              <Wind size={12} /> COMPRESSOR DIAGNOSTICS
            </div>
            <h1 className="page-title">Compressor Fault Predictor</h1>
            <p className="page-sub">Enter sensor readings to predict compressor health</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Sensor Readings</h2>
            <p className="section-sub">Enter values for the key sensors below (others default to median)</p>
            <div className="sensors-grid">
              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input
                    type="number" step="any" placeholder={placeholder}
                    value={inputs[key] ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input compressor-input"
                  />
                </div>
              ))}
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {saved  && <div className="alert alert-info">{saved}</div>}
            <button type="submit" disabled={loading} className="submit-btn compressor-btn">
              {loading
                ? <><span className="spin"><Minus size={18}/></span> Analyzing Compressor...</>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .page-root { min-height: 100vh; background: #04091a; font-family: 'DM Sans', sans-serif; position: relative; overflow-x: hidden; }
        .page-bg { position: fixed; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 50% at 15% 20%, rgba(14,165,160,0.06) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px); }
        .page-container { position: relative; max-width: 860px; margin: 0 auto; padding: 40px 20px 80px; display: flex; flex-direction: column; gap: 28px; }
        .page-header { display: flex; align-items: flex-start; gap: 20px; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #5a6a88; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; margin-top: 4px; }
        .back-btn:hover { background: rgba(14,165,160,0.06); color: #0ea5a0; border-color: rgba(14,165,160,0.3); }
        .page-header-text { flex: 1; }
        .page-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px; padding: 5px 12px; border-radius: 100px; margin-bottom: 12px; }
        .compressor-badge { color: #0ea5a0; background: rgba(14,165,160,0.1); border: 1px solid rgba(14,165,160,0.2); }
        .page-title { font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 700; color: #f0f4ff; font-family: 'Rajdhani', sans-serif; letter-spacing: -0.5px; margin-bottom: 6px; }
        .page-sub { font-size: 0.9rem; color: #5a6a88; }
        .card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 32px; position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #0ea5a0, rgba(14,165,160,0.2)); }
        .result-card { transition: border-color 0.3s; }
        .result-card::before { background: linear-gradient(90deg, var(--rc, #0ea5a0), rgba(14,165,160,0.2)); }
        .section-title { font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #e8eeff; margin-bottom: 6px; letter-spacing: 0.5px; }
        .section-sub { font-size: 0.85rem; color: #5a6a88; margin-bottom: 24px; }
        .sensors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 16px; margin-bottom: 24px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #5b8af0; }
        .field-input { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e8eeff; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; width: 100%; transition: border-color 0.2s; outline: none; }
        .field-input::placeholder { color: #2a3450; }
        .compressor-input:focus { border-color: rgba(14,165,160,0.5); }
        .alert { border-radius: 10px; padding: 12px 16px; font-size: 0.85rem; margin-bottom: 20px; font-family: 'Rajdhani', sans-serif; font-weight: 600; }
        .alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }
        .alert-info  { background: rgba(14,165,160,0.08); border: 1px solid rgba(14,165,160,0.2); color: #0ea5a0; }
        .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; color: #fff; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .compressor-btn { background: linear-gradient(135deg, #0d9488, #0ea5a0); }
        .compressor-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .spin { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-status-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
        .status-badge { font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 700; padding: 10px 24px; border-radius: 10px; border: 1px solid; letter-spacing: 2px; }
        .status-meta { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-family: 'Rajdhani', sans-serif; font-size: 10px; color: #2a3450; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
        .meta-value { font-family: 'Rajdhani', sans-serif; font-size: 1.2rem; font-weight: 700; color: #e8eeff; }
        .confidence-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; margin-bottom: 24px; }
        .confidence-bar { height: 100%; border-radius: 100px; transition: width 0.8s ease; }
        .recommendation-box { border: 1px solid; border-radius: 12px; padding: 16px 20px; }
        .rec-label { font-family: 'Rajdhani', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #2a3450; margin-bottom: 6px; }
        .rec-text { font-size: 0.95rem; color: #c8d5f0; line-height: 1.6; }
      `}</style>
    </main>
  )
}