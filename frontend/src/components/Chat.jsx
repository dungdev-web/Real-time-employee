import React, { useState, useEffect, useRef } from 'react';
import socketService from '../lib/socket';
import '../css/Chat.scss';

function Chat({ currentUserId, currentUserType, otherUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const setupCompleteRef = useRef(false);

  // Single effect to set up socket listeners (runs once on mount)
  useEffect(() => {
    // Prevent double setup in React Strict Mode
    if (setupCompleteRef.current) return;
    setupCompleteRef.current = true;

    console.log('Setting up socket listeners for Chat');
    
    const socket = socketService.connect();
    
    const handleConnect = () => {
      setConnected(true);
      console.log('Chat connected:', socket.id);
    };

    const handleDisconnect = () => {
      setConnected(false);
      console.log('Chat disconnected');
    };

    const handleLoadMessages = (loadedMessages) => {
      console.log('Loaded messages:', loadedMessages);
      if (Array.isArray(loadedMessages)) {
        const sortedMessages = loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sortedMessages);
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const handleNewMessage = (message) => {
      console.log('New message received:', message);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.messageId === message.messageId)) {
          console.log('Duplicate message, ignoring');
          return prev;
        }
        console.log('Adding new message to state');
        return [...prev, message];
      });
      setTimeout(() => scrollToBottom(), 100);
    };

    const handleUserTyping = ({ userId, isTyping: typing }) => {
      console.log('Typing indicator:', { userId, typing, currentUserId });
      if (userId !== currentUserId) {
        setIsTyping(typing);
      }
    };

    // Register listeners with socket service
    socketService.registerListener('load-messages', handleLoadMessages);
    socketService.registerListener('new-message', handleNewMessage);
    socketService.registerListener('user-typing', handleUserTyping);

    // Manually attach connection listeners (these should fire multiple times)
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup function
    return () => {
      // Don't remove listeners - keep them for reconnections
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      setupCompleteRef.current = false;
    };
  }, []); // Empty dependency array - runs only on mount

  // Separate effect to join conversation (runs when participants change)
  useEffect(() => {
    if (currentUserId && otherUserId) {
      console.log('Joining conversation:', { currentUserId, otherUserId });
      socketService.joinConversation(currentUserId, currentUserType, otherUserId);
    }
  }, [currentUserId, currentUserType, otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    console.log('Sending message:', {
      senderId: currentUserId,
      senderType: currentUserType,
      receiverId: otherUserId,
      message: newMessage.trim()
    });

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
      {/* Status Bar */}
      <div className="chat-status">
        <div className="status-indicator-wrapper">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{connected ? 'Connected' : 'Connecting...'}</span>
        </div>
        {connected && messages.length > 0 && (
          <span className="message-count">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="no-messages">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 13H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No messages yet</h3>
              <p>Start the conversation with {otherUserName}!</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="date-divider">
                <span>{date}</span>
              </div>
              {msgs.map((msg, index) => {
                const isSent = msg.senderId === currentUserId;
                
                return (
                  <div
                    key={msg.messageId}
                    className={`message ${isSent ? 'sent' : 'received'}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="message-bubble">
                      <p className="message-text">{msg.message}</p>
                      <div className="message-meta">
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                        {isSent && (
                          <svg viewBox="0 0 24 24" fill="none" className="check-icon">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <span className="typing-text">{otherUserName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={`Message ${otherUserName}...`}
            disabled={!connected}
          />
          <button 
            type="button" 
            className="emoji-button"
            disabled={!connected}
            title="Emoji (coming soon)"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="9" r="1" fill="currentColor"/>
              <circle cx="15" cy="9" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <button 
          type="submit" 
          className="send-button"
          disabled={!connected || !newMessage.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

export default Chat;