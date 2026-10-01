const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/latest',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  materialController.getLatest
);

router.get(
  '/student',
  authenticateToken,
  authorizeRoles('siswa'),
  materialController.getStudentMaterials
);

module.exports = router;
