const pool = require('../config/database');

const classModel = {
  /**
   * Get semua classes dengan pagination dan filter
   */
  async getAll({ major_id, search, page = 1, limit = 20 } = {}) {
    let query = `
      SELECT c.id, c.name, c.major_id, c.academic_year, m.name as major_name
       FROM classes c
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE c.deleted_at IS NULL
    `;
    const params = [];

    if (major_id) {
      query += ` AND c.major_id = ?`;
      params.push(major_id);
    }

    if (search) {
      query += ` AND c.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY c.name ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count dengan filter yang sama
   */
  async getCount({ major_id, search } = {}) {
    let query = `
      SELECT COUNT(*) as total
       FROM classes c
       WHERE c.deleted_at IS NULL
    `;
    const params = [];

    if (major_id) {
      query += ` AND c.major_id = ?`;
      params.push(major_id);
    }

    if (search) {
      query += ` AND c.name LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
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
