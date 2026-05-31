'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DUMMY_MOTOR_DATA = [
  { id: "MTR-001", type: "M", rpm: 1487, torque: 42.1, toolWear: 198, risk: 88, status: "CRITICAL", isReal: false },
  { id: "MTR-002", type: "H", rpm: 1612, torque: 38.4, toolWear: 145, risk: 62, status: "FAULTY",   isReal: false },
  { id: "MTR-003", type: "L", rpm: 1390, torque: 55.2, toolWear: 211, risk: 71, status: "FAULTY",   isReal: false },
  { id: "MTR-004", type: "M", rpm: 1530, torque: 40.0, toolWear: 87,  risk: 14, status: "HEALTHY",  isReal: false },
  { id: "MTR-005", type: "H", rpm: 1710, torque: 29.7, toolWear: 32,  risk: 8,  status: "HEALTHY",  isReal: false },
  { id: "MTR-006", type: "M", rpm: 1465, torque: 47.8, toolWear: 167, risk: 55, status: "FAULTY",   isReal: false },
  { id: "MTR-007", type: "L", rpm: 1350, torque: 51.0, toolWear: 93,  risk: 11, status: "HEALTHY",  isReal: false },
  { id: "MTR-008", type: "H", rpm: 1580, torque: 36.3, toolWear: 42,  risk: 6,  status: "HEALTHY",  isReal: false },
  { id: "MTR-009", type: "M", rpm: 1498, torque: 43.6, toolWear: 119, risk: 19, status: "HEALTHY",  isReal: false },
  { id: "MTR-010", type: "L", rpm: 1420, torque: 49.1, toolWear: 76,  risk: 16, status: "HEALTHY",  isReal: false },
];

type Status = "CRITICAL" | "FAULTY" | "HEALTHY";

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  CRITICAL: { color: "#F47920", bg: "rgba(244,121,32,0.12)", border: "rgba(244,121,32,0.3)", label: "CRITICAL" },
  FAULTY:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "FAULTY" },
  HEALTHY:  { color: "#0ea5a0", bg: "rgba(14,165,160,0.12)", border: "rgba(14,165,160,0.3)", label: "HEALTHY" },
  FAULT:    { color: "#F47920", bg: "rgba(244,121,32,0.12)", border: "rgba(244,121,32,0.3)", label: "FAULT" },
  NORMAL:   { color: "#0ea5a0", bg: "rgba(14,165,160,0.12)", border: "rgba(14,165,160,0.3)", label: "NORMAL" },
};

function RiskBar({ value, status }: { value: number; status: string }) {
  const color = status === "CRITICAL" || status === "FAULT" || status === "FAULTY" ? "#F47920" : status === "HEALTHY" || status === "NORMAL" ? "#0ea5a0" : "#f59e0b";
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
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#e8eeff", marginBottom: 10, letterSpacing: "-0.3px" }}>{title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#5a6a88", lineHeight: 1.65, marginBottom: 18 }}>{desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.8px", padding: "4px 10px", borderRadius: 6, background: `rgba(${accentBg}, 0.08)`, border: `1px solid rgba(${accentBg}, ${hovered ? "0.35" : "0.15"})`, color: hovered ? accentColor : `rgba(${accentBg.split(",").map((v, i) => i < 3 ? v : "0.7").join(",")})`, transition: "all 0.3s" }}>{tag}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.5px", color: hovered ? accentColor : `rgba(${accentBg}, 0.6)`, transition: "all 0.3s" }}>
        <span>{cta}</span>
        <span style={{ transition: "transform 0.3s ease", transform: hovered ? "translateX(5px)" : "translateX(0)", fontSize: "1.1rem" }}>→</span>
      </div>
    </button>
  );
}

export default function MotorDiagnostics() {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");
  const [allData, setAllData] = useState(DUMMY_MOTOR_DATA as any[]);
  const [realFaults, setRealFaults] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`http://127.0.0.1:5050/motor-history?email=${localStorage.getItem('user_email') || ''}`)
      .then(r => r.json())
      .then((real: any[]) => {
        const realRows = real.slice(0, 5).map((r, i) => ({
          id: `LIVE-${i + 1}`,
          type: "●",
          rpm: r.rpm || "-",
          torque: r.torque || "-",
          toolWear: r.tool_wear || "-",
          risk: Math.round(r.confidence),
          status: r.prediction === "HEALTHY" ? "HEALTHY" : r.prediction === "FAULTY" ? "FAULTY" : "CRITICAL",
          isReal: true,
          time: new Date(r.created_at).toLocaleTimeString(),
        }));
        setRealFaults(real.filter((r: any) => r.prediction === "FAULTY" || r.prediction === "FAULT").length);
        setAllData([...realRows, ...DUMMY_MOTOR_DATA]);
      })
      .catch(() => setAllData(DUMMY_MOTOR_DATA));
  }, []);

  const healthy  = DUMMY_MOTOR_DATA.filter(m => m.status === "HEALTHY").length;
  const atRisk   = DUMMY_MOTOR_DATA.filter(m => m.status === "FAULTY").length + realFaults;
  const critical = DUMMY_MOTOR_DATA.filter(m => m.status === "CRITICAL").length;

  const filtered = allData.filter(m =>
    filter === "All" ? true :
    filter === "Critical" ? m.status === "CRITICAL" :
    filter === "At risk" ? (m.status === "FAULTY" || m.status === "FAULT") : true
  );

  const tabs = ["All", "Critical", "At risk"];
  const goToPrediction = () => router.push("/motor");
  const handleBack = () => router.push("/");

  return (
    <main style={{ minHeight: "100vh", background: "#04091a", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #04091a; } ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        tr:hover td { background: rgba(244,121,32,0.03) !important; }
        .diag-back-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #5a6a88; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: 0.05em; transition: all 0.2s ease; }
        .diag-back-btn:hover { color: #F47920; border-color: rgba(244,121,32,0.3); background: rgba(244,121,32,0.05); }
        .filter-tab { padding: 6px 18px; border-radius: 8px; font-size: 12px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #5a6a88; }
        .filter-tab.active { background: rgba(244,121,32,0.12); color: #F47920; border-color: rgba(244,121,32,0.35); }
        .filter-tab:not(.active):hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
      `}</style>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 55% at 15% 25%, rgba(244,121,32,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.08) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px)` }} />
      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <button className="diag-back-btn" onClick={handleBack}>← Back</button>
          <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid #F47920", boxShadow: "0 0 10px rgba(244,121,32,0.35)" }} />
            <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2.5px solid #003087" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F47920", boxShadow: "0 0 6px #F47920" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#f0f4ff" }}>Motor Diagnostics</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "3px", padding: "3px 8px", borderRadius: 5, background: "rgba(244,121,32,0.12)", color: "#F47920", border: "1px solid rgba(244,121,32,0.25)" }}>MOTOR</span>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 600, color: "#2a3450", letterSpacing: "2px" }}>INDIANOIL PREDICTIVE MAINTENANCE — FLEET OVERVIEW &amp; FAULT DETECTION</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          <StatCard label="Total motors" value={DUMMY_MOTOR_DATA.length} sub="Across 3 facilities" />
          <StatCard label="Healthy"  value={healthy}  sub="Operating normally"  color="#0ea5a0" />
          <StatCard label="At risk"  value={atRisk}   sub="Monitoring required" color="#f59e0b" />
          <StatCard label="Critical" value={critical} sub="Immediate action"    color="#F47920" />
        </div>

        {view === "dashboard" && (
          <>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#F47920", letterSpacing: "3px", marginBottom: 20 }}>MOTOR ANALYSIS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ActionCard icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.2" stroke="none"/><circle cx="32" cy="32" r="3" fill="currentColor" stroke="none"/><line x1="32" y1="4" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="60"/><line x1="4" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="60" y2="32"/></svg>}
                title="New Prediction" desc="Enter sensor readings for a single motor — air temp, RPM, torque, tool wear — and get an instant fault classification." cta="Run single motor analysis" streak="#F47920" accentColor="#F47920" accentBg="244,121,32" tags={["RPM Analysis", "Torque Check", "Tool Wear"]} onClick={goToPrediction} />
              <ActionCard icon={<svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="8,48 22,30 32,38 44,20 56,10"/><polyline points="44,10 56,10 56,22"/><line x1="8" y1="56" x2="56" y2="56"/><line x1="8" y1="56" x2="8" y2="10"/></svg>}
                title="Fleet Risk Forecast" desc="View all 10 motors ranked by failure probability. See trend data, fault types, and recommended maintenance windows." cta="View fleet risk overview" streak="#003087" accentColor="#5b8af0" accentBg="0,48,135" tags={["10 Motors", "Risk Ranking", "Maintenance Windows"]} onClick={() => setView("fleet")} />
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", fontWeight: 500, color: "#2a3450", letterSpacing: "1px", textAlign: "center", marginTop: 40 }}>Models trained on real industrial sensor datasets · Binary &amp; multi-class classification</p>
          </>
        )}

        {view === "fleet" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <button className="diag-back-btn" onClick={() => setView("dashboard")}>← Back</button>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#F47920", letterSpacing: "3px" }}>FLEET STATUS</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {tabs.map(t => <button key={t} className={`filter-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{t}</button>)}
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Motor ID", "Type", "RPM", "Torque (Nm)", "Tool Wear", "Failure Risk", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "#2a3450", fontWeight: 700, letterSpacing: "0.08em", background: "rgba(255,255,255,0.02)" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: m.isReal ? "3px solid #F47920" : "none" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700, color: "#F47920", letterSpacing: "0.04em" }}>
                          {m.id} {m.isReal && <span style={{ fontSize: 9, color: "#F47920", fontWeight: 700 }}>●LIVE</span>}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, background: "rgba(244,121,32,0.1)", border: "1px solid rgba(244,121,32,0.2)", fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, color: "#F47920" }}>{m.type}</span>
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{m.isReal ? m.time : m.rpm.toLocaleString()}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{m.torque}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{m.toolWear !== "-" ? `${m.toolWear} min` : "-"}</td>
                      <td style={{ padding: "14px 18px" }}><RiskBar value={m.risk} status={m.status} /></td>
                      <td style={{ padding: "14px 18px" }}><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, color: "#2a3450", letterSpacing: "1px", marginTop: 14, textAlign: "right" }}>
              SHOWING {filtered.length} OF {allData.length} MOTORS
            </div>
          </>
        )}
      </div>
    </main>
  );
}