'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

const turbineData = [
  { id: "TRB-001", rpm: 3000, temperature: 850, pressure: 12.4, vibration: 2.1, power: 45, risk: 92, status: "FAULT" },
  { id: "TRB-002", rpm: 2890, temperature: 810, pressure: 11.2, vibration: 1.7, power: 42, risk: 61, status: "DEGRADED" },
  { id: "TRB-003", rpm: 3100, temperature: 870, pressure: 12.9, vibration: 2.4, power: 48, risk: 88, status: "FAULT" },
  { id: "TRB-004", rpm: 2800, temperature: 780, pressure: 10.8, vibration: 1.1, power: 39, risk: 12, status: "NORMAL" },
  { id: "TRB-005", rpm: 2950, temperature: 820, pressure: 11.7, vibration: 1.5, power: 44, risk: 18, status: "NORMAL" },
  { id: "TRB-006", rpm: 3050, temperature: 860, pressure: 12.6, vibration: 2.2, power: 47, risk: 74, status: "DEGRADED" },
  { id: "TRB-007", rpm: 2760, temperature: 770, pressure: 10.5, vibration: 1.0, power: 37, risk: 9, status: "NORMAL" },
  { id: "TRB-008", rpm: 3120, temperature: 880, pressure: 13.1, vibration: 2.6, power: 49, risk: 95, status: "FAULT" },
];

type Status = "NORMAL" | "DEGRADED" | "FAULT";

const statusConfig: Record<
  Status,
  { color: string; bg: string; border: string; label: string }
> = {
  NORMAL: {
    color: "#0ea5a0",
    bg: "rgba(14,165,160,0.12)",
    border: "rgba(14,165,160,0.3)",
    label: "NORMAL",
  },
  DEGRADED: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    label: "DEGRADED",
  },
  FAULT: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.3)",
    label: "FAULT",
  },
};

function RiskBar({
  value,
  status,
}: {
  value: number;
  status: Status;
}) {
  const color = statusConfig[status].color;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 90,
          height: 5,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <span
        style={{
          fontSize: 12,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          color,
          minWidth: 34,
        }}
      >
        {value}%
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.08em",
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.025)",
        borderRadius: 16,
        padding: "20px 22px",
        border: "1px solid rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {color && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${color}, ${color}33)`,
          }}
        />
      )}

      <div
        style={{
          fontSize: 11,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          color: "#5a6a88",
          marginBottom: 8,
          letterSpacing: "0.08em",
        }}
      >
        {label.toUpperCase()}
      </div>

      <div
        style={{
          fontSize: 30,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          color: color || "#eef2ff",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          color: "#3a4a60",
          marginTop: 6,
        }}
      >
        {sub}
      </div>
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

function ActionCard({
  icon,
  title,
  desc,
  cta,
  streak,
  accentColor,
  accentBg,
  tags,
  onClick,
}: ActionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered
          ? `rgba(${accentBg}, 0.05)`
          : "rgba(255,255,255,0.025)",
        borderRadius: 20,
        padding: 0,
        border: `1px solid ${
          hovered
            ? `rgba(${accentBg}, 0.35)`
            : "rgba(255,255,255,0.07)"
        }`,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        overflow: "hidden",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${streak}, ${streak}33)`,
        }}
      />

      <div
        style={{
          padding: "24px 28px 0",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: `rgba(${accentBg}, 0.12)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            border: `1px solid rgba(${accentBg},0.2)`,
          }}
        >
          {icon}
        </div>

        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "3px",
            padding: "4px 10px",
            borderRadius: 6,
            background: `rgba(${accentBg},0.12)`,
            color: accentColor,
            border: `1px solid rgba(${accentBg},0.2)`,
          }}
        >
          ANALYSIS
        </span>
      </div>

      <div style={{ flex: 1, padding: "18px 28px" }}>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "1.45rem",
            fontWeight: 700,
            color: "#e8eeff",
            marginBottom: 10,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "#5a6a88",
            lineHeight: 1.65,
            marginBottom: 18,
          }}
        >
          {desc}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 6,
                background: `rgba(${accentBg},0.08)`,
                border: `1px solid rgba(${accentBg},0.15)`,
                color: accentColor,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: accentColor,
        }}
      >
        <span>{cta}</span>
        <span>→</span>
      </div>
    </button>
  );
}

export default function TurbineDiagnostics() {
  const [view, setView] = useState<"dashboard" | "fleet">("dashboard");
  const [filter, setFilter] = useState("All");

  const router = useRouter();

  const normal = turbineData.filter(t => t.status === "NORMAL").length;
  const degraded = turbineData.filter(t => t.status === "DEGRADED").length;
  const fault = turbineData.filter(t => t.status === "FAULT").length;

  const filtered = turbineData.filter(t =>
    filter === "All"
      ? true
      : filter === "Critical"
      ? t.status === "FAULT"
      : filter === "At risk"
      ? t.status === "DEGRADED"
      : true
  );

  const tabs = ["All", "Critical", "At risk"];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#04091a",
        fontFamily: "'DM Sans', sans-serif",
        color: "#e2e8f0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        table {
          border-collapse: collapse;
          width: 100%;
        }

        tr:hover td {
          background: rgba(96,165,250,0.03) !important;
        }

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
          transition: all 0.2s ease;
        }

        .diag-back-btn:hover {
          color: #60a5fa;
          border-color: rgba(96,165,250,0.3);
          background: rgba(96,165,250,0.05);
        }

        .filter-tab {
          padding: 6px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #5a6a88;
        }

        .filter-tab.active {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.35);
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 70% 55% at 15% 25%, rgba(96,165,250,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0,48,135,0.08) 0%, transparent 60%)
          `,
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 900,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              className="diag-back-btn"
              onClick={() => router.push("/")}
            >
              ← Back
            </button>

            <div
              style={{
                position: "relative",
                width: 48,
                height: 48,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2.5px solid #60a5fa",
                }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                  }}
                >
                  Turbine Diagnostics
                </span>

                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    padding: "3px 8px",
                    borderRadius: 5,
                    background: "rgba(96,165,250,0.12)",
                    color: "#60a5fa",
                    border: "1px solid rgba(96,165,250,0.25)",
                  }}
                >
                  TURBINE
                </span>
              </div>

              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "#2a3450",
                  letterSpacing: "2px",
                }}
              >
                INDIANOIL PREDICTIVE MAINTENANCE — TURBINE HEALTH MONITORING
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
            marginBottom: 40,
          }}
        >
          <StatCard
            label="Total turbines"
            value={turbineData.length}
            sub="Across 4 facilities"
          />

          <StatCard
            label="Normal"
            value={normal}
            sub="Operating normally"
            color="#0ea5a0"
          />

          <StatCard
            label="Degraded"
            value={degraded}
            sub="Performance reduced"
            color="#f59e0b"
          />

          <StatCard
            label="Fault"
            value={fault}
            sub="Immediate inspection"
            color="#60a5fa"
          />
        </div>

        {view === "dashboard" && (
          <>
            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#60a5fa",
                letterSpacing: "3px",
                marginBottom: 20,
              }}
            >
              TURBINE ANALYSIS
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <ActionCard
                icon={"⚡"}
                title="New Prediction"
                desc="Analyze turbine RPM, vibration, pressure, and temperature data for instant fault prediction."
                cta="Run turbine analysis"
                streak="#60a5fa"
                accentColor="#60a5fa"
                accentBg="96,165,250"
                tags={[
                  "RPM Analysis",
                  "Vibration Check",
                  "Pressure Monitor",
                ]}
                onClick={() => router.push("/turbine")}
              />

              <ActionCard
                icon={"📈"}
                title="Fleet Risk Forecast"
                desc="View all turbines ranked by operational risk with predictive maintenance scheduling insights."
                cta="View fleet overview"
                streak="#003087"
                accentColor="#5b8af0"
                accentBg="0,48,135"
                tags={[
                  "8 Turbines",
                  "Risk Ranking",
                  "Failure Trends",
                ]}
                onClick={() => setView("fleet")}
              />
            </div>
          </>
        )}

        {view === "fleet" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <button
                className="diag-back-btn"
                onClick={() => setView("dashboard")}
              >
                ← Back
              </button>

              <span
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#60a5fa",
                  letterSpacing: "3px",
                }}
              >
                FLEET STATUS
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {tabs.map((t) => (
                <button
                  key={t}
                  className={`filter-tab ${
                    filter === t ? "active" : ""
                  }`}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <table>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {[
                      "Turbine ID",
                      "RPM",
                      "Temperature",
                      "Pressure",
                      "Vibration",
                      "Power",
                      "Risk",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 18px",
                          textAlign: "left",
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: 11,
                          color: "#2a3450",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom:
                          "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 18px",
                          color: "#60a5fa",
                          fontWeight: 700,
                          fontFamily: "'Rajdhani', sans-serif",
                        }}
                      >
                        {t.id}
                      </td>

                      <td style={{ padding: "14px 18px" }}>{t.rpm}</td>
                      <td style={{ padding: "14px 18px" }}>
                        {t.temperature} K
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {t.pressure} bar
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {t.vibration} mm/s
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        {t.power} MW
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <RiskBar
                          value={t.risk}
                          status={t.status as Status}
                        />
                      </td>

                      <td style={{ padding: "14px 18px" }}>
                        <StatusBadge
                          status={t.status as Status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: "#2a3450",
                letterSpacing: "1px",
                marginTop: 14,
                textAlign: "right",
              }}
            >
              SHOWING {filtered.length} OF {turbineData.length} TURBINES
            </div>
          </>
        )}
      </div>
    </main>
  );
}