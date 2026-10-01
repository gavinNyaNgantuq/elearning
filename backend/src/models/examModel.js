const pool = require('../config/database');

const examModel = {
  /**
   * Buat ujian baru dengan token otomatis
   */
  async create(examData) {
    const {
      title,
      subject_id,
      class_id,
      teacher_id,
      start_at,
      duration,
      token,
      created_by
    } = examData;

    const [result] = await pool.execute(
      `INSERT INTO exams (title, subject_id, class_id, teacher_id, start_at, duration, token, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subject_id, class_id, teacher_id, start_at, duration, token, created_by]
    );

    return { id: result.insertId, ...examData };
  },

  /**
   * Get ujian by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, s.name as subject_name, c.name as class_name, t.nip as teacher_nip
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN classes c ON e.class_id = c.id
       LEFT JOIN teachers t ON e.teacher_id = t.id
       WHERE e.id = ? AND e.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Get ujian by token
   */
  async getByToken(token) {
    const [rows] = await pool.execute(
      `SELECT e.*, s.name as subject_name, c.name as class_name, t.nip as teacher_nip
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN classes c ON e.class_id = c.id
       LEFT JOIN teachers t ON e.teacher_id = t.id
       WHERE e.token = ? AND e.deleted_at IS NULL`,
      [token]
    );
    return rows[0] || null;
  },

  /**
   * Get semua ujian
   */
  async getAll(filters = {}) {
    let query = `SELECT e.*, s.name as subject_name, c.name as class_name, t.nip as teacher_nip
                 FROM exams e
                 LEFT JOIN subjects s ON e.subject_id = s.id
                 LEFT JOIN classes c ON e.class_id = c.id
                 LEFT JOIN teachers t ON e.teacher_id = t.id
                 WHERE e.deleted_at IS NULL`;
    const params = [];

    if (filters.subject_id) {
      query += ' AND e.subject_id = ?';
      params.push(filters.subject_id);
    }
    if (filters.class_id) {
      query += ' AND e.class_id = ?';
      params.push(filters.class_id);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Update ujian
   */
  async update(id, examData) {
    const {
      title,
      subject_id,
      class_id,
      teacher_id,
      start_at,
      duration,
      updated_by
    } = examData;

    const [result] = await pool.execute(
      `UPDATE exams SET
        title = ?, subject_id = ?, class_id = ?, teacher_id = ?,
        start_at = ?, duration = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, subject_id, class_id, teacher_id, start_at, duration, updated_by, id]
    );

    return result.affectedRows > 0;
  },

  /**
   * Soft delete ujian
   */
  async softDelete(id, deleted_by) {
    const [result] = await pool.execute(
      'UPDATE exams SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
      [deleted_by, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get soal-soal ujian
   */
  async getQuestions(examId) {
    const [rows] = await pool.execute(
      `SELECT id, question, option_a, option_b, option_c, option_d
       FROM questions
       WHERE exam_id = ? AND deleted_at IS NULL
       ORDER BY id ASC`,
      [examId]
    );
    return rows;
  },

  /**
   * Cek apakah siswa sudah submit ujian
   */
  async hasStudentSubmitted(examId, studentId) {
    const [rows] = await pool.execute(
      'SELECT id FROM exam_answers WHERE exam_id = ? AND student_id = ? LIMIT 1',
      [examId, studentId]
    );
    return rows.length > 0;
  },

  /**
   * Submit jawaban siswa
   */
  async submitAnswers(examId, studentId, answers) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const answer of answers) {
        await connection.execute(
          `INSERT INTO exam_answers (exam_id, student_id, question_id, answer)
           VALUES (?, ?, ?, ?)`,
          [examId, studentId, answer.question_id, answer.answer]
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
  },

  /**
   * Get hasil ujian siswa
   */
  async getExamResult(examId, studentId) {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_questions,
        SUM(CASE WHEN ea.answer = q.answer THEN 1 ELSE 0 END) as correct_answers
       FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.id
       WHERE ea.exam_id = ? AND ea.student_id = ?`,
      [examId, studentId]
    );
    return rows[0];
  }
};

module.exports = examModel;
