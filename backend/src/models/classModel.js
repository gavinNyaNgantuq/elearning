const pool = require('../config/database');

const classModel = {
  /**
   * Get semua classes
   */
  async getAll() {
    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.major_id, m.name as major_name
       FROM classes c
       LEFT JOIN majors m ON c.major_id = m.id
       ORDER BY c.name ASC`
    );
    return rows;
  },

  /**
   * Get class by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.major_id, m.name as major_name
       FROM classes c
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = classModel;
