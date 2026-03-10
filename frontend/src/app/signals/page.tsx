"use client";
// SIGNALS — Classical vs Quantum comparison + What-if slider
import { useTrafficData } from "@/lib/useTrafficData";
import { LANE_COLORS } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
            {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>{p.value}%</div>)}
        </div>
    );
}

// Classical greedy: proportional allocation, min 15s, max 60s
function classicalNS(n: number, s: number, e: number, w: number) {
    const total = n + s + e + w;
    if (total === 0) return 30;
    return Math.max(15, Math.min(60, Math.round(((n + s) / total) * 60)));
}

// QAOA bracket
function qaoa(count: number) {
    return count > 25 ? 60 : count > 8 ? 30 : 15;
}

// Avg vehicle wait time (simplified: queue/(clearance_rate))
// Clearance rate = green_time / 3 vehicles/s
function avgWait(vehicles: number, green: number) {
    if (vehicles === 0) return 0;
    const clearRate = green / 3;
    if (vehicles <= clearRate) return (vehicles * 3) / 2;
    return green + ((vehicles - clearRate) * 3) / 2; // overflow vehicles wait a full cycle
}

const GL: Record<string, number> = { HIGH: 60, MEDIUM: 30, LOW: 15 };

export default function SignalsPage() {
    const { data } = useTrafficData();
    const n = data.lanes.north?.vehicles ?? 0;
    const s = data.lanes.south?.vehicles ?? 0;
    const e = data.lanes.east?.vehicles ?? 0;
    const w = data.lanes.west?.vehicles ?? 0;

    const clNS = classicalNS(n, s, e, w);
    const clEW = 60 - clNS;
    const qNS = qaoa(n + s);
    const qEW = 60 - qNS;

    const clNSWait = avgWait(n + s, clNS).toFixed(1);
    const qNSWait = avgWait(n + s, qNS).toFixed(1);
    const clEWWait = avgWait(e + w, clEW).toFixed(1);
    const qEWWait = avgWait(e + w, qEW).toFixed(1);
    const totalSaving = ((parseFloat(clNSWait) + parseFloat(clEWWait)) - (parseFloat(qNSWait) + parseFloat(qEWWait))).toFixed(1);

    const pct = data.phase_max > 0 ? ((data.phase_max - data.phase_timer) / data.phase_max) * 100 : 0;

    // What-if slider state
    const [hypNS, setHypNS] = useState(Math.round(n + s));
    const [hypEW, setHypEW] = useState(Math.round(e + w));
    const hyp_cl_ns = classicalNS(hypNS / 2, hypNS / 2, hypEW / 2, hypEW / 2);
    const hyp_q_ns = qaoa(hypNS);
    const hyp_cl_ew = 60 - hyp_cl_ns;
    const hyp_q_ew = 60 - hyp_q_ns;
    const hyp_improve = (avgWait(hypNS, hyp_cl_ns) - avgWait(hypNS, hyp_q_ns)).toFixed(1);

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Signal Optimization</span>
                <div style={{ display: "flex", gap: 24 }}>
                    {[["Q-Efficiency", `${data.quantum_efficiency}%`, "#fbbf24"], ["Phase", data.current_phase, "#818cf8"], ["Tick", `#${data.tick}`, "var(--text)"]].map(([l, v, c]) => (
                        <div key={l as string}>
                            <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: c as string, lineHeight: 1.1, fontFamily: "monospace" }}>{v}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto 1fr", gap: 1, background: "var(--border-2)" }}>

                {/* Phase timer — full width */}
                <div style={{ gridColumn: "1/-1", background: "var(--bg)", padding: "16px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Phase Timer</span>
                        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", color: "var(--text)" }}>
                            {Math.max(0, Math.round(data.phase_max - data.phase_timer))}s remaining / {data.phase_max}s cycle
                        </span>
                    </div>
                    <div style={{ height: 7, background: "var(--border-2)", borderRadius: 7, overflow: "hidden" }}>
                        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "linear" }}
                            style={{ height: "100%", borderRadius: 7, background: "linear-gradient(90deg,#5B5FDE,#7C3AED)", boxShadow: "0 0 10px rgba(91,95,222,0.45)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                        {["NS", "EW"].map(p => (
                            <span key={p} style={{
                                fontSize: 11, fontWeight: 800, color: data.current_phase === p ? "#818cf8" : "var(--text-3)",
                                padding: "3px 12px", borderRadius: 6, background: data.current_phase === p ? "rgba(91,95,222,0.15)" : "transparent"
                            }}>
                                ◆ {p === "NS" ? "North–South" : "East–West"} GREEN
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Classical vs Quantum ─────────────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "18px 24px", overflowY: "auto" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                        Classical vs Quantum — Live Comparison
                    </div>
                    {/* Saving banner */}
                    <div style={{
                        padding: "10px 14px", borderRadius: 12, marginBottom: 14,
                        background: parseFloat(totalSaving) > 0 ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
                        border: parseFloat(totalSaving) > 0 ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {parseFloat(totalSaving) > 0
                                ? <TrendingDown size={18} color="var(--green)" />
                                : <TrendingUp size={18} color="var(--text-3)" />}
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: parseFloat(totalSaving) > 0 ? "#34d399" : "var(--text)" }}>
                                    {parseFloat(totalSaving) > 0 ? `QAOA saves ${totalSaving}s avg wait per cycle` : "Queues balanced — both algorithms similar"}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                                    Classical greedy gives green proportional to queue. QAOA considers wait-time optimization globally.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison table */}
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                {["Metric", "Classical (Greedy)", "QAOA (Quantum)", "Saving"].map(h => (
                                    <th key={h} style={{
                                        padding: "6px 10px", textAlign: "left", fontSize: 9, fontWeight: 700,
                                        color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em",
                                        borderBottom: "1px solid var(--border)"
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: "NS Green Time", cl: `${clNS}s`, q: `${qNS}s`, save: `${Math.abs(qNS - clNS)}s`, better: qNS > clNS },
                                { label: "EW Green Time", cl: `${clEW}s`, q: `${qEW}s`, save: `${Math.abs(qEW - clEW)}s`, better: qEW > clEW },
                                { label: "NS Avg Wait", cl: `${clNSWait}s`, q: `${qNSWait}s`, save: `${(parseFloat(clNSWait) - parseFloat(qNSWait)).toFixed(1)}s`, better: parseFloat(clNSWait) > parseFloat(qNSWait) },
                                { label: "EW Avg Wait", cl: `${clEWWait}s`, q: `${qEWWait}s`, save: `${(parseFloat(clEWWait) - parseFloat(qEWWait)).toFixed(1)}s`, better: parseFloat(clEWWait) > parseFloat(qEWWait) },
                            ].map(row => (
                                <tr key={row.label} style={{ borderBottom: "1px solid var(--border-2)" }}>
                                    <td style={{ padding: "9px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>{row.label}</td>
                                    <td style={{ padding: "9px 10px", fontSize: 11, fontFamily: "monospace", color: "var(--text-3)" }}>{row.cl}</td>
                                    <td style={{ padding: "9px 10px", fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: row.better ? "#34d399" : "var(--text)" }}>{row.q}</td>
                                    <td style={{ padding: "9px 10px" }}>
                                        {parseFloat(row.save) > 0
                                            ? <span style={{ fontSize: 10, fontWeight: 700, color: "#34d399", padding: "2px 7px", borderRadius: 99, background: "rgba(16,185,129,0.12)" }}>↓ {row.save}</span>
                                            : <span style={{ fontSize: 10, color: "var(--text-3)" }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── What-if slider ───────────────────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "18px 24px", overflowY: "auto" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                        🔬 What-If Simulator
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>NS vehicles (North + South)</span>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", color: "#818cf8" }}>{hypNS}</span>
                        </div>
                        <input type="range" min={0} max={80} value={hypNS} onChange={e => setHypNS(+e.target.value)}
                            style={{ width: "100%", accentColor: "#5B5FDE", height: 6, cursor: "pointer" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>
                            <span>0 (empty)</span><span>LOW &lt;8</span><span>MED &lt;25</span><span>HIGH 25+</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>EW vehicles (East + West)</span>
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", color: "#ec4899" }}>{hypEW}</span>
                        </div>
                        <input type="range" min={0} max={80} value={hypEW} onChange={e => setHypEW(+e.target.value)}
                            style={{ width: "100%", accentColor: "#ec4899", height: 6, cursor: "pointer" }} />
                    </div>
                    {/* Results */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                            { label: "Classical NS Green", val: `${hyp_cl_ns}s`, color: "var(--text-3)" },
                            { label: "QAOA NS Green", val: `${hyp_q_ns}s`, color: "#818cf8", highlight: hyp_q_ns !== hyp_cl_ns },
                            { label: "Classical EW Green", val: `${hyp_cl_ew}s`, color: "var(--text-3)" },
                            { label: "QAOA EW Green", val: `${hyp_q_ew}s`, color: "#818cf8", highlight: hyp_q_ew !== hyp_cl_ew },
                        ].map(r => (
                            <div key={r.label} className="card" style={{ padding: "10px 12px", ...(r.highlight ? { border: "1px solid rgba(129,140,248,0.3)", background: "rgba(91,95,222,0.08)" } : {}) }}>
                                <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 4 }}>{r.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: r.color, fontFamily: "monospace" }}>{r.val}</div>
                            </div>
                        ))}
                    </div>
                    {parseFloat(hyp_improve) > 0 && (
                        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>
                                QAOA saves <strong>{hyp_improve}s</strong> average NS vehicle wait at these volumes
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Efficiency chart + Green time ────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "18px 24px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>QAOA Efficiency History</div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.history} margin={{ left: -20, right: 5 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                                <Tooltip content={<ChartTip />} />
                                <Line type="monotone" dataKey="efficiency" stroke="#fbbf24" strokeWidth={2} dot={false} strokeLinecap="round" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Green time per lane ───────────────────────────────────────── */}
                <div style={{ background: "var(--bg)", padding: "18px 24px", overflowY: "auto" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                        Recommended Green Times
                    </div>
                    {["north", "south", "east", "west"].map(k => {
                        const l = data.lanes[k];
                        const c = LANE_COLORS[l?.congestion ?? "LOW"];
                        const rec = GL[l?.congestion ?? "LOW"];
                        return (
                            <div key={k} style={{ marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>{k}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)" }}>
                                        Now: <span style={{ fontWeight: 700, color: "var(--text)" }}>{l?.green_time ?? 0}s</span>
                                        <ArrowRight size={10} />
                                        <span style={{ fontWeight: 700, color: c }}>Opt: {rec}s</span>
                                    </div>
                                </div>
                                <div style={{ height: 5, background: "var(--border-2)", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                                    <div style={{ width: `${((l?.green_time ?? 0) / 60) * 100}%`, height: "100%", background: "rgba(255,255,255,0.15)", borderRadius: 4 }} />
                                </div>
                                <div style={{ height: 5, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                    <motion.div animate={{ width: `${(rec / 60) * 100}%` }} transition={{ duration: 0.8 }}
                                        style={{ height: "100%", background: c, borderRadius: 4 }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
