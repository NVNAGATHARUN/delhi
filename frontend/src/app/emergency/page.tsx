"use client";
// EMERGENCY — Clean alert and signal override view
import { useTrafficData } from "@/lib/useTrafficData";
import { CheckCircle, AlertTriangle, Zap, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const LANES = ["north", "south", "east", "west"] as const;

function TrafficLight({ signal }: { signal: "RED" | "GREEN" }) {
    const g = signal === "GREEN";
    return (
        <div className="tl-body" style={{ width: 32, gap: 5, padding: 8 }}>
            <div className={`tl-light tl-red  ${!g ? "on" : ""}`} style={{ width: 18, height: 18 }} />
            <div className="tl-light tl-amber" style={{ width: 12, height: 12 }} />
            <div className={`tl-light tl-green ${g ? "on" : ""}`} style={{ width: 18, height: 18 }} />
        </div>
    );
}

export default function EmergencyPage() {
    const { data } = useTrafficData();
    const [log, setLog] = useState<{ time: string; msg: string; type: "info" | "alert" }[]>([
        { time: new Date().toLocaleTimeString(), msg: "Emergency monitor initialized — scanning all lanes", type: "info" }
    ]);

    useEffect(() => {
        if (data.emergency_active) {
            setLog(prev => [{
                time: new Date().toLocaleTimeString(),
                msg: `🚨 Ambulance detected in ${data.emergency_lane?.toUpperCase()} lane — all signals forced GREEN`,
                type: "alert"
            }, ...prev.slice(0, 24)]);
        }
    }, [data.emergency_active, data.emergency_lane]);

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Emergency Corridor</span>
                <AnimatePresence mode="wait">
                    {data.emergency_active
                        ? <motion.div key="on" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="pill pill-red" style={{ fontSize: 12, padding: "5px 14px" }}>
                            <AlertTriangle size={13} /> EMERGENCY ACTIVE
                        </motion.div>
                        : <motion.div key="off" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="pill pill-green" style={{ fontSize: 12, padding: "5px 14px" }}>
                            <CheckCircle size={13} /> ALL CLEAR
                        </motion.div>
                    }
                </AnimatePresence>
            </div>

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 300px", gap: 1, background: "var(--border-2)" }}>
                {/* Left: status hero + signal grid */}
                <div style={{ background: "var(--bg)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                    {/* Status hero */}
                    <AnimatePresence mode="wait">
                        {data.emergency_active
                            ? <motion.div key="emerg" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                style={{ padding: "24px", borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)", display: "flex", gap: 20, alignItems: "center" }}>
                                <div className="emerg-pulse" style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <AlertTriangle size={28} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>🚨 Priority Override Active</div>
                                    <div style={{ fontSize: 13, color: "#f87171", marginTop: 5 }}>
                                        Ambulance in <strong style={{ color: "white", textTransform: "uppercase" }}>{data.emergency_lane}</strong> — green corridor engaged
                                    </div>
                                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                                        <div className="pill pill-green" style={{ fontSize: 11 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "emerg 1.4s infinite" }} />
                                            PATH CLEARED
                                        </div>
                                        <div className="pill pill-dim" style={{ fontSize: 11 }}>
                                            <Navigation size={11} />{data.emergency_lane?.toUpperCase()} → Intersection
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            : <motion.div key="clear" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ padding: "24px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", gap: 20, alignItems: "center" }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <CheckCircle size={28} color="var(--green)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>System Standby</div>
                                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>All lanes scanning continuously. YOLOv8 monitoring vehicle classes in real-time.</div>
                                </div>
                            </motion.div>
                        }
                    </AnimatePresence>

                    {/* Signal override grid */}
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Signal Override Status</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {LANES.map(lane => {
                                const l = data.lanes[lane];
                                const green = l?.signal === "GREEN";
                                const isEmerg = data.emergency_lane === lane && data.emergency_active;
                                return (
                                    <div key={lane} className="card" style={{ padding: "16px", border: isEmerg ? "1px solid rgba(239,68,68,0.4)" : green ? "1px solid rgba(16,185,129,0.25)" : "1px solid var(--border)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>{lane}</span>
                                            {isEmerg && <span className="pill pill-red" style={{ fontSize: 9 }}>🚑 AMBO</span>}
                                        </div>
                                        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                            <TrafficLight signal={l?.signal ?? "RED"} />
                                            <div>
                                                <div style={{ fontSize: 22, fontWeight: 900, color: green ? "#34d399" : "#f87171" }}>{l?.signal}</div>
                                                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{l?.vehicles ?? 0} vehicles</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Protocol */}
                    <div className="card" style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <Zap size={14} color="#f87171" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>Green Corridor Protocol</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                            {[
                                ["1 · Detect", "YOLOv8 identifies ambulance with confidence > 0.85"],
                                ["2 · Route", "AI calculates optimal path through intersections"],
                                ["3 · Override", "Route signals → GREEN, cross-traffic held RED"],
                            ].map(([t, d]) => (
                                <div key={t as string} style={{ padding: "10px 12px", background: "rgba(239,68,68,0.07)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", marginBottom: 5 }}>{t}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5 }}>{d}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Event log */}
                <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Event Log</div>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                        {log.map((e, i) => (
                            <div key={i} style={{
                                padding: "9px 11px", borderRadius: 10, fontSize: 11, lineHeight: 1.5,
                                background: e.type === "alert" ? "rgba(239,68,68,0.08)" : "var(--surface)",
                                border: `1px solid ${e.type === "alert" ? "rgba(239,68,68,0.25)" : "var(--border)"}`
                            }}>
                                <div style={{ color: "var(--text-3)", fontSize: 9, marginBottom: 3, fontFamily: "monospace" }}>{e.time}</div>
                                <div style={{ color: e.type === "alert" ? "#f87171" : "var(--text-2)" }}>{e.msg}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
