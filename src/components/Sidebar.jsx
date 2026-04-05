import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Rocket, Satellite, BarChart3, AlertTriangle, Orbit
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', icon: Activity, label: 'Dashboard', badge: null },
  { id: 'missions', icon: Rocket, label: 'Missions', badge: null },
  { id: 'fleet', icon: Satellite, label: 'Fleet', badge: null },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: null },
  { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: 0 },
  { id: 'traffic', icon: Orbit, label: 'Space Traffic', badge: null },
]

function Sidebar({ activeSection, setActiveSection, metrics }) {
  const handleNavigation = (itemId) => {
    setActiveSection(itemId)
    // Update URL hash for bookmarking
    window.history.pushState(null, '', `#${itemId}`)
  }

  // Listen for navigation events from header
  useEffect(() => {
    const handleNavigate = (e) => {
      setActiveSection(e.detail)
    }
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [setActiveSection])

  // Handle hash changes on load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && ['dashboard', 'missions', 'fleet', 'analytics', 'alerts', 'traffic'].includes(hash)) {
      setActiveSection(hash)
    }
  }, [setActiveSection])

  return (
    <aside className="fixed left-0 top-16 md:top-20 bottom-0 w-16 md:w-20 z-40 hidden md:flex flex-col items-center py-6 space-y-3 bg-space-black/90 backdrop-blur-xl border-r border-white/10">
      {navItems.map((item, index) => (
        <motion.button
          key={item.id}
          onClick={() => handleNavigation(item.id)}
          className="relative group"
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
              activeSection === item.id
                ? 'bg-white text-space-black shadow-lg shadow-white/20'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />

            {/* Badge */}
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center shadow-sm">
                {item.badge}
              </span>
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-3 py-2 bg-space-gray border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            <span className="text-xs text-gray-300">{item.label}</span>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l border-b border-white/10 bg-space-gray rounded-tl-lg -translate-x-1/2" />
          </div>

          {/* Active indicator */}
          {activeSection === item.id && (
            <motion.div
              layoutId="sidebar-indicator"
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}

      {/* Bottom spacer for metrics display */}
      <div className="flex-1" />

      {/* Live metrics indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-3 pt-4 border-t border-white/10 pb-4"
      >
        <div className="text-center">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Active</p>
          <p className="text-sm font-mono font-semibold text-accent-cyan">
            {metrics?.activeSatellites || 0}
          </p>
        </div>
        <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
      </motion.div>
    </aside>
  )
}

export default Sidebar
