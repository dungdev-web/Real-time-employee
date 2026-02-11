import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Use Map to track listeners by event name
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  joinConversation(payload) {
    if (this.socket) {
      this.socket.emit("join-conversation", payload);
    }
    console.log("JOIN:", payload);
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit("leave-conversation", { conversationId });
    }
  }

  sendMessage(senderId, senderType, receiverId, message) {
    if (this.socket) {
      this.socket.emit("send-message", {
        senderId,
        senderType,
        receiverId,
        message,
      });
    }
  }

  /**
   * Register a listener for an event
   * Prevents duplicate listeners by removing old one before adding new
   */
  registerListener(eventName, callback) {
    if (!this.socket) {
      console.warn("Socket not connected");
      return;
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const callbacks = this.listeners.get(eventName);

    // Prevent duplicate same function
    if (!callbacks.has(callback)) {
      this.socket.on(eventName, callback);
      callbacks.add(callback);
      console.log(
        `Registered ${eventName} listener (total: ${callbacks.size})`,
      );
    }
  }

  // Keep old methods for backward compatibility
  onLoadMessages(callback) {
    this.registerListener("load-messages", callback);
  }

  onNewMessage(callback) {
    this.registerListener("new-message", callback);
  }

  markAsRead(conversationId, userId) {
    if (this.socket) {
      this.socket.emit("mark-as-read", { conversationId, userId });
    }
  }

  onMessagesRead(callback) {
    this.registerListener("messages-read", callback);
  }

  sendTyping(userId, isTyping) {
    if (this.socket) {
      this.socket.emit("typing", { userId, isTyping });
    }
  }

  onUserTyping(callback) {
    this.registerListener("typing", callback);
  }

  /**
   * Remove a specific listener
   */
  removeListener(eventName, callback) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);

    if (callback) {
      this.socket.off(eventName, callback);
      callbacks.delete(callback);
    } else {
      // Remove all callbacks for this event
      callbacks.forEach((cb) => {
        this.socket.off(eventName, cb);
      });
      callbacks.clear();
    }

    if (callbacks.size === 0) {
      this.listeners.delete(eventName);
    }

    console.log(`Removed ${eventName} listener(s)`);
  }

  emit(event, payload) {
    if (this.socket) {
      this.socket.emit(event, payload);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach((cb) => {
        if (this.socket) {
          this.socket.off(eventName, cb);
        }
      });
    });
    this.listeners.clear();
    console.log("Removed all listeners");
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();

export default socketService;
