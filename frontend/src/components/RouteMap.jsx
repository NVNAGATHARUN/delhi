import { motion } from 'framer-motion'
import useTrafficStore from '../store/trafficStore'

const NODE_POS = {
  A: { x: 30,  y: 50 },
  B: { x: 210, y: 50 },
  C: { x: 390, y: 50 },
  D: { x: 570, y: 50 },
  E: { x: 210, y: 160 },
  F: { x: 390, y: 160 },
}

const EDGES = [
  ['A', 'B'], ['B', 'C'], ['C', 'D'],
  ['A', 'E'], ['E', 'C'],
  ['B', 'F'], ['F', 'D'],
]

export default function RouteMap() {
  const { routePath, etaSeconds, junctionNames, emergencyDetected } = useTrafficStore()

  const isOnPath = (a, b) => {
    for (let i = 0; i < routePath.length - 1; i++) {
      if ((routePath[i] === a && routePath[i + 1] === b) ||
          (routePath[i] === b && routePath[i + 1] === a)) return true
    }
    return false
  }

  // Ambulance position — interpolate along path based on time
  const ambulanceProgress = emergencyDetected && routePath.length > 0

  return (
    <div className="glass rounded-2xl p-4 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">🗺️ Route Map</h2>
        <span className="text-xs text-slate-500 font-mono">Dijkstra + QAOA</span>
      </div>

      <svg viewBox="0 0 620 220" className="w-full flex-1" style={{ minHeight: 140 }}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="620" height="220" fill="url(#grid)" />

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const onPath = isOnPath(a, b)
          const posA = NODE_POS[a]
          const posB = NODE_POS[b]
          if (!posA || !posB) return null
          return (
            <g key={i}>
              <line
                x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                stroke={onPath ? '#00aaff' : '#1e2a42'}
                strokeWidth={onPath ? 3 : 1.5}
                strokeDasharray={onPath ? 'none' : '4 4'}
                filter={onPath ? 'url(#glow)' : 'none'}
              />
              {onPath && (
                <line
                  x1={posA.x} y1={posA.y} x2={posB.x} y2={posB.y}
                  stroke="#00aaff"
                  strokeWidth={3}
                  strokeOpacity={0.3}
                />
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {Object.entries(NODE_POS).map(([id, pos]) => {
          const pathIdx = routePath.indexOf(id)
          const isPath = pathIdx !== -1
          const isFirst = pathIdx === 0
          const isLast = pathIdx === routePath.length - 1
          const eta = etaSeconds[pathIdx]
          const isCleared = emergencyDetected && isPath && eta < 45

          const nodeColor = isFirst ? '#aa44ff' : isLast ? '#ff3366' :
                            isCleared ? '#00ff88' : isPath ? '#00aaff' : '#2a3a5a'
          const textColor = isPath ? '#fff' : '#4a5a7a'

          return (
            <g key={id} filter={isPath ? 'url(#glow)' : 'none'}>
              {/* Outer ring for path nodes */}
              {isPath && (
                <circle cx={pos.x} cy={pos.y} r={22} fill="none"
                  stroke={nodeColor} strokeWidth={1} strokeOpacity={0.3} />
              )}
              {/* Main circle */}
              <circle cx={pos.x} cy={pos.y} r={16} fill={nodeColor} fillOpacity={0.9} />
              {/* Node ID */}
              <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fontWeight="bold" fill="#000" fontFamily="monospace">{id}</text>
              {/* Label below */}
              <text x={pos.x} y={pos.y + 30} textAnchor="middle" fontSize={8} fill={textColor} fontFamily="sans-serif">
                {id === 'A' ? 'Start' : id === 'D' ? 'Hospital' : id === 'E' ? 'N.Bypass' : id === 'F' ? 'S.Bypass' : id}
              </text>
              {/* ETA */}
              {isPath && eta !== undefined && (
                <text x={pos.x} y={pos.y - 26} textAnchor="middle" fontSize={9}
                  fill={isCleared ? '#00ff88' : '#00aaff'} fontFamily="monospace" fontWeight="bold">
                  {eta === 0 ? 'NOW' : `${eta}s`}
                </text>
              )}
            </g>
          )
        })}

        {/* Animated ambulance along path */}
        {ambulanceProgress && routePath.length >= 2 && (() => {
          const startNode = NODE_POS[routePath[0]]
          const endNode = NODE_POS[routePath[1]]
          if (!startNode || !endNode) return null
          return (
            <motion.g
              initial={{ x: startNode.x, y: startNode.y }}
              animate={{ x: endNode.x, y: endNode.y }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            >
              <circle r={10} fill="#ffffff" fillOpacity={0.9} filter="url(#glow)" />
              <text textAnchor="middle" dominantBaseline="middle" fontSize={12}>🚑</text>
            </motion.g>
          )
        })()}
      </svg>

      {/* Path display */}
      {routePath.length > 0 && (
        <div className="flex items-center gap-1 text-xs font-mono justify-center flex-wrap">
          <span className="text-slate-500">Route:</span>
          {routePath.map((node, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-neon-blue font-bold">{node}</span>
              {i < routePath.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
