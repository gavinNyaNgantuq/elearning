const pool = require('../config/database');

const tahunAjaranModel = {
  /**
   * Get semua tahun ajaran (aktif + nonaktif, belum dihapus)
   */
  async getAll({ page = 1, limit = 20 }) {
    const [rows] = await pool.execute(
      `SELECT * FROM tahun_ajaran
       WHERE deleted_at IS NULL
       ORDER BY is_active DESC, name DESC, semester ASC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );
    return rows;
  },

  /**
   * Get total count
   */
  async getCount() {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM tahun_ajaran WHERE deleted_at IS NULL'
    );
    return rows[0].total;
  },

  /**
   * Get tahun ajaran by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM tahun_ajaran WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get tahun ajaran yang sedang aktif
   */
  async getActive() {
    const [rows] = await pool.execute(
      'SELECT * FROM tahun_ajaran WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1'
    );
    return rows[0] || null;
  },

  /**
   * Cek duplikasi name + semester (di luar id tertentu)
   */
  async findDuplicate(name, semester, excludeId) {
    const [rows] = await pool.execute(
      `SELECT id FROM tahun_ajaran
       WHERE name = ? AND semester = ? AND deleted_at IS NULL ${excludeId ? 'AND id != ?' : ''}`,
      excludeId ? [name, semester, excludeId] : [name, semester]
    );
    return rows[0] || null;
  },

  /**
   * Create tahun ajaran
   */
  async create({ name, semester, start_date, end_date, is_active, created_by }) {
    const [result] = await pool.execute(
      `INSERT INTO tahun_ajaran (name, semester, start_date, end_date, is_active, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [name, semester, start_date || null, end_date || null, is_active ? 1 : 0, created_by || null]
    );
    return result.insertId;
  },

  /**
   * Update tahun ajaran
   */
  async update(id, { name, semester, start_date, end_date, is_active, updated_by }) {
    const [result] = await pool.execute(
      `UPDATE tahun_ajaran
       SET name = ?, semester = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW(), updated_by = ?
       WHERE id = ?`,
      [name, semester, start_date || null, end_date || null, is_active ? 1 : 0, updated_by || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete tahun ajaran
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE tahun_ajaran SET deleted_at = NOW(), deleted_by = ?, is_active = 0 WHERE id = ?',
      [deleted_by || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Nonaktifkan semua tahun ajaran (sebelum mengaktifkan satu)
   */
  async deactivateAll(updated_by) {
    await pool.execute(
      'UPDATE tahun_ajaran SET is_active = 0, updated_at = NOW(), updated_by = ? WHERE deleted_at IS NULL',
      [updated_by || null]
    );
  }
};

module.exports = tahunAjaranModel;
