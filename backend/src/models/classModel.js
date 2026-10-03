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
      `SELECT c.id, c.name, c.major_id, c.academic_year, m.name as major_name
       FROM classes c
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE c.id = ? AND c.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create class
   */
  async create(classData) {
    const { name, major_id, academic_year, created_by } = classData;
    const [result] = await pool.execute(
      `INSERT INTO classes (name, major_id, academic_year, created_at, created_by)
       VALUES (?, ?, ?, NOW(), ?)`,
      [name, major_id, academic_year || null, created_by || 1]
    );
    return { id: result.insertId, ...classData };
  },

  /**
   * Update class
   */
  async update(id, classData) {
    const { name, major_id, academic_year, updated_by } = classData;
    const [result] = await pool.execute(
      `UPDATE classes SET name = ?, major_id = ?, academic_year = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, major_id, academic_year || null, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete class
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE classes SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get classes for dropdown
   */
  async getForDropdown(majorId) {
    const [rows] = await pool.execute(
      `SELECT c.id, c.name, c.major_id, m.name as major_name
       FROM classes c
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE c.deleted_at IS NULL ${majorId ? 'AND c.major_id = ?' : ''}
       ORDER BY c.name ASC`,
      majorId ? [majorId] : []
    );
    return rows;
  }
};

module.exports = classModel;
