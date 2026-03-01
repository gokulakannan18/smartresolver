const Department = require('../models/Department');
const User = require('../models/User');

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Public
 */
exports.getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find().populate('admin', 'name email').populate('staff', 'name email');
        res.status(200).json({ departments });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private (SuperAdmin)
 */
exports.createDepartment = async (req, res, next) => {
    try {
        const { name, description, adminId } = req.body;

        // Check if user to be assigned as admin exists and has valid role
        if (adminId) {
            const adminUser = await User.findById(adminId);
            if (!adminUser || adminUser.role !== 'deptadmin') {
                return res.status(400).json({ message: 'Invalid Admin User' });
            }
        }

        const department = await Department.create({
            name,
            description,
            admin: adminId
        });

        res.status(201).json({ department });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update department (Assign Admin/Staff)
 * @route   PUT /api/departments/:id
 * @access  Private (SuperAdmin)
 */
exports.updateDepartment = async (req, res, next) => {
    try {
        let department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ department });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private (SuperAdmin)
 */
exports.deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        await department.remove();

        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign staff to department
 * @route   POST /api/departments/:id/staff
 * @access  Private (SuperAdmin/DeptAdmin)
 */
exports.assignStaff = async (req, res, next) => {
    try {
        const { staffId } = req.body;
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Verify staff exists
        const staffUser = await User.findById(staffId);
        if (!staffUser || staffUser.role !== 'staff') {
            return res.status(400).json({ message: 'User is not a staff member' });
        }

        // Check if already in department
        if (department.staff.includes(staffId)) {
            return res.status(400).json({ message: 'Staff already assigned to this department' });
        }

        department.staff.push(staffId);
        await department.save();

        res.status(200).json({ department });
    } catch (error) {
        next(error);
    }
};
