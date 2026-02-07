const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create SQLite database file in project root
const dbPath = path.join(__dirname, '../../finance_tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Helper function to execute queries - mimics PostgreSQL interface
const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    if (text.includes('RETURNING')) {
      // Handle INSERT ... RETURNING for SQLite
      const insertText = text.replace(/RETURNING .+/, '');
      db.run(insertText, params, function(err) {
        if (err) reject(err);
        else resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
      });
    } else if (text.startsWith('SELECT')) {
      db.all(text, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows, rowCount: rows.length });
      });
    } else {
      db.run(text, params, function(err) {
        if (err) reject(err);
        else resolve({ rowCount: this.changes });
      });
    }
  });
};

module.exports = {
  query,
};