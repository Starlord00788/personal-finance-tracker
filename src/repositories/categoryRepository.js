const { query } = require('../config/database');

class CategoryRepository {
  async create(categoryData) {
    const { id, user_id, name, type, color, icon } = categoryData;
    
    await query(
      `INSERT INTO categories (id, user_id, name, type, color, icon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user_id, name, type, color || '#6366f1', icon || 'folder']
    );

    return this.findById(id);
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM categories WHERE id = ? AND is_deleted = 0',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByUser(userId, type = null) {
    let queryStr = 'SELECT * FROM categories WHERE user_id = ? AND is_deleted = 0';
    const params = [userId];

    if (type) {
      queryStr += ' AND type = ?';
      params.push(type);
    }

    queryStr += ' ORDER BY name ASC';
    
    const result = await query(queryStr, params);
    return result.rows;
  }

  async updateById(id, updateData) {
    const { name, type, color, icon } = updateData;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (type !== undefined) {
      fields.push('type = ?');
      values.push(type);
    }
    if (color !== undefined) {
      fields.push('color = ?');
      values.push(color);
    }
    if (icon !== undefined) {
      fields.push('icon = ?');
      values.push(icon);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async deleteById(id) {
    const result = await query(
      'UPDATE categories SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.rowCount > 0;
  }

  async nameExists(userId, name, excludeId = null) {
    let queryStr = 'SELECT id FROM categories WHERE user_id = ? AND name = ? AND is_deleted = 0';
    const params = [userId, name];
    
    if (excludeId) {
      queryStr += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(queryStr, params);
    return result.rows.length > 0;
  }

  async getDefaultCategories(type) {
    const defaults = {
      income: [
        { name: 'Salary', icon: 'briefcase', color: '#22c55e' },
        { name: 'Freelance', icon: 'laptop', color: '#3b82f6' },
        { name: 'Investment', icon: 'trending-up', color: '#8b5cf6' },
        { name: 'Other Income', icon: 'plus-circle', color: '#f59e0b' }
      ],
      expense: [
        { name: 'Food & Dining', icon: 'utensils', color: '#ef4444' },
        { name: 'Transportation', icon: 'car', color: '#f97316' },
        { name: 'Shopping', icon: 'shopping-bag', color: '#ec4899' },
        { name: 'Entertainment', icon: 'film', color: '#8b5cf6' },
        { name: 'Bills & Utilities', icon: 'receipt', color: '#6b7280' },
        { name: 'Healthcare', icon: 'heart', color: '#dc2626' },
        { name: 'Education', icon: 'book', color: '#059669' },
        { name: 'Other', icon: 'more-horizontal', color: '#64748b' }
      ]
    };
    return defaults[type] || [];
  }
}

module.exports = CategoryRepository;