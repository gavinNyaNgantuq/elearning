const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// All routes require admin role
router.use(authenticateToken, authorizeRoles('admin'));

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Student management
router.get('/students', adminController.getAllStudents);
router.get('/students/:id', adminController.getStudentById);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/import', adminController.importStudents);

// Teacher management
router.get('/teachers', adminController.getAllTeachers);
router.get('/teachers/:id', adminController.getTeacherById);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// Class management
router.get('/classes', adminController.getAllClasses);
router.get('/classes/:id', adminController.getClassById);
router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);
router.delete('/classes/:id', adminController.deleteClass);

// Subject management
router.get('/subjects', adminController.getAllSubjects);
router.get('/subjects/:id', adminController.getSubjectById);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Major management
router.get('/majors', adminController.getAllMajors);
router.get('/majors/:id', adminController.getMajorById);
router.post('/majors', adminController.createMajor);
router.put('/majors/:id', adminController.updateMajor);
router.delete('/majors/:id', adminController.deleteMajor);

// Schedule management
router.get('/schedules', adminController.getAllSchedules);
router.get('/schedules/:id', adminController.getScheduleById);
router.post('/schedules', adminController.createSchedule);
router.put('/schedules/:id', adminController.updateSchedule);
router.delete('/schedules/:id', adminController.deleteSchedule);

// Material management
router.get('/materials', adminController.getAllMaterials);
router.get('/materials/:id', adminController.getMaterialById);
router.post('/materials', adminController.createMaterial);
router.put('/materials/:id', adminController.updateMaterial);
router.delete('/materials/:id', adminController.deleteMaterial);

// Assignment management
router.get('/assignments', adminController.getAllAssignments);
router.get('/assignments/:id', adminController.getAssignmentById);
router.post('/assignments', adminController.createAssignment);
router.put('/assignments/:id', adminController.updateAssignment);
router.delete('/assignments/:id', adminController.deleteAssignment);

// Announcement management
router.get('/announcements', adminController.getAllAnnouncements);
router.get('/announcements/:id', adminController.getAnnouncementById);
router.post('/announcements', adminController.createAnnouncement);
router.put('/announcements/:id', adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// Grade management
router.get('/grades', adminController.getAllGrades);
router.get('/grades/:id', adminController.getGradeById);
router.post('/grades', adminController.createGrade);
router.put('/grades/:id', adminController.updateGrade);
router.delete('/grades/:id', adminController.deleteGrade);

// Attendance management
router.get('/attendance', adminController.getAllAttendance);
router.get('/attendance/:id', adminController.getAttendanceById);
router.post('/attendance', adminController.createAttendance);
router.put('/attendance/:id', adminController.updateAttendance);
router.delete('/attendance/:id', adminController.deleteAttendance);
router.post('/attendance/bulk', adminController.bulkCreateAttendance);

// Exam management
router.get('/exams', adminController.getAllExams);
router.get('/exams/:id', adminController.getExamById);
router.post('/exams', adminController.createExam);
router.put('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Reports
router.get('/reports/students', adminController.getStudentReport);
router.get('/reports/teachers', adminController.getTeacherReport);
router.get('/reports/grades', adminController.getGradeReport);
router.get('/reports/attendance', adminController.getAttendanceReport);

module.exports = router;