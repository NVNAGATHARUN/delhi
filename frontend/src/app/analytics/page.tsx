"use client";
// ANALYTICS — Real-time comprehensive analytics dashboard
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import { BarChart2 } from "lucide-react";
import { LANE_COLORS } from "@/lib/api";
import { useTrafficData } from "@/lib/useTrafficData";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INT_COLORS: Record<string, string> = {
    north: "#5B5FDE", south: "#7C3AED", east: "#ec4899", west: "#f59e0b"
};
const CONG_COLORS: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" };
const LANE_KEYS = ["north", "south", "east", "west"] as const;

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Tick {label}</div>
            {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color ?? "#818cf8", fontWeight: 700 }}>{p.dataKey}: {p.value}</div>)}
        </div>
    );
}

function HeatCell({ cong }: { cong: string }) {
    const c = CONG_COLORS[cong] ?? "#10b981";
    return (
        <motion.div animate={{ opacity: 1 }}
            style={{ borderRadius: 6, background: `${c}18`, border: `1px solid ${c}30`, padding: "5px 4px", textAlign: "center", fontWeight: 800, color: c, fontSize: 8 }}>
            {cong[0]}
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const { data } = useTrafficData();
    const [summary, setSummary] = useState<any>(null);

    const fetchSummary = useCallback(async () => {
        try {
            const r = await fetch(`${API}/analytics/summary`);
            if (r.ok) setSummary(await r.json());
        } catch { }
    }, []);

    useEffect(() => {
        fetchSummary();
        const iv = setInterval(fetchSummary, 3000);
        return () => clearInterval(iv);
    }, []);

    const intDetail = summary?.intersections_detail ?? {};
    const history = data.history ?? [];
    const congestionNet = summary?.network_congestion ?? {};

    // Intersection vehicle bar data
    const intBarData = Object.entries(intDetail).map(([id, d]: [string, any]) => ({
        name: id.charAt(0).toUpperCase() + id.slice(1),
        vehicles: d.vehicles ?? 0,
        efficiency: d.efficiency ?? 0,
    }));

    // Congestion distribution pie data
    const congDist: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    LANE_KEYS.forEach(intId => {
        const lanes = congestionNet[intId] ?? {};
        LANE_KEYS.forEach(lane => {
            const cong = lanes[lane] ?? "LOW";
            congDist[cong] = (congDist[cong] ?? 0) + 1;
        });
    });
    const pieData = Object.entries(congDist).map(([name, value]) => ({ name, value, color: CONG_COLORS[name] }));

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <BarChart2 size={18} color="#818cf8" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Traffic Analytics</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>Real-Time · Network Overview · Congestion Heatmap</span>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                    {([
                        ["Total Vehicles", summary?.total_vehicles ?? 0, "var(--text)"],
                        ["Peak", summary?.peak_vehicles ?? 0, "#fbbf24"],
                        ["Avg", summary?.avg_vehicles ?? 0, "#818cf8"],
                        ["Q-Eff", `${summary?.quantum_efficiency ?? 0}%`, "#10b981"],
                    ] as [string, any, string][]).map(([l, v, c]) => (
                        <div key={l} style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1.1, fontFamily: "monospace" }}>{v}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 280px", gridTemplateRows: "1fr 1fr", gap: 1, background: "var(--border-2)" }}>

                {/* TOP LEFT — Traffic History Area Chart */}
                <div style={{ background: "var(--bg)", padding: "14px 18px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                        📊 Network Load History
                    </div>
                    <div style={{ height: "calc(100% - 30px)" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history} margin={{ left: -20, right: 5 }}>
                                <defs>
                                    {["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"].map((c, i) => (
                                        <linearGradient key={i} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={c} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis dataKey="t" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                {LANE_KEYS.map((l, i) => (
                                    <Area key={l} type="monotone" dataKey={l} stroke={["#5B5FDE", "#7C3AED", "#ec4899", "#f59e0b"][i]} strokeWidth={1.5} fill={`url(#ag${i})`} dot={false} />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* TOP RIGHT — Intersection Comparison */}
                <div style={{ background: "var(--bg)", padding: "14px 18px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                        🏙️ Intersection Comparison
                    </div>
                    <div style={{ height: "calc(100% - 30px)" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={intBarData} barSize={40}>
                                <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                                <Bar dataKey="vehicles" radius={[4, 4, 2, 2]}>
                                    {intBarData.map((e, i) => (
                                        <Cell key={i} fill={Object.values(INT_COLORS)[i] ?? "#818cf8"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* BOTTOM LEFT — Congestion Heatmap Grid */}
                <div style={{ background: "var(--bg)", padding: "14px 18px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                        🔥 Congestion Heatmap
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 1fr", gap: 3, fontSize: 9 }}>
                        <div />
                        {LANE_KEYS.map(l => (
                            <div key={l} style={{ fontWeight: 700, color: "var(--text-3)", textAlign: "center", padding: "3px 0", textTransform: "capitalize" }}>{l}</div>
                        ))}
                        {LANE_KEYS.map(intId => {
                            const lanes = congestionNet[intId] ?? {};
                            return (
                                <>
                                    <div key={`label-${intId}`} style={{ fontWeight: 700, color: "var(--text-3)", padding: "3px 0", textTransform: "capitalize", fontSize: 9 }}>{intId}</div>
                                    {LANE_KEYS.map(lane => (
                                        <HeatCell key={`${intId}-${lane}`} cong={lanes[lane] ?? "LOW"} />
                                    ))}
                                </>
                            );
                        })}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 14, justifyContent: "center" }}>
                        {([["HIGH", "#ef4444"], ["MEDIUM", "#f59e0b"], ["LOW", "#10b981"]] as [string, string][]).map(([l, c]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} /> {l}
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTTOM MIDDLE — Intersection details */}
                <div style={{ background: "var(--bg)", padding: "14px 18px", overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                        Per-Intersection Detail
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.entries(intDetail).map(([id, d]: [string, any]) => {
                            const color = INT_COLORS[id] ?? "#818cf8";
                            return (
                                <div key={id} className="card" style={{ padding: "10px 12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{d.name ?? id}</span>
                                        <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                                            <span style={{ color: "var(--text-3)" }}>Phase: <strong style={{ color: "#818cf8" }}>{d.phase ?? "–"}</strong></span>
                                            <span style={{ color: "var(--text-3)" }}>{d.vehicles ?? 0} veh</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 4, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                        <motion.div animate={{ width: `${d.efficiency ?? 0}%` }} transition={{ duration: 0.8 }}
                                            style={{ height: "100%", borderRadius: 4, background: color }} />
                                    </div>
                                    <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4, textAlign: "right" }}>
                                        Q-Efficiency: <strong style={{ color: "#fbbf24" }}>{d.efficiency ?? 0}%</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT COLUMN — Pie chart + system health */}
                <div style={{ background: "var(--bg)", padding: "14px", display: "flex", flexDirection: "column", gap: 12, gridRow: "1 / 3", overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Congestion Distribution
                    </div>
                    <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip formatter={(value: any, name: any) => [`${value} lanes`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {pieData.map(({ name, value, color }) => (
                            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                                <span style={{ flex: 1, fontSize: 11, color: "var(--text-2)" }}>{name}</span>
                                <span style={{ fontWeight: 700, color, fontSize: 13, fontFamily: "monospace" }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* System Health */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>System Health</div>
                        {([
                            ["Simulation", summary?.status ?? "STOPPED", summary?.status === "RUNNING" ? "#10b981" : "#f87171"],
                            ["Emergency", summary?.emergency_active ? "ACTIVE 🚨" : "Clear ✓", summary?.emergency_active ? "#ef4444" : "#10b981"],
                            ["RL Agent", summary?.rl_trained ? "Trained ✓" : "Idle", summary?.rl_trained ? "#10b981" : "var(--text-3)"],
                            ["Tick", `#${summary?.tick ?? 0}`, "var(--text)"],
                        ] as [string, string, string][]).map(([l, v, c]) => (
                            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-2)", fontSize: 11 }}>
                                <span style={{ color: "var(--text-3)" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: c }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {/* Efficiency bars */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Per-Hub Efficiency</div>
                        {Object.entries(intDetail).map(([id, d]: [string, any]) => {
                            const color = INT_COLORS[id] ?? "#818cf8";
                            return (
                                <div key={id} style={{ marginBottom: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10 }}>
                                        <span style={{ color: "var(--text-2)" }}>{id.charAt(0).toUpperCase() + id.slice(1)}</span>
                                        <span style={{ fontWeight: 900, fontFamily: "monospace", color: "#fbbf24" }}>{d.efficiency ?? 0}%</span>
                                    </div>
                                    <div style={{ height: 4, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                                        <motion.div animate={{ width: `${d.efficiency ?? 0}%` }} transition={{ duration: 0.8 }}
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
