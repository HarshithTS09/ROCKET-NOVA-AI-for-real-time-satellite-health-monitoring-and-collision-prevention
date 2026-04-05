# Database Schema Design

## Core Tables

### 1. satellites
```sql
CREATE TABLE satellites (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agency VARCHAR(100),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    health DECIMAL(5,2),
    battery DECIMAL(5,2),
    fuel DECIMAL(5,2),
    temperature DECIMAL(5,2),
    speed DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. orbital_data
```sql
CREATE TABLE orbital_data (
    id SERIAL PRIMARY KEY,
    satellite_id VARCHAR(50) REFERENCES satellites(id) ON DELETE CASCADE,
    altitude DECIMAL(10,2),
    inclination DECIMAL(5,2),
    ra_of_ascension DECIMAL(8,4),
    eccentricity DECIMAL(10,8),
    mean_anomaly DECIMAL(8,4),
    mean_motion DECIMAL(12,8),
    epoch TIMESTAMP,
    tle_line1 TEXT,
    tle_line2 TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. positions
```sql
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    satellite_id VARCHAR(50) REFERENCES satellites(id) ON DELETE CASCADE,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    altitude_km DECIMAL(8,2),
    velocity_km_s DECIMAL(10,6),
    footprint_km DECIMAL(8,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for time-range queries
CREATE INDEX idx_positions_satellite_time ON positions(satellite_id, timestamp DESC);
```

### 4. telemetry_history
```sql
CREATE TABLE telemetry_history (
    id SERIAL PRIMARY KEY,
    satellite_id VARCHAR(50) REFERENCES satellites(id) ON DELETE CASCADE,
    battery DECIMAL(5,2),
    signal_strength DECIMAL(5,2),
    temperature DECIMAL(5,2),
    health DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for time-series analysis
CREATE INDEX idx_telemetry_satellite_time ON telemetry_history(satellite_id, timestamp DESC);
```

### 5. missions
```sql
CREATE TABLE missions (
    id SERIAL PRIMARY KEY,
    satellite_id VARCHAR(50) REFERENCES satellites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. alerts
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    satellite_id VARCHAR(50) REFERENCES satellites(id) ON DELETE CASCADE,
    type VARCHAR(100),
    severity VARCHAR(50),
    message TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_satellite_unresolved ON alerts(satellite_id) WHERE resolved = FALSE;
```

## Setup Commands (PostgreSQL)

```bash
# 1. Install PostgreSQL
# Windows: Download from postgresql.org
# Linux: sudo apt-get install postgresql
# macOS: brew install postgresql

# 2. Start PostgreSQL
# Windows: Service starts automatically
# Linux: sudo systemctl start postgresql
# macOS: brew services start postgresql

# 3. Create database
createdb satellite_tracking

# 4. Run schema
psql satellite_tracking < database/schema.sql

# 5. (Optional) Enable PostGIS for geospatial queries
CREATE EXTENSION postgis;
```

## Environment Variables

Add to your `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/satellite_tracking
# or for SQLite:
# DATABASE_URL=sqlite:./data/satellites.db
```

## Recommendation for Tech Stack

Given your React frontend, use:
- **Prisma** ORM for type-safe database access
- **PostgreSQL** as the database
- Connection library: `pg` (node-postgres) or via Prisma

Would you like me to:
1. Set up a complete database schema with Prisma?
2. Create migration files?
3. Build API endpoints to connect your React app to the database?
