import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
import "../css/Sidebar.scss";
import { useChat } from "../context/ChatContext";

function Sidebar({ menuItems, messagePath }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { conversations, selectConversation, selectedConversation, unreadMap } =
    useChat();

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? "Just now" : `${minutes}m ago`;
    }

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="message-sidebar">
      <div className="sidebar-logo">
        <div className="logo-placeholder" />
      </div>

      {/* MAIN MENU */}
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* CHAT SIDEBAR */}
      {location.pathname === messagePath && (
        <div className="conversations-section">
          <div className="section-header">
            <h3>All Message</h3>
            <div className="header-icons">
              <button className="icon-btn">
                <Bell size={18} />
              </button>
              <button className="icon-btn">
                <User size={18} />
              </button>
            </div>
          </div>

          <div className="conversations-list">
            {!Array.isArray(conversations) || conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    selectedConversation?.id === conv.id ? "active" : ""
                  }`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conversation-avatar">
                    <User size={20} />
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">
                        {conv.otherUserName}

                        {unreadMap?.[conv.id] && (
                          <span className="unread-dot" />
                        )}
                      </span>

                      {conv.lastMessage && (
                        <span className="conversation-time">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="conversation-preview">
                        <p className="last-message">
                          {conv.lastMessage?.message || "No messages yet"}
                        </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
