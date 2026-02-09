require('dotenv').config();
const { query, pool, USE_POSTGRESQL } = require('../config/database');

async function createTables() {
  if (!USE_POSTGRESQL) {
    console.log('⚠️ Neon migration requires PostgreSQL configuration.');
    console.log('ℹ️ Please set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in your .env file');
    console.log('ℹ️ Get these from your Neon dashboard at https://neon.tech');
    process.exit(1);
  }

  try {
    console.log('🏗️ Creating tables in Neon PostgreSQL...\n');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        default_currency VARCHAR(3) DEFAULT 'USD',
        google_id VARCHAR(255),
        auth_provider VARCHAR(20) DEFAULT 'local',
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        color VARCHAR(7) DEFAULT '#6366f1',
        icon VARCHAR(50) DEFAULT 'folder',
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      )
    `);
    console.log('✅ Created categories table');

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        category_id UUID NOT NULL,
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        description TEXT,
        transaction_date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT false,
        recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      )
    `);
    console.log('✅ Created transactions table');

    // Budgets table
    await query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        category_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        alert_threshold INTEGER DEFAULT 80,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created budgets table');

    // Receipts table
    await query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id UUID NOT NULL,
        user_id UUID NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created receipts table');

    // Notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created notifications table');

    // Exchange rates table
    await query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        base_currency VARCHAR(3) NOT NULL,
        target_currency VARCHAR(3) NOT NULL,
        rate DECIMAL(15,6) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(base_currency, target_currency)
      )
    `);
    console.log('✅ Created exchange_rates table');

    console.log('\n🎉 All tables created successfully in Neon PostgreSQL!');
  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migration
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('\n🚀 Database migration completed! Your Neon DB is ready.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createTables };
