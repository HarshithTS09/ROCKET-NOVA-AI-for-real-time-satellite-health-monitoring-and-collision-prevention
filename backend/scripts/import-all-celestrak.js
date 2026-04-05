const https = require('https');
const db = require('../src/database/init');

// Celestrak sources - all active satellites
const CELESTRAK_SOURCES = [
  'https://celestrak.org/NORAD/elements/active.txt', // Master active list
];

// Additional category-specific sources (optional)
const CATEGORY_SOURCES = [
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=goes&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=resource&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=misc&FORMAT=tle',
];

/**
 * Fetch TLE data from URL
 */
function fetchTleData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse TLE text format (3-line entries)
 * Returns Map: noradId -> { name, line1, line2 }
 */
function parseTleText(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
  const satellites = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // TLE format: line 1 starts with '1 ' and line 2 starts with '2 '
    // But active.txt may have name as first line, then 1, then 2
    if (line.startsWith('1 ') && i + 1 < lines.length && lines[i+1].startsWith('2 ')) {
      // Name is the line before '1 ' (or the line itself if format is different)
      let name = '';
      if (i > 0 && !lines[i-1].startsWith('1 ') && !lines[i-1].startsWith('2 ')) {
        name = lines[i-1];
      } else if (line.length > 50) {
        // Sometimes the name is concatenated or the format is different
        name = 'Unknown';
      } else {
        name = line; // Use line1 as fallback name
      }

      const line1 = line;
      const line2 = lines[i+1];

      // Extract NORAD ID from line1 (positions 3-7, zero-padded)
      const noradId = line1.substring(2, 7).trim();

      if (noradId && /^\d+$/.test(noradId)) {
        satellites.set(noradId, {
          name: name.length > 80 ? name.substring(0, 80) : name,
          line1,
          line2,
          noradId: parseInt(noradId, 10)
        });
      }

      i += 1; // Skip line2
    }
  }

  return satellites;
}

/**
 * Detect agency from satellite name
 */
function detectAgency(name) {
  const upperName = name.toUpperCase();
  if (upperName.includes('STARLINK') || upperName.includes('SPACEX')) return 'SPACEX';
  if (upperName.includes('ISS') || upperName.includes('NASA') || upperName.includes('HST') ||
      upperName.includes('TDRS') || upperName.includes('LANDSAT') || upperName.includes('SWIFT')) return 'NASA';
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR')) return 'USSF';
  if (upperName.includes('GLONASS')) return 'RUSSIA';
  if (upperName.includes('BEIDOU')) return 'CHINA';
  if (upperName.includes('ESA') || upperName.includes('ENVISAT') || upperName.includes('GOCE')) return 'ESA';
  if (upperName.includes('CARTOSAT') || upperName.includes('ISRO') || upperName.includes('RESOURCESAT')) return 'ISRO';
  if (upperName.includes('ONEWEB')) return 'ONEWEB';
  if (upperName.includes('IRIDIUM')) return 'IRIDIUM';
  return 'OTHER';
}

/**
 * Determine satellite type
 */
function determineSatelliteType(name) {
  const upperName = name.toUpperCase();
  if (upperName.includes('STARLINK')) return 'starlink';
  if (upperName.includes('GPS') || upperName.includes('NAVSTAR')) return 'gps';
  if (upperName.includes('LANDSAT') || upperName.includes('EARTH') || upperName.includes('RESOURCE')) return 'earth';
  if (upperName.includes('HUBBLE') || upperName.includes('SWIFT') || upperName.includes('SCIENCE')) return 'science';
  if (upperName.includes('IRIDIUM') || upperName.includes('COMM')) return 'comm';
  if (upperName.includes('WEATHER') || upperName.includes('METOP') || upperName.includes('NOAA')) return 'earth';
  return 'other';
}

/**
 * Extract orbital elements from TLE (for altitude/speed calculation)
 */
function extractElementsFromTLE(line1, line2) {
  try {
    // Line 2 fields (space-separated):
    // 0: "2"
    // 1: NORAD ID
    // 2: inclination (degrees)
    // 3: RAAN (degrees)
    // 4: eccentricity (with decimal removed, e.g., 0003181 = 0.0003181)
    // 5: arg of perigee (degrees)
    // 6: mean anomaly (degrees)
    // 7: mean motion (revs/day)
    // 8: revolution number at epoch

    const parts2 = line2.split(/\s+/);
    const inclination = parseFloat(parts2[2]);
    const eccentricity = parseFloat('0.' + parts2[4]);
    const meanMotion = parseFloat(parts2[7]);

    // Calculate altitude from mean motion
    const GM = 398600.4418; // km^3/s^2
    const earthRadius = 6371; // km
    const n_rad_per_sec = (meanMotion * 2 * Math.PI) / 86400;
    const a = Math.pow(GM / (n_rad_per_sec * n_rad_per_sec), 1/3);
    const altitude = a - earthRadius;

    // Orbital velocity (circular approximation)
    const velocity = Math.sqrt(GM / a);

    return {
      inclination,
      eccentricity,
      meanMotion,
      altitude: Math.max(0, altitude),
      velocity
    };
  } catch (e) {
    return { altitude: 0, velocity: 0 };
  }
}

/**
 * Main import: add ALL Celestrak satellites to database
 */
async function importAllFromCelestrak() {
  try {
    console.log('🚀 Fetching ALL active satellites from Celestrak...\n');

    const allTles = new Map();

    // Fetch primary active list
    console.log('Downloading active.txt...');
    const activeText = await fetchTleData(CELESTRAK_SOURCES[0]);
    const activeTles = parseTleText(activeText);
    console.log(`   Parsed ${activeTles.size} TLEs from active.txt`);

    for (const [id, tle] of activeTles) {
      allTles.set(id, tle);
    }

    // Fetch additional categories (optional - can comment out to skip)
    console.log('\nFetching category-specific TLEs...');
    for (const url of CATEGORY_SOURCES) {
      try {
        const groupName = new URL(url).searchParams.get('GROUP');
        const text = await fetchTleData(url);
        const parsed = parseTleText(text);
        console.log(`   ${groupName}: ${parsed.size} TLEs`);

        for (const [id, tle] of parsed) {
          allTles.set(id, tle); // Overwrite with latest
        }
      } catch (error) {
        console.warn(`   Failed to fetch ${url}: ${error.message}`);
      }
    }

    console.log(`\n📊 Total unique TLEs collected: ${allTles.size}\n`);

    // Get existing satellites to avoid duplicates
    const existing = db.prepare('SELECT id FROM satellites').all();
    const existingIds = new Set(existing.map(s => s.id));

    let added = 0;
    let updated = 0;
    const skipped = [];

    // Iterate through ALL Celestrak TLEs
    for (const [noradId, tle] of allTles) {
      const satId = `CEL-${noradId}`;

      // Skip if already exists (we'll update TLEs separately)
      if (existingIds.has(satId)) {
        // Update orbital_data with TLE lines
        const existingTle = db.prepare('SELECT tle_line1 FROM orbital_data WHERE satellite_id = ?').get(satId);
        if (!existingTle || !existingTle.tle_line1) {
          db.prepare(`
            UPDATE orbital_data SET tle_line1 = ?, tle_line2 = ? WHERE satellite_id = ?
          `).run(tle.line1, tle.line2, satId);
          updated++;
        }
        continue;
      }

      // NEW SATELLITE: Create record
      try {
        const elements = extractElementsFromTLE(tle.line1, tle.line2);
        const agency = detectAgency(tle.name);
        const type = determineSatelliteType(tle.name);
        const baseHealth = agency === 'NASA' || agency === 'ESA' ? 92 + Math.random() * 7 : 85 + Math.random() * 14;
        const status = baseHealth > 95 ? 'active' : baseHealth > 85 ? 'warning' : 'critical';

        // Insert satellite
        db.prepare(`
          INSERT INTO satellites (
            id, name, agency, type, status, health, battery, fuel, temperature, speed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          satId,
          tle.name,
          agency,
          type,
          status,
          parseFloat(baseHealth.toFixed(1)),
          parseFloat((70 + Math.random() * 25).toFixed(1)),
          parseFloat((60 + Math.random() * 35).toFixed(1)),
          parseFloat((-20 + Math.random() * 40).toFixed(1)),
          parseFloat(elements.velocity.toFixed(3))
        );

        // Insert orbital_data
        db.prepare(`
          INSERT INTO orbital_data (
            satellite_id, altitude, inclination, ra_of_ascension, eccentricity,
            mean_anomaly, mean_motion, epoch, tle_line1, tle_line2
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          satId,
          parseFloat(elements.altitude.toFixed(2)),
          parseFloat(elements.inclination),
          parseFloat(0), // RAAN not easily extracted without full TLE parse
          parseFloat(elements.eccentricity),
          parseFloat(0), // Mean anomaly
          parseFloat(elements.meanMotion),
          new Date().toISOString(),
          tle.line1,
          tle.line2
        );

        // Seed initial position (will be replaced by SGP4)
        const lat = (Math.random() - 0.5) * 140;
        const lng = (Math.random() - 0.5) * 360;
        db.prepare(`
          INSERT INTO positions (satellite_id, latitude, longitude, altitude_km, velocity_km_s, footprint_km)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          satId,
          parseFloat(lat.toFixed(6)),
          parseFloat(lng.toFixed(6)),
          parseFloat(elements.altitude.toFixed(2)),
          parseFloat(elements.velocity.toFixed(3)),
          2500
        );

        added++;
        if (added % 500 === 0) {
          console.log(`   Progress: +${added} new satellites...`);
        }

      } catch (err) {
        skipped.push(`${satId}: ${err.message}`);
        if (skipped.length <= 5) {
          console.warn(`   Failed to add ${satId}: ${err.message}`);
        }
      }
    }

    // Summary
    console.log('\n✅ Import complete!\n');
    console.log(`   New satellites added: ${added}`);
    console.log(`   Existing satellites updated with TLE: ${updated}`);
    console.log(`   Total skipped/errors: ${skipped.length}\n`);

    const totalSats = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c;
    const tleCount = db.prepare("SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL AND tle_line1 != ''").get().c;
    console.log(`📊 Database now has:`);
    console.log(`   Total satellites: ${totalSats}`);
    console.log(`   With TLE data: ${tleCount} (${(tleCount/totalSats*100).toFixed(1)}%)`);
    console.log(`   SGP4 ready: ${tleCount} satellites ✅\n`);

    if (skipped.length > 0) {
      console.log(`First ${Math.min(5, skipped.length)} errors:`);
      skipped.slice(0, 5).forEach(err => console.log(`   - ${err}`));
      if (skipped.length > 5) console.log(`   ... and ${skipped.length - 5} more`);
    }

    db.close();
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    db.close();
    process.exit(1);
  }
}

importAllFromCelestrak();
