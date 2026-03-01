const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST", "PUT"]
        }
    });

    const jwt = require('jsonwebtoken');
    const User = require('./models/User');

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Auth error: No token'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = await User.findById(decoded.id);

            if (!socket.user) return next(new Error('Auth error: User not found'));
            next();
        } catch (err) {
            next(new Error('Auth error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ ${socket.user.name} Connected (${socket.id})`);

        // Automatically join private room and role rooms
        socket.join(socket.user._id.toString());

        if (socket.user.role === 'staff') socket.join('staff-room');
        if (socket.user.role === 'deptadmin') socket.join('deptadmin-room');
        if (socket.user.role === 'superadmin') socket.join('superadmin-room');

        socket.on('disconnect', () => {
            console.log(`❌ ${socket.user.name} Disconnected`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
