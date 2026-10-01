const pool = require('../config/database');

const announcementModel = {
  /**
   * Get pengumuman terbaru
   */
  async getLatest(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT a.*, u.username as author_name
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
