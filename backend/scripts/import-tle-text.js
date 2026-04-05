const https = require('https');
const db = require('../src/database/init');

// Celestrak TLE sources
const CELESTRAK_SOURCES = [
  'https://celestrak.org/NORAD/elements/active.txt', // All active satellites
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle', // Starlink
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle', // GPS
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle', // Weather
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle', // NOAA
];

/**
 * Fetch TLE data from Celestrak URL
 */
function fetchTleData(url) {
  return new Promise((resolve, reject) => {
    console.log(`Fetching: ${url}`);
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse TLE text format (3-line entries)
 * Returns Map: noradId -> { name, line1, line2 }
 */
function parseTleText(text) {
  const lines = text.trim().split('\n').map(l => l.trim());
  const satellites = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // TLE format: line 1 is the name, line 2 starts with '1 ' and line 3 with '2 '
    if (line.startsWith('1 ') && i + 1 < lines.length && lines[i + 1].startsWith('2 ')) {
      const name = line; // The "name" line (could be multi-line name but simplified)
      const line1 = lines[i];
      const line2 = lines[i + 1];

      // Extract NORAD ID from line 1 (field 3, 5 digits)
      // Format: 1 NNNNAA YYDDD... where NNNN is NORAD ID (padded with leading zeros)
      const noradId = line1.substring(2, 7).trim();
      const noradIdNum = parseInt(noradId, 10);

      if (!isNaN(noradIdNum)) {
        satellites.set(noradIdNum.toString(), {
          name: name,
          line1: line1,
          line2: line2
        });
      }

      i++; // Skip the line2 we just processed
    }
  }

  return satellites;
}

/**
 * Extract NORAD ID from satellite ID (e.g., "CEL-68040" -> "68040")
 */
function extractNoradId(satId) {
  if (!satId) return null;
  // Handle CEL- prefix
  if (satId.startsWith('CEL-')) {
    return satId.substring(4);
  }
  // Handle ISS (25544) and other numeric IDs
  if (!isNaN(parseInt(satId))) {
    return satId;
  }
  return null;
}

/**
 * Main import function
 */
async function importTleText() {
  try {
    console.log('🚀 Starting TLE text import...\n');

    // Fetch and parse all sources
    const allTles = new Map();

    for (const url of CELESTRAK_SOURCES) {
      try {
        const text = await fetchTleData(url);
        const parsed = parseTleText(text);
        console.log(`   Parsed ${parsed.size} TLEs from ${new URL(url).pathname.split('/').pop()}`);

        // Merge into allTles (later sources overwrite earlier)
        for (const [id, tle] of parsed) {
          allTles.set(id, tle);
        }
      } catch (error) {
        console.warn(`   Failed to fetch ${url}:`, error.message);
      }
    }

    console.log(`\n📊 Total unique TLEs collected: ${allTles.size}\n`);

    // Get all satellites from DB
    const satellites = db.prepare('SELECT id, name FROM satellites').all();
    console.log(`Database has ${satellites.length} satellites\n`);

    let matched = 0;
    let unmatched = 0;
    const unmatchedList = [];

    // Match and update orbital_data with TLE lines
    for (const sat of satellites) {
      const noradId = extractNoradId(sat.id);

      if (!noradId) {
        unmatched++;
        unmatchedList.push(`${sat.id} (${sat.name})`);
        continue;
      }

      const tle = allTles.get(noradId);

  // Update orbital_data with TLE lines
  try {
    const result = db.prepare(`
      UPDATE orbital_data
      SET tle_line1 = ?, tle_line2 = ?
      WHERE satellite_id = ?
    `).run(tle.line1, tle.line2, sat.id);

    if (result.changes > 0) {
      matched++;
    } else {
      // orbital_data record doesn't exist, create it
      db.prepare(`
        INSERT INTO orbital_data (satellite_id, tle_line1, tle_line2)
        VALUES (?, ?, ?)
      `).run(sat.id, tle.line1, tle.line2);
      matched++;
    }
  } catch (err) {
    console.warn(`Failed to update TLE for ${sat.id}:`, err.message);
    unmatched++;
    unmatchedList.push(`${sat.id} (${sat.name})`);
  }
    }

    // Report
    console.log('✅ TLE import complete!\n');
    console.log(`   Matched: ${matched} satellites`);
    console.log(`   Unmatched: ${unmatched} satellites`);
    console.log(`   Total: ${matched + unmatched}\n`);

    if (unmatchedList.length > 0) {
      console.log('Unmatched satellites (need manual TLE entry):');
      console.log(unmatchedList.slice(0, 20).join('\n'));
      if (unmatchedList.length > 20) {
        console.log(`... and ${unmatchedList.length - 20} more`);
      }
      console.log('');
    }

    // Verification: Count satellites with TLEs
    const tleCount = db.prepare("SELECT COUNT(*) as c FROM orbital_data WHERE tle_line1 IS NOT NULL AND tle_line1 != ''").get().c;
    const totalSats = db.prepare('SELECT COUNT(*) as c FROM satellites').get().c;
    console.log(`📊 Coverage: ${tleCount} / ${totalSats} satellites have TLE data (${(tleCount/totalSats*100).toFixed(1)}%)`);

    db.close();
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    db.close();
    process.exit(1);
  }
}

importTleText();
