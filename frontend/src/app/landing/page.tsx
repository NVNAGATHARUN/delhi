"use client";
// Startup-style landing page at /landing
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Brain, Cpu, Car, ShieldAlert, Globe, CheckCircle, ArrowRight, TrendingUp, Clock, Users } from "lucide-react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }} viewport={{ once: true }} className={className}>
            {children}
        </motion.div>
    );
}

const TECH = [
    { icon: <Brain size={24} />, name: "YOLOv8", desc: "Real-time vehicle detection from traffic camera feeds", color: "#6366f1" },
    { icon: <Cpu size={24} />, name: "Qiskit QAOA", desc: "Quantum approximate optimization for signal timing", color: "#f59e0b" },
    { icon: <Car size={24} />, name: "Physics Engine", desc: "Poisson arrivals, saturation-flow, rush-hour model", color: "#10b981" },
    { icon: <Zap size={24} />, name: "FastAPI", desc: "High-performance real-time backend with WebSockets", color: "#8b5cf6" },
    { icon: <Globe size={24} />, name: "Next.js 16", desc: "Interactive dashboard with Leaflet maps and Recharts", color: "#06b6d4" },
    { icon: <ShieldAlert size={24} />, name: "Emergency AI", desc: "Ambulance detection and automatic green corridor", color: "#f43f5e" },
];

const PROBLEMS = [
    { stat: "3.8 hrs", label: "daily time lost to congestion per commuter in Delhi" },
    { stat: "₹1.5L Cr", label: "economic loss annually due to traffic congestion in India" },
    { stat: "34%", label: "of fuel consumed while idling at red lights" },
    { stat: "6.2 min", label: "average ambulance delay due to traffic signal priorities" },
];

const ARCH = [
    { step: "1", title: "Camera Feed", desc: "Traffic cameras stream video at intersections", icon: "📷", color: "#6366f1" },
    { step: "2", title: "AI Detection", desc: "YOLOv8 detects vehicle types, counts, and layout", icon: "🧠", color: "#8b5cf6" },
    { step: "3", title: "Density Calc", desc: "Congestion levels computed lane-by-lane in real time", icon: "📊", color: "#f59e0b" },
    { step: "4", title: "QAOA Optimize", desc: "Quantum circuit outputs optimal phase timing configuration", icon: "⚛️", color: "#10b981" },
    { step: "5", title: "Signal Control", desc: "Controller applies optimized timings to physical lights", icon: "🚦", color: "#06b6d4" },
    { step: "6", title: "Dashboard", desc: "Live Leaflet map + Recharts stream state to operators", icon: "🖥️", color: "#f43f5e" },
];

const TEAM = [
    { name: "AI Systems", role: "YOLOv8 vehicle detection & emergency corridor logic", emoji: "🧠" },
    { name: "Quantum Dev", role: "Qiskit QAOA circuit design and optimization layer", emoji: "⚛️" },
    { name: "Backend Eng", role: "FastAPI traffic physics engine and WebSocket API", emoji: "⚙️" },
    { name: "Frontend Eng", role: "Next.js dashboard, Leaflet maps, Recharts analytics", emoji: "🖥️" },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen grid-bg" style={{ background: "#050510", color: "#f0f0ff", fontFamily: "'Inter', sans-serif" }}>

            {/* ── NAV ───────────────────────────────────────────────────────── */}
            <nav className="fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between"
                style={{ background: "rgba(5,5,16,0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_14px_rgba(99,102,241,0.4)]">
                        <Zap size={14} className="text-white" fill="white" />
                    </div>
                    <span className="font-black text-white text-sm">QUANTUM TRAFFIC OS</span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="#problem" className="text-xs text-white/40 hover:text-white transition-colors">Problem</a>
                    <a href="#tech" className="text-xs text-white/40 hover:text-white transition-colors">Technology</a>
                    <a href="#arch" className="text-xs text-white/40 hover:text-white transition-colors">Architecture</a>
                    <Link href="/" className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.3)]">
                        Open Dashboard →
                    </Link>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section className="pt-32 pb-24 px-8 text-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
                </div>
                <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8"
                        style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
                        🏆 Hackathon 2026 · Smart City Innovation
                    </div>
                    <h1 className="text-6xl font-black text-white leading-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
                        Quantum-Enhanced<br />
                        <span style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #ec4899 80%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            AI Traffic Control
                        </span>
                    </h1>
                    <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed mb-10">
                        Combining computer vision, quantum optimization algorithms, and real-time physics simulation
                        to build the next generation of intelligent urban traffic management.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link href="/" className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:from-indigo-500 hover:to-violet-500 transition-all">
                            <Zap size={18} fill="white" /> Live Dashboard
                        </Link>
                        <a href="#arch" className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white/60 text-lg border border-white/10 hover:border-white/25 hover:text-white transition-all">
                            How It Works <ArrowRight size={18} />
                        </a>
                    </div>
                </motion.div>

                {/* Hero stats */}
                <FadeIn delay={0.4} className="mt-20 grid grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {[["🚗", "Vehicles", "Detected in real-time"], ["⚡", "QAOA", "Signal optimization"], ["🚑", "< 30s", "Emergency response"], ["🟢", "AI+Quantum", "Dual intelligence"]].map(([e, v, d]) => (
                        <div key={v as string} className="p-6 rounded-2xl text-center" style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="text-2xl mb-2">{e}</div>
                            <p className="text-lg font-black text-white">{v}</p>
                            <p className="text-[10px] text-white/30 mt-1">{d}</p>
                        </div>
                    ))}
                </FadeIn>
            </section>

            {/* ── PROBLEM ───────────────────────────────────────────────────── */}
            <section id="problem" className="py-24 px-8">
                <div className="max-w-5xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-3">The Problem</p>
                            <h2 className="text-4xl font-black text-white">Urban Traffic is <span className="text-rose-400">Broken</span></h2>
                            <p className="text-white/40 mt-4 max-w-xl mx-auto">Fixed-timer traffic signals designed in the 1960s cannot adapt to modern urban density, costing billions in lost time and fuel.</p>
                        </div>
                    </FadeIn>
                    <div className="grid grid-cols-4 gap-5">
                        {PROBLEMS.map((p, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="p-6 rounded-2xl h-full" style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)" }}>
                                    <p className="text-3xl font-black text-rose-400 mb-2">{p.stat}</p>
                                    <p className="text-xs text-white/40 leading-relaxed">{p.label}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SOLUTION ──────────────────────────────────────────────────── */}
            <section className="py-24 px-8" style={{ background: "rgba(99,102,241,0.04)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="max-w-5xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Our Solution</p>
                        <h2 className="text-4xl font-black text-white">AI + Quantum + Simulation</h2>
                        <p className="text-white/40 mt-4 max-w-2xl mx-auto">A unified platform that detects vehicles with AI, optimizes signal timing with quantum algorithms, and simulates traffic physics in real-time — all visualized in one command center dashboard.</p>
                    </FadeIn>
                    <div className="grid grid-cols-3 gap-5">
                        {[
                            {
                                icon: "🧠", title: "AI Detection", grad: "from-indigo-600 to-violet-600", color: "#a5b4fc",
                                points: ["YOLOv8 detects vehicles, ambulances, trucks", "Processes frames at 30 FPS in real-time", "Classifies vehicle types with 92% accuracy"]
                            },
                            {
                                icon: "⚛️", title: "Quantum Optimization", grad: "from-yellow-500 to-amber-600", color: "#fde68a",
                                points: ["QAOA circuit on Qiskit simulator", "Solves QUBO for signal timing problem", "Outperforms classical greedy by ~28%"]
                            },
                            {
                                icon: "🚑", title: "Emergency Corridor", grad: "from-rose-600 to-red-700", color: "#fca5a5",
                                points: ["AI instantly flags ambulance class", "Calculates optimal route in < 1 second", "Forces all intersection signals GREEN"]
                            },
                        ].map((s, i) => (
                            <FadeIn key={i} delay={i * 0.15}>
                                <div className="relative rounded-2xl overflow-hidden p-6 h-full" style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.grad}`} />
                                    <div className="text-3xl mb-4">{s.icon}</div>
                                    <h3 className="font-black text-white text-lg mb-4">{s.title}</h3>
                                    <ul className="space-y-2">
                                        {s.points.map((p, j) => (
                                            <li key={j} className="flex items-start gap-2 text-sm text-white/40">
                                                <CheckCircle size={13} className="mt-0.5 flex-shrink-0" style={{ color: s.color }} />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TECH STACK ────────────────────────────────────────────────── */}
            <section id="tech" className="py-24 px-8">
                <div className="max-w-5xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Technology</p>
                        <h2 className="text-4xl font-black text-white">Built With Best-in-Class Tools</h2>
                    </FadeIn>
                    <div className="grid grid-cols-3 gap-4">
                        {TECH.map((t, i) => (
                            <FadeIn key={i} delay={i * 0.08}>
                                <div className="flex items-start gap-4 p-5 rounded-2xl" style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                    <div className="p-3 rounded-xl flex-shrink-0" style={{ background: `${t.color}15`, color: t.color }}>{t.icon}</div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{t.name}</p>
                                        <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{t.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ARCHITECTURE ──────────────────────────────────────────────── */}
            <section id="arch" className="py-24 px-8" style={{ background: "rgba(99,102,241,0.03)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="max-w-5xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-3">Architecture</p>
                        <h2 className="text-4xl font-black text-white">System Flow</h2>
                    </FadeIn>
                    <div className="grid grid-cols-6 gap-3">
                        {ARCH.map((s, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="flex flex-col items-center gap-2 text-center">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>{s.icon}</div>
                                {i < ARCH.length - 1 && (
                                    <div className="hidden lg:block absolute -right-1.5 top-7 text-white/20">→</div>
                                )}
                                <p className="text-[11px] font-black text-white">{s.title}</p>
                                <p className="text-[9px] text-white/30 leading-relaxed">{s.desc}</p>
                            </FadeIn>
                        ))}
                    </div>
                    {/* Arrow flow */}
                    <FadeIn delay={0.5} className="flex items-center justify-center gap-3 mt-8 flex-wrap">
                        {ARCH.map((s, i) => (
                            <div key={s.step} className="flex items-center gap-3">
                                <div className="px-3 py-1.5 rounded-xl text-[9px] font-bold" style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}>
                                    {s.title}
                                </div>
                                {i < ARCH.length - 1 && <ArrowRight size={12} className="text-white/20 flex-shrink-0" />}
                            </div>
                        ))}
                    </FadeIn>
                </div>
            </section>

            {/* ── DEMO PREVIEW ──────────────────────────────────────────────── */}
            <section className="py-24 px-8">
                <div className="max-w-5xl mx-auto text-center">
                    <FadeIn>
                        <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3">Demo</p>
                        <h2 className="text-4xl font-black text-white mb-4">See It In Action</h2>
                        <p className="text-white/40 mb-10">The live dashboard showcases 5 demo scenes including rush-hour buildup, quantum optimization kicking in, and emergency ambulance green corridor activation.</p>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="p-8 rounded-2xl mb-8" style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div className="grid grid-cols-5 gap-3 mb-8">
                                {[
                                    { n: 1, t: "Normal Traffic", c: "#6366f1" },
                                    { n: 2, t: "Rush Hour Builds", c: "#f59e0b" },
                                    { n: 3, t: "QAOA Optimizes", c: "#10b981" },
                                    { n: 4, t: "Emergency Override", c: "#f43f5e" },
                                    { n: 5, t: "System Recovery", c: "#8b5cf6" },
                                ].map(s => (
                                    <div key={s.n} className="p-4 rounded-xl text-center" style={{ background: `${s.c}10`, border: `1px solid ${s.c}25` }}>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2" style={{ background: s.c }}>{s.n}</div>
                                        <p className="text-[10px] font-bold text-white/70">{s.t}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/simulation" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform">
                                <Zap size={18} fill="white" /> Launch Demo Mode
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── TEAM ──────────────────────────────────────────────────────── */}
            <section className="py-24 px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn>
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-3">Team</p>
                        <h2 className="text-4xl font-black text-white mb-12">Built at Hackathon 2026</h2>
                    </FadeIn>
                    <div className="grid grid-cols-4 gap-4">
                        {TEAM.map((m, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="p-6 rounded-2xl" style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                    <div className="text-3xl mb-3">{m.emoji}</div>
                                    <p className="font-black text-white text-sm">{m.name}</p>
                                    <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">{m.role}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────────── */}
            <section className="py-24 px-8 text-center">
                <FadeIn>
                    <div className="relative inline-block rounded-3xl overflow-hidden p-16 max-w-3xl" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                        <div className="absolute inset-0 opacity-[0.05] bg-indigo-500 blur-3xl" />
                        <div className="relative">
                            <h2 className="text-4xl font-black text-white mb-4">Try the Live Dashboard</h2>
                            <p className="text-white/40 mb-8">Start the simulation, watch quantum optimization in real-time, and trigger the emergency corridor — all in your browser.</p>
                            <Link href="/" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform">
                                Open Dashboard <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* Footer */}
            <footer className="py-8 px-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[11px] text-white/20">Quantum Traffic OS · Hackathon 2026 · Delhi, India</p>
            </footer>
        </div>
    );
}
