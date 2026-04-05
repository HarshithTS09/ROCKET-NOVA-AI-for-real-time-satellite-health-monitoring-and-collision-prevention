# SGP4 Orbital Propagation Implementation

## ✅ What Was Done

### 1. Backend SGP4 Service
- **Added**: `backend/src/services/sgp4Service.js`
- **Function**: Uses `satellite.js` to propagate satellite positions from TLE data
- **Endpoint**: `GET /api/satellites/:id/position` (uses SGP4, returns lat/lng/altitude/velocity)

### 2. TLE Data Import
- **Created**: `backend/scripts/import-tle-text.js`
- **Sources**: Celestrak (starlink, gps-ops, weather, noaa groups)
- **Result**: **275 out of 349 satellites** (78.8%) now have real TLE data
- **Database**: Updated `orbital_data` table with `tle_line1` and `tle_line2` (the actual TLE text needed for SGP4)

### 3. Frontend Integration
- **Updated**: `src/hooks/useBackendData.jsx`
  - Fetches propagated positions via `/api/satellites/:id/position` for satellites with TLEs
  - Replaces random fallback positions with **accurate SGP4-computed positions**
  - Falls back gracefully if SGP4 fails

- **Updated**: `src/hooks/useTelemetry.jsx`
  - Uses SGP4 to get real-time position in detailed satellite view
  - Backward compatible with fallback positions

---

## 📊 Current Coverage

| Metric | Value |
|--------|-------|
| Total satellites in DB | 349 |
| Satellites with TLE data | 275 (78.8%) |
| SGP4-capable satellites | 275 |
| Fallback (random/DB) | 74 |

---

## 🚀 How It Works

1. **Backend** on `/api/satellites` query:
   - Joins `satellites` with `orbital_data`
   - Returns TLE lines in the response (`tle_line1`, `tle_line2`)

2. **Frontend** `useBackendData` hook:
   - For each satellite with TLE → calls `/api/satellites/:id/position`
   - Backend uses `satellite.js` SGP4 to compute position at current time
   - Returns accurate lat/lng/altitude/velocity
   - For satellites without TLE → uses stored DB position or random fallback

3. **Collision Detection** (future):
   - All SGP4 satellites can have accurate conjunction analysis
   - Positions reflect real orbital mechanics (not random walks)

---

## 📦 Files Modified/Created

| File | Change |
|------|--------|
| `backend/package.json` | Already had `satellite.js` |
| `backend/src/services/sgp4Service.js` | NEW - SGP4 propagation logic |
| `backend/src/server/index.js` | Added `/api/satellites/:id/position` endpoint |
| `backend/scripts/import-tle-text.js` | NEW - Bulk TLE import from Celestrak |
| `backend/scripts/import-tle-n2yo.js` | NEW (optional) - Fetch missing TLEs from N2YO |
| `src/hooks/useBackendData.jsx` | UPDATED - SGP4 position integration |
| `src/hooks/useTelemetry.jsx` | UPDATED - SGP4 for detailed view |

---

## 🔧 How to Run

1. **Import TLEs** (already done):
   ```bash
   cd backend
   node scripts/import-tle-text.js
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:3002
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   # Vite runs on http://localhost:5173
   ```

4. **View Dashboard**:
   - Open http://localhost:5173
   - Satellites with TLEs will show **real SGP4 positions**
   - No more random positions!

---

## 🎯 What to Expect

### Dashboard
- Total Satellites: 349
- System Health: average of all satellites
- Positions: **Real-time SGP4** for 275 satellites
- 74 satellites may show random or stored positions (no TLE yet)

### Satellite Fleet Page
- Grid of all satellites (paginated/filterable)
- Cards show:
  - Position (lat/lng) from SGP4 (for TLE satellites)
  - Altitude from SGP4 propagation
  - Speed from SGP4 propagation

### Satellite Details Modal
- Click any satellite → detailed view
- Telemetry charts (battery, signal, temperature)
- Position: **SGP4-computed** if TLE available

---

## 📈 Next Steps (Optional Improvements)

### 1. Get TLEs for Remaining 74 Satellites
- Run N2YO importer (requires API key):
  ```bash
  N2YO_API_KEY=your_key node scripts/import-tle-n2yo.js
  ```
- Or manually add TLEs for specific objects

### 2. Performance Optimization
- Current: Frontend makes **349 parallel requests** for positions (inefficient)
- Better: Batch endpoint: `GET /api/satellites/positions?ids=id1,id2,...`
- Or cache positions server-side (update every 30-60 seconds)

### 3. Position History
- Store SGP4-computed positions over time in `positions` table
- Create trend charts showing ground tracks
- Enable historical playback

### 4. Collision Detection
- Use SGP4 positions + TLE uncertainty ellipsoids
- Compute closest approaches between pairs
- Alert on conjunction risks

### 5. 3D Visualization
- Use SGP4 to compute positions at specific times
- Animate satellite orbits on 3D globe
- Show ground tracks and footprints

---

## 🐛 Known Issues

| Issue | Status |
|-------|--------|
| 74 satellites missing TLEs | ⚠️ Use N2YO or manual entry |
| Frontend makes many position requests | ⚠️ Add batching or caching |
| TLE import bug with empty string check | ✅ Fixed in updated script |
| SGP4 may fail for very old TLEs | ⚠️ Fallback to DB position works |

---

## 🔗 API Reference

### New Endpoint
**GET** `/api/satellites/:id/position?at=2025-04-01T12:00:00Z`

**Response**:
```json
{
  "latitude": 51.6,
  "longitude": -23.5,
  "altitude": 408.2,
  "velocity": 7.66,
  "timestamp": "2025-04-01T12:00:00.000Z",
  "satelliteId": "ISS"
}
```

**Errors**:
- `404` if satellite not found
- `400` if no TLE data
- `500` if SGP4 propagation fails

---

## ✅ Verification

Check coverage:
```bash
cd backend
node -e "const db = require('./src/database/init.js'); const c = db.prepare('SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL').get().c; const t = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c; console.log(c, '/', t)"
```

Expected output: `275 / 349` (or higher if you ran N2YO importer)

---

Enjoy accurate orbital mechanics! 🛰️
