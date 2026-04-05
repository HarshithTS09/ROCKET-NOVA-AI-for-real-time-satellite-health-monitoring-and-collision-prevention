# SGP4 Implementation - Quick Start

## ✅ What's Ready

Your mission control dashboard now has **real orbital propagation** using SGP4!

### Current Status:
- ✔️ Backend SGP4 service created
- ✔️ Position API endpoint: `/api/satellites/:id/position`
- ✔️ 275 of 349 satellites have TLE data (~79%)
- ✔️ Frontend uses SGP4 positions automatically
- ✔️ All your 349 satellites are **preserved** (none removed)

---

## 🚀 How to Run

### 1. Start Backend
```bash
cd backend
npm start
```
Expected output:
```
✅ Database initialized: satellites.db
🚀 Backend server running on http://localhost:3002
📡 API endpoints:
   GET    /api/satellites
   GET    /api/satellites/:id
   GET    /api/satellites/:id/position   <-- NEW SGP4 endpoint
   ...
```

### 2. Start Frontend (in another terminal)
```bash
npm run dev
```
Open http://localhost:5173

### 3. See SGP4 in Action
- **Dashboard**: Positions now reflect real orbital mechanics (not random)
- **Satellite Fleet**: Cards show accurate lat/lng for 275 satellites
- **Click any satellite**: Detailed view uses SGP4-computed position

---

## 📈 Verification

### Check TLE Coverage
```bash
cd backend
node -e "const db = require('./src/database/init.js'); const c = db.prepare('SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL').get().c; const t = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c; console.log('TLEs:', c, '/', t, '(', (c/t*100).toFixed(1), '%)');"
```
Expected: `TLEs: 275 / 349 (78.8%)` (or higher if you ran N2YO importer)

### Test SGP4 API
```bash
curl http://localhost:3002/api/satellites/CEL-25544/position
```
Should return:
```json
{
  "latitude": 51.6,
  "longitude": -23.5,
  "altitude": 408.2,
  "velocity": 7.66,
  "timestamp": "2025-04-01T...",
  "satelliteId": "CEL-25544"
}
```

---

## 🔧 Troubleshooting

### "No TLE data for satellite"
- This is expected for the ~74 satellites without TLEs (defunct, classified, too new)
- They'll show random/fallback positions
- To fix: Run N2YO importer (requires API key) or add manual TLEs

### Backend fails to start
- Ensure `satellite.js` is installed: `cd backend && npm install`
- Check database exists: `backend/data/satellites.db`
- Look for errors in console

### Frontend shows random positions still
- Check browser dev tools (F12) → Network tab
- Verify calls to `/api/satellites/:id/position` succeed (200)
- If 400/500 errors, backend may have crashed or missing TLE

### Too many parallel requests (warning)
- Frontend makes ~349 position requests on load (one per satellite)
- This is heavy but currently unavoidable
- Future fix: Batch endpoint or server-side caching

---

## 📦 What Changed

### New Files
- `backend/src/services/sgp4Service.js` - SGP4 propagation logic (async, ESM-compatible)
- `backend/scripts/import-tle-text.js` - Import TLE data from Celestrak
- `backend/scripts/import-tle-n2yo.js` - Fetch missing TLEs from N2YO (optional)
- `SGP4_IMPLEMENTATION.md` - Full documentation

### Modified Files
- `backend/src/server/index.js` - Added `/api/satellites/:id/position` endpoint
- `src/hooks/useBackendData.jsx` - Uses SGP4 positions for satellites with TLEs
- `src/hooks/useTelemetry.jsx` - Uses SGP4 in detailed satellite view

### Database
- `orbital_data.tle_line1`, `tle_line2` - Now populated for 275 satellites
- No data loss - all 349 satellite records intact

---

## 🎯 Next Steps (Optional)

### 1. Improve TLE Coverage (recommended)
Get the remaining ~74 satellites:
```bash
# Set your N2YO API key in backend/.env
echo "N2YO_API_KEY=your_key_here" > backend/.env

# Run N2YO importer
cd backend
node scripts/import-tle-n2yo.js
```

### 2. Test SGP4 Accuracy
- Pick ISS (should be accurate)
- Compare to real ISS position: https://spotthestation.nasa.gov/tracking_map.cfm
- Should be within a few km

### 3. Performance Optimization
Consider:
- Batch position endpoint
- Server-side 60s cache
- Only compute positions for visible satellites

### 4. Enable Collision Detection
Use accurate SGP4 positions to compute conjunction risks between satellites.

---

## 📚 Technical Details

See **SGP4_IMPLEMENTATION.md** for:
- Architecture diagram
- API reference
- Complete file listing
- Future enhancement ideas

---

**Enjoy accurate orbital mechanics!** 🛰️

Any issues? Check that all 349 satellites still exist in the database:
```bash
cd backend
node -e "const db = require('./src/database/init.js'); console.log('Satellites:', db.prepare('SELECT COUNT(*) as c FROM satellites').get().c);"
```
