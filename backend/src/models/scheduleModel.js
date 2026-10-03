const pool = require('../config/database');

const scheduleModel = {
  /**
   * Get jadwal berdasarkan hari
   */
  async getByDay(day) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, c.name as class_name, t.nip as teacher_nip
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       WHERE s.day = ? AND s.deleted_at IS NULL
       ORDER BY s.start_time ASC`,
      [day]
    );
    return rows;
  },

  /**
   * Get jadwal untuk siswa berdasarkan kelas
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, c.name as class_name, t.nip as teacher_nip
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       WHERE s.class_id = ? AND s.deleted_at IS NULL
       ORDER BY s.day ASC, s.start_time ASC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get jadwal untuk guru
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, c.name as class_name
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.teacher_id = ? AND s.deleted_at IS NULL
       ORDER BY s.day ASC, s.start_time ASC`,
      [teacherId]
    );
    return rows;
  },

  /**
   * Get all schedules with pagination and filters
   */
  async getAll({ class_id, teacher_id, day, page = 1, limit = 20 }) {
    let query = `
      SELECT s.*, sub.name as subject_name, c.name as class_name, t.nip as teacher_nip
      FROM schedules s
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (teacher_id) {
      query += ` AND s.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (day) {
      query += ` AND s.day = ?`;
      params.push(day);
    }

    query += ` ORDER BY s.day ASC, s.start_time ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ class_id, teacher_id, day }) {
    let query = `
      SELECT COUNT(*) as total
      FROM schedules s
      WHERE s.deleted_at IS NULL
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (teacher_id) {
      query += ` AND s.teacher_id = ?`;
      params.push(teacher_id);
    }

    if (day) {
      query += ` AND s.day = ?`;
      params.push(day);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get schedule by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, c.name as class_name, t.nip as teacher_nip
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create schedule
   */
  async create(scheduleData) {
    const { class_id, subject_id, teacher_id, room, day, start_time, end_time, created_by } = scheduleData;
    const [result] = await pool.execute(
      `INSERT INTO schedules (class_id, subject_id, teacher_id, room, day, start_time, end_time, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [class_id, subject_id, teacher_id, room || null, day, start_time, end_time, created_by || 1]
    );
    return { id: result.insertId, ...scheduleData };
  },

  /**
   * Update schedule
   */
  async update(id, scheduleData) {
    const { class_id, subject_id, teacher_id, room, day, start_time, end_time, updated_by } = scheduleData;
    const [result] = await pool.execute(
      `UPDATE schedules SET class_id = ?, subject_id = ?, teacher_id = ?, room = ?, day = ?, start_time = ?, end_time = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [class_id, subject_id, teacher_id, room || null, day, start_time, end_time, updated_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft delete schedule
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE schedules SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by || 1, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get schedules by class and day (for student view)
   */
  async getByClassAndDay(classId, day) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, t.nip as teacher_nip
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       WHERE s.class_id = ? AND s.day = ? AND s.deleted_at IS NULL
       ORDER BY s.start_time ASC`,
      [classId, day]
    );
    return rows;
  },

  /**
   * Get weekly schedule for class
   */
  async getWeeklyByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT s.*, sub.name as subject_name, t.nip as teacher_nip
       FROM schedules s
       LEFT JOIN subjects sub ON s.subject_id = sub.id
       LEFT JOIN teachers t ON s.teacher_id = t.id
       WHERE s.class_id = ? AND s.deleted_at IS NULL
       ORDER BY FIELD(s.day, 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'), s.start_time ASC`,
      [classId]
    );
    return rows;
  }
};

module.exports = scheduleModel;