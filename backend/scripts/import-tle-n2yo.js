const https = require('https');
const db = require('../src/database/init');

const N2YO_API_KEY = process.env.N2YO_API_KEY || process.env.VITE_N2YO_API_KEY;

if (!N2YO_API_KEY) {
  console.error('❌ N2YO_API_KEY not found in environment');
  process.exit(1);
}

/**
 * Fetch TLE for a specific satellite from N2YO
 */
function fetchTleFromN2YO(noradId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.n2yo.com/rest/v1/satellite/tle/${noradId}?apiKey=${N2YO_API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.tle) {
            const lines = json.tle.trim().split('\n');
            if (lines.length >= 2) {
              resolve({
                line1: lines[0].trim(),
                line2: lines[1].trim()
              });
              return;
            }
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Extract NORAD ID from satellite ID
 */
function extractNoradId(satId) {
  if (!satId) return null;
  if (satId.startsWith('CEL-')) {
    return satId.substring(4);
  }
  if (!isNaN(parseInt(satId))) {
    return satId;
  }
  return null;
}

/**
 * Try to get TLE from N2YO for unmatched satellites
 */
async function importUnmatchedFromN2YO() {
  // Get list of satellites without TLEs
  const satellites = db.prepare(`
    SELECT s.id, s.name
    FROM satellites s
    LEFT JOIN orbital_data o ON s.id = o.satellite_id
    WHERE o.tle_line1 IS NULL OR o.tle_line1 = ''
  `).all();

  console.log(`Found ${satellites.length} satellites without TLEs\n`);

  let found = 0;
  let notFound = 0;

  for (const sat of satellites) {
    const noradId = extractNoradId(sat.id);
    if (!noradId) {
      console.log(`  ⚠ ${sat.id}: Cannot extract NORAD ID`);
      notFound++;
      continue;
    }

    try {
      const tle = await fetchTleFromN2YO(noradId);
      if (tle) {
        // Check if orbital_data exists
        const existing = db.prepare('SELECT id FROM orbital_data WHERE satellite_id = ?').get(sat.id);
        if (existing) {
          db.prepare('UPDATE orbital_data SET tle_line1 = ?, tle_line2 = ? WHERE satellite_id = ?')
            .run(tle.line1, tle.line2, sat.id);
        } else {
          db.prepare('INSERT INTO orbital_data (satellite_id, tle_line1, tle_line2) VALUES (?, ?, ?)')
            .run(sat.id, tle.line1, tle.line2);
        }
        console.log(`  ✓ ${sat.id}: TLE fetched from N2YO`);
        found++;
      } else {
        console.log(`  ✗ ${sat.id}: No TLE from N2YO`);
        notFound++;
      }
    } catch (err) {
      console.log(`  ✗ ${sat.id}: Error - ${err.message}`);
      notFound++;
    }

    // Rate limit: N2YO free tier has ~1000 calls/day, be gentle
    if (found % 50 === 0) {
      console.log(`  ... paused for rate limit (${found} fetched so far)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  const totalTle = db.prepare('SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL AND tle_line1 != ""').get().c;
  const totalSats = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c;

  console.log('\n✅ Import complete!');
  console.log(`   Fetched from N2YO: ${found} satellites`);
  console.log(`   Still missing: ${notFound} satellites`);
  console.log(`   Total TLE coverage: ${totalTle} / ${totalSats} (${(totalTle/totalSats*100).toFixed(1)}%)`);

  db.close();
  process.exit(0);
}

importUnmatchedFromN2YO().catch(err => {
  console.error('Failed:', err);
  db.close();
  process.exit(1);
});
