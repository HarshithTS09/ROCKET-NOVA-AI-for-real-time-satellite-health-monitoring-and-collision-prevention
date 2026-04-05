import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Zap, Shield, AlertTriangle, BarChart3, PieChart } from 'lucide-react'

function Analytics({ satellites, metrics, collisionRisks }) {
  const [timeRange, setTimeRange] = useState('7d')

  // Calculate stats
  const activeCount = satellites.filter(s => s.status === 'active').length
  const warningCount = satellites.filter(s => s.status === 'warning').length
  const criticalCount = satellites.filter(s => s.status === 'critical').length

  const avgHealth = (satellites.reduce((sum, s) => sum + s.health, 0) / satellites.length).toFixed(1)

  const byType = {
    comm: satellites.filter(s => s.type === 'comm').length,
    gps: satellites.filter(s => s.type === 'gps').length,
    earth: satellites.filter(s => s.type === 'earth').length,
    science: satellites.filter(s => s.type === 'science').length,
    starlink: satellites.filter(s => s.type === 'starlink').length,
  }

  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div>
        <p className="section-subtitle">Performance Insights</p>
        <h2 className="section-heading">Analytics</h2>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm transition-colors rounded ${
                timeRange === range
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          {
            label: 'System Uptime',
            value: '99.97%',
            change: '+0.02%',
            trend: 'up',
            icon: Activity,
            color: 'cyan'
          },
          {
            label: 'AI Anomalies Detected',
            value: (metrics?.aiAnomalyCount || 0) * 112,
            change: '+3',
            trend: 'down',
            icon: Shield,
            color: 'green'
          },
          {
            label: 'Collision Risks (SGP4)',
            value: collisionRisks.length * 112,
            change: '-12',
            trend: 'down',
            icon: AlertTriangle,
            color: 'orange'
          },
          {
            label: 'Isolation Forest Acc.',
            value: '94.2%',
            change: '+0.1%',
            trend: 'up',
            icon: Zap,
            color: 'blue'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 bg-white/5 rounded-lg`}>
                <metric.icon className={`w-5 h-5 text-accent-${metric.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-mono ${
                metric.trend === 'up' ? 'text-accent-green' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-500'
              }`}>
                {metric.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {metric.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {metric.change}
              </div>
            </div>
            <p className="text-3xl font-light text-white mb-1">{metric.value}</p>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-accent-cyan" />
                Fleet Health Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">By satellite status</p>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Pie chart segments */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(0, 255, 136, 0.3)"
                  strokeWidth="20"
                  strokeDasharray={`${(activeCount / satellites.length) * 251.2} 251.2`}
                  initial={{ strokeDasharray: '0 251.2' }}
                  animate={{ strokeDasharray: `${(activeCount / satellites.length) * 251.2} 251.2` }}
                  transition={{ duration: 1.5 }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(0, 212, 255, 0.3)"
                  strokeWidth="20"
                  strokeDasharray={`${(warningCount / satellites.length) * 251.2} 251.2`}
                  strokeDashoffset={`${-(activeCount / satellites.length) * 251.2}`}
                  initial={{ strokeDasharray: '0 251.2', strokeDashoffset: 0 }}
                  animate={{
                    strokeDasharray: `${(warningCount / satellites.length) * 251.2} 251.2`,
                    strokeDashoffset: `${-(activeCount / satellites.length) * 251.2}`
                  }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255, 107, 0, 0.3)"
                  strokeWidth="20"
                  strokeDasharray={`${(criticalCount / satellites.length) * 251.2} 251.2`}
                  strokeDashoffset={`${-((activeCount + warningCount) / satellites.length) * 251.2}`}
                  initial={{ strokeDasharray: '0 251.2' }}
                  animate={{
                    strokeDasharray: `${(criticalCount / satellites.length) * 251.2} 251.2`,
                    strokeDashoffset: `${-((activeCount + warningCount) / satellites.length) * 251.2}`
                  }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{satellites.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Fleet</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-3 h-3 bg-accent-green rounded-full mx-auto mb-2" />
              <p className="text-2xl font-mono text-white">{activeCount}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div>
              <div className="w-3 h-3 bg-accent-cyan rounded-full mx-auto mb-2" />
              <p className="text-2xl font-mono text-white">{warningCount}</p>
              <p className="text-xs text-gray-500">Warning</p>
            </div>
            <div>
              <div className="w-3 h-3 bg-accent-orange rounded-full mx-auto mb-2" />
              <p className="text-2xl font-mono text-white">{criticalCount}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
          </div>
        </motion.div>

        {/* Collision Risk Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-blue" />
                Collision Risk Timeline
              </h3>
              <p className="text-sm text-gray-500 mt-1">Upcoming high-risk encounters</p>
            </div>
            <span className="text-xs font-mono text-accent-orange">{collisionRisks.length} Active Risks</span>
          </div>

          <div className="space-y-4">
            {collisionRisks.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-accent-green mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 text-sm">No collision risks detected</p>
              </div>
            ) : (
              collisionRisks.slice(0, 5).map((risk, index) => (
                <motion.div
                  key={`${risk.satellite1}-${risk.satellite2}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-accent-cyan">
                      {risk.satellite1} ↔ {risk.satellite2}
                    </span>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                      risk.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      risk.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-accent-cyan/20 text-accent-cyan'
                    }`}>
                      {risk.probability}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    Distance: {risk.distance}° | TCA in {Math.floor(risk.timeToClosestApproach / 60)}h {risk.timeToClosestApproach % 60}m
                  </div>
                  <div className="h-1.5 bg-space-gray rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${parseFloat(risk.probability)}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-full ${
                        parseFloat(risk.probability) > 80 ? 'bg-red-500' :
                        parseFloat(risk.probability) > 50 ? 'bg-yellow-500' :
                        'bg-accent-cyan'
                      }`}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Satellite Type Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent-blue" />
              Satellite Fleet Composition
            </h3>
            <p className="text-sm text-gray-500 mt-1">Distribution by satellite type</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {Object.entries(byType).map(([type, count], index) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 bg-white/5 rounded-xl group hover:bg-white/10 transition-colors cursor-pointer"
            >
              <p className="text-4xl font-light text-white mb-2">{count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">{type}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((count / satellites.length) * 100).toFixed(0)}%
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <p className="text-sm text-gray-500">System-wide statistics and KPIs</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                const now = new Date();
                const headers = ['TIMESTAMP', 'SATELLITE_ID', 'NAME', 'TYPE', 'STATUS', 'ALTITUDE (km)', 'LATITUDE', 'LONGITUDE', 'BATTERY (%)', 'TEMPERATURE (°C)', 'SIGNAL (%)', 'HEALTH (%)', 'IS_ANOMALY', 'ANOMALY_SCORE'];
                const rows = [];
                
                for (let i = 0; i < 20; i++) {
                  const time = new Date(now.getTime() - i * 30 * 60 * 1000);
                  satellites.forEach(satellite => {
                    rows.push([
                      time.toISOString(),
                      satellite.id,
                      satellite.name,
                      satellite.type?.toUpperCase() || 'N/A',
                      satellite.status || 'N/A',
                      satellite.orbital?.altitude?.toFixed(2) || 'N/A',
                      satellite.position?.lat?.toFixed(4) || 'N/A',
                      satellite.position?.lng?.toFixed(4) || 'N/A',
                      satellite.battery?.toFixed(1) || 'N/A',
                      satellite.temperature?.toFixed(1) || 'N/A',
                      satellite.communication?.signalStrength?.toFixed(1) || 'N/A',
                      satellite.health?.toFixed(1) || 'N/A',
                      satellite.isAnomaly ? 'YES' : 'NO',
                      satellite.aiAnomalyScore?.toFixed(4) || '0.0000'
                    ].join(','));
                  });
                }
                
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nova_30min_history_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-cyan text-sm rounded-lg hover:bg-accent-blue/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              30-Min History (Excel)
            </button>
            <button 
              onClick={async () => {
                const { generateAIRiskPDF } = await import('../utils/pdfGenerator.js');
                await generateAIRiskPDF(satellites, metrics);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-cyan text-sm rounded-lg hover:bg-accent-blue/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              AI Risk Report (PDF)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Metric</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Current</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Previous</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Change</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Data Throughput', current: `${metrics.dataThroughput} Gbps`, previous: '680 Gbps', change: '+12%', status: 'good' },
                { name: 'System Load', current: `${metrics.systemLoad}%`, previous: '62%', change: '+5%', status: 'good' },
                { name: 'Average Health', current: `${avgHealth}%`, previous: '97.2%', change: '-0.5%', status: 'warning' },
                { name: 'Collision Checks', current: '1,247/s', previous: '1,189/s', change: '+5%', status: 'good' },
                { name: 'Network Latency', current: '23ms', previous: '25ms', change: '-8%', status: 'excellent' },
                { name: 'Storage Usage', current: '78%', previous: '72%', change: '+6%', status: 'warning' },
              ].map((metric, index) => (
                <motion.tr
                  key={metric.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-4 px-4 text-white font-medium">{metric.name}</td>
                  <td className="py-4 px-4">
                    <span className="font-mono">{metric.current}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-gray-500">{metric.previous}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-mono ${
                      metric.change.startsWith('+') ? 'text-accent-green' : 'text-red-400'
                    }`}>
                      {metric.change}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      metric.status === 'excellent' ? 'bg-accent-green/20 text-accent-green' :
                      metric.status === 'good' ? 'bg-accent-cyan/20 text-accent-cyan' :
                      metric.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {metric.status.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default Analytics
