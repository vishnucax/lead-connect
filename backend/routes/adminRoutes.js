const express = require('express');
const router = express.Router();
const { getAllUsers, getReports, blockUser, unblockUser } = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/reports', authenticate, isAdmin, getReports);
router.post('/block', authenticate, isAdmin, blockUser);
router.post('/unblock', authenticate, isAdmin, unblockUser);

module.exports = router;
