import { useState, useEffect, useCallback, useRef } from 'react'
import { propagate, twoline2satrec, gstime, eciToGeodetic } from 'satellite.js'

// Backend API configuration (takes priority if set)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const USE_BACKEND = !!BACKEND_URL

// N2YO API configuration (fallback)
const N2YO_API_KEY = import.meta.env.VITE_N2YO_API_KEY || ''
const OBSERVER_LAT = import.meta.env.VITE_N2YO_OBSERVER_LAT || '28.6139'
const OBSERVER_LNG = import.meta.env.VITE_N2YO_OBSERVER_LNG || '77.2090'
const OBSERVER_ALT = import.meta.env.VITE_N2YO_OBSERVER_ALT || '100'

// Real-time fetch from backend (if available)
const fetchBackendAlerts = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/alerts?unresolved=true`)
    if (!response.ok) throw new Error('Failed to fetch alerts')
    const data = await response.json()
    return data.map(alert => ({
      id: alert.id,
      type: alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'info',
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      read: alert.read,
      timestamp: new Date(alert.timestamp),
      satelliteId: alert.satelliteId
    }))
  } catch (error) {
    console.warn('Backend alerts fetch failed:', error)
    return null
  }
}

const fetchBackendMissions = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/missions`)
    if (!response.ok) throw new Error('Failed to fetch missions')
    const data = await response.json()
    return data.map(mission => ({
      id: mission.id,
      satelliteId: mission.satellite_id,
      satelliteName: mission.satellite_name,
      name: mission.name,
      description: mission.description,
      status: mission.status,
      startDate: mission.start_date,
      endDate: mission.end_date,
      agency: mission.agency
    }))
  } catch (error) {
    console.warn('Backend missions fetch failed:', error)
    return null
  }
}

const fetchBackendTelemetryHistory = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/telemetry-history?limit=50`)
    if (!response.ok) throw new Error('Failed to fetch telemetry')
    const data = await response.json()
    return data.map(t => ({
      id: t.id,
      satelliteId: t.satellite_id,
      satelliteName: t.satellite_name,
      agency: t.agency,
      battery: t.battery,
      signalStrength: t.signal_strength,
      temperature: t.temperature,
      health: t.health,
      timestamp: t.timestamp
    }))
  } catch (error) {
    console.warn('Backend telemetry history fetch failed:', error)
    return null
  }
}
const fetchBackendSatellites = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/satellites`)
    if (!response.ok) throw new Error('Failed to fetch from backend')
    const data = await response.json()
    return data.map(sat => ({
      id: sat.id,
      name: sat.name,
      agency: sat.agency,
      type: sat.type,
      status: sat.status,
      health: parseFloat(sat.health) || 95,
      battery: parseFloat(sat.battery) || 85,
      fuel: parseFloat(sat.fuel) || 90,
      temperature: parseFloat(sat.temperature) || 20,
      speed: parseFloat(sat.speed) || 7.5,
      position: {
        lat: sat.latitude ? parseFloat(sat.latitude) : (Math.random() - 0.5) * 140,
        lng: sat.longitude ? parseFloat(sat.longitude) : (Math.random() - 0.5) * 360
      },
      orbital: sat.orbital || {
        altitude: 500,
        inclination: 51.6,
        eccentricity: 0,
        meanAnomaly: 0,
        meanMotion: 15
      },
      communication: {
        signalStrength: sat.communication?.signalStrength || 85
      },
      missions: 0
    }))
  } catch (error) {
    console.warn('Backend fetch failed, falling back to N2YO:', error)
    return null
  }
}

// Fetch satellite details from N2YO API (fallback)
const fetchN2YOSatelliteDetails = async (noradId) => {
  if (!N2YO_API_KEY) return null

  try {
    const url = `https://api.n2yo.com/rest/v1/satellite/positions/${noradId}/${OBSERVER_LAT}/${OBSERVER_LNG}/1/100?apiKey=${N2YO_API_KEY}`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()

    // Also fetch TLE for this satellite
    const tleUrl = `https://api.n2yo.com/rest/v1/satellite/tle/${noradId}?apiKey=${N2YO_API_KEY}`
    const tleResponse = await fetch(tleUrl)
    const tleData = tleResponse.ok ? await tleResponse.json() : null

    return { positions: data, tle: tleData }
  } catch (error) {
    console.warn(`N2YO fetch failed for ${noradId}:`, error)
    return null
  }
}

// Detect space agency from satellite name
const detectAgency = (name) => {
  const upperName = name.toUpperCase()

  if (upperName.includes('STARLINK') || upperName.includes('SPACEX') || upperName.includes('DRAGON') || upperName.includes('CREW')) {
    return 'SPACEX'
  }
  if (upperName.includes('ISS') || upperName.includes('NOAA') || upperName.includes('GOES') || upperName.includes('HST') ||
      upperName.includes('TDRS') || upperName.includes('LANDSAT') || upperName.includes('SWIFT') || upperName.includes('NASA')) {
    return 'NASA'
  }
  if (upperName.includes('ESA') || upperName.includes('ENVISAT') || upperName.includes('SMART-1') ||
      upperName.includes('METOP') || upperName.includes('CRYOSAT') || upperName.includes('AEOLUS') ||
      upperName.includes('SENTINEL') || upperName.includes('GOCE')) {
    return 'ESA'
  }
  if (upperName.includes('CARTOSAT') || upperName.includes('IRS') || upperName.includes('RISAT') ||
      upperName.includes('NAVIC') || upperName.includes('GSAT') || upperName.includes('ISRO') ||
      upperName.includes('HYSPEX') || upperName.includes('RESOURCESAT') || upperName.includes('OCEANSAT')) {
    return 'ISRO'
  }

  if (upperName.includes('ONEWEB')) return 'ONEWEB'
  if (upperName.includes('IRIDIUM')) return 'IRIDIUM'
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR')) return 'USSF'
  if (upperName.includes('GLONASS')) return 'RUSSIA'
  if (upperName.includes('BEIDOU')) return 'CHINA'

  return 'OTHER'
}

// Realistic satellite configurations based on real orbital parameters
const SATELLITE_TYPES = {
  comm: {
    name: 'Nova Com',
    inclination: 0,
    altitude: 35786,
    period: 1440,
    typicalSpeed: 3.07
  },
  gps: {
    name: 'Nova Nav',
    inclination: 55,
    altitude: 20200,
    period: 720,
    typicalSpeed: 3.9
  },
  earth: {
    name: 'Nova Scan',
    inclination: 98,
    altitude: 705,
    period: 98.8,
    typicalSpeed: 7.5
  },
  science: {
    name: 'Nova Sci',
    inclination: 28.5,
    altitude: 550,
    period: 95,
    typicalSpeed: 7.6
  },
  starlink: {
    name: 'Nova Link',
    inclination: 53,
    altitude: 550,
    period: 96,
    typicalSpeed: 7.6
  },
  polar: {
    name: 'Nova Polar',
    inclination: 97,
    altitude: 800,
    period: 101,
    typicalSpeed: 7.4
  },
  geo: {
    name: 'Nova Geo',
    inclination: 0,
    altitude: 35786,
    period: 1440,
    typicalSpeed: 3.07
  }
}

// Generate ALL 703 satellites to match database
const generateSatellites = () => {
  const allSatellites = []
  
  const satelliteTypes = [
    { prefix: 'STARLINK', type: 'starlink', agency: 'SPACEX', baseCount: 450 },
    { prefix: 'ONEWEB', type: 'comm', agency: 'ONEWEB', baseCount: 80 },
    { prefix: 'IRIDIUM', type: 'comm', agency: 'IRIDIUM', baseCount: 66 },
    { prefix: 'GPS', type: 'gps', agency: 'USSF', baseCount: 31 },
    { prefix: 'GLONASS', type: 'gps', agency: 'RUSSIA', baseCount: 24 },
    { prefix: 'GALILEO', type: 'gps', agency: 'ESA', baseCount: 30 },
    { prefix: 'BEIDOU', type: 'gps', agency: 'CHINA', baseCount: 35 },
    { prefix: 'NOAA', type: 'earth', agency: 'NASA', baseCount: 20 },
    { prefix: 'LANDSAT', type: 'earth', agency: 'NASA', baseCount: 10 },
    { prefix: 'SENTINEL', type: 'earth', agency: 'ESA', baseCount: 12 },
    { prefix: 'ISS', type: 'science', agency: 'NASA', baseCount: 1 },
    { prefix: 'HUBBLE', type: 'science', agency: 'NASA', baseCount: 1 },
    { prefix: 'GOES', type: 'geo', agency: 'NASA', baseCount: 8 },
    { prefix: 'METEOSAT', type: 'geo', agency: 'ESA', baseCount: 4 },
    { prefix: 'INTELSAT', type: 'comm', agency: 'OTHER', baseCount: 50 },
    { prefix: 'SES', type: 'comm', agency: 'OTHER', baseCount: 50 },
    { prefix: 'EUTELSAT', type: 'comm', agency: 'OTHER', baseCount: 35 },
    { prefix: 'OTHER', type: 'other', agency: 'OTHER', baseCount: 16 }
  ]
  
  let globalIndex = 1
  
  satelliteTypes.forEach(({ prefix, type, agency, baseCount }) => {
    const count = Math.min(baseCount, 703 - allSatellites.length)
    
    for (let i = 0; i < count && allSatellites.length < 703; i++) {
      const idNum = 1000 + globalIndex++
      
      const baseHealth = 70 + Math.random() * 28
      const status = baseHealth > 90 ? 'active' : baseHealth > 75 ? 'warning' : 'critical'
      
      const lat = type === 'gps' || type === 'geo' ? 
        (Math.random() - 0.5) * 40 : 
        (Math.random() - 0.5) * 160
      const lng = (Math.random() - 0.5) * 360
      
      const altitude = type === 'geo' ? 35786 : 
                       type === 'gps' ? 20200 : 
                       type === 'earth' ? 700 + Math.random() * 200 : 
                       400 + Math.random() * 600
                       
      const inclination = type === 'geo' ? 0 : 
                         type === 'gps' ? 55 + (Math.random() - 0.5) * 10 : 
                         type === 'polar' ? 97 : 
                         45 + Math.random() * 50

      allSatellites.push({
        id: `${prefix}-${idNum}`,
        name: `${prefix} ${idNum}`,
        agency,
        type,
        status,
        health: parseFloat(baseHealth.toFixed(1)),
        battery: parseFloat((50 + Math.random() * 45).toFixed(1)),
        fuel: parseFloat((40 + Math.random() * 55).toFixed(1)),
        temperature: parseFloat((-40 + Math.random() * 60).toFixed(1)),
        speed: parseFloat((3 + Math.random() * 5).toFixed(3)),
        position: {
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4))
        },
        orbital: {
          altitude: parseFloat(altitude.toFixed(1)),
          inclination: parseFloat(inclination.toFixed(2)),
          eccentricity: parseFloat((Math.random() * 0.02).toFixed(6)),
          meanAnomaly: parseFloat((Math.random() * 360).toFixed(4)),
          meanMotion: parseFloat((24 / (90 + Math.random() * 1400)).toFixed(6))
        },
        communication: {
          signalStrength: parseFloat((50 + Math.random() * 45).toFixed(1))
        },
        missions: Math.floor(Math.random() * 5) + 1
      })
    }
  })

  console.log(`Generated ${allSatellites.length} satellites`)
  return allSatellites
}

// Timeout wrapper for fetch
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'))
    }, timeout)
    
    fetch(url, options)
      .then(res => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

// Quick satellite fetch with minimal data
const fetchBackendSatellitesQuick = async () => {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/api/satellites`, {}, 8000)
    if (!response.ok) throw new Error('Failed to fetch from backend')
    const data = await response.json()
    return data.map(sat => ({
      id: sat.id,
      name: sat.name,
      agency: sat.agency,
      type: sat.type,
      status: sat.status,
      health: parseFloat(sat.health) || 95,
      battery: parseFloat(sat.battery) || 85,
      fuel: parseFloat(sat.fuel) || 90,
      temperature: parseFloat(sat.temperature) || 20,
      speed: parseFloat(sat.speed) || 7.5,
      position: {
        lat: sat.position?.lat ?? (Math.random() - 0.5) * 140,
        lng: sat.position?.lng ?? (Math.random() - 0.5) * 360
      },
      orbital: sat.orbital || {
        altitude: 500,
        inclination: 51.6,
        eccentricity: 0,
        meanAnomaly: 0,
        meanMotion: 15
      },
      communication: {
        signalStrength: sat.communication?.signalStrength || 85
      },
      missions: 0
    }))
  } catch (error) {
    console.warn('Backend fetch failed:', error.message)
    return null
  }
}

// Main hook
export function useTelemetry() {
  const [satellites, setSatellites] = useState([])
  const [alerts, setAlerts] = useState([])
  const [missions, setMissions] = useState([])
  const [telemetryHistory, setTelemetryHistory] = useState([])
  const [metrics, setMetrics] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const refreshIntervalRef = useRef(null)

  const refreshData = useCallback(async () => {
    try {
      let data = null

      if (USE_BACKEND) {
        data = await fetchBackendSatellitesQuick()
      }

      if (!data) {
        console.log('Using generated mock data (enable backend for real data)')
        data = generateSatellites()
      }

      setSatellites(data || [])
      setInitialDataLoaded(true)
      setIsLoading(false)

      // Calculate metrics
      const totalSatellites = data?.length || 0
      const activeSatellites = data?.filter(s => s.status === 'active').length || 0
      const averageHealth = totalSatellites > 0
        ? data.reduce((sum, s) => sum + (s.health || 0), 0) / totalSatellites
        : 0

      setMetrics({
        totalSatellites,
        activeSatellites,
        averageHealth: averageHealth.toFixed(1),
        systemLoad: Math.floor(Math.random() * 30) + 20,
        uptime: Math.floor(Date.now() / 1000),
        dataThroughput: (Math.random() * 10).toFixed(2)
      })

      setConnectionStatus('connected')

      // Load additional data in background (non-blocking)
      if (USE_BACKEND) {
        Promise.allSettled([
          fetchBackendAlerts().then(setAlerts).catch(() => {}),
          fetchBackendMissions().then(setMissions).catch(() => {}),
          fetchBackendTelemetryHistory().then(setTelemetryHistory).catch(() => {})
        ])
      }
    } catch (error) {
      console.error('Telemetry error:', error)
      setConnectionStatus('error')
      // Still show with mock data on error
      const data = generateSatellites()
      setSatellites(data)
      setInitialDataLoaded(true)
      setIsLoading(false)
    }
  }, [])

  // Fetch satellite details with position data
  const fetchSatelliteDetails = async (satelliteId) => {
    if (USE_BACKEND) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}`)
        if (!response.ok) return null
        const satellite = await response.json()

        const telemetryRes = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/telemetry?limit=20`)
        const telemetry = telemetryRes.ok ? await telemetryRes.json() : []

        // Try to get SGP4 propagated position if TLE available
        let position = null
        if (satellite.tle_line1 && satellite.tle_line2) {
          try {
            const posRes = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/position`)
            if (posRes.ok) {
              const pos = await posRes.json()
              position = {
                latitude: pos.latitude,
                longitude: pos.longitude,
                altitude: pos.altitude,
                velocity: pos.velocity,
                timestamp: pos.timestamp
              }
            }
          } catch (err) {
            console.warn('SGP4 position fetch failed, using fallback:', err.message)
          }
        }

        // Fallback to DB position or generate mock if needed
        if (!position) {
          position = {
            latitude: parseFloat(satellite.position?.lat) || (Math.random() - 0.5) * 140,
            longitude: parseFloat(satellite.position?.lng) || (Math.random() - 0.5) * 360,
            altitude: parseFloat(satellite.orbital?.altitude) || 400,
            velocity: parseFloat(satellite.speed) || 7.5,
            timestamp: new Date().toISOString()
          }
        }

        // Also get position history from DB if available
        const positionsRes = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/positions?limit=100`)
        const positionsHistory = positionsRes.ok ? await positionsRes.json() : []

        return {
          satellite: {
            ...satellite,
            position
          },
          telemetry,
          positions: positionsHistory,
          missions: []
        }
      } catch (error) {
        console.warn('Backend details fetch failed:', error)
        return null
      }
    }

    // Fallback to N2YO for positions
    return fetchN2YOSatelliteDetails(satelliteId)
  }

  useEffect(() => {
    refreshData()

    // Auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshData()
    }, 30000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [refreshData])

  return {
    satellites,
    alerts,
    missions,
    telemetryHistory,
    metrics,
    collisionRisks: [],
    isLoading,
    connectionStatus,
    refresh: refreshData,
    fetchSatelliteDetails,
    addTelemetryReading: async (id, data) => ({ success: false, error: 'Not implemented' })
  }
}
