const pool = require('../config/database');

const materialModel = {
  /**
   * Get materi terbaru
   */
  async getLatest(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.deleted_at IS NULL
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /**
   * Get materi berdasarkan kelas
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.class_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [classId]
    );
    return rows;
  }
};

module.exports = materialModel;
