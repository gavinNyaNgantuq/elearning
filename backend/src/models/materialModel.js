const pool = require('../config/database');

const materialModel = {
  /**
   * Get materi terbaru
   */
  async getLatest(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.deleted_at IS NULL
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /**
   * Get materi berdasarkan kelas
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.class_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get all materials with pagination and filters
   */
  async getAll({ class_id, subject_id, teacher_id, search, page = 1, limit = 20 }) {
    let query = `
      SELECT m.*, sub.name as subject_name, c.name as class_name, u.name as teacher_name
      FROM materials m
      LEFT JOIN subjects sub ON m.subject_id = sub.id
      LEFT JOIN classes c ON m.class_id = c.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE m.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND m.class_id = ?`;
      params.push(class_id);
    }

    if (subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }

    if (teacher_id) {
      query += ` AND m.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (search) {
      query += ` AND m.title LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`;
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
      FROM materials m
      WHERE m.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND m.class_id = ?`;
      params.push(class_id);
    }

    if (subject_id) {
      query += ` AND m.subject_id = ?`;
      params.push(subject_id);
    }

    if (teacher_id) {
      query += ` AND m.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (search) {
      query += ` AND m.title LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get material by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name, u.name as teacher_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       LEFT JOIN teachers t ON m.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE m.id = ? AND m.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create material
   */
  async create(materialData) {
    const { teacher_id, subject_id, class_id, title, description, file, link, created_by } = materialData;
    const [result] = await pool.execute(
      `INSERT INTO materials (teacher_id, subject_id, class_id, title, description, file, link, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [teacher_id, subject_id, class_id, title, description || null, file || null, link || null, created_by || 1]
    );
    return { id: result.insertId, ...materialData };
  },

  /**
   * Update material
   */
  async update(id, materialData) {
    const { subject_id, class_id, title, description, file, link, updated_by } = materialData;
    const [result] = await pool.execute(
      `UPDATE materials SET subject_id = ?, class_id = ?, title = ?, description = ?, file = ?, link = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [subject_id, class_id, title, description || null, file || null, link || null, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete material
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE materials SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get materials by class for student
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT m.*, sub.name as subject_name, c.name as class_name
       FROM materials m
       LEFT JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.class_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get materials by subject
   */
  async getBySubject(subjectId) {
    const [rows] = await pool.execute(
      `SELECT m.*, c.name as class_name
       FROM materials m
       LEFT JOIN classes c ON m.class_id = c.id
       WHERE m.subject_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [subjectId]
    );
    return rows;
  }
};

module.exports = materialModel;