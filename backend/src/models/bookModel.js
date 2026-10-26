const pool = require('../config/database');

const bookModel = {
  /**
   * Get all books with pagination and filters
   */
  async getAll({ category_id, search, page = 1, limit = 20 }) {
    let query = `
      SELECT b.*, bc.name as category_name
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.id
      WHERE b.deleted_at IS NULL
    `;
    const params = [];

    if (category_id) {
      query += ` AND b.category_id = ?`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ category_id, search }) {
    let query = `
      SELECT COUNT(*) as total
      FROM books b
      WHERE b.deleted_at IS NULL
    `;
    const params = [];

    if (category_id) {
      query += ` AND b.category_id = ?`;
      params.push(category_id);
    }

    if (search) {
      query += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get book by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT b.*, bc.name as category_name
       FROM books b
       LEFT JOIN book_categories bc ON b.category_id = bc.id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create book
   */
  async create(bookData) {
    const { category_id, title, author, file, created_by } = bookData;
    const [result] = await pool.execute(
      `INSERT INTO books (category_id, title, author, file, created_at, created_by)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [category_id || null, title, author || null, file || null, created_by || 1]
    );
    return { id: result.insertId, ...bookData };
  },

  /**
   * Update book
   */
  async update(id, bookData) {
    const { category_id, title, author, file, updated_by } = bookData;
    const [result] = await pool.execute(
      `UPDATE books SET category_id = ?, title = ?, author = ?, file = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [category_id || null, title, author || null, file || null, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete book
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE books SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get book by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT b.*, bc.name as category_name
       FROM books b
       LEFT JOIN book_categories bc ON b.category_id = bc.id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get books by category
   */
  async getByCategory(categoryId) {
    const [rows] = await pool.execute(
      `SELECT * FROM books
       WHERE category_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [categoryId]
    );
    return rows;
  },

  /**
   * Search books
   */
  async search(query) {
    const [rows] = await pool.execute(
      `SELECT b.*, bc.name as category_name
       FROM books b
       LEFT JOIN book_categories bc ON b.category_id = bc.id
       WHERE b.deleted_at IS NULL
       AND (b.title LIKE ? OR b.author LIKE ?)
       ORDER BY b.created_at DESC
       LIMIT 20`,
      [`%${query}%`, `%${query}%`]
    );
    return rows;
  }
};

module.exports = bookModel;