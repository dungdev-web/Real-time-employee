import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(userId, userType, otherUserId) {
    if (this.socket) {
      this.socket.emit('join-conversation', {
        userId,
        userType,
        otherUserId
      });
    }
  }

  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave-conversation', { conversationId });
    }
  }

  sendMessage(senderId, senderType, receiverId, message) {
    if (this.socket) {
      this.socket.emit('send-message', {
        senderId,
        senderType,
        receiverId,
        message
      });
    }
  }

  onLoadMessages(callback) {
    if (this.socket) {
      this.socket.on('load-messages', callback);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  markAsRead(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('mark-as-read', { conversationId, userId });
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages-read', callback);
    }
  }

  sendTyping(conversationId, userId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, userId, isTyping });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();

export default socketService;