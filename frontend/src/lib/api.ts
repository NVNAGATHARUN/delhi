// Shared API layer — connects all pages to the FastAPI backend (redeploy trigger)

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export async function apiGet<T = unknown>(path: string): Promise<T> {
    const r = await fetch(`${API}${path}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json() as Promise<T>;
}

export async function apiPost<T = unknown>(path: string): Promise<T> {
    const r = await fetch(`${API}${path}`, { method: "POST" });
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json() as Promise<T>;
}

// Shared types
export interface LaneData {
    vehicles: number;
    congestion: "LOW" | "MEDIUM" | "HIGH";
    signal: "RED" | "GREEN";
    green_time: number;
    arrival_rate?: number;
}

export interface TrafficState {
    status: "RUNNING" | "STOPPED";
    mode: "idle" | "live" | "demo";
    current_phase: string;
    phase_timer: number;
    phase_max: number;
    quantum_efficiency: number;
    total_vehicles: number;
    emergency_active: boolean;
    emergency_lane: string | null;
    tick: number;
    intersections: Record<string, {
        name: string;
        current_phase: string;
        phase_timer: number;
        phase_max: number;
        quantum_efficiency: number;
        lanes: Record<string, LaneData>;
    }>;
    lanes: Record<string, LaneData>;
    history: any[];
}

export const LANE_COLORS: Record<string, string> = {
    HIGH: "#f43f5e",
    MEDIUM: "#f59e0b",
    LOW: "#6366f1",
};
