import { useState, useEffect } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'

export function useBackendData() {
  const [satellites, setSatellites] = useState([])
  const [alerts, setAlerts] = useState([])
  const [metrics, setMetrics] = useState({})
  const [collisionRisks, setCollisionRisks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSatellites = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/satellites`);
      if (!response.ok) throw new Error('Failed to fetch satellites');
      const data = await response.json();

      if (data.length === 0) {
        setSatellites([]);
        return [];
      }

      // Batch fetch positions for all satellites with TLEs
      const satelliteIds = data
        .filter(sat => sat.tle_line1 && sat.tle_line2 && sat.tle_line1.trim() !== '')
        .map(sat => sat.id);

      const positionsBatch = {};
      if (satelliteIds.length > 0) {
        try {
          const batchResponse = await fetch(
            `${BACKEND_URL}/api/satellites/positions/batch?ids=${encodeURIComponent(satelliteIds.join(','))}`
          );
          if (batchResponse.ok) {
            positionsBatch.data = await batchResponse.json();
          } else {
            console.warn('Batch position request failed:', batchResponse.status);
          }
        } catch (err) {
          console.warn('Batch position fetch error:', err.message);
        }
      }

      // Enrich satellites with positions
      const enriched = data.map(sat => {
        const hasTle = sat.tle_line1 && sat.tle_line2 && sat.tle_line1.trim() !== '';
        const batchPos = positionsBatch.data?.[sat.id];

        if (batchPos && !batchPos.error) {
          return {
            ...sat,
            position: {
              lat: batchPos.latitude,
              lng: batchPos.longitude
            },
            orbital: {
              ...sat.orbital,
              altitude: batchPos.altitude,
            },
            speed: batchPos.velocity
          };
        }

        // Fallback: use DB position
        if (sat.position && sat.position.lat !== undefined) {
          return sat;
        }

        // Last resort: generate random (shouldn't happen often)
        return {
          ...sat,
          position: {
            lat: (Math.random() - 0.5) * 140,
            lng: (Math.random() - 0.5) * 360
          }
        };
      });

      setSatellites(enriched);
      return enriched;
    } catch (error) {
      console.error('Error fetching satellites:', error);
      setError(error.message);
      return [];
    }
  };

  const fetchSatelliteDetails = async (satelliteId) => {
    try {
      const [satelliteRes, telemetryRes, positionsRes, missionsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/satellites/${satelliteId}`),
        fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/telemetry?limit=50`),
        fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/positions?limit=100`),
        fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/missions`)
      ]);

      if (!satelliteRes.ok) throw new Error('Satellite not found');

      const satellite = await satelliteRes.json();
      const telemetry = await telemetryRes.json();
      const positions = await positionsRes.json();
      const missions = await missionsRes.json();

      // Try to get SGP4 position if TLE available
      if (satellite.tle_line1 && satellite.tle_line2) {
        try {
          const posRes = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/position`);
          if (posRes.ok) {
            const pos = await posRes.json();
            satellite.position = {
              lat: pos.latitude,
              lng: pos.longitude
            };
            satellite.orbital = {
              ...satellite.orbital,
              altitude: pos.altitude,
            };
            satellite.speed = pos.velocity;
          }
        } catch (err) {
          console.warn('Could not get SGP4 position for details view:', err.message);
        }
      }

      return { satellite, telemetry, positions, missions };
    } catch (error) {
      console.error('Error fetching satellite details:', error);
      return null;
    }
  };

  const addTelemetryReading = async (satelliteId, reading) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/satellites/${satelliteId}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading)
      });
      if (!response.ok) throw new Error('Failed to save telemetry');
      return { success: true };
    } catch (error) {
      console.error('Error saving telemetry:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const satellites = await fetchSatellites();

        // Calculate metrics
        const totalSatellites = satellites.length;
        const activeSatellites = satellites.filter(s => s.status === 'active').length;
        const averageHealth = totalSatellites > 0
          ? satellites.reduce((sum, s) => sum + (s.health || 0), 0) / totalSatellites
          : 0;

        setMetrics({
          totalSatellites,
          activeSatellites,
          averageHealth: averageHealth.toFixed(1),
          systemLoad: Math.floor(Math.random() * 30) + 20,
          uptime: Math.floor(Date.now() / 1000),
          dataThroughput: (Math.random() * 10).toFixed(2)
        });

        setAlerts([
          {
            id: 1,
            type: 'warning',
            title: 'Battery Warning',
            description: 'STARLINK-1234 battery below 20%',
            read: false,
            satelliteId: 'STARLINK-1234'
          },
          {
            id: 2,
            type: 'info',
            title: 'Orbital Adjustment',
            description: 'GPS-BLOCK3 scheduled for station-keeping',
            read: false,
            satelliteId: 'GPS-BLOCK3'
          }
        ]);

        setCollisionRisks([]);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    satellites,
    alerts,
    metrics,
    collisionRisks,
    isLoading,
    error,
    refresh: fetchSatellites,
    fetchSatelliteDetails,
    addTelemetryReading
  };
}
