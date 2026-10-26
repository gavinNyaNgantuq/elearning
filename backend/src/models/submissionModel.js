const pool = require('../config/database');

const submissionModel = {
  /**
   * Get all submissions with pagination and filters
   */
  async getAll({ assignment_id, student_id, page = 1, limit = 20 }) {
    let query = `
      SELECT s.*, a.title as assignment_title, a.deadline,
             sub.name as subject_name, c.name as class_name,
             u.name as student_name, st.nis
      FROM submissions s
      LEFT JOIN assignments a ON s.assignment_id = a.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN students st ON s.student_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (assignment_id) {
      query += ` AND s.assignment_id = ?`;
      params.push(assignment_id);
    }

    if (student_id) {
      query += ` AND s.student_id = ?`;
      params.push(student_id);
    }

    query += ` ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get total count
   */
  async getCount({ assignment_id, student_id }) {
    let query = `
      SELECT COUNT(*) as total
      FROM submissions s
      WHERE 1=1
    `;
    const params = [];

    if (assignment_id) {
      query += ` AND s.assignment_id = ?`;
      params.push(assignment_id);
    }

    if (student_id) {
      query += ` AND s.student_id = ?`;
      params.push(student_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  },

  /**
   * Get submission by ID
   */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, a.title as assignment_title, a.deadline, a.subject_id, a.class_id,
              u.name as student_name, st.nis
       FROM submissions s
       LEFT JOIN assignments a ON s.assignment_id = a.id
       LEFT JOIN students st ON s.student_id = st.id
       LEFT JOIN users u ON st.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create submission
   */
  async create(submissionData) {
    const { assignment_id, student_id, file, file_path } = submissionData;
    const [result] = await pool.execute(
      `INSERT INTO submissions (assignment_id, student_id, file, submitted_at)
       VALUES (?, ?, ?, NOW())`,
      [assignment_id, student_id, file || file_path || null]
    );
    return { id: result.insertId, ...submissionData };
  },

  /**
   * Cek apakah siswa sudah mengumpulkan tugas ini
   */
  async checkExisting(assignment_id, student_id) {
    const [rows] = await pool.execute(
      `SELECT id FROM submissions
        WHERE assignment_id = ? AND student_id = ?
        LIMIT 1`,
      [assignment_id, student_id]
    );
    return rows[0] || null;
  },

  /**
   * Update submission (file re-upload)
   */
  async update(id, submissionData) {
    const { file, file_path } = submissionData;
    const [result] = await pool.execute(
      `UPDATE submissions SET file = ?, submitted_at = NOW()
       WHERE id = ?`,
      [file || file_path, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Grade submission (teacher gives grade)
   */
  async grade(id, gradeValue) {
    const [result] = await pool.execute(
      `UPDATE submissions SET score = ?
       WHERE id = ?`,
      [gradeValue, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete submission
   */
  async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM submissions WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get submissions by assignment
   */
  async getByAssignment(assignmentId) {
    const [rows] = await pool.execute(
      `SELECT s.*, st.nis, u.name as student_name
       FROM submissions s
       LEFT JOIN students st ON s.student_id = st.id
       LEFT JOIN users u ON st.user_id = u.id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );
    return rows;
  },

  /**
   * Get submissions by student
   */
  async getByStudent(studentId) {
    const [rows] = await pool.execute(
      `SELECT s.*, a.title as assignment_title, a.deadline
       FROM submissions s
       LEFT JOIN assignments a ON s.assignment_id = a.id
       WHERE s.student_id = ?
       ORDER BY s.submitted_at DESC`,
      [studentId]
    );
    return rows;
  }
};

module.exports = submissionModel;
