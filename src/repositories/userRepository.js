const { query } = require('../config/database');

class UserRepository {
  async create(userData) {
    const { first_name, last_name, email, password_hash } = userData;
    
    const result = await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [require('uuid').v4(), first_name, last_name, email, password_hash]
    );

    // For SQLite, we need to fetch the created user manually
    return this.findByEmail(email);
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    return result.rows[0] || null;
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

    const result = await query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async deleteById(id) {
    const result = await query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.rowCount > 0;
  }

  async emailExists(email, excludeId = null) {
    const queryStr = excludeId 
      ? 'SELECT id FROM users WHERE email = ? AND id != ?'
      : 'SELECT id FROM users WHERE email = ?';
    
    const params = excludeId ? [email, excludeId] : [email];
    const result = await query(queryStr, params);
    
    return result.rows.length > 0;
  }
}

module.exports = UserRepository;