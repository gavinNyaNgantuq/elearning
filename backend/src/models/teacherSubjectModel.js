const pool = require('../config/database');

const teacherSubjectModel = {
  /**
   * Get all teacher-subject relations with pagination
   */
  async getAll({ teacher_id, subject_id, page = 1, limit = 20 }) {
    let query = `
      SELECT ts.*, u.name as teacher_name, s.name as subject_name
      FROM teacher_subjects ts
      LEFT JOIN teachers t ON ts.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.deleted_at IS NULL
    `;
    const params = [];

    if (teacher_id) {
      query += ` AND ts.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (subject_id) {
      query += ` AND ts.subject_id = ?`;
      params.push(subject_id);
    }

    query += ` ORDER BY ts.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ teacher_id, subject_id }) {
    let query = `
      SELECT COUNT(*) as total
      FROM teacher_subjects ts
      WHERE ts.deleted_at IS NULL
    `;
    const params = [];

    if (teacher_id) {
      query += ` AND ts.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (subject_id) {
      query += ` AND ts.subject_id = ?`;
      params.push(subject_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get teacher-subject by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT ts.*, u.name as teacher_name, s.name as subject_name
       FROM teacher_subjects ts
       LEFT JOIN teachers t ON ts.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN subjects s ON ts.subject_id = s.id
       WHERE ts.id = ? AND ts.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Assign subject to teacher
   */
  async create(teacherSubjectData) {
    const { teacher_id, subject_id } = teacherSubjectData;
    const [result] = await pool.execute(
      `INSERT INTO teacher_subjects (teacher_id, subject_id, created_at)
       VALUES (?, ?, NOW())`,
      [teacher_id, subject_id]
    );
    return { id: result.insertId, ...teacherSubjectData };
  },

  /**
   * Soft delete teacher-subject relation
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE teacher_subjects SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get subjects by teacher
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
  },

  /**
   * Get teachers by subject
   */
  async getBySubject(subjectId) {
    const [rows] = await pool.execute(
      `SELECT t.id, t.nip, u.name
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
       WHERE ts.subject_id = ? AND ts.deleted_at IS NULL
       ORDER BY u.name ASC`,
      [subjectId]
    );
    return rows;
  },

  /**
   * Check if relation exists
   */
  async exists(teacherId, subjectId) {
    const [rows] = await pool.execute(
      `SELECT id FROM teacher_subjects
       WHERE teacher_id = ? AND subject_id = ? AND deleted_at IS NULL`,
      [teacherId, subjectId]
    );
    return rows.length > 0;
  }
};

module.exports = teacherSubjectModel;
