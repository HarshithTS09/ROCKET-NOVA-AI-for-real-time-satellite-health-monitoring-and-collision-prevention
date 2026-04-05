# How to Import Satellite Data & TLEs

## Current Status
- **Total satellites**: 359
- **With TLE data**: 285 (79.4%)
- **SGP4 ready**: 285 satellites

---

## JSON Catalog Import (Space-Track Format)

You provided a JSON catalog with orbital elements. I've created an importer for it.

### Usage

1. **Prepare your JSON file** - Should be an array of satellite objects with these fields:
   - `OBJECT_NAME`
   - `OBJECT_ID`
   - `EPOCH`
   - `MEAN_MOTION`
   - `ECCENTRICITY`
   - `INCLINATION`
   - `RA_OF_ASC_NODE`
   - `ARG_OF_PERICENTER`
   - `MEAN_ANOMALY`
   - `NORAD_CAT_ID`
   - `BSTAR`
   - `MEAN_MOTION_DOT`
   - `MEAN_MOTION_DDOT`
   - `ELEMENT_SET_NO` (optional, default: 999)
   - `EPHEMERIS_TYPE` (optional, default: 0)
   - `REV_AT_EPOCH`

2. **Save to**: `backend/data/catalog.json` (or any path)

3. **Run**:
```bash
cd backend
node scripts/import-json-tle.js path/to/your-catalog.json
```

### Example
```bash
node scripts/import-json-tle.js ../data/my-full-catalog.json
```

### What it does:
- Creates satellite records with IDs like `CAT-{NORAD_ID}`
- Reconstructs **valid TLE lines** from the orbital elements
- Populates `orbital_data` with real TLE data
- Generates realistic telemetry (health, battery, etc.)

---

## Celestrak Bulk Import (All Active Satellites)

For thousands of active satellites:

```bash
cd backend
node scripts/import-tle-text.js
```

This downloads TLEs from Celestrak's active satellite groups and matches them to your database.

**Note**: Only Celestrak TLEs matching your satellite IDs (by NORAD number) will be imported.

---

## N2YO API Import (For Missing Satellites)

If you have an N2YO API key, fetch TLEs for satellites that didn't match Celestrak:

1. **Add API key** to `backend/.env`:
```
N2YO_API_KEY=your_key_here
```

2. **Run**:
```bash
cd backend
node scripts/import-tle-n2yo.js
```

This will:
- Find all satellites without TLEs
- Try to fetch TLE from N2YO using NORAD ID
- Update approximately 50-100 satellites per 1000 API calls (rate limited)

---

## Verification

Check how many satellites have TLEs:

```bash
cd backend
node -e "const db = require('./src/database/init.js'); const tle = db.prepare(\"SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL AND tle_line1 != ''\").get().c; const total = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c; console.log('TLE Coverage:', tle + '/' + total + ' (' + (tle/total*100).toFixed(1) + '%)');"
```

Expected: `TLE Coverage: 285 / 359 (79.4%)` or higher

---

## Your JSON Data

You shared: `[{"OBJECT_NAME":"CALSPHERE 1","OBJECT_ID":"1964-063C",...}]`

This has been saved to `backend/data/catalog.json` (10 sample satellites).

If you have a **full catalog** (thousands of satellites), replace that file with your complete JSON and re-run:
```bash
cd backend
node scripts/import-json-tle.js data/catalog.json
```

The importer will:
- Skip already-imported satellites (uses INSERT OR REPLACE)
- Add new ones with proper TLE lines
- Update coverage percentage

---

## TLE Format Explanation

The importer **reconstructs TLE lines** from orbital elements. Example output:

```
1 68040U 26041A   26091.16621301  .00292100  00000+0  18388-2 0  9992
2 68040  53.1564 310.2214 0003181 178.1920 181.9112 15.75310189  4768
```

Line 1 contains: NORAD ID, epoch, drag terms
Line 2 contains: inclination, RAAN, eccentricity, arg perigee, mean anomaly, mean motion, rev number

These are **fully functional TLEs** that work with `satellite.js` SGP4 propagation.

---

## Summary of Import Scripts

| Script | Source | Purpose |
|--------|--------|---------|
| `import-tle-text.js` | Celestrak | Bulk import all active satellites from multiple Celestrak groups |
| `import-json-tle.js` | JSON file | Import Space-Track format catalog (what you provided) |
| `import-tle-n2yo.js` | N2YO API | Fetch missing TLEs one-by-one (requires API key) |
| `import-celestrak.js` | Celestrak JSON | Original importer (does NOT store TLE lines - only elements) |

**Only** `import-json-tle.js` and `import-tle-text.js` store actual TLE lines for SGP4.

---

## Getting More TLEs

### Option 1: Space-Track.org (Recommended)
- Register free account at https://www.space-track.org
- Query all active satellites:
  ```
  https://www.space-track.org/basicspacedata/query/class/tle/NORAD_CAT_ID/~/EPOCH/~/orderby/EPOCH%20desc/format/json
  ```
- Save response as `full-catalog.json`
- Import with `import-json-tle.js`

### Option 2: Celestrak Active Only
Already done - gives you ~10,000 TLEs but only matches your DB by NORAD ID.

### Option 3: Manual Entry
Add TLEs directly to `orbital_data` table for specific satellites.

---

## Next Steps

1. Get your **full catalog JSON** from Space-Track or other source
2. Place in `backend/data/`
3. Run the appropriate importer
4. Restart backend server
5. Frontend will automatically use SGP4 for all satellites with TLEs

---

**Questions?** Check that TLEs are stored:
```bash
cd backend
sqlite3 data/satellites.db "SELECT satellite_id, tle_line1 FROM orbital_data WHERE tle_line1 IS NOT NULL LIMIT 3;"
```
