const nodemailer = require('nodemailer');
const { getIO } = require('../socket');

/**
 * @desc    Initialize Nodemailer transporter
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * @desc    Send Email Notification
 */
const sendEmail = async (options) => {
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        await transporter.sendMail(message);
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
    }
};

/**
 * @desc    Notify Staff on Assignment
 */
exports.notifyAssignment = async (staff, complaint) => {
    // 1. Socket Alert
    const io = getIO();
    io.to(staff._id.toString()).emit('complaintAssigned', complaint);

    // 2. Email Alert
    const emailOptions = {
        email: staff.email,
        subject: `New Task Assigned: ${complaint.title}`,
        message: `Hello ${staff.name}, a new complaint has been assigned to you. \n\nTitle: ${complaint.title}\nDescription: ${complaint.description}`,
        html: `
            <h3>Action Required: New Complaint Assigned</h3>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p>Please login to the portal to accept the task.</p>
        `
    };
    await sendEmail(emailOptions);
};

/**
 * @desc    Notify User on Status Change
 */
exports.notifyStatusChange = async (user, complaint) => {
    // 1. Socket Alert
    const io = getIO();
    io.to(user._id.toString()).emit('statusChanged', {
        status: complaint.status,
        id: complaint._id
    });

    // 2. Email Alert
    const emailOptions = {
        email: user.email,
        subject: `Complaint Status Updated: ${complaint.title}`,
        message: `Your complaint "${complaint.title}" is now "${complaint.status}".`,
        html: `
            <h3>Status Update: ${complaint.title}</h3>
            <p>Your issue has been updated to: <strong>${complaint.status}</strong></p>
            <p>Check the dashboard for more details.</p>
        `
    };
    await sendEmail(emailOptions);
};

/**
 * @desc    Notify Admin on New Highly-Prioritized Ticket
 */
exports.notifyUrgentTicket = async (adminId, adminEmail, complaint) => {
    const io = getIO();
    io.to(adminId.toString()).emit('urgentTicketDetected', complaint);

    await sendEmail({
        email: adminEmail,
        subject: `URGENT Complaint Detected: ${complaint.title}`,
        message: `A high-priority issue was just categorized by AI for your department.`,
        html: `<h3>🚨 Urgent Action Needed</h3><p>${complaint.description}</p>`
    });
};
