const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class DatabaseSeeder {
  async seedDefaultCategories(userId) {
    const defaultCategories = [
      // Expense categories
      { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils' },
      { name: 'Transportation', type: 'expense', color: '#f97316', icon: 'car' },
      { name: 'Shopping', type: 'expense', color: '#eab308', icon: 'shopping-bag' },
      { name: 'Entertainment', type: 'expense', color: '#22c55e', icon: 'gamepad-2' },
      { name: 'Bills & Utilities', type: 'expense', color: '#3b82f6', icon: 'receipt' },
      { name: 'Healthcare', type: 'expense', color: '#8b5cf6', icon: 'heart' },
      { name: 'Education', type: 'expense', color: '#ec4899', icon: 'book' },
      { name: 'Travel', type: 'expense', color: '#06b6d4', icon: 'plane' },
      { name: 'Home & Garden', type: 'expense', color: '#84cc16', icon: 'home' },
      { name: 'Personal Care', type: 'expense', color: '#f59e0b', icon: 'user' },
      
      // Income categories  
      { name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase' },
      { name: 'Freelance', type: 'income', color: '#6366f1', icon: 'laptop' },
      { name: 'Investment', type: 'income', color: '#8b5cf6', icon: 'trending-up' },
      { name: 'Business', type: 'income', color: '#f59e0b', icon: 'building' },
      { name: 'Other Income', type: 'income', color: '#6b7280', icon: 'plus-circle' },
    ];

    try {
      for (const category of defaultCategories) {
        await query(
          `INSERT INTO categories (user_id, name, type, color, icon) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, name) DO NOTHING`,
          [userId, category.name, category.type, category.color, category.icon]
        );
      }
      console.log('✅ Default categories seeded');
    } catch (error) {
      console.error('❌ Error seeding categories:', error);
      throw error;
    }
  }

  async seedDemoUser() {
    try {
      // Check if demo user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', ['demo@financetracker.com']);
      
      if (existingUser.rows.length > 0) {
        console.log('✅ Demo user already exists');
        return existingUser.rows[0].id;
      }

      // Create demo user
      const hashedPassword = await bcrypt.hash('demo123456', 12);
      
      const userResult = await query(
        `INSERT INTO users (name, email, password_hash, preferred_currency) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        ['Demo User', 'demo@financetracker.com', hashedPassword, 'USD']
      );

      const userId = userResult.rows[0].id;
      console.log('✅ Demo user created');

      // Seed default categories for demo user
      await this.seedDefaultCategories(userId);

      // Add some sample transactions
      await this.seedSampleTransactions(userId);
      
      // Add sample budgets
      await this.seedSampleBudgets(userId);

      return userId;
    } catch (error) {
      console.error('❌ Error seeding demo user:', error);
      throw error;
    }
  }

  async seedSampleTransactions(userId) {
    try {
      // Get category IDs for the user
      const categories = await query(
        'SELECT id, name, type FROM categories WHERE user_id = $1',
        [userId]
      );

      const categoryMap = categories.rows.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {});

      const sampleTransactions = [
        // Income transactions
        {
          categoryId: categoryMap['Salary'],
          amount: 5000,
          type: 'income',
          description: 'Monthly salary',
          date: '2026-02-01'
        },
        {
          categoryId: categoryMap['Freelance'],
          amount: 800,
          type: 'income', 
          description: 'Web development project',
          date: '2026-02-03'
        },

        // Expense transactions
        {
          categoryId: categoryMap['Food & Dining'],
          amount: 120,
          type: 'expense',
          description: 'Grocery shopping',
          date: '2026-02-02'
        },
        {
          categoryId: categoryMap['Transportation'],
          amount: 45,
          type: 'expense',
          description: 'Gas fill-up',
          date: '2026-02-04'
        },
        {
          categoryId: categoryMap['Bills & Utilities'],
          amount: 180,
          type: 'expense',
          description: 'Electric bill',
          date: '2026-02-05'
        },
        {
          categoryId: categoryMap['Entertainment'],
          amount: 25,
          type: 'expense',
          description: 'Movie tickets',
          date: '2026-02-06'
        },
      ];

      for (const transaction of sampleTransactions) {
        await query(
          `INSERT INTO transactions (user_id, category_id, amount, currency, type, description, transaction_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, transaction.categoryId, transaction.amount, 'USD', transaction.type, transaction.description, transaction.date]
        );
      }

      console.log('✅ Sample transactions seeded');
    } catch (error) {
      console.error('❌ Error seeding sample transactions:', error);
      throw error;
    }
  }

  async seedSampleBudgets(userId) {
    try {
      const categories = await query(
        'SELECT id, name FROM categories WHERE user_id = $1 AND type = $2',
        [userId, 'expense']
      );

      const sampleBudgets = [
        { name: 'Food & Dining', amount: 500 },
        { name: 'Transportation', amount: 200 },
        { name: 'Entertainment', amount: 150 },
        { name: 'Bills & Utilities', amount: 400 },
      ];

      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      for (const budget of sampleBudgets) {
        const category = categories.rows.find(cat => cat.name === budget.name);
        if (category) {
          await query(
            `INSERT INTO budgets (user_id, category_id, month, year, limit_amount, currency)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id, category_id, month, year) DO NOTHING`,
            [userId, category.id, month, year, budget.amount, 'USD']
          );
        }
      }

      console.log('✅ Sample budgets seeded');
    } catch (error) {
      console.error('❌ Error seeding sample budgets:', error);
      throw error;
    }
  }

  async runSeed() {
    try {
      console.log('🌱 Starting database seeding...');
      
      await this.seedDemoUser();
      
      console.log('🎉 Database seeding completed!');
      console.log('📧 Demo user credentials:');
      console.log('   Email: demo@financetracker.com');
      console.log('   Password: demo123456');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.runSeed();
}

module.exports = DatabaseSeeder;