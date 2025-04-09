// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Create an Express app
const app = express();

// Create an HTTP server
const server = http.createServer(app);

// Create a new Socket.IO server and allow CORS from anywhere for development
const io = new Server(server, { 
  cors: { 
    origin: '*' 
  } 
});

// When a client connects:
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Listen for joining a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  
  // Listen for messages
  socket.on('message', (data) => {
    console.log(`Message from ${data.sender}: ${data.message}`);
    // Broadcast the message to all sockets in the room
    io.to(data.room).emit('message', data);
  });
  
  // Optionally, listen for other events:
  // socket.on('user:status', (data) => { /* ... */ });
  
  // When the client disconnects:
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Define a basic route for testing
app.get('/', (req, res) => {
  res.send('Socket.IO server is running.');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
