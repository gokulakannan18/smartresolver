const { chatProcess } = require('../services/aiService');
const Complaint = require('../models/Complaint');

/**
 * @desc    Chat with AI Assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
exports.chatWithAI = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Please provide a message' });
        }

        // Fetch user's complaints context for the AI
        const complaints = await Complaint.find({ user: req.user.id }).sort('-createdAt');

        const response = await chatProcess(message, complaints);

        res.status(200).json({
            success: true,
            response
        });
    } catch (error) {
        next(error);
    }
};
