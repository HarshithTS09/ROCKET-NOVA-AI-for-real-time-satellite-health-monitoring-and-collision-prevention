import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, AlertTriangle, Info, X, Filter, Check, CheckCheck, BellRing, Activity } from 'lucide-react'

function AlertsHub({ alerts, telemetryHistory = [], onMarkRead }) {
  const [filter, setFilter] = useState('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('alerts') // alerts | telemetry

  const handleMarkRead = (id) => {
    if (onMarkRead) {
      onMarkRead(id)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filter === 'all' || alert.type === filter
    const matchesRead = !unreadOnly || !alert.read
    return matchesType && matchesRead
  })

  const unreadCount = alerts.filter(a => !a.read).length

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-accent-cyan" />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'border-l-red-500 bg-red-900/10'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-900/10'
      default:
        return 'border-l-accent-cyan bg-accent-cyan/5'
    }
  }

  const getAlertBadge = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/20 text-red-400'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-accent-cyan/20 text-accent-cyan'
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const diff = Math.floor((now - date) / 1000 / 60) // minutes

    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  return (
    <div className="space-y-16">
      {/* Section Header */}
      <div>
        <p className="section-subtitle">Notifications & Events</p>
        <h2 className="section-heading">Alerts Hub</h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'alerts' 
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BellRing className="w-4 h-4 inline mr-2" />
          Alerts
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'telemetry' 
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Telemetry History
        </button>
      </div>

      {activeTab === 'alerts' && (
      <>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Unread badge */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg">
              <BellRing className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm font-mono text-accent-cyan">{unreadCount} unread</span>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-accent-cyan"
            >
              <option value="all">All Types</option>
              <option value="critical">Critical</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-accent-cyan focus:ring-accent-cyan focus:ring-offset-0 bg-white/5"
              />
              <span className="text-sm text-gray-400">Unread only</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => filteredAlerts.forEach(a => !a.read && handleMarkRead(a.id))}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-cyan text-sm rounded-lg hover:bg-accent-blue/20 transition-colors">
            <BellRing className="w-4 h-4" />
            Configure Alerts
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 glass"
            >
              <BellRing className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No alerts match your filters</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`glass p-6 border-l-4 transition-all hover:bg-white/10 cursor-pointer group relative ${
                  getAlertColor(alert.type)
                } ${!alert.read ? 'bg-white/[0.03]' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'critical' ? 'bg-red-500/10' :
                    alert.type === 'warning' ? 'bg-yellow-500/10' :
                    'bg-accent-cyan/10'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white group-hover:text-accent-cyan transition-colors">
                        {alert.title}
                      </h4>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded-full ${getAlertBadge(alert.type)}`}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-3">{alert.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatTime(alert.timestamp)}</span>
                        <span className="uppercase">{alert.type}</span>
                        <span className="font-mono">SAT:{alert.satelliteId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!alert.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkRead(alert.id)
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-accent-green" />
                          </button>
                        )}
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {filteredAlerts.length > 0 && (
        <div className="text-center pt-4">
          <button className="text-sm text-accent-cyan hover:underline">
            Load more alerts →
          </button>
        </div>
      )}
      </>
      )}

      {/* Telemetry History Tab */}
      {activeTab === 'telemetry' && (
        <div className="glass rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Telemetry History</h3>
            <p className="text-sm text-gray-500">Latest telemetry readings from all satellites</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Satellite</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Agency</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Battery</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Signal</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Temp</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Health</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-gray-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {telemetryHistory.length > 0 ? (
                  telemetryHistory.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{t.satelliteName}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{t.agency}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <span className={`${t.battery > 80 ? 'text-accent-green' : t.battery > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {t.battery?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-accent-cyan">{t.signalStrength?.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{t.temperature?.toFixed(1)}°C</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        <span className={`${t.health > 90 ? 'text-accent-green' : t.health > 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {t.health?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {t.timestamp ? new Date(t.timestamp).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No telemetry history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertsHub
