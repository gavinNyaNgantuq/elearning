const pool = require('../config/database');

const authModel = {
  /**
   * Login user
   */
  async login(username, password) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.password, u.role_id, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = ? AND u.deleted_at IS NULL`,
      [username]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  },

  /**
   * Get student data by user_id
   */
  async getStudentByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT id, class_id, nis FROM students WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Get teacher data by user_id
   */
  async getTeacherByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT id, nip FROM teachers WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  }
};

module.exports = authModel;
