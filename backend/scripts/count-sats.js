const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/satellites.db'));
const result = db.prepare('SELECT COUNT(*) as count FROM satellites').get();
console.log('Satellite count:', result.count);
db.close();