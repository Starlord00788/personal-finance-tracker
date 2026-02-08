const { query } = require('../config/database');

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
        transaction_date, is_recurring ? 1 : 0, recurring_frequency, notes
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

    if (filters.from_date) {
      queryStr += ' AND t.transaction_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      queryStr += ' AND t.transaction_date <= ?';
      params.push(filters.to_date);
    }

    if (filters.min_amount) {
      queryStr += ' AND t.amount >= ?';
      params.push(filters.min_amount);
    }

    if (filters.max_amount) {
      queryStr += ' AND t.amount <= ?';
      params.push(filters.max_amount);
    }

    const orderBy = filters.sort_by || 'transaction_date';
    const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
    queryStr += ` ORDER BY t.${orderBy} ${sortOrder}`;

    if (filters.limit) {
      queryStr += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await query(queryStr, params);
    return result.rows;
  }

  async updateById(id, updateData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'category_id', 'amount', 'currency', 'type', 'description',
      'transaction_date', 'is_recurring', 'recurring_frequency', 'notes'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'is_recurring') {
          fields.push(`${field} = ?`);
          values.push(updateData[field] ? 1 : 0);
        } else {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
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
        type,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
       FROM transactions
       WHERE user_id = ? 
       AND strftime('%Y', transaction_date) = ? 
       AND strftime('%m', transaction_date) = ?
       GROUP BY type`,
      [userId, year.toString(), month.toString().padStart(2, '0')]
    );
    return result.rows;
  }

  async getCategoryStats(userId, from_date, to_date) {
    const result = await query(
      `SELECT 
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        t.type,
        COUNT(*) as count,
        SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? 
       AND t.transaction_date BETWEEN ? AND ?
       GROUP BY t.category_id, t.type
       ORDER BY total DESC`,
      [userId, from_date, to_date]
    );
    return result.rows;
  }

  async getRecentTransactions(userId, limit = 10) {
    return this.findByUser(userId, {
      limit,
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  }
}

module.exports = TransactionRepository;