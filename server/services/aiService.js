const axios = require('axios');

/**
 * @desc    Predict Category and Priority based on description
 * @param   {string} description 
 * @returns {object} { category, priority, aiReason }
 */
exports.analyzeComplaint = async (description) => {
    try {
        // Simple logic for the demo (Mocking AI behavior)
        // In production, you would call OpenAI / Gemini here

        let predictedCategory = 'Other';
        let predictedPriority = 'Medium';
        let aiReason = 'Automatically categorized based on content keywords.';

        const descLower = description.toLowerCase();

        // Sample logic (Simulating an AI model)
        if (descLower.includes('leak') || descLower.includes('toilet') || descLower.includes('pipe') || descLower.includes('water')) {
            predictedCategory = 'Plumbing';
            predictedPriority = descLower.includes('flood') ? 'High' : 'Medium';
        } else if (descLower.includes('login') || descLower.includes('pc') || descLower.includes('wifi') || descLower.includes('network') || descLower.includes('internet')) {
            predictedCategory = 'IT';
            predictedPriority = descLower.includes('urgent') || descLower.includes('deadline') ? 'High' : 'Low';
        } else if (descLower.includes('wire') || descLower.includes('power') || descLower.includes('light') || descLower.includes('electricity') || descLower.includes('spark')) {
            predictedCategory = 'Electrical';
            predictedPriority = descLower.includes('spark') || descLower.includes('smoke') ? 'High' : 'Medium';
        } else if (descLower.includes('broken chair') || descLower.includes('desk') || descLower.includes('table') || descLower.includes('furniture')) {
            predictedCategory = 'Furniture';
            predictedPriority = 'Low';
        }

        return {
            category: predictedCategory,
            priority: predictedPriority,
            aiReason: aiReason
        };
    } catch (error) {
        console.error('AI Service Error:', error.message);
        // Fallback to defaults
        return {
            category: 'Other',
            priority: 'Medium',
            aiReason: 'AI Service currently unavailable.'
        };
    }
};

/**
 * @desc    Detect duplicate complaints using text similarity
 * @param   {string} description 
 * @param   {Array} existingComplaints 
 * @returns {object|null} The most similar complaint if above threshold
 */
exports.findDuplicate = async (description, existingComplaints) => {
    try {
        if (!existingComplaints || existingComplaints.length === 0) return null;

        const tokenize = (text) => new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        const tokens1 = tokenize(description);

        let bestMatch = null;
        let highestSimilarity = 0;
        const THRESHOLD = 0.5; // 50% similarity for mock

        for (const complaint of existingComplaints) {
            const tokens2 = tokenize(complaint.description);
            const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
            const union = new Set([...tokens1, ...tokens2]);
            const similarity = intersection.size / union.size;

            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = complaint;
            }
        }

        return highestSimilarity >= THRESHOLD ? bestMatch : null;
    } catch (error) {
        console.error('AI Similarity Error:', error.message);
        return null;
    }
};

/**
 * @desc    Smart AI Chatbot Processor
 * @param   {string} message 
 * @param   {Array} userComplaints 
 * @returns {string} AI Response
 */
exports.chatProcess = async (message, userComplaints) => {
    try {
        const msg = message.toLowerCase();

        // 1. Status Check Queries
        if (msg.includes('status') || msg.includes('my complaint') || msg.includes('check')) {
            if (!userComplaints || userComplaints.length === 0) {
                return "You haven't raised any complaints yet. Would you like me to guide you on how to do that?";
            }

            const latest = userComplaints[0];
            return `Checking... Your latest complaint "${latest.title}" is currently in "${latest.status}" status. It was created on ${new Date(latest.createdAt).toLocaleDateString()}.`;
        }

        // 2. Resolution Time Queries
        if (msg.includes('when') || msg.includes('time') || msg.includes('how long')) {
            if (userComplaints && userComplaints.length > 0) {
                const latest = userComplaints[0];
                const slaRules = { 'High': 12, 'Medium': 24, 'Low': 48 };
                const limit = slaRules[latest.priority] || 24;
                return `Based on the ${latest.priority} priority of your issue, our target resolution time for "${latest.title}" is within ${limit} hours.`;
            }
            return "Resolution times depend on priority: High (12h), Medium (24h), and Low (48h). Once you submit a complaint, I can give you a specific estimate!";
        }

        // 3. Guidance Queries
        if (msg.includes('how to') || msg.includes('raise') || msg.includes('create') || msg.includes('file')) {
            return "To raise a complaint, go to the 'New Complaint' section. You'll need to provide a title, a detailed description, and a photo of the issue. My AI will then automatically categorize it and route it to the right department!";
        }

        // Default response
        return "I'm your Smart Resolver Assistant! I can help you check complaint statuses, explain how to file new reports, or estimate resolution times. What can I do for you today?";
    } catch (error) {
        console.error('Chatbot Error:', error.message);
        return "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment!";
    }
};
