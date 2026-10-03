const pool = require('../config/database');

const userModel = {
  /**
   * Get all users with role filter
   */
  async getAll({ role, search, page = 1, limit = 20 }) {
    let query = `
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name,
             u.is_active, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    if (role) {
      query += ` AND u.role_id = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ role, search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    if (role) {
      query += ` AND u.role_id = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get user by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name,
              u.is_active, u.created_at
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create user
   */
  async create(userData) {
    const { name, email, password, role_id, is_active } = userData;
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, role_id, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, password, role_id, is_active || 1]
    );
    return { id: result.insertId, name, email, role_id, is_active };
  },

  /**
   * Update user
   */
  async update(id, userData) {
    const { name, email, role_id, is_active } = userData;
    const [result] = await pool.execute(
      `UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, email, role_id, is_active, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Update nomor telepon user
   */
  async updatePhone(id, phone) {
    const [result] = await pool.execute(
      'UPDATE users SET phone = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [phone, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete user
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE users SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Change password
   */
  async changePassword(id, hashedPassword) {
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get users by role
   */
  async getByRole(roleId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.is_active
       FROM users u
       WHERE u.role_id = ? AND u.deleted_at IS NULL
       ORDER BY u.name ASC`,
      [roleId]
    );
    return rows;
  }
};

module.exports = userModel;
