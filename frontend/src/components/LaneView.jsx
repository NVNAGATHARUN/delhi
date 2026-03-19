import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import { Text, Box, Cylinder, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import useTrafficStore from '../store/trafficStore'

// ─── Vehicle mesh ─────────────────────────────────────────────────────────────
function Vehicle({ position, color, speed = 0.03 }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) {
      ref.current.position.z -= speed
      if (ref.current.position.z < -18) ref.current.position.z = 18
    }
  })
  return (
    <group ref={ref} position={position}>
      <Box args={[0.8, 0.35, 1.6]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
      </Box>
      {/* Headlights */}
      <pointLight position={[0, 0, -0.8]} color={color} intensity={0.8} distance={3} />
    </group>
  )
}

// ─── Road lane ────────────────────────────────────────────────────────────────
function Lane({ x, color, count, isEmergency, isReserved }) {
  const vehicles = useMemo(() => {
    const base = Math.min(count, 6)
    return Array.from({ length: base }, (_, i) => ({
      id: i,
      z: -15 + (i * 30 / Math.max(base, 1)) + Math.random() * 3,
      speed: 0.02 + Math.random() * 0.025,
    }))
  }, [count])

  const laneColor = isEmergency ? '#00ff88' : isReserved ? '#ff3366' : '#1a2a4a'

  return (
    <group position={[x, 0, 0]}>
      {/* Lane surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
        <planeGeometry args={[2.4, 40]} />
        <meshStandardMaterial
          color={laneColor}
          emissive={laneColor}
          emissiveIntensity={isEmergency ? 0.25 : 0.04}
          opacity={0.85}
          transparent
          roughness={0.8}
        />
      </mesh>

      {/* Dashed center line */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[1.2, -0.21, -14 + i * 4]}>
          <planeGeometry args={[0.06, 1.5]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* Lane glow strip */}
      {(isEmergency || isReserved) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.20, 0]}>
          <planeGeometry args={[2.4, 40]} />
          <meshStandardMaterial
            color={isEmergency ? '#00ff88' : '#ff3366'}
            emissive={isEmergency ? '#00ff88' : '#ff3366'}
            emissiveIntensity={0.6}
            opacity={0.12}
            transparent
          />
        </mesh>
      )}

      {/* Vehicles */}
      {!isReserved && vehicles.map(v => (
        <Vehicle
          key={v.id}
          position={[0, 0, v.z]}
          color={isEmergency ? '#00ff88' : '#00aaff'}
          speed={v.speed}
        />
      ))}

      {/* Ambulance in emergency lane */}
      {isEmergency && (
        <AmbulanceMesh />
      )}
    </group>
  )
}

function AmbulanceMesh() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.z = -10 + ((clock.getElapsedTime() * 12) % 30)
    }
  })
  return (
    <group ref={ref} position={[0, 0, -10]}>
      <Box args={[1, 0.5, 2.2]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </Box>
      {/* Siren light */}
      <pointLight color="#ff3366" intensity={3} distance={6} position={[0, 0.5, 0]} />
      <pointLight color="#0088ff" intensity={3} distance={6} position={[0, 0.5, 0]} />
      <Box args={[0.35, 0.15, 0.35]} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={2} />
      </Box>
    </group>
  )
}

// ─── Signal post ──────────────────────────────────────────────────────────────
function SignalPost({ x, signal }) {
  const colors = { GREEN: '#00ff88', RED: '#ff3366', YELLOW: '#ffaa00' }
  const c = colors[signal] || '#ff3366'
  return (
    <group position={[x, 0, -17]}>
      <Cylinder args={[0.08, 0.08, 3.5, 8]}>
        <meshStandardMaterial color="#333" metalness={0.8} />
      </Cylinder>
      <Box args={[0.5, 1.2, 0.2]} position={[0, 2.2, 0]}>
        <meshStandardMaterial color="#111" />
      </Box>
      <mesh position={[0, 2.2, 0.12]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={c} emissive={c} emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 2.2, 0.5]} color={c} intensity={4} distance={5} />
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  const { laneCounts, signals, emergencyDetected } = useTrafficStore()

  const lanePositions = [-2.4, 0, 2.4]
  const signalForLane = (i) => signals[i]?.signal || 'RED'
  const greenTimeForLane = (i) => signals[i]?.green_time || 0

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} color="#101828" />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#aabbff" />
      <pointLight position={[0, 8, 0]} intensity={0.5} color="#002244" distance={30} />

      {/* Road base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.23, 0]}>
        <planeGeometry args={[8, 40]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.95} />
      </mesh>

      {/* Lanes */}
      {lanePositions.map((x, i) => (
        <Lane
          key={i}
          x={x}
          count={laneCounts[i] || 0}
          isEmergency={emergencyDetected && i === 2}
          isReserved={emergencyDetected && (i === 0 || i === 1)}
          signal={signalForLane(i)}
        />
      ))}

      {/* Signal posts */}
      {lanePositions.map((x, i) => (
        <SignalPost key={i} x={x} signal={signalForLane(i)} />
      ))}

      {/* Road markings */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.22, 0]}>
          <planeGeometry args={[0.08, 40]} />
          <meshStandardMaterial color="#ffffff" opacity={0.15} transparent />
        </mesh>
      ))}

      {/* Fog effect */}
      <fog attach="fog" color="#050812" near={20} far={50} />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function LaneView() {
  return (
    <div className="glass rounded-2xl overflow-hidden" style={{ height: 320 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h2 className="text-white font-bold text-sm">🛣️ Live 3D Lane Simulation</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span><span className="text-neon-blue">■</span> Normal</span>
          <span><span className="text-neon-green">■</span> Emergency</span>
          <span><span className="text-neon-red">■</span> Blocked</span>
        </div>
      </div>
      <Canvas
        camera={{ position: [0, 5, 12], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#050812', height: 272 }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
