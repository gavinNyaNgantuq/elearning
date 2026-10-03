const pool = require('../config/database');

const attendanceModel = {
  /**
   * Get all attendances with pagination and filters
   */
  async getAll({ class_id, student_id, date, subject_id, page = 1, limit = 20 }) {
    let query = `
      SELECT a.*, s.nis, u.name as student_name, c.name as class_name,
             sub.name as subject_name
      FROM attendances a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }

    if (student_id) {
      query += ` AND a.student_id = ?`;
      params.push(student_id);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (subject_id) {
      query += ` AND a.subject_id = ?`;
      params.push(subject_id);
    }

    query += ` ORDER BY a.date DESC, a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ class_id, student_id, date, subject_id }) {
    let query = `
      SELECT COUNT(*) as total
      FROM attendances a
      WHERE a.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(class_id);
    }

    if (student_id) {
      query += ` AND a.student_id = ?`;
      params.push(student_id);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (subject_id) {
      query += ` AND a.subject_id = ?`;
      params.push(subject_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get attendance by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, s.nis, u.name as student_name, c.name as class_name,
              sub.name as subject_name
       FROM attendances a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create attendance
   */
  async create(attendanceData) {
    const { student_id, class_id, subject_id, schedule_id, date, status, note } = attendanceData;
    const [result] = await pool.execute(
      `INSERT INTO attendances (student_id, class_id, subject_id, schedule_id, date, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [student_id, class_id, subject_id || null, schedule_id || null, date, status, note || null]
    );
    return { id: result.insertId, ...attendanceData };
  },

  /**
   * Update attendance
   */
  async update(id, attendanceData) {
    const { student_id, class_id, subject_id, schedule_id, date, status, note } = attendanceData;
    const [result] = await pool.execute(
      `UPDATE attendances SET student_id = ?, class_id = ?, subject_id = ?, schedule_id = ?, date = ?, status = ?, note = ?, updated_at = NOW()
       WHERE id = ?`,
      [student_id, class_id, subject_id || null, schedule_id || null, date, status, note || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete attendance
   */
  async softDelete(id) {
    const [result] = await pool.execute(
      'UPDATE attendances SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get attendance by class and date
   */
  async getByClassAndDate(classId, date) {
    const [rows] = await pool.execute(
      `SELECT a.*, s.nis, u.name as student_name
       FROM attendances a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
       WHERE a.class_id = ? AND a.date = ? AND a.deleted_at IS NULL
       ORDER BY u.name ASC`,
      [classId, date]
    );
    return rows;
  },

  /**
   * Get attendance by student
   */
  async getByStudent(studentId) {
    const [rows] = await pool.execute(
      `SELECT a.*, c.name as class_name, sub.name as subject_name
       FROM attendances a
       LEFT JOIN classes c ON a.class_id = c.id
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = ? AND a.deleted_at IS NULL
       ORDER BY a.date DESC`,
      [studentId]
    );
    return rows;
  },

  /**
   * Bulk create attendance (for guru)
   */
  async bulkCreate(attendances) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const attendance of attendances) {
        await connection.execute(
          `INSERT INTO attendances (student_id, class_id, subject_id, schedule_id, date, status, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), updated_at = NOW()`,
          [attendance.student_id, attendance.class_id, attendance.subject_id || null, 
           attendance.schedule_id || null, attendance.date, attendance.status, 
           attendance.note || null]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = attendanceModel;
