require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { initializeFirebase, getDatabase } = require("./config/firebase");
const {
  generateMessageId,
  createConversationId,
  sanitizeInput,
} = require("./utils/helpers");
const employeeRoutes = require("./routes/employee.routes.js");
const ownerRoutes = require("./routes/owner.routes.js");
const chatRoutes = require("./routes/chat.routes.js");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error("Failed to initialize Firebase. Please check configuration.");
  process.exit(1);
}

const URL = process.env.FRONTEND_URL;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api/owner/access-code", authLimiter);
app.use("/api/owner/access-code/verify", authLimiter);
app.use("/api/employee/email", authLimiter);
app.use("/api/employee/access-code/verify-email", authLimiter);

// Routes
app.use("/api/owner", ownerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/chat", chatRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Employee Task Management API",
    version: "1.0.0",
    endpoints: {
      owner: "/api/owner",
      employee: "/api/employee",
      chat: "/api/chat",
      health: "/health",
    },
  });
});

// ===== SOCKET.IO CONNECTION HANDLING =====
const onlineUsers = new Map(); // userId -> { socketId, rooms: Set }

io.on("connection", (socket) => {
  // console.log('🔌 New client connected:', socket.id);

  // ===== USER ONLINE =====
  socket.on("user-online", ({ userId }) => {
    onlineUsers.set(userId, {
      socketId: socket.id,
      rooms: new Set(),
    });

    // console.log('🟢 User online:', userId);

    // Broadcast to all
    io.emit("user-status-changed", {
      userId,
      status: "online",
    });
  });

  // ===== JOIN CONVERSATION =====
  socket.on("join-conversation", async ({ userId, userType, otherUserId }) => {
    try {
      // Validate inputs
      if (!userId || !otherUserId) {
        console.error("❌ Invalid join-conversation:", {
          userId,
          userType,
          otherUserId,
        });
        socket.emit("error", { message: "Missing userId or otherUserId" });
        return;
      }

      // ✅ Create consistent conversation ID
      const conversationId = createConversationId(userId, otherUserId);

      //       console.log(`
      // 📋 JOIN CONVERSATION:
      //    User: ${userId} (${userType})
      //    Other: ${otherUserId}
      //    Room: ${conversationId}
      //    Socket: ${socket.id}`);

      // Join the room
      socket.join(conversationId);

      // Track room in user data
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).rooms.add(conversationId);
      }

      // ✅ CRITICAL: Store conversation ID on socket for typing events
      socket.currentConversationId = conversationId;
      socket.currentUserId = userId;

      // console.log(`✅ User ${userId} joined room: ${conversationId}`);
      // console.log(`   Active rooms: ${Array.from(socket.rooms).join(', ')}`);

      // Load and send previous messages
      const db = getDatabase();
      const messagesRef = db.ref(`messages/${conversationId}`);
      const snapshot = await messagesRef
        .orderByChild("timestamp")
        .limitToLast(50)
        .once("value");

      const messages = snapshot.val();

      if (messages) {
        const messageArray = Object.values(messages).sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        socket.emit("load-messages", messageArray);
      } else {
        socket.emit("load-messages", []);
      }
    } catch (error) {
      console.error("❌ Error joining conversation:", error);
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  // ===== SEND MESSAGE =====
  socket.on(
    "send-message",
    async ({ senderId, senderType, receiverId, message }) => {
      try {
        if (!message || message.trim() === "") return;
        if (!senderId || !receiverId) return;

        const db = getDatabase();
        const conversationId = createConversationId(senderId, receiverId);
        const messageId = generateMessageId();

        const messageData = {
          messageId,
          senderId,
          senderType,
          receiverId,
          message: sanitizeInput(message),
          timestamp: Date.now(),
          read: false,
          conversationId,
        };

        // Save to database
        await db
          .ref(`messages/${conversationId}/${messageId}`)
          .set(messageData);

        // ✅ EMIT MESSAGE TO ROOM
        io.to(conversationId).emit("new-message", messageData);
        const receiver = onlineUsers.get(receiverId);
        if (receiver) {
          io.to(receiver.socketId).emit("notification", {
            conversationId,
            message: messageData.message,
            senderId,
            timestamp: Date.now(),
          });
        }

        // ✅ EMIT SENDER STATUS (CẬP NHẬT STATUS NGƯỜI GỬI)
        io.emit("user-status-changed", {
          userId: senderId,
          status: "online",
          timestamp: Date.now(),
        });

        // ✅ EMIT RECEIVER STATUS (CẬP NHẬT STATUS NGƯỜI NHẬN)
        io.emit("user-status-changed", {
          userId: receiverId,
          status: "online",
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    },
  );

  // ===== TYPING INDICATOR =====
  socket.on("typing", ({ userId, isTyping }) => {
    // ✅ Use stored conversation ID
    const conversationId = socket.currentConversationId;

    if (!conversationId) {
      console.warn("⚠️ Typing event without conversation ID");
      return;
    }

    // console.log(`⌨️ Typing: ${userId} -> ${conversationId} (${isTyping})`);

    // Emit to others in the room (not including sender)
    socket.to(conversationId).emit("user-typing", {
      userId,
      typing: isTyping,
    });
  });

  // ===== MARK MESSAGES AS READ =====
  socket.on("mark-as-read", async ({ conversationId, userId }) => {
    try {
      const db = getDatabase();
      const messagesRef = db.ref(`messages/${conversationId}`);
      const snapshot = await messagesRef
        .orderByChild("read")
        .equalTo(false)
        .once("value");

      const unreadMessages = snapshot.val();

      if (unreadMessages) {
        const updates = {};
        Object.keys(unreadMessages).forEach((messageId) => {
          if (unreadMessages[messageId].receiverId === userId) {
            updates[`${messageId}/read`] = true;
          }
        });

        if (Object.keys(updates).length > 0) {
          await messagesRef.update(updates);
          io.to(conversationId).emit("messages-read", {
            conversationId,
            userId,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  });

  // ===== LEAVE CONVERSATION =====
  socket.on("leave-conversation", ({ conversationId }) => {
    socket.leave(conversationId);

    // Remove from user's rooms
    if (socket.currentUserId && onlineUsers.has(socket.currentUserId)) {
      onlineUsers.get(socket.currentUserId).rooms.delete(conversationId);
    }

    // console.log(`👋 User left room: ${conversationId}`);
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    // Find and remove user
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      // console.log('🔴 User offline:', disconnectedUserId);

      io.emit("user-status-changed", {
        userId: disconnectedUserId,
        status: "offline",
      });
    }

    // console.log('🔌 Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  Employee Task Management Server                      ║
║  Running on port ${PORT}                                 ║
║  Environment: ${process.env.NODE_ENV || "development"}                        ║
║                                                       ║
║  API Endpoints:                                       ║
║  - http://localhost:${PORT}/api/owner                    ║
║  - http://localhost:${PORT}/api/employee                 ║
║  - http://localhost:${PORT}/api/chat                     ║
║                   ║
║                                                       ║
║  Socket.io: Connected ✅                              ║
║  Firebase: Connected ✅                               ║
╚═══════════════════════════════════════════════════════╝
  `);
  // console.log(`Frontend URL: ${URL}\n`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = { app, io };
