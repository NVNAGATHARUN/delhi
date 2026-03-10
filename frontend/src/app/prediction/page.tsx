"use client";
// PREDICTION — AI Traffic Congestion Prediction Page
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Brain } from "lucide-react";
import { useTrafficData } from "@/lib/useTrafficData";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CONGESTION_COLOR: Record<string, string> = {
    HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981"
};
const TREND_ICON = {
    INCREASING: <TrendingUp size={14} color="#ef4444" />,
    DECREASING: <TrendingDown size={14} color="#10b981" />,
    STABLE: <Minus size={14} color="#f59e0b" />,
};
const TREND_COLOR = { INCREASING: "#ef4444", DECREASING: "#10b981", STABLE: "#f59e0b" };

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
            {payload.filter((p: any) => p.value != null).map((p: any) => (
                <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>
                    {p.dataKey === "predicted" ? "📈 Forecast" : "● Actual"}: {p.value} vehicles
                </div>
            ))}
        </div>
    );
}

export default function PredictionPage() {
    const { data } = useTrafficData();
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [lastFetch, setLastFetch] = useState(0);

    const fetchPrediction = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const r = await fetch(`${API}/predict-traffic`);
            if (r.ok) {
                const d = await r.json();
                setPrediction(d);
                setLastFetch(Date.now());
            }
        } catch { }
        finally { setLoading(false); }
    }, [loading]);

    useEffect(() => {
        fetchPrediction();
        const iv = setInterval(fetchPrediction, 5000);
        return () => clearInterval(iv);
    }, []);

    const intersections = prediction?.intersections ?? {};
    const chart = prediction?.forecast_chart ?? [];
    const splitTick = chart.find((c: any) => c.predicted != null)?.t - 1;

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Brain size={18} color="#818cf8" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>AI Traffic Prediction</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>Rush-Hour Fourier · Trend Analysis · 5 & 10 min Forecast</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {loading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={14} color="var(--text-3)" /></motion.div>}
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{lastFetch ? `Updated ${Math.round((Date.now() - lastFetch) / 1000)}s ago` : "Fetching…"}</span>
                    <button onClick={fetchPrediction} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer" }}>
                        Refresh
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 320px", gap: 1, background: "var(--border-2)" }}>

                {/* LEFT — Forecast Chart + Intersection Cards */}
                <div style={{ background: "var(--bg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

                    {/* Forecast chart */}
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                            📈 Network Traffic Forecast — Actual + Predicted
                        </div>
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chart} margin={{ left: -20, right: 10 }}>
                                    <defs>
                                        <linearGradient id="actGr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#5B5FDE" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#5B5FDE" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="predGr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTip />} />
                                    {splitTick > 0 && <ReferenceLine x={splitTick} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" label={{ value: "now", fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />}
                                    <Area type="monotone" dataKey="actual" stroke="#5B5FDE" strokeWidth={2} fill="url(#actGr)" dot={false} connectNulls={false} name="Actual" />
                                    <Area type="monotone" dataKey="predicted" stroke="#818cf8" strokeWidth={2} strokeDasharray="6 4" fill="url(#predGr)" dot={false} connectNulls={false} name="Forecast" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 6 }}>
                            {[["#5B5FDE", "⸺", "Actual"], ["#818cf8", "- - -", "Forecast +8 ticks"]].map(([c, line, label]) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text-3)" }}>
                                    <span style={{ color: c }}>{line}</span> {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Intersection prediction cards */}
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                            Per-Intersection Forecast
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {Object.entries(intersections).map(([id, pred]: [string, any]) => {
                                const c5 = CONGESTION_COLOR[pred.prediction_5min?.congestion ?? "LOW"];
                                const c10 = CONGESTION_COLOR[pred.prediction_10min?.congestion ?? "LOW"];
                                const trend = pred.trend ?? "STABLE";
                                return (
                                    <motion.div key={id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="card" style={{ padding: "14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)" }}>{pred.name}</div>
                                                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", marginTop: 1 }}>{id} hub</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                {TREND_ICON[trend as keyof typeof TREND_ICON]}
                                                <span style={{ fontSize: 9, fontWeight: 700, color: TREND_COLOR[trend as keyof typeof TREND_COLOR] }}>{trend}</span>
                                            </div>
                                        </div>

                                        {/* Current */}
                                        <div style={{ padding: "8px 10px", borderRadius: 8, background: "var(--surface)", marginBottom: 8 }}>
                                            <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Current</div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: "var(--text)" }}>{pred.current_vehicles}</span>
                                                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${CONGESTION_COLOR[pred.current_congestion]}20`, color: CONGESTION_COLOR[pred.current_congestion], border: `1px solid ${CONGESTION_COLOR[pred.current_congestion]}30` }}>
                                                    {pred.current_congestion}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Predictions */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                            {[["5 min", pred.prediction_5min, c5], ["10 min", pred.prediction_10min, c10]].map(([label, p, c]: any) => (
                                                <div key={label} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${c}25`, background: `${c}08` }}>
                                                    <div style={{ fontSize: 8, color: "var(--text-3)", marginBottom: 4 }}>📅 +{label}</div>
                                                    <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "monospace", color: c }}>{p?.vehicles ?? "–"}</div>
                                                    <div style={{ fontSize: 8, fontWeight: 700, color: c, marginTop: 1 }}>{p?.congestion ?? "–"}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT — Algorithm info + How It Works */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Prediction Engine</div>

                    <div className="card" style={{ padding: "14px", border: "1px solid rgba(129,140,248,0.25)", background: "rgba(91,95,222,0.05)" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#818cf8", marginBottom: 8 }}>🤖 AI Model</div>
                        <div style={{ fontSize: 10, color: "var(--text-2)", lineHeight: 1.7 }}>
                            Rush-Hour Fourier + Poisson Arrival Trend Extrapolation.<br />
                            Predicts vehicle count for <strong>+5 min</strong> and <strong>+10 min</strong> per intersection.
                        </div>
                    </div>

                    <div className="card" style={{ padding: "14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>How Prediction Works</div>
                        {[
                            ["1 · Rush-Hour Factor", "Models morning (8am) and evening (5pm) peak patterns using Gaussian curves."],
                            ["2 · Trend Analysis", "Extrapolates short-term queue growth slope from last 8 data points."],
                            ["3 · Arrival Scaling", "Scales current load by ratio of future rush factor vs. current."],
                            ["4 · Congestion Classify", "Maps predicted vehicle count to LOW / MEDIUM / HIGH thresholds."],
                        ].map(([t, d]) => (
                            <div key={t as string} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-2)" }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", minWidth: 140 }}>{t}</div>
                                <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5 }}>{d}</div>
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Congestion Levels</div>
                        {[["HIGH", "#ef4444", "≥70% capacity · >28 vehicles"], ["MEDIUM", "#f59e0b", "35–70% · 14–28 vehicles"], ["LOW", "#10b981", "<35% · <14 vehicles"]].map(([l, c, d]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: c, width: 60 }}>{l}</span>
                                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{d}</span>
                            </div>
                        ))}
                    </div>

                    {/* Trend legend */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Traffic Trend</div>
                        {[
                            ["INCREASING", "#ef4444", "+10% growth expected"],
                            ["STABLE", "#f59e0b", "±10% variation"],
                            ["DECREASING", "#10b981", ">10% reduction expected"],
                        ].map(([l, c, d]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                                {TREND_ICON[l as keyof typeof TREND_ICON]}
                                <span style={{ fontSize: 11, fontWeight: 700, color: c, width: 90 }}>{l}</span>
                                <span style={{ fontSize: 10, color: "var(--text-3)" }}>{d}</span>
                            </div>
                        ))}
                    </div>

                    {/* Current system info */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>System State</div>
                        {[
                            ["Simulation", data.status],
                            ["Current Tick", `#${data.tick}`],
                            ["Total Vehicles", data.total_vehicles],
                            ["Algorithm", prediction?.algorithm ?? "—"],
                        ].map(([l, v]) => (
                            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-2)", fontSize: 11 }}>
                                <span style={{ color: "var(--text-3)" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: "#818cf8", fontFamily: "monospace" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
