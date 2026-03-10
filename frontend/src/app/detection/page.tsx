"use client";
import { useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload, Zap, CheckCircle, AlertTriangle, Info, X, Download, Sliders,
    Image as ImageIcon, Video, Clock, Hash, Gauge, Crosshair
} from "lucide-react";
import { LANE_COLORS } from "@/lib/api";

/* ─── Types ────────────────────────────────────────────────────────────────── */
type ImgResult = {
    annotated_image: string;
    lanes: Record<string, number>;
    total: number;
    ambulance: { detected: boolean; lane: string | null; confidence: number };
    detections: { class: string; confidence: number; lane: string; bbox: number[] }[];
    mode: "yolov8" | "simulated";
};

type TrackedVehicle = { id: number; class: string; lane: string; confidence: number; frame: number };
type VideoResult = {
    annotated_image: string;
    summary: {
        lanes: Record<string, number>;
        total: number;
        unique_ids: number;
        ambulance: { detected: boolean; lane: string | null; confidence: number };
        tracked_vehicles: TrackedVehicle[];
    };
    stats: {
        frames_total: number; frames_processed: number; source_fps: number;
        processing_fps: number; elapsed_seconds: number; sample_every: number
    };
    mode: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CLASS_STYLE: Record<string, { color: string; emoji: string }> = {
    car: { color: "#5B5FDE", emoji: "🚗" }, motorcycle: { color: "#7C3AED", emoji: "🏍" },
    bus: { color: "#f59e0b", emoji: "🚌" }, truck: { color: "#ef4444", emoji: "🚛" },
};
const SAMPLES = [
    { id: "s1", name: "Delhi Junction", path: "/samples/sample1.png", desc: "Daytime heavy traffic" },
    { id: "s2", name: "Highway Dusk", path: "/samples/sample2.png", desc: "Multi-lane evening flow" },
    { id: "s3", name: "Emergency View", path: "/samples/sample3.png", desc: "Ambulance detection test" },
];

/* ─── Shared sub-components ────────────────────────────────────────────────── */
function LaneBar({ lane, count, total }: { lane: string; count: number; total: number }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    const c = LANE_COLORS[count > 20 ? "HIGH" : count > 8 ? "MEDIUM" : "LOW"];
    return (
        <div style={{ marginBottom: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>{lane}</span>
                <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace", color: c }}>{count}</span>
            </div>
            <div style={{ height: 5, background: "var(--border-2)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
                    style={{ height: "100%", borderRadius: 4, background: c }} />
            </div>
        </div>
    );
}

function DropArea({ accept, label, sublabel, onFile, loading }: {
    accept: string; label: string; sublabel: string;
    onFile: (f: File) => void; loading: boolean;
}) {
    const [drag, setDrag] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files[0]; if (f) onFile(f);
    }, [onFile]);
    return (
        <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={handleDrop} onClick={() => !loading && ref.current?.click()}
            style={{
                flex: 1, borderRadius: 16, cursor: loading ? "default" : "pointer",
                border: `2px dashed ${drag ? "rgba(91,95,222,0.7)" : "rgba(255,255,255,0.1)"}`,
                background: drag ? "rgba(91,95,222,0.08)" : "rgba(255,255,255,0.02)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                minHeight: 200, opacity: loading ? 0.5 : 1
            }}>
            <input ref={ref} type="file" accept={accept} style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <Upload size={22} color="#818cf8" />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{label}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>{sublabel}</div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, color }: {
    icon: any; label: string; value: string | number; color: string;
}) {
    return (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Icon size={12} color={color} />
                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "monospace" }}>{value}</div>
        </div>
    );
}

/* ─── Tab 1: Image Detection (existing) ────────────────────────────────────── */
function ImageTab() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImgResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0.35);

    const handleFile = (f: File) => {
        setFile(f); setResult(null); setError(null);
        const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(f);
    };
    const loadSample = async (path: string) => {
        setLoading(true);
        try { const r = await fetch(path); const b = await r.blob(); handleFile(new File([b], "sample.png", { type: "image/png" })); }
        catch { setError("Failed to load sample"); } finally { setLoading(false); }
    };
    const run = async () => {
        if (!file) return; setLoading(true); setError(null);
        try {
            const f = new FormData(); f.append("file", file);
            const r = await fetch(`${API}/detect/upload?conf=${confidence}`, { method: "POST", body: f });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Error");
            setResult(await r.json());
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); };
    const download = () => { if (!result) return; const a = document.createElement("a"); a.href = `data:image/jpeg;base64,${result.annotated_image}`; a.download = `detection_${Date.now()}.jpg`; a.click(); };
    const byClass = result?.detections.reduce((a, d) => { a[d.class] = (a[d.class] || 0) + 1; return a; }, {} as Record<string, number>) ?? {};

    return (
        <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 320px", gap: 1, background: "var(--border-2)" }}>
            <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                {result ? (
                    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                        <img src={`data:image/jpeg;base64,${result.annotated_image}`} alt="annotated"
                            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 14, border: "1px solid var(--border)" }} />
                        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                            <button onClick={download} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={14} color="white" /></button>
                            <button onClick={reset} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="white" /></button>
                        </div>
                    </div>
                ) : preview ? (
                    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                        <img src={preview} alt="prev" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 14, border: "1px solid var(--border)", opacity: 0.7 }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#818cf8" }} />
                                : <button onClick={run} style={{ background: "rgba(0,0,0,0.6)", color: "white", padding: "8px 18px", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Run Detection</button>}
                        </div>
                        <button onClick={reset} style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="white" /></button>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                        <DropArea accept="image/*" label="Drop a traffic image" sublabel="JPEG / PNG / WebP" onFile={handleFile} loading={loading} />
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Quick Try</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                {SAMPLES.map(s => (
                                    <button key={s.id} onClick={() => loadSample(s.path)} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 8, textAlign: "left", cursor: "pointer" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#818cf8"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                                        <div style={{ width: "100%", height: 48, background: "rgba(0,0,0,0.2)", borderRadius: 6, marginBottom: 6, overflow: "hidden" }}>
                                            <img src={s.path} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
                                        </div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}>{s.name}</div>
                                        <div style={{ fontSize: 8, color: "var(--text-3)", marginTop: 1 }}>{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {error && <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", gap: 8, alignItems: "center" }}><AlertTriangle size={13} color="#f87171" /><span style={{ fontSize: 11, color: "#f87171" }}>{error}</span></div>}
                {!result && <button onClick={run} disabled={!file || loading} style={{ padding: "10px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: file && !loading ? "pointer" : "not-allowed", border: "none", background: file && !loading ? "var(--accent)" : "rgba(255,255,255,0.06)", color: file && !loading ? "white" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{loading ? "Processing…" : <><Zap size={14} /> Run Detection</>}</button>}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px", borderRadius: 10, background: "rgba(91,95,222,0.06)", border: "1px solid rgba(91,95,222,0.15)" }}>
                    <Info size={12} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 9, color: "var(--text-3)", lineHeight: 1.6 }}>Single-frame detection. For accurate counting with unique IDs, use the <strong>Video Tracking</strong> tab.</span>
                </div>
            </div>
            <div style={{ background: "var(--bg)", padding: "14px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analytics</div>
                {!result && !loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 11, textAlign: "center", opacity: 0.5 }}>Upload + detect to see results</div>}
                {loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(129,140,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={22} color="#818cf8" /></motion.div></div>}
                {result && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {result.ambulance.detected && <div style={{ padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}><div style={{ display: "flex", gap: 6, alignItems: "center" }}><div className="emerg-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} /><span style={{ fontSize: 11, fontWeight: 800, color: "#f87171" }}>🚑 AMBULANCE DETECTED</span></div><div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4 }}>Lane: <strong style={{ color: "#f87171" }}>{result.ambulance.lane?.toUpperCase()}</strong></div></div>}
                        <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Total</div><div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)" }}>{result.total}</div><div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>{result.detections.length} boxes · {result.mode === "yolov8" ? "Real" : "Simulated"}</div></div>
                        {Object.keys(byClass).length > 0 && <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>By Type</div>{Object.entries(byClass).map(([c, n]) => { const s = CLASS_STYLE[c] ?? { color: "#94a3b8", emoji: "•" }; return <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--border-2)" }}><span>{s.emoji}</span><span style={{ flex: 1, fontSize: 10, color: "var(--text-2)", textTransform: "capitalize" }}>{c}</span><span style={{ fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{n}</span></div>; })}</div>}
                        <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>Lanes</div>{Object.entries(result.lanes).map(([l, c]) => <LaneBar key={l} lane={l} count={c} total={result.total} />)}</div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

/* ─── Tab 2: Video Tracking ────────────────────────────────────────────────── */
function VideoTab() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VideoResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0.35);
    const [lineRatio, setLineRatio] = useState(0.6);

    const handleFile = (f: File) => { setFile(f); setResult(null); setError(null); };
    const run = async () => {
        if (!file) return; setLoading(true); setError(null);
        try {
            const f = new FormData(); f.append("file", file);
            const url = `${API}/detect/video?conf=${confidence}&line_ratio=${lineRatio}&max_frames=100&sample_every=10`;
            const r = await fetch(url, { method: "POST", body: f });
            if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Error");
            setResult(await r.json());
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    const reset = () => { setFile(null); setResult(null); setError(null); };
    const download = () => { if (!result?.annotated_image) return; const a = document.createElement("a"); a.href = `data:image/jpeg;base64,${result.annotated_image}`; a.download = `tracked_${Date.now()}.jpg`; a.click(); };
    const byClass = result?.summary.tracked_vehicles.reduce((a, v) => { a[v.class] = (a[v.class] || 0) + 1; return a; }, {} as Record<string, number>) ?? {};

    return (
        <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 360px", gap: 1, background: "var(--border-2)" }}>
            <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                {result?.annotated_image ? (
                    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                        <img src={`data:image/jpeg;base64,${result.annotated_image}`} alt="tracked"
                            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 14, border: "1px solid var(--border)" }} />
                        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                            <button onClick={download} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={14} color="white" /></button>
                            <button onClick={reset} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} color="white" /></button>
                        </div>
                    </div>
                ) : (
                    <DropArea accept="video/*" label="Drop a traffic video" sublabel="MP4 / AVI / MOV" onFile={handleFile} loading={loading} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Conf: {confidence.toFixed(2)}</div>
                        <input type="range" min="0.1" max="0.9" step="0.05" value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))} style={{ width: "100%", height: 4, accentColor: "#818cf8" }} />
                    </div>
                    <div style={{ padding: "8px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 4 }}>Line: {(lineRatio * 100).toFixed(0)}%</div>
                        <input type="range" min="0.2" max="0.9" step="0.05" value={lineRatio} onChange={e => setLineRatio(parseFloat(e.target.value))} style={{ width: "100%", height: 4, accentColor: "#f59e0b" }} />
                    </div>
                </div>
                <button onClick={run} disabled={!file || loading} style={{ padding: "11px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: file && !loading ? "pointer" : "not-allowed", border: "none", background: file && !loading ? "var(--accent)" : "rgba(255,255,255,0.06)", color: "white" }}>
                    {loading ? "Processing..." : "Run Video Tracking"}
                </button>
            </div>
            <div style={{ background: "var(--bg)", padding: "14px", overflowY: "auto", borderLeft: "1px solid var(--border-2)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Analytics</div>
                {result && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>Unique Vehicles</div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)" }}>{result.summary.unique_ids}</div></div>
                        <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>Lanes</div>{Object.entries(result.summary.lanes).map(([l, c]) => <LaneBar key={l} lane={l} count={c} total={result.summary.total} />)}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Tab 3: Live Camera ────────────────────────────────────────────────── */
type CamStatus = {
    running: boolean; source: string; mode: string;
    fps: number; frame_count: number; total: number;
    latest_counts: Record<string, number>;
    by_type: Record<string, number>;
    ambulance: { detected: boolean; lane: string | null; confidence: number };
    error: string | null;
};
type CamSnapshot = {
    image: string | null;
    counts: Record<string, number>;
    total: number;
    by_type: Record<string, number>;
    ambulance: { detected: boolean; lane: string | null; confidence: number };
    mode: string; fps: number; frame: number;
};

const VEH_EMOJI: Record<string, string> = { car: "🚗", motorcycle: "🏍", bus: "🚌", truck: "🚛" };
const VEH_COLOR: Record<string, string> = { car: "#5B5FDE", motorcycle: "#7C3AED", bus: "#f59e0b", truck: "#ef4444" };

function CameraTab() {
    const [status, setStatus] = useState<CamStatus | null>(null);
    const [snap, setSnap] = useState<CamSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState("0");
    const [conf, setConf] = useState(0.25);
    const [feedKey, setFeedKey] = useState(0); // force re-mount img on start

    // Poll status every 1s
    const refreshStatus = useCallback(async () => {
        try {
            const r = await fetch(`${API}/camera/status`);
            if (r.ok) setStatus(await r.json());
        } catch { }
    }, []);

    // Poll snapshot every 1s when running (for snapshot-based analytics)
    const refreshSnap = useCallback(async () => {
        try {
            const r = await fetch(`${API}/camera/snapshot`);
            if (r.ok) {
                const data = await r.json();
                if (!data.error) setSnap(data);
            }
        } catch { }
    }, []);

    useEffect(() => {
        refreshStatus();
        const iv = setInterval(refreshStatus, 1000);
        return () => clearInterval(iv);
    }, [refreshStatus]);

    useEffect(() => {
        if (!status?.running) return;
        refreshSnap();
        const iv = setInterval(refreshSnap, 1000);
        return () => clearInterval(iv);
    }, [status?.running, refreshSnap]);

    const toggle = async () => {
        setLoading(true); setError(null);
        try {
            if (status?.running) {
                const r = await fetch(`${API}/camera/stop`, { method: "POST" });
                if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Stop error");
                setSnap(null);
            } else {
                const src = encodeURIComponent(source);
                const r = await fetch(`${API}/camera/start?source=${src}&conf=${conf}`, { method: "POST" });
                if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || "Start error");
                setFeedKey(k => k + 1); // re-mount <img> so MJPEG stream restarts
            }
            await refreshStatus();
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    };

    const isRunning = status?.running ?? false;
    const displaySnap = snap || status;
    const counts = (displaySnap as any)?.latest_counts || (displaySnap as any)?.counts || {};
    const byType = (displaySnap as any)?.by_type || {};
    const total = (displaySnap as any)?.total ?? 0;
    const ambulance = (displaySnap as any)?.ambulance;
    const detMode = snap?.mode || status?.mode || "simulated";

    return (
        <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 340px", gap: 1, background: "var(--border-2)" }}>
            {/* ── Left: Video Feed ── */}
            <div style={{ background: "var(--bg)", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ flex: 1, position: "relative", background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isRunning ? (
                        /* MJPEG stream — key forces remount on restart */
                        <img
                            key={feedKey}
                            src={`${API}/camera/feed`}
                            alt="live-feed"
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            onError={() => setError("Stream lost — check backend")}
                        />
                    ) : (
                        <div style={{ textAlign: "center", color: "var(--text-3)" }}>
                            <Video size={52} strokeWidth={1} style={{ marginBottom: 14, opacity: 0.25 }} />
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Camera Offline</div>
                            <div style={{ fontSize: 10, marginTop: 5, opacity: 0.7 }}>Configure source below and hit Start</div>
                        </div>
                    )}

                    {/* LIVE badge */}
                    {isRunning && (
                        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                                className="pill pill-red" style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
                                LIVE
                            </motion.div>
                            <span className="pill pill-blue" style={{ fontSize: 9 }}>{status?.fps ?? 0} FPS</span>
                            <span className={`pill ${detMode === "yolov8" ? "pill-blue" : "pill-amber"}`} style={{ fontSize: 9 }}>
                                {detMode === "yolov8" ? "YOLOv8" : "SIM"}
                            </span>
                        </div>
                    )}

                    {/* Ambulance overlay alert */}
                    {isRunning && ambulance?.detected && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,0.9)", borderRadius: 8, padding: "6px 12px" }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>🚑 AMBULANCE — {ambulance.lane?.toUpperCase()}</span>
                        </motion.div>
                    )}
                </div>

                {/* Source + Controls */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 5 }}>
                            Camera Source — 0 = Webcam, or video file path / RTSP URL
                        </div>
                        <input
                            value={source}
                            onChange={e => setSource(e.target.value)}
                            placeholder="0"
                            disabled={isRunning}
                            style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "white", opacity: isRunning ? 0.6 : 1 }}
                        />
                    </div>
                    <div style={{ minWidth: 110 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 5 }}>
                            Conf: {conf.toFixed(2)}
                        </div>
                        <input type="range" min="0.1" max="0.7" step="0.05" value={conf}
                            onChange={e => setConf(parseFloat(e.target.value))}
                            disabled={isRunning}
                            style={{ width: "100%", accentColor: "#818cf8", height: 20 }} />
                    </div>
                    <button
                        onClick={toggle} disabled={loading}
                        style={{
                            padding: "9px 20px", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer", border: "none", flexShrink: 0,
                            background: isRunning ? "#ef4444" : "var(--accent)", color: "white",
                            display: "flex", alignItems: "center", gap: 8
                        }}
                    >
                        {loading ? "..." : isRunning ? <><X size={14} /> Stop</> : <><Zap size={14} /> Start Detection</>}
                    </button>
                </div>
                {error && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 11, color: "#f87171" }}>{error}</div>}
            </div>

            {/* ── Right: Analytics ── */}
            <div style={{ background: "var(--bg)", padding: "14px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Analytics</div>

                {!isRunning ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
                        <div style={{ color: "var(--text-3)", fontSize: 11 }}>
                            <Info size={24} style={{ marginBottom: 10, opacity: 0.3 }} />
                            <p>Camera detections feed <strong>directly</strong> into real-time quantum simulation queues.</p>
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                        {/* Total count */}
                        <div className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>Vehicles in Frame</div>
                            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{total}</div>
                            <div style={{ fontSize: 9, color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>FEEDING INTO SIMULATION</div>
                        </div>

                        {/* By vehicle type */}
                        {Object.keys(byType).length > 0 && (
                            <div className="card" style={{ padding: 12 }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 8 }}>By Type</div>
                                {Object.entries(byType).map(([cls, cnt]) => (
                                    <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--border-2)" }}>
                                        <span style={{ fontSize: 14 }}>{VEH_EMOJI[cls] ?? "•"}</span>
                                        <span style={{ flex: 1, fontSize: 11, color: "var(--text-2)", textTransform: "capitalize" }}>{cls}</span>
                                        <span style={{ fontWeight: 900, color: VEH_COLOR[cls] ?? "#94a3b8", fontFamily: "monospace", fontSize: 14 }}>{cnt as number}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* By lane */}
                        <div className="card" style={{ padding: 12 }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 10 }}>By Lane</div>
                            {Object.entries(counts).map(([l, c]: [string, any]) => (
                                <LaneBar key={l} lane={l} count={c} total={total} />
                            ))}
                        </div>

                        {/* Ambulance alert */}
                        {ambulance?.detected && (
                            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                                style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                                    <span style={{ fontSize: 12, fontWeight: 800, color: "#f87171" }}>🚑 AMBULANCE DETECTED</span>
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
                                    Lane: <strong style={{ color: "#f87171" }}>{ambulance.lane?.toUpperCase()}</strong>
                                    {" · "}Confidence: <strong style={{ color: "#f87171" }}>{(ambulance.confidence * 100).toFixed(0)}%</strong>
                                </div>
                            </motion.div>
                        )}

                        {/* Sync badge */}
                        <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                <CheckCircle size={12} color="#10b981" />
                                <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981" }}>SYNC ACTIVE</span>
                            </div>
                            <p style={{ fontSize: 9, color: "var(--text-3)", lineHeight: 1.5 }}>
                                Quantum engine responding to live environment at {status?.fps ?? 0} FPS · Frame #{status?.frame_count ?? 0}
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}


/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function DetectionPage() {
    const [tab, setTab] = useState<"image" | "video" | "camera">("image");

    return (
        <div className="dot-bg" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 48, borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>AI Detection Lab</span>
                    <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 2, border: "1px solid var(--border)" }}>
                        {([["image", "🖼️ Image", ImageIcon], ["video", "🎬 Video", Video], ["camera", "🎥 Live Camera", Video]] as const).map(([key, label, Icon]) => (
                            <button key={key} onClick={() => setTab(key as any)}
                                style={{
                                    padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: tab === key ? 700 : 500, cursor: "pointer", border: "none",
                                    background: tab === key ? "rgba(91,95,222,0.15)" : "transparent",
                                    color: tab === key ? "#818cf8" : "var(--text-3)", transition: "all 0.15s"
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    <span className="pill pill-blue" style={{ fontSize: 8 }}>YOLOv8n</span>
                    {tab === "video" && <span className="pill pill-amber" style={{ fontSize: 8 }}>BoT-SORT</span>}
                    {tab === "camera" && <span className="pill pill-red" style={{ fontSize: 8 }}>Real-time</span>}
                </div>
            </div>
            {tab === "image" ? <ImageTab /> : tab === "video" ? <VideoTab /> : <CameraTab />}
        </div>
    );
}
