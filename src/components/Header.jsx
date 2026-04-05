import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Activity, Bell, Search, Wifi, Power } from 'lucide-react'

function Header({ metrics, alertCount }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState('connected')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => prev === 'connected' ? 'connected' : 'connected')
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-accent-green'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-space-black/95 backdrop-blur-md border-b border-white/10 shadow-lg' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a 
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('navigate', { detail: 'home' }));
              window.history.pushState(null, '', '#home');
            }}
            className="flex items-center gap-3 group"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#ccfbed] flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#111111]" strokeWidth={2.5} />
              </div>
            </motion.div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight font-sans">
                ROCKET NOVA
              </h1>
              <p className="text-[11px] text-gray-500 tracking-wider font-medium">SPACE SYSTEMS</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'missions', label: 'Missions' },
              { id: 'fleet', label: 'Fleet' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'alerts', label: 'Alerts' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const event = new CustomEvent('navigate', { detail: item.id })
                  window.dispatchEvent(event)
                  // Also update hash for direct linking
                  window.history.pushState(null, '', `#${item.id}`)
                }}
                className="px-5 py-2 text-sm text-gray-400 hover:text-white transition-all rounded-lg hover:bg-white/5 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white transition-all group-hover:w-8" />
              </button>
            ))}
          </nav>

          {/* Status & Actions */}
          <div className="hidden md:flex items-center gap-6">
            {/* System Time */}
            <div className="hidden lg:block text-right">
              <p className="text-xs text-gray-500 mb-1">{formatDate(currentTime)}</p>
              <p className="text-sm font-mono text-white">{formatTime(currentTime)}</p>
            </div>

            {/* Alert Counter */}
            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
              {alertCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center shadow-lg"
                >
                  {alertCount > 9 ? '9+' : alertCount}
                </motion.span>
              )}
            </button>

            {/* Quick Stats */}
            <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase mb-0.5">Load</p>
                <p className="text-sm font-mono font-medium text-accent-cyan">{metrics?.systemLoad || 0}%</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase mb-0.5">Uptime</p>
                <p className="text-sm font-mono font-medium text-accent-green">{metrics?.uptime || 0}%</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className={`w-2 h-2 rounded-full ${getConnectionColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-gray-400 hidden sm:inline">
                {connectionStatus === 'connected' ? 'CONNECTED' : connectionStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 hover:bg-white/5 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-space-black/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-6 py-4 space-y-2">
              {['dashboard', 'missions', 'fleet', 'analytics', 'alerts'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: item }))
                    window.history.pushState(null, '', `#${item}`)
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg capitalize transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
