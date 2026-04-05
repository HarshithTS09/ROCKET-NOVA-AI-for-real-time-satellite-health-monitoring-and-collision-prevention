/**
 * Periodic position updater
 * Fetches all satellite positions in batch and stores them to database
 * Run with: node update-positions.js
 * Can be scheduled with cron or PM2
 */

const db = require('../src/database/init');
const https = require('https');

// Backend base URL (assuming we call our own API)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function updateAllPositions() {
  console.log(`[${new Date().toISOString()}] Starting position update...`);

  try {
    // Get all satellite IDs with TLEs
    const satellites = db.prepare(`
      SELECT s.id FROM satellites s
      JOIN orbital_data o ON s.id = o.satellite_id
      WHERE o.tle_line1 IS NOT NULL AND o.tle_line1 != ''
    `).all();

    console.log(`Found ${satellites.length} satellites with TLEs`);

    const ids = satellites.map(s => s.id);
    const BATCH_SIZE = 50; // Process in batches to avoid memory issues
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const batchParam = encodeURIComponent(batchIds.join(','));

      try {
        const positions = await fetch(
          `${BACKEND_URL}/api/satellites/positions/batch?ids=${batchParam}`
        );

        // Store each position in DB
        for (const id of batchIds) {
          const pos = positions[id];
          if (pos && !pos.error) {
            try {
              db.prepare(`
                INSERT INTO positions (satellite_id, latitude, longitude, altitude_km, velocity_km_s, footprint_km)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(
                id,
                pos.latitude,
                pos.longitude,
                pos.altitude,
                pos.velocity,
                2500
              );
              updated++;
            } catch (err) {
              console.warn(`Failed to store position for ${id}:`, err.message);
            }
          }
        }

        console.log(`   Progress: ${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length}`);
      } catch (err) {
        console.error(`Batch ${i/BATCH_SIZE + 1} failed:`, err.message);
        errors++;
      }
    }

    console.log(`[${new Date().toISOString()}] Update complete:`);
    console.log(`   Updated: ${updated} positions`);
    console.log(`   Errors: ${errors} batches\n`);

    db.close();
    process.exit(0);

  } catch (error) {
    console.error('Position update failed:', error);
    db.close();
    process.exit(1);
  }
}

// If called directly, run update
if (require.main === module) {
  updateAllPositions();
}

module.exports = { updateAllPositions };
