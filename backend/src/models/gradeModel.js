const pool = require('../config/database');

const gradeModel = {
  /**
   * Get all grades with pagination and filters
   */
  async getAll({ student_id, subject_id, type, class_id, page = 1, limit = 20 }) {
    let query = `
      SELECT g.*, s.nis, u.name as student_name, sub.name as subject_name,
             c.name as class_name
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN subjects sub ON g.subject_id = sub.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE g.deleted_at IS NULL
    `;
    const params = [];

    if (student_id) {
      query += ` AND g.student_id = ?`;
      params.push(student_id);
    }

    if (subject_id) {
      query += ` AND g.subject_id = ?`;
      params.push(subject_id);
    }

    if (type) {
      query += ` AND g.type = ?`;
      params.push(type);
    }

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    query += ` ORDER BY g.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ student_id, subject_id, type, class_id }) {
    let query = `
      SELECT COUNT(*) as total
      FROM grades g
      LEFT JOIN students s ON g.student_id = s.id
      WHERE g.deleted_at IS NULL
    `;
    const params = [];

    if (student_id) {
      query += ` AND g.student_id = ?`;
      params.push(student_id);
    }

    if (subject_id) {
      query += ` AND g.subject_id = ?`;
      params.push(subject_id);
    }

    if (type) {
      query += ` AND g.type = ?`;
      params.push(type);
    }

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get grade by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT g.*, s.nis, u.name as student_name, sub.name as subject_name,
              c.name as class_name
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE g.id = ? AND g.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create grade
   */
  async create(gradeData) {
    const { student_id, subject_id, type, reference_id, score, created_by } = gradeData;
    const [result] = await pool.execute(
      `INSERT INTO grades (student_id, subject_id, type, reference_id, score, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [student_id, subject_id, type, reference_id || null, score, created_by || 1]
    );
    return { id: result.insertId, ...gradeData };
  },

  /**
   * Update grade
   */
  async update(id, gradeData) {
    const { type, score, updated_by } = gradeData;
    const [result] = await pool.execute(
      `UPDATE grades SET type = ?, score = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [type, score, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete grade
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE grades SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get grade by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT g.*, s.nis, u.name as student_name, sub.name as subject_name,
              c.name as class_name
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE g.id = ? AND g.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get grades by student
   */
  async getByStudent(studentId) {
    const [rows] = await pool.execute(
      `SELECT g.*, sub.name as subject_name
       FROM grades g
       LEFT JOIN subjects sub ON g.subject_id = sub.id
       WHERE g.student_id = ? AND g.deleted_at IS NULL
       ORDER BY g.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  /**
   * Get grades by class and subject
   */
  async getByClassAndSubject(classId, subjectId) {
    const [rows] = await pool.execute(
      `SELECT g.*, s.nis, u.name as student_name
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.class_id = ? AND g.subject_id = ? AND g.deleted_at IS NULL
       ORDER BY u.name ASC`,
      [classId, subjectId]
    );
    return rows;
  }
};

module.exports = gradeModel;