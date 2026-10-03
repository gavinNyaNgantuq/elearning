const userModel = require('../models/userModel');
const studentModel = require('../models/studentModel');
const teacherModel = require('../models/teacherModel');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const userController = {
  /**
   * Get all users with pagination and filters
   */
  async getAll(req, res) {
    try {
      const { role, search, page = 1, limit = 20 } = req.query;
      const users = await userModel.getAll({
        role: role ? parseInt(role) : undefined,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await userModel.getCount({
        role: role ? parseInt(role) : undefined,
        search
      });
      
      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengguna'
      });
    }
  },

  /**
   * Get user by ID
   */
  async getById(req, res) {
    try {
      const user = await userModel.getById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengguna'
      });
    }
  },

  /**
   * Create user (admin/guru/siswa)
   */
  async create(req, res) {
    try {
      const { name, email, password, role_id } = req.body;

      // Validasi
      if (!name || !email || !password || !role_id) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, password, dan role wajib diisi'
        });
      }

      // Cek email sudah ada
      const existing = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );
      if (existing[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        name,
        email,
        password: hashedPassword,
        role_id: parseInt(role_id),
        is_active: 1
      };
      
      const user = await userModel.create(userData);

      res.status(201).json({
        success: true,
        message: 'Pengguna berhasil dibuat',
        data: user
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat pengguna'
      });
    }
  },

  /**
   * Update user
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role_id, is_active } = req.body;

      // Cek user exists
      const user = await userModel.getById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      // Cek email conflict (if changing email)
      if (email && email !== user.email) {
        const existing = await pool.execute(
          'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [email, id]
        );
        if (existing[0].length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email sudah digunakan'
          });
        }
      }

      const updated = await userModel.update(id, {
        name,
        email,
        role_id: role_id ? parseInt(role_id) : undefined,
        is_active: is_active !== undefined ? parseInt(is_active) : undefined
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengguna berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pengguna'
      });
    }
  },

  /**
   * Soft delete user
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const user = await userModel.getById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      // Jangan hapus diri sendiri
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Tidak bisa menghapus akun sendiri'
        });
      }

      const deleted = await userModel.softDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Pengguna berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus pengguna'
      });
    }
  },

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { current_password, new_password } = req.body;

      if (!new_password || new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 8 karakter'
        });
      }

      // Jika bukan admin, verifikasi password lama
      if (req.user.id !== parseInt(id)) {
        if (!current_password) {
          return res.status(400).json({
            success: false,
            message: 'Password saat ini wajib diisi'
          });
        }
        const user = await userModel.getById(id);
        const isValid = await bcrypt.compare(current_password, user.password);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: 'Password saat ini salah'
          });
        }
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await userModel.changePassword(id, hashedPassword);

      res.json({
        success: true,
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengubah password'
      });
    }
  },

  /**
   * Get users by role (for dropdowns)
   */
  async getByRole(req, res) {
    try {
      const { role_id } = req.query;
      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: 'role_id wajib diisi'
        });
      }
      const users = await userModel.getByRole(parseInt(role_id));
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error getting users by role:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pengguna'
      });
    }
  },

  /**
   * Update nomor telepon milik sendiri (self-service)
   */
  async updatePhone(req, res) {
    try {
      const { phone } = req.body;
      const value = phone === undefined || phone === null ? null : String(phone).trim();

      if (value !== null && value !== '') {
        if (!/^[+\d][\d\s\-().]{5,19}$/.test(value)) {
          return res.status(400).json({
            success: false,
            message: 'Format nomor telepon tidak valid'
          });
        }
      }

      const updated = await userModel.updatePhone(req.user.id, value || null);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Nomor telepon berhasil diperbarui',
        data: { phone: value || null }
      });
    } catch (error) {
      console.error('Error updating phone:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui nomor telepon'
      });
    }
  }
};

module.exports = userController;
