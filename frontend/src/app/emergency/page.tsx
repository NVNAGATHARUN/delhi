"use client";
// EMERGENCY — Alert view + manual emergency corridor control
import { useTrafficData } from "@/lib/useTrafficData";
import { CheckCircle, AlertTriangle, Zap, Navigation, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
    const [log, setLog] = useState<{ time: string; msg: string; type: "info" | "alert" | "clear" }[]>([
        { time: new Date().toLocaleTimeString(), msg: "Emergency monitor initialized — scanning all lanes", type: "info" }
    ]);
    const [selectedLane, setSelectedLane] = useState<"north" | "south" | "east" | "west">("north");
    const [activating, setActivating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    useEffect(() => {
        if (data.emergency_active) {
            setLog(prev => [{
                time: new Date().toLocaleTimeString(),
                msg: `🚨 Ambulance detected in ${data.emergency_lane?.toUpperCase()} lane — all signals forced GREEN`,
                type: "alert"
            }, ...prev.slice(0, 29)]);
        }
    }, [data.emergency_active, data.emergency_lane]);

    const activateEmergency = async () => {
        setActivating(true);
        setActionMsg(null);
        try {
            const r = await fetch(`${API}/emergency/activate?lane=${selectedLane}`, { method: "POST" });
            const d = await r.json();
            setActionMsg(d.message ?? "Emergency corridor activated");
            setLog(prev => [{
                time: new Date().toLocaleTimeString(),
                msg: `🚨 MANUAL: Emergency corridor activated for ${selectedLane.toUpperCase()} lane`,
                type: "alert"
            }, ...prev.slice(0, 29)]);
        } catch {
            setActionMsg("Failed to activate emergency");
        } finally {
            setActivating(false);
        }
    };

    const clearEmergency = async () => {
        setClearing(true);
        setActionMsg(null);
        try {
            const r = await fetch(`${API}/emergency/clear`, { method: "POST" });
            const d = await r.json();
            setActionMsg(d.message ?? "Emergency corridor cleared");
            setLog(prev => [{
                time: new Date().toLocaleTimeString(),
                msg: "✅ Emergency corridor cleared — normal signal control resumed",
                type: "clear"
            }, ...prev.slice(0, 29)]);
        } catch {
            setActionMsg("Failed to clear emergency");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Radio size={18} color="#f87171" />
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Emergency Corridor</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>YOLOv8 Ambulance Detection · Manual Override</span>
                </div>
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

            <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 320px", gap: 1, background: "var(--border-2)" }}>
                {/* Left: status hero + signal grid + manual control */}
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
                                                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{l?.vehicles ?? 0} vehicles · {l?.green_time ?? 0}s</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Manual Emergency Control */}
                    <div className="card" style={{ padding: "20px", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <Zap size={14} color="#f87171" />
                            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Manual Emergency Control</span>
                        </div>

                        {actionMsg && (
                            <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 11, color: "#34d399" }}>
                                {actionMsg}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {/* Lane selector + Activate */}
                            <div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Select Emergency Lane</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                                    {LANES.map(lane => (
                                        <button key={lane} onClick={() => setSelectedLane(lane)}
                                            style={{
                                                padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                cursor: "pointer", border: selectedLane === lane ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--border)",
                                                background: selectedLane === lane ? "rgba(239,68,68,0.1)" : "transparent",
                                                color: selectedLane === lane ? "#f87171" : "var(--text-3)", textTransform: "uppercase"
                                            }}>
                                            {lane}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={activateEmergency} disabled={activating}
                                    style={{
                                        width: "100%", padding: "11px", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: activating ? "not-allowed" : "pointer",
                                        border: "none", background: activating ? "rgba(239,68,68,0.3)" : "#ef4444", color: "white",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: activating ? 0.7 : 1
                                    }}>
                                    <AlertTriangle size={14} />
                                    {activating ? "Activating..." : `🚑 Activate — ${selectedLane.toUpperCase()}`}
                                </button>
                            </div>

                            {/* Clear */}
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                                <div style={{ padding: "12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 12, fontSize: 10, color: "var(--text-3)", lineHeight: 1.6 }}>
                                    Activating forces all signals GREEN on the selected lane across all intersections. Use for ambulance priority routing.
                                </div>
                                <button onClick={clearEmergency} disabled={clearing || !data.emergency_active}
                                    style={{
                                        width: "100%", padding: "11px", borderRadius: 10, fontWeight: 800, fontSize: 12,
                                        cursor: (clearing || !data.emergency_active) ? "not-allowed" : "pointer",
                                        border: "1px solid rgba(16,185,129,0.3)", background: data.emergency_active ? "rgba(16,185,129,0.12)" : "transparent",
                                        color: data.emergency_active ? "#34d399" : "var(--text-3)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                                    }}>
                                    <CheckCircle size={14} />
                                    {clearing ? "Clearing..." : "✅ Clear Emergency"}
                                </button>
                            </div>
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

                    {/* Status summary */}
                    <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Current Status</div>
                        {[
                            ["Emergency", data.emergency_active ? "ACTIVE 🚨" : "Clear ✓", data.emergency_active ? "#f87171" : "#34d399"],
                            ["Lane", data.emergency_lane?.toUpperCase() ?? "—", "#f87171"],
                            ["Protocol", data.emergency_active ? "GREEN_CORRIDOR" : "STANDBY", data.emergency_active ? "#f87171" : "var(--text-3)"],
                            ["Total Vehicles", data.total_vehicles, "var(--text)"],
                        ].map(([l, v, c]) => (
                            <div key={l as string} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-2)", fontSize: 11 }}>
                                <span style={{ color: "var(--text-3)" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: c as string, fontFamily: "monospace" }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                        {log.map((e, i) => (
                            <div key={i} style={{
                                padding: "9px 11px", borderRadius: 10, fontSize: 11, lineHeight: 1.5,
                                background: e.type === "alert" ? "rgba(239,68,68,0.08)" : e.type === "clear" ? "rgba(16,185,129,0.06)" : "var(--surface)",
                                border: `1px solid ${e.type === "alert" ? "rgba(239,68,68,0.25)" : e.type === "clear" ? "rgba(16,185,129,0.2)" : "var(--border)"}`
                            }}>
                                <div style={{ color: "var(--text-3)", fontSize: 9, marginBottom: 3, fontFamily: "monospace" }}>{e.time}</div>
                                <div style={{ color: e.type === "alert" ? "#f87171" : e.type === "clear" ? "#34d399" : "var(--text-2)" }}>{e.msg}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
