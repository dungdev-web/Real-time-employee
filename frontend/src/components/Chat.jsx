import React, { useState, useEffect, useRef } from 'react';
import socketService from '../lib/socket';
import '../css/Chat.css';

function Chat({ currentUserId, currentUserType, otherUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect socket
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setConnected(true);
      console.log('Chat connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Chat disconnected');
    });

    // Join conversation
    socketService.joinConversation(currentUserId, currentUserType, otherUserId);

    // Load previous messages
    socketService.onLoadMessages((loadedMessages) => {
      setMessages(loadedMessages.sort((a, b) => a.timestamp - b.timestamp));
      scrollToBottom();
    });

    // Listen for new messages
    socketService.onNewMessage((message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.messageId === message.messageId)) {
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
    });

    // Listen for typing indicator
    socketService.onUserTyping(({ userId, isTyping }) => {
      if (userId !== currentUserId) {
        setIsTyping(isTyping);
      }
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [currentUserId, currentUserType, otherUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    socketService.sendMessage(
      currentUserId,
      currentUserType,
      otherUserId,
      newMessage.trim()
    );

    setNewMessage('');
    
    // Stop typing indicator
    const conversationId = createConversationId(currentUserId, otherUserId);
    socketService.sendTyping(conversationId, currentUserId, false);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    const conversationId = createConversationId(currentUserId, otherUserId);
    
    // Send typing indicator
    socketService.sendTyping(conversationId, currentUserId, true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(conversationId, currentUserId, false);
    }, 1000);
  };

  const createConversationId = (id1, id2) => {
    return [id1, id2].sort().join('_');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(msg => {
      const dateKey = formatDate(msg.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-container">
      <div className="chat-status">
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
        <span className="status-text">{connected ? 'Connected' : 'Connecting...'}</span>
      </div>

      <div className="messages-container">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <div className="date-divider">{date}</div>
              {msgs.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
            {otherUserName} is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;