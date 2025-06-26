const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.emit('connect_success', { message: 'Connected to server successfully!' });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    
    // Test event
    socket.on('test', (data) => {
        console.log('Test event received:', data);
        socket.emit('test_response', { message: 'Test successful!' });
    });
});

server.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
