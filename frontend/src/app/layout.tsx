import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { DemoNarration } from "@/components/DemoNarration";

export const metadata: Metadata = {
  title: "Quantum Traffic OS",
  description: "AI-powered smart city traffic management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: "100vh", display: "flex", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
        <Sidebar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {children}
        </main>
        <DemoNarration />
      </body>
    </html>
  );
}
