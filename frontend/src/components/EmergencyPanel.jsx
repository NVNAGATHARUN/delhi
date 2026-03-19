import { motion, AnimatePresence } from 'framer-motion'
import useTrafficStore from '../store/trafficStore'

export default function EmergencyPanel() {
  const { emergencyDetected, alertMessage, junctionsCleared, routePath, etaSeconds, junctionNames } = useTrafficStore()

  return (
    <AnimatePresence>
      {emergencyDetected ? (
        <motion.div
          key="emergency"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="siren-bg rounded-2xl border border-red-500/40 p-5 space-y-4 relative overflow-hidden"
        >
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-red-400/60 pointer-events-none"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          />

          {/* Header */}
          <div className="flex items-center gap-3">
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >🚑</motion.span>
            <div>
              <motion.h2
                className="text-neon-red font-black text-xl tracking-wide glow-red"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >EMERGENCY MODE ACTIVE</motion.h2>
              <p className="text-red-300 text-xs">Lane 3 Reserved • Green Corridor Activated</p>
            </div>
            <motion.div
              className="ml-auto flex gap-1"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            </motion.div>
          </div>

          {/* Alert message */}
          {alertMessage && (
            <p className="text-sm text-red-200 bg-red-950/40 px-3 py-2 rounded-lg border border-red-500/20">
              {alertMessage}
            </p>
          )}

          {/* Junction ETA timeline */}
          <div>
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest">Junction Clearance Timeline</p>
            <div className="flex items-start gap-0">
              {junctionsCleared.map((j, i) => (
                <div key={i} className="flex-1 relative">
                  {/* Connector line */}
                  {i < junctionsCleared.length - 1 && (
                    <motion.div
                      className="absolute top-3 left-1/2 w-full h-0.5"
                      style={{
                        background: j.status === 'CLEARED'
                          ? 'linear-gradient(90deg, #00ff88, #00aaff)'
                          : j.status === 'PRE-CLEARED'
                          ? 'linear-gradient(90deg, #ffaa00, #ffaa0033)'
                          : '#1a2a4a',
                      }}
                      animate={j.status === 'CLEARED' ? { opacity: [1, 0.5, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                  )}

                  {/* Node */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <motion.div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2"
                      style={{
                        background: j.status === 'CLEARED'    ? '#00ff88' :
                                    j.status === 'PRE-CLEARED' ? '#ffaa00' : '#1a2a4a',
                        borderColor: j.status === 'CLEARED'   ? '#00ff88' :
                                     j.status === 'PRE-CLEARED' ? '#ffaa00' : '#2a3a5a',
                        color: j.status === 'SCHEDULED' ? '#4a5a7a' : '#000',
                        boxShadow: j.status === 'CLEARED' ? '0 0 12px #00ff88' :
                                   j.status === 'PRE-CLEARED' ? '0 0 10px #ffaa00' : 'none',
                      }}
                      animate={j.status !== 'SCHEDULED' ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    >
                      {j.junction}
                    </motion.div>
                    <span className="text-xs text-slate-400 text-center leading-tight" style={{ fontSize: '9px' }}>
                      {j.name}
                    </span>
                    <span className="font-mono text-xs" style={{
                      color: j.status === 'CLEARED' ? '#00ff88' : j.status === 'PRE-CLEARED' ? '#ffaa00' : '#4a5a7a',
                      fontSize: '10px',
                    }}>
                      {j.eta_seconds === 0 ? 'NOW' : `${j.eta_seconds}s`}
                    </span>
                    <span className="text-xs rounded px-1" style={{
                      background: j.status === 'CLEARED' ? '#00ff8820' : j.status === 'PRE-CLEARED' ? '#ffaa0020' : '#1a2a4a',
                      color: j.status === 'CLEARED' ? '#00ff88' : j.status === 'PRE-CLEARED' ? '#ffaa00' : '#4a5a7a',
                      fontSize: '9px',
                    }}>
                      {j.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lane status */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(lane => {
              const isEmergency = lane === 3
              return (
                <div key={lane} className={`p-2 rounded-lg border text-center ${
                  isEmergency
                    ? 'border-neon-green/40 bg-neon-green/10'
                    : 'border-red-500/20 bg-red-950/20'
                }`}>
                  <div className="text-xs font-mono font-bold" style={{ color: isEmergency ? '#00ff88' : '#ff3366' }}>
                    Lane {lane}
                  </div>
                  <div className="text-xs mt-1" style={{ color: isEmergency ? '#00ff88' : '#ff3366', fontSize: '9px' }}>
                    {isEmergency ? '🚑 RESERVED' : '🔴 STOPPED'}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="normal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-5 border border-neon-green/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-neon-green" style={{ boxShadow: '0 0 10px #00ff88' }} />
            <span className="text-neon-green font-bold">System Nominal</span>
          </div>
          <p className="text-slate-500 text-xs mt-2">No emergency vehicles detected. All signals operating normally.</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
