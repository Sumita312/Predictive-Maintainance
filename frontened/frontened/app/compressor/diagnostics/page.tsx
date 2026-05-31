'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DUMMY_COMPRESSOR_DATA = [
  { id: "CMP-001", rpm: 2950, power: 15.4, pressure: 7.5, airflow: 320, temp: 85, risk: 88, status: "FAULT",    isReal: false },
  { id: "CMP-002", rpm: 2800, power: 14.2, pressure: 6.8, airflow: 310, temp: 82, risk: 62, status: "DEGRADED", isReal: false },
  { id: "CMP-003", rpm: 3000, power: 16.1, pressure: 7.9, airflow: 330, temp: 88, risk: 71, status: "FAULT",    isReal: false },
  { id: "CMP-004", rpm: 2750, power: 13.9, pressure: 6.5, airflow: 300, temp: 78, risk: 14, status: "NORMAL",   isReal: false },
  { id: "CMP-005", rpm: 3100, power: 17.0, pressure: 8.1, airflow: 340, temp: 90, risk: 8,  status: "NORMAL",   isReal: false },
  { id: "CMP-006", rpm: 2890, power: 15.0, pressure: 7.2, airflow: 315, temp: 84, risk: 55, status: "DEGRADED", isReal: false },
  { id: "CMP-007", rpm: 2700, power: 13.5, pressure: 6.3, airflow: 295, temp: 77, risk: 11, status: "NORMAL",   isReal: false },
  { id: "CMP-008", rpm: 3050, power: 16.5, pressure: 8.0, airflow: 335, temp: 89, risk: 6,  status: "NORMAL",   isReal: false },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  FAULT:     { color: "#F47920", bg: "rgba(244,121,32,0.14)",  border: "rgba(244,121,32,0.35)",  label: "FAULT"     },
  DEGRADED:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",   label: "DEGRADED"  },
  NORMAL:    { color: "#0ea5a0", bg: "rgba(14,165,160,0.12)",  border: "rgba(14,165,160,0.3)",   label: "NORMAL"    },
};

function RiskBar({ value, status }: { value: number; status: string }) {
  const color = status === "FAULT" ? "#F47920" : status === "DEGRADED" ? "#f59e0b" : "#0ea5a0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 90, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || { color: "#5b8af0", bg: "rgba(91,138,240,0.12)", border: "rgba(91,138,240,0.3)", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.08em", border: `1px solid ${cfg.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,0.025)", borderRadius: 16, padding: "20px 22px", border: "1px solid rgba(255,255,255,0.07)", position: "relative", overflow: "hidden" }}>
      {color && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}33)`, borderRadius: "16px 16px 0 0" }} />}
      <div style={{ fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: "#5a6a88", marginBottom: 8, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 30, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: color || "#eef2ff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#3a4a60", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

type ActionCardProps = { icon: React.ReactNode; title: string; desc: string; cta: string; streak: string; accentColor: string; accentBg: string; tags: string[]; onClick: () => void; };

function ActionCard({ icon, title, desc, cta, streak, accentColor, accentBg, tags, onClick }: ActionCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ flex: 1, background: hovered ? `rgba(${accentBg}, 0.05)` : "rgba(255,255,255,0.025)", borderRadius: 20, padding: 0, border: `1px solid ${hovered ? `rgba(${accentBg}, 0.35)` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", transition: "all 0.3s ease", overflow: "hidden", boxShadow: hovered ? `0 20px 60px rgba(${accentBg}, 0.1)` : "none", transform: hovered ? "translateY(-4px)" : "translateY(0)" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${streak}, ${streak}33)`, borderRadius: "20px 20px 0 0" }} />
      <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: `rgba(${accentBg}, 0.12)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: accentColor, border: `1px solid rgba(${accentBg}, 0.2)` }}>{icon}</div>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "3px", padding: "4px 10px", borderRadius: 6, background: `rgba(${accentBg}, 0.12)`, color: accentColor, border: `1px solid rgba(${accentBg}, 0.2)` }}>ANALYSIS</span>
      </div>
      <div style={{ flex: 1, padding: "18px 28px" }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#e8eeff", marginBottom: 10 }}>{title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#5a6a88", lineHeight: 1.65, marginBottom: 18 }}>{desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: `rgba(${accentBg}, 0.08)`, border: `1px solid rgba(${accentBg}, ${hovered ? "0.35" : "0.15"})`, color: hovered ? accentColor : `rgba(${accentBg.split(",").map((v, i) => i < 3 ? v : "0.7").join(",")})`, transition: "all 0.3s" }}>{tag}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: hovered ? accentColor : `rgba(${accentBg}, 0.6)`, transition: "all 0.3s" }}>
        <span>{cta}</span>
        <span style={{ transition: "transform 0.3s ease", transform: hovered ? "translateX(5px)" : "translateX(0)", fontSize: "1.1rem" }}>→</span>
      </div>
    </button>
  );
}

export default function CompressorDiagnostics() {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");
  const [allData, setAllData] = useState(DUMMY_COMPRESSOR_DATA as any[]);
  const [realFaults, setRealFaults] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`http://127.0.0.1:5050/compressor-history?email=${localStorage.getItem('user_email') || ''}`)
      .then(r => r.json())
      .then((real: any[]) => {
        const realRows = real.slice(0, 5).map((r, i) => ({
  id: `LIVE-${i + 1}`,
  rpm: r.rpm || "-", power: r.power || "-",
  pressure: r.pressure || "-", airflow: r.airflow || "-", temp: r.temp || "-",
  risk: Math.round(r.confidence),
  status: r.prediction === "NORMAL" ? "NORMAL" : r.prediction === "FAULT" ? "FAULT" : "DEGRADED",
  isReal: true,
  time: new Date(r.created_at).toLocaleTimeString(),
}));
        setRealFaults(real.filter((r: any) => r.prediction === "FAULT" || r.prediction === "DEGRADED").length);
        setAllData([...realRows, ...DUMMY_COMPRESSOR_DATA]);
      })
      .catch(() => setAllData(DUMMY_COMPRESSOR_DATA));
  }, []);

  const normal   = DUMMY_COMPRESSOR_DATA.filter(m => m.status === "NORMAL").length;
  const degraded = DUMMY_COMPRESSOR_DATA.filter(m => m.status === "DEGRADED").length + realFaults;
  const fault    = DUMMY_COMPRESSOR_DATA.filter(m => m.status === "FAULT").length;

  const filtered = allData.filter(m =>
    filter === "All" ? true :
    filter === "Fault" ? m.status === "FAULT" :
    filter === "Degraded" ? m.status === "DEGRADED" : true
  );

  const tabs = ["All", "Fault", "Degraded"];
  const goToPrediction = () => router.push("/compressor");
  const handleBack = () => router.push("/");

  return (
    <main style={{ minHeight: "100vh", background: "#04091a", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        table { border-collapse: collapse; width: 100%; }
        tr:hover td { background: rgba(14,165,160,0.04) !important; }
        .diag-back-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #5a6a88; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 600; transition: all 0.2s ease; }
        .diag-back-btn:hover { color: #0ea5a0; border-color: rgba(14,165,160,0.4); background: rgba(14,165,160,0.06); }
        .filter-tab { padding: 6px 18px; border-radius: 8px; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #5a6a88; }
        .filter-tab.active { background: rgba(14,165,160,0.14); color: #0ea5a0; border-color: rgba(14,165,160,0.4); }
        .filter-tab:not(.active):hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
      `}</style>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 55% at 15% 25%, rgba(14,165,160,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(244,121,32,0.05) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px)` }} />
      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <button className="diag-back-btn" onClick={handleBack}>← Back</button>
          <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid #0ea5a0", boxShadow: "0 0 10px rgba(14,165,160,0.4)" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2.5px solid #F47920" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0ea5a0", boxShadow: "0 0 6px #0ea5a0" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#f0f4ff" }}>Compressor Diagnostics</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "3px", padding: "3px 8px", borderRadius: 5, background: "rgba(14,165,160,0.14)", color: "#0ea5a0", border: "1px solid rgba(14,165,160,0.3)" }}>COMPRESSOR</span>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 600, color: "#2a3450", letterSpacing: "2px" }}>INDIANOIL PREDICTIVE MAINTENANCE — FLEET OVERVIEW &amp; FAULT DETECTION</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          <StatCard label="Total Compressors" value={DUMMY_COMPRESSOR_DATA.length} sub="Across 2 facilities" />
          <StatCard label="Normal"   value={normal}   sub="Operating normally"  color="#0ea5a0" />
          <StatCard label="Degraded" value={degraded} sub="Monitoring required" color="#f59e0b" />
          <StatCard label="Fault"    value={fault}    sub="Immediate action"    color="#F47920" />
        </div>

        {view === "dashboard" && (
          <>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#0ea5a0", letterSpacing: "3px", marginBottom: 20 }}>COMPRESSOR ANALYSIS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ActionCard icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><circle cx="32" cy="32" r="18"/><path d="M20 32 L32 20 L44 32"/><path d="M20 32 L32 44 L44 32"/><circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.4" stroke="none"/></svg>}
                title="New Prediction" desc="Enter sensor readings for a single compressor — RPM, airflow, pressure and temperature — and get an instant NORMAL / DEGRADED / FAULT classification." cta="Run single compressor analysis" streak="#0ea5a0" accentColor="#0ea5a0" accentBg="14,165,160" tags={["14 Sensors", "State Detection", "Fault Classification"]} onClick={goToPrediction} />
              <ActionCard icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="8,48 22,30 32,38 44,20 56,10"/><polyline points="44,10 56,10 56,22"/><line x1="8" y1="56" x2="56" y2="56"/><line x1="8" y1="56" x2="8" y2="10"/></svg>}
                title="Fleet Risk Forecast" desc="View all 8 compressors ranked by failure probability. See sensor trend data, fault states, and recommended maintenance windows." cta="View fleet risk overview" streak="#F47920" accentColor="#F47920" accentBg="244,121,32" tags={["8 Compressors", "Risk Ranking", "Maintenance Windows"]} onClick={() => setView("fleet")} />
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "#2a3450", letterSpacing: "1px", textAlign: "center", marginTop: 40 }}>Models trained on real industrial sensor datasets · Multi-class classification</p>
          </>
        )}

        {view === "fleet" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <button className="diag-back-btn" onClick={() => setView("dashboard")}>← Back</button>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#0ea5a0", letterSpacing: "3px" }}>FLEET STATUS</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {tabs.map(t => <button key={t} className={`filter-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{t}</button>)}
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Compressor ID", "RPM", "Power (kW)", "Pressure (bar)", "Airflow (CFM)", "Temp (°C)", "Failure Risk", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "#2a3450", fontWeight: 700, letterSpacing: "0.08em", background: "rgba(255,255,255,0.02)" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: c.isReal ? "3px solid #0ea5a0" : "none" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#0ea5a0" }}>
                          {c.id} {c.isReal && <span style={{ fontSize: 9, color: "#0ea5a0", fontWeight: 700 }}>●LIVE</span>}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{c.isReal ? c.time : c.rpm}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{c.power}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{c.pressure}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{c.airflow}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{c.temp}</td>
                      <td style={{ padding: "14px 18px" }}><RiskBar value={c.risk} status={c.status} /></td>
                      <td style={{ padding: "14px 18px" }}><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, color: "#2a3450", letterSpacing: "1px", marginTop: 14, textAlign: "right" }}>SHOWING {filtered.length} OF {allData.length} COMPRESSORS</div>
          </>
        )}
      </div>
    </main>
  );
}