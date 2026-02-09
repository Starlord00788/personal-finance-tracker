const { query, USE_POSTGRESQL } = require('../config/database');

class TransactionRepository {
  async create(transactionData) {
    const {
      id, user_id, category_id, amount, currency, type, description,
      transaction_date, is_recurring, recurring_frequency, notes
    } = transactionData;
    
    await query(
      `INSERT INTO transactions (
        id, user_id, category_id, amount, currency, type, description,
        transaction_date, is_recurring, recurring_frequency, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, category_id, amount, currency, type, description,
        transaction_date, USE_POSTGRESQL ? !!is_recurring : (is_recurring ? 1 : 0), recurring_frequency, notes
      ]
    );

    return this.findById(id);
  }

  async findById(id) {
    const result = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByUser(userId, filters = {}) {
    let queryStr = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (filters.type) {
      queryStr += ' AND t.type = ?';
      params.push(filters.type);
    }

    if (filters.category_id) {
      queryStr += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.start_date || filters.from_date) {
      queryStr += ' AND t.transaction_date >= ?';
      params.push(filters.start_date || filters.from_date);
    }

    if (filters.end_date || filters.to_date) {
      queryStr += ' AND t.transaction_date <= ?';
      params.push(filters.end_date || filters.to_date);
    }

    if (filters.min_amount) {
      queryStr += ' AND t.amount >= ?';
      params.push(parseFloat(filters.min_amount));
    }

    if (filters.max_amount) {
      queryStr += ' AND t.amount <= ?';
      params.push(parseFloat(filters.max_amount));
    }

    const sortColumn = ['amount', 'transaction_date', 'created_at', 'type'].includes(filters.sort_by) ? `t.${filters.sort_by}` : 't.transaction_date';
    const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
    queryStr += ` ORDER BY ${sortColumn} ${sortOrder}, t.created_at DESC`;

    if (filters.limit) {
      queryStr += ' LIMIT ?';
      params.push(filters.limit);
    }

    const result = await query(queryStr, params);
    return result.rows || [];
  }

  // Alias for AI service compatibility  
  async getByUserId(userId, filters = {}) {
    return this.findByUser(userId, filters);
  }

  async updateById(id, updateData) {
    const fields = [];
    const params = [];
    
    const allowedFields = [
      'category_id', 'amount', 'currency', 'type', 'description',
      'transaction_date', 'is_recurring', 'recurring_frequency', 'notes'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(field === 'is_recurring' ? (USE_POSTGRESQL ? !!updateData[field] : (updateData[field] ? 1 : 0)) : updateData[field]);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);
    
    await query(
      `UPDATE transactions SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async deleteById(id) {
    const result = await query('DELETE FROM transactions WHERE id = ?', [id]);
    return result.rowCount > 0;
  }

  async getMonthlyStats(userId, year, month) {
    const result = await query(
      `SELECT 
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
         COUNT(*) as transaction_count
       FROM transactions 
       WHERE user_id = ? 
         AND strftime('%Y', transaction_date) = ? 
         AND strftime('%m', transaction_date) = ?`,
      [userId, year.toString(), month.toString().padStart(2, '0')]
    );

    return result.rows[0] || {
      total_income: 0,
      total_expenses: 0,
      transaction_count: 0
    };
  }

  async getCategoryStats(userId, from_date, to_date) {
    const result = await query(
      `SELECT 
         c.id, c.name, c.color,
         SUM(t.amount) as total_amount,
         COUNT(t.id) as transaction_count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? 
         AND t.transaction_date >= ? 
         AND t.transaction_date <= ?
       GROUP BY c.id, c.name, c.color
       ORDER BY total_amount DESC`,
      [userId, from_date, to_date]
    );

    return result.rows || [];
  }

  async getRecentTransactions(userId, limit = 10) {
    const result = await query(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return result.rows || [];
  }
}

module.exports = TransactionRepository;