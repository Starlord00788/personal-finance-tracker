// Global test teardown - close database connections after all tests complete
module.exports = async () => {
  try {
    const { pool, db } = require('../src/config/database');
    
    // Close PostgreSQL pool if connected
    if (pool) {
      await pool.end();
    }
    
    // Close SQLite database if connected
    if (db) {
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  } catch (err) {
    // Ignore errors during teardown
  }
};
