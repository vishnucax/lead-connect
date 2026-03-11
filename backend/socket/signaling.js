const handleSignaling = (io, socket) => {
    socket.on('offer', (data) => {
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('offer', data);
        }
    });

    socket.on('answer', (data) => {
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('answer', data);
        }
    });

    socket.on('ice-candidate', (data) => {
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('ice-candidate', data);
        }
    });

    socket.on('sendMessage', (message) => {
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('receiveMessage', {
                text: message,
                sender: 'partner',
                timestamp: new Date()
            });
        }
    });

    socket.on('skip', () => {
        if (socket.partnerId) {
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.emit('sessionEnded', { reason: 'partner_skipped' });
                partnerSocket.partnerId = null;
            }
            socket.partnerId = null;
        }
        // User will emit joinQueue again from frontend
    });

    socket.on('endSession', () => {
        if (socket.partnerId) {
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.emit('sessionEnded', { reason: 'partner_ended' });
                partnerSocket.partnerId = null;
            }
            socket.partnerId = null;
        }
    });
};

module.exports = { handleSignaling };
