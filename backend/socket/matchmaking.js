const queue = [];

const handleMatchmaking = (io, socket) => {
    socket.on('joinQueue', (userData) => {
        socket.userData = userData; // { id, email }
        
        if (queue.length > 0) {
            const partner = queue.shift();
            const partnerSocket = io.sockets.sockets.get(partner.socketId);

            if (partnerSocket) {
                const sessionId = Math.random().toString(36).substring(7);
                
                // Notify both users they are matched
                socket.emit('matched', { partner: partner.userData, sessionId, initiator: true });
                partnerSocket.emit('matched', { partner: userData, sessionId, initiator: false });

                // Link them for signaling
                socket.partnerId = partner.socketId;
                partnerSocket.partnerId = socket.id;
                
                console.log(`Matched ${socket.id} with ${partner.socketId}`);
            } else {
                // Partner disconnected while in queue
                queue.push({ socketId: socket.id, userData });
            }
        } else {
            queue.push({ socketId: socket.id, userData });
            console.log(`User ${socket.id} joined queue`);
        }
    });

    socket.on('leaveQueue', () => {
        const index = queue.findIndex(item => item.socketId === socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
            console.log(`User ${socket.id} left queue`);
        }
    });

    socket.on('disconnect', () => {
        const index = queue.findIndex(item => item.socketId === socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
        }
        
        if (socket.partnerId) {
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.emit('partnerDisconnected');
                partnerSocket.partnerId = null;
            }
        }
    });
};

module.exports = { handleMatchmaking };
