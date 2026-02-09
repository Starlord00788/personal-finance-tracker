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

  async updateUserDefaultCurrency(userId, currency) {
    const result = await query(
      'UPDATE users SET default_currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [currency, userId]
    );

    return this.findById(userId);
  }

  async createOAuthUser(userData) {
    const { first_name, last_name, email, google_id, email_verified, auth_provider } = userData;
    
    const result = await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, google_id, email_verified, auth_provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [require('uuid').v4(), first_name, last_name, email, '', google_id, email_verified ? 1 : 0, auth_provider || 'google']
    );

    return this.findByEmail(email);
  }

  async findByGoogleId(googleId) {
    const result = await query(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );

    return result.rows[0] || null;
  }

  async updateOAuthInfo(userId, oauthData) {
    const fields = [];
    const values = [];

    if (oauthData.google_id !== undefined) {
      fields.push('google_id = ?');
      values.push(oauthData.google_id);
    }

    if (oauthData.auth_provider !== undefined) {
      fields.push('auth_provider = ?');
      values.push(oauthData.auth_provider);
    }

    if (oauthData.email_verified !== undefined) {
      fields.push('email_verified = ?');
      values.push(oauthData.email_verified ? 1 : 0);
    }

    if (fields.length === 0) {
      throw new Error('No OAuth fields to update');
    }

    values.push(userId);

    await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    return this.findById(userId);
  }
}

module.exports = UserRepository;