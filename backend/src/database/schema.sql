-- Satellite Tracking Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS satellites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agency TEXT,
    type TEXT,
    status TEXT DEFAULT 'active',
    health REAL,
    battery REAL,
    fuel REAL,
    temperature REAL,
    speed REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orbital_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT REFERENCES satellites(id) ON DELETE CASCADE,
    altitude REAL,
    inclination REAL,
    ra_of_ascension REAL,
    eccentricity REAL,
    mean_anomaly REAL,
    mean_motion REAL,
    epoch DATETIME,
    tle_line1 TEXT,
    tle_line2 TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT REFERENCES satellites(id) ON DELETE CASCADE,
    latitude REAL,
    longitude REAL,
    altitude_km REAL,
    velocity_km_s REAL,
    footprint_km REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_positions_satellite_time ON positions(satellite_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS telemetry_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT REFERENCES satellites(id) ON DELETE CASCADE,
    battery REAL,
    signal_strength REAL,
    temperature REAL,
    health REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_satellite_time ON telemetry_history(satellite_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT REFERENCES satellites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT REFERENCES satellites(id) ON DELETE CASCADE,
    type TEXT,
    severity TEXT,
    message TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_satellite_unresolved ON alerts(satellite_id) WHERE resolved = FALSE;

-- Insert sample satellite data
INSERT OR REPLACE INTO satellites (id, name, agency, type, status, health, battery, fuel, temperature, speed) VALUES
('ISS', 'International Space Station', 'NASA', 'science', 'active', 98.5, 85.0, 92.0, 22.5, 0.00766),
('STARLINK-1234', 'Starlink-1234', 'SPACEX', 'starlink', 'active', 99.2, 95.0, 98.0, 15.3, 0.00567),
('GPS-BLOCK3', 'GPS Block III', 'NASA', 'gps', 'active', 97.8, 88.0, 85.0, -50.0, 0.00412),
('LANDSAT-9', 'Landsat 9', 'NASA', 'earth', 'active', 96.5, 82.0, 75.0, -20.0, 0.00634),
('HUBBLE', 'Hubble Space Telescope', 'NASA', 'science', 'active', 94.2, 78.0, 68.0, -40.0, 0.00489),
('ROS', 'China Space Station', 'CNSA', 'science', 'active', 95.8, 80.0, 72.0, 18.5, 0.00723),
('GALILEO-5', 'Galileo 5', 'ESA', 'gps', 'active', 98.1, 86.0, 88.0, -45.0, 0.00425),
('CARTOSAT-3', 'Cartosat-3', 'ISRO', 'earth', 'active', 93.5, 75.0, 70.0, -15.0, 0.00650);

-- Sample orbital data for ISS
INSERT OR REPLACE INTO orbital_data (satellite_id, altitude, inclination, ra_of_ascension, eccentricity, mean_anomaly, mean_motion, epoch, tle_line1, tle_line2) VALUES
('ISS', 408.0, 51.64, 292.4667, 0.0003537, 128.5235, 15.48996932, '2024-01-01 00:00:00', '1 25544U 98067A   24001.50000000  .00016417  00000+0  29270-3 0  9991', '2 25544  51.6400 292.4667 0003537 128.5235 231.4765 15.48996932000000');

-- Sample missions
INSERT OR REPLACE INTO missions (satellite_id, name, description, status, start_date, end_date) VALUES
('ISS', 'Expedition 71', 'Long-term space station operations and scientific research', 'active', '2024-03-01', '2024-09-30'),
('ISS', 'Crew-8 Mission', 'Crew rotation and spacewalk operations', 'active', '2024-02-15', '2024-08-15'),
('STARLINK-1234', 'Starlink 5-1', 'Global broadband internet constellation deployment', 'active', '2024-01-01', '2025-12-31'),
('GPS-BLOCK3', 'GPS III Operational', 'Navigation and timing services for military and civilian use', 'active', '2023-06-01', '2028-05-31'),
('LANDSAT-9', 'Land Imaging Mission', 'Earth observation and land cover monitoring', 'active', '2021-10-01', '2026-09-30'),
('HUBBLE', 'HST Servicing', 'Space telescope maintenance and upgrade', 'planned', '2025-06-01', '2025-07-30'),
('GALILEO-5', 'Galileo Navigation', 'European GNSS positioning services', 'active', '2022-11-01', '2032-10-31');

-- Sample alerts
INSERT OR REPLACE INTO alerts (satellite_id, type, severity, message, resolved, created_at) VALUES
('ISS', 'warning', 'high', 'Battery discharge rate higher than expected - monitoring closely', FALSE, datetime('now', '-2 hours')),
('STARLINK-1234', 'info', 'medium', 'Routine orbit maintenance maneuver scheduled for tomorrow', FALSE, datetime('now', '-5 hours')),
('GPS-BLOCK3', 'warning', 'medium', 'Signal strength variance detected - recalibrating', FALSE, datetime('now', '-1 day')),
('LANDSAT-9', 'info', 'low', 'Scheduled ground station contact completed successfully', TRUE, datetime('now', '-3 hours')),
('HUBBLE', 'critical', 'high', 'Gyroscope 3 malfunction - switching to backup unit', FALSE, datetime('now', '-12 hours')),
('GALILEO-5', 'info', 'medium', 'Navigation payload operating normally after software update', TRUE, datetime('now', '-1 day')),
('ISS', 'critical', 'high', 'Thermal control system anomaly - elevated temperatures in Module 4', FALSE, datetime('now', '-30 minutes')),
('STARLINK-1234', 'warning', 'low', 'Solar panel efficiency slight degradation - within acceptable range', FALSE, datetime('now', '-6 hours'));

-- Sample telemetry history
INSERT OR REPLACE INTO telemetry_history (satellite_id, battery, signal_strength, temperature, health, timestamp) VALUES
('ISS', 85.2, 95, 22.5, 98.5, datetime('now', '-1 hour')),
('ISS', 84.8, 94, 22.8, 98.4, datetime('now', '-2 hours')),
('ISS', 86.1, 96, 22.2, 98.6, datetime('now', '-3 hours')),
('STARLINK-1234', 95.0, 92, 15.3, 99.2, datetime('now', '-1 hour')),
('STARLINK-1234', 94.7, 91, 15.5, 99.1, datetime('now', '-2 hours')),
('STARLINK-1234', 95.3, 93, 15.1, 99.3, datetime('now', '-3 hours')),
('GPS-BLOCK3', 88.0, 97, -50.0, 97.8, datetime('now', '-1 hour')),
('GPS-BLOCK3', 87.5, 96, -49.8, 97.7, datetime('now', '-2 hours')),
('GPS-BLOCK3', 88.2, 98, -50.2, 97.9, datetime('now', '-3 hours')),
('LANDSAT-9', 82.0, 90, -20.0, 96.5, datetime('now', '-1 hour')),
('LANDSAT-9', 81.5, 89, -19.8, 96.4, datetime('now', '-2 hours')),
('LANDSAT-9', 82.5, 91, -20.2, 96.6, datetime('now', '-3 hours')),
('HUBBLE', 78.0, 88, -40.0, 94.2, datetime('now', '-1 hour')),
('HUBBLE', 77.5, 87, -39.8, 94.1, datetime('now', '-2 hours')),
('HUBBLE', 78.2, 89, -40.2, 94.3, datetime('now', '-3 hours')),
('ROS', 80.0, 91, 18.5, 95.8, datetime('now', '-1 hour')),
('GALILEO-5', 86.0, 94, -45.0, 98.1, datetime('now', '-1 hour')),
('CARTOSAT-3', 75.0, 87, -15.0, 93.5, datetime('now', '-1 hour'));
