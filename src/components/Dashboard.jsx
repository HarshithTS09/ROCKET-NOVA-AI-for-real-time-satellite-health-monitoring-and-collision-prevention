import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Zap, Shield, Activity } from 'lucide-react'

function Dashboard({ satellites, alerts, metrics, collisionRisks }) {
  const [timeRange, setTimeRange] = useState('1h')
  const [activeSection, setActiveSection] = useState('dashboard')

  // Simple state
  const simpleAltitudes = Array(10).fill(0).map((_, i) => 400 + Math.random() * 40)
  const simpleVelocities = Array(10).fill(0).map((_, i) => 7.7 + Math.random() * 0.3)

  return (
    <div className="space-y-16">
      <div>
        <p className="section-subtitle">Real-Time Overview</p>
        <h2 className="section-heading">Mission Control</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Satellites', value: metrics?.totalSatellites || 0, icon: Activity, color: 'cyan' },
          { label: 'System Health', value: metrics?.averageHealth ? `${metrics.averageHealth}%` : 'N/A', icon: Shield, color: 'green' },
          { label: 'Collision Risks', value: collisionRisks?.length || 0, icon: AlertTriangle, color: 'orange' },
          { label: 'Data Throughput', value: metrics?.dataThroughput ? `${metrics.dataThroughput} Gbps` : 'N/A', icon: Zap, color: 'blue' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <stat.icon className={`w-5 h-5 text-accent-${stat.color}`} />
              </div>
            </div>
            <p className="stat-number text-white mb-2">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Altitude Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Altitude Profile</h3>
              <p className="text-sm text-gray-500">Real-time altitude (km)</p>
            </div>
          </div>

          <div className="relative h-64">
            <svg viewBox="0 0 1000 200" className="w-full h-full drop-shadow-2xl overflow-visible">
              <defs>
                <linearGradient id="altGradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0, 212, 255, 0.5)" />
                  <stop offset="50%" stopColor="rgba(0, 212, 255, 0.1)" />
                  <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
                </linearGradient>
                <linearGradient id="altGradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0, 212, 255, 1)" />
                  <stop offset="100%" stopColor="rgba(0, 85, 255, 1)" />
                </linearGradient>
                <filter id="altGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid */}
              {[1, 2, 3, 4].map(i => (
                <line key={i} x1="50" y1={50 + i * 37.5} x2="950" y2={50 + i * 37.5} stroke="rgba(255,255,255,0.06)" strokeDasharray="6,6" />
              ))}
              
              {/* Calculate smoothed path */}
              {(() => {
                const points = simpleAltitudes.map((val, i) => ({
                  x: 50 + i * 100,
                  y: 200 - ((val - 360) / 80 * 150)
                }));
                
                let smoothD = `M ${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p1 = points[i];
                  const p2 = points[i + 1];
                  const cp1x = (p1.x + p2.x) / 2;
                  const cp2x = (p1.x + p2.x) / 2;
                  smoothD += ` C ${cp1x},${p1.y} ${cp2x},${p2.y} ${p2.x},${p2.y}`;
                }
                
                const areaD = `${smoothD} L 950,200 L 50,200 Z`;

                return (
                  <>
                    {/* Area Fill */}
                    <motion.path
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                      d={areaD}
                      fill="url(#altGradientArea)"
                    />
                    
                    {/* Glowing outer line */}
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      d={smoothD}
                      fill="none"
                      stroke="url(#altGradientLine)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      filter="url(#altGlow)"
                    />

                    {/* Core Line */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      d={smoothD}
                      fill="none"
                      stroke="url(#altGradientLine)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Glowing Points */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          r="6"
                          fill="rgba(0, 212, 255, 0.5)"
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                        />
                        <motion.circle
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill="#fff"
                          initial={{ r: 0 }}
                          animate={{ r: 3 }}
                          transition={{ delay: 1 + i * 0.1 }}
                        />
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Active Alerts</h3>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded-full">
              {alerts?.filter(a => !a.read).length || 0} NEW
            </span>
          </div>

          <div className="space-y-3">
            {alerts?.map((alert, index) => (
              <div key={alert.id} className={`p-3 rounded-lg border-l-2 ${
                alert.type === 'critical' ? 'border-l-red-500 bg-red-900/10' :
                alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-900/10' :
                'border-l-accent-cyan bg-accent-cyan/5'
              }`}>
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="text-xs text-gray-400">{alert.description}</p>
              </div>
            )) || <p className="text-gray-500 text-sm">No alerts</p>}
          </div>
        </motion.div>
      </div>

      {/* Satellite Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Live Satellite Fleet</h3>
          <p className="text-sm text-gray-500">Real-time telemetry data</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Position</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Speed</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Health</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {satellites?.map((sat, index) => (
                <motion.tr
                  key={sat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-4 px-4">
                    <span className="font-mono text-accent-cyan">{sat.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white font-medium">{sat.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{sat.type}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-gray-400">{sat.position.lat}°N, {sat.position.lng}°W</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-accent-blue">{sat.speed.toFixed(3)} km/s</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-mono ${sat.health > 90 ? 'text-accent-green' : sat.health > 80 ? 'text-accent-cyan' : 'text-yellow-500'}`}>
                      {sat.health.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sat.status === 'active' ? 'bg-accent-green/20 text-accent-green' :
                      sat.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {sat.status.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              )) || <tr><td colSpan="6" className="py-8 text-center text-gray-500">No satellite data available</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Test Navigation */}
      <div className="fixed bottom-8 left-8 glass p-4">
        <p className="text-sm text-gray-400 mb-2">Quick Navigation Test:</p>
        <div className="flex gap-2">
          {['dashboard', 'missions', 'fleet', 'analytics', 'alerts'].map(section => (
            <button
              key={section}
              onClick={() => {
                setActiveSection(section)
                window.history.pushState(null, '', `#${section}`)
              }}
              className={`px-3 py-1 text-xs rounded ${activeSection === section ? 'bg-accent-cyan text-black' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
