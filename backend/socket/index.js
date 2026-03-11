const jwt = require('jsonwebtoken');
const { handleMatchmaking } = require('./matchmaking');
const { handleSignaling } = require('./signaling');

const initSocket = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.user = decoded;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);

        handleMatchmaking(io, socket);
        handleSignaling(io, socket);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

module.exports = initSocket;
