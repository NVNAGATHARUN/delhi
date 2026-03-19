import { motion } from 'framer-motion'
import useTrafficStore from '../store/trafficStore'

const TYPE_COLORS = {
  car:   '#00aaff',
  bike:  '#00ff88',
  bus:   '#ffaa00',
  truck: '#aa44ff',
}

const TYPE_ICONS = { car: '🚗', bike: '🏍️', bus: '🚌', truck: '🚛' }

export default function VehiclePanel() {
  const { vehicleCount, laneCounts, density, emergencyDetected } = useTrafficStore()

  const densityLevel =
    density > 0.8 ? 'CRITICAL' :
    density > 0.5 ? 'HIGH' :
    density > 0.3 ? 'MODERATE' : 'LOW'

  const densityColor =
    density > 0.8 ? 'text-red-400' :
    density > 0.5 ? 'text-amber-400' :
    density > 0.3 ? 'text-yellow-400' : 'text-neon-green'

  return (
    <div className="glass p-5 rounded-2xl h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">🚦 Traffic Monitor</h2>
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-full border ${
          densityLevel === 'CRITICAL' ? 'border-red-500/40 bg-red-500/10 text-red-400' :
          densityLevel === 'HIGH'     ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' :
          'border-neon-green/40 bg-neon-green/10 text-neon-green'
        }`}>{densityLevel}</span>
      </div>

      {/* Big vehicle count */}
      <div className="text-center py-2">
        <motion.div
          key={vehicleCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-black font-mono glow-blue text-neon-blue"
        >
          {vehicleCount}
        </motion.div>
        <p className="text-slate-400 text-sm mt-1">Total Vehicles</p>
      </div>

      {/* Density bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Density</span>
          <span className={densityColor}>{(density * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: density > 0.8 ? '#ff3366' : density > 0.5 ? '#ffaa00' : '#00ff88',
              boxShadow: `0 0 8px ${density > 0.8 ? '#ff3366' : density > 0.5 ? '#ffaa00' : '#00ff88'}`,
            }}
            animate={{ width: `${density * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Lane breakdown */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Per Lane</p>
        {laneCounts.map((count, i) => {
          const laneDensity = count / 30
          const isEmergencyLane = emergencyDetected && i === 2
          return (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${
              isEmergencyLane ? 'bg-neon-green/5 border border-neon-green/20' : 'bg-white/2'
            }`}>
              <span className="text-xs text-slate-400 w-14 font-mono">Lane {i + 1}</span>
              <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isEmergencyLane ? '#00ff88' : laneDensity > 0.8 ? '#ff3366' : '#00aaff',
                  }}
                  animate={{ width: `${laneDensity * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-white w-6 text-right">{count}</span>
              {isEmergencyLane && <span className="text-xs">🚑</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
