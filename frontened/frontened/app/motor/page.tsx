'use client'

import { useState } from 'react'
import { Send, Minus, ArrowLeft, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { pageStyles } from '../pump/page'

const MOTOR_API_URL  = process.env.NEXT_PUBLIC_MOTOR_API_URL  ?? 'http://127.0.0.1:5050/predict/motor'
const MOTOR_SAVE_URL = process.env.NEXT_PUBLIC_MOTOR_SAVE_URL ?? 'http://127.0.0.1/nextjsbackend/save_motor_prediction.php'

type MotorResult = {
  status: 'HEALTHY' | 'FAULTY' | 'CRITICAL'
  confidence: number
  fault_type: string
  risk_level: 'Low' | 'Medium' | 'High'
  recommendation: string
}

type Props = { onBack?: () => void }

export default function MotorPage({ onBack }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    product_type:   'M',
    air_temp_k:     '',
    proc_temp_k:    '',
    rpm:            '',
    torque_nm:      '',
    tool_wear_min:  '',
  })

  const [result, setResult]   = useState<MotorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState<string | null>(null)

  const fields = [
    { key: 'air_temp_k',    label: 'Air Temperature (K)',      placeholder: 'e.g. 298.1' },
    { key: 'proc_temp_k',   label: 'Process Temperature (K)',  placeholder: 'e.g. 308.6' },
    { key: 'rpm',           label: 'Rotational Speed (RPM)',   placeholder: 'e.g. 1500'  },
    { key: 'torque_nm',     label: 'Torque (Nm)',              placeholder: 'e.g. 42.8'  },
    { key: 'tool_wear_min', label: 'Tool Wear (min)',          placeholder: 'e.g. 200'   },
  ]

  const handleChange = (key: string, val: string) =>
    setFormData(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null); setSaved(null)

    try {
      const res = await fetch(MOTOR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ ...formData, user_email: localStorage.getItem('user_email') ?? '' }),      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `API error ${res.status}`)
      setResult(data)

      setSaved('Result saved to database.')

    } catch (err: any) {
      setError(err.message ?? 'Could not reach the motor prediction API.')
    } finally { setLoading(false) }
  }

  const statusColor =
    result?.status === 'HEALTHY'  ? '#10b981' :
    result?.status === 'FAULTY'   ? '#f59e0b' : '#ef4444'

  const statusBg =
    result?.status === 'HEALTHY'  ? 'rgba(16,185,129,0.1)' :
    result?.status === 'FAULTY'   ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'

  return (
    <main className="page-root">
      <div className="page-bg" />
      <div className="page-container">

        <div className="page-header">
          <button onClick={() => onBack ? onBack() : router.push('/motor/diagnostics')} className="back-btn">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="page-header-text">
            <div className="page-badge motor-badge">
              <Zap size={12} /> MOTOR DIAGNOSTICS
            </div>
            <h1 className="page-title">Motor Fault Predictor</h1>
            <p className="page-sub">Enter vibration, current, and operational data for fault detection</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">Motor Parameters</h2>
            <p className="section-sub">AI4I dataset fields — matches your trained model exactly</p>

            <div className="sensors-grid">
              <div className="field">
                <label className="field-label">Product Type</label>
                <select
                  value={formData.product_type}
                  onChange={e => handleChange('product_type', e.target.value)}
                  className="field-input motor-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="L">L — Low quality</option>
                  <option value="M">M — Medium quality</option>
                  <option value="H">H — High quality</option>
                </select>
              </div>

              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="field">
                  <label className="field-label">{label}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={placeholder}
                    value={(formData as any)[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    className="field-input motor-input"
                    required
                  />
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {saved && <div className="alert alert-info">{saved}</div>}

            <button type="submit" disabled={loading} className="submit-btn motor-btn">
              {loading ? (
                <><span className="spin"><Minus size={18}/></span> Analyzing Motor...</>
              ) : (
                <><Send size={18}/> Run Fault Detection</>
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
                <span className="meta-label">Fault Type</span>
                <span className="meta-value" style={{ fontSize: '0.95rem' }}>{result.fault_type}</span>
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

      <style>{pageStyles('motor')}</style>
    </main>
  )
}