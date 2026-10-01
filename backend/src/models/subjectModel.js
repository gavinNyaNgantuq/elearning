const pool = require('../config/database');

const subjectModel = {
  /**
   * Get semua subjects
   */
  async getAll() {
    const [rows] = await pool.execute(
      'SELECT id, name, major_id FROM subjects WHERE deleted_at IS NULL ORDER BY name ASC'
    );
    return rows;
  },

  /**
   * Get subject by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, major_id FROM subjects WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = subjectModel;
