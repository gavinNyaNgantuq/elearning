const pool = require('../config/database');

const correctionModel = {
  /**
   * Daftar ujian untuk koreksi.
   * Guru: hanya ujian miliknya (exams.teacher_id).
   * Admin: semua ujian.
   */
  async getExams({ teacher_id } = {}) {
    let query = `
      SELECT e.id, e.title, e.token, e.start_at, e.duration,
             e.subject_id, s.name as subject_name,
             e.class_id, c.name as class_name,
             e.teacher_id, u.name as teacher_name,
             (SELECT COUNT(DISTINCT ea.student_id)
                FROM exam_answers ea
               WHERE ea.exam_id = e.id AND ea.deleted_at IS NULL) as submitted_count,
             (SELECT COUNT(*)
                FROM students st
               WHERE st.class_id = e.class_id AND st.deleted_at IS NULL) as class_size
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN classes c ON e.class_id = c.id
        LEFT JOIN teachers t ON e.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
       WHERE e.deleted_at IS NULL
    `;
    const params = [];

    if (teacher_id) {
      query += ` AND e.teacher_id = ?`;
      params.push(teacher_id);
    }

    query += ` ORDER BY e.start_at DESC, e.id DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Ambil satu ujian (untuk cek kepemilikan).
   */
  async getExamById(id) {
    const [rows] = await pool.execute(
      `SELECT e.*, s.name as subject_name, c.name as class_name
         FROM exams e
         LEFT JOIN subjects s ON e.subject_id = s.id
         LEFT JOIN classes c ON e.class_id = c.id
        WHERE e.id = ? AND e.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Peserta ujian = seluruh siswa di kelas ujian,
   * beserta status submit, nilai otomatis PG, dan nilai manual.
   */
  async getParticipants(examId) {
    const [rows] = await pool.execute(
      `SELECT st.id as student_id, st.nis, u.name as student_name,
              c.name as class_name,
              (SELECT MIN(ea.created_at)
                 FROM exam_answers ea
                WHERE ea.exam_id = ? AND ea.student_id = st.id
                  AND ea.deleted_at IS NULL) as submitted_at,
              (SELECT COUNT(*)
                 FROM exam_answers ea
                 JOIN questions q ON ea.question_id = q.id
                WHERE ea.exam_id = ? AND ea.student_id = st.id
                  AND ea.deleted_at IS NULL AND q.deleted_at IS NULL
                  AND ea.answer = q.answer) as auto_correct,
              (SELECT COUNT(*)
                 FROM questions q
                WHERE q.exam_id = ? AND q.deleted_at IS NULL) as auto_total,
              (SELECT g.score
                 FROM grades g
                WHERE g.student_id = st.id AND g.subject_id = e.subject_id
                  AND g.type = 'ujian' AND g.reference_id = e.id
                  AND g.deleted_at IS NULL
                LIMIT 1) as manual_score
         FROM students st
         JOIN users u ON st.user_id = u.id
         LEFT JOIN classes c ON st.class_id = c.id
         JOIN exams e ON e.id = ? AND st.class_id = e.class_id
        WHERE st.deleted_at IS NULL AND e.deleted_at IS NULL
        ORDER BY u.name ASC`,
      [examId, examId, examId, examId]
    );
    return rows;
  },

  /**
   * Detail jawaban satu peserta: jawaban siswa vs kunci.
   * Kunci TIDAK disembunyikan di sini karena endpoint ini
   * hanya untuk admin/guru pengampu (bukan siswa).
   */
  async getParticipantAnswers(examId, studentId) {
    const [rows] = await pool.execute(
      `SELECT q.id as question_id, q.question,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.answer as correct_answer,
              ea.answer as student_answer,
              CASE WHEN ea.answer IS NULL THEN NULL
                   WHEN ea.answer = q.answer THEN 1 ELSE 0 END as is_correct
         FROM questions q
         LEFT JOIN exam_answers ea
           ON ea.question_id = q.id AND ea.student_id = ?
          AND ea.exam_id = ? AND ea.deleted_at IS NULL
        WHERE q.exam_id = ? AND q.deleted_at IS NULL
        ORDER BY q.id ASC`,
      [studentId, examId, examId]
    );
    return rows;
  },

  /**
   * Cek kepesertaan: siswa ada di kelas ujian?
   */
  async isParticipant(examId, studentId) {
    const [rows] = await pool.execute(
      `SELECT st.id
         FROM students st
         JOIN exams e ON e.id = ? AND st.class_id = e.class_id
        WHERE st.id = ? AND st.deleted_at IS NULL
          AND e.deleted_at IS NULL
        LIMIT 1`,
      [examId, studentId]
    );
    return rows.length > 0;
  },

  /**
   * Apakah peserta sudah submit (punya minimal 1 jawaban)?
   */
  async hasSubmitted(examId, studentId) {
    const [rows] = await pool.execute(
      `SELECT id FROM exam_answers
        WHERE exam_id = ? AND student_id = ?
          AND deleted_at IS NULL
        LIMIT 1`,
      [examId, studentId]
    );
    return rows.length > 0;
  },

  /**
   * Simpan nilai manual (upsert — tidak terduplikasi).
   * Baris lama di-soft-delete lalu insert baru agar riwayat
   * koreksi tidak hilang dan jawaban otomatis tidak tersentuh.
   * Harus dipanggil dalam transaksi oleh controller.
   * @param {object} conn koneksi transaksi (pool atau connection)
   */
  async saveManualGrade(conn, { exam, student_id, score, user_id }) {
    const executor = conn || pool;

    await executor.execute(
      `UPDATE grades
          SET deleted_at = NOW(), deleted_by = ?, updated_at = NOW()
        WHERE student_id = ? AND subject_id = ?
          AND type = 'ujian' AND reference_id = ?
          AND deleted_at IS NULL`,
      [user_id, student_id, exam.subject_id, exam.id]
    );

    const [result] = await executor.execute(
      `INSERT INTO grades
         (student_id, subject_id, type, reference_id, score,
          created_at, created_by)
       VALUES (?, ?, 'ujian', ?, ?, NOW(), ?)`,
      [student_id, exam.subject_id, exam.id, score, user_id]
    );

    return result.insertId;
  },

  /**
   * Nilai manual aktif untuk satu peserta.
   */
  async getManualGrade(examId, subjectId, studentId) {
    const [rows] = await pool.execute(
      `SELECT id, score, created_at, updated_at
         FROM grades
        WHERE student_id = ? AND subject_id = ?
          AND type = 'ujian' AND reference_id = ?
          AND deleted_at IS NULL
        LIMIT 1`,
      [studentId, subjectId, examId]
    );
    return rows[0] || null;
  }
};

module.exports = correctionModel;
