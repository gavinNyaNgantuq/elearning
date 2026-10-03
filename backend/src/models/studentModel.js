const pool = require('../config/database');

const studentModel = {
  /**
   * Get all students with filters
   */
  async getAll({ class_id, search, page = 1, limit = 20 }) {
    let query = `
      SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active,
             s.class_id, c.name as class_name, m.name as major_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN majors m ON c.major_id = m.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (search) {
      query += ` AND (s.nis LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.nis ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ class_id, search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (search) {
      query += ` AND (s.nis LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get student by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active,
              s.class_id, c.name as class_name, m.name as major_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create student
   */
  async create(studentData) {
    const { user_id, class_id, nis } = studentData;
    const [result] = await pool.execute(
      `INSERT INTO students (user_id, class_id, nis, created_at)
       VALUES (?, ?, ?, NOW())`,
      [user_id, class_id || null, nis || null]
    );
    return { id: result.insertId, ...studentData };
  },

  /**
   * Update student
   */
  async update(id, studentData) {
    const { class_id, nis } = studentData;
    const [result] = await pool.execute(
      `UPDATE students SET class_id = ?, nis = ?, updated_at = NOW()
       WHERE id = ?`,
      [class_id || null, nis || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete student
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE students SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get students by class
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.class_id = ? AND s.deleted_at IS NULL
       ORDER BY s.nis ASC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get student by user_id (for siswa accessing own data)
   */
  async getByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active,
              s.class_id, c.name as class_name, m.name as major_name
       FROM students s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE s.user_id = ? AND s.deleted_at IS NULL`,
      [userId]
    );
    return rows[0] || null;
  }
};

module.exports = studentModel;
