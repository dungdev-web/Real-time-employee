require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initializeFirebase, getDatabase } = require('./config/firebase');
// const ownerRoutes = require('./routes/owner.routes.js');
const employeeRoutes = require('./routes/employee.routes.js');
const { generateMessageId, createConversationId, sanitizeInput } = require('./utils/helpers');
const ownerRoutes = require('./routes/owner.routes.js');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase. Please check configuration.');
  process.exit(1);
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Apply rate limiting to auth routes
app.use('/api/owner/create-access-code', authLimiter);
app.use('/api/owner/validate-access-code', authLimiter);
app.use('/api/employee/login-email', authLimiter);
app.use('/api/employee/validate-access-code', authLimiter);

// Routes
app.use('/api/owner', ownerRoutes);
app.use('/api/employee', employeeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Employee Task Management API',
    version: '1.0.0',
    endpoints: {
      owner: '/api/owner',
      employee: '/api/employee',
      health: '/health'
    }
  });
});

// Socket.io connection handling for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a conversation room
  socket.on('join-conversation', async ({ userId, userType, otherUserId }) => {
    try {
      const conversationId = createConversationId(userId, otherUserId);
      socket.join(conversationId);
      
      console.log(`User ${userId} (${userType}) joined conversation: ${conversationId}`);
      
      // Load and send previous messages
      const db = getDatabase();
      const messagesRef = db.ref(`messages/${conversationId}`);
      const snapshot = await messagesRef.orderByChild('timestamp').limitToLast(50).once('value');
      const messages = snapshot.val();
      
      if (messages) {
        socket.emit('load-messages', Object.values(messages));
      }
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Send a message
  socket.on('send-message', async ({ senderId, senderType, receiverId, message }) => {
    try {
      if (!message || message.trim() === '') {
        return;
      }

      const db = getDatabase();
      const conversationId = createConversationId(senderId, receiverId);
      const messageId = generateMessageId();
      
      const messageData = {
        messageId,
        senderId,
        senderType, // 'owner' or 'employee'
        receiverId,
        message: sanitizeInput(message),
        timestamp: Date.now(),
        read: false
      };

      // Save message to database
      await db.ref(`messages/${conversationId}/${messageId}`).set(messageData);

      // Emit message to all users in the conversation
      io.to(conversationId).emit('new-message', messageData);

      console.log(`Message sent in conversation ${conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark-as-read', async ({ conversationId, userId }) => {
    try {
      const db = getDatabase();
      const messagesRef = db.ref(`messages/${conversationId}`);
      const snapshot = await messagesRef.orderByChild('read').equalTo(false).once('value');
      const unreadMessages = snapshot.val();

      if (unreadMessages) {
        const updates = {};
        Object.keys(unreadMessages).forEach(messageId => {
          if (unreadMessages[messageId].receiverId === userId) {
            updates[`${messageId}/read`] = true;
          }
        });

        if (Object.keys(updates).length > 0) {
          await messagesRef.update(updates);
          io.to(conversationId).emit('messages-read', { conversationId, userId });
        }
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('user-typing', { userId, isTyping });
  });

  // Leave conversation
  socket.on('leave-conversation', ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`User left conversation: ${conversationId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  Employee Task Management Server                      ║
║  Running on port ${PORT}                                 ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                       ║
║  API Endpoints:                                       ║
║  - http://localhost:${PORT}/api/owner                    ║
║  - http://localhost:${PORT}/api/employee                 ║
║  - http://localhost:${PORT}/health                       ║
║                                                       ║
║  Socket.io: Connected                                 ║
║  Firebase: Connected                                  ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, io };