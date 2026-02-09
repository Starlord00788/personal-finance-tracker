# 🛢️ Neon Database Integration Guide

## 🚀 **Setting Up Neon Database for Personal Finance Tracker**

### Step 1: Create Neon Account & Database

1. **Sign up** at [neon.tech](https://neon.tech)
2. **Create a new project** called "Personal Finance Tracker"
3. **Get your connection string** from the Neon dashboard

### Step 2: Update Environment Variables

Create a new `.env.neon` file or update your existing `.env`:

```bash
# Neon PostgreSQL Database Configuration
DB_HOST=ep-your-endpoint.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=your-username  
DB_PASSWORD=your-password
DATABASE_URL=postgresql://your-username:your-password@ep-your-endpoint.us-east-2.aws.neon.tech/neondb?sslmode=require

# SSL Configuration for Neon (Required)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Keep other existing variables...
JWT_SECRET=your_very_secure_jwt_secret_change_in_production_2026_abcdefgh
JWT_EXPIRES_IN=1h
SESSION_SECRET=your_very_secure_session_secret_change_in_production_2026_xyz
PORT=3000
NODE_ENV=production

# External APIs
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Personal Finance Tracker
```

### Step 3: Install PostgreSQL Driver

```bash
npm install pg
```

### Step 4: Update Database Configuration

Your `src/config/database.js` needs to be updated for PostgreSQL:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries (same interface as SQLite)
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool
};
```

### Step 5: Database Migration Scripts

Create `src/db/neon-migrate.js`:

```javascript
const { query } = require('../config/database');

async function createTables() {
  try {
    console.log('🏗️ Creating tables in Neon PostgreSQL...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        alert_percentage INTEGER DEFAULT 80,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

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

    console.log('✅ All tables created successfully in Neon PostgreSQL!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Database migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
```

### Step 6: Data Migration from SQLite to Neon

Create `migrate-sqlite-to-neon.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const { query } = require('./src/config/database');
const path = require('path');

async function migrateSQLiteToNeon() {
  const sqliteDb = new sqlite3.Database(path.join(__dirname, 'finance_tracker.db'));
  
  try {
    console.log('📦 Starting migration from SQLite to Neon...');
    
    // Migrate users
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    for (const user of users) {
      await query(
        'INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING',
        [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.created_at, user.updated_at]
      );
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate categories
    const categories = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM categories', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    for (const category of categories) {
      await query(
        'INSERT INTO categories (id, user_id, name, type, color, icon, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (user_id, name) DO NOTHING',
        [category.id, category.user_id, category.name, category.type, category.color, category.icon, category.created_at, category.updated_at]
      );
    }
    console.log(`✅ Migrated ${categories.length} categories`);
    
    // Similar for other tables...
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    sqliteDb.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateSQLiteToNeon();
}
```

### Step 7: Update Package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "migrate": "node src/db/migrate.js",
    "migrate-neon": "node src/db/neon-migrate.js",
    "migrate-from-sqlite": "node migrate-sqlite-to-neon.js",
    "seed": "node src/db/seed.js"
  }
}
```

## 🔥 **Neon Advantages Over SQLite:**

| Feature | SQLite | Neon PostgreSQL |
|---------|--------|-----------------|
| **Concurrent Users** | Limited | Unlimited |
| **Scalability** | Single file | Auto-scaling |
| **Backups** | Manual | Automatic |
| **Branching** | None | Git-like database branches |
| **Connection Pooling** | N/A | Built-in |
| **Full-text Search** | Basic | Advanced |
| **JSON Support** | Limited | Native JSONB |

## 🚀 **Quick Setup Commands:**

```bash
# 1. Install PostgreSQL driver
npm install pg

# 2. Update your .env with Neon credentials
cp .env .env.backup
# Edit .env with your Neon connection details

# 3. Run Neon migration
npm run migrate-neon

# 4. Optionally migrate existing SQLite data
npm run migrate-from-sqlite

# 5. Start your app with Neon
npm start
```

## 💡 **Neon Free Tier Limits:**
- ✅ **0.5 GB storage** (plenty for personal finance data)
- ✅ **100 compute hours/month** (scales to zero when idle)
- ✅ **Unlimited databases** 
- ✅ **Database branching** (create dev/staging/prod branches)

Your friend's suggestion is spot-on! Neon will make your app much more scalable and production-ready. 🎯