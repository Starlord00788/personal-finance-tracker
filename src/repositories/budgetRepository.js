const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BudgetRepository {
  async create(budgetData) {
    const { user_id, category_id, name, amount, period, start_date, end_date, alert_threshold } = budgetData;
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO budgets (id, user_id, category_id, name, amount, period, start_date, end_date, alert_threshold, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user_id, category_id, name, amount, period, start_date, end_date, alert_threshold || 80, true]
    );

    return this.findById(id);
  }

  async findById(id) {
    const result = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color 
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [id]
    );

    return result.rows[0] || null;
  }

  async findByUser(userId) {
    const result = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return result.rows || [];
  }

  async getByUserId(userId) {
    return this.findByUser(userId);
  }

  async findActiveByUser(userId) {
    const result = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_active = TRUE
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return result.rows || [];
  }

  async findByCategory(userId, categoryId) {
    const result = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.category_id = ? AND b.is_active = TRUE
       ORDER BY b.created_at DESC`,
      [userId, categoryId]
    );

    return result.rows || [];
  }

  async findCurrentBudgets(userId, currentDate = new Date()) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const result = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? 
         AND b.is_active = TRUE 
         AND b.start_date <= ? 
         AND b.end_date >= ?
       ORDER BY b.created_at DESC`,
      [userId, dateStr, dateStr]
    );

    return result.rows || [];
  }

  async updateById(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    await query(
      `UPDATE budgets 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async deleteById(id) {
    const result = await query(
      'DELETE FROM budgets WHERE id = ?',
      [id]
    );

    return result.rowCount > 0;
  }

  async calculateSpentAmount(budgetId, startDate, endDate, categoryId, userId) {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_spent
       FROM transactions
       WHERE category_id = ? 
         AND type = 'expense'
         AND transaction_date BETWEEN ? AND ?
         AND user_id = ?`,
      [categoryId, startDate, endDate, userId]
    );

    return parseFloat(result.rows[0]?.total_spent || 0);
  }

  async getBudgetUtilization(userId, period = null) {
    let whereClause = 'WHERE b.user_id = ? AND b.is_active = TRUE';
    const params = [userId];

    if (period) {
      whereClause += ' AND b.period = ?';
      params.push(period);
    }

    const result = await query(
      `SELECT 
         b.id,
         b.name,
         b.amount as budget_amount,
         b.period,
         b.start_date,
         b.end_date,
         b.alert_threshold,
         c.name as category_name,
         c.color as category_color,
         COALESCE(SUM(t.amount), 0) as spent_amount,
         CASE WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount * 100) ELSE 0 END as utilization_percentage
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
         AND t.type = 'expense'
         AND t.transaction_date BETWEEN b.start_date AND b.end_date
       ${whereClause}
       GROUP BY b.id, b.name, b.amount, b.period, b.start_date, b.end_date, 
                b.alert_threshold, c.name, c.color
       ORDER BY utilization_percentage DESC`,
      params
    );

    return result.rows || [];
  }

  async getBudgetAlerts(userId, alertThreshold = 80) {
    const result = await query(
      `SELECT 
         b.id,
         b.name,
         b.amount as budget_amount,
         b.alert_threshold,
         b.start_date,
         b.end_date,
         c.name as category_name,
         COALESCE(SUM(t.amount), 0) as spent_amount,
         CASE WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount * 100) ELSE 0 END as utilization_percentage
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id 
         AND t.type = 'expense'
         AND t.transaction_date BETWEEN b.start_date AND b.end_date
       WHERE b.user_id = ? AND b.is_active = TRUE
       GROUP BY b.id, b.name, b.amount, b.alert_threshold, b.start_date, b.end_date, c.name
       HAVING CASE WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount * 100) ELSE 0 END >= ?
       ORDER BY utilization_percentage DESC`,
      [userId, alertThreshold]
    );

    return result.rows || [];
  }
}

module.exports = BudgetRepository;