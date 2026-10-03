const pool = require('../config/database');

const subjectModel = {
  /**
   * Get all subjects with pagination and filters
   */
  async getAll({ major_id, search, page = 1, limit = 20 }) {
    let query = `
      SELECT s.id, s.name, s.major_id, m.name as major_name
      FROM subjects s
      LEFT JOIN majors m ON s.major_id = m.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (major_id) {
      query += ` AND s.major_id = ?`;
      params.push(major_id);
    }

    if (search) {
      query += ` AND s.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY s.name ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ major_id, search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM subjects s
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (major_id) {
      query += ` AND s.major_id = ?`;
      params.push(major_id);
    }

    if (search) {
      query += ` AND s.name LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get subject by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.major_id, m.name as major_name
       FROM subjects s
       LEFT JOIN majors m ON s.major_id = m.id
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create subject
   */
  async create(subjectData) {
    const { name, major_id, created_by } = subjectData;
    const [result] = await pool.execute(
      `INSERT INTO subjects (name, major_id, created_at, created_by)
       VALUES (?, ?, NOW(), ?)`,
      [name, major_id || null, created_by || 1]
    );
    return { id: result.insertId, ...subjectData };
  },

  /**
   * Update subject
   */
  async update(id, subjectData) {
    const { name, major_id, updated_by } = subjectData;
    const [result] = await pool.execute(
      `UPDATE subjects SET name = ?, major_id = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, major_id || null, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete subject
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE subjects SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get subjects by major
   */
  async getByMajor(majorId) {
    const [rows] = await pool.execute(
      `SELECT id, name, major_id FROM subjects
       WHERE major_id = ? AND deleted_at IS NULL
       ORDER BY name ASC`,
      [majorId]
    );
    return rows;
  },

  /**
   * Get subjects taught by teacher
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.major_id
       FROM subjects s
       LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
       WHERE ts.teacher_id = ? AND ts.deleted_at IS NULL
       ORDER BY s.name ASC`,
      [teacherId]
    );
    return rows;
  }
};

module.exports = subjectModel;