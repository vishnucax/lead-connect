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

    let onlineCount = 0;
    
    io.on('connection', (socket) => {
        onlineCount++;
        io.emit('onlineCount', onlineCount); 
        socket.emit('onlineCount', onlineCount); // Immediate update for this socket
        console.log(`New connection: ${socket.id} (Online: ${onlineCount})`);

        handleMatchmaking(io, socket);
        handleSignaling(io, socket);

        socket.on('disconnect', () => {
            onlineCount = Math.max(0, onlineCount - 1);
            io.emit('onlineCount', onlineCount);
            console.log(`User disconnected: ${socket.id} (Online: ${onlineCount})`);
        });
    });
};

module.exports = initSocket;
