const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Check if we should use PostgreSQL (Neon) or SQLite
const USE_POSTGRESQL = process.env.DB_HOST && process.env.DB_USER;

let db, pool, query;

if (USE_POSTGRESQL) {
  // PostgreSQL/Neon Configuration
  const { Pool } = require('pg');
  
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL/Neon database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
  });

  // Convert SQLite ? placeholders to PostgreSQL $1, $2, $3 style
  function convertPlaceholders(sql) {
    let index = 0;
    // Replace ? with $1, $2, $3 etc. (only standalone ?, not inside strings)
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  // Convert SQLite-specific SQL to PostgreSQL-compatible SQL
  function convertSQLiteToPostgres(sql) {
    let converted = sql;
    
    // Convert strftime('%Y', col) → EXTRACT(YEAR FROM col)::TEXT
    converted = converted.replace(/strftime\s*\(\s*'%Y'\s*,\s*(\w+)\s*\)/gi, 
      "EXTRACT(YEAR FROM $1)::TEXT");
    
    // Convert strftime('%m', col) → LPAD(EXTRACT(MONTH FROM col)::TEXT, 2, '0')
    converted = converted.replace(/strftime\s*\(\s*'%m'\s*,\s*(\w+)\s*\)/gi, 
      "LPAD(EXTRACT(MONTH FROM $1)::TEXT, 2, '0')");
    
    // Convert is_deleted = 0 → is_deleted = FALSE
    converted = converted.replace(/is_deleted\s*=\s*0/gi, 'is_deleted = FALSE');
    converted = converted.replace(/is_deleted\s*=\s*1/gi, 'is_deleted = TRUE');
    
    // Convert ? placeholders to $1, $2, $3
    converted = convertPlaceholders(converted);
    
    return converted;
  }

  // PostgreSQL query function with automatic SQLite → PostgreSQL conversion
  query = async (text, params = []) => {
    try {
      const convertedText = convertSQLiteToPostgres(text);
      const res = await pool.query(convertedText, params);
      return res;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  };

} else {
  // SQLite Configuration (current/fallback)
  const dbPath = path.join(__dirname, '../../finance_tracker.db');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ SQLite connection error:', err);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });

  // Create tables if they don't exist (SQLite)
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

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        color TEXT DEFAULT '#6366f1',
        icon TEXT DEFAULT 'folder',
        is_deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      )
    `);

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL DEFAULT 'USD',
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        description TEXT,
        transaction_date DATE NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);

    // Receipts table
    db.run(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });

  // SQLite helper function to mimic PostgreSQL interface
  query = (text, params = []) => {
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
}

module.exports = {
  query,
  db,
  pool,
  USE_POSTGRESQL
};