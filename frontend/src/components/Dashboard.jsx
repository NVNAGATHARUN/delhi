import React, { useEffect } from 'react'
import { fetchCombined } from '../api/trafficApi'
import useTrafficStore from '../store/trafficStore'
import { motion, AnimatePresence } from 'framer-motion'

// Components
import SignalLight from './SignalLight'
import VehiclePanel from './VehiclePanel'
import EmergencyPanel from './EmergencyPanel'
import LaneView from './LaneView'
import RouteMap from './RouteMap'
import StatsGraph from './StatsGraph'
import MediaUploadPanel from './MediaUploadPanel'

export default function Dashboard() {
  const store = useTrafficStore()

  // Polling loop
  useEffect(() => {
    let timeoutId

    const poll = async () => {
      try {
        const data = await fetchCombined()
        store.updateFromCombined(data)
      } catch (err) {
        store.setError(err.message)
        store.setConnected(false)
      }
      // Poll every 1.5s
      timeoutId = setTimeout(poll, 1500)
    }

    poll()
    return () => clearTimeout(timeoutId)
  }, []) // eslint-disable-line

  if (store.loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="text-neon-blue font-mono font-bold tracking-widest glow-blue">INITIALIZING AI CORE...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 h-full flex flex-col gap-6">
      
      {/* Header */}
      <header className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-neon-blue text-xl">
            🧠
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">Q-Traffic AI</h1>
            <p className="text-sm text-slate-400 font-mono tracking-wider">Dynamic Flow Optimizer & Emergency Grid</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-mono">Quantum Engine</div>
            <div className="text-neon-green font-bold text-sm tracking-wide flex items-center gap-2 justify-end">
              <span className="status-dot bg-neon-green"></span>
              {store.quantumMethod || 'QAOA-sim Active'}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className={`status-dot ${store.connected ? 'bg-neon-blue' : 'bg-neon-red'}`}></span>
            <span className="text-sm font-mono text-slate-300">
              {store.connected ? 'SYSTEM ONLINE' : 'CONNECTION LOST'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Analytics & Controls (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 pb-4">
          <div className="flex-shrink-0 min-h-[220px]">
            <VehiclePanel />
          </div>
          <div className="flex-1 min-h-[350px]">
            <MediaUploadPanel />
          </div>
          <div className="flex-shrink-0">
             {/* If error, show here */}
            {store.error && (
              <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm font-mono">
                Error: {store.error}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: 3D View & Emergency (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6 pb-4">
          <motion.div layout className="flex-1 min-h-[300px] border border-white/5 rounded-2xl relative">
             <LaneView />
          </motion.div>
          <div className="h-auto">
             <EmergencyPanel />
          </div>
        </div>

        {/* Right Column: Signals & Route (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 pb-4">
          {/* Signals Row */}
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {store.laneCounts.map((_, i) => {
              const laneId = i + 1;
              const sig = store.signals.find(s => s.lane === laneId)
              const fallbackSig = laneId === 1 ? 'GREEN' : 'RED'
              return (
                <SignalLight 
                  key={laneId}
                  laneId={laneId}
                  signal={sig?.signal || fallbackSig}
                  greenTime={sig?.green_time || 0}
                  emergency={store.emergencyDetected && laneId === 3}
                />
              )
            })}
          </div>
          
          <div className="flex-shrink-0 h-[220px]">
            <RouteMap />
          </div>
          
          <div className="flex-1 min-h-[320px]">
             <StatsGraph />
          </div>
        </div>

      </div>
    </div>
  )
}
