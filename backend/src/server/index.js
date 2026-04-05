require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('../database/init');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// GET all satellites
app.get('/api/satellites', (req, res) => {
  try {
    const { search, type, agency, sortBy } = req.query;

    let query = `
      SELECT s.*,
             o.altitude,
             o.inclination,
             o.eccentricity,
             o.mean_anomaly,
             o.mean_motion,
             o.tle_line1,
             o.tle_line2,
             p.latitude,
             p.longitude,
             p.altitude_km as pos_altitude,
             p.velocity_km_s as pos_velocity
      FROM satellites s
      LEFT JOIN orbital_data o ON s.id = o.satellite_id
      LEFT JOIN (
        SELECT satellite_id, latitude, longitude, altitude_km, velocity_km_s
        FROM positions
        WHERE id IN (
          SELECT MAX(id) FROM positions GROUP BY satellite_id
        )
      ) p ON s.id = p.satellite_id
    `;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(s.name LIKE ? OR s.id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      conditions.push('s.type = ?');
      params.push(type);
    }

    if (agency && agency !== 'all') {
      conditions.push('s.agency = ?');
      params.push(agency);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const orderBy = sortBy === 'health' ? 's.health DESC' :
                    sortBy === 'altitude' ? 'o.altitude DESC' :
                    's.id ASC';
    query += ` ORDER BY ${orderBy}`;

    const satellites = db.prepare(query).all(...params);
    console.log('Fetched satellites count:', satellites.length);

    // Transform data to match frontend format
    const transformed = satellites.map(sat => {
      const position = {
        lat: sat.latitude !== null && sat.latitude !== undefined ? parseFloat(sat.latitude) : (Math.random() - 0.5) * 140,
        lng: sat.longitude !== null && sat.longitude !== undefined ? parseFloat(sat.longitude) : (Math.random() - 0.5) * 360
      };
      console.log('Satellite:', sat.id, 'lat/lng from DB:', sat.latitude, sat.longitude, '-> position:', position);
      return {
        ...sat,
        position,
        orbital: {
          altitude: sat.altitude || 0,
          inclination: sat.inclination || 0,
          eccentricity: sat.eccentricity || 0,
          meanAnomaly: sat.mean_anomaly || 0,
          meanMotion: sat.mean_motion || 0
        },
        communication: {
          signalStrength: sat.signal_strength || 85
        }
      };
    });

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching satellites:', error);
    res.status(500).json({ error: 'Failed to fetch satellites' });
  }
});

// GET single satellite by ID
app.get('/api/satellites/:id', (req, res) => {
  try {
    const { id } = req.params;

    const satellite = db.prepare(`
      SELECT s.*,
             o.altitude,
             o.inclination,
             o.eccentricity,
             o.mean_anomaly,
             o.mean_motion,
             o.tle_line1,
             o.tle_line2,
             p.latitude,
             p.longitude
      FROM satellites s
      LEFT JOIN orbital_data o ON s.id = o.satellite_id
      LEFT JOIN (
        SELECT satellite_id, latitude, longitude
        FROM positions
        WHERE id IN (
          SELECT MAX(id) FROM positions GROUP BY satellite_id
        )
      ) p ON s.id = p.satellite_id
      WHERE s.id = ?
    `).get(id);

    if (!satellite) {
      return res.status(404).json({ error: 'Satellite not found' });
    }

    res.json({
      ...satellite,
      position: {
        lat: satellite.latitude || (Math.random() - 0.5) * 140,
        lng: satellite.longitude || (Math.random() - 0.5) * 360
      },
      orbital: {
        altitude: satellite.altitude || 0,
        inclination: satellite.inclination || 0,
        eccentricity: satellite.eccentricity || 0,
        meanAnomaly: satellite.mean_anomaly || 0,
        meanMotion: satellite.mean_motion || 0
      },
      communication: {
        signalStrength: satellite.signal_strength || 85
      }
    });
  } catch (error) {
    console.error('Error fetching satellite:', error);
    res.status(500).json({ error: 'Failed to fetch satellite' });
  }
});

// GET telemetry history for a satellite
app.get('/api/satellites/:id/telemetry', (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const telemetry = db.prepare(`
      SELECT * FROM telemetry_history
      WHERE satellite_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(id, limit);

    res.json(telemetry.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// GET positions for a satellite
app.get('/api/satellites/:id/positions', (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const positions = db.prepare(`
      SELECT * FROM positions
      WHERE satellite_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(id, limit);

    res.json(positions.reverse());
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// GET missions for a satellite
app.get('/api/satellites/:id/missions', (req, res) => {
  try {
    const { id } = req.params;

    const missions = db.prepare(`
      SELECT * FROM missions
      WHERE satellite_id = ?
      ORDER BY created_at DESC
    `).all(id);

    res.json(missions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// POST new telemetry reading (simulate data update)
app.post('/api/satellites/:id/telemetry', (req, res) => {
  try {
    const { id } = req.params;
    const { battery, signal_strength, temperature, health } = req.body;

    const result = db.prepare(`
      INSERT INTO telemetry_history (satellite_id, battery, signal_strength, temperature, health)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, battery, signal_strength, temperature, health);

    // Update satellite current values
    db.prepare(`
      UPDATE satellites
      SET battery = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(battery, id);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error saving telemetry:', error);
    res.status(500).json({ error: 'Failed to save telemetry' });
  }
});

// GET all agencies
app.get('/api/agencies', (req, res) => {
  try {
    const agencies = db.prepare(`
      SELECT DISTINCT agency FROM satellites
      WHERE agency IS NOT NULL
      ORDER BY agency
    `).all();

    res.json(agencies.map(a => a.agency));
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: 'Failed to fetch agencies' });
  }
});

// GET all alerts
app.get('/api/alerts', (req, res) => {
  try {
    const { unresolved } = req.query;
    
    let query = `
      SELECT a.*, s.name as satellite_name
      FROM alerts a
      LEFT JOIN satellites s ON a.satellite_id = s.id
    `;
    
    if (unresolved === 'true') {
      query += ' WHERE a.resolved = FALSE';
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT 100';
    
    const alerts = db.prepare(query).all();
    
    const transformed = alerts.map(alert => ({
      id: alert.id,
      satelliteId: alert.satellite_id,
      satelliteName: alert.satellite_name,
      type: alert.type || 'info',
      severity: alert.severity || 'medium',
      title: alert.message?.substring(0, 50) || 'Alert',
      description: alert.message,
      read: !!alert.resolved,
      timestamp: alert.created_at,
      resolved: !!alert.resolved
    }));
    
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// GET all missions
app.get('/api/missions', (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT m.*, s.name as satellite_name, s.agency
      FROM missions m
      LEFT JOIN satellites s ON m.satellite_id = s.id
    `;
    
    if (status && status !== 'all') {
      query += ' WHERE m.status = ?';
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT 100';
    
    const missions = status && status !== 'all' 
      ? db.prepare(query).all(status)
      : db.prepare(query).all();
    
    res.json(missions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// GET all telemetry history (aggregated)
app.get('/api/telemetry-history', (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit) || 100;
    
    // Get latest telemetry for each satellite
    const telemetry = db.prepare(`
      SELECT t.*, s.name as satellite_name, s.agency
      FROM telemetry_history t
      JOIN satellites s ON t.satellite_id = s.id
      WHERE t.id IN (
        SELECT MAX(id) FROM telemetry_history GROUP BY satellite_id
      )
      ORDER BY t.timestamp DESC
      LIMIT ?
    `).all(limitNum);
    
    res.json(telemetry);
  } catch (error) {
    console.error('Error fetching telemetry history:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

const sgp4Service = require('../services/sgp4Service');

// In-memory cache for SGP4 positions (key: "satId:timestamp", value: position)
// Cache duration: 60 seconds
const positionCache = new Map();

// Batch position endpoint - get positions for multiple satellites at once
app.get('/api/satellites/positions/batch', async (req, res) => {
  try {
    const { ids, at } = req.query;
    const timestamps = at ? new Date(at) : new Date();

    if (!ids) {
      return res.status(400).json({ error: 'Missing required parameter: ids (comma-separated satellite IDs)' });
    }

    const satelliteIds = ids.split(',').filter(id => id);
    const result = {};

    // Process each satellite
    for (const id of satelliteIds) {
      // Check cache first
      const cacheKey = `${id}:${Math.floor(timestamps.getTime() / 1000)}`; // Cache per second
      const cached = positionCache.get(cacheKey);
      if (cached) {
        result[id] = cached;
        continue;
      }

      // Get satellite + TLE from DB
      const satellite = db.prepare(`
        SELECT s.*, o.tle_line1, o.tle_line2, p.latitude, p.longitude, p.altitude_km, p.velocity_km_s
        FROM satellites s
        LEFT JOIN orbital_data o ON s.id = o.satellite_id
        LEFT JOIN (
          SELECT satellite_id, latitude, longitude, altitude_km, velocity_km_s
          FROM positions
          WHERE id IN (
            SELECT MAX(id) FROM positions GROUP BY satellite_id
          )
        ) p ON s.id = p.satellite_id
        WHERE s.id = ?
      `).get(id);

      if (!satellite) {
        result[id] = { error: 'Satellite not found' };
        continue;
      }

      if (!sgp4Service.hasValidTLE(satellite)) {
        // Fallback to stored position
        if (satellite.latitude && satellite.longitude) {
          result[id] = {
            latitude: satellite.latitude,
            longitude: satellite.longitude,
            altitude: satellite.altitude_km || satellite.altitude || 0,
            velocity: satellite.velocity_km_s || satellite.speed || 0,
            timestamp: timestamps.toISOString(),
            satelliteId: id,
            fallback: true
          };
        } else {
          result[id] = { error: 'No TLE and no stored position' };
        }
        continue;
      }

      try {
        const position = await sgp4Service.propagateSatellite(
          satellite.tle_line1,
          satellite.tle_line2,
          timestamps
        );

        const positionData = {
          ...position,
          timestamp: timestamps.toISOString(),
          satelliteId: id
        };

        // Cache the result
        positionCache.set(cacheKey, positionData);

        // Store in positions table for history (async, don't wait)
        try {
          db.prepare(`
            INSERT INTO positions (satellite_id, latitude, longitude, altitude_km, velocity_km_s, footprint_km)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            id,
            position.latitude,
            position.longitude,
            position.altitude,
            position.velocity,
            2500
          );
        } catch (err) {
          // Log but don't fail the request
          console.warn(`Failed to store position for ${id}:`, err.message);
        }

        result[id] = positionData;
      } catch (propError) {
        console.error(`SGP4 error for ${id}:`, propError.message);
        // Fallback
        if (satellite.latitude && satellite.longitude) {
          result[id] = {
            latitude: satellite.latitude,
            longitude: satellite.longitude,
            altitude: satellite.altitude_km || satellite.altitude || 0,
            velocity: satellite.velocity_km_s || satellite.speed || 0,
            timestamp: timestamps.toISOString(),
            satelliteId: id,
            fallback: true
          };
        } else {
          result[id] = { error: 'Propagation failed' };
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Batch positions endpoint error:', error);
    res.status(500).json({ error: 'Failed to compute positions' });
  }
});

// GET propagated position for a satellite using SGP4
app.get('/api/satellites/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const at = req.query.at ? new Date(req.query.at) : new Date();

    // Check cache
    const cacheKey = `${id}:${Math.floor(at.getTime() / 1000)}`;
    const cached = positionCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Get satellite + TLE from DB
    const satellite = db.prepare(`
      SELECT s.*, o.tle_line1, o.tle_line2, p.latitude, p.longitude, p.altitude_km, p.velocity_km_s
      FROM satellites s
      LEFT JOIN orbital_data o ON s.id = o.satellite_id
      LEFT JOIN (
        SELECT satellite_id, latitude, longitude, altitude_km, velocity_km_s
        FROM positions
        WHERE id IN (
          SELECT MAX(id) FROM positions GROUP BY satellite_id
        )
      ) p ON s.id = p.satellite_id
      WHERE s.id = ?
    `).get(id);

    if (!satellite) {
      return res.status(404).json({ error: 'Satellite not found' });
    }

    if (!sgp4Service.hasValidTLE(satellite)) {
      return res.status(400).json({ error: 'No TLE data available for satellite' });
    }

    try {
      const position = await sgp4Service.propagateSatellite(
        satellite.tle_line1,
        satellite.tle_line2,
        at
      );

      const positionData = {
        ...position,
        timestamp: at.toISOString(),
        satelliteId: id
      };

      // Cache the result
      positionCache.set(cacheKey, positionData);

      res.json(positionData);
    } catch (propError) {
      console.error(`SGP4 error for ${id}:`, propError.message);
      // Fall back to stored position if available
      if (satellite.latitude && satellite.longitude) {
        res.json({
          latitude: satellite.latitude,
          longitude: satellite.longitude,
          altitude: satellite.altitude_km || satellite.altitude || 0,
          velocity: satellite.velocity_km_s || satellite.speed || 0,
          timestamp: at.toISOString(),
          satelliteId: id,
          fallback: true
        });
      } else {
        res.status(500).json({ error: 'Propagation failed', details: propError.message });
      }
    }
  } catch (error) {
    console.error('Position endpoint error:', error);
    res.status(500).json({ error: 'Failed to compute position' });
  }
});

// GET positions from last 30 minutes (for export)
app.get('/api/positions/last-30min', (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const positions = db.prepare(`
      SELECT p.*, s.name as satellite_name, s.agency
      FROM positions p
      JOIN satellites s ON p.satellite_id = s.id
      WHERE p.timestamp >= ?
      ORDER BY p.timestamp DESC
      LIMIT 10000
    `).all(cutoff.toISOString());

    res.json(positions);
  } catch (error) {
    console.error('Error fetching 30min positions:', error);
    res.status(500).json({ error: 'Failed to fetch position history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET    /api/satellites`);
  console.log(`   GET    /api/satellites/:id`);
  console.log(`   GET    /api/satellites/:id/telemetry`);
  console.log(`   GET    /api/satellites/:id/positions`);
  console.log(`   GET    /api/satellites/:id/missions`);
  console.log(`   POST   /api/satellites/:id/telemetry`);
  console.log(`   GET    /api/agencies`);
  console.log(`   GET    /api/health`);
});
