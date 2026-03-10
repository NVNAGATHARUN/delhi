"use client";
// HOME — Command center with impact counter
import { useTrafficData } from "@/lib/useTrafficData";
import { useImpactStats } from "@/lib/useImpactStats";
import { LANE_COLORS } from "@/lib/api";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LiveSnapshot() {
  const [snap, setSnap] = useState<any>(null);

  useEffect(() => {
    const fetchSnap = async () => {
      try {
        const r = await fetch(`${API}/camera/snapshot`);
        if (r.ok) {
          const d = await r.json();
          if (!d.error) setSnap(d);
          else setSnap(null);
        }
      } catch { setSnap(null); }
    };
    fetchSnap();
    const iv = setInterval(fetchSnap, 3000);
    return () => clearInterval(iv);
  }, []);

  if (!snap) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="card" style={{ padding: "12px", border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>🎥 Live Hub Status</span>
        <span style={{ fontSize: 8, color: "var(--text-3)" }}>{snap.fps} FPS</span>
      </div>
      <div style={{ height: 120, background: "#000", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
        <img src={`data:image/jpeg;base64,${snap.image}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="snapshot" />
        <div style={{ position: "absolute", bottom: 6, right: 6 }} className="pill pill-blue">
          {snap.total} vehicles
        </div>
        <div style={{ position: "absolute", top: 6, left: 6, width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "emerg 1.4s infinite" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: "var(--text-3)" }}>
        <span>Latency: {snap.latency_ms}ms</span>
        <span>Hub: North Hub</span>
      </div>
    </motion.div>
  );
}

function Row({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "flex", alignItems: "center", ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 16px" }} />;
}

function SmallDot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return <div style={{
    width: 7, height: 7, borderRadius: "50%", background: color,
    ...(pulse ? { animation: "emerg 1.4s infinite" } : {})
  }} />;
}

// ── Animated impact number
function ImpactNum({ value, decimals = 0, color = "var(--text)" }: { value: number; decimals?: number; color?: string }) {
  return (
    <motion.span key={Math.floor(value)} animate={{ opacity: [0.5, 1] }} transition={{ duration: 0.3 }}
      style={{ fontSize: 15, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
      {value.toFixed(decimals)}
    </motion.span>
  );
}

function TrafficLight({ signal }: { signal: "RED" | "GREEN" }) {
  const g = signal === "GREEN";
  return (
    <div className="tl-body" style={{ width: 20, gap: 3, padding: 4 }}>
      <div className={`tl-light tl-red  ${!g ? "on" : ""}`} style={{ width: 12, height: 12 }} />
      <div className="tl-light tl-amber" style={{ width: 9, height: 9 }} />
      <div className={`tl-light tl-green ${g ? "on" : ""}`} style={{ width: 12, height: 12 }} />
    </div>
  );
}

function LaneCard({ name, lane: l }: { name: string; lane: any }) {
  const pct = Math.min((l.vehicles / 40) * 100, 100);
  const c = LANE_COLORS[l.congestion];
  const g = l.signal === "GREEN";
  return (
    <div className="card" style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{name}</span>
        <span className={`pill ${g ? "pill-green" : "pill-red"}`} style={{ fontSize: 9 }}>{l.signal}</span>
      </Row>
      <Row style={{ gap: 10, alignItems: "flex-end" }}>
        <TrafficLight signal={l.signal} />
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{l.vehicles}</div>
          <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>vehicles</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: c }}>{l.congestion}</div>
          <div style={{ fontSize: 9, color: "var(--text-3)" }}>{l.green_time}s</div>
        </div>
      </Row>
      <div style={{ height: 4, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
          style={{ height: "100%", borderRadius: 4, background: c, boxShadow: `0 0 6px ${c}50` }} />
      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, sub, color }: { emoji: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ fontSize: 16 }}>{emoji}</span>
      </Row>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
      <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
      {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>{p.dataKey}: {p.value}</div>)}
    </div>
  );
}

const LANES = ["north", "south", "east", "west"] as const;

export default function Home() {
  const { data, connected, post } = useTrafficData();
  const impact = useImpactStats(data);
  const running = data.status === "RUNNING";
  const activeGreen = LANES.filter(l => data.lanes[l]?.signal === "GREEN").length;
  const laneArr = LANES.map(k => ({ key: k, name: k.charAt(0).toUpperCase() + k.slice(1), ...data.lanes[k] }));

  return (
    <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 50,
        borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0
      }}>
        <Row style={{ gap: 0 }}>
          <Row style={{ gap: 7 }}>
            <SmallDot color={connected ? "var(--green)" : "var(--red)"} pulse={!connected} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {connected ? "Backend Live" : "Offline"}
            </span>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Status</span>
            <span className={`pill ${running ? "pill-blue" : "pill-dim"}`} style={{ fontSize: 9 }}>
              {running ? data.mode.toUpperCase() : "IDLE"}
            </span>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Phase</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", fontFamily: "monospace" }}>{data.current_phase}</span>
          </Row>
          <Divider />
          {data.emergency_active
            ? <span className="pill pill-red" style={{ fontSize: 9 }}>🚨 EMERGENCY · {data.emergency_lane?.toUpperCase()}</span>
            : <span className="pill pill-green" style={{ fontSize: 9 }}>✓ No Emergency</span>
          }
        </Row>
        <Row style={{ gap: 8 }}>
          <button onClick={() => post(running ? "/stop" : "/start")} style={{
            padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none",
            background: running ? "rgba(255,255,255,0.08)" : "var(--accent)", color: "var(--text)"
          }}>
            {running ? "⬛ Stop" : "▶ Start"}
          </button>
          <button onClick={() => post(data.mode === "demo" ? "/demo/stop" : "/demo/start")} style={{
            padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer",
            border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)"
          }}>
            {data.mode === "demo" ? "⬛ Stop Demo" : "◉ Demo Mode"}
          </button>
          <Link href="/landing" style={{
            padding: "6px 12px", borderRadius: 8, fontWeight: 600, fontSize: 12,
            border: "1px solid var(--border)", color: "var(--text-3)", textDecoration: "none"
          }}>About ↗</Link>
        </Row>
      </div>

      {/* ── IMPACT COUNTER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {running && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 40, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 0, borderBottom: "1px solid var(--border)", background: "rgba(91,95,222,0.06)"
            }}>
            {[
              { emoji: "🚗", label: "vehicles served", val: <ImpactNum value={impact.vehiclesServed} />, color: "var(--text)" },
              { emoji: "⏱", label: "min wait time saved", val: <ImpactNum value={impact.minutesSaved} decimals={1} />, color: "#34d399" },
              { emoji: "🌿", label: "kg CO₂ avoided", val: <ImpactNum value={impact.co2Avoided} decimals={2} />, color: "#34d399" },
              { emoji: "🚑", label: "emergencies cleared", val: <ImpactNum value={impact.emergenciesCleared} />, color: "#fbbf24" },
            ].map((item, i) => (
              <Row key={i} style={{ gap: 0 }}>
                {i > 0 && <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 20px" }} />}
                <Row style={{ gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{item.emoji}</span>
                  {item.val}
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{item.label}</span>
                </Row>
              </Row>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GRID BODY ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "248px 1fr 248px",
        gridTemplateRows: "1fr 190px", gap: 1, background: "var(--border-2)"
      }}>

        {/* LEFT — Lane cards (full height) */}
        <div style={{
          background: "var(--bg)", padding: "16px 14px", display: "flex", flexDirection: "column",
          gap: 8, gridRow: "1 / 3", overflowY: "auto"
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Lane Status</div>
          {laneArr.map(l => <LaneCard key={l.key} name={l.name} lane={l} />)}
          {/* Phase timer */}
          <div className="card" style={{ padding: "12px 14px", marginTop: 4 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Phase Timer</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{Math.max(0, Math.round(data.phase_max - data.phase_timer))}s</span>
            </Row>
            <div style={{ height: 5, background: "var(--border-2)", borderRadius: 5, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${data.phase_max > 0 ? ((data.phase_max - data.phase_timer) / data.phase_max) * 100 : 0}%` }}
                transition={{ duration: 1, ease: "linear" }}
                style={{ height: "100%", borderRadius: 5, background: "linear-gradient(90deg,#5B5FDE,#7C3AED)" }} />
            </div>
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              {["NS", "EW"].map(p => (
                <div key={p} style={{
                  fontSize: 11, fontWeight: 800, color: data.current_phase === p ? "#818cf8" : "var(--text-3)",
                  padding: "2px 10px", borderRadius: 6, background: data.current_phase === p ? "rgba(91,95,222,0.15)" : "transparent"
                }}>
                  {p}
                </div>
              ))}
            </Row>
          </div>
        </div>

        {/* CENTER — Charts */}
        <div style={{ background: "var(--bg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Per-Lane History</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  {["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"].map((c, i) => (
                    <linearGradient key={i} id={`hg${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.25} /><stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                {LANES.map((l, i) => <Area key={l} type="monotone" dataKey={l}
                  stroke={["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"][i]} strokeWidth={1.5} fill={`url(#hg${i})`} dot={false} />)}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Row style={{ gap: 20, justifyContent: "center" }}>
            {LANES.map((l, i) => <Row key={l} style={{ gap: 5 }}>
              <div style={{ width: 8, height: 2, borderRadius: 2, background: ["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"][i] }} />
              <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "capitalize" }}>{l}</span>
            </Row>)}
          </Row>
        </div>

        {/* RIGHT — KPI (full height) */}
        <div style={{ background: "var(--bg)", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, gridRow: "1 / 3", overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Key Metrics</div>

          {/* Live Snapshot Component */}
          {running && <LiveSnapshot />}

          <StatCard emoji="🚗" label="Vehicles Detected" value={data.total_vehicles} sub="across all lanes" color="var(--text)" />
          <StatCard emoji="⚡" label="Signal Efficiency" value={`${data.quantum_efficiency}%`} sub="QAOA score vs baseline" color="#fbbf24" />
          <StatCard emoji="🚑" label="Emergency Alerts" value={data.emergency_active ? 1 : 0} sub={data.emergency_active ? `Lane: ${data.emergency_lane}` : "No incidents"} color={data.emergency_active ? "#f87171" : "var(--text)"} />
          <StatCard emoji="🟢" label="Active Green Lanes" value={activeGreen} sub={`${activeGreen} of 4 lanes green`} color="#34d399" />

          {/* Quick links */}
          <div className="card" style={{ padding: "12px 14px", marginTop: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Navigate</div>
            {[
              { href: "/monitoring", label: "Traffic Map", emoji: "📡" },
              { href: "/signals", label: "Signal Optimization", emoji: "⚡" },
              { href: "/emergency", label: "Emergency Corridor", emoji: "🚑" },
              { href: "/simulation", label: "Simulation Controls", emoji: "🎛️" },
              { href: "/detection", label: "AI Detection Lab", emoji: "🎥" },
              { href: "/prediction", label: "AI Prediction", emoji: "🧠" },
              { href: "/quantum", label: "Quantum Engine", emoji: "⚛️" },
              { href: "/rl", label: "RL Controller", emoji: "🤖" },
              { href: "/analytics", label: "Analytics", emoji: "📊" },
            ].map(nav => (
              <Link key={nav.href} href={nav.href} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderBottom: "1px solid var(--border-2)", textDecoration: "none", color: "var(--text-2)", fontSize: 12, fontWeight: 500
              }}>
                <span style={{ fontSize: 13 }}>{nav.emoji}</span>
                <span style={{ flex: 1 }}>{nav.label}</span>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* BOTTOM CENTER — Bar chart */}
        <div style={{ background: "var(--bg)", padding: "14px 20px", gridColumn: "2 / 3", borderTop: "1px solid var(--border-2)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Queue Depth</div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={laneArr} barSize={36} margin={{ left: -20, right: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="vehicles" radius={[4, 4, 2, 2]}>
                  {laneArr.map((l, i) => <Cell key={i} fill={LANE_COLORS[l.congestion]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── EMERGENCY BANNER ──────────────────────────────────────────── */}
      <AnimatePresence>
        {data.emergency_active && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 44, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{
              flexShrink: 0, overflow: "hidden", background: "rgba(239,68,68,0.1)",
              borderTop: "1px solid rgba(239,68,68,0.35)", display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "0 24px"
            }}>
            <Row style={{ gap: 10 }}>
              <div className="emerg-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>
                🚨 Emergency Green Corridor — Ambulance in <strong style={{ color: "white", textTransform: "uppercase" }}>{data.emergency_lane}</strong> lane
              </span>
            </Row>
            <Link href="/emergency" style={{
              fontSize: 11, fontWeight: 700, color: "#f87171", textDecoration: "none",
              border: "1px solid rgba(239,68,68,0.4)", padding: "4px 12px", borderRadius: 6
            }}>
              View Details →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
