# Complete Setup Guide - SQLite Backend

## Overview

Your satellite tracking app now has a **backend** folder with an SQLite database and Express API server.

## Project Structure

```
demo/
├── backend/                    # NEW: Backend API + SQLite database
│   ├── src/
│   │   ├── database/
│   │   │   ├── init.js        # Database initialization
│   │   │   └── schema.sql     # SQL schema + sample data
│   │   └── server/
│   │       └── index.js       # Express API server
│   ├── data/
│   │   └── satellites.db      # SQLite database (auto-created)
│   ├── package.json
│   └── README.md              # Backend documentation
├── src/
│   └── hooks/
│       └── useTelemetry.jsx   # Updated to use backend automatically
├── .env                       # Updated with VITE_BACKEND_URL
└── ...
```

## Quick Start (2 Steps)

### Step 1: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Database initialized: satellites.db
🚀 Backend server running on http://localhost:3002
📡 API endpoints:
   GET    /api/satellites
   GET    /api/satellites/:id
   ...
```

The server runs on **port 3002** (to avoid conflicts with frontend).

### Step 2: Start the Frontend

```bash
# In a new terminal (keep backend running)
npm run dev
```

Open browser to **http://localhost:5173** (or the Vite port shown).

That's it! Your app now uses SQLite data from the backend.

## What's Included

### Backend Features
- ✅ SQLite database with 8 sample satellites (including ISS)
- ✅ REST API with CORS enabled
- ✅ Automatic database initialization
- ✅ Sample orbital data for ISS
- ✅ Ready-to-use endpoints

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/satellites` | GET | List all satellites (with filters) |
| `/api/satellites/:id` | GET | Get single satellite details |
| `/api/satellites/:id/telemetry` | GET | Get historical telemetry |
| `/api/satellites/:id/positions` | GET | Get position history |
| `/api/satellites/:id/missions` | GET | Get satellite missions |
| `/api/satellites/:id/telemetry` | POST | Add new telemetry reading |
| `/api/agencies` | GET | List all agencies |
| `/api/health` | GET | Server health check |

### Query Parameters for `/api/satellites`
- `?search=text` - Search by name or ID
- `?type=comm` - Filter by type (comm, gps, earth, science, starlink)
- `?agency=NASA` - Filter by agency
- `?sortBy=health` - Sort by health, altitude, or id

## Switching Between Backend and N2YO

The app automatically uses the backend if `VITE_BACKEND_URL` is set in `.env`.

**To use N2YO API instead:**
1. Comment out or remove `VITE_BACKEND_URL` from `.env`
2. Ensure `N2YO_API_KEY` is set
3. Restart frontend

## Adding More Sample Data

Edit `backend/src/database/schema.sql` to add more satellites:

```sql
INSERT OR REPLACE INTO satellites (id, name, agency, type, status, health, battery, fuel, temperature, speed) VALUES
('NEW-SAT-1', 'My Satellite', 'NASA', 'science', 'active', 95.0, 80.0, 85.0, 25.0, 0.0070);
```

Then recreate the database:
```bash
rm backend/data/satellites.db
cd backend
node src/database/init.js
```

## Database Schema

### Main Tables
- **satellites** - Satellite metadata (name, agency, status, telemetry)
- **orbital_data** - TLE and orbital parameters
- **positions** - Historical positions
- **telemetry_history** - Time-series telemetry data
- **missions** - Mission assignments
- **alerts** - System alerts

See `backend/src/database/schema.sql` for full schema.

## Troubleshooting

**Port 3002 already in use:**
```bash
# Change the port in backend/src/server/index.js
const PORT = 3003;  // or any free port
# Also update .env: VITE_BACKEND_URL=http://localhost:3003
```

**Database errors:**
```bash
cd backend
rm -rf data/
node src/database/init.js
```

**Backend not connecting:**
- Verify backend is running: `curl http://localhost:3002/api/health`
- Check console for CORS errors
- Ensure `.env` has `VITE_BACKEND_URL=http://localhost:3002`

## Next Steps

Customize your backend:

1. **Add real-time telemetry simulation:**
   - Create a script that periodically updates `telemetry_history`
   - Call `POST /api/satellites/:id/telemetry`

2. **Add authentication:**
   - Implement API key middleware
   - Add user management

3. **Add collision detection:**
   - Calculate close approaches in backend
   - Populate `alerts` table

4. **Deploy:**
   - Use `pm2` to run backend as service
   - Consider PostgreSQL for production
   - Add HTTPS with nginx reverse proxy

## Need Help?

- Backend docs: `backend/README.md`
- API test: `curl http://localhost:3002/api/satellites`
- Database view: Download [DB Browser for SQLite](https://sqlitebrowser.org/) and open `backend/data/satellites.db`
