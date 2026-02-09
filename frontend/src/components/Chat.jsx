import React, { useState, useEffect, useRef } from "react";
import socketService from "../lib/socket";
import "../css/Chat.scss";
import { chatAPI } from "../services/api";
import { Send } from 'lucide-react';
function Chat({ conversationId, currentUserId, currentUserType, otherUserId, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasJoinedRoom = useRef(false);

  // ===== SCROLL TO BOTTOM =====
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ===== FORMAT FUNCTIONS =====
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach((msg) => {
      const key = formatDate(msg.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  // ===== SOCKET CONNECTION (ONCE) =====
  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setConnected(true);
      // console.log("✅ Chat connected:", socket.id);
      socket.emit("user-online", { userId: currentUserId });
    };

    const handleDisconnect = () => {
      setConnected(false);
      hasJoinedRoom.current = false;
      // console.log("❌ Chat disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // If already connected when component mounts
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []); // ✅ Only once

  // ===== LOAD MESSAGES & JOIN ROOM WHEN CONVERSATION CHANGES =====
  useEffect(() => {
    if (!conversationId || !currentUserId || !otherUserId) {
      console.warn("⚠️ Missing required IDs:", { conversationId, currentUserId, otherUserId });
      return;
    }

    // console.log("🔥 Loading conversation:", conversationId);

    // ✅ CRITICAL: JOIN SOCKET ROOM FIRST
    const joinPayload = {
      userId: currentUserId,
      userType: currentUserType,
      otherUserId: otherUserId
    };
    
    // console.log("📡 Joining room with payload:", joinPayload);
    socketService.joinConversation(joinPayload);
    hasJoinedRoom.current = true;

    // Load messages from API
    chatAPI.getMessages(conversationId)
      .then((res) => {
        console.log("Loaded messages from API:", res.messages?.length || 0);
        setMessages(res.messages || []);
        scrollToBottom();
      })
      .catch((err) => {
        console.error("❌ Failed to load messages:", err);
        setMessages([]);
      });

    // Cleanup: leave room when conversation changes
    return () => {
      if (hasJoinedRoom.current) {
        socketService.leaveConversation(conversationId);
        hasJoinedRoom.current = false;
        // console.log("👋 Left room:", conversationId);
      }
    };
  }, [conversationId, currentUserId, currentUserType, otherUserId]);

  // ===== SOCKET LISTENERS (WHEN CONVERSATION CHANGES) =====
  useEffect(() => {
    if (!conversationId) return;

    // ✅ NEW MESSAGE HANDLER
    const handleNewMessage = (msg) => {
      // console.log("📩 New message received:", msg);
      
      // Avoid duplicates
      setMessages((prev) => {
        const exists = prev.find(m => m.messageId === msg.messageId);
        if (exists) {
          // console.log("⚠️ Duplicate message, ignoring");
          return prev;
        }
        
        // console.log("✅ Adding new message to state");
        const updated = [...prev, msg];
        
        // Auto-scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
        
        return updated;
      });
    };

    // ✅ TYPING HANDLER
    const handleUserTyping = (data) => {
      // console.log("⌨️ Typing indicator:", data);
      if (String(data.userId) === String(otherUserId)) {
        setIsTyping(data.typing);
      }
    };

    // ✅ USER STATUS HANDLER
    const handleUserStatus = (data) => {
      // console.log("👤 User status:", data);
      if (String(data.userId) === String(otherUserId)) {
        setOtherUserOnline(data.status === 'online');
      }
    };

    // ✅ LOAD MESSAGES HANDLER (from socket)
    const handleLoadMessages = (data) => {
      if (data && data.length > 0) {
        // console.log("📨 Socket loaded messages:", data.length);
        setMessages(data);
        scrollToBottom();
      }
    };

    // Register listeners
    socketService.registerListener("new-message", handleNewMessage);
    socketService.registerListener("user-typing", handleUserTyping);
    socketService.registerListener("user-status-changed", handleUserStatus);
    socketService.registerListener("load-messages", handleLoadMessages);

    // console.log("🎧 Socket listeners registered for conversation:", conversationId);

    // Cleanup listeners when conversation changes
    return () => {
      socketService.removeListener("new-message");
      socketService.removeListener("user-typing");
      socketService.removeListener("user-status-changed");
      socketService.removeListener("load-messages");
      // console.log("🔇 Socket listeners removed");
    };
  }, [conversationId, otherUserId]);

  // ===== SEND MESSAGE =====
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;

    // console.log("📤 Sending message:", {
    //   senderId: currentUserId,
    //   senderType: currentUserType,
    //   receiverId: otherUserId,
    //   message: newMessage.trim()
    // });

    socketService.sendMessage(
      currentUserId,
      currentUserType,
      otherUserId,
      newMessage.trim()
    );

    setNewMessage("");

    // Stop typing indicator
    socketService.sendTyping(currentUserId, false);
  };

  // ===== TYPING INDICATOR =====
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    socketService.sendTyping(currentUserId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(currentUserId, false);
    }, 1000);
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header-bar">
        <div className="header-left">
          <div className="header-info">
            <h3>{otherUserName}</h3>
            <p className={`status ${otherUserOnline ? "online" : "offline"}`}>
              <span className="status-dot"></span>
              {otherUserOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
           <button onClick={() => window.history.back()} className="back-button">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      {/* MESSAGES */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="date-separator">
                <span>{date}</span>
              </div>
              {msgs.map((msg) => {
                const isSent = String(msg.senderId) === String(currentUserId);
                
                return (
                  <div
                    key={msg.messageId}
                    className={`message-wrapper ${isSent ? "sent" : "received"}`}
                  >
                    <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
                      <p className="message-text">{msg.message}</p>
                      <span className="message-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">{otherUserName} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="message-input-section">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={`Message ${otherUserName}...`}
            disabled={!connected}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            className="send-button"
          >
            
                <Send />

          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;