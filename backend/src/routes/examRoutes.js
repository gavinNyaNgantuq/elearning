const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateExamToken } = require('../middleware/examValidation');

// Routes untuk Admin dan Guru
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  examController.createExam
);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  examController.getAllExams
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  examController.getExamById
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  examController.updateExam
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  examController.deleteExam
);

// Routes untuk Siswa (dengan validasi token)
router.post(
  '/validate-token',
  authenticateToken,
  authorizeRoles('siswa'),
  validateExamToken,
  examController.validateToken
);

router.get(
  '/:token/questions',
  authenticateToken,
  authorizeRoles('siswa'),
  validateExamToken,
  examController.getExamQuestions
);

router.post(
  '/:token/submit',
  authenticateToken,
  authorizeRoles('siswa'),
  validateExamToken,
  examController.submitExam
);

router.get(
  '/:token/result',
  authenticateToken,
  authorizeRoles('siswa'),
  validateExamToken,
  examController.getExamResult
);

module.exports = router;
