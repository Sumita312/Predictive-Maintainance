'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

type GraphPoint = { time: string; value: number; prediction: string }

interface GlobalData {
  motorGraph: GraphPoint[]
  pumpGraph: GraphPoint[]
  compressorGraph: GraphPoint[]
  turbineGraph: GraphPoint[]
  healthBars: { hour: string; health: number }[]
  feedRows: any[]
  lastUpdated: string
  lastSync: string
  criticalRealCount: number
}

const GlobalDataContext = createContext<GlobalData>({
  motorGraph: [], pumpGraph: [], compressorGraph: [], turbineGraph: [],
  healthBars: [], feedRows: [], lastUpdated: '', lastSync: '', criticalRealCount: 0,
})

export function useGlobalData() { return useContext(GlobalDataContext) }

const FAULT_STATUSES = ['FAULT','FAULTY','BROKEN','DEGRADED']

function beepSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'square'; osc.frequency.value = 780
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  const [motorGraph,      setMotorGraph]      = useState<GraphPoint[]>([])
  const [pumpGraph,       setPumpGraph]       = useState<GraphPoint[]>([])
  const [compressorGraph, setCompressorGraph] = useState<GraphPoint[]>([])
  const [turbineGraph,    setTurbineGraph]    = useState<GraphPoint[]>([])
  const [healthBars,      setHealthBars]      = useState<any[]>([])
  const [feedRows,        setFeedRows]        = useState<any[]>([])
  const [lastUpdated,     setLastUpdated]     = useState('')
  const [lastSync,        setLastSync]        = useState('')
  const [criticalRealCount, setCriticalRealCount] = useState(0)

  const seenFaultIds = useRef<Set<string>>(new Set())
  const isFirstLoad  = useRef(true)

  // Expose beepSound globally
  // Manual prediction pages call: (window as any).__iocl_beep?.()
  // Dummy beep only called from AlertsPage directly
  // DO NOT call __iocl_beep during typing — only call after result returns as fault
  useEffect(() => {
    (window as any).__iocl_beep = beepSound
  }, [])

  const fetchGraphs = useCallback(async () => {
    try {
      const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
      const [motor, pump, comp, turb, health] = await Promise.all([
        safe('http://127.0.0.1:5050/graph/motor'),
        safe('http://127.0.0.1:5050/graph/pump'),
        safe('http://127.0.0.1:5050/graph/compressor'),
        safe('http://127.0.0.1:5050/graph/turbine'),
        safe('http://127.0.0.1:5050/graph/health-bar'),
      ])
      setMotorGraph(motor.map((d: any) => ({ time: d.time, value: d.rpm,         prediction: d.prediction })))
      setPumpGraph(pump.map((d: any)   => ({ time: d.time, value: d.pressure,    prediction: d.prediction })))
      setCompressorGraph(comp.map((d: any) => ({ time: d.time, value: d.pressure,    prediction: d.prediction })))
      setTurbineGraph(turb.map((d: any)    => ({ time: d.time, value: d.temperature, prediction: d.prediction })))
      setHealthBars(health)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {}
  }, [])

  const fetchLiveFeedAndBeep = useCallback(async () => {
    try {
      const safe = async (url: string) => { try { return await fetch(url).then(r => r.json()) } catch { return [] } }
      const [motor, pump, compressor, turbine] = await Promise.all([
        safe('http://127.0.0.1:5050/motor-history'),
        safe('http://127.0.0.1:5050/pump-history'),
        safe('http://127.0.0.1:5050/compressor-history'),
        safe('http://127.0.0.1:5050/turbine-history'),
      ])

      const all = [
        ...motor.map((r: any) => ({ ...r, machine: 'MOTOR' })),
        ...pump.map((r: any) => ({ ...r, machine: 'PUMP' })),
        ...compressor.map((r: any) => ({ ...r, machine: 'COMPRESSOR' })),
        ...turbine.map((r: any) => ({ ...r, machine: 'TURBINE' })),
      ]

      const rows = all
        .map(r => ({
          id: `auto-${r.machine}-${r.id}`,
          machine: r.machine,
          event: `${r.machine} prediction: ${r.prediction}`,
          level: FAULT_STATUSES.includes(r.prediction) ? 'Critical'
               : ['DEGRADED','RECOVERING'].includes(r.prediction) ? 'Warning' : 'Normal',
          time: new Date(r.created_at).toLocaleString(),
          value: `${r.confidence}%`,
          isReal: true, isAuto: true,
          rawTime: r.created_at,
          prediction: r.prediction,
        }))
        .sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())

      setFeedRows(rows)
      setLastSync(new Date().toLocaleTimeString())

      // Count real critical faults for badge
      const realFaultRows = all.filter(r => FAULT_STATUSES.includes(r.prediction))
      setCriticalRealCount(realFaultRows.length)

      if (isFirstLoad.current) {
        // Seed seen IDs on first load — no beep
        realFaultRows.forEach(r => seenFaultIds.current.add(`auto-${r.machine}-${r.id}`))
        isFirstLoad.current = false
        return
      }

      // Beep globally for NEW auto faults only (not dummy, not while typing)
      const newFaults = realFaultRows.filter(r => !seenFaultIds.current.has(`auto-${r.machine}-${r.id}`))
      if (newFaults.length > 0) {
        beepSound()
        newFaults.forEach(r => seenFaultIds.current.add(`auto-${r.machine}-${r.id}`))
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchGraphs()
    fetchLiveFeedAndBeep()
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      fetchGraphs()
      fetchLiveFeedAndBeep()
    }, 120000)
    return () => clearInterval(t)
  }, [fetchGraphs, fetchLiveFeedAndBeep])

  return (
    <GlobalDataContext.Provider value={{
      motorGraph, pumpGraph, compressorGraph, turbineGraph,
      healthBars, feedRows, lastUpdated, lastSync, criticalRealCount,
    }}>
      {children}
    </GlobalDataContext.Provider>
  )
}