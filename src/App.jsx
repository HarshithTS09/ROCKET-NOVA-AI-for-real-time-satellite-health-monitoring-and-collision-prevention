import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import HeroSection from './components/HeroSection'
import Dashboard from './components/Dashboard'
import MissionControl from './components/MissionControl'
import SatelliteFleet from './components/SatelliteFleet'
import Missions from './components/Missions'
import AlertsHub from './components/AlertsHub'
import Analytics from './components/Analytics'
import SpaceTraffic from './components/SpaceTraffic'
import StarsBackground from './components/StarsBackground'
import { useTelemetry } from './hooks/useTelemetry'
import { useCollisionDetection } from './hooks/useCollisionDetection'

const debug = (...args) => {
  console.log('[APP]', ...args)
}

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [selectedSatellite, setSelectedSatellite] = useState(null)

  const telemetry = useTelemetry()
  const collisionData = useCollisionDetection(telemetry.satellites || [])

  useEffect(() => {
    const handleNavigate = (e) => {
      setActiveSection(e.detail)
    }
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setActiveSection(hash)
      }
    }
    window.addEventListener('navigate', handleNavigate)
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => {
      window.removeEventListener('navigate', handleNavigate)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const handleSectionChange = (section) => {
    setActiveSection(section)
    window.history.pushState(null, '', `#${section}`)
  }

  const [loadProgress, setLoadProgress] = useState(0)

  if (telemetry.isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-space-gray/30 via-black to-black" />
        
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: Math.random() * 0.8 + 0.2
              }}
            />
          ))}
        </div>

        <div className="text-center z-10 relative">
          {/* Animated logo/icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ 
                rotateY: [0, 360],
                rotateX: [0, 20]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="2" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="2" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(0,212,255,0.7)" strokeWidth="2" />
                <circle cx="50" cy="50" r="15" fill="rgba(0,212,255,0.8)" />
                <circle cx="50" cy="50" r="8" fill="#fff" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Loading text with typewriter effect */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-light text-white tracking-[0.3em] mb-2"
          >
            ROCKET NOVA
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-accent-cyan text-sm tracking-widest mb-8"
          >
            MISSION CONTROL
          </motion.p>

          {/* Progress bar */}
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-64 mx-auto mb-6"
          >
            <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-cyan to-accent-green rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2.5, 
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            </div>
          </motion.div>

          {/* Loading status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center justify-center gap-3"
          >
            <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
            <p className="text-gray-500 text-xs tracking-wider">
              ESTABLISHING UPLINK...
            </p>
          </motion.div>

          {/* Loading details */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.8 }}
            className="text-gray-600 text-xs mt-6 font-mono"
          >
            {telemetry.connectionStatus === 'connecting' 
              ? 'Connecting to ground stations...' 
              : 'Fetching satellite telemetry...'}
          </motion.p>
        </div>

        {/* Orbital rings decoration */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-96 h-96 border border-white/5 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 border border-white/5 rounded-full"
        />
      </div>
    )
  }

  const safeSatellites = telemetry.satellites || []
  const safeAlerts = telemetry.alerts || []
  const safeMetrics = telemetry.metrics || {
    totalSatellites: 0,
    activeSatellites: 0,
    systemLoad: 0,
    uptime: 0,
    dataThroughput: 0,
    averageHealth: 0
  }

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <StarsBackground />

      <Header
        metrics={safeMetrics}
        alertCount={safeAlerts.filter(a => !a.read).length}
      />

      <div className="flex relative z-10 w-full h-screen">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          metrics={safeMetrics}
        />

        <main className="flex-1 md:ml-20 pt-20 h-full overflow-y-auto hidden-scrollbar">
          
          {activeSection === 'home' && (
             <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-32">
                <HeroSection metrics={safeMetrics} satellites={safeSatellites} />
             </div>
          )}

          {activeSection !== 'home' && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={activeSection === 'dashboard' ? 'px-6 pb-6 h-full' : 'max-w-7xl mx-auto px-6 md:px-8 py-12 space-y-32'}
              >
                {activeSection === 'dashboard' && (
                  <MissionControl
                    satellites={safeSatellites}
                    alerts={safeAlerts}
                    metrics={safeMetrics}
                    collisionRisks={collisionData.collisionRisks || []}
                  />
                )}
                {activeSection === 'missions' && (
                  <Missions 
                    satellites={safeSatellites} 
                    missions={telemetry.missions}
                  />
                )}
                {activeSection === 'fleet' && (
                  <SatelliteFleet
                    satellites={safeSatellites}
                    selectedSatellite={selectedSatellite}
                    onSelectSatellite={setSelectedSatellite}
                  />
                )}
                {activeSection === 'analytics' && (
                  <Analytics
                    satellites={safeSatellites}
                    metrics={safeMetrics}
                    collisionRisks={collisionData.collisionRisks || []}
                  />
                )}
                {activeSection === 'alerts' && (
                  <AlertsHub 
                    alerts={safeAlerts} 
                    telemetryHistory={telemetry.telemetryHistory || []}
                  />
                )}
                {activeSection === 'traffic' && (
                  <SpaceTraffic satellites={safeSatellites} />
                )}
              </motion.div>
            </AnimatePresence>
          )}


        </main>
      </div>
    </div>
  )
}

export default App
