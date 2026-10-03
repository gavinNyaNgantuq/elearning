const pool = require('../config/database');

const announcementModel = {
  /**
   * Get pengumuman terbaru
   */
  async getLatest(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /**
   * Get all announcements with pagination and filters
   */
  async getAll({ search, page = 1, limit = 20 }) {
    let query = `
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (a.title LIKE ? OR a.content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
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
      FROM announcements a
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND (a.title LIKE ? OR a.content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get announcement by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create announcement
   */
  async create(announcementData) {
    const { title, content, created_by } = announcementData;
    const [result] = await pool.execute(
      `INSERT INTO announcements (title, content, created_at, created_by)
       VALUES (?, ?, NOW(), ?)`,
      [title, content, created_by || 1]
    );
    return { id: result.insertId, ...announcementData };
  },

  /**
   * Update announcement
   */
  async update(id, announcementData) {
    const { title, content, updated_by } = announcementData;
    const [result] = await pool.execute(
      `UPDATE announcements SET title = ?, content = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete announcement
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE announcements SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get announcement by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get latest announcements
   */
  async getLatest(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
};

module.exports = announcementModel;