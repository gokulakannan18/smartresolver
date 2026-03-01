const express = require('express');
const router = express.Router();
const { getDashboardStats, getStaffPerformance } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/auth');

// Private routes - Admins only
router.get('/dashboard', protect, authorize('superadmin', 'deptadmin'), getDashboardStats);
router.get('/staff-performance', protect, authorize('superadmin', 'deptadmin'), getStaffPerformance);

module.exports = router;
