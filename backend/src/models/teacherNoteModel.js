const pool = require('../config/database');

const teacherNoteModel = {
  /**
   * Get all teacher notes with pagination and filters
   */
  async getAll({ teacher_id, student_id, page = 1, limit = 20 }) {
    let query = `
      SELECT tn.*, u.name as teacher_name, s.nis, u2.name as student_name
      FROM teacher_notes tn
      LEFT JOIN teachers t ON tn.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN students s ON tn.student_id = s.id
      LEFT JOIN users u2 ON s.user_id = u2.id
      WHERE tn.deleted_at IS NULL
    `;
    const params = [];

    if (teacher_id) {
      query += ` AND tn.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (student_id) {
      query += ` AND tn.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY tn.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ teacher_id, student_id }) {
    let query = `
      SELECT COUNT(*) as total
      FROM teacher_notes tn
      WHERE tn.deleted_at IS NULL
    `;
    const params = [];

    if (teacher_id) {
      query += ` AND tn.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (student_id) {
      query += ` AND tn.student_id = ?`;
      params.push(student_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get teacher note by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT tn.*, u.name as teacher_name, s.nis, u2.name as student_name
       FROM teacher_notes tn
       LEFT JOIN teachers t ON tn.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN students s ON tn.student_id = s.id
       LEFT JOIN users u2 ON s.user_id = u2.id
       WHERE tn.id = ? AND tn.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create teacher note
   */
  async create(noteData) {
    const { teacher_id, student_id, note } = noteData;
    const [result] = await pool.execute(
      `INSERT INTO teacher_notes (teacher_id, student_id, note, created_at)
       VALUES (?, ?, ?, NOW())`,
      [teacher_id, student_id, note]
    );
    return { id: result.insertId, ...noteData };
  },

  /**
   * Update teacher note
   */
  async update(id, noteData) {
    const { note } = noteData;
    const [result] = await pool.execute(
      `UPDATE teacher_notes SET note = ?, updated_at = NOW()
       WHERE id = ?`,
      [note, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete teacher note
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE teacher_notes SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get notes by teacher
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT tn.*, s.nis, u2.name as student_name
       FROM teacher_notes tn
       LEFT JOIN students s ON tn.student_id = s.id
       LEFT JOIN users u2 ON s.user_id = u2.id
       WHERE tn.teacher_id = ? AND tn.deleted_at IS NULL
       ORDER BY tn.created_at DESC`,
      [teacherId]
    );
    return rows;
  },

  /**
   * Get notes by student
   */
  async getByStudent(studentId) {
    const [rows] = await pool.execute(
      `SELECT tn.*, u.name as teacher_name
       FROM teacher_notes tn
       LEFT JOIN teachers t ON tn.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE tn.student_id = ? AND tn.deleted_at IS NULL
       ORDER BY tn.created_at DESC`,
      [studentId]
    );
    return rows;
  }
};

module.exports = teacherNoteModel;
