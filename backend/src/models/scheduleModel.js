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
  }
};

module.exports = scheduleModel;
