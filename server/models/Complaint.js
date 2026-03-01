const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['IT', 'Plumbing', 'Electrical', 'Furniture', 'Other']
    },
    priority: {
        type: String,
        required: [true, 'Please add a priority'],
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    image: {
        type: String, // Cloudinary URL
        required: [true, 'Please add an image']
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'Accepted', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: mongoose.Schema.ObjectId,
        ref: 'Department'
    },
    staffMember: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    resolutionNote: {
        type: String
    },
    aiReason: {
        type: String
    },
    resolvedAt: {
        type: Date
    },
    resolutionTime: {
        type: Number // in hours
    },
    isDelayed: {
        type: Boolean,
        default: false
    },
    isDuplicate: {
        type: Boolean,
        default: false
    },
    parentComplaint: {
        type: mongoose.Schema.ObjectId,
        ref: 'Complaint'
    },
    affectedUsersCount: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for SLA Deadline
complaintSchema.virtual('slaDeadline').get(function () {
    const slaRules = {
        'High': 12,
        'Medium': 24,
        'Low': 48
    };
    const hours = slaRules[this.priority] || 24;
    return new Date(this.createdAt.getTime() + hours * 60 * 60 * 1000);
});

module.exports = mongoose.model('Complaint', complaintSchema);
