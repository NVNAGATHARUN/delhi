"use client";
// MONITORING — Map + AI Detection + Predictive Forecast + Heatmap
import { useTrafficData } from "@/lib/useTrafficData";
import { LANE_COLORS } from "@/lib/api";
import { useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { Intersection } from "@/components/TrafficMap";

const TrafficMap = dynamic(() => import("@/components/TrafficMap"), {
    ssr: false,
    loading: () => (
        <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface)", color: "var(--text-3)", fontSize: 12
        }}>Loading map…</div>
    )
});

const LANE_KEYS = ["north", "south", "east", "west"] as const;
const DELHI_POS = [
    { id: "north", name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
    { id: "south", name: "India Gate Circle", lat: 28.6129, lng: 77.2295 },
    { id: "east", name: "ITO Intersection", lat: 28.6276, lng: 77.2420 },
    { id: "west", name: "Karol Bagh Chowk", lat: 28.6448, lng: 77.1901 },
];

// ── Simple linear regression prediction ──────────────────────────
function predictNext(history: any[], steps = 6) {
    if (history.length < 3) return [];
    const last = history.slice(-8);
    const dy = last[last.length - 1].total - last[0].total;
    const slope = dy / Math.max(last.length - 1, 1);
    const lastVal = last[last.length - 1].total;
    const t0 = history.length;
    return Array.from({ length: steps }, (_, i) => ({
        t: t0 + i,
        total: null,
        predicted: Math.max(0, Math.round(lastVal + slope * (i + 1))),
    }));
}

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
            {payload.filter((p: any) => p.value != null).map((p: any) => (
                <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>
                    {p.dataKey === "predicted" ? "📈 " : ""}{p.value} vehicles
                </div>
            ))}
        </div>
    );
}

export default function MonitoringPage() {
    const { data } = useTrafficData();
    const [showFeed, setShowFeed] = useState(false);
    const running = data.status === "RUNNING";
    const primaryIsect = data.intersections?.["north"];
    const laneArr = LANE_KEYS.map(k => ({
        key: k,
        name: k.charAt(0).toUpperCase() + k.slice(1),
        ...(primaryIsect?.lanes?.[k] ?? { vehicles: 0, congestion: "LOW", signal: "RED", green_time: 30 })
    }));

    const intersections: Intersection[] = useMemo(() => {
        return DELHI_POS.map(p => {
            const isect = data.intersections?.[p.id];
            return {
                id: p.id,
                name: p.name,
                lat: p.lat,
                lng: p.lng,
                signal: isect?.lanes?.north?.signal ?? "RED", // Aggregate or pick a representative lane
                vehicles: Object.values(isect?.lanes ?? {}).reduce((acc: number, l: any) => acc + (l.vehicles || 0), 0),
                congestion: isect?.lanes?.north?.congestion ?? "LOW",
            };
        });
    }, [data.intersections]);

    // Merge history + prediction for the forecast chart
    const forecastData = useMemo(() => {
        const hist = data.history.map(h => ({ t: h.t, total: h.total, predicted: null }));
        const preds = predictNext(data.history, 6);
        return [...hist, ...preds];
    }, [data.history]);

    const splitTick = data.history.length > 0 ? data.history[data.history.length - 1].t : 0;

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Traffic Monitoring</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 12 }}>4 Delhi intersections · Heatmap enabled</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="pill pill-dim" style={{ fontSize: 9, gap: 6 }}>
                        🔥 Congestion Heatmap
                    </div>
                    <div className="pill pill-dim" style={{ fontSize: 9, gap: 6 }}>
                        📈 Predictive Forecast
                    </div>
                    <div className={`pill ${running ? "pill-green" : "pill-dim"}`} style={{ fontSize: 9 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: running ? "var(--green)" : "var(--text-3)", ...(running ? { animation: "emerg 1.4s infinite" } : {}) }} />
                        {running ? "Live Feed" : "Standby"}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 308px", gridTemplateRows: "1fr 175px", gap: 1, background: "var(--border-2)" }}>

                {/* ── MAP ────────────────────────────────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            🗺 Live Intersection Map
                        </span>
                        <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--text-3)" }}>
                            {[["#ef4444", "HIGH"], ["#f59e0b", "MEDIUM"], ["#10b981", "LOW"]].map(([c, l]) => (
                                <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                                    {l}
                                </span>
                            ))}
                            {data.emergency_active && <span style={{ color: "#f87171", fontWeight: 700 }}>🚑 EMERGENCY</span>}
                        </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <TrafficMap intersections={intersections} emergencyActive={data.emergency_active} emergencyLane={data.emergency_lane} phase={data.current_phase} />
                    </div>
                </div>

                {/* ── AI DETECTION PANEL ──────────────────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "14px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                    {/* AI Detection terminal */}
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(129,140,248,0.25)", background: "#06060f" }}>
                        {/* Terminal header bar */}
                        <div style={{
                            padding: "8px 12px", background: "rgba(91,95,222,0.12)", borderBottom: "1px solid rgba(91,95,222,0.2)",
                            display: "flex", alignItems: "center", gap: 8
                        }}>
                            <div style={{ display: "flex", gap: 5 }}>
                                {["#ef4444", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", marginLeft: 4, fontFamily: "monospace" }}>
                                {showFeed ? "LIVE MJPEG STREAM" : "YOLOv8 DETECTION DATA"}
                            </span>
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                                <button
                                    onClick={() => setShowFeed(!showFeed)}
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 8, color: "var(--text-3)", cursor: "pointer" }}>
                                    {showFeed ? "Show Data" : "Show Feed"}
                                </button>
                                <div style={{
                                    width: 5, height: 5, borderRadius: "50%", background: running ? "var(--green)" : "var(--text-3)",
                                    ...(running ? { animation: "emerg 1.4s infinite" } : {})
                                }} />
                                <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "monospace" }}>
                                    {running ? "LIVE" : "IDLE"}
                                </span>
                            </div>
                        </div>
                        {/* Terminal body */}
                        <div style={{ minHeight: 180, position: "relative" }}>
                            {showFeed && running ? (
                                <img src={`${API}/camera/feed`} style={{ width: "100%", height: 180, objectFit: "cover" }} alt="feed" />
                            ) : (
                                <div style={{ padding: "12px", fontFamily: "monospace", fontSize: 11, lineHeight: 2 }}>
                                    <div style={{ color: "#818cf8", marginBottom: 4 }}>
                                        [YOLOv8] tick #{data.tick} · {(data as any).camera?.latency_ms ?? 0}ms latency
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.15)", marginBottom: 8 }}>───────────────────────</div>
                                    {laneArr.map(l => {
                                        const c = LANE_COLORS[l.congestion];
                                        return (
                                            <div key={l.key} style={{ display: "flex", gap: 0, color: "rgba(255,255,255,0.6)" }}>
                                                <span style={{ color: "rgba(255,255,255,0.3)", width: 64 }}>{l.name.toUpperCase().padEnd(6)}</span>
                                                <span style={{ color: "rgba(255,255,255,0.25)" }}>→</span>
                                                <span style={{ fontWeight: 700, color: "var(--text)", width: 40, textAlign: "right" }}> {String(l.vehicles).padStart(2, "0")}</span>
                                                <span style={{ color: "rgba(255,255,255,0.3)" }}> veh </span>
                                                <span style={{ fontWeight: 800, color: c }}>[{l.congestion}]</span>
                                            </div>
                                        );
                                    })}
                                    <div style={{ color: "rgba(255,255,255,0.15)", margin: "8px 0" }}>───────────────────────</div>
                                    <div style={{ color: data.emergency_active ? "#f87171" : "#34d399", fontWeight: 700 }}>
                                        {data.emergency_active
                                            ? `🚑 AMBULANCE DETECTED: ${data.emergency_lane?.toUpperCase()}`
                                            : "✓ No emergency vehicle"}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lane detail cards */}
                    {laneArr.map(l => {
                        const pct = Math.min((l.vehicles / 40) * 100, 100);
                        const c = LANE_COLORS[l.congestion];
                        const green = l.signal === "GREEN";
                        return (
                            <div key={l.key} className="card" style={{ padding: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{l.name}</span>
                                    <div style={{ display: "flex", gap: 5 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: `${c}15`, color: c, border: `1px solid ${c}25` }}>{l.congestion}</span>
                                        <span className={`pill ${green ? "pill-green" : "pill-red"}`} style={{ fontSize: 8 }}>{l.signal}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                                    {/* mini traffic light */}
                                    <div className="tl-body" style={{ width: 18, gap: 2, padding: 4 }}>
                                        <div className={`tl-light tl-red  ${!green ? "on" : ""}`} style={{ width: 10, height: 10 }} />
                                        <div className="tl-light tl-amber" style={{ width: 8, height: 8 }} />
                                        <div className={`tl-light tl-green ${green ? "on" : ""}`} style={{ width: 10, height: 10 }} />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{l.vehicles}</span>
                                        <span style={{ fontSize: 9, color: "var(--text-3)", marginLeft: 5 }}>vehicles</span>
                                    </div>
                                    <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-3)" }}>{l.green_time}s green</div>
                                </div>

                                {running && (data as any).camera?.by_type && (
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                        {Object.entries((data as any).camera.by_type).slice(0, 3).map(([type, count]: [string, any]) => (
                                            <div key={type} style={{ fontSize: 8, color: "var(--text-3)", background: "rgba(255,255,255,0.03)", padding: "2px 6px", borderRadius: 4, display: "flex", gap: 4 }}>
                                                <span style={{ textTransform: "capitalize" }}>{type}</span>
                                                <span style={{ fontWeight: 700, color: "var(--text-2)" }}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ height: 4, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                    <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                                        style={{ height: "100%", borderRadius: 4, background: c }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── BOTTOM CHARTS ─────────────────────────────────────────────── */}
                <div style={{ gridColumn: "1/-1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border-2)", borderTop: "1px solid var(--border-2)" }}>
                    {/* Per-lane history */}
                    <div style={{ background: "var(--bg)", padding: "12px 16px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Per-Lane History</div>
                        <div style={{ height: 120 }}>
                            <ResponsiveContainer>
                                <AreaChart data={data.history} margin={{ left: -25, right: 0 }}>
                                    <defs>{["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"].map((c, i) => (
                                        <linearGradient key={i} id={`ml${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c} stopOpacity={0.2} /><stop offset="100%" stopColor={c} stopOpacity={0} />
                                        </linearGradient>
                                    ))}</defs>
                                    <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTip />} />
                                    {LANE_KEYS.map((l, i) => <Area key={l} type="monotone" dataKey={l} stroke={["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"][i]} strokeWidth={1.5} fill={`url(#ml${i})`} dot={false} />)}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 📈 Predictive Forecast */}
                    <div style={{ background: "var(--bg)", padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>📈 Predictive Forecast</span>
                            <span className="pill pill-blue" style={{ fontSize: 8 }}>+6 Ticks</span>
                        </div>
                        <div style={{ height: 120 }}>
                            <ResponsiveContainer>
                                <LineChart data={forecastData} margin={{ left: -25, right: 8 }}>
                                    <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTip />} />
                                    {splitTick > 0 && <ReferenceLine x={splitTick} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" label={{ value: "now", fill: "rgba(255,255,255,0.25)", fontSize: 9 }} />}
                                    <Line type="monotone" dataKey="total" stroke="#5B5FDE" strokeWidth={2} dot={false} connectNulls={false} name="Actual" />
                                    <Line type="monotone" dataKey="predicted" stroke="#818cf8" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} name="Predicted" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "var(--text-3)" }}>
                                <div style={{ width: 14, height: 2, background: "#5B5FDE", borderRadius: 2 }} /> Actual
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "var(--text-3)" }}>
                                <div style={{ width: 14, height: 2, background: "#818cf8", borderRadius: 2, borderTop: "1px dashed #818cf8" }} /> Forecast
                            </div>
                        </div>
                    </div>

                    {/* Queue comparison */}
                    <div style={{ background: "var(--bg)", padding: "12px 16px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Queue Comparison</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {laneArr.map(l => {
                                const pct = Math.min((l.vehicles / 40) * 100, 100);
                                const c = LANE_COLORS[l.congestion];
                                return (
                                    <div key={l.key}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)" }}>{l.name}</span>
                                            <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                                                <span style={{ color: "var(--text-3)" }}>{l.vehicles} veh</span>
                                                <span style={{ fontWeight: 700, color: c }}>{l.congestion}</span>
                                            </div>
                                        </div>
                                        <div style={{ height: 6, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                            <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                                                style={{ height: "100%", borderRadius: 4, background: c, boxShadow: `0 0 5px ${c}50` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
