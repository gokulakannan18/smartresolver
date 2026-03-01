const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const { analyzeComplaint, findDuplicate } = require('../services/aiService');
const { getIO } = require('../socket');
const { notifyStatusChange, notifyAssignment, notifyUrgentTicket } = require('../services/notificationService');

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (User)
 */
exports.createComplaint = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        let { category, priority } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        // Call AI Service to Predict Category & Priority
        const aiAnalysis = await analyzeComplaint(description);

        // Auto-assign AI predictions if not manually provided
        if (!category) category = aiAnalysis.category;
        if (!priority) priority = aiAnalysis.priority;

        // Auto-link to department based on final category
        let department = await Department.findOne({ name: category });

        if (!department) {
            department = await Department.create({ name: category, description: `Automated department for ${category}` });
        }

        // DUPLICATE DETECTION
        // Fetch existing open complaints in the same category
        const existingComplaints = await Complaint.find({
            category,
            status: { $ne: 'Resolved' },
            isDuplicate: false
        });

        const duplicateOf = await findDuplicate(description, existingComplaints);

        const imagePath = req.file.path.startsWith('http')
            ? req.file.path  // Cloudinary URL
            : `/uploads/${req.file.filename}`; // Local path

        const complaintData = {
            title,
            description,
            category,
            priority,
            aiReason: aiAnalysis.aiReason,
            image: imagePath,
            user: req.user._id,
            department: department ? department._id : null
        };

        if (duplicateOf) {
            complaintData.isDuplicate = true;
            complaintData.parentComplaint = duplicateOf._id;

            // Increment duplicate count in original complaint
            await Complaint.findByIdAndUpdate(duplicateOf._id, {
                $inc: { affectedUsersCount: 1 }
            });
        }

        const complaint = await Complaint.create(complaintData);

        // Notify Admins about new complaint
        const io = getIO();
        io.to('superadmin-room').emit('complaintCreated', complaint);

        if (department && department.admin) {
            const adminUser = await User.findById(department.admin);
            if (adminUser) {
                if (complaint.priority === 'High') {
                    await notifyUrgentTicket(adminUser._id, adminUser.email, complaint);
                } else {
                    io.to(adminUser._id.toString()).emit('complaintCreated', complaint);
                }
            }
        } else {
            // Broadcast to all dept admins if no specific admin is assigned
            io.to('deptadmin-room').emit('complaintCreated', complaint);
        }

        res.status(201).json({ complaint });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all complaints
 * @route   GET /api/complaints
 * @access  Private
 */
exports.getComplaints = async (req, res, next) => {
    try {
        let query;

        // If user is common user, only show their complaints
        if (req.user.role === 'user') {
            query = Complaint.find({ user: req.user._id });
        } else if (req.user.role === 'staff') {
            // Staff see complaints assigned to them
            query = Complaint.find({ staffMember: req.user._id });
        } else if (req.user.role === 'deptadmin') {
            // Find departments where this user is admin
            const depts = await Department.find({ admin: req.user._id });

            if (depts.length > 0) {
                const deptIds = depts.map(d => d._id);
                query = Complaint.find({ department: { $in: deptIds } });
            } else {
                // If this is a DeptAdmin but not yet assigned to a specific department, 
                // show ALL complaints so they can act as a general triage admin for the demo.
                query = Complaint.find();
            }
        } else {
            // SuperAdmin sees all
            query = Complaint.find();
        }

        const complaints = await query
            .populate('user', 'name email')
            .populate('department', 'name')
            .populate('staffMember', 'name email');

        res.status(200).json({ count: complaints.length, complaints });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single complaint
 * @route   GET /api/complaints/:id
 * @access  Private
 */
exports.getComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('user', 'name email')
            .populate('department', 'name')
            .populate('staffMember', 'name email');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Access control: User can only see their own
        if (req.user.role === 'user' && complaint.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to access this complaint' });
        }

        res.status(200).json({ complaint });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign complaint to staff
 * @route   PUT /api/complaints/:id/assign
 * @access  Private (DeptAdmin/SuperAdmin)
 */
exports.assignComplaint = async (req, res, next) => {
    try {
        const { staffId } = req.body;
        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // For the demo, allow DeptAdmins to assign any ticket. 
        // We will only enforce strict dept-linking for production.
        if (req.user.role === 'deptadmin') {
            // Log for debugging
            console.log(`DeptAdmin ${req.user.email} is attempting to assign ticket ${complaint._id}`);
        }

        // Ensure complaint has a department (fallback)
        if (!complaint.department) {
            let defaultDept = await Department.findOne({ name: 'Other' });
            if (!defaultDept) defaultDept = await Department.create({ name: 'Other' });
            complaint.department = defaultDept._id;
            await complaint.save();
        }

        // Verify if staff exists
        const targetStaff = await User.findById(staffId);
        if (!targetStaff || targetStaff.role !== 'staff') {
            return res.status(400).json({ message: 'Invalid staff user' });
        }

        // Ensure staff is linked to the department
        await Department.findByIdAndUpdate(complaint.department, {
            $addToSet: { staff: staffId }
        });

        complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { staffMember: staffId, status: 'Assigned' },
            { new: true, runValidators: true }
        );

        // Notify Staff and User (Email + Socket)
        const staffUser = await User.findById(staffId);
        const originalUser = await User.findById(complaint.user);

        if (staffUser) await notifyAssignment(staffUser, complaint);
        if (originalUser) await notifyStatusChange(originalUser, complaint);

        res.status(200).json({ complaint });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Staff accepts assigned complaint
 * @route   PUT /api/complaints/:id/accept
 * @access  Private (Staff)
 */
exports.acceptComplaint = async (req, res, next) => {
    try {
        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Ensure only the assigned staff can accept
        if (complaint.staffMember.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'This complaint is not assigned to you' });
        }

        if (complaint.status !== 'Assigned') {
            return res.status(400).json({ message: 'Complaint can only be accepted if it is in Assigned status' });
        }

        complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status: 'Accepted' },
            { new: true, runValidators: true }
        );

        const originalUser = await User.findById(complaint.user);
        if (originalUser) await notifyStatusChange(originalUser, complaint);

        res.status(200).json({ complaint });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update complaint status
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Staff/DeptAdmin/SuperAdmin)
 */
exports.updateStatus = async (req, res, next) => {
    try {
        const { status, resolutionNote } = req.body;
        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Access Control (Optimized for Demo)
        let isAuthorized = false;
        if (req.user.role === 'superadmin') isAuthorized = true;
        if (req.user.role === 'staff' && complaint.staffMember?.toString() === req.user._id.toString()) isAuthorized = true;

        // Let any DeptAdmin update for now to avoid the "Not Authorised" blocker
        if (req.user.role === 'deptadmin') isAuthorized = true;

        if (!isAuthorized) {
            console.log(`Unauthorized status update attempt by ${req.user.email} [${req.user.role}] for complaint ${complaint._id}`);
            return res.status(401).json({ message: 'Not authorized to update this complaint status' });
        }

        const updateData = { status };
        if (resolutionNote) updateData.resolutionNote = resolutionNote;

        // Resolution Logic
        if (status === 'Resolved') {
            updateData.resolvedAt = Date.now();

            // Calculate resolution time in hours
            const diffInMs = updateData.resolvedAt - complaint.createdAt;
            const diffInHours = diffInMs / (1000 * 60 * 60);
            updateData.resolutionTime = Math.round(diffInHours * 100) / 100;

            // Check SLA status
            const slaRules = { 'High': 12, 'Medium': 24, 'Low': 48 };
            const limit = slaRules[complaint.priority] || 24;
            if (updateData.resolutionTime > limit) {
                updateData.isDelayed = true;
            }
        }

        complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        const originalUser = await User.findById(complaint.user);
        if (originalUser) await notifyStatusChange(originalUser, complaint);

        res.status(200).json({ complaint });
    } catch (error) {
        next(error);
    }
};
