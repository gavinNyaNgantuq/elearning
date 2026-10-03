const pool = require('../config/database');

const majorModel = {
  /**
   * Get all majors with pagination
   */
  async getAll({ search, page = 1, limit = 20 }) {
    let query = `
      SELECT m.*, 
             (SELECT COUNT(*) FROM classes c WHERE c.major_id = m.id AND c.deleted_at IS NULL) as class_count,
             (SELECT COUNT(*) FROM subjects s WHERE s.major_id = m.id AND s.deleted_at IS NULL) as subject_count
      FROM majors m
      WHERE m.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (m.name LIKE ? OR m.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.name ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM majors
      WHERE deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (name LIKE ? OR code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get major by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM majors WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create major
   */
  async create(majorData) {
    const { name, code, created_by } = majorData;
    const [result] = await pool.execute(
      `INSERT INTO majors (name, code, created_at, created_by)
       VALUES (?, ?, NOW(), ?)`,
      [name, code, created_by || 1]
    );
    return { id: result.insertId, ...majorData };
  },

  /**
   * Update major
   */
  async update(id, majorData) {
    const { name, code, updated_by } = majorData;
    const [result] = await pool.execute(
      `UPDATE majors SET name = ?, code = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, code, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete major
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE majors SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get all majors (for dropdowns)
   */
  async getAllForDropdown() {
    const [rows] = await pool.execute(
      `SELECT id, name, code FROM majors WHERE deleted_at IS NULL ORDER BY name ASC`
    );
    return rows;
  }
};

module.exports = majorModel;