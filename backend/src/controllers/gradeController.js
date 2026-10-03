const gradeModel = require('../models/gradeModel');
const assignmentModel = require('../models/assignmentModel');
const examModel = require('../models/examModel');
const studentModel = require('../models/studentModel');
const subjectModel = require('../models/subjectModel');
const classModel = require('../models/classModel');
const pool = require('../config/database');

const gradeController = {
  async getAll(req, res) {
    try {
      const { student_id, subject_id, type, class_id, page = 1, limit = 20 } = req.query;
      const grades = await gradeModel.getAll({
        student_id: student_id ? parseInt(student_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        type,
        class_id: class_id ? parseInt(class_id) : undefined,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const total = await gradeModel.getCount({
        student_id: student_id ? parseInt(student_id) : undefined,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        type,
        class_id: class_id ? parseInt(class_id) : undefined
      });
      
      res.json({
        success: true,
        data: grades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting grades:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data nilai' });
    }
  },

  async getById(req, res) {
    try {
      const grade = await gradeModel.getById(req.params.id);
      if (!grade) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      res.json({ success: true, data: grade });
    } catch (error) {
      console.error('Error getting grade:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data nilai' });
    }
  },

  async create(req, res) {
    try {
      const { student_id, subject_id, class_id, teacher_id, type, reference_id, score } = req.body;
      if (!student_id || !subject_id || !type || score === undefined || score === null) {
        return res.status(400).json({ success: false, message: 'Siswa, mata pelajaran, jenis penilaian, dan nilai wajib diisi' });
      }
      if (score < 0 || score > 100) return res.status(400).json({ success: false, message: 'Nilai harus antara 0-100' });
      const validTypes = ['materi', 'tugas', 'ujian', 'uts', 'uas', 'praktek', 'lainnya'];
      if (!['materi', 'tugas', 'ujian', 'uts', 'uas', 'praktek', 'lainnya'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Jenis penilaian tidak valid' });
      }
      const [studentData, subjectData] = await Promise.all([
        require('../models/studentModel').getById(student_id),
        require('../models/subjectModel').getById(subject_id)
      ]);
      if (!studentData) return res.status(400).json({ success: false, message: 'Siswa tidak ditemukan' });
      if (!subjectData) return res.status(400).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });

      const gradeData = await require('../models/gradeModel').create({
        student_id, subject_id, class_id: class_id || null, teacher_id: req.user.teacher_id || null,
        type, reference_id: req.body.reference_id || null, score, created_by: req.user.id
      });
      res.status(201).json({ success: true, message: 'Nilai berhasil dibuat', data: gradeData });
    } catch (error) {
      console.error('Error creating grade:', error);
      res.status(500).json({ success: false, message: 'Gagal membuat nilai' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { type, score } = req.body;
      const grade = await require('../models/gradeModel').getById(id);
      if (!grade) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      if (score !== undefined && (score < 0 || score > 100)) return res.status(400).json({ success: false, message: 'Nilai harus antara 0-100' });
      if (type && !['materi', 'tugas', 'ujian', 'uts', 'uas', 'praktek', 'lainnya'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Jenis penilaian tidak valid' });
      }
      const updated = await require('../models/gradeModel').update(id, { type, score: score !== undefined ? parseFloat(score) : undefined, updated_by: req.user.id });
      if (!updated) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      res.json({ success: true, message: 'Nilai berhasil diperbarui' });
    } catch (error) { console.error('Error updating grade:', error); res.status(500).json({ success: false, message: 'Gagal memperbarui nilai' }); }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const grade = await require('../models/gradeModel').getById(id);
      if (!grade) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      const deleted = await require('../models/gradeModel').softDelete(id, req.user.id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
      res.json({ success: true, message: 'Nilai berhasil dihapus' });
    } catch (error) { console.error('Error deleting grade:', error); res.status(500).json({ success: false, message: 'Gagal menghapus nilai' }); }
  },

  async getByStudent(req, res) {
    try {
      const grades = await require('../models/gradeModel').getByStudent(parseInt(req.params.student_id));
      res.json({ success: true, data: grades });
    } catch (error) { console.error('Error getting grades by student:', error); res.status(500).json({ success: false, message: 'Gagal mengambil data nilai siswa' }); }
  },

  async getByClassAndSubject(req, res) {
    try {
      const grades = await require('../models/gradeModel').getByClassAndSubject(parseInt(req.params.class_id), parseInt(req.params.subject_id));
      res.json({ success: true, data: grades });
    } catch (error) { console.error('Error getting class subject grades:', error); res.status(500).json({ success: false, message: 'Gagal mengambil nilai kelas dan mata pelajaran' }); }
  }
};

module.exports = gradeController;
