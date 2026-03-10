"use client";
// SIMULATION — With Digital Twin animated intersection view
import { useTrafficData } from "@/lib/useTrafficData";
import { LANE_COLORS } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const SCENES = [
    { n: 1, title: "Normal Traffic", desc: "Balanced quantum signal distribution", color: "#5B5FDE" },
    { n: 2, title: "Rush Hour", desc: "N-S lanes fill to HIGH congestion", color: "#f59e0b" },
    { n: 3, title: "QAOA Optimizes", desc: "Quantum phase shift decongests N-S", color: "#10b981" },
    { n: 4, title: "Emergency Override", desc: "Ambulance — all intersection lights GREEN", color: "#ef4444" },
    { n: 5, title: "System Recovery", desc: "Adaptive optimization resumes", color: "#7C3AED" },
];

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
            {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>{p.value}</div>)}
        </div>
    );
}

// ── Digital Twin SVG ─────────────────────────────────────────────────────────
function DigitalTwin({ lanes, phase, emergencyActive, emergencyLane }: any) {
    const S = 260, C = S / 2, RW = 36;
    const LANE_ENTRIES = ["north", "south", "east", "west"] as const;
    const sigColor = (lane: string) => lanes[lane]?.signal === "GREEN" ? "#10b981" : "#ef4444";
    const cong = (lane: string) => LANE_COLORS[lanes[lane]?.congestion ?? "LOW"];

    // Vehicle dots — 3 per lane max, positioned proportionally
    const dots = LANE_ENTRIES.map(lane => {
        const v = Math.min(lanes[lane]?.vehicles ?? 0, 6);
        const green = lanes[lane]?.signal === "GREEN";
        const positions = Array.from({ length: v }, (_, i) => i);
        return { lane, v, green, positions };
    });

    return (
        <svg viewBox={`0 0 ${S} ${S}`} width="100%" height="100%" style={{ maxHeight: 260 }}>
            {/* Background */}
            <rect width={S} height={S} fill="#040410" rx="12" />
            {/* City blocks */}
            {[[4, 4], [C + RW + 4, 4], [4, C + RW + 4], [C + RW + 4, C + RW + 4]].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width={C - RW - 8} height={C - RW - 8} fill="#08081a" rx="8" />
            ))}
            {/* Roads */}
            <rect x={C - RW} y={0} width={RW * 2} height={S} fill="#0d1424" />
            <rect x={0} y={C - RW} width={S} height={RW * 2} fill="#0d1424" />
            {/* Road markings */}
            {[30, 70, 110, 150, 190, 230].map(y => <rect key={y} x={C - 2} y={y} width={4} height={12} fill="rgba(255,255,255,0.08)" rx="1" />)}
            {[30, 70, 110, 150, 190, 230].map(x => <rect key={x} x={x} y={C - 2} width={12} height={4} fill="rgba(255,255,255,0.08)" rx="1" />)}
            {/* Green lane tint if signal is GREEN */}
            {lanes.north?.signal === "GREEN" && <rect x={C} y={0} width={RW} height={C - RW} fill="rgba(16,185,129,0.06)" />}
            {lanes.south?.signal === "GREEN" && <rect x={C - RW} y={C + RW} width={RW} height={C - RW} fill="rgba(16,185,129,0.06)" />}
            {lanes.east?.signal === "GREEN" && <rect x={C + RW} y={C - RW} width={C - RW} height={RW} fill="rgba(16,185,129,0.06)" />}
            {lanes.west?.signal === "GREEN" && <rect x={0} y={C} width={C - RW} height={RW} fill="rgba(16,185,129,0.06)" />}
            {/* Intersection box */}
            <rect x={C - RW} y={C - RW} width={RW * 2} height={RW * 2} fill="#0a1020" />
            {/* Center circle — phase indicator */}
            <circle cx={C} cy={C} r={22} fill="rgba(91,95,222,0.12)" stroke="rgba(91,95,222,0.4)" strokeWidth={1.5} />
            <text x={C} y={C + 5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#818cf8" fontFamily="monospace">{phase}</text>
            {/* Traffic lights at each arm */}
            {[
                { lane: "north", lx: C - RW - 12, ly: C - RW - 12, sig: sigColor("north") },
                { lane: "south", lx: C + RW + 2, ly: C + RW + 2, sig: sigColor("south") },
                { lane: "east", lx: C + RW + 2, ly: C - RW - 12, sig: sigColor("east") },
                { lane: "west", lx: C - RW - 12, ly: C + RW + 2, sig: sigColor("west") },
            ].map(tl => (
                <g key={tl.lane}>
                    <rect x={tl.lx} y={tl.ly} width={10} height={18} fill="#06060f" rx="3" />
                    <circle cx={tl.lx + 5} cy={tl.ly + 5} r={3} fill={tl.sig === "#ef4444" ? "#ef4444" : "#1a0808"} opacity={0.9} />
                    <circle cx={tl.lx + 5} cy={tl.ly + 13} r={3} fill={tl.sig === "#10b981" ? "#10b981" : "#081a0e"} opacity={0.9} />
                    {tl.sig === "#ef4444" && <circle cx={tl.lx + 5} cy={tl.ly + 5} r={5} fill="#ef4444" opacity={0.2} />}
                    {tl.sig === "#10b981" && <circle cx={tl.lx + 5} cy={tl.ly + 13} r={5} fill="#10b981" opacity={0.2} />}
                </g>
            ))}
            {/* Vehicle count labels */}
            {[
                { lane: "north", x: C - RW - 22, y: C - RW / 2 },
                { lane: "south", x: C + RW + 6, y: C + RW + RW / 2 },
                { lane: "east", x: C + RW + RW / 2, y: C - RW - 8 },
                { lane: "west", x: C - RW / 2, y: C + RW + 15 },
            ].map(({ lane, x, y }) => (
                <text key={lane} x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="900"
                    fill={cong(lane)} fontFamily="monospace">
                    {lanes[lane]?.vehicles ?? 0}
                </text>
            ))}
            {/* Congestion bars (fill amount in road arms) */}
            {[
                { lane: "north", x: C, y: C - RW - 60, w: RW, h: 60 },
                { lane: "south", x: C - RW, y: C + RW, w: RW, h: 60 },
                { lane: "east", x: C + RW, y: C - RW, w: 60, h: RW },
                { lane: "west", x: C - 100, y: C, w: 60, h: RW },
            ].map(({ lane, x, y, w, h }) => {
                const pct = Math.min((lanes[lane]?.vehicles ?? 0) / 40, 1);
                const c = cong(lane);
                return (
                    <rect key={lane} x={x} y={y} width={w} height={h * pct} fill={c} opacity={0.15} rx={2} />
                );
            })}
            {/* Ambulance indicator */}
            {emergencyActive && (
                <>
                    <circle cx={C + 10} cy={C - RW - 40} r={10} fill="#ef4444" opacity={0.9}>
                        <animate attributeName="cy" values={`${C - RW - 40};${C - RW + 2}`} dur="1s" repeatCount="indefinite" />
                    </circle>
                    <text x={C + 10} y={C - RW - 35} textAnchor="middle" fontSize="10">
                        🚑
                        <animate attributeName="y" values={`${C - RW - 35};${C - RW + 7}`} dur="1s" repeatCount="indefinite" />
                    </text>
                </>
            )}
            {/* Labels */}
            {[["N", C - RW - 8, 12], ["S", C + RW + 10, S - 4], ["E", S - 8, C - RW - 4], ["W", 6, C + RW + 12]].map(([l, x, y]) => (
                <text key={l as string} x={x as number} y={y as number} fontSize="9" fontWeight="700"
                    fill="rgba(255,255,255,0.2)" textAnchor="middle">{l}</text>
            ))}
        </svg>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-2)" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#818cf8" }}>{value}</span>
        </div>
    );
}

export default function SimulationPage() {
    const { data, post } = useTrafficData();
    const running = data.status === "RUNNING";
    const isDemo = data.mode === "demo";
    const isLive = data.mode === "live" && running;
    const pct = data.phase_max > 0 ? ((data.phase_max - data.phase_timer) / data.phase_max) * 100 : 0;

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Simulation Control</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 12 }}>Digital Twin · Physics Engine · QAOA</span>
                </div>
                <div className={`pill ${running ? isDemo ? "pill-blue" : "pill-green" : "pill-dim"}`} style={{ fontSize: 11, padding: "4px 12px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: running ? isDemo ? "#818cf8" : "var(--green)" : "var(--text-3)", ...(running ? { animation: "emerg 1.4s infinite" } : {}) }} />
                    {running ? (isDemo ? "DEMO MODE" : "LIVE SIMULATION") : "IDLE"}
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "280px 1fr 240px", gap: 1, background: "var(--border-2)" }}>

                {/* LEFT: Controls */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Controls</div>

                    {/* Live */}
                    <div className="card" style={{ padding: "16px", ...(isLive ? { border: "1px solid rgba(16,185,129,0.3)" } : {}) }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>▶ Live Simulation</div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 14 }}>
                            Poisson arrivals · saturation-flow departures · rush-hour patterns.
                        </div>
                        <button onClick={() => post(isLive ? "/stop" : "/start")}
                            style={{
                                width: "100%", padding: "10px", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none",
                                background: isLive ? "rgba(255,255,255,0.08)" : "var(--green)", color: "white"
                            }}>
                            {isLive ? "⬛ Stop" : "▶ Start Live"}
                        </button>
                    </div>

                    {/* Demo */}
                    <div className="card" style={{ padding: "16px", ...(isDemo ? { border: "1px solid rgba(91,95,222,0.35)" } : {}) }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>◉ Demo Mode</div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 14 }}>
                            5 scripted scenes · ~90 seconds · perfect for presentations.
                        </div>
                        <button onClick={() => post(isDemo ? "/demo/stop" : "/demo/start")}
                            style={{
                                width: "100%", padding: "10px", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none",
                                background: isDemo ? "rgba(255,255,255,0.08)" : "var(--accent)", color: "white"
                            }}>
                            {isDemo ? "⬛ Stop Demo" : "◉ Start Demo"}
                        </button>
                    </div>

                    {/* Demo scenes */}
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Demo Scenes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {SCENES.map(s => (
                            <div key={s.n} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 10px", borderRadius: 10, border: `1px solid ${s.color}20`, background: `${s.color}08` }}>
                                <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.color, color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{s.title}</div>
                                    <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: Digital Twin */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                🏙️ Digital Twin — Intersection View
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span className="pill pill-dim" style={{ fontSize: 8 }}>Real-time signals</span>
                            {data.emergency_active && <span className="pill pill-red" style={{ fontSize: 8 }}>🚑 Emergency</span>}
                        </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <DigitalTwin lanes={data.lanes} phase={data.current_phase} emergencyActive={data.emergency_active} emergencyLane={data.emergency_lane} />
                    </div>
                    {/* Phase timer below twin */}
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginBottom: 6 }}>
                            <span>Phase: <strong style={{ color: "#818cf8" }}>{data.current_phase}</strong></span>
                            <span>{Math.max(0, Math.round(data.phase_max - data.phase_timer))}s remaining</span>
                        </div>
                        <div style={{ height: 5, background: "var(--border-2)", borderRadius: 5, overflow: "hidden" }}>
                            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "linear" }}
                                style={{ height: "100%", borderRadius: 5, background: "linear-gradient(90deg,#5B5FDE,#7C3AED)" }} />
                        </div>
                    </div>
                    {/* Network chart */}
                    <div style={{ height: 155 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Network Load</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.history} margin={{ left: -20, right: 8 }}>
                                <defs>
                                    <linearGradient id="sgr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#5B5FDE" stopOpacity={0.3} /><stop offset="100%" stopColor="#5B5FDE" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Area type="monotone" dataKey="total" stroke="#5B5FDE" strokeWidth={2} fill="url(#sgr)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div style={{ background: "var(--bg)", padding: "16px", overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Live Stats</div>
                    <StatRow label="Tick" value={`#${data.tick}`} />
                    <StatRow label="Total Vehicles" value={data.total_vehicles} />
                    <StatRow label="Q-Efficiency" value={`${data.quantum_efficiency}%`} />
                    <StatRow label="Phase" value={data.current_phase} />
                    <StatRow label="Phase Duration" value={`${data.phase_max}s`} />
                    <StatRow label="Status" value={data.status} />
                    <StatRow label="Mode" value={data.mode} />
                    {Object.entries(data.lanes).map(([k, l]) => (
                        <StatRow key={k} label={`${k.charAt(0).toUpperCase() + k.slice(1)} Veh`} value={(l as any).vehicles ?? 0} />
                    ))}
                    {data.emergency_active && (
                        <div style={{ marginTop: 14, padding: "12px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <div className="emerg-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171" }}>Emergency Active</span>
                            </div>
                            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 5 }}>
                                Lane: <strong style={{ color: "#f87171", textTransform: "uppercase" }}>{data.emergency_lane}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
