const pool = require('../config/database');

const bookCategoryModel = {
  /**
   * Get all book categories
   */
  async getAll({ search, page = 1, limit = 20 }) {
    let query = `
      SELECT bc.*
      FROM book_categories bc
      WHERE bc.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND bc.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY bc.name ASC LIMIT ? OFFSET ?`;
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
      FROM book_categories bc
      WHERE bc.deleted_at IS NULL
    `;
    const params = [];

    if (search) {
      query += ` AND bc.name LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get category by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM book_categories WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create category
   */
  async create(categoryData) {
    const { name, created_by } = categoryData;
    const [result] = await pool.execute(
      `INSERT INTO book_categories (name, created_at, created_by)
       VALUES (?, NOW(), ?)`,
      [name, created_by || 1]
    );
    return { id: result.insertId, ...categoryData };
  },

  /**
   * Update category
   */
  async update(id, categoryData) {
    const { name, updated_by } = categoryData;
    const [result] = await pool.execute(
      `UPDATE book_categories SET name = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete category
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE book_categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = bookCategoryModel;