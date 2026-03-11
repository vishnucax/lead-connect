const express = require('express');
const router = express.Router();
const { reportUser } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/report', authenticate, reportUser);

module.exports = router;
