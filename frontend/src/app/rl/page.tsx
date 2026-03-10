"use client";
// RL CONTROLLER — Reinforcement Learning Traffic Agent Page
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Bot, Play, Square, TrendingUp } from "lucide-react";
import { useTrafficData } from "@/lib/useTrafficData";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INT_COLORS: Record<string, string> = {
    north: "#5B5FDE", south: "#7C3AED", east: "#ec4899", west: "#f59e0b"
};

function ChartTip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 11px", fontSize: 11 }}>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Episode {label}</div>
            {payload.map((p: any) => <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>Reward: {p.value}</div>)}
        </div>
    );
}

export default function RLPage() {
    const { data } = useTrafficData();
    const [rlData, setRlData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState("");

    const fetchRL = useCallback(async () => {
        try {
            const r = await fetch(`${API}/rl/status`);
            if (r.ok) setRlData(await r.json());
        } catch { }
    }, []);

    useEffect(() => {
        fetchRL();
        const iv = setInterval(fetchRL, 1500);
        return () => clearInterval(iv);
    }, []);

    const handleTrain = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/rl/train`, { method: "POST" });
            const d = await r.json();
            setActionMsg(d.message);
        } catch { setActionMsg("Error starting training"); }
        finally { setLoading(false); fetchRL(); }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/rl/stop`, { method: "POST" });
            const d = await r.json();
            setActionMsg(d.message);
        } catch { setActionMsg("Error stopping"); }
        finally { setLoading(false); fetchRL(); }
    };

    const isTraining = rlData?.running ?? false;
    const trained = rlData?.trained ?? false;
    const episodes = rlData?.episodes ?? 0;
    const log = rlData?.training_log ?? [];
    const decisions = rlData?.policy_decisions ?? {};

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Bot size={18} color="#10b981" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>RL Traffic Controller</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>PPO Agent · Stable-Baselines3 · Adaptive Signal Control</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={`pill ${isTraining ? "pill-blue" : trained ? "pill-green" : "pill-dim"}`} style={{ fontSize: 9 }}>
                        {isTraining ? "🔄 TRAINING" : trained ? "✓ TRAINED" : "○ IDLE"}
                    </div>
                    <button onClick={isTraining ? handleStop : handleTrain} disabled={loading}
                        style={{ padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", border: "none", background: isTraining ? "#ef4444" : "var(--green)", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                        {isTraining ? <><Square size={12} /> Stop</> : <><Play size={12} /> Train Agent</>}
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 1, background: "var(--border-2)" }}>

                {/* LEFT — Training Controls + Stats */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Training Stats</div>

                    {actionMsg && (
                        <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 10, color: "#34d399" }}>
                            {actionMsg}
                        </div>
                    )}

                    {/* Key metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                            ["Episodes", episodes, "#818cf8"],
                            ["Steps", rlData?.total_steps ?? 0, "#10b981"],
                            ["Avg Reward", `${rlData?.avg_reward ?? 0}`, "#fbbf24"],
                            ["Best Reward", `${rlData?.best_reward ?? 0}`, "#34d399"],
                        ].map(([l, v, c]) => (
                            <div key={l as string} className="card" style={{ padding: "10px 12px" }}>
                                <div style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: c as string, fontFamily: "monospace" }}>{v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Epsilon decay */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>Exploration Rate (ε)</span>
                            <span style={{ fontSize: 13, fontWeight: 900, fontFamily: "monospace", color: "#818cf8" }}>{rlData?.epsilon ?? 1.0}</span>
                        </div>
                        <div style={{ height: 6, background: "var(--border-2)", borderRadius: 6, overflow: "hidden" }}>
                            <motion.div animate={{ width: `${((rlData?.epsilon ?? 1.0) * 100)}%` }} transition={{ duration: 0.5 }}
                                style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #818cf8, #5B5FDE)" }} />
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>
                            ε-greedy exploration. Starts at 1.0 (random), decays to 0.05 (exploit). Episode {episodes}/50.
                        </div>
                    </div>

                    {/* Episode progress */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>Training Progress</span>
                            <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: "#10b981" }}>{episodes}/50 ep</span>
                        </div>
                        <div style={{ height: 6, background: "var(--border-2)", borderRadius: 6, overflow: "hidden" }}>
                            <motion.div animate={{ width: `${(episodes / 50) * 100}%` }} transition={{ duration: 0.5 }}
                                style={{ height: "100%", borderRadius: 6, background: "#10b981" }} />
                        </div>
                    </div>

                    {/* Algorithm info */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>PPO Policy</div>
                        {[
                            ["Policy", rlData?.policy ?? "PPO"],
                            ["Obs Space", "Traffic density per lane (4×4)"],
                            ["Action Space", "NS or EW phase (binary)"],
                            ["Reward", "-Σ queue lengths"],
                            ["Framework", "Stable-Baselines3"],
                        ].map(([l, v]) => (
                            <div key={l as string} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--border-2)", fontSize: 10 }}>
                                <span style={{ color: "var(--text-3)", minWidth: 80 }}>{l}</span>
                                <span style={{ color: "var(--text-2)" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER — Reward Chart + Log */}
                <div style={{ background: "var(--bg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Training Reward Curve
                    </div>

                    <div style={{ flex: 1, minHeight: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={log} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="ep" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} label={{ value: "Episode", position: "insideBottom", fill: "var(--text-3)", fontSize: 9, offset: -2 }} />
                                <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Line type="monotone" dataKey="reward" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Episode log */}
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                            Episode Log
                        </div>
                        <div style={{ height: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                            {log.length === 0 ? (
                                <div style={{ color: "var(--text-3)", fontSize: 11, padding: "20px", textAlign: "center", opacity: 0.5 }}>
                                    Start training to see episode log
                                </div>
                            ) : [...log].reverse().map((entry: any, i: number) => (
                                <div key={i} style={{ display: "flex", gap: 12, padding: "6px 10px", borderRadius: 7, background: "var(--surface)", fontSize: 10 }}>
                                    <span style={{ color: "var(--text-3)", minWidth: 60 }}>Ep {entry.ep}</span>
                                    <span style={{ color: entry.reward > 0 ? "#10b981" : "#f87171", fontWeight: 700, fontFamily: "monospace" }}>
                                        {entry.reward > 0 ? "+" : ""}{entry.reward}
                                    </span>
                                    <span style={{ color: "var(--text-3)", marginLeft: "auto" }}>{entry.steps} steps</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT — Policy Decisions per intersection */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Current Policy Decisions
                    </div>

                    {Object.entries(decisions).map(([id, dec]: [string, any]) => {
                        const color = INT_COLORS[id] ?? "#818cf8";
                        const conf = dec.confidence ?? 0;
                        return (
                            <div key={id} className="card" style={{ padding: "12px 14px", border: `1px solid ${color}20` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{id.charAt(0).toUpperCase() + id.slice(1)} Hub</span>
                                    <span style={{ fontSize: 14, fontWeight: 900, color, fontFamily: "monospace" }}>{dec.recommended_phase}</span>
                                </div>
                                <div style={{ height: 5, background: "var(--border-2)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                                    <motion.div animate={{ width: `${conf}%` }} transition={{ duration: 0.5 }}
                                        style={{ height: "100%", borderRadius: 4, background: color }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                                    <span style={{ color: "var(--text-3)" }}>Conf: <strong style={{ color }}>{conf}%</strong></span>
                                    <span style={{ color: "var(--text-3)" }}>NS:{dec.ns_queue} EW:{dec.ew_queue}</span>
                                </div>
                            </div>
                        );
                    })}

                    <div className="card" style={{ padding: "12px 14px", marginTop: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>How RL Works</div>
                        {[
                            ["Observe", "Agent reads queue lengths from all 4 lanes at each intersection."],
                            ["Decide", "PPO policy outputs NS or EW phase selection."],
                            ["Act", "Signal timings updated based on RL policy decision."],
                            ["Reward", "Negative total queue length — agent learns to minimize wait time."],
                            ["Learn", "Policy gradient updates via PPO optimizer after each episode."],
                        ].map(([t, d]) => (
                            <div key={t as string} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-2)" }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#10b981", minWidth: 55 }}>{t}</div>
                                <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5 }}>{d}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
