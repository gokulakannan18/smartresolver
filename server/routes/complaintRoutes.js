const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaints,
    getComplaint,
    assignComplaint,
    acceptComplaint,
    updateStatus
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../config/cloudinary');

// Basic Complaint CRUD
router.post('/', protect, authorize('user'), upload.single('image'), createComplaint);
router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaint);

// Staff specific actions
router.put('/:id/accept', protect, authorize('staff'), acceptComplaint);

// Admin-specific actions
router.put('/:id/assign', protect, authorize('deptadmin', 'superadmin'), assignComplaint);
router.put('/:id/status', protect, authorize('staff', 'deptadmin', 'superadmin'), updateStatus);

module.exports = router;
