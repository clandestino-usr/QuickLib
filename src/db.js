const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const libraryPath = process.env.CALIBRE_LIBRARY_PATH;
if (!libraryPath) {
  console.error('[quicklib] CALIBRE_LIBRARY_PATH is required');
  process.exit(1);
}

const dbPath = path.join(libraryPath, 'metadata.db');
let db;
try {
  db = new DatabaseSync(dbPath, { readOnly: true });
} catch (err) {
  console.error(`[quicklib] Cannot open ${dbPath}: ${err.message}`);
  process.exit(1);
}

module.exports = { db, libraryPath };
