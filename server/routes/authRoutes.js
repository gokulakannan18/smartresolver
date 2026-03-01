const express = require('express');
const router = express.Router();
const { register, login, getMe, getStaff } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validators');
const validate = require('../middlewares/validate');

router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);
router.get('/me', protect, getMe);
router.get('/staff', protect, authorize('deptadmin', 'superadmin'), getStaff);

module.exports = router;
