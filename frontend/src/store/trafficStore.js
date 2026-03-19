import { create } from 'zustand'

const useTrafficStore = create((set, get) => ({
  // Core data
  scenario: 'normal',
  tick: 0,
  connected: false,
  loading: true,
  error: null,

  // Traffic
  vehicleCount: 0,
  laneCounts: [0, 0, 0],
  density: 0,
  densityHistory: [],
  emergencyDetected: false,
  ambulanceLane: null,

  // Signals
  signals: [],
  selectedLane: null,
  quantumMethod: 'QAOA-sim',

  // Emergency
  emergency: {},
  laneStates: [],
  junctionsCleared: [],
  alertMessage: null,

  // Route
  routePath: [],
  etaSeconds: [],
  junctionNames: [],
  routeNodes: [],

  // Stats
  stats: {},

  // Actions
  setConnected: (v)  => set({ connected: v }),
  setLoading:   (v)  => set({ loading: v }),
  setError:     (v)  => set({ error: v }),
  setScenario:  (v)  => set({ scenario: v }),

  updateFromCombined: (data) => {
    const { traffic, signals, emergency, route, stats } = data

    set({
      scenario:          data.scenario,
      tick:              data.tick,
      loading:           false,
      connected:         true,
      error:             null,

      // Traffic
      vehicleCount:      traffic.vehicle_count,
      laneCounts:        traffic.lane_counts,
      density:           traffic.density,
      densityHistory:    traffic.density_history || [],
      emergencyDetected: traffic.emergency_detected,
      ambulanceLane:     traffic.ambulance_lane,

      // Signals
      signals:           signals.optimized_timings || [],
      selectedLane:      signals.selected_lane,
      quantumMethod:     signals.method,

      // Emergency
      emergency:         emergency,
      laneStates:        emergency.lane_states || [],
      junctionsCleared:  emergency.junctions_cleared || [],
      alertMessage:      emergency.alert_message,

      // Route
      routePath:         route.path || [],
      etaSeconds:        route.eta_seconds || [],
      junctionNames:     route.junction_names || [],
      routeNodes:        route.nodes || [],

      // Stats
      stats:             stats || {},
    })
  },
}))

export default useTrafficStore
