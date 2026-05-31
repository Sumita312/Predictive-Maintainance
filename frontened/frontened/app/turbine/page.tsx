'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { pageStyles } from '../pump/page'

const TURBINE_API_URL  = process.env.NEXT_PUBLIC_TURBINE_API_URL  ?? 'http://127.0.0.1:5050/predict/turbine'
const TURBINE_SAVE_URL = process.env.NEXT_PUBLIC_TURBINE_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_turbine_prediction.php'

type TurbineResult = {
  status: 'NORMAL' | 'FAULT' | 'DEGRADED'
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

type Props = { onBack?: () => void }

export default function TurbinePage({ onBack }: Props) {
  const router = useRouter()
  const [inputs, setInputs]   = useState<Record<string, string>>({})
  const [result, setResult]   = useState<TurbineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const fields = [
    { key: 'rpm',          label: 'RPM',              placeholder: 'e.g. 3000'  },
    { key: 'temperature',  label: 'Temperature (K)',   placeholder: 'e.g. 850'  },
    { key: 'pressure',     label: 'Pressure (bar)',    placeholder: 'e.g. 12.4' },
    { key: 'vibration',    label: 'Vibration (mm/s)',  placeholder: 'e.g. 2.1'  },
    { key: 'power_output', label: 'Power Output (MW)', placeholder: 'e.g. 45'   },
  ]

  const handleChange = (key: string, val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)

    try {
      const res = await fetch(TURBINE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, user_email: localStorage.getItem('user_email') ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)

      setSaved('Result saved to database.')

    } catch (err: any) {
      setError(err.message ?? 'Could not reach the turbine prediction API.')
    } finally { setLoading(false) }
  }

  const statusColor =
    result?.status === 'NORMAL'   ? '#10b981' :
    result?.status === 'DEGRADED' ? '#f59e0b' : '#ef4444'

  const statusBg =
    result?.status === 'NORMAL'   ? 'rgba(16,185,129,0.1)' :
    result?.status === 'DEGRADED' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => onBack ? onBack() : router.push('/turbine/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge turbine-badge">
              <Zap size={12} /> TURBINE DIAGNOSTICS
            </div>
            <h1 className="page-title">Turbine Fault Predictor</h1>
            <p className="page-sub">Enter sensor readings to predict turbine health</p>
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
                    type="number"
                    step="any"
                    placeholder={placeholder}
                    value={inputs[key] ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input turbine-input"
                  />
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {saved && <div className="alert alert-info">{saved}</div>}

            <button type="submit" disabled={loading} className="submit-btn turbine-btn">
              {loading ? (
                <><span className="spin"><Minus size={18} /></span> Analyzing Turbine...</>
              ) : (
                <><Send size={18} /> Run Fault Detection</>
              )}
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

      <style>{pageStyles('turbine')}</style>
    </main>
  )
}