# Backend API Server

Express.js + SQLite backend for Satellite Tracking Dashboard

## Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── init.js        # Database initialization
│   │   └── schema.sql     # Table definitions
│   └── server/
│       └── index.js       # Express API server
├── data/
│   └── satellites.db      # SQLite database file
├── package.json
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Start server
node src/server/index.js

# Or use npm script
npm start
```

Server runs on **http://localhost:3001**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/satellites` | List all satellites (supports ?search, ?type, ?agency, ?sortBy) |
| GET    | `/api/satellites/:id` | Get single satellite by ID |
| GET    | `/api/satellites/:id/telemetry` | Get telemetry history |
| GET    | `/api/satellites/:id/positions` | Get position history |
| GET    | `/api/satellites/:id/missions` | Get satellite missions |
| POST   | `/api/satellites/:id/telemetry` | Add new telemetry reading |
| GET    | `/api/agencies` | List all agencies |
| GET    | `/api/health` | Health check |

## Query Parameters (for /api/satellites)

- `search` - Search by name or ID
- `type` - Filter by type (comm, gps, earth, science, starlink)
- `agency` - Filter by agency (NASA, SPACEX, ESA, ISRO, OTHER)
- `sortBy` - Sort field (id, health, altitude)

## Database Schema

- **satellites** - Main satellite metadata
- **orbital_data** - TLE and orbital parameters
- **positions** - Historical position tracking
- **telemetry_history** - Time-series telemetry data
- **missions** - Satellite missions
- **alerts** - System alerts

## Example Request

```javascript
// Fetch all satellites
fetch('http://localhost:3001/api/satellites')
  .then(res => res.json())
  .then(data => console.log(data));

// Filter by agency
fetch('http://localhost:3001/api/satellites?agency=NASA')
  .then(res => res.json())
  .then(data => console.log(data));
```

## Integration with Frontend

Update your React app's API calls to point to `http://localhost:3001` instead of N2YO API.

Example in `useTelemetry.jsx`:
```javascript
const response = await fetch('http://localhost:3001/api/satellites');
const data = await response.json();
```
