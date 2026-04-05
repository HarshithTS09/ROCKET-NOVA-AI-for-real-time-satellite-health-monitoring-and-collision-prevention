const Database = require('better-sqlite3');
const path = require('path');

// Create/connect to SQLite database
const db = new Database(path.join(__dirname, '../../data/satellites.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Read and execute schema
const fs = require('fs');
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);

console.log('✅ Database initialized: satellites.db');

// Close connection on exit
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

module.exports = db;
