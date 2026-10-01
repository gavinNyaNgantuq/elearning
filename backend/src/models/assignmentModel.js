const pool = require('../config/database');

const assignmentModel = {
  /**
   * Get tugas berdasarkan kelas
   */
  async getByClass(classId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.class_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [classId]
    );
    return rows;
  },

  /**
   * Get tugas berdasarkan guru
   */
  async getByTeacher(teacherId) {
    const [rows] = await pool.execute(
      `SELECT a.*, sub.name as subject_name, c.name as class_name
       FROM assignments a
       LEFT JOIN subjects sub ON a.subject_id = sub.id
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.teacher_id = ? AND a.deleted_at IS NULL
       ORDER BY a.due_date ASC`,
      [teacherId]
    );
    return rows;
  }
};

module.exports = assignmentModel;
