const https = require('https');
const db = require('../src/database/init');

const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=json';

function fetchCelestrakData() {
  return new Promise((resolve, reject) => {
    https.get(CELESTRAK_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const satellites = JSON.parse(data);
          resolve(satellites);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function detectAgency(objectName) {
  const name = objectName.toUpperCase();

  if (name.includes('STARLINK') || name.includes('SPACEX')) return 'SPACEX';
  if (name.includes('ISS') || name.includes('NOAA') || name.includes('GOES') || name.includes('HST') ||
      name.includes('TDRS') || name.includes('LANDSAT') || name.includes('SWIFT') || name.includes('NASA')) return 'NASA';
  if (name.includes('GPS') || name.includes('NAVSTAR')) return 'USSF';
  if (name.includes('GLONASS')) return 'RUSSIA';
  if (name.includes('BEIDOU')) return 'CHINA';
  if (name.includes('ESA') || name.includes('ENVISAT') || name.includes('METOP') ||
      name.includes('SENTINEL') || name.includes('GOCE')) return 'ESA';
  if (name.includes('CARTOSAT') || name.includes('IRS') || name.includes('RISAT') ||
      name.includes('NAVIC') || name.includes('GSAT') || name.includes('ISRO')) return 'ISRO';
  if (name.includes('ONEWEB')) return 'ONEWEB';
  if (name.includes('IRIDIUM')) return 'IRIDIUM';

  // Determine by OBJECT_ID prefix
  if (objectName.includes('2026-041')) return 'SPACEX'; // Starlink group
  if (objectName.includes('2026-040')) return 'SPACEX'; // Another Starlink

  return 'OTHER';
}

function determineSatelliteType(objectName) {
  const name = objectName.toUpperCase();
  if (name.includes('STARLINK')) return 'starlink';
  if (name.includes('GPS') || name.includes('NAVSTAR')) return 'gps';
  if (name.includes('LANDSAT') || name.includes('EARTH') || name.includes('EYESAT') ||
      name.includes('COSMO') || name.includes('KARMO')) return 'earth';
  if (name.includes('HUBBLE') || name.includes('SWIFT') || name.includes('XMM') ||
      name.includes('CHANDRA') || name.includes('INTEGRAL')) return 'science';
  if (name.includes('IRIDIUM') || name.includes('GLOBALSTAR') || name.includes('COMM')) return 'comm';
  return 'other';
}

function calculateAltitude(meanMotion) {
  // Approximate altitude from mean motion (revolutions per day)
  // n = sqrt(GM/a^3) -> a = (GM/n^2)^(1/3)
  // For Earth, GM = 398600.4418 km^3/s^2
  // Mean motion is in revs/day, convert to rad/s: n_rad = (meanMotion * 2π) / 86400
  if (!meanMotion) return 0;

  const n_rev_per_day = meanMotion;
  const n_rad_per_sec = (n_rev_per_day * 2 * Math.PI) / 86400;
  const GM = 398600.4418; // Earth's gravitational constant (km^3/s^2)
  const a = Math.pow(GM / (n_rad_per_sec * n_rad_per_sec), 1/3); // semi-major axis in km
  const altitude = a - 6371; // Earth radius ≈ 6371 km
  return Math.max(0, altitude);
}

function calculateSpeed(meanMotion, eccentricity = 0) {
  // Approximate orbital velocity: v = sqrt(GM * (2/r - 1/a))
  // At circular orbit, v = sqrt(GM/a)
  if (!meanMotion) return 0;

  const n_rev_per_day = meanMotion;
  const n_rad_per_sec = (n_rev_per_day * 2 * Math.PI) / 86400;
  const GM = 398600.4418;
  const a = Math.pow(GM / (n_rad_per_sec * n_rad_per_sec), 1/3);
  const v = Math.sqrt(GM / a); // km/s at circular orbit
  return v;
}

async function importSatellites() {
  try {
    console.log('Fetching Celestrak data...');
    const celestrakData = await fetchCelestrakData();
    console.log(`Fetched ${celestrakData.length} satellites from Celestrak`);

    const db = require('../src/database/init');

    let importedCount = 0;
    let skippedCount = 0;

    celestrakData.forEach((sat, index) => {
      try {
        const noradId = sat.NORAD_CAT_ID?.toString();
        if (!noradId) {
          skippedCount++;
          return;
        }

        const name = sat.OBJECT_NAME || 'Unknown';
        const agency = detectAgency(name);
        const type = determineSatelliteType(name);
        const altitude = calculateAltitude(sat.MEAN_MOTION);
        const speed = calculateSpeed(sat.MEAN_MOTION, sat.ECCENTRICITY);

        // Generate realistic telemetry values based on type
        const baseHealth = agency === 'NASA' || agency === 'ESA' ? 90 + Math.random() * 9 : 85 + Math.random() * 14;
        const status = baseHealth > 95 ? 'active' : baseHealth > 85 ? 'warning' : 'critical';

        // Insert satellite
        db.prepare(`
          INSERT OR REPLACE INTO satellites (
            id, name, agency, type, status, health, battery, fuel, temperature, speed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `CEL-${noradId}`, // Use CEL- prefix to distinguish from other sources
          name,
          agency,
          type,
          status,
          parseFloat(baseHealth.toFixed(1)),
          parseFloat((70 + Math.random() * 25).toFixed(1)),
          parseFloat((60 + Math.random() * 35).toFixed(1)),
          parseFloat((-20 + Math.random() * 40).toFixed(1)),
          parseFloat(speed.toFixed(3))
        );

        // Insert orbital data (TLE equivalent)
        db.prepare(`
          INSERT OR REPLACE INTO orbital_data (
            satellite_id, altitude, inclination, ra_of_ascension, eccentricity,
            mean_anomaly, mean_motion, epoch, tle_line1, tle_line2
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `CEL-${noradId}`,
          parseFloat(altitude.toFixed(2)),
          parseFloat(sat.INCLINATION),
          parseFloat(sat.RA_OF_ASC_NODE),
          parseFloat(sat.ECCENTRICITY),
          parseFloat(sat.MEAN_ANOMALY),
          parseFloat(sat.MEAN_MOTION),
          sat.EPOCH,
          null, // TLE line 1 - would need actual TLE data
          null  // TLE line 2
        );

        // Generate a random initial position
        const lat = (Math.random() - 0.5) * 140;
        const lng = (Math.random() - 0.5) * 360;

        db.prepare(`
          INSERT INTO positions (satellite_id, latitude, longitude, altitude_km, velocity_km_s, footprint_km)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `CEL-${noradId}`,
          parseFloat(lat.toFixed(6)),
          parseFloat(lng.toFixed(6)),
          parseFloat(altitude.toFixed(2)),
          parseFloat(speed.toFixed(3)),
          2500 // approximate footprint radius in km
        );

        importedCount++;
        if (importedCount % 100 === 0) {
          console.log(`Imported ${importedCount}/${celestrakData.length}...`);
        }
      } catch (err) {
        console.warn(`Failed to import satellite ${sat.OBJECT_NAME}:`, err.message);
        skippedCount++;
      }
    });

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${importedCount} satellites`);
    console.log(`   Skipped: ${skippedCount} satellites`);
    console.log(`   Total in database: ${db.prepare('SELECT COUNT(*) as c FROM satellites').get().c}`);

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importSatellites();
