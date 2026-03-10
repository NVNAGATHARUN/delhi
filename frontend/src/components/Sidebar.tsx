"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio, TrendingUp, ShieldAlert, Sliders, Zap, Microscope, Brain, Atom, Bot, BarChart2 } from "lucide-react";

const NAV_CORE = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/monitoring", label: "Monitoring", icon: Radio },
    { href: "/signals", label: "Signals", icon: TrendingUp },
    { href: "/emergency", label: "Emergency", icon: ShieldAlert },
    { href: "/simulation", label: "Simulation", icon: Sliders },
    { href: "/detection", label: "AI Detection", icon: Microscope },
];
const NAV_AI = [
    { href: "/prediction", label: "AI Prediction", icon: Brain },
    { href: "/quantum", label: "Quantum Engine", icon: Atom },
    { href: "/rl", label: "RL Controller", icon: Bot },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
    const path = usePathname();
    const active = path === href;
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 10, transition: "all 0.15s ease",
                background: active ? "rgba(91,95,222,0.12)" : "transparent",
                border: `1px solid ${active ? "rgba(91,95,222,0.25)" : "transparent"}`,
                cursor: "pointer",
            }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
                <Icon size={14} color={active ? "#818cf8" : "var(--text-3)"} />
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "var(--text)" : "var(--text-2)" }}>{label}</span>
                {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8", marginLeft: "auto" }} />}
            </div>
        </Link>
    );
}

export function Sidebar() {
    return (
        <aside style={{
            width: "var(--sidebar-w)", flexShrink: 0, display: "flex", flexDirection: "column",
            background: "var(--surface)", borderRight: "1px solid var(--border)",
            padding: "16px 10px", gap: "2px", overflowY: "auto"
        }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", marginBottom: 20 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, #5B5FDE 0%, #7C3AED 100%)",
                    boxShadow: "0 0 16px rgba(91,95,222,0.4)"
                }}>
                    <Zap size={16} color="white" fill="white" />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>Q-Traffic</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Quantum AI OS</div>
                </div>
            </div>

            {/* Core nav */}
            <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.14em", padding: "0 8px", marginBottom: 4 }}>
                Core
            </div>
            {NAV_CORE.map(item => <NavItem key={item.href} {...item} />)}

            {/* AI nav */}
            <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.14em", padding: "0 8px", marginTop: 14, marginBottom: 4 }}>
                AI Modules
            </div>
            {NAV_AI.map(item => <NavItem key={item.href} {...item} />)}

            {/* Bottom */}
            <div style={{ marginTop: "auto", padding: "10px 8px", borderTop: "1px solid var(--border-2)" }}>
                <div style={{ fontSize: 8, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>System</div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>v2.0 · Q-Traffic Platform</div>
            </div>
        </aside>
    );
}
