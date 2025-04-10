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

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

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

// === Health Check ===
app.get('/', (req, res) => {
  res.send('Socket.IO + Dialogflow server is running.');
});

// === Start Server ===
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
