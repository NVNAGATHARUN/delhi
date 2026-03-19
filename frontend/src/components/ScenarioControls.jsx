import { motion } from 'framer-motion'
import { switchScenario } from '../api/trafficApi'
import useTrafficStore from '../store/trafficStore'
import { useState } from 'react'

export default function ScenarioControls() {
  const { scenario, setScenario } = useTrafficStore()
  const [loading, setLoading] = useState(false)

  const handleSwitch = async (name) => {
    if (name === scenario) return
    setLoading(true)
    try {
      await switchScenario(name)
      setScenario(name)
    } catch (e) {
      console.error("Failed to switch scenario:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-4 flex flex-col justify-center h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-sm">🎮 Demo Simulator</h2>
        {loading && <span className="status-dot bg-white"></span>}
      </div>

      <div className="flex flex-col gap-3">
        {/* Normal Button */}
        <button
          onClick={() => handleSwitch('normal')}
          disabled={loading}
          className={`relative overflow-hidden group border rounded-xl p-3 flex flex-col items-center transition-all ${
            scenario === 'normal' 
              ? 'bg-neon-blue/20 border-neon-blue/50 text-white' 
              : 'bg-dark-700/50 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
          }`}
        >
          {scenario === 'normal' && (
            <motion.div layoutId="activeScenario" className="absolute inset-0 bg-neon-blue/10 rounded-xl" />
          )}
          <span className="text-xl mb-1 relative z-10">🚙</span>
          <span className="font-bold text-sm relative z-10">Normal Flow</span>
        </button>

        {/* Heavy Button */}
        <button
          onClick={() => handleSwitch('heavy')}
          disabled={loading}
          className={`relative overflow-hidden group border rounded-xl p-3 flex flex-col items-center transition-all ${
            scenario === 'heavy' 
              ? 'bg-neon-amber/20 border-neon-amber/50 text-white' 
              : 'bg-dark-700/50 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
          }`}
        >
          {scenario === 'heavy' && (
            <motion.div layoutId="activeScenario" className="absolute inset-0 bg-neon-amber/10 rounded-xl" />
          )}
          <span className="text-xl mb-1 relative z-10">🚛</span>
          <span className="font-bold text-sm relative z-10">Heavy Traffic</span>
        </button>

        {/* Emergency Button */}
        <button
          onClick={() => handleSwitch('emergency')}
          disabled={loading}
          className={`relative overflow-hidden group border rounded-xl p-3 flex flex-col items-center transition-all ${
            scenario === 'emergency' 
              ? 'bg-neon-red/20 border-neon-red/50 text-white shadow-neon-red' 
              : 'bg-dark-700/50 border-red-500/20 text-red-200 hover:text-white hover:border-red-500/50'
          }`}
        >
          {scenario === 'emergency' && (
            <motion.div layoutId="activeScenario" className="absolute inset-0 bg-neon-red/20 rounded-xl" />
          )}
          <span className="text-xl mb-1 relative z-10 font-bold">🚑</span>
          <span className="font-bold text-sm relative z-10">Trigger Emergency</span>
        </button>
      </div>
    </div>
  )
}
