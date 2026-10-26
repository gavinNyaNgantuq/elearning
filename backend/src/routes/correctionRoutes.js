const express = require('express');
const router = express.Router();
const correctionController = require('../controllers/correctionController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Semua endpoint koreksi: admin + guru pengampu.
// Otorisasi per-ujian (guru hanya miliknya) dicek di controller.
router.get(
  '/exams',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  correctionController.getExams
);

router.get(
  '/exams/:id/participants',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  correctionController.getParticipants
);

router.get(
  '/exams/:id/participants/:studentId/answers',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  correctionController.getAnswers
);

router.put(
  '/exams/:id/participants/:studentId/grade',
  authenticateToken,
  authorizeRoles('admin', 'guru'),
  correctionController.saveGrade
);

module.exports = router;
