const queue = [];

const handleMatchmaking = (io, socket) => {
    socket.on('joinQueue', (userData) => {
        socket.userData = userData; 
        
        if (queue.length > 0) {
            const partner = queue.shift();
            const partnerSocket = io.sockets.sockets.get(partner.socketId);

            if (partnerSocket) {
                const sessionId = Math.random().toString(36).substring(7);
                
                socket.emit('matched', { partner: partner.userData, sessionId, initiator: true });
                partnerSocket.emit('matched', { partner: userData, sessionId, initiator: false });

                socket.partnerId = partner.socketId;
                partnerSocket.partnerId = socket.id;
                
                console.log(`Matched ${socket.id} with ${partner.socketId}`);
            } else {
                queue.push({ socketId: socket.id, userData });
            }
        } else {
            queue.push({ socketId: socket.id, userData });
            console.log(`User ${socket.id} joined queue`);
        }
        io.emit('queueCount', queue.length);
    });

    socket.on('leaveQueue', () => {
        const index = queue.findIndex(item => item.socketId === socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
            io.emit('queueCount', queue.length);
            console.log(`User ${socket.id} left queue`);
        }
    });

    socket.on('disconnect', () => {
        const index = queue.findIndex(item => item.socketId === socket.id);
        if (index !== -1) {
            queue.splice(index, 1);
            io.emit('queueCount', queue.length);
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
