const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/satellites.db'));

// Get all missions
const missions = db.prepare('SELECT * FROM missions').all();
console.log('Total missions:', missions.length);
console.log(JSON.stringify(missions, null, 2));

// Also check satellites for mission count
const satellites = db.prepare('SELECT id, name FROM satellites').all();
console.log('\nTotal satellites:', satellites.length);

// Close
db.close();