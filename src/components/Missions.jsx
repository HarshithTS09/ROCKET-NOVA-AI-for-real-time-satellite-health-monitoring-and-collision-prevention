import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Rocket, MapPin, Target, ChevronRight, Plus } from 'lucide-react'

const upcomingLaunches = [
  {
    id: 'NOVA-48',
    mission: 'Nova-48',
    rocket: 'Falcon 9',
    payload: 'Starlink v2 Mini × 22',
    orbit: 'LEO',
    window: '2026-04-15T14:30:00Z',
    status: 'go',
    location: 'CCSFS SLC-40',
    probability: 90
  },
  {
    id: 'NOVA-49',
    mission: 'Nova-49',
    rocket: 'Falcon Heavy',
    payload: 'USDSP-71',
    orbit: 'GTO',
    window: '2026-04-22T18:00:00Z',
    status: 'countdown',
    location: 'KSC LC-39A',
    probability: 85
  },
  {
    id: 'NOVA-50',
    mission: 'Nova-50',
    rocket: 'Starship',
    payload: 'Starship Orbital Test-5',
    orbit: 'LEO',
    window: '2026-05-01T12:00:00Z',
    status: 'testing',
    location: 'Starbase, TX',
    probability: 60
  },
  {
    id: 'NOVA-51',
    mission: 'Nova-51',
    rocket: 'Falcon 9',
    payload: 'NovaSat-12',
    orbit: 'SSO',
    window: '2026-05-08T09:15:00Z',
    status: 'ready',
    location: 'VAFB SLC-4E',
    probability: 95
  }
]

const recentMissions = [
  {
    id: 'NOVA-47',
    mission: 'Nova-47',
    rocket: 'Falcon 9',
    payload: 'Starlink v2 Mini × 21',
    orbit: 'LEO',
    launched: '2026-03-25T14:22:00Z',
    landed: true,
    location: 'CCSFS SLC-40'
  },
  {
    id: 'NOVA-46',
    mission: 'Nova-46',
    rocket: 'Falcon 9',
    payload: 'Sentinel-6 Michael Freilich',
    orbit: 'LEO',
    launched: '2026-03-18T07:45:00Z',
    landed: true,
    location: 'VAFB SLC-4E'
  }
]

function Missions({ satellites = [], missions = [] }) {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showNewMission, setShowNewMission] = useState(false)

  // Use backend missions if available
  const displayMissions = missions.length > 0 ? missions.map(m => ({
    id: m.id?.toString() || m.satelliteId,
    mission: m.name,
    satellite: m.satelliteName || m.satelliteId,
    description: m.description,
    orbit: 'LEO',
    window: m.startDate || new Date().toISOString(),
    endDate: m.endDate,
    status: m.status === 'active' ? 'go' : m.status === 'planned' ? 'ready' : 'testing',
    location: 'Mission Control',
    probability: m.status === 'active' ? 95 : 80
  })) : []

  const upcomingLaunches = displayMissions.filter(m => m.status === 'go' || m.status === 'ready' || m.status === 'countdown')
  const recentMissionsList = displayMissions.filter(m => m.status === 'completed' || m.status === 'ended')

  const getStatusColor = (status) => {
    switch (status) {
      case 'go': return 'bg-accent-green/20 text-accent-green border-accent-green/30'
      case 'countdown': return 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'
      case 'testing': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'ready': return 'bg-white/10 text-white border-white/20'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'go': return 'ACTIVE'
      case 'countdown': return 'IN PROGRESS'
      case 'testing': return 'TESTING'
      case 'ready': return 'PLANNED'
      default: return 'SCHEDULED'
    }
  }

  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="section-subtitle">Launch Schedule</p>
          <h2 className="section-heading">Missions</h2>
        </div>

        <button
          onClick={() => setShowNewMission(!showNewMission)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-space-black font-medium rounded-full hover:bg-accent-cyan transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Plan Mission
        </button>
      </div>

      {/* New Mission Form */}
      <AnimatePresence>
        {showNewMission && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <h3 className="text-lg font-semibold mb-6">Plan New Mission</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mission Name</label>
                <input
                  type="text"
                  placeholder="Nova-XX"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Launch Vehicle</label>
                <select className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan">
                  <option value="falcon9">Falcon 9</option>
                  <option value="falconheavy">Falcon Heavy</option>
                  <option value="starship">Starship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Orbit</label>
                <select className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan">
                  <option value="leo">Low Earth Orbit (LEO)</option>
                  <option value="gto">Geostationary Transfer Orbit (GTO)</option>
                  <option value="sso">Sun-Synchronous Orbit (SSO)</option>
                  <option value="polar">Polar Orbit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Launch window</label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan [color-scheme:dark]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Payload Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the payload and mission objectives..."
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-cyan resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn-primary text-sm py-3 px-6">Schedule Launch</button>
              <button
                onClick={() => setShowNewMission(false)}
                className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        {['upcoming', 'recent'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'upcoming' ? 'Upcoming Launches' : 'Recent Missions'}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {upcomingLaunches.map((launch, index) => (
              <motion.div
                key={launch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 flex items-start justify-between gap-6 group hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Rocket className="w-6 h-6 text-accent-cyan" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-white group-hover:text-accent-cyan transition-colors">
                        {launch.mission}
                      </h4>
                      <span className={`px-2 py-1 text-[10px] font-mono uppercase rounded-full border ${getStatusColor(launch.status)}`}>
                        {getStatusLabel(launch.status)}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-3">{launch.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {launch.satellite}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {launch.orbit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(launch.window).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Success Probability</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-mono font-bold text-accent-green">{launch.probability}%</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-accent-blue/10 text-accent-cyan text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-colors">
                    Track Mission
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'recent' && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {(recentMissionsList.length > 0 ? recentMissionsList : displayMissions).map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 flex items-start justify-between gap-6 group hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    mission.status === 'go' ? 'bg-accent-green/20' : 'bg-space-gray'
                  }`}>
                    {mission.status === 'go' ? (
                      <svg className="w-6 h-6 text-accent-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">{mission.mission}</h4>
                    <p className="text-gray-400 text-sm mb-2">{mission.description || mission.satellite}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{mission.satellite}</span>
                      <span>•</span>
                      <span>{mission.orbit}</span>
                      <span>•</span>
                      <span>{new Date(mission.window).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-medium ${mission.status === 'go' ? 'text-accent-green' : 'text-gray-400'}`}>
                    {mission.status === 'go' ? 'Active Mission' : 'Completed'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mission.endDate && `Ends: ${new Date(mission.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Missions
