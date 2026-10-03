const pool = require('../config/database');

const teacherModel = {
  /**
   * Get all teachers with filters
   */
  async getAll({ search, page = 1, limit = 20 }) {
    let query = `
      SELECT t.id, t.nip, t.user_id, u.name, u.email, u.is_active,
             t.created_at
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (t.nip LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.nip ASC LIMIT ? OFFSET ?`;
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
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (t.nip LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get teacher by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT t.id, t.nip, t.user_id, u.name, u.email, u.is_active,
              t.created_at
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create teacher
   */
  async create(teacherData) {
    const { user_id, nip } = teacherData;
    const [result] = await pool.execute(
      `INSERT INTO teachers (user_id, nip, created_at)
       VALUES (?, ?, NOW())`,
      [user_id, nip || null]
    );
    return { id: result.insertId, ...teacherData };
  },

  /**
   * Update teacher
   */
  async update(id, teacherData) {
    const { nip } = teacherData;
    const [result] = await pool.execute(
      `UPDATE teachers SET nip = ?, updated_at = NOW()
       WHERE id = ?`,
      [nip || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete teacher
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE teachers SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get teachers with their subjects
   */
  async getWithSubjects() {
    const [rows] = await pool.execute(
      `SELECT t.id, t.nip, u.name, u.email,
              GROUP_CONCAT(s.name) as subjects
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
       LEFT JOIN subjects s ON ts.subject_id = s.id
       WHERE t.deleted_at IS NULL
       GROUP BY t.id
       ORDER BY t.nip ASC`
    );
    return rows;
  },

  /**
   * Get teacher's assigned subjects
   */
  async getTeacherSubjects(teacherId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.major_id
       FROM subjects s
       LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
       WHERE ts.teacher_id = ? AND ts.deleted_at IS NULL
       ORDER BY s.name ASC`,
      [teacherId]
    );
    return rows;
  },

  /**
   * Assign subject to teacher
   */
  async assignSubject(teacherId, subjectId) {
    const [result] = await pool.execute(
      `INSERT INTO teacher_subjects (teacher_id, subject_id, created_at)
       VALUES (?, ?, NOW())`,
      [teacherId, subjectId]
    );
    return result.insertId;
  },

  /**
   * Remove subject from teacher
   */
  async removeSubject(teacherId, subjectId) {
    const [result] = await pool.execute(
      `UPDATE teacher_subjects SET deleted_at = NOW()
       WHERE teacher_id = ? AND subject_id = ?`,
      [teacherId, subjectId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = teacherModel;
