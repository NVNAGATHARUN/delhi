"use client";
// Traffic Map Component using Leaflet
// Delhi intersections with signal status, vehicle count, and emergency route
import dynamic from "next/dynamic";

// Leaflet must be imported with SSR disabled
const MapWithNoSSR = dynamic(() => import("./MapInner"), {
    ssr: false, loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#080818] rounded-xl">
            <div className="text-white/30 text-sm">Loading map…</div>
        </div>
    )
});

export interface Intersection {
    id: string;
    name: string;
    lat: number;
    lng: number;
    signal: "RED" | "GREEN";
    vehicles: number;
    congestion: "LOW" | "MEDIUM" | "HIGH";
}

interface TrafficMapProps {
    intersections: Intersection[];
    emergencyLane?: string | null;
    emergencyActive?: boolean;
    phase: string;
}

export default function TrafficMap(props: TrafficMapProps) {
    return (
        <div className="w-full h-full rounded-xl overflow-hidden">
            <MapWithNoSSR {...props} />
        </div>
    );
}
