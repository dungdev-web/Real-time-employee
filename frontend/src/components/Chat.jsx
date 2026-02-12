import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { formatDate,formatTime } from "../lib/format";
import socketService from "../lib/socket";
import "../css/Chat.scss";
import { chatAPI } from "../services/api";
import { Send } from "lucide-react";
function Chat({
  conversationId,
  currentUserId,
  currentUserType,
  otherUserId,
  otherUserName,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasJoinedRoom = useRef(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const messageGroups = useMemo(() => {
    const groups = {};
    messages.forEach((msg) => {
      const key = formatDate(msg.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  }, [messages]); // Chỉ tính toán lại khi mảng messages thay đổi

  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setConnected(true);
      socket.emit("user-online", { userId: currentUserId });
    };

    const handleDisconnect = () => {
      setConnected(false);
      hasJoinedRoom.current = false;
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    if (socket.connected) {
      handleConnect();
    }
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUserId || !otherUserId) {
      // console.warn("⚠️ Missing required IDs:", {
      //   conversationId,
      //   currentUserId,
      //   otherUserId,
      // });
      return;
    }
    // JOIN SOCKET ROOM FIRST
    const joinPayload = {
      userId: currentUserId,
      userType: currentUserType,
      otherUserId: otherUserId,
    };
    socketService.joinConversation(joinPayload);
    hasJoinedRoom.current = true;

    // Load messages from API
    chatAPI
      .getMessages(conversationId)
      .then((res) => {
        console.log("Loaded messages from API:", res.messages?.length || 0);
        setMessages(res.messages || []);
        scrollToBottom();
      })
      .catch((err) => {
        console.error("❌ Failed to load messages:", err);
        setMessages([]);
      });

    // Leave room when conversation changes
    return () => {
      if (hasJoinedRoom.current) {
        socketService.leaveConversation(conversationId);
        hasJoinedRoom.current = false;
      }
    };
  }, [conversationId, currentUserId, currentUserType, otherUserId]);

  useEffect(() => {
    if (!conversationId) return;
    // ✅ LOAD MESSAGES HANDLER
    const handleLoadMessages = (data) => {
      if (data && data.length > 0) {
        setMessages(data);
        scrollToBottom();
      }
    };

    socketService.registerListener("new-message", handleNewMessage);
    socketService.registerListener("user-typing", handleUserTyping);
    socketService.registerListener("user-status-changed", handleUserStatus);
    socketService.registerListener("load-messages", handleLoadMessages);

    return () => {
      socketService.removeListener("new-message");
      socketService.removeListener("user-typing");
      socketService.removeListener("user-status-changed");
      socketService.removeListener("load-messages");
    };
  }, [conversationId, otherUserId]);
  const handleNewMessage = useCallback((msg) => {
    setMessages((prev) => {
      const exists = prev.find((m) => m.messageId === msg.messageId);
      if (exists) return prev;
      return [...prev, msg];
    });
    setTimeout(() => scrollToBottom(), 100);
  }, []); // Không phụ thuộc vào state nào vì dùng setMessages dạng callback

  const handleUserTyping = useCallback(
    (data) => {
      if (String(data.userId) === String(otherUserId)) {
        setIsTyping(data.typing);
      }
    },
    [otherUserId],
  );

  const handleUserStatus = useCallback(
    (data) => {
      if (String(data.userId) === String(otherUserId)) {
        setOtherUserOnline(data.status === "online");
      }
    },
    [otherUserId],
  );
  // ===== SEND MESSAGE =====
  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !connected) return;

      socketService.sendMessage(
        currentUserId,
        currentUserType,
        otherUserId,
        newMessage.trim(),
      );

      setNewMessage("");
      socketService.sendTyping(currentUserId, false);
    },
    [newMessage, connected, currentUserId, currentUserType, otherUserId],
  );

  const handleTyping = useCallback(
    (e) => {
      setNewMessage(e.target.value);
      socketService.sendTyping(currentUserId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(currentUserId, false);
      }, 1000);
    },
    [currentUserId],
  );

  // const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-container">
      {/* header */}
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
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

      {/* message */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
                    <div
                      className={`message-bubble ${isSent ? "sent" : "received"}`}
                    >
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

      {/* input */}
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
