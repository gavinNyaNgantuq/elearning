const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');
require('dotenv').config();

const authController = {
  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password wajib diisi'
        });
      }

      const user = await authModel.login(username, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Get additional data based on role
      let studentData = null;
      let teacherData = null;
      
      if (user.role_name === 'siswa') {
        studentData = await authModel.getStudentByUserId(user.id);
      } else if (user.role_name === 'guru') {
        teacherData = await authModel.getTeacherByUserId(user.id);
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name,
          student_id: studentData?.id || null,
          teacher_id: teacherData?.id || null,
          class_id: studentData?.class_id || null
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role_name
          }
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role
        }
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
};

module.exports = authController;
