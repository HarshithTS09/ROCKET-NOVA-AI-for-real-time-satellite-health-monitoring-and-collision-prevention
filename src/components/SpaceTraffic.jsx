import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Globe2, Satellite as SatelliteIcon, Layers, X, Zap } from 'lucide-react'
import UltraRealisticEarth from './UltraRealisticEarth'

const ORBIT_CATEGORIES = {
  LEO: { name: 'Low Earth Orbit', min: 160, max: 2000, color: '#00ff88' },
  MEO: { name: 'Medium Earth Orbit', min: 2000, max: 35786, color: '#00aaff' },
  GEO: { name: 'Geostationary', min: 35786, max: 35786, color: '#ff00ff' }
}

function SpaceTraffic({ satellites = [] }) {
  const [showOrbits, setShowOrbits] = useState({ LEO: true, MEO: true, GEO: true })
  const [trafficStats, setTrafficStats] = useState({ LEO: 0, MEO: 0, GEO: 0, total: 0 })
  const [selectedSat, setSelectedSat] = useState(null)
  const [tracingSat, setTracingSat] = useState(null)
  const [traceAngle, setTraceAngle] = useState(0)
  const animationRef = useRef(null)

  // Generate satellite data
  const satData = (satellites && satellites.length > 0) 
    ? satellites.slice(0, 150).map((sat, idx) => {
        let category = 'LEO'
        const alt = sat.orbital?.altitude || sat.altitude || sat.position?.alt || 500
        if (alt > 35780) category = 'GEO'
        else if (alt > 2000) category = 'MEO'
        
        return {
          id: sat.id || `sat-${idx}`,
          name: sat.name || `Satellite ${idx + 1}`,
          category,
          altitude: alt,
          lat: sat.position?.lat ?? sat.lat ?? ((Math.random() - 0.5) * 140),
          lng: sat.position?.lng ?? sat.lng ?? ((Math.random() - 0.5) * 360),
          inclination: sat.orbital?.inclination || 45 + Math.random() * 45,
          raan: Math.random() * 360,
          speed: category === 'GEO' ? 0.1 : category === 'MEO' ? 0.3 : 0.8
        }
      })
    : Array.from({ length: 150 }, (_, i) => {
        const cats = ['LEO', 'MEO', 'GEO']
        const cat = cats[i % 3]
        const alt = cat === 'GEO' ? 35786 : cat === 'MEO' ? 20000 : 400 + Math.random() * 600
        return {
          id: `sat-${i + 1}`,
          name: `Satellite ${i + 1}`,
          category: cat,
          altitude: alt,
          lat: (Math.random() - 0.5) * 140,
          lng: (Math.random() - 0.5) * 360,
          inclination: 30 + Math.random() * 60,
          raan: Math.random() * 360,
          speed: cat === 'GEO' ? 0.1 : cat === 'MEO' ? 0.3 : 0.8
        }
      })

  useEffect(() => {
    const stats = { LEO: 0, MEO: 0, GEO: 0, total: satData.length }
    satData.forEach(sat => {
      if (stats[sat.category] !== undefined) {
        stats[sat.category]++
      }
    })
    setTrafficStats(stats)
  }, [])

  // Animation for tracing satellite
  useEffect(() => {
    if (tracingSat) {
      const animate = () => {
        setTraceAngle(prev => (prev + tracingSat.speed) % 360)
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      setTraceAngle(0)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [tracingSat])

  const toggleOrbit = (category) => {
    setShowOrbits(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const getPosition = (lat, lng) => {
    return {
      x: ((lng + 180) / 360) * 100,
      y: ((90 - lat) / 180) * 100
    }
  }

  // Calculate traced satellite position based on angle
  const getTracedPosition = (sat, angle) => {
    const orbitRadius = sat.altitude / 500  // Scale altitude
    const rad = (angle * Math.PI) / 180
    const baseLat = Math.sin(rad) * 70 * (sat.inclination / 90)
    const baseLng = (angle + sat.raan) % 360
    return getPosition(baseLat, baseLng)
  }

  const handleSatClick = (sat) => {
    setSelectedSat(sat)
    setTracingSat(sat)
  }

  const closeTrace = () => {
    setTracingSat(null)
    setSelectedSat(null)
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-accent-cyan" />
            <div>
              <h1 className="text-lg font-bold text-white">Space Traffic</h1>
              <p className="text-gray-400 text-xs">{satData.length} satellites</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{trafficStats.LEO}</p>
              <p className="text-xs text-gray-500">LEO</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{trafficStats.MEO}</p>
              <p className="text-xs text-gray-500">MEO</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">{trafficStats.GEO}</p>
              <p className="text-xs text-gray-500">GEO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 w-full h-full">
        {/* Earth - Properly Sized */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-w-[800px] max-h-[800px] flex items-center justify-center">
            <UltraRealisticEarth />
          </div>
        </div>

        {/* Orbit Rings - Visible when orbit toggle is on */}
        {tracingSat && showOrbits[tracingSat.category] && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="rounded-full border border-dashed"
              style={{
                width: '35%',
                height: '35%',
                borderColor: ORBIT_CATEGORIES[tracingSat.category]?.color || '#00ff88',
                opacity: 0.5,
                transform: `rotateX(75deg) rotateZ(${tracingSat.raan}deg)`
              }}
            />
          </div>
        )}

        {/* Satellite Dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {satData.map((sat, i) => {
            const pos = tracingSat?.id === sat.id 
              ? getTracedPosition(sat, traceAngle)
              : getPosition(sat.lat, sat.lng)
            const color = ORBIT_CATEGORIES[sat.category]?.color || '#00ff88'
            const isTracing = tracingSat?.id === sat.id
            
            if (pos.x < -5 || pos.x > 105 || pos.y < -5 || pos.y > 105) return null
            
            return (
              <motion.div
                key={sat.id}
                className={`absolute rounded-full cursor-pointer pointer-events-auto transition-all ${
                  isTracing ? 'w-3 h-3 z-30' : 'w-1 h-1 hover:w-2 hover:h-2'
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  backgroundColor: color,
                  boxShadow: isTracing ? `0 0 15px ${color}, 0 0 30px ${color}` : `0 0 4px ${color}`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleSatClick(sat)}
              />
            )
          })}
        </div>

        {/* Selected/Tracing Satellite Panel */}
        <AnimatePresence>
          {selectedSat && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-16 right-4 bg-space-gray/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-52 z-30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-white text-sm font-semibold truncate">{selectedSat.name}</span>
                </div>
                <button onClick={closeTrace} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Orbit</span>
                  <span 
                    className="font-semibold"
                    style={{ color: ORBIT_CATEGORIES[selectedSat.category]?.color }}
                  >
                    {selectedSat.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Altitude</span>
                  <span className="text-white">{selectedSat.altitude?.toFixed(0)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-white">{selectedSat.speed?.toFixed(1)} km/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inclination</span>
                  <span className="text-white">{selectedSat.inclination?.toFixed(1)}°</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-xs text-accent-cyan flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Tracking in real-time
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Panel - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-space-gray/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-48 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-accent-cyan" />
          <span className="text-white text-sm">Orbits</span>
        </div>
        
        <div className="space-y-1">
          {Object.entries(ORBIT_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => toggleOrbit(key)}
              className="w-full flex items-center justify-between p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-white">{key}</span>
              </div>
              {showOrbits[key] ? (
                <Eye className="w-3 h-3 text-accent-cyan" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Panel - Bottom Right */}
      <div className="absolute bottom-4 right-4 bg-space-gray/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-40 z-20">
        <div className="flex items-center gap-2 mb-2">
          <SatelliteIcon className="w-4 h-4 text-accent-cyan" />
          <span className="text-white text-sm">Count</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-400">LEO</span>
            </div>
            <span className="text-white font-mono">{trafficStats.LEO}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-400">MEO</span>
            </div>
            <span className="text-white font-mono">{trafficStats.MEO}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-400">GEO</span>
            </div>
            <span className="text-white font-mono">{trafficStats.GEO}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10">
        <p className="text-gray-500 text-xs">
          Click satellite to track • {tracingSat ? 'Orbiting...' : 'Static view'}
        </p>
      </div>
    </div>
  )
}

export default SpaceTraffic