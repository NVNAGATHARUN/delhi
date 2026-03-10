// Landing page has its own layout — NO sidebar
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "Quantum Traffic OS — Smart City Traffic Management",
    description: "AI + Quantum Computing for next-generation urban traffic optimization",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
