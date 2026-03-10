"use client";
// Shared hook providing live traffic data via WebSocket + HTTP poll fallback
import { useState, useEffect } from "react";
import { TrafficState, API, WS_URL } from "./api";

const DEFAULT_STATE: TrafficState = {
    status: "STOPPED", mode: "idle",
    current_phase: "N/A", phase_timer: 0, phase_max: 30,
    quantum_efficiency: 0, total_vehicles: 0,
    emergency_active: false, emergency_lane: null,
    tick: 0,
    intersections: {},
    lanes: {
        north: { vehicles: 0, congestion: "LOW", signal: "RED", green_time: 15 },
        south: { vehicles: 0, congestion: "LOW", signal: "RED", green_time: 15 },
        east: { vehicles: 0, congestion: "LOW", signal: "RED", green_time: 15 },
        west: { vehicles: 0, congestion: "LOW", signal: "RED", green_time: 15 },
    },
    history: [],
};

export function useTrafficData() {
    const [data, setData] = useState<TrafficState>(DEFAULT_STATE);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ws: WebSocket;
        const connect = () => {
            ws = new WebSocket(WS_URL);
            ws.onopen = () => { setConnected(true); setLoading(false); };
            ws.onclose = () => { setConnected(false); setTimeout(connect, 2000); };
            ws.onmessage = (e) => {
                try { const d = JSON.parse(e.data); if (!d.ping) { setData(d); setLoading(false); } } catch { }
            };
        };
        connect();
        return () => ws?.close();
    }, []);

    // HTTP fallback poll
    useEffect(() => {
        const iv = setInterval(async () => {
            try {
                const r = await fetch(`${API}/dashboard-data`);
                const d = await r.json();
                setData(d);
                setLoading(false);
            } catch { }
        }, 2000);
        return () => clearInterval(iv);
    }, []);

    const post = async (endpoint: string) => {
        try { await fetch(`${API}${endpoint}`, { method: "POST" }); } catch { }
    };

    return { data, connected, loading, post };
}
