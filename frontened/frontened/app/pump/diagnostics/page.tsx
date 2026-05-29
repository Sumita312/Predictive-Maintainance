'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

const pumpData = [
  { id: "PMP-001", sensor00: 2.45, sensor02: 47.3, sensor05: 0.64, sensor07: 0.91, risk: 82, status: "CRITICAL" },
  { id: "PMP-002", sensor00: 1.92, sensor02: 38.1, sensor05: 0.71, sensor07: 1.02, risk: 58, status: "FAULTY" },
  { id: "PMP-003", sensor00: 3.10, sensor02: 52.6, sensor05: 0.55, sensor07: 0.78, risk: 74, status: "FAULTY" },
  { id: "PMP-004", sensor00: 2.21, sensor02: 41.0, sensor05: 0.88, sensor07: 1.15, risk: 12, status: "HEALTHY" },
  { id: "PMP-005", sensor00: 1.85, sensor02: 36.4, sensor05: 0.92, sensor07: 1.20, risk: 7,  status: "HEALTHY" },
  { id: "PMP-006", sensor00: 2.78, sensor02: 49.8, sensor05: 0.60, sensor07: 0.85, risk: 61, status: "FAULTY" },
  { id: "PMP-007", sensor00: 2.05, sensor02: 39.7, sensor05: 0.95, sensor07: 1.18, risk: 9,  status: "HEALTHY" },
  { id: "PMP-008", sensor00: 1.78, sensor02: 35.2, sensor05: 0.97, sensor07: 1.22, risk: 5,  status: "HEALTHY" },
  { id: "PMP-009", sensor00: 2.33, sensor02: 44.1, sensor05: 0.83, sensor07: 1.08, risk: 21, status: "HEALTHY" },
  { id: "PMP-010", sensor00: 2.61, sensor02: 46.9, sensor05: 0.67, sensor07: 0.93, risk: 67, status: "FAULTY" },
];

type Status = "CRITICAL" | "FAULTY" | "HEALTHY";

const statusConfig: Record<Status, { color: string; bg: string; border: string; label: string }> = {
  CRITICAL: { color: "#003087", bg: "rgba(0,48,135,0.14)",   border: "rgba(0,48,135,0.35)",   label: "CRITICAL" },
  FAULTY:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)",   label: "FAULTY"   },
  HEALTHY:  { color: "#0ea5a0", bg: "rgba(14,165,160,0.12)", border: "rgba(14,165,160,0.3)",   label: "HEALTHY"  },
};

function RiskBar({ value, status }: { value: number; status: Status }) {
  const color =
    status === "CRITICAL" ? "#5b8af0" :
    status === "FAULTY"   ? "#f59e0b" : "#0ea5a0";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 90, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 6,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.08em",
      border: `1px solid ${cfg.border}`
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  return (
    <div style={{
      flex: 1,
      background: "rgba(255,255,255,0.025)",
      borderRadius: 16,
      padding: "20px 22px",
      border: "1px solid rgba(255,255,255,0.07)",
      position: "relative",
      overflow: "hidden",
    }}>
      {color && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}33)`,
          borderRadius: "16px 16px 0 0"
        }} />
      )}
      <div style={{ fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: "#5a6a88", marginBottom: 8, letterSpacing: "0.08em" }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 30, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: color || "#eef2ff", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#3a4a60", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  streak: string;
  accentColor: string;
  accentBg: string;
  tags: string[];
  onClick: () => void;
};

function ActionCard({ icon, title, desc, cta, streak, accentColor, accentBg, tags, onClick }: ActionCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered ? `rgba(${accentBg}, 0.05)` : "rgba(255,255,255,0.025)",
        borderRadius: 20,
        padding: 0,
        border: `1px solid ${hovered ? `rgba(${accentBg}, 0.35)` : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        overflow: "hidden",
        boxShadow: hovered ? `0 20px 60px rgba(${accentBg}, 0.1)` : "none",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${streak}, ${streak}33)`,
        borderRadius: "20px 20px 0 0"
      }} />

      <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14,
          background: `rgba(${accentBg}, 0.12)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: accentColor,
          border: `1px solid rgba(${accentBg}, 0.2)`
        }}>{icon}</div>
        <span style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 700,
          letterSpacing: "3px", padding: "4px 10px", borderRadius: 6,
          background: `rgba(${accentBg}, 0.12)`, color: accentColor,
          border: `1px solid rgba(${accentBg}, 0.2)`
        }}>ANALYSIS</span>
      </div>

      <div style={{ flex: 1, padding: "18px 28px" }}>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#e8eeff", marginBottom: 10, letterSpacing: "-0.3px" }}>{title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#5a6a88", lineHeight: 1.65, marginBottom: 18 }}>{desc}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.8px",
              padding: "4px 10px", borderRadius: 6,
              background: `rgba(${accentBg}, 0.08)`,
              border: `1px solid rgba(${accentBg}, ${hovered ? "0.35" : "0.15"})`,
              color: hovered ? accentColor : `rgba(${accentBg.split(",").map((v, i) => i < 3 ? v : "0.7").join(",")})`,
              transition: "all 0.3s"
            }}>{tag}</span>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 28px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontFamily: "'Rajdhani', sans-serif", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.5px",
        color: hovered ? accentColor : `rgba(${accentBg}, 0.6)`,
        transition: "all 0.3s"
      }}>
        <span>{cta}</span>
        <span style={{ transition: "transform 0.3s ease", transform: hovered ? "translateX(5px)" : "translateX(0)", fontSize: "1.1rem" }}>→</span>
      </div>
    </button>
  );
}

type Props = { onBack?: () => void }

export default function PumpDiagnostics({ onBack }: Props) {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");
  const router = useRouter();

  const healthy  = pumpData.filter(m => m.status === "HEALTHY").length;
  const atRisk   = pumpData.filter(m => m.status === "FAULTY").length;
  const critical = pumpData.filter(m => m.status === "CRITICAL").length;

  const filtered = pumpData.filter(m =>
    filter === "All" ? true :
    filter === "Critical" ? m.status === "CRITICAL" :
    filter === "At risk" ? m.status === "FAULTY" : true
  );

  const tabs = ["All", "Critical", "At risk"];

  const goToPrediction = () => router.push("/pump");
  const handleBack = () => {
    if (onBack) onBack();
    else router.push("/");
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#04091a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #04091a; }
        ::-webkit-scrollbar-thumb { background: #1a2540; border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        tr:hover td { background: rgba(0,48,135,0.04) !important; }
        .diag-back-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #5a6a88;
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 12px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
        }
        .diag-back-btn:hover { color: #5b8af0; border-color: rgba(0,48,135,0.4); background: rgba(0,48,135,0.06); }
        .filter-tab {
          padding: 6px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #5a6a88;
        }
        .filter-tab.active {
          background: rgba(0,48,135,0.14);
          color: #5b8af0;
          border-color: rgba(0,48,135,0.4);
        }
        .filter-tab:not(.active):hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Background radial glows — pump uses blue tones */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 70% 55% at 15% 25%, rgba(0,48,135,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 85% 75%, rgba(244,121,32,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 55% 45% at 75% 15%, rgba(14,165,160,0.04) 0%, transparent 55%),
          repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px),
          repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.012) 80px)
        `
      }} />

      <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="diag-back-btn" onClick={handleBack}>← Back</button>

            {/* IOCL-style emblem */}
            <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2.5px solid #003087", boxShadow: "0 0 10px rgba(0,48,135,0.4)" }} />
              <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2.5px solid #F47920", boxShadow: "0 0 6px rgba(244,121,32,0.35)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#5b8af0", boxShadow: "0 0 6px #5b8af0" }} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#f0f4ff", letterSpacing: "-0.3px" }}>Pump Diagnostics</span>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "3px",
                  padding: "3px 8px", borderRadius: 5,
                  background: "rgba(0,48,135,0.14)", color: "#5b8af0",
                  border: "1px solid rgba(0,48,135,0.3)"
                }}>PUMP</span>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 600, color: "#2a3450", letterSpacing: "2px" }}>
                INDIANOIL PREDICTIVE MAINTENANCE — FLEET OVERVIEW &amp; FAULT DETECTION
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          <StatCard label="Total pumps"  value={pumpData.length} sub="Across 3 facilities" />
          <StatCard label="Healthy"      value={healthy}  sub="Operating normally"  color="#0ea5a0" />
          <StatCard label="At risk"      value={atRisk}   sub="Monitoring required" color="#f59e0b" />
          <StatCard label="Critical"     value={critical} sub="Immediate action"    color="#5b8af0" />
        </div>

        {view === "dashboard" && (
          <>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700,
              color: "#5b8af0", letterSpacing: "3px", marginBottom: 20
            }}>PUMP ANALYSIS</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ActionCard
                icon={
                  <svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8"  y="22" width="20" height="20" rx="4" />
                    <rect x="36" y="18" width="20" height="28" rx="4" />
                    <line x1="28" y1="32" x2="36" y2="32" />
                    <path d="M18 22 C18 14 26 10 32 14" fill="none" />
                    <circle cx="18" cy="32" r="3" fill="currentColor" opacity="0.4" stroke="none" />
                    <circle cx="46" cy="32" r="4" fill="currentColor" opacity="0.3" stroke="none" />
                  </svg>
                }
                title="New Prediction"
                desc="Enter sensor readings for a single pump — 52-sensor time-series input — and get an instant NORMAL / BROKEN / RECOVERING classification."
                cta="Run single pump analysis"
                streak="#003087"
                accentColor="#5b8af0"
                accentBg="0,48,135"
                tags={["52 Sensors", "State Detection", "SMOTE Model"]}
                onClick={goToPrediction}
              />
              <ActionCard
                icon={
                  <svg viewBox="0 0 64 64" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8,48 22,30 32,38 44,20 56,10" />
                    <polyline points="44,10 56,10 56,22" />
                    <line x1="8" y1="56" x2="56" y2="56" />
                    <line x1="8" y1="56" x2="8" y2="10" />
                  </svg>
                }
                title="Fleet Risk Forecast"
                desc="View all 10 pumps ranked by failure probability. See sensor trend data, fault states, and recommended maintenance windows."
                cta="View fleet risk overview"
                streak="#0ea5a0"
                accentColor="#0ea5a0"
                accentBg="14,165,160"
                tags={["10 Pumps", "Risk Ranking", "Maintenance Windows"]}
                onClick={() => setView("fleet")}
              />
            </div>

            <p style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", fontWeight: 500,
              color: "#2a3450", letterSpacing: "1px", textAlign: "center", marginTop: 40
            }}>
              Models trained on real industrial sensor datasets &nbsp;·&nbsp; Binary &amp; multi-class classification
            </p>
          </>
        )}

        {view === "fleet" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <button className="diag-back-btn" onClick={() => setView("dashboard")}>← Back</button>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700,
                color: "#5b8af0", letterSpacing: "3px"
              }}>FLEET STATUS</span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {tabs.map(t => (
                <button
                  key={t}
                  className={`filter-tab${filter === t ? " active" : ""}`}
                  onClick={() => setFilter(t)}
                >{t}</button>
              ))}
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Pump ID", "Sensor 00", "Sensor 02", "Sensor 05", "Sensor 07", "Failure Risk", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "12px 18px", textAlign: "left",
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: 11, color: "#2a3450", fontWeight: 700, letterSpacing: "0.08em",
                        background: "rgba(255,255,255,0.02)"
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 700,
                          color: "#5b8af0", letterSpacing: "0.04em"
                        }}>{p.id}</span>
                      </td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{p.sensor00}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{p.sensor02}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{p.sensor05}</td>
                      <td style={{ padding: "14px 18px", fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#8899bb" }}>{p.sensor07}</td>
                      <td style={{ padding: "14px 18px" }}><RiskBar value={p.risk} status={p.status as Status} /></td>
                      <td style={{ padding: "14px 18px" }}><StatusBadge status={p.status as Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600,
              color: "#2a3450", letterSpacing: "1px", marginTop: 14, textAlign: "right"
            }}>
              SHOWING {filtered.length} OF {pumpData.length} PUMPS
            </div>
          </>
        )}
      </div>
    </main>
  );
}