const attendanceModel = require('../models/attendanceModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const scheduleModel = require('../models/scheduleModel');
const pool = require('../config/database');

const attendanceController = {
  /**
   * Get all attendances with pagination and filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { class_id, student_id, date, subject_id, page = 1, limit = 20 } = req.query;
      const attendances = await attendanceModel.getAll({
        class_id: class_id ? parseInt(class_id) : undefined,
        student_id: student_id ? parseInt(student_id) : undefined,
        date,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await attendanceModel.getCount({
        class_id: class_id ? parseInt(class_id) : undefined,
        student_id: student_id ? parseInt(student_id) : undefined,
        date,
        subject_id: subject_id ? parseInt(subject_id) : undefined
      });
      
      res.json({
        success: true,
        data: attendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting attendances:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data absensi'
      });
    }
  },

  /**
   * Get attendance by ID
   */
  async getById(req, res) {
    try {
      const attendance = await attendanceModel.getById(req.params.id);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error getting attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data absensi'
      });
    }
  },

  /**
   * Create attendance (Guru/Admin)
   */
  async create(req, res) {
    try {
      const { student_id, class_id, subject_id, schedule_id, date, status, note } = req.body;

      if (!student_id || !class_id || !date || !status) {
        return res.status(400).json({
          success: false,
          message: 'Siswa, kelas, tanggal, dan status wajib diisi'
        });
      }

      // Validasi status
      const validStatuses = ['hadir', 'izin', 'sakit', 'alpa'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid'
        });
      }

      // Validasi relasi
      if (subject_id) {
        const subjectData = await pool.execute('SELECT id FROM subjects WHERE id = ? AND deleted_at IS NULL', [subject_id]);
        if (subjectData[0].length === 0) {
          return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }
      }

      if (schedule_id) {
        const scheduleData = await pool.execute('SELECT id FROM schedules WHERE id = ? AND deleted_at IS NULL', [schedule_id]);
        if (scheduleData[0].length === 0) {
          return res.status(400).json({ success: false, message: 'Jadwal tidak ditemukan' });
        }
      }

      // Cek apakah sudah ada absensi untuk siswa tersebut pada tanggal dan jadwal yang sama
      const [existing] = await pool.execute(
        `SELECT id FROM attendances 
         WHERE student_id = ? AND date = ? AND deleted_at IS NULL
         ${subject_id ? 'AND subject_id = ?' : ''} 
         ${schedule_id ? 'AND schedule_id = ?' : ''}`,
        [student_id, date, subject_id, schedule_id].filter(Boolean)
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Absensi untuk siswa ini pada tanggal dan jadwal yang sama sudah ada'
        });
      }

      const attendanceData = await attendanceModel.create({
        student_id,
        class_id,
        subject_id: subject_id || null,
        schedule_id: schedule_id || null,
        date,
        status,
        note: req.body.note || null,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Absensi berhasil dibuat',
        data: attendanceData
      });
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat absensi'
      });
    }
  },

  /**
   * Update attendance
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { student_id, class_id, subject_id, schedule_id, date, status, note } = req.body;

      const attendance = await attendanceModel.getById(id);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }

      // Validasi status
      if (status) {
        const validStatuses = ['hadir', 'izin', 'sakit', 'alpa'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Status tidak valid'
          });
        }
      }

      const updated = await attendanceModel.update(id, {
        student_id,
        class_id,
        subject_id: subject_id || null,
        schedule_id: schedule_id || null,
        date,
        status,
        note: req.body.note || null,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Absensi berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui absensi'
      });
    }
  },

  /**
   * Soft delete attendance
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const attendance = await attendanceModel.getById(id);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }

      const deleted = await attendanceModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Absensi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Absensi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus absensi'
      });
    }
  },

  /**
   * Get attendance by class and date (for guru input)
   */
  async getByClassAndDate(req, res) {
    try {
      const { class_id, date } = req.params;
      const attendances = await attendanceModel.getByClassAndDate(parseInt(class_id), date);
      res.json({
        success: true,
        data: attendances
      });
    } catch (error) {
      console.error('Error getting attendance by class and date:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data absensi'
      });
    }
  },

  /**
   * Get attendance by student
   */
  async getByStudent(req, res) {
    try {
      const { student_id } = req.params;
      const attendances = await attendanceModel.getByStudent(parseInt(student_id));
      res.json({
        success: true,
        data: attendances
      });
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data absensi'
      });
    }
  },

  /**
   * Bulk create attendance (for guru input multiple students)
   */
  async bulkCreate(req, res) {
    try {
      const { class_id, subject_id, schedule_id, date, attendances } = req.body;

      if (!class_id || !date || !attendances || !Array.isArray(attendances) || attendances.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Kelas, tanggal, dan daftar absensi wajib diisi'
        });
      }

      // Validasi format attendances
      for (const att of attendances) {
        if (!att.student_id || !att.status) {
          return res.status(400).json({
            success: false,
            message: 'Setiap absensi harus memiliki student_id dan status'
          });
        }
      }

      const attendancesData = attendances.map(att => ({
        student_id: att.student_id,
        class_id: parseInt(class_id),
        subject_id: att.subject_id || null,
        schedule_id: att.schedule_id || null,
        date,
        status: att.status,
        note: att.note || null
      }));

      await attendanceModel.bulkCreate(attendancesData, req.user.id);

      res.json({
        success: true,
        message: 'Absensi massal berhasil dibuat'
      });
    } catch (error) {
      console.error('Error bulk creating attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat absensi massal'
      });
    }
  },

  /**
   * Get attendance stats for student
   */
  async getStatsByStudent(req, res) {
    try {
      const { student_id } = req.params;
      const { start_date, end_date } = req.query;
      
      let query = `
        SELECT status, COUNT(*) as count
        FROM attendances
        WHERE student_id = ? AND deleted_at IS NULL
      `;
      const params = [req.params.student_id];

      if (start_date) {
        query += ` AND date >= ?`;
        params.push(start_date);
      }
      if (end_date) {
        query += ` AND date <= ?`;
        params.push(end_date);
      }
      query += ` GROUP BY status`;

      const [rows] = await pool.execute(query, params);
      
      const stats = { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
      rows.forEach(row => {
        stats[row.status] = row.count;
        stats.total += row.count;
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik absensi'
      });
    }
  }
};

module.exports = attendanceController;