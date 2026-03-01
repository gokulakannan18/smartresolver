require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');

// Connect to Database
connectDB();

const http = require('http');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simplified CORS for Demo (Allow All)
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: false, // Disable if using external CDNs or Cloudinary images frequently
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const deptRoutes = require('./routes/deptRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Global Static Folder (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.json({ message: 'Welcome to Smart Complaint & Issue Tracking System API' });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Static Production Build Serving
if (true || process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    // Catch-all fallback for SPA
    app.use((req, res, next) => {
        // If the request hasn't been handled by any API routes and is a GET request,
        // serve the React application's index.html
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            return res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
        }
        next();
    });
}

// Global Error Handler
const errorHandler = require('./middlewares/error');
app.use(errorHandler);

// Port & Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
