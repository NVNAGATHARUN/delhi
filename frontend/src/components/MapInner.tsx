"use client";
// Inner Leaflet map — only imported client-side
import { useEffect, useRef } from "react";
import type { Intersection } from "./TrafficMap";

interface Props {
    intersections: Intersection[];
    emergencyActive?: boolean;
    emergencyLane?: string | null;
    phase: string;
}

// Delhi intersection coordinates (real locations)
const DELHI_CENTER: [number, number] = [28.6139, 77.2090];

export default function MapInner({ intersections, emergencyActive, emergencyLane, phase }: Props) {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        // Dynamic import to avoid SSR issues
        const initMap = async () => {
            const L = (await import("leaflet")).default;
            // Inject Leaflet CSS via CDN link tag (dynamic CSS import not supported in Next.js)
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css";
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            // Clear any stale Leaflet state on the container (React 18 Strict Mode / HMR fix)
            const container = containerRef.current as any;
            if (container._leaflet_id) {
                delete container._leaflet_id;
            }

            const map = L.map(containerRef.current!, {
                center: DELHI_CENTER,
                zoom: 13,
                zoomControl: true,
                attributionControl: false,
            });

            // Dark tile layer using Stadia Alidade Smooth Dark
            L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
                maxZoom: 20,
                attribution: "© Stadia Maps",
            }).addTo(map);

            mapRef.current = map;
        };
        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers when intersections change
    useEffect(() => {
        if (!mapRef.current) return;
        const updateMarkers = async () => {
            const L = (await import("leaflet")).default;
            // Clear old markers
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            intersections.forEach((ix, idx) => {
                const color = ix.signal === "GREEN" ? "#10b981" : "#f43f5e";
                const isEmerg = emergencyActive && emergencyLane && idx === 0; // highlight one

                // Custom SVG icon
                const svgIcon = L.divIcon({
                    className: "",
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                    html: `
            <div style="position:relative;width:48px;height:48px;">
              <div style="
                position:absolute;inset:0;border-radius:50%;
                background:${color}22;
                animation:pulse 2s infinite;
              "></div>
              <div style="
                position:absolute;inset:8px;border-radius:50%;
                background:${color};
                border:2px solid white;
                display:flex;align-items:center;justify-content:center;
                font-size:10px;font-weight:900;color:white;
                box-shadow:0 0 12px ${color};
              ">${ix.vehicles}</div>
              ${isEmerg ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#f43f5e;border:2px solid white;font-size:7px;display:flex;align-items:center;justify-content:center;">🚑</div>` : ""}
            </div>
          `,
                });

                const marker = L.marker([ix.lat, ix.lng], { icon: svgIcon }).addTo(mapRef.current);
                marker.bindPopup(`
          <div style="background:var(--surface,#0c0c20);color:white;border-radius:10px;padding:12px;min-width:180px;border:1px solid rgba(255,255,255,0.1)">
            <b style="color:${color};font-size:13px">${ix.name}</b><br/>
            <div style="margin-top:6px;font-size:11px;line-height:1.8">
              Signal: <b style="color:${color}">${ix.signal}</b><br/>
              Vehicles: <b>${ix.vehicles}</b><br/>
              Congestion: <b style="color:${color}">${ix.congestion}</b><br/>
              Phase: <b>${phase}</b>
            </div>
          </div>
        `, { className: "dark-popup" });

                markersRef.current.push(marker);

                // ── Congestion Heatmap circle ───────────────────────────────────
                const heatR = ({ HIGH: 700, MEDIUM: 400, LOW: 200 } as any)[ix.congestion] || 200;
                const heatC = ({ HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#10b981" } as any)[ix.congestion] || "#10b981";
                const heatO = ({ HIGH: 0.22, MEDIUM: 0.14, LOW: 0.08 } as any)[ix.congestion] || 0.08;
                const heatCircle = L.circle([ix.lat, ix.lng], {
                    radius: heatR, color: heatC, fillColor: heatC,
                    fillOpacity: heatO, weight: 1, opacity: 0.3,
                }).addTo(mapRef.current);
                markersRef.current.push(heatCircle);

                // ── Emergency highlight ─────────────────────────────────────────
                if (emergencyActive && emergencyLane === ix.id) {
                    const emergCircle = L.circle([ix.lat, ix.lng], {
                        radius: 900, color: "#ef4444", fillColor: "#ef4444",
                        fillOpacity: 0.12, weight: 2, opacity: 0.6, dashArray: "6 4",
                    }).addTo(mapRef.current);
                    markersRef.current.push(emergCircle);
                }
            });

            // Draw emergency route line if active
            if (emergencyActive && intersections.length >= 2) {
                const coords = intersections.slice(0, 3).map(ix => [ix.lat, ix.lng] as [number, number]);
                const line = L.polyline(coords, {
                    color: "#f43f5e",
                    weight: 4,
                    opacity: 0.8,
                    dashArray: "8 6",
                }).addTo(mapRef.current);
                markersRef.current.push(line);
            }
        };

        const t = setTimeout(updateMarkers, 100);
        return () => clearTimeout(t);
    }, [intersections, emergencyActive, emergencyLane, phase]);

    return (
        <>
            <style>{`
        .leaflet-container { background: #050510; }
        .dark-popup .leaflet-popup-content-wrapper { background:#0c0c20; border:1px solid rgba(255,255,255,0.1); border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.5); }
        .dark-popup .leaflet-popup-tip { background:#0c0c20; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.4);opacity:0} }
      `}</style>
            <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />
        </>
    );
}
