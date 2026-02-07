const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async createMigrationsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await query(createTableQuery);
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Error creating migrations table:', error);
      throw error;
    }
  }

  async getAppliedMigrations() {
    try {
      const result = await query('SELECT filename FROM migrations ORDER BY id;');
      return result.rows.map(row => row.filename);
    } catch (error) {
      console.error('❌ Error getting applied migrations:', error);
      throw error;
    }
  }

  async getPendingMigrations() {
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    
    return migrationFiles.filter(file => !appliedMigrations.includes(file));
  }

  async runMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    const migrationSQL = fs.readFileSync(filePath, 'utf8');

    try {
      console.log(`🔄 Running migration: ${filename}`);
      
      // Execute the migration SQL
      await query(migrationSQL);

      // Record the migration as applied
      await query(
        'INSERT INTO migrations (filename) VALUES ($1);',
        [filename]
      );

      console.log(`✅ Migration completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Error running migration ${filename}:`, error);
      throw error;
    }
  }

  async runPendingMigrations() {
    try {
      await this.createMigrationsTable();
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📦 Found ${pendingMigrations.length} pending migration(s)`);

      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  async rollback(steps = 1) {
    try {
      const appliedMigrations = await query(
        'SELECT filename FROM migrations ORDER BY id DESC LIMIT $1;',
        [steps]
      );

      if (appliedMigrations.rows.length === 0) {
        console.log('❌ No migrations to rollback');
        return;
      }

      console.log(`🔄 Rolling back ${appliedMigrations.rows.length} migration(s)...`);
      
      for (const migration of appliedMigrations.rows) {
        console.log(`⚠️ Rolling back: ${migration.filename}`);
        // Note: This is a simplified rollback - in production, you'd want proper rollback scripts
        await query(
          'DELETE FROM migrations WHERE filename = $1;',
          [migration.filename]
        );
      }

      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  switch (command) {
    case 'up':
      runner.runPendingMigrations();
      break;
    case 'rollback':
      const steps = parseInt(process.argv[3]) || 1;
      runner.rollback(steps);
      break;
    default:
      console.log(`
Usage:
  node migrate.js up           - Run pending migrations
  node migrate.js rollback [n] - Rollback last n migrations (default: 1)
      `);
      break;
  }
}

module.exports = MigrationRunner;