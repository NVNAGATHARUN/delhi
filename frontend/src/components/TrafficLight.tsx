"use client";
// Animated Traffic Light component
import { motion, AnimatePresence } from "framer-motion";

interface TrafficLightProps {
    signal: "RED" | "GREEN";
    label?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

const sizes = {
    sm: { body: "w-10 h-22", light: "w-5 h-5", gap: "gap-1", text: "text-[9px]" },
    md: { body: "w-12 h-28", light: "w-6 h-6", gap: "gap-1.5", text: "text-[10px]" },
    lg: { body: "w-16 h-36", light: "w-8 h-8", gap: "gap-2", text: "text-xs" },
};

export function TrafficLightIcon({ signal, label, size = "md", showLabel = true }: TrafficLightProps) {
    const s = sizes[size];
    const isGreen = signal === "GREEN";

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Light housing */}
            <div className={`${s.body} flex flex-col items-center justify-between py-2.5 px-1.5 rounded-2xl`}
                style={{ background: "#0a0820", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)" }}>
                {/* Red */}
                <motion.div
                    animate={!isGreen ? { opacity: 1, boxShadow: "0 0 16px rgba(244,63,94,0.8)" } : { opacity: 0.15, boxShadow: "none" }}
                    transition={{ duration: 0.4 }}
                    className={`${s.light} rounded-full`}
                    style={{ background: !isGreen ? "#f43f5e" : "#3d1a28" }}
                />
                {/* Yellow (always dim) */}
                <div className={`${s.light} rounded-full`} style={{ background: "#2a1f0a", opacity: 0.3 }} />
                {/* Green */}
                <motion.div
                    animate={isGreen ? { opacity: 1, boxShadow: "0 0 16px rgba(16,185,129,0.8)" } : { opacity: 0.15, boxShadow: "none" }}
                    transition={{ duration: 0.4 }}
                    className={`${s.light} rounded-full`}
                    style={{ background: isGreen ? "#10b981" : "#0a2a1f" }}
                />
            </div>
            {showLabel && label && (
                <span className={`${s.text} font-bold text-white/40 uppercase tracking-wider`}>{label}</span>
            )}
            <span className={`${s.text} font-black ${isGreen ? "text-emerald-400" : "text-rose-400"}`}>{signal}</span>
        </div>
    );
}
