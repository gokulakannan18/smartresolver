const express = require('express');
const router = express.Router();
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    assignStaff
} = require('../controllers/deptController');
const { protect, authorize } = require('../middlewares/auth');

// Public route to see all departments
router.get('/', getDepartments);

// Only SuperAdmin can manage departments
router.post('/', protect, authorize('superadmin'), createDepartment);
router.put('/:id', protect, authorize('superadmin'), updateDepartment);
router.delete('/:id', protect, authorize('superadmin'), deleteDepartment);

// SuperAdmin and DeptAdmin can assign staff to their departments
router.post('/:id/staff', protect, authorize('superadmin', 'deptadmin'), assignStaff);

module.exports = router;
