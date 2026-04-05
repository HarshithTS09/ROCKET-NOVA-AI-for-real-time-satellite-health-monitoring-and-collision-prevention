import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, MapPin, Wifi, Shield, Activity, ChevronRight, X } from 'lucide-react'
import TelemetryMonitor from './TelemetryMonitor'

function SatelliteFleet({ satellites, selectedSatellite, onSelectSatellite }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [agency, setAgency] = useState('all')
  const [sortBy, setSortBy] = useState('id')

  const filteredSatellites = satellites
    .filter(sat => {
      const matchesSearch = sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sat.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filter === 'all' || sat.type === filter
      const matchesAgency = agency === 'all' || sat.agency === agency
      return matchesSearch && matchesType && matchesAgency
    })
    .sort((a, b) => {
      if (sortBy === 'health') return b.health - a.health
      if (sortBy === 'altitude') return b.orbital.altitude - a.orbital.altitude
      return a.id.localeCompare(b.id)
    })

  const types = ['all', 'comm', 'gps', 'earth', 'science', 'starlink']
  const statuses = ['all', 'active', 'warning', 'critical']
  const agencies = ['all', 'NASA', 'SPACEX', 'ESA', 'ISRO', 'OTHER']

  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div>
        <p className="section-subtitle">Fleet Management</p>
        <h2 className="section-heading">Satellite Fleet</h2>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-accent-cyan transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 min-w-[140px] focus:outline-none focus:border-accent-cyan"
          >
            <option value="all">All Types</option>
            {types.slice(1).map(t => (
              <option key={t} value={t} className="text-space-black">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <select
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 min-w-[140px] focus:outline-none focus:border-accent-cyan"
          >
            <option value="all">All Agencies</option>
            {agencies.slice(1).map(a => (
              <option key={a} value={a} className="text-space-black">{a}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 min-w-[140px] focus:outline-none focus:border-accent-cyan"
          >
            <option value="id">Sort by ID</option>
            <option value="health">Sort by Health</option>
            <option value="altitude">Sort by Altitude</option>
          </select>
        </div>
      </div>

      {/* Satellite Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSatellites.map((sat, index) => (
          <motion.div
            key={sat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`card cursor-pointer transition-all duration-300 ${
              selectedSatellite?.id === sat.id
                ? 'ring-2 ring-accent-cyan bg-white/10'
                : 'hover:bg-white/10'
            }`}
            onClick={() => onSelectSatellite(sat)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent-cyan" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{sat.name}</h4>
                  <p className="text-xs font-mono text-gray-500">{sat.id}</p>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 text-[8px] font-mono uppercase rounded ${
                    sat.agency === 'NASA' ? 'bg-blue-500/20 text-blue-400' :
                    sat.agency === 'SPACEX' ? 'bg-purple-500/20 text-purple-400' :
                    sat.agency === 'ESA' ? 'bg-cyan-500/20 text-cyan-400' :
                    sat.agency === 'ISRO' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {sat.agency}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] font-mono uppercase rounded-full ${
                sat.status === 'active' ? 'bg-accent-green/20 text-accent-green' :
                sat.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-400'
              }`}>
                {sat.status}
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Position
                </span>
                <span className="font-mono text-white">{parseFloat(sat.position.lat).toFixed(2)}°N, {parseFloat(sat.position.lng).toFixed(2)}°W</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Speed
                </span>
                <span className="font-mono text-accent-blue">{sat.speed.toFixed(3)} km/s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Health
                </span>
                <span className={`font-mono ${
                  sat.health > 95 ? 'text-accent-green' :
                  sat.health > 85 ? 'text-accent-cyan' :
                  'text-yellow-500'
                }`}>
                  {sat.health.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Altitude</span>
                <span className="font-mono text-accent-cyan">{sat.orbital.altitude.toFixed(0)} km</span>
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>System Health</span>
                <span>{sat.health.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-space-gray rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sat.health}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    sat.health > 95 ? 'bg-accent-green' :
                    sat.health > 85 ? 'bg-accent-cyan' :
                    'bg-yellow-500'
                  }`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-xs text-gray-500">
                <span className="uppercase">{sat.type}</span>
                <span className="mx-2">•</span>
                <span>{sat.missions} missions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-accent-cyan transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSatellites.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No satellites found</p>
          <button
            onClick={() => { setSearchTerm(''); setFilter('all'); }}
            className="mt-4 text-accent-cyan hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Selected Satellite Detail Modal */}
      <AnimatePresence>
        {selectedSatellite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-space-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => onSelectSatellite(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TelemetryMonitor satellite={selectedSatellite} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SatelliteFleet
