
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

// Mock available slots for doctors
// Each doctor has available slots for the next 7 days from 9 AM to 5 PM, 30 min each
const doctorAvailableSlots = {};

function generateAvailableSlots(doctorId) {
  if (doctorAvailableSlots[doctorId]) return doctorAvailableSlots[doctorId];
  
  const slots = [];
  const now = new Date();
  
  // Generate slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    
    // 9 AM to 5 PM, 30 min slots
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        
        // Skip slots in the past
        if (slotDate > now) {
          slots.push({
            doctorId,
            startTime: slotDate.toISOString(),
            duration: 30, // minutes
            available: true
          });
        }
      }
    }
  }
  
  doctorAvailableSlots[doctorId] = slots;
  return slots;
}

// Update slot availability based on scheduled sessions
function updateSlotAvailability(doctorId) {
  if (!doctorAvailableSlots[doctorId]) {
    generateAvailableSlots(doctorId);
  }
  
  // Reset all slots to available
  doctorAvailableSlots[doctorId].forEach(slot => {
    slot.available = true;
  });
  
  // Mark slots as unavailable based on scheduled sessions
  scheduledSessions.forEach(session => {
    // Skip cancelled sessions
    if (session.status === 'cancelled') return;
    
    // Only check sessions for this doctor
    if (session.doctorId !== doctorId) return;
    
    const sessionStart = new Date(session.scheduledAt).getTime();
    const sessionEnd = sessionStart + (session.duration * 60 * 1000);
    
    doctorAvailableSlots[doctorId].forEach(slot => {
      const slotStart = new Date(slot.startTime).getTime();
      const slotEnd = slotStart + (slot.duration * 60 * 1000);
      
      // Check for overlap
      if (
        (slotStart >= sessionStart && slotStart < sessionEnd) || // Slot starts during session
        (slotEnd > sessionStart && slotEnd <= sessionEnd) || // Slot ends during session
        (slotStart <= sessionStart && slotEnd >= sessionEnd) // Slot completely contains session
      ) {
        slot.available = false;
      }
    });
  });
  
  return doctorAvailableSlots[doctorId];
}

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

  // Get available slots for a doctor
  socket.on('slots:get', (doctorId) => {
    console.log(`Getting slots for doctor: ${doctorId}`);
    const availableSlots = updateSlotAvailability(doctorId);
    socket.emit('slots:list', availableSlots);
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
      
      // Update slots availability
      updateSlotAvailability(sessionData.doctorId);
      
      // Send updated slots to all clients
      io.emit('slots:updated', {
        doctorId: sessionData.doctorId,
        slots: doctorAvailableSlots[sessionData.doctorId]
      });
    }
  });
  
  // Handle session update
  socket.on('session:update', (data) => {
    const { sessionId, status } = data;
    const sessionIndex = scheduledSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      const updatedSession = scheduledSessions[sessionIndex];
      updatedSession.status = status;
      scheduledSessions[sessionIndex] = updatedSession;
      io.emit('session:updated', updatedSession);
      
      // Update slots availability
      updateSlotAvailability(updatedSession.doctorId);
      
      // Send updated slots to all clients
      io.emit('slots:updated', {
        doctorId: updatedSession.doctorId,
        slots: doctorAvailableSlots[updatedSession.doctorId]
      });
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

// === API endpoint to get available slots for a doctor ===
app.get('/api/doctor/:doctorId/slots', (req, res) => {
  const doctorId = req.params.doctorId;
  const availableSlots = updateSlotAvailability(doctorId);
  res.json(availableSlots);
});

// === Health Check ===
app.get('/', (req, res) => {
  res.send('Socket.IO + Dialogflow server is running.');
});

// === Start Server ===
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
