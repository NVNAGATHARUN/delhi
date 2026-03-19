import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import useTrafficStore from '../store/trafficStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs border border-white/10">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-mono font-bold">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function StatsGraph() {
  const { stats, densityHistory, laneCounts, emergencyDetected } = useTrafficStore()

  const comparisonData = [
    {
      name: 'Wait Time (s)',
      Fixed:     stats.fixed_waiting_time || 90,
      Optimized: stats.optimized_waiting_time || 45,
    },
    {
      name: 'Congestion %',
      Fixed:     Math.round((stats.congestion_before || 0.5) * 100),
      Optimized: Math.round((stats.congestion_after  || 0.3) * 100),
    },
  ]

  const densityData = (densityHistory || []).map((v, i) => ({
    t: `T-${densityHistory.length - i}`,
    density: Math.round(v * 100),
  }))

  const laneData = laneCounts.map((c, i) => ({
    name: `Lane ${i + 1}`,
    vehicles: c,
    capacity: 30,
  }))

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">📊 Performance Analytics</h2>
        <span className="text-xs text-slate-500 font-mono">
          {emergencyDetected ? '🚑 Emergency Mode' : 'Normal Mode'}
        </span>
      </div>

      {/* Before vs After comparison */}
      <div>
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Dynamic vs Fixed Signals</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={comparisonData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
            <Bar dataKey="Fixed"     fill="#ff3366" radius={[3, 3, 0, 0]} name="Fixed"     />
            <Bar dataKey="Optimized" fill="#00ff88" radius={[3, 3, 0, 0]} name="QAOA Opt." />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Density trend */}
      <div>
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Density History (%)</p>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={densityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="density" stroke="#00aaff"
              strokeWidth={2} dot={false} name="Density %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-lane bar */}
      <div>
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest">Lane Vehicle Count</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={laneData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="capacity" fill="#1a2a4a" radius={[3, 3, 0, 0]} name="Capacity" />
            <Bar dataKey="vehicles"
              fill={emergencyDetected ? '#00ff88' : '#aa44ff'}
              radius={[3, 3, 0, 0]} name="Vehicles" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
