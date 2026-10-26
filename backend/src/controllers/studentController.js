const studentModel = require('../models/studentModel');
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const studentController = {
  /**
   * Get all students with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { class_id, search, page = 1, limit = 20 } = req.query;
      const students = await studentModel.getAll({
        class_id: class_id ? parseInt(class_id) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await studentModel.getCount({
        class_id: class_id ? parseInt(class_id) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting students:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data siswa'
      });
    }
  },

  /**
   * Get own student data
   */
  async getMe(req, res) {
    try {
      const student = await studentModel.getByUserId(req.user.id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error getting own student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data siswa'
      });
    }
  },

  /**
   * Get student by ID
   */
  async getById(req, res) {
    try {
      const requestedId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      // siswa can only get own data (user_id matches)
      if (userRole === 'siswa') {
        const student = await studentModel.getByUserId(userId);
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Siswa tidak ditemukan'
          });
        }
        return res.json({
          success: true,
          data: student
        });
      }

      // admin/guru can get any student by ID
      const student = await studentModel.getById(requestedId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error getting student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data siswa'
      });
    }
  },

  /**
   * Create student
   */
  async create(req, res) {
    try {
      const { name, email, password, nis, class_id } = req.body;

      // Validasi
      if (!name || !email || !password || !nis || !class_id) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, NIS, dan kelas wajib diisi'
        });
      }

      // Cek NIS unik
      const existingNis = await pool.execute(
        'SELECT id FROM students WHERE nis = ? AND deleted_at IS NULL',
        [nis]
      );
      if (existingNis[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'NIS sudah digunakan'
        });
      }

      // Cek email unik
      const existingUser = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );
      if (existingUser[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await userModel.create({
        name,
        email,
        password: hashedPassword,
        role_id: 3, // siswa
        is_active: 1
      });

      // Create student
      const student = await studentModel.create({
        user_id: user.id,
        class_id: parseInt(class_id),
        nis
      });

      res.status(201).json({
        success: true,
        message: 'Siswa berhasil dibuat',
        data: { ...student, user }
      });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat siswa'
      });
    }
  },

  /**
   * Update student
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, class_id, nis } = req.body;

      const student = await studentModel.getById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Cek NIS unik (hanya bila NIS berubah)
      if (nis && nis !== student.nis) {
        const existing = await pool.execute(
          'SELECT id FROM students WHERE nis = ? AND id != ? AND deleted_at IS NULL',
          [nis, id]
        );
        if (existing[0].length > 0) {
          return res.status(400).json({
            success: false,
            message: 'NIS sudah digunakan'
          });
        }
      }

      // Update nama di tabel users jika dikirim
      if (name && name.trim() && name.trim() !== student.name) {
        await pool.execute(
          'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
          [name.trim(), student.user_id]
        );
      }

      const updated = await studentModel.update(id, {
        class_id: class_id ? parseInt(class_id) : student.class_id,
        nis: nis || student.nis
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Siswa berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui siswa'
      });
    }
  },

  /**
   * Soft delete student
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const student = await studentModel.getById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      const deleted = await studentModel.softDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Siswa tidak ditemukan'
        });
      }

      // Soft delete user too
      await userModel.softDelete(student.user_id);

      res.json({
        success: true,
        message: 'Siswa berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus siswa'
      });
    }
  },

  /**
   * Get students by class
   */
  async getByClass(req, res) {
    try {
      const { class_id } = req.params;
      const students = await studentModel.getByClass(parseInt(class_id));
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error getting students by class:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data siswa'
      });
    }
  },

  /**
   * Import students from CSV
   */
  async importFromCSV(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File CSV wajib diunggah'
        });
      }

      const csv = require('csv-parser');
      const fs = require('fs');
      const results = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            let success = 0;
            let failed = 0;
            const errors = [];

            for (const row of results) {
              try {
                // Expected CSV columns: name, email, password, nis, class_id
                const { name, email, password, nis, class_id } = row;
                
                if (!name || !email || !password || !nis || !class_id) {
                  errors.push({ row, error: 'Field wajib tidak lengkap' });
                  failed++;
                  continue;
                }

                // Check duplicates
                const [existingUser] = await pool.execute(
                  'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
                  [email]
                );
                if (existingUser.length > 0) {
                  errors.push({ row, error: 'Email sudah ada' });
                  failed++;
                  continue;
                }

                const [existingNis] = await pool.execute(
                  'SELECT id FROM students WHERE nis = ? AND deleted_at IS NULL',
                  [nis]
                );
                if (existingNis.length > 0) {
                  errors.push({ row, error: 'NIS sudah ada' });
                  failed++;
                  continue;
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                
                const user = await userModel.create({
                  name,
                  email,
                  password: hashedPassword,
                  role_id: 3,
                  is_active: 1
                });

                await studentModel.create({
                  user_id: user.id,
                  class_id: parseInt(class_id),
                  nis
                });

                success++;
              } catch (err) {
                errors.push({ row, error: err.message });
                failed++;
              }
            }

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.json({
              success: true,
              message: `Import selesai: ${success} berhasil, ${failed} gagal`,
              data: { success, failed, errors }
            });
          } catch (err) {
            fs.unlinkSync(req.file.path);
            throw err;
          }
        });
    } catch (error) {
      console.error('Error importing students:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal import data siswa'
      });
    }
  }
};

module.exports = studentController;
