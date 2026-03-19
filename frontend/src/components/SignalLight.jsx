import { motion, AnimatePresence } from 'framer-motion'

const COLORS = {
  GREEN:  { bg: '#00ff88', glow: '0 0 20px #00ff88, 0 0 40px #00ff8855', dot: '#00ff88' },
  RED:    { bg: '#ff3366', glow: '0 0 20px #ff3366, 0 0 40px #ff336655', dot: '#ff3366' },
  YELLOW: { bg: '#ffaa00', glow: '0 0 20px #ffaa00, 0 0 40px #ffaa0055', dot: '#ffaa00' },
}

export default function SignalLight({ signal = 'RED', greenTime = 0, laneId = 1, emergency = false }) {
  const c = COLORS[signal] || COLORS.RED

  return (
    <motion.div
      className="glass p-4 flex flex-col items-center gap-3 rounded-2xl"
      animate={emergency && signal === 'GREEN' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ repeat: Infinity, duration: 0.6 }}
    >
      {/* Lane label */}
      <span className="text-xs font-mono font-semibold text-slate-400 tracking-widest uppercase">
        Lane {laneId}
      </span>

      {/* Traffic light housing */}
      <div className="bg-gray-900 rounded-xl p-3 flex flex-col items-center gap-3 border border-white/10 shadow-lg">
        {['RED', 'YELLOW', 'GREEN'].map(s => (
          <motion.div
            key={s}
            className="w-10 h-10 rounded-full"
            animate={{
              backgroundColor: signal === s ? COLORS[s].bg : '#1a1f2e',
              boxShadow: signal === s ? COLORS[s].glow : 'none',
              scale: signal === s ? 1.1 : 1,
            }}
            transition={{ duration: 0.35 }}
          />
        ))}
      </div>

      {/* Signal text */}
      <motion.span
        className="text-sm font-bold font-mono tracking-widest"
        style={{ color: c.bg, textShadow: c.glow }}
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ repeat: signal === 'RED' ? 0 : Infinity, duration: 1.2 }}
      >
        {signal}
      </motion.span>

      {/* Green time badge */}
      {signal === 'GREEN' && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="bg-neon-green/10 border border-neon-green/30 px-3 py-1 rounded-full"
        >
          <span className="text-neon-green text-xs font-mono font-bold">{greenTime}s</span>
        </motion.div>
      )}

      {/* Emergency badge */}
      {emergency && signal === 'GREEN' && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-xs font-bold text-neon-red"
        >🚑 OVERRIDE</motion.span>
      )}
    </motion.div>
  )
}
