"use client";
// Demo narration overlay — shows scene-aware text when demo mode is running
import { useTrafficData } from "@/lib/useTrafficData";
import { motion, AnimatePresence } from "framer-motion";

interface Scene {
    id: string;
    title: string;
    body: string;
    color: string;
}

function detectScene(data: ReturnType<typeof useTrafficData>["data"]): Scene {
    if (data.emergency_active) return {
        id: "emergency",
        title: "🚨 Scene 4 · Emergency Override",
        body: `YOLOv8 detected an ambulance in the ${data.emergency_lane?.toUpperCase()} lane with >85% confidence. Green corridor activated in <30 s — all cross-traffic held RED automatically.`,
        color: "#ef4444",
    };

    const maxCongestion = Math.max(
        ...["north", "south", "east", "west"].map(l => {
            const c = (data.lanes as any)[l]?.congestion;
            return c === "HIGH" ? 3 : c === "MEDIUM" ? 2 : 1;
        })
    );

    if (data.quantum_efficiency >= 85) return {
        id: "qaoa",
        title: "⚛ Scene 3 · QAOA Optimizing",
        body: `Quantum circuit running ${data.quantum_efficiency}% efficiency. The QAOA algorithm redistributed green-time away from low-traffic lanes — average vehicle wait time dropping now.`,
        color: "#10b981",
    };

    if (maxCongestion >= 3) return {
        id: "rush",
        title: "🚦 Scene 2 · Rush Hour",
        body: "North–South lanes building HIGH congestion. A classical fixed-timer system would stall here. Watch the QAOA optimizer extend NS green time and begin clearing the backlog.",
        color: "#f59e0b",
    };

    if (data.mode === "demo" && data.tick > 60) return {
        id: "recovery",
        title: "✅ Scene 5 · System Recovery",
        body: "Emergency resolved. QAOA algorithm resuming adaptive phase timing. Traffic distributing back toward equilibrium — demonstrating autonomous self-healing.",
        color: "#5B5FDE",
    };

    return {
        id: "normal",
        title: "🟢 Scene 1 · Normal Traffic Flow",
        body: "Quantum Traffic OS initialized. All 4 Delhi intersections monitored in real-time. QAOA circuit baseline — observe how the system adapts as load increases.",
        color: "#5B5FDE",
    };
}

export function DemoNarration() {
    const { data } = useTrafficData();
    const isDemo = data.mode === "demo" && data.status === "RUNNING";
    const scene = detectScene(data);

    return (
        <AnimatePresence>
            {isDemo && (
                <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.35 }}
                    style={{
                        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
                        width: 340, borderRadius: 16,
                        background: "var(--surface-2)",
                        border: `1px solid ${scene.color}40`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${scene.color}15`,
                        padding: "16px 18px",
                    }}
                >
                    {/* Indicator bar */}
                    <div style={{ position: "absolute", inset: "0", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "16px 0 0 16px", background: scene.color }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: scene.color }}>{scene.title}</span>
                        <span className="pill pill-blue" style={{ fontSize: 9 }}>DEMO LIVE</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{scene.body}</p>
                    <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[1, 2, 3, 4, 5].map(n => {
                            const colors = { 1: "#5B5FDE", 2: "#f59e0b", 3: "#10b981", 4: "#ef4444", 5: "#7C3AED" };
                            const current = (n === 1 && scene.id === "normal") || (n === 2 && scene.id === "rush") || (n === 3 && scene.id === "qaoa") || (n === 4 && scene.id === "emergency") || (n === 5 && scene.id === "recovery");
                            return (
                                <div key={n} style={{
                                    width: 20, height: 20, borderRadius: "50%", fontSize: 9, fontWeight: 800,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: current ? colors[n as keyof typeof colors] : "rgba(255,255,255,0.07)",
                                    color: current ? "white" : "var(--text-3)",
                                }}>{n}</div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
