const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const mongoose = require('mongoose');

/**
 * @desc    Get Overall Dashboard Stats
 * @route   GET /api/analytics/dashboard
 * @access  Private (SuperAdmin)
 */
exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: null,
                    totalComplaints: { $sum: 1 },
                    resolvedComplaints: {
                        $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
                    },
                    openComplaints: {
                        $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] }
                    },
                    avgResolutionTime: { $avg: "$resolutionTime" },
                    delayedCount: {
                        $sum: { $cond: [{ $eq: ["$isDelayed", true] }, 1, 0] }
                    }
                }
            }
        ]);

        const deptStats = await Complaint.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const monthlyTrends = await Complaint.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            summary: stats[0] || { totalComplaints: 0, resolvedComplaints: 0, openComplaints: 0, avgResolutionTime: 0, delayedCount: 0 },
            byCategory: deptStats,
            monthlyTrends
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Staff Performance Metrics
 * @route   GET /api/analytics/staff-performance
 * @access  Private (SuperAdmin/DeptAdmin)
 */
exports.getStaffPerformance = async (req, res, next) => {
    try {
        const performance = await Complaint.aggregate([
            { $match: { status: "Resolved", staffMember: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$staffMember",
                    resolvedCount: { $sum: 1 },
                    avgTime: { $avg: "$resolutionTime" },
                    delayedCount: {
                        $sum: { $cond: [{ $eq: ["$isDelayed", true] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "staffDetails"
                }
            },
            { $unwind: "$staffDetails" },
            {
                $project: {
                    name: "$staffDetails.name",
                    email: "$staffDetails.email",
                    resolvedCount: 1,
                    avgTime: 1,
                    delayedCount: 1,
                    efficiency: { $subtract: [100, { $multiply: [{ $divide: ["$delayedCount", "$resolvedCount"] }, 100] }] }
                }
            },
            { $sort: { efficiency: -1 } }
        ]);

        res.status(200).json({ performance });
    } catch (error) {
        next(error);
    }
};
