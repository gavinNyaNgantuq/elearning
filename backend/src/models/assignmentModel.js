const pool = require('../config/database');

const assignmentModel = {
  /**
   * Get tugas berdasarkan kelas
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.class_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get tugas berdasarkan guru
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.teacher_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [teacherId]
    );
    return rows;
  },

  /**
   * Get all assignments with pagination and filters
   */
  async getAll({ class_id, subject_id, teacher_id, search, page = 1, limit = 20 }) {
    let query = `
      SELECT a.*, sub.name as subject_name, c.name as class_name, u.name as teacher_name
      FROM assignments a
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN teachers t ON a.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }

    if (subject_id) {
      query += ` AND a.subject_id = ?`;
      params.push(subject_id);
    }

    if (teacher_id) {
      query += ` AND a.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (search) {
      query += ` AND a.title LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY a.due_date ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ class_id, subject_id, teacher_id, search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM assignments a
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }

    if (subject_id) {
      query += ` AND a.subject_id = ?`;
      params.push(subject_id);
    }

    if (teacher_id) {
      query += ` AND a.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (search) {
      query += ` AND a.title LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get assignment by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name, u.name as teacher_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN teachers t ON a.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create assignment
   */
  async create(assignmentData) {
    const { teacher_id, subject_id, class_id, title, description, deadline, created_by } = assignmentData;
    const [result] = await pool.execute(
      `INSERT INTO assignments (teacher_id, subject_id, class_id, title, description, deadline, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [teacher_id, subject_id, class_id, title, description || null, deadline, created_by || 1]
    );
    return { id: result.insertId, ...assignmentData };
  },

  /**
   * Update assignment
   */
  async update(id, assignmentData) {
    const { subject_id, class_id, title, description, deadline, updated_by } = assignmentData;
    const [result] = await pool.execute(
      `UPDATE assignments SET subject_id = ?, class_id = ?, title = ?, description = ?, deadline = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [subject_id, class_id, title, description || null, deadline, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete assignment
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE assignments SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get assignment by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name, u.name as teacher_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN teachers t ON a.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get assignments by class for student
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.class_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get assignments by teacher
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.teacher_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [teacherId]
    );
    return rows;
  }
};

module.exports = assignmentModel;