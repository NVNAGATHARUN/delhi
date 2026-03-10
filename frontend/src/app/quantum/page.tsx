"use client";
// QUANTUM — QAOA Multi-Intersection Optimization Dashboard
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import { Atom, Zap, RefreshCw, Network } from "lucide-react";
import { useTrafficData } from "@/lib/useTrafficData";
import { LANE_COLORS } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INT_COLORS: Record<string, string> = {
    north: "#5B5FDE", south: "#7C3AED", east: "#ec4899", west: "#f59e0b"
};

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
            {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>{p.value}</div>)}
        </div>
    );
}

// Animated QAOA circuit visualization
function QAOACircuit({ efficiency }: { efficiency: number }) {
    const [phase, setPhase] = useState(0);
    useEffect(() => {
        const iv = setInterval(() => setPhase(p => (p + 1) % 360), 50);
        return () => clearInterval(iv);
    }, []);
    const r = 80, cx = 120, cy = 120;
    const qubits = 4;
    return (
        <svg viewBox="0 0 240 240" width="100%" height="200">
            <rect width="240" height="240" fill="#040410" rx="14" />
            {/* Qubit lines */}
            {Array.from({ length: qubits }, (_, i) => {
                const y = 40 + i * 50;
                return <line key={i} x1="20" y1={y} x2="220" y2={y} stroke="rgba(129,140,248,0.2)" strokeWidth="1.5" />;
            })}
            {/* Gate boxes */}
            {Array.from({ length: qubits }, (_, i) => {
                const y = 40 + i * 50;
                return (
                    <g key={i}>
                        <rect x="40" y={y - 10} width="24" height="20" fill="rgba(91,95,222,0.3)" stroke="#5B5FDE" strokeWidth="1" rx="3" />
                        <text x="52" y={y + 5} textAnchor="middle" fontSize="9" fill="#818cf8" fontWeight="bold">H</text>
                        <rect x="100" y={y - 10} width="24" height="20" fill="rgba(124,58,237,0.3)" stroke="#7C3AED" strokeWidth="1" rx="3" />
                        <text x="112" y={y + 5} textAnchor="middle" fontSize="9" fill="#a78bfa" fontWeight="bold">Rz</text>
                        <rect x="160" y={y - 10} width="24" height="20" fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="1" rx="3" />
                        <text x="172" y={y + 5} textAnchor="middle" fontSize="9" fill="#34d399" fontWeight="bold">CNOT</text>
                    </g>
                );
            })}
            {/* CNOT connections */}
            <line x1="172" y1="90" x2="172" y2="140" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="172" y1="140" x2="172" y2="190" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" />
            {/* Efficiency oscillation */}
            <circle cx="210" cy="90" r="12" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="210" y="95" textAnchor="middle" fontSize="8" fill="#fbbf24" fontWeight="bold">{Math.round(efficiency)}%</text>
            {/* Animated quantum pulse */}
            <circle cx={20 + (phase / 360) * 200} cy={40} r="3" fill="#818cf8" opacity="0.8" />
            <circle cx={20 + ((phase + 90) / 360) * 200} cy={90} r="3" fill="#a78bfa" opacity="0.8" />
            <circle cx={20 + ((phase + 180) / 360) * 200} cy={140} r="3" fill="#ec4899" opacity="0.8" />
            <circle cx={20 + ((phase + 270) / 360) * 200} cy={190} r="3" fill="#f59e0b" opacity="0.8" />
        </svg>
    );
}

export default function QuantumPage() {
    const { data } = useTrafficData();
    const [qData, setQData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchQ = useCallback(async () => {
        try {
            const r = await fetch(`${API}/quantum-optimize-multi`);
            if (r.ok) setQData(await r.json());
        } catch { }
    }, []);

    useEffect(() => {
        fetchQ();
        const iv = setInterval(fetchQ, 3000);
        return () => clearInterval(iv);
    }, []);

    const intersections = qData?.intersections ?? {};
    const networkEff = qData?.network_efficiency ?? 0;
    const intIds = Object.keys(intersections);

    // Radar chart data
    const radarData = intIds.map(id => ({
        intersection: intersections[id]?.name?.split(" ")[0] ?? id,
        efficiency: intersections[id]?.efficiency ?? 0,
    }));

    // Bar chart for vehicle counts
    const barData = intIds.map(id => ({
        name: id.charAt(0).toUpperCase() + id.slice(1),
        vehicles: Object.values(intersections[id]?.lanes ?? {}).reduce((s: number, l: any) => s + (l.vehicles ?? 0), 0),
    }));

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Atom size={18} color="#818cf8" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Quantum Engine</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>QAOA · Qiskit · Multi-Intersection Optimization</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase" }}>Network Efficiency</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", lineHeight: 1.1, fontFamily: "monospace" }}>{networkEff}%</div>
                    </div>
                    <div className={`pill ${qData?.quantum_advantage ? "pill-blue" : "pill-dim"}`} style={{ fontSize: 9 }}>
                        <Zap size={10} /> {qData?.quantum_advantage ? "QUANTUM ACTIVE" : "LOADING"}
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "240px 1fr 280px", gap: 1, background: "var(--border-2)" }}>

                {/* LEFT — QAOA Circuit */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>QAOA Circuit</div>
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(129,140,248,0.2)" }}>
                        <QAOACircuit efficiency={networkEff} />
                    </div>
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Algorithm: QAOA</div>
                        {[
                            ["Qubits", `${intIds.length} (one per intersection)`],
                            ["Layers (p)", "1 (QAOA depth)"],
                            ["Optimizer", "COBYLA"],
                            ["Problem", "QUBO — Binary Phase Selection"],
                            ["Nodes", `${qData?.nodes_optimized ?? 0} intersections`],
                        ].map(([l, v]) => (
                            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-2)", fontSize: 10 }}>
                                <span style={{ color: "var(--text-3)" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: "#818cf8", fontSize: 9, fontFamily: "monospace" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    <div className="card" style={{ padding: "12px 14px", border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.04)" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 6 }}>⚡ Quantum Advantage</div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.6 }}>
                            Classical algorithms evaluate signal combinations <strong>sequentially</strong>.
                            QAOA explores all combinations <strong>simultaneously</strong> via quantum superposition — exponential speedup for N intersections.
                        </div>
                    </div>
                </div>

                {/* CENTER — Multi-Intersection Status Grid */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Multi-Intersection Optimization Results
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {intIds.map(id => {
                            const isect = intersections[id];
                            const color = INT_COLORS[id] ?? "#818cf8";
                            const lanes = isect?.lanes ?? {};
                            const total = Object.values(lanes).reduce((s: number, l: any) => s + (l.vehicles ?? 0), 0);
                            return (
                                <motion.div key={id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="card" style={{ padding: "14px", border: `1px solid ${color}25` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>{isect?.name ?? id}</div>
                                            <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase" }}>{id} hub</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 9, color: "var(--text-3)" }}>Efficiency</div>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", fontFamily: "monospace" }}>{isect?.efficiency ?? 0}%</div>
                                        </div>
                                    </div>

                                    {/* Phase badges */}
                                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: `${color}15`, color, fontWeight: 700 }}>
                                            Active: {isect?.current_phase ?? "–"}
                                        </span>
                                        <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 99, background: "rgba(16,185,129,0.1)", color: "#34d399", fontWeight: 700 }}>
                                            QAOA: {isect?.active_phase ?? "–"}
                                        </span>
                                    </div>

                                    {/* Lane grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                                        {["north", "south", "east", "west"].map(lane => {
                                            const l = lanes[lane] ?? { vehicles: 0, congestion: "LOW", signal: "RED" };
                                            const c = LANE_COLORS[l.congestion];
                                            const green = l.signal === "GREEN";
                                            return (
                                                <div key={lane} style={{ padding: "5px 7px", borderRadius: 6, background: green ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${green ? "rgba(16,185,129,0.2)" : "var(--border-2)"}` }}>
                                                    <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase" }}>{lane}</div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontSize: 14, fontWeight: 900, color: c, fontFamily: "monospace" }}>{l.vehicles}</span>
                                                        <span style={{ fontSize: 7, fontWeight: 700, color: green ? "#34d399" : "#f87171" }}>{l.signal}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Green timings */}
                                    <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 9 }}>
                                        <span style={{ color: "var(--text-3)" }}>NS: <strong style={{ color: "#5B5FDE" }}>{isect?.ns_green ?? 0}s</strong></span>
                                        <span style={{ color: "var(--text-3)" }}>EW: <strong style={{ color: "#ec4899" }}>{isect?.ew_green ?? 0}s</strong></span>
                                        <span style={{ marginLeft: "auto", color: "var(--text-3)" }}>{total} veh total</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Vehicle comparison bar chart */}
                    {barData.length > 0 && (
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                                Vehicle Load per Intersection
                            </div>
                            <div style={{ height: 140 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} barSize={40}>
                                        <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                                        <Bar dataKey="vehicles" radius={[4, 4, 2, 2]}>
                                            {barData.map((entry, i) => (
                                                <Cell key={i} fill={Object.values(INT_COLORS)[i] ?? "#818cf8"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — Radar + Stats */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Efficiency Radar</div>

                    {radarData.length > 0 && (
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                                    <PolarAngleAxis dataKey="intersection" tick={{ fill: "var(--text-3)", fontSize: 9 }} />
                                    <Radar dataKey="efficiency" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Network stats */}
                    <div className="card" style={{ padding: "12px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Network Metrics</div>
                        {[
                            ["Nodes Optimized", `${qData?.nodes_optimized ?? 0}`],
                            ["Network Efficiency", `${networkEff}%`],
                            ["Algorithm", "QAOA"],
                            ["Backend Status", qData?.status ?? "—"],
                            ["Total Vehicles", data.total_vehicles],
                            ["Quantum Advantage", qData?.quantum_advantage ? "✓ Active" : "–"],
                        ].map(([l, v]) => (
                            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-2)", fontSize: 11 }}>
                                <span style={{ color: "var(--text-3)" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: "#fbbf24", fontFamily: "monospace", fontSize: 10 }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Intersection efficiency list */}
                    <div className="card" style={{ padding: "12px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Per-Hub Efficiency</div>
                        {intIds.map(id => {
                            const eff = intersections[id]?.efficiency ?? 0;
                            const color = INT_COLORS[id] ?? "#818cf8";
                            return (
                                <div key={id} style={{ marginBottom: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10 }}>
                                        <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{intersections[id]?.name ?? id}</span>
                                        <span style={{ fontWeight: 900, fontFamily: "monospace", color: "#fbbf24" }}>{eff}%</span>
                                    </div>
                                    <div style={{ height: 5, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                        <motion.div animate={{ width: `${eff}%` }} transition={{ duration: 0.8 }}
                                            style={{ height: "100%", borderRadius: 4, background: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
