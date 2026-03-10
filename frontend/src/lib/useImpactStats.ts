"use client";
// Accumulates live impact stats while simulation runs
import { useState, useEffect, useRef } from "react";
import type { TrafficState } from "./api";

export interface ImpactStats {
    vehiclesServed: number;
    minutesSaved: number;
    co2Avoided: number;      // kg
    emergenciesCleared: number;
}

export function useImpactStats(data: TrafficState): ImpactStats {
    const [stats, setStats] = useState<ImpactStats>({
        vehiclesServed: 0, minutesSaved: 0, co2Avoided: 0, emergenciesCleared: 0,
    });
    const lastTick = useRef(-1);
    const wasEmergency = useRef(false);
    const lastStatus = useRef("");

    useEffect(() => {
        // Reset when simulation restarts from idle
        if (data.status !== "RUNNING") {
            lastTick.current = -1;
            return;
        }
        if (data.tick === lastTick.current) return;
        lastTick.current = data.tick;

        const eff = Math.max(0, (data.quantum_efficiency - 70) / 30); // 0-1 normalised
        const minSaved = eff * data.total_vehicles * 0.01;                 // minutes saved this tick
        const co2 = minSaved * 2.63 / 1000;                           // kg CO₂ (idle ≈ 2.63g/veh-min)
        const cleared = (wasEmergency.current && !data.emergency_active) ? 1 : 0;
        wasEmergency.current = data.emergency_active;

        setStats(prev => ({
            vehiclesServed: prev.vehiclesServed + data.total_vehicles,
            minutesSaved: prev.minutesSaved + minSaved,
            co2Avoided: prev.co2Avoided + co2,
            emergenciesCleared: prev.emergenciesCleared + cleared,
        }));
    }, [data.tick, data.status, data.emergency_active, data.quantum_efficiency, data.total_vehicles]);

    return stats;
}
