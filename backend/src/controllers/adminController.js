const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const adminController = {
  // ============== DASHBOARD ==============
  async getDashboardStats(req, res) {
    try {
      const [students] = await pool.execute('SELECT COUNT(*) as total FROM students WHERE deleted_at IS NULL');
      const [teachers] = await pool.execute('SELECT COUNT(*) as total FROM teachers WHERE deleted_at IS NULL');
      const [classes] = await pool.execute('SELECT COUNT(*) as total FROM classes WHERE deleted_at IS NULL');
      const [subjects] = await pool.execute('SELECT COUNT(*) as total FROM subjects WHERE deleted_at IS NULL');
      const [exams] = await pool.execute('SELECT COUNT(*) as total FROM exams WHERE deleted_at IS NULL');
      const [materials] = await pool.execute('SELECT COUNT(*) as total FROM materials WHERE deleted_at IS NULL');
      const [assignment] = await pool.execute('SELECT COUNT(*) as total FROM assignments WHERE deleted_at IS NULL');
      const [todayExams] = await pool.execute(
        `SELECT COUNT(*) as total FROM exams WHERE deleted_at IS NULL AND DATE(start_time) = CURDATE()`
      );
      
      res.json({
        success: true,
        data: {
          total_siswa: students[0].total,
          total_guru: teachers[0].total,
          total_kelas: classes[0].total,
          total_mapel: subjects[0].total,
          total_ujian: exams[0].total,
          total_materi: materials[0].total,
          total_tugas: assignment[0].total,
          ujian_hari_ini: todayExams[0].total
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
    }
  },

  // ============== USERS ==============
  async getAllUsers(req, res) {
    try {
      const { role, search, page = 1, limit = 20 } = req.query;
      let query = `
        SELECT u.id, u.name, u.email, u.role_id, r.name as role_name,
               u.is_active, u.created_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.deleted_at IS NULL
      `;
      const params = [];

      if (role) { query += ` AND u.role_id = ?`; params.push(parseInt(role)); }
      if (search) { query += ` AND (u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
      
      query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const [rows] = await pool.execute(query, params);
      
      let countQuery = `SELECT COUNT(*) as total FROM users u WHERE u.deleted_at IS NULL`;
      const countParams = [];
      if (role) { countQuery += ` AND u.role_id = ?`; countParams.push(parseInt(role)); }
      if (search) { countQuery += ` AND (u.name LIKE ? OR u.email LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
      });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async getUserById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.is_active, u.created_at
         FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.deleted_at IS NULL`,
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async createUser(req, res) {
    try {
      const { name, email, password, role_id, status } = req.body;
      if (!name || !email || !password || !role_id) {
        return res.status(400).json({ success: false, message: 'Name, email, password, dan role wajib diisi' });
      }
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
      if (existing.length > 0) return res.status(400).json({ success: false, message: 'Email sudah digunakan' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        `INSERT INTO users (name, email, password, role_id, is_active, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
        [name, email, hashedPassword, parseInt(role_id), status || 1]
      );

      if (parseInt(role_id) === 3) {
        await pool.execute(`INSERT INTO students (user_id, nis, class_id, created_at) VALUES (?, ?, ?, NOW())`,
          [result.insertId, req.body.nis || null, req.body.class_id || null]);
      } else if (parseInt(role_id) === 2) {
        await pool.execute(`INSERT INTO teachers (user_id, nip, created_at) VALUES (?, ?, NOW())`,
          [result.insertId, req.body.nip || null]);
      }

      res.status(201).json({ success: true, message: 'Pengguna berhasil dibuat', data: { id: result.insertId, email, role_id: parseInt(role_id) } });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async updateUser(req, res) {
    try {
      const { name, email, role_id, is_active } = req.body;
      const [rows] = await pool.execute('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });

      if (email && email !== rows[0].email) {
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL', [email, req.params.id]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
      }

      await pool.execute(`UPDATE users SET name = ?, email = ?, role_id = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [name, email, role_id ? parseInt(role_id) : undefined, is_active !== undefined ? parseInt(is_active) : undefined, req.params.id]);
      res.json({ success: true, message: 'Pengguna berhasil diperbarui' });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async deleteUser(req, res) {
    try {
      if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
      const [result] = await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      res.json({ success: true, message: 'Pengguna berhasil dihapus' });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  // ============== STUDENTS ==============
  async getAllStudents(req, res) {
    try {
      const { class_id, search, page = 1, limit = 20 } = req.query;
      let query = `SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active, s.class_id, c.name as class_name FROM students s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN classes c ON s.class_id = c.id WHERE s.deleted_at IS NULL`;
      const params = [];
      if (class_id) { query += ` AND s.class_id = ?`; params.push(parseInt(class_id)); }
      if (search) { query += ` AND (s.nis LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      query += ` ORDER BY s.nis ASC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
      const [rows] = await pool.execute(query, params);
      let countQuery = `SELECT COUNT(*) as total FROM students s WHERE s.deleted_at IS NULL`;
      const countParams = [];
      if (class_id) { countQuery += ` AND s.class_id = ?`; countParams.push(parseInt(class_id)); }
      if (search) { countQuery += ` AND EXISTS (SELECT 1 FROM students s2 LEFT JOIN users u ON s2.user_id = u.id WHERE (s2.nis LIKE ? OR u.name LIKE ?) AND s2.deleted_at IS NULL)`; countParams.push(`%${search}%`, `%${search}%`); }
      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
      });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async getStudentById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.nis, s.user_id, u.name, u.email, u.is_active, s.class_id, c.name as class_name, m.name as major_name
         FROM students s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN majors m ON c.major_id = m.id WHERE s.id = ? AND s.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async createStudent(req, res) {
    try {
      const { name, email, password, nis, class_id } = req.body;
      if (!name || !email || !password || !nis || !class_id) return res.status(400).json({ success: false, message: 'Name, email, password, NIS, dan kelas wajib diisi' });
      const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
      if (existingUser.length > 0) return res.status(400).json({ success: false, message: 'Email sudah ada' });
      const [existingNis] = await pool.execute('SELECT id FROM students WHERE nis = ? AND deleted_at IS NULL', [nis]);
      if (existingNis.length > 0) return res.status(400).json({ success: false, message: 'NIS sudah ada' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userResult] = await pool.execute(`INSERT INTO users (name, email, password, role_id, is_active, created_at) VALUES (?, ?, ?, 3, ?, NOW())`, [name, email, hashedPassword, 1]);
      const [studentResult] = await pool.execute(`INSERT INTO students (user_id, nis, class_id, created_at) VALUES (?, ?, ?, NOW())`, [userResult.insertId, nis, parseInt(class_id)]);

      res.status(201).json({ success: true, message: 'Siswa berhasil dibuat', data: { id: studentResult.insertId, email, nis, class_id: parseInt(class_id) } });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async deleteStudent(req, res) {
    try {
      const [rows] = await pool.execute('SELECT s.*, u.name FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
      const [result] = await pool.execute('UPDATE students SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
      await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [rows[0].user_id]);
      res.json({ success: true, message: 'Siswa berhasil dihapus' });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  // ============== TEACHERS ==============
  async getAllTeachers(req, res) {
    try {
      const { search, page = 1, limit = 20 } = req.query;
      let query = `SELECT t.id, t.nip, t.user_id, u.name, u.email, u.is_active, t.created_at FROM teachers t LEFT JOIN users u ON t.user_id = u.id WHERE t.deleted_at IS NULL`;
      const params = [];
      if (search) { query += ` AND (t.nip LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      query += ` ORDER BY t.nip ASC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
      const [rows] = await pool.execute(query, params);
      let countQuery = `SELECT COUNT(*) as total FROM teachers t WHERE t.deleted_at IS NULL`;
      const countParams = [];
      if (search) { countQuery += ` AND EXISTS (SELECT 1 FROM teachers t2 LEFT JOIN users u ON t2.user_id = u.id WHERE (t2.nip LIKE ? OR u.name LIKE ?) AND t2.deleted_at IS NULL)`; countParams.push(`%${search}%`, `%${search}%`); }
      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
      });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async getTeacherById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT t.id, t.nip, t.user_id, u.name, u.email, u.is_active FROM teachers t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ? AND t.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async createTeacher(req, res) {
    try {
      const { name, email, password, nip } = req.body;
      if (!name || !email || !password || !nip) return res.status(400).json({ success: false, message: 'Name, email, password, dan NIP wajib diisi' });
      const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
      if (existingUser.length > 0) return res.status(400).json({ success: false, message: 'Email sudah ada' });
      const [existingNip] = await pool.execute('SELECT id FROM teachers WHERE nip = ? AND deleted_at IS NULL', [nip]);
      if (existingNip.length > 0) return res.status(400).json({ success: false, message: 'NIP sudah ada' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userResult] = await pool.execute(`INSERT INTO users (name, email, password, role_id, is_active, created_at) VALUES (?, ?, ?, 2, ?, NOW())`, [name, email, hashedPassword, 1]);
      const [teacherResult] = await pool.execute(`INSERT INTO teachers (user_id, nip, created_at) VALUES (?, ?, NOW())`, [userResult.insertId, nip]);

      res.status(201).json({ success: true, message: 'Guru berhasil dibuat', data: { id: teacherResult.insertId, email, nip } });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async deleteTeacher(req, res) {
    try {
      const [rows] = await pool.execute('SELECT t.*, u.name FROM teachers t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ? AND t.deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });
      const [result] = await pool.execute('UPDATE teachers SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });
      await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [rows[0].user_id]);
      res.json({ success: true, message: 'Guru berhasil dihapus' });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  // ============== REPORTS ==============
  async generateStudentReport(req, res) {
    try {
      const [report] = await pool.execute(`SELECT s.id, s.nis, u.name, c.name as class_name, m.name as major_name, u.is_active FROM students s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN majors m ON c.major_id = m.id WHERE s.deleted_at IS NULL ORDER BY c.name, s.nis`);
      res.json({ success: true, data: report });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async generateTeacherReport(req, res) {
    try {
      const [report] = await pool.execute(`SELECT t.id, t.nip, u.name, u.email FROM teachers t LEFT JOIN users u ON t.user_id = u.id WHERE t.deleted_at IS NULL ORDER BY t.nip`);
      res.json({ success: true, data: report });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  // ============== GRADES ==============
  async getAllGrades(req, res) {
    try {
      const { subject_id, student_id, page = 1, limit = 20 } = req.query;
      let query = `SELECT g.*, s.nis, u.name as student_name, sub.name as subject_name FROM grades g LEFT JOIN students s ON g.student_id = s.id LEFT JOIN users u ON s.user_id = u.id LEFT JOIN subjects sub ON g.subject_id = sub.id WHERE g.deleted_at IS NULL`;
      const params = [];
      if (subject_id) { query += ` AND g.subject_id = ?`; params.push(parseInt(subject_id)); }
      if (student_id) { query += ` AND g.student_id = ?`; params.push(parseInt(student_id)); }
      query += ` ORDER BY g.id DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
      const [rows] = await pool.execute(query, params);
      let countQuery = `SELECT COUNT(*) as total FROM grades g WHERE g.deleted_at IS NULL`;
      const countParams = [];
      if (subject_id) { countQuery += ` AND g.subject_id = ?`; countParams.push(parseInt(subject_id)); }
      if (student_id) { countQuery += ` AND g.student_id = ?`; countParams.push(parseInt(student_id)); }
      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
      });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async getGradeById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT g.*, s.nis, u.name as student_name, sub.name as subject_name FROM grades g LEFT JOIN students s ON g.student_id = s.id LEFT JOIN users u ON s.user_id = u.id LEFT JOIN subjects sub ON g.subject_id = sub.id WHERE g.id = ? AND g.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  // ============== ATTENDANCE ==============
  async getAllAttendances(req, res) {
    try {
      const { student_id, schedule_id, date, page = 1, limit = 20 } = req.query;
      let query = `SELECT a.*, s.nis, u.name as student_name, c.name as class_name FROM attendances a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN users u ON s.user_id = u.id LEFT JOIN classes c ON a.class_id = c.id WHERE a.deleted_at IS NULL`;
      const params = [];
      if (student_id) { query += ` AND a.student_id = ?`; params.push(parseInt(student_id)); }
      if (schedule_id) { query += ` AND a.schedule_id = ?`; params.push(parseInt(schedule_id)); }
      if (date) { query += ` AND a.date = ?`; params.push(date); }
      query += ` ORDER BY a.date DESC, a.id DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
      const [rows] = await pool.execute(query, params);
      let countQuery = `SELECT COUNT(*) as total FROM attendances a WHERE a.deleted_at IS NULL`;
      const countParams = [];
      if (student_id) { countQuery += ` AND a.student_id = ?`; countParams.push(parseInt(student_id)); }
      if (schedule_id) { countQuery += ` AND a.schedule_id = ?`; countParams.push(parseInt(schedule_id)); }
      if (date) { countQuery += ` AND a.date = ?`; countParams.push(date); }
      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / limit) }
      });
    } catch (error) { 
      console.error('Error:', error); 
      res.status(500).json({ success: false, message: 'Gagal' }); 
    }
  },

  async getAttendanceById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT a.*, s.nis, u.name as student_name FROM attendances a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN users u ON s.user_id = u.id WHERE a.id = ? AND a.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Absensi tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== STUDENTS (CONT.) ==============
  async updateStudent(req, res) {
    try {
      const { name, email, nis, class_id } = req.body;
      const [rows] = await pool.execute(
        `SELECT s.id, s.nis, s.class_id, s.user_id, u.name, u.email FROM students s
         LEFT JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

      if (nis && nis !== rows[0].nis) {
        const [dup] = await pool.execute('SELECT id FROM students WHERE nis = ? AND id != ? AND deleted_at IS NULL', [nis, req.params.id]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: 'NIS sudah ada' });
      }
      if (email && email !== rows[0].email) {
        const [dup] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL', [email, rows[0].user_id]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
      }

      await pool.execute('UPDATE students SET nis = ?, class_id = ?, updated_at = NOW() WHERE id = ?',
        [nis || rows[0].nis, class_id ? parseInt(class_id) : rows[0].class_id, req.params.id]);
      await pool.execute('UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [name || rows[0].name, email || rows[0].email, rows[0].user_id]);
      res.json({ success: true, message: 'Siswa berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async importStudents(req, res) {
    try {
      const students = Array.isArray(req.body) ? req.body : req.body.students;
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ success: false, message: 'Data siswa tidak valid' });
      }
      let created = 0, skipped = 0;
      const errors = [];
      for (const s of students) {
        try {
          if (!s.name || !s.email || !s.nis || !s.class_id) { skipped++; errors.push({ ...s, message: 'Data tidak lengkap' }); continue; }
          const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [s.email]);
          const [existingNis] = await pool.execute('SELECT id FROM students WHERE nis = ? AND deleted_at IS NULL', [s.nis]);
          if (existingUser.length > 0 || existingNis.length > 0) { skipped++; continue; }
          const hashedPassword = await bcrypt.hash(s.password || s.nis, 10);
          const [userResult] = await pool.execute(`INSERT INTO users (name, email, password, role_id, is_active, created_at) VALUES (?, ?, ?, 3, ?, NOW())`, [s.name, s.email, hashedPassword, 1]);
          await pool.execute(`INSERT INTO students (user_id, nis, class_id, created_at) VALUES (?, ?, ?, NOW())`, [userResult.insertId, s.nis, parseInt(s.class_id)]);
          created++;
        } catch (rowError) {
          skipped++;
          errors.push({ ...s, message: rowError.message });
        }
      }
      res.json({ success: true, message: `${created} siswa berhasil diimpor`, data: { created, skipped, errors } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== TEACHERS (CONT.) ==============
  async updateTeacher(req, res) {
    try {
      const { name, email, nip } = req.body;
      const [rows] = await pool.execute(
        `SELECT t.id, t.nip, t.user_id, u.name, u.email FROM teachers t
         LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ? AND t.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Guru tidak ditemukan' });

      if (nip && nip !== rows[0].nip) {
        const [dup] = await pool.execute('SELECT id FROM teachers WHERE nip = ? AND id != ? AND deleted_at IS NULL', [nip, req.params.id]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: 'NIP sudah ada' });
      }
      if (email && email !== rows[0].email) {
        const [dup] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL', [email, rows[0].user_id]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
      }

      await pool.execute('UPDATE teachers SET nip = ?, updated_at = NOW() WHERE id = ?', [nip || rows[0].nip, req.params.id]);
      await pool.execute('UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?',
        [name || rows[0].name, email || rows[0].email, rows[0].user_id]);
      res.json({ success: true, message: 'Guru berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== CLASSES ==============
  async getAllClasses(req, res) {
    try {
      const { major_id, search, page = 1, limit = 50 } = req.query;
      const where = ['c.deleted_at IS NULL'];
      const params = [];
      if (major_id) { where.push('c.major_id = ?'); params.push(parseInt(major_id)); }
      if (search) { where.push('c.name LIKE ?'); params.push(`%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(`SELECT c.*, m.name as major_name FROM classes c LEFT JOIN majors m ON c.major_id = m.id WHERE ${whereClause} ORDER BY c.name ASC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM classes c WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getClassById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT c.*, m.name as major_name FROM classes c LEFT JOIN majors m ON c.major_id = m.id WHERE c.id = ? AND c.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createClass(req, res) {
    try {
      const { name, major_id, academic_year } = req.body;
      if (!name || !major_id) return res.status(400).json({ success: false, message: 'Nama kelas dan jurusan wajib diisi' });
      const [major] = await pool.execute('SELECT id FROM majors WHERE id = ? AND deleted_at IS NULL', [parseInt(major_id)]);
      if (major.length === 0) return res.status(400).json({ success: false, message: 'Jurusan tidak valid' });
      const [result] = await pool.execute(`INSERT INTO classes (name, major_id, academic_year, created_at, created_by) VALUES (?, ?, ?, NOW(), ?)`,
        [name, parseInt(major_id), academic_year || null, req.user.id]);
      res.status(201).json({ success: true, message: 'Kelas berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateClass(req, res) {
    try {
      const { name, major_id, academic_year } = req.body;
      const [rows] = await pool.execute('SELECT * FROM classes WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
      if (major_id) {
        const [major] = await pool.execute('SELECT id FROM majors WHERE id = ? AND deleted_at IS NULL', [parseInt(major_id)]);
        if (major.length === 0) return res.status(400).json({ success: false, message: 'Jurusan tidak valid' });
      }
      await pool.execute(`UPDATE classes SET name = ?, major_id = ?, academic_year = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [name || rows[0].name, major_id ? parseInt(major_id) : rows[0].major_id, academic_year !== undefined ? academic_year : rows[0].academic_year, req.user.id, req.params.id]);
      res.json({ success: true, message: 'Kelas berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteClass(req, res) {
    try {
      const [inUse] = await pool.execute('SELECT COUNT(*) as total FROM students WHERE class_id = ? AND deleted_at IS NULL', [req.params.id]);
      if (inUse[0].total > 0) return res.status(400).json({ success: false, message: 'Kelas masih memiliki siswa' });
      const [result] = await pool.execute('UPDATE classes SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
      res.json({ success: true, message: 'Kelas berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== SUBJECTS ==============
  async getAllSubjects(req, res) {
    try {
      const { major_id, search, page = 1, limit = 50 } = req.query;
      const where = ['sub.deleted_at IS NULL'];
      const params = [];
      if (major_id) { where.push('sub.major_id = ?'); params.push(parseInt(major_id)); }
      if (search) { where.push('sub.name LIKE ?'); params.push(`%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(`SELECT sub.*, m.name as major_name FROM subjects sub LEFT JOIN majors m ON sub.major_id = m.id WHERE ${whereClause} ORDER BY sub.name ASC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM subjects sub WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getSubjectById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT sub.*, m.name as major_name FROM subjects sub LEFT JOIN majors m ON sub.major_id = m.id WHERE sub.id = ? AND sub.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createSubject(req, res) {
    try {
      const { name, major_id } = req.body;
      if (!name || !major_id) return res.status(400).json({ success: false, message: 'Nama mapel dan jurusan wajib diisi' });
      const [major] = await pool.execute('SELECT id FROM majors WHERE id = ? AND deleted_at IS NULL', [parseInt(major_id)]);
      if (major.length === 0) return res.status(400).json({ success: false, message: 'Jurusan tidak valid' });
      const [result] = await pool.execute(`INSERT INTO subjects (name, major_id, created_at, created_by) VALUES (?, ?, NOW(), ?)`,
        [name, parseInt(major_id), req.user.id]);
      res.status(201).json({ success: true, message: 'Mapel berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateSubject(req, res) {
    try {
      const { name, major_id } = req.body;
      const [rows] = await pool.execute('SELECT * FROM subjects WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
      if (major_id) {
        const [major] = await pool.execute('SELECT id FROM majors WHERE id = ? AND deleted_at IS NULL', [parseInt(major_id)]);
        if (major.length === 0) return res.status(400).json({ success: false, message: 'Jurusan tidak valid' });
      }
      await pool.execute(`UPDATE subjects SET name = ?, major_id = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [name || rows[0].name, major_id ? parseInt(major_id) : rows[0].major_id, req.user.id, req.params.id]);
      res.json({ success: true, message: 'Mapel berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteSubject(req, res) {
    try {
      const [inUse] = await pool.execute('SELECT COUNT(*) as total FROM schedules WHERE subject_id = ? AND deleted_at IS NULL', [req.params.id]);
      if (inUse[0].total > 0) return res.status(400).json({ success: false, message: 'Mapel masih digunakan pada jadwal' });
      const [result] = await pool.execute('UPDATE subjects SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Mapel tidak ditemukan' });
      res.json({ success: true, message: 'Mapel berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== MAJORS ==============
  async getAllMajors(req, res) {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const where = ['m.deleted_at IS NULL'];
      const params = [];
      if (search) { where.push('(m.name LIKE ? OR m.code LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(`SELECT m.*, (SELECT COUNT(*) FROM classes c WHERE c.major_id = m.id AND c.deleted_at IS NULL) as total_kelas FROM majors m WHERE ${whereClause} ORDER BY m.name ASC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM majors m WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getMajorById(req, res) {
    try {
      const [rows] = await pool.execute(`SELECT m.*, (SELECT COUNT(*) FROM classes c WHERE c.major_id = m.id AND c.deleted_at IS NULL) as total_kelas FROM majors m WHERE m.id = ? AND m.deleted_at IS NULL`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Jurusan tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createMajor(req, res) {
    try {
      const { name, code } = req.body;
      if (!name || !code) return res.status(400).json({ success: false, message: 'Nama dan kode jurusan wajib diisi' });
      const [dup] = await pool.execute('SELECT id FROM majors WHERE code = ? AND deleted_at IS NULL', [code]);
      if (dup.length > 0) return res.status(400).json({ success: false, message: 'Kode jurusan sudah ada' });
      const [result] = await pool.execute(`INSERT INTO majors (name, code, created_at, created_by) VALUES (?, ?, NOW(), ?)`, [name, code, req.user.id]);
      res.status(201).json({ success: true, message: 'Jurusan berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateMajor(req, res) {
    try {
      const { name, code } = req.body;
      const [rows] = await pool.execute('SELECT * FROM majors WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Jurusan tidak ditemukan' });
      if (code && code !== rows[0].code) {
        const [dup] = await pool.execute('SELECT id FROM majors WHERE code = ? AND id != ? AND deleted_at IS NULL', [code, req.params.id]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: 'Kode jurusan sudah ada' });
      }
      await pool.execute(`UPDATE majors SET name = ?, code = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [name || rows[0].name, code || rows[0].code, req.user.id, req.params.id]);
      res.json({ success: true, message: 'Jurusan berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteMajor(req, res) {
    try {
      const [inUse] = await pool.execute('SELECT COUNT(*) as total FROM classes WHERE major_id = ? AND deleted_at IS NULL', [req.params.id]);
      if (inUse[0].total > 0) return res.status(400).json({ success: false, message: 'Jurusan masih memiliki kelas' });
      const [result] = await pool.execute('UPDATE majors SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Jurusan tidak ditemukan' });
      res.json({ success: true, message: 'Jurusan berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== SCHEDULES ==============
  async getAllSchedules(req, res) {
    try {
      const { class_id, subject_id, teacher_id, day, page = 1, limit = 50 } = req.query;
      const where = ['sch.deleted_at IS NULL'];
      const params = [];
      if (class_id) { where.push('sch.class_id = ?'); params.push(parseInt(class_id)); }
      if (subject_id) { where.push('sch.subject_id = ?'); params.push(parseInt(subject_id)); }
      if (teacher_id) { where.push('sch.teacher_id = ?'); params.push(parseInt(teacher_id)); }
      if (day) { where.push('sch.day = ?'); params.push(day); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(
        `SELECT sch.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name, m.name as major_name
         FROM schedules sch
         LEFT JOIN classes c ON sch.class_id = c.id
         LEFT JOIN subjects sub ON sch.subject_id = sub.id
         LEFT JOIN teachers t ON sch.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN majors m ON c.major_id = m.id
         WHERE ${whereClause} ORDER BY sch.day, sch.start_time LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM schedules sch WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getScheduleById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT sch.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name
         FROM schedules sch
         LEFT JOIN classes c ON sch.class_id = c.id
         LEFT JOIN subjects sub ON sch.subject_id = sub.id
         LEFT JOIN teachers t ON sch.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE sch.id = ? AND sch.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createSchedule(req, res) {
    try {
      const { class_id, subject_id, teacher_id, room, day, start_time, end_time } = req.body;
      if (!class_id || !subject_id || !teacher_id) return res.status(400).json({ success: false, message: 'Kelas, mapel, dan guru wajib diisi' });
      for (const [table, id, label] of [['classes', class_id, 'Kelas'], ['subjects', subject_id, 'Mapel'], ['teachers', teacher_id, 'Guru']]) {
        const [ref] = await pool.execute(`SELECT id FROM ${table} WHERE id = ? AND deleted_at IS NULL`, [parseInt(id)]);
        if (ref.length === 0) return res.status(400).json({ success: false, message: `${label} tidak valid` });
      }
      const [result] = await pool.execute(
        `INSERT INTO schedules (class_id, subject_id, teacher_id, room, day, start_time, end_time, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(class_id), parseInt(subject_id), parseInt(teacher_id), room || null, day || null, start_time || null, end_time || null, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Jadwal berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateSchedule(req, res) {
    try {
      const { class_id, subject_id, teacher_id, room, day, start_time, end_time } = req.body;
      const [rows] = await pool.execute('SELECT * FROM schedules WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
      if (class_id) {
        const [ref] = await pool.execute('SELECT id FROM classes WHERE id = ? AND deleted_at IS NULL', [parseInt(class_id)]);
        if (ref.length === 0) return res.status(400).json({ success: false, message: 'Kelas tidak valid' });
      }
      if (subject_id) {
        const [ref] = await pool.execute('SELECT id FROM subjects WHERE id = ? AND deleted_at IS NULL', [parseInt(subject_id)]);
        if (ref.length === 0) return res.status(400).json({ success: false, message: 'Mapel tidak valid' });
      }
      if (teacher_id) {
        const [ref] = await pool.execute('SELECT id FROM teachers WHERE id = ? AND deleted_at IS NULL', [parseInt(teacher_id)]);
        if (ref.length === 0) return res.status(400).json({ success: false, message: 'Guru tidak valid' });
      }
      await pool.execute(
        `UPDATE schedules SET class_id = ?, subject_id = ?, teacher_id = ?, room = ?, day = ?, start_time = ?, end_time = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [class_id ? parseInt(class_id) : rows[0].class_id, subject_id ? parseInt(subject_id) : rows[0].subject_id,
         teacher_id ? parseInt(teacher_id) : rows[0].teacher_id,
         room !== undefined ? room : rows[0].room, day !== undefined ? day : rows[0].day,
         start_time || null, end_time || null, req.user.id, req.params.id]
      );
      res.json({ success: true, message: 'Jadwal berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteSchedule(req, res) {
    try {
      const [result] = await pool.execute('UPDATE schedules SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
      res.json({ success: true, message: 'Jadwal berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== MATERIALS ==============
  async getAllMaterials(req, res) {
    try {
      const { subject_id, class_id, search, page = 1, limit = 50 } = req.query;
      const where = ['mat.deleted_at IS NULL'];
      const params = [];
      if (subject_id) { where.push('mat.subject_id = ?'); params.push(parseInt(subject_id)); }
      if (class_id) { where.push('mat.class_id = ?'); params.push(parseInt(class_id)); }
      if (search) { where.push('mat.title LIKE ?'); params.push(`%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(
        `SELECT mat.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name
         FROM materials mat
         LEFT JOIN classes c ON mat.class_id = c.id
         LEFT JOIN subjects sub ON mat.subject_id = sub.id
         LEFT JOIN teachers t ON mat.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE ${whereClause} ORDER BY mat.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM materials mat WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getMaterialById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT mat.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name
         FROM materials mat
         LEFT JOIN classes c ON mat.class_id = c.id
         LEFT JOIN subjects sub ON mat.subject_id = sub.id
         LEFT JOIN teachers t ON mat.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE mat.id = ? AND mat.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createMaterial(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, file, link } = req.body;
      if (!teacher_id || !subject_id || !class_id || !title) return res.status(400).json({ success: false, message: 'Guru, mapel, kelas, dan judul wajib diisi' });
      const [result] = await pool.execute(
        `INSERT INTO materials (teacher_id, subject_id, class_id, title, description, file, link, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(teacher_id), parseInt(subject_id), parseInt(class_id), title, description || null, file || null, link || null, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Materi berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateMaterial(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, file, link } = req.body;
      const [rows] = await pool.execute('SELECT * FROM materials WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
      await pool.execute(
        `UPDATE materials SET teacher_id = ?, subject_id = ?, class_id = ?, title = ?, description = ?, file = ?, link = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [teacher_id ? parseInt(teacher_id) : rows[0].teacher_id, subject_id ? parseInt(subject_id) : rows[0].subject_id,
         class_id ? parseInt(class_id) : rows[0].class_id, title || rows[0].title,
         description !== undefined ? description : rows[0].description,
         file !== undefined ? file : rows[0].file, link !== undefined ? link : rows[0].link,
         req.user.id, req.params.id]
      );
      res.json({ success: true, message: 'Materi berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteMaterial(req, res) {
    try {
      const [result] = await pool.execute('UPDATE materials SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
      res.json({ success: true, message: 'Materi berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== ASSIGNMENTS ==============
  async getAllAssignments(req, res) {
    try {
      const { subject_id, class_id, search, page = 1, limit = 50 } = req.query;
      const where = ['a.deleted_at IS NULL'];
      const params = [];
      if (subject_id) { where.push('a.subject_id = ?'); params.push(parseInt(subject_id)); }
      if (class_id) { where.push('a.class_id = ?'); params.push(parseInt(class_id)); }
      if (search) { where.push('a.title LIKE ?'); params.push(`%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(
        `SELECT a.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name,
         (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as total_submission
         FROM assignments a
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN subjects sub ON a.subject_id = sub.id
         LEFT JOIN teachers t ON a.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM assignments a WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getAssignmentById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT a.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name,
         (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as total_submission
         FROM assignments a
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN subjects sub ON a.subject_id = sub.id
         LEFT JOIN teachers t ON a.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE a.id = ? AND a.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createAssignment(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, deadline } = req.body;
      if (!teacher_id || !subject_id || !class_id || !title) return res.status(400).json({ success: false, message: 'Guru, mapel, kelas, dan judul wajib diisi' });
      const [result] = await pool.execute(
        `INSERT INTO assignments (teacher_id, subject_id, class_id, title, description, deadline, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(teacher_id), parseInt(subject_id), parseInt(class_id), title, description || null, deadline || null, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Tugas berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateAssignment(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, description, deadline } = req.body;
      const [rows] = await pool.execute('SELECT * FROM assignments WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
      await pool.execute(
        `UPDATE assignments SET teacher_id = ?, subject_id = ?, class_id = ?, title = ?, description = ?, deadline = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [teacher_id ? parseInt(teacher_id) : rows[0].teacher_id, subject_id ? parseInt(subject_id) : rows[0].subject_id,
         class_id ? parseInt(class_id) : rows[0].class_id, title || rows[0].title,
         description !== undefined ? description : rows[0].description, deadline || null,
         req.user.id, req.params.id]
      );
      res.json({ success: true, message: 'Tugas berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteAssignment(req, res) {
    try {
      const [result] = await pool.execute('UPDATE assignments SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
      res.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== ANNOUNCEMENTS ==============
  async getAllAnnouncements(req, res) {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const where = ['an.deleted_at IS NULL'];
      const params = [];
      if (search) { where.push('(an.title LIKE ? OR an.content LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(
        `SELECT an.*, u.name as author_name FROM announcements an
         LEFT JOIN users u ON an.created_by = u.id
         WHERE ${whereClause} ORDER BY an.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM announcements an WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getAnnouncementById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT an.*, u.name as author_name FROM announcements an
         LEFT JOIN users u ON an.created_by = u.id WHERE an.id = ? AND an.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createAnnouncement(req, res) {
    try {
      const { title, content } = req.body;
      if (!title || !content) return res.status(400).json({ success: false, message: 'Judul dan isi pengumuman wajib diisi' });
      const [result] = await pool.execute(`INSERT INTO announcements (created_by, title, content, created_at) VALUES (?, ?, ?, NOW())`,
        [req.user.id, title, content]);
      res.status(201).json({ success: true, message: 'Pengumuman berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateAnnouncement(req, res) {
    try {
      const { title, content } = req.body;
      const [rows] = await pool.execute('SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
      await pool.execute(`UPDATE announcements SET title = ?, content = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [title || rows[0].title, content || rows[0].content, req.user.id, req.params.id]);
      res.json({ success: true, message: 'Pengumuman berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteAnnouncement(req, res) {
    try {
      const [result] = await pool.execute('UPDATE announcements SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
      res.json({ success: true, message: 'Pengumuman berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== GRADES (CONT.) ==============
  async createGrade(req, res) {
    try {
      const { student_id, subject_id, type, reference_id, score } = req.body;
      if (!student_id || !subject_id || score === undefined || score === null) {
        return res.status(400).json({ success: false, message: 'Student, mapel, dan skor wajib diisi' });
      }
      const [student] = await pool.execute('SELECT id FROM students WHERE id = ? AND deleted_at IS NULL', [parseInt(student_id)]);
      if (student.length === 0) return res.status(400).json({ success: false, message: 'Siswa tidak valid' });
      const [subject] = await pool.execute('SELECT id FROM subjects WHERE id = ? AND deleted_at IS NULL', [parseInt(subject_id)]);
      if (subject.length === 0) return res.status(400).json({ success: false, message: 'Mapel tidak valid' });

      const [existing] = await pool.execute(
        'SELECT id FROM grades WHERE student_id = ? AND subject_id = ? AND IFNULL(type, \'\') = ? AND IFNULL(reference_id, 0) = ? AND deleted_at IS NULL',
        [parseInt(student_id), parseInt(subject_id), type || '', reference_id ? parseInt(reference_id) : 0]
      );
      if (existing.length > 0) {
        await pool.execute('UPDATE grades SET score = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
          [score, req.user.id, existing[0].id]);
        return res.json({ success: true, message: 'Nilai berhasil diperbarui' });
      }
      const [result] = await pool.execute(
        `INSERT INTO grades (student_id, subject_id, type, reference_id, score, created_at, created_by) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(student_id), parseInt(subject_id), type || null, reference_id ? parseInt(reference_id) : null, score, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Nilai berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateGrade(req, res) {
    try {
      const { score } = req.body;
      const [rows] = await pool.execute('SELECT id FROM grades WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      if (score === undefined || score === null) return res.status(400).json({ success: false, message: 'Skor wajib diisi' });
      await pool.execute('UPDATE grades SET score = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
        [score, req.user.id, req.params.id]);
      res.json({ success: true, message: 'Nilai berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteGrade(req, res) {
    try {
      const [result] = await pool.execute('UPDATE grades SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      res.json({ success: true, message: 'Nilai berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== ATTENDANCE (CONT.) ==============
  async getAllAttendance(req, res) {
    return this.getAllAttendances(req, res);
  },

  async createAttendance(req, res) {
    try {
      const { student_id, class_id, schedule_id, date, status, note } = req.body;
      if (!student_id || !class_id || !date || !status) return res.status(400).json({ success: false, message: 'Student, kelas, tanggal, dan status wajib diisi' });
      if (!['hadir', 'izin', 'sakit', 'alpa'].includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid' });

      const [existing] = await pool.execute('SELECT id FROM attendances WHERE student_id = ? AND date = ? AND deleted_at IS NULL',
        [parseInt(student_id), date]);
      if (existing.length > 0) {
        await pool.execute('UPDATE attendances SET status = ?, note = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
          [status, note || null, req.user.id, existing[0].id]);
        return res.json({ success: true, message: 'Absensi berhasil diperbarui' });
      }
      const [result] = await pool.execute(
        `INSERT INTO attendances (student_id, class_id, schedule_id, date, status, note, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(student_id), parseInt(class_id), schedule_id ? parseInt(schedule_id) : null, date, status, note || null, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Absensi berhasil dibuat', data: { id: result.insertId } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async bulkCreateAttendance(req, res) {
    try {
      const { class_id, date, schedule_id, records } = req.body;
      if (!class_id || !date || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ success: false, message: 'Kelas, tanggal, dan records wajib diisi' });
      }
      let created = 0, updated = 0, skipped = 0;
      for (const r of records) {
        try {
          if (!r.student_id || !r.status || !['hadir', 'izin', 'sakit', 'alpa'].includes(r.status)) { skipped++; continue; }
          const [existing] = await pool.execute('SELECT id FROM attendances WHERE student_id = ? AND date = ? AND deleted_at IS NULL',
            [parseInt(r.student_id), date]);
          if (existing.length > 0) {
            await pool.execute('UPDATE attendances SET status = ?, note = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
              [r.status, r.note || null, req.user.id, existing[0].id]);
            updated++;
          } else {
            await pool.execute(
              `INSERT INTO attendances (student_id, class_id, schedule_id, date, status, note, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
              [parseInt(r.student_id), parseInt(class_id), schedule_id ? parseInt(schedule_id) : null, date, r.status, r.note || null, req.user.id]
            );
            created++;
          }
        } catch (rowError) {
          console.error('Bulk attendance row error:', rowError.message);
          skipped++;
        }
      }
      res.json({ success: true, message: `Absensi selesai: ${created} dibuat, ${updated} diperbarui`, data: { created, updated, skipped } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateAttendance(req, res) {
    try {
      const { status, note, schedule_id } = req.body;
      const [rows] = await pool.execute('SELECT * FROM attendances WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Absensi tidak ditemukan' });
      if (status && !['hadir', 'izin', 'sakit', 'alpa'].includes(status)) return res.status(400).json({ success: false, message: 'Status tidak valid' });
      await pool.execute(
        'UPDATE attendances SET status = ?, note = ?, schedule_id = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
        [status || rows[0].status, note !== undefined ? note : rows[0].note,
         schedule_id ? parseInt(schedule_id) : rows[0].schedule_id, req.user.id, req.params.id]
      );
      res.json({ success: true, message: 'Absensi berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteAttendance(req, res) {
    try {
      const [result] = await pool.execute('UPDATE attendances SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Absensi tidak ditemukan' });
      res.json({ success: true, message: 'Absensi berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== EXAMS ==============
  async getAllExams(req, res) {
    try {
      const { subject_id, class_id, page = 1, limit = 50 } = req.query;
      const where = ['ex.deleted_at IS NULL'];
      const params = [];
      if (subject_id) { where.push('ex.subject_id = ?'); params.push(parseInt(subject_id)); }
      if (class_id) { where.push('ex.class_id = ?'); params.push(parseInt(class_id)); }
      const whereClause = where.join(' AND ');
      const [rows] = await pool.execute(
        `SELECT ex.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name
         FROM exams ex
         LEFT JOIN classes c ON ex.class_id = c.id
         LEFT JOIN subjects sub ON ex.subject_id = sub.id
         LEFT JOIN teachers t ON ex.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE ${whereClause} ORDER BY ex.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
      );
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM exams ex WHERE ${whereClause}`, params);
      res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count[0].total, totalPages: Math.ceil(count[0].total / limit) } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getExamById(req, res) {
    try {
      const [rows] = await pool.execute(
        `SELECT ex.*, c.name as class_name, sub.name as subject_name, u.name as teacher_name,
         (SELECT COUNT(*) FROM exam_answers ea WHERE ea.exam_id = ex.id) as total_answer
         FROM exams ex
         LEFT JOIN classes c ON ex.class_id = c.id
         LEFT JOIN subjects sub ON ex.subject_id = sub.id
         LEFT JOIN teachers t ON ex.teacher_id = t.id
         LEFT JOIN users u ON t.user_id = u.id
         WHERE ex.id = ? AND ex.deleted_at IS NULL`, [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ujian tidak ditemukan' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async createExam(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, start_at, duration } = req.body;
      if (!teacher_id || !subject_id || !class_id || !title) return res.status(400).json({ success: false, message: 'Guru, mapel, kelas, dan judul wajib diisi' });
      let token;
      do {
        token = Math.random().toString(36).slice(2, 8).toUpperCase();
        const [dup] = await pool.execute('SELECT id FROM exams WHERE token = ? AND deleted_at IS NULL', [token]);
        if (dup.length === 0) break;
      } while (true);
      const [result] = await pool.execute(
        `INSERT INTO exams (teacher_id, subject_id, class_id, title, token, start_at, duration, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [parseInt(teacher_id), parseInt(subject_id), parseInt(class_id), title, token, start_at || null, duration ? parseInt(duration) : null, req.user.id]
      );
      res.status(201).json({ success: true, message: 'Ujian berhasil dibuat', data: { id: result.insertId, token } });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async updateExam(req, res) {
    try {
      const { teacher_id, subject_id, class_id, title, start_at, duration } = req.body;
      const [rows] = await pool.execute('SELECT * FROM exams WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ujian tidak ditemukan' });
      await pool.execute(
        `UPDATE exams SET teacher_id = ?, subject_id = ?, class_id = ?, title = ?, start_at = ?, duration = ?, updated_at = NOW(), updated_by = ? WHERE id = ?`,
        [teacher_id ? parseInt(teacher_id) : rows[0].teacher_id, subject_id ? parseInt(subject_id) : rows[0].subject_id,
         class_id ? parseInt(class_id) : rows[0].class_id, title || rows[0].title,
         start_at !== undefined ? start_at : rows[0].start_at,
         duration !== undefined ? (duration ? parseInt(duration) : null) : rows[0].duration,
         req.user.id, req.params.id]
      );
      res.json({ success: true, message: 'Ujian berhasil diperbarui' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async deleteExam(req, res) {
    try {
      const [result] = await pool.execute('UPDATE exams SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Ujian tidak ditemukan' });
      res.json({ success: true, message: 'Ujian berhasil dihapus' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  // ============== SETTINGS ==============
  async getSettings(req, res) {
    res.json({ success: true, data: {} });
  },

  async updateSettings(req, res) {
    res.status(501).json({ success: false, message: 'Pengaturan global belum didukung' });
  },

  // ============== REPORTS (ROUTE NAMES) ==============
  async getStudentReport(req, res) {
    return this.generateStudentReport(req, res);
  },

  async getTeacherReport(req, res) {
    return this.generateTeacherReport(req, res);
  },

  async getGradeReport(req, res) {
    try {
      const [report] = await pool.execute(
        `SELECT g.id, s.nis, u.name as student_name, c.name as class_name, sub.name as subject_name,
                g.type, g.score, g.created_at
         FROM grades g
         JOIN students s ON g.student_id = s.id
         JOIN users u ON s.user_id = u.id
         JOIN subjects sub ON g.subject_id = sub.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE g.deleted_at IS NULL AND s.deleted_at IS NULL
         ORDER BY c.name, sub.name, s.nis`
      );
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  },

  async getAttendanceReport(req, res) {
    try {
      const [report] = await pool.execute(
        `SELECT s.id as student_id, s.nis, u.name as student_name, c.name as class_name,
                SUM(a.status = 'hadir') as hadir, SUM(a.status = 'izin') as izin,
                SUM(a.status = 'sakit') as sakit, SUM(a.status = 'alpa') as alpa,
                COUNT(*) as total
         FROM attendances a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         JOIN classes c ON a.class_id = c.id
         WHERE a.deleted_at IS NULL AND s.deleted_at IS NULL
         GROUP BY s.id, s.nis, u.name, c.name
         ORDER BY c.name, s.nis`
      );
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Gagal' });
    }
  }
};

module.exports = adminController;
