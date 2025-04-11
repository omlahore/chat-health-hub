
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const path = require('path');

// === Basic Setup ===
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Allow requests from any origin (for development)
});
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === Dialogflow Client Setup ===
const dialogflowClient = new SessionsClient({
  keyFilename: path.join(__dirname, 'dialogflow-key.json') // make sure this path is correct
});
const projectId = 'medilink-bot-giwi';

// Mock database for storing sessions
const scheduledSessions = [];

// === Socket.IO Events ===
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('message', (data) => {
    console.log(`Message from ${data.sender}: ${data.message}`);
    io.to(data.room).emit('message', data);
  });

  // Handle session scheduling
  socket.on('session:schedule', (sessionData) => {
    console.log('Session scheduled:', sessionData);
    
    // Check for conflicts
    const hasConflict = checkSessionConflict(sessionData);
    
    if (hasConflict) {
      // If conflict, send an error back to the client
      socket.emit('session:error', {
        sessionId: sessionData.id,
        error: 'Time slot already booked'
      });
    } else {
      // No conflict, add to "database" and broadcast
      scheduledSessions.push(sessionData);
      io.emit('session:scheduled', sessionData);
    }
  });
  
  // Handle session update
  socket.on('session:update', (data) => {
    const { sessionId, status } = data;
    const sessionIndex = scheduledSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      scheduledSessions[sessionIndex].status = status;
      io.emit('session:updated', scheduledSessions[sessionIndex]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Check for session time conflicts
function checkSessionConflict(newSession) {
  const newStart = new Date(newSession.scheduledAt).getTime();
  const newEnd = newStart + (newSession.duration * 60 * 1000);
  
  return scheduledSessions.some(session => {
    // Skip cancelled sessions
    if (session.status === 'cancelled') return false;
    
    // Skip the same session (for updates)
    if (session.id === newSession.id) return false;
    
    const sessionStart = new Date(session.scheduledAt).getTime();
    const sessionEnd = sessionStart + (session.duration * 60 * 1000);
    
    // Check for overlap
    return (
      (newStart >= sessionStart && newStart < sessionEnd) || // New session starts during existing session
      (newEnd > sessionStart && newEnd <= sessionEnd) || // New session ends during existing session
      (newStart <= sessionStart && newEnd >= sessionEnd) // New session completely contains existing session
    );
  });
}

// === Dialogflow API Endpoint ===
app.post('/api/message', async (req, res) => {
  const userMessage = req.body.message;
  const sessionId = uuid.v4();
  const sessionPath = dialogflowClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userMessage,
        languageCode: 'en-US',
      },
    },
  };

  try {
    const responses = await dialogflowClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.json({ reply: result.fulfillmentText });
  } catch (err) {
    console.error('Dialogflow Error:', err);
    res.status(500).json({ error: 'Something went wrong with Dialogflow.' });
  }
});

// === API endpoint to get all sessions ===
app.get('/api/sessions', (req, res) => {
  res.json(scheduledSessions);
});

// === Health Check ===
app.get('/', (req, res) => {
  res.send('Socket.IO + Dialogflow server is running.');
});

// === Start Server ===
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
