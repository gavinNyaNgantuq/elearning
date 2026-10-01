const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
  '/latest',
  authenticateToken,
  authorizeRoles('admin', 'guru', 'siswa'),
  announcementController.getLatest
);

module.exports = router;
