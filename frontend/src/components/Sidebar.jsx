import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { useEffect } from "react";
import "../css/Sidebar.scss";
import { useChat } from "../context/ChatContext";

function Sidebar({
  isOpen,
  setIsOpen,
  isMobile,
  menuItems,
  messagePath,
  users = [], 
  userType = null,
}) {
  const navigate = useNavigate();

  const location = useLocation();

  const { conversations, selectConversation, selectedConversation, unreadMap } =
    useChat();

  const closeIfMobile = () => {
    if (isMobile) setIsOpen(false);
  };

  // ✅ Chỉ filter nếu có users và đang ở owner mode
  const validConversations =
    users.length > 0 && userType === "owner"
      ? conversations.filter((conv) => {
          return users.some(
            (user) =>
              user.employeeId === conv.otherUserId ||
              user.name === conv.otherUserName,
          );
        })
      : conversations;

  // ✅ Auto deselect nếu user bị xóa (chỉ với owner)
  useEffect(() => {
    if (userType === "owner" && selectedConversation && users.length > 0) {
      const stillExists = users.some(
        (user) =>
          user.employeeId === selectedConversation.otherUserId ||
          user.name === selectedConversation.otherUserName,
      );

      if (!stillExists) {
        selectConversation(null);
      }
    }
  }, [users, selectedConversation, selectConversation, userType]);

  return (
    <div className={`message-sidebar ${isMobile && isOpen ? "open" : ""}`}>
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
            onClick={() => {
              navigate(item.path);
              closeIfMobile();
            }}
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
            {!Array.isArray(validConversations) ||
            validConversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
              </div>
            ) : (
              validConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${
                    selectedConversation?.id === conv.id ? "active" : ""
                  }`}
                  onClick={() => {
                    selectConversation(conv);
                    closeIfMobile();
                  }}
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
