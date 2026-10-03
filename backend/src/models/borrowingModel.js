const pool = require('../config/database');

const borrowingModel = {
  /**
   * Get all borrowings with pagination and filters
   */
  async getAll({ student_id, book_id, status, page = 1, limit = 20 }) {
    let query = `
      SELECT br.*, b.title as book_title, b.author as book_author,
             s.nis, u.name as student_name
      FROM borrowings br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN students s ON br.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE br.deleted_at IS NULL
    `;
    const params = [];

    if (student_id) {
      query += ` AND br.student_id = ?`;
      params.push(student_id);
    }

    if (book_id) {
      query += ` AND br.book_id = ?`;
      params.push(book_id);
    }

    if (status) {
      query += ` AND br.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY br.borrowed_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ student_id, book_id, status }) {
    let query = `
      SELECT COUNT(*) as total
      FROM borrowings br
      WHERE br.deleted_at IS NULL
    `;
    const params = [];

    if (student_id) {
      query += ` AND br.student_id = ?`;
      params.push(student_id);
    }

    if (book_id) {
      query += ` AND br.book_id = ?`;
      params.push(book_id);
    }

    if (status) {
      query += ` AND br.status = ?`;
      params.push(status);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get borrowing by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT br.*, b.title as book_title, b.author as book_author,
              s.nis, u.name as student_name
       FROM borrowings br
       LEFT JOIN books b ON br.book_id = b.id
       LEFT JOIN students s ON br.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE br.id = ? AND br.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create borrowing
   */
  async create(borrowingData) {
    const { book_id, student_id, borrowed_at, status, created_by } = borrowingData;
    const [result] = await pool.execute(
      `INSERT INTO borrowings (book_id, student_id, borrowed_at, status, created_at, created_by)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [book_id, student_id, borrowed_at || new Date(), status || 'dipinjam', created_by || 1]
    );
    return { id: result.insertId, ...borrowingData };
  },

  /**
   * Update borrowing
   */
  async update(id, borrowingData) {
    const { returned_at, status, updated_by } = borrowingData;
    const [result] = await pool.execute(
      `UPDATE borrowings SET returned_at = ?, status = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [returned_at || null, status || 'dipinjam', updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete borrowing
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE borrowings SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get borrowing by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT br.*, b.title as book_title, b.author as book_author,
              s.nis, u.name as student_name
       FROM borrowings br
       LEFT JOIN books b ON br.book_id = b.id
       LEFT JOIN students s ON br.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE br.id = ? AND br.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get borrowings by student
   */
  async getByStudent(studentId) {
    const [rows] = await pool.execute(
      `SELECT br.*, b.title as book_title, b.author as book_author
       FROM borrowings br
       LEFT JOIN books b ON br.book_id = b.id
       WHERE br.student_id = ? AND br.deleted_at IS NULL
       ORDER BY br.borrowed_at DESC`,
      [studentId]
    );
    return rows;
  },

  /**
   * Get borrowings by book
   */
  async getByBook(bookId) {
    const [rows] = await pool.execute(
      `SELECT br.*, s.nis, u.name as student_name
       FROM borrowings br
       LEFT JOIN students s ON br.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE br.book_id = ? AND br.deleted_at IS NULL
       ORDER BY br.borrowed_at DESC`,
      [bookId]
    );
    return rows;
  },

  /**
   * Check if book is available
   */
  async isAvailable(bookId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM borrowings
       WHERE book_id = ? AND status = 'dipinjam' AND deleted_at IS NULL`,
      [bookId]
    );
    return rows[0].count === 0;
  }
};

module.exports = borrowingModel;