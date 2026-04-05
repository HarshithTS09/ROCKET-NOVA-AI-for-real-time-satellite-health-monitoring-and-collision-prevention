import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity, Battery, Wifi, Thermometer, Gauge, Zap, Shield, Target, Download } from 'lucide-react'
import { generateSatellitePDF } from '../utils/pdfGenerator'

function TelemetryMonitor({ satellite }) {
  const [batteryHistory, setBatteryHistory] = useState([])
  const [signalHistory, setSignalHistory] = useState([])
  const [temperatureHistory, setTemperatureHistory] = useState([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Generate realistic historical data for the selected satellite
  useEffect(() => {
    if (!satellite) return

    // Generate 20 data points with realistic variations
    const batteryData = []
    const signalData = []
    const tempData = []

    const baseBattery = satellite.battery
    const baseSignal = satellite.communication?.signalStrength || 90
    const baseTemp = satellite.temperature

    for (let i = 0; i < 20; i++) {
      batteryData.push(Math.max(60, Math.min(100, baseBattery + (Math.random() - 0.5) * 5)))
      signalData.push(Math.max(50, Math.min(100, baseSignal + (Math.random() - 0.5) * 10)))
      tempData.push(Math.max(-10, Math.min(50, baseTemp + (Math.random() - 0.5) * 5)))
    }

    setBatteryHistory(batteryData)
    setSignalHistory(signalData)
    setTemperatureHistory(tempData)
  }, [satellite])

  const renderLineChart = (data, color = 'rgba(0, 255, 136, 1)', max = 100, min = 0, chartName = "line", unit = "%") => {
    if (!data || data.length === 0) return null

    const width = 1000
    const height = 300
    const padding = 70
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const pointsArray = data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((val - min) / (max - min)) * chartHeight,
      val
    }))

    const makeSmoothCurve = (points, tension = 0.3) => {
      let d = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? i + 1 : i + 2];
        
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;
        
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return d;
    }

    const smoothPath = makeSmoothCurve(pointsArray);
    const areaPath = `${smoothPath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    const gradientId = `grad-${chartName.replace(/\s+/g, '-')}`
    const glowId = `glow-${chartName.replace(/\s+/g, '-')}`
    const lineGlowId = `lineGlow-${chartName.replace(/\s+/g, '-')}`

    const gridSteps = max === 40 && min === -10 ? 5 : 4
    const step = (max - min) / gridSteps

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="40%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id={lineGlowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background grid with enhanced styling */}
        <g>
          {[...Array(gridSteps + 1)].map((_, idx) => {
            const val = min + step * idx
            const y = padding + chartHeight - (idx / gridSteps) * chartHeight
            return (
              <g key={`h-${idx}`}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x={padding - 18} y={y + 5} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace" fontWeight="600">
                  {val.toFixed(0)}{unit}
                </text>
              </g>
            )
          })}
          {pointsArray.filter((_, i) => i % 4 === 0).map((p, i) => (
            <line key={`v-${i}`} x1={p.x} y1={padding} x2={p.x} y2={height - padding} stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 6" />
          ))}
        </g>

        {/* Axis labels */}
        <text x={width - padding + 20} y={padding + 10} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">NOW</text>
        <text x={padding} y={height - padding + 25} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">20 readings ago</text>
        <text x={width - padding} y={height - padding + 25} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace" textAnchor="end">now</text>

        {/* Data Area Fill */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          d={areaPath}
          fill={`url(#${gradientId})`}
        />

        {/* Outer Glow Line */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />

        {/* Middle Glow Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          filter={`url(#${lineGlowId})`}
        />

        {/* Core Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={smoothPath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Data points */}
        {pointsArray.map((p, i) => {
          const isLatest = i === pointsArray.length - 1
          return (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="30" fill="transparent" />
              {isLatest && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill={color}
                  opacity="0.3"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0.15, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={isLatest ? 6 : 3}
                fill="#ffffff"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.03 }}
              />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={isLatest ? 3 : 1.5}
                fill={color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.03 + 0.1 }}
              />
              <text x={p.x} y={p.y - 22} textAnchor="middle" fill="white" fontSize="12" fontWeight="700" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg pointer-events-none">
                {p.val.toFixed(1)}{unit}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  const renderBarChart = (data, color = 'rgba(0, 212, 255, 1)', chartName = "bar", unit = "%") => {
    if (!data || data.length === 0) return null

    const width = 1000
    const height = 300
    const padding = 70
    const barSpacing = Math.max(4, (width - padding * 2) / data.length * 0.3);
    const barWidth = ((width - padding * 2) / data.length) - barSpacing;
    const max = 100
    const min = 0

    const gradId = `grad-${chartName.replace(/\s+/g, '-')}`;
    const glowId = `glow-${chartName.replace(/\s+/g, '-')}`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="50%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`barGrad-${chartName}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Enhanced grid */}
        {[0, 25, 50, 75, 100].map(p => {
          const y = padding + (height - padding * 2) - (p / 100) * (height - padding * 2)
          return (
            <g key={`h-${p}`}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x={padding - 18} y={y + 5} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace" fontWeight="600">
                {p}{unit}
              </text>
            </g>
          )
        })}

        {/* Axis labels */}
        <text x={padding} y={height - padding + 25} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">20 readings ago</text>
        <text x={width - padding} y={height - padding + 25} fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace" textAnchor="end">now</text>

        {/* Base axis */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />

        {data.map((val, i) => {
          const barHeight = ((val - min) / (max - min || 1)) * (height - padding * 2)
          const x = padding + (i * (barWidth + barSpacing)) + (barSpacing/2)
          const y = height - padding - barHeight
          const isLatest = i === data.length - 1;

          return (
            <g key={i} className="group cursor-pointer">
              <rect x={x - barSpacing/2} y={padding} width={barWidth + barSpacing} height={height - padding * 2} fill="transparent" />

              {isLatest && (
                <motion.rect
                  x={x - 4}
                  y={y - 4}
                  width={barWidth + 8}
                  height={barHeight + 8}
                  rx="8"
                  fill={color}
                  opacity="0.25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  filter={`url(#${glowId})`}
                />
              )}

              {/* Main Bar */}
              <motion.rect
                x={x}
                width={barWidth}
                rx="6"
                fill={`url(#${gradId})`}
                initial={{ y: height - padding, height: 0, opacity: 0 }}
                animate={{ y: y, height: barHeight, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8, ease: "easeOut", delay: i * 0.03 }}
                className="group-hover:brightness-125 transition-all duration-300 origin-bottom"
              />

              {/* Top Highlight */}
              <motion.rect
                x={x + 2}
                width={barWidth - 4}
                height="6"
                rx="3"
                fill={`url(#barGrad-${chartName})`}
                initial={{ y: height - padding, opacity: 0 }}
                animate={{ y: y + 2, opacity: isLatest ? 0.8 : 0.4 }}
                transition={{ type: "spring", duration: 0.8, ease: "easeOut", delay: i * 0.03 }}
                className="group-hover:opacity-100 transition-opacity duration-300"
              />

              {/* Glow overlay for latest */}
              {isLatest && (
                <motion.rect
                  x={x}
                  width={barWidth}
                  rx="6"
                  fill={color}
                  opacity="0.3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <text
                x={x + barWidth / 2}
                y={y - 18}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="700"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 drop-shadow-lg pointer-events-none"
              >
                {val.toFixed(1)}{unit}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  if (!satellite) {
    return (
      <div className="glass p-8 text-center">
        <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Select a satellite to view detailed telemetry</p>
      </div>
    )
  }

  const currentBattery = batteryHistory[batteryHistory.length - 1] || satellite.battery
  const currentSignal = signalHistory[signalHistory.length - 1] || satellite.communication?.signalStrength || 90
  const currentTemp = temperatureHistory[temperatureHistory.length - 1] || satellite.temperature

  const handleDownloadPDF = async () => {
    if (!satellite || isGeneratingPDF) return

    setIsGeneratingPDF(true)

    try {
      if (batteryHistory.length === 0 || signalHistory.length === 0 || temperatureHistory.length === 0) {
        alert('Please wait for telemetry data to load')
        setIsGeneratingPDF(false)
        return
      }

      setTimeout(async () => {
        try {
          await generateSatellitePDF(satellite, batteryHistory, signalHistory, temperatureHistory)
        } catch (err) {
          console.error('PDF generation error:', err)
        } finally {
          setIsGeneratingPDF(false)
        }
      }, 100)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white tracking-tight">{satellite.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-500 font-mono tracking-widest">{satellite.id} • {satellite.type.toUpperCase()}</p>
            <span className={`px-1.5 py-0.5 text-[8px] font-mono uppercase rounded ${
              satellite.agency === 'NASA' ? 'bg-blue-500/20 text-blue-400' :
              satellite.agency === 'SPACEX' ? 'bg-purple-500/20 text-purple-400' :
              satellite.agency === 'ESA' ? 'bg-cyan-500/20 text-cyan-400' :
              satellite.agency === 'ISRO' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {satellite.agency}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              satellite.status === 'active' ? 'bg-accent-green/20 text-accent-green' :
              satellite.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-red-500/20 text-red-400'
            }`}>
              {satellite.status}
            </div>
            <div className={`w-2 h-2 rounded-full ${satellite.status === 'active' ? 'bg-accent-green shadow-[0_0_8px_#4ade80]' : 'bg-yellow-500 shadow-[0_0_8px_#facc15]'} animate-pulse`} />
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group ${
              isGeneratingPDF 
                ? 'bg-white/5 cursor-not-allowed' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Download satellite report as PDF"
          >
            {isGeneratingPDF ? (
              <svg className="w-4 h-4 text-accent-cyan animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Download className="w-4 h-4 text-accent-cyan group-hover:text-white" />
            )}
            <span className="text-xs text-gray-300 group-hover:text-white font-medium">
              {isGeneratingPDF ? 'Generating...' : 'Download Report'}
            </span>
          </button>
        </div>
      </div>

      {/* Current values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-accent-green" />
            <span className="text-xs text-gray-500 uppercase">Battery</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{currentBattery.toFixed(1)}%</p>
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentBattery}%` }}
              className={`h-full ${currentBattery > 80 ? 'bg-accent-green' : currentBattery > 50 ? 'bg-accent-cyan' : 'bg-yellow-500'}`}
            />
          </div>
        </div>

        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs text-gray-500 uppercase">Signal</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{currentSignal.toFixed(1)}%</p>
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentSignal}%` }}
              className="h-full bg-accent-cyan"
            />
          </div>
        </div>

        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-accent-orange" />
            <span className="text-xs text-gray-500 uppercase">Temperature</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{currentTemp.toFixed(1)}°C</p>
          <p className="text-xs text-gray-500 mt-1">{(currentTemp * 9/5 + 32).toFixed(1)}°F</p>
        </div>

        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-accent-blue" />
            <span className="text-xs text-gray-500 uppercase">Velocity</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{satellite.speed.toFixed(3)}</p>
          <p className="text-xs text-gray-500 mt-1">km/s</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {/* Battery graph */}
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-accent-green uppercase tracking-wider">Battery Level History</h4>
            <span className="text-xs text-gray-500">Last 20 readings (2s intervals)</span>
          </div>
          <div className="h-56">
            {renderLineChart(batteryHistory, 'rgba(0, 255, 136, 0.9)', 100, 60, "battery", "%")}
          </div>
        </div>

        {/* Signal strength graph */}
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-accent-cyan uppercase tracking-wider">Signal Strength History</h4>
            <span className="text-xs text-gray-500">Last 20 readings</span>
          </div>
          <div className="h-56">
            {renderBarChart(signalHistory, 'rgba(0, 212, 255, 0.9)', "signal", "%")}
          </div>
        </div>

        {/* Temperature graph */}
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-accent-orange uppercase tracking-wider">Temperature History</h4>
            <span className="text-xs text-gray-500">Last 20 readings</span>
          </div>
          <div className="h-56">
            {renderLineChart(temperatureHistory, 'rgba(255, 107, 0, 0.9)', 40, -10, "temperature", "°C")}
          </div>
        </div>

        {/* Health metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 uppercase">Fuel</span>
              <span className="text-sm font-mono text-white">{satellite.fuel?.toFixed(1) || 85}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${satellite.fuel || 85}%` }}
                className="h-full bg-accent-blue"
              />
            </div>
          </div>

          <div className="glass p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 uppercase">System Health</span>
              <span className={`text-sm font-mono ${satellite.health > 90 ? 'text-accent-green' : satellite.health > 80 ? 'text-accent-cyan' : 'text-yellow-500'}`}>
                {satellite.health?.toFixed(1) || 95}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${satellite.health || 95}%` }}
                className={`h-full ${satellite.health > 90 ? 'bg-accent-green' : satellite.health > 80 ? 'bg-accent-cyan' : 'bg-yellow-500'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TelemetryMonitor
