const pool = require('../config/database');
const scheduleModel = require('../models/scheduleModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const teacherModel = require('../models/teacherModel');

const scheduleController = {
  /**
   * Get jadwal berdasarkan hari
   */
  async getByDay(req, res) {
    try {
      const schedules = await scheduleModel.getByDay(req.params.day);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get jadwal untuk siswa
   */
  async getStudentSchedule(req, res) {
    try {
      const schedules = await scheduleModel.getByClass(req.user.class_id);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting student schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get jadwal untuk guru
   */
  async getTeacherSchedule(req, res) {
    try {
      const schedules = await scheduleModel.getByTeacher(req.user.teacher_id);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting teacher schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get all schedules with pagination and filters (Admin/Guru)
   */
  async getAll(req, res) {
    try {
      const { class_id, teacher_id, day, page = 1, limit = 20 } = req.query;
      const schedules = await scheduleModel.getAll({
        class_id: class_id ? parseInt(class_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        day,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await scheduleModel.getCount({
        class_id: class_id ? parseInt(class_id) : undefined,
        teacher_id: teacher_id ? parseInt(teacher_id) : undefined,
        day: req.query.day
      });
      
      res.json({
        success: true,
        data: schedules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get schedule by ID
   */
  async getById(req, res) {
    try {
      const schedule = await scheduleModel.getById(req.params.id);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan'
        });
      }
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error getting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Create schedule
   */
  async create(req, res) {
    try {
      const { class_id, subject_id, teacher_id, room, day, start_time, end_time } = req.body;

      // Validasi
      if (!class_id || !subject_id || !teacher_id || !day || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message: 'Kelas, mata pelajaran, guru, hari, jam mulai, dan jam selesai wajib diisi'
        });
      }

      // Validasi relasi
      const [classData, subjectData, teacherData] = await Promise.all([
        classModel.getById(class_id),
        subjectModel.getById(subject_id),
        teacherModel.getById(teacher_id)
      ]);

      if (!classData) {
        return res.status(400).json({ success: false, message: 'Kelas tidak ditemukan' });
      }
      if (!subjectData) {
        return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
      }
      if (!teacherData) {
        return res.status(400).json({ success: false, message: 'Guru tidak ditemukan' });
      }

      // Cek konflik jadwal guru
      const conflictTeacher = await pool.execute(
        `SELECT id FROM schedules 
         WHERE teacher_id = ? AND day = ? AND deleted_at IS NULL
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [teacher_id, req.body.day, start_time, start_time, end_time, end_time]
      );
      if (conflictTeacher[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Guru sudah memiliki jadwal di jam yang sama'
        });
      }

      // Cek konflik jadwal kelas
      const conflictClass = await pool.execute(
        `SELECT id FROM schedules 
         WHERE class_id = ? AND day = ? AND deleted_at IS NULL
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [class_id, day, start_time, start_time, end_time, end_time]
      );
      if (conflictClass[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kelas sudah memiliki jadwal di jam yang sama'
        });
      }

      const scheduleData = await scheduleModel.create({
        class_id,
        subject_id,
        teacher_id,
        room: req.body.room || null,
        day,
        start_time,
        end_time,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Jadwal berhasil dibuat',
        data: scheduleData
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat jadwal'
      });
    }
  },

  /**
   * Update schedule
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { class_id, subject_id, teacher_id, room, day, start_time, end_time } = req.body;

      const schedule = await scheduleModel.getById(id);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan'
        });
      }

      // Validasi relasi jika diubah
      if (class_id) {
        const classData = await classModel.getById(class_id);
        if (!classData) {
          return res.status(400).json({ success: false, message: 'Kelas tidak ditemukan' });
        }
      }
      if (subject_id) {
        const subjectData = await subjectModel.getById(subject_id);
        if (!subjectData) {
          return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
        }
      }
      if (teacher_id) {
        const teacherData = await teacherModel.getById(teacher_id);
        if (!teacherData) {
          return res.status(400).json({ success: false, message: 'Guru tidak ditemukan' });
        }
      }

      // Cek konflik jika jam/hari/kelas/guru berubah
      const checkTeacherId = teacher_id || schedule.teacher_id;
      const checkClassId = class_id || schedule.class_id;
      const checkDay = day || schedule.day;
      const checkStartTime = start_time || schedule.start_time;
      const checkEndTime = end_time || schedule.end_time;

      const conflictTeacher = await pool.execute(
        `SELECT id FROM schedules 
         WHERE teacher_id = ? AND day = ? AND id != ? AND deleted_at IS NULL
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [checkTeacherId, checkDay, id, checkStartTime, checkStartTime, checkEndTime, checkEndTime]
      );
      if (conflictTeacher[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Guru sudah memiliki jadwal di jam yang sama'
        });
      }

      const conflictClass = await pool.execute(
        `SELECT id FROM schedules 
         WHERE class_id = ? AND day = ? AND id != ? AND deleted_at IS NULL
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
        [checkClassId, checkDay, id, checkStartTime, checkStartTime, checkEndTime, checkEndTime]
      );
      if (conflictClass[0].length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kelas sudah memiliki jadwal di jam yang sama'
        });
      }

      const updated = await scheduleModel.update(id, {
        class_id: class_id || schedule.class_id,
        subject_id: subject_id || schedule.subject_id,
        teacher_id: teacher_id || schedule.teacher_id,
        room: room !== undefined ? room : schedule.room,
        day: day || schedule.day,
        start_time: start_time || schedule.start_time,
        end_time: end_time || schedule.end_time,
        updated_by: req.user.id
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Jadwal berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui jadwal'
      });
    }
  },

  /**
   * Soft delete schedule
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const schedule = await scheduleModel.getById(id);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan'
        });
      }

      const deleted = await scheduleModel.softDelete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Jadwal tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Jadwal berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus jadwal'
      });
    }
  },

  /**
   * Get schedules by class and day (for student view)
   */
  async getByClassAndDay(req, res) {
    try {
      const { class_id, day } = req.params;
      const schedules = await scheduleModel.getByClassAndDay(parseInt(class_id), day);
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting schedules by class and day:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  },

  /**
   * Get weekly schedule for class
   */
  async getWeeklyByClass(req, res) {
    try {
      const { class_id } = req.params;
      const schedules = await scheduleModel.getWeeklyByClass(parseInt(class_id));
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error getting weekly schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil jadwal mingguan'
      });
    }
  },

  /**
   * Get schedules for dropdown
   */
  async getForDropdown(req, res) {
    try {
      const { class_id, teacher_id, day } = req.query;
      // This would need a method in scheduleModel
      res.json({
        success: true,
        message: 'Endpoint not implemented yet'
      });
    } catch (error) {
      console.error('Error getting schedules for dropdown:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data jadwal'
      });
    }
  }
};

module.exports = scheduleController;