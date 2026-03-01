const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

// Private - User can chat with assistant
router.post('/chat', protect, chatWithAI);

module.exports = router;
