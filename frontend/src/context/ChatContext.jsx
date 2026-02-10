import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { chatAPI } from "../services/api";
import socketService from "../lib/socket";
import notificationService from "../services/notificationService";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadMap, setUnreadMap] = useState({}); // 🔴 UNREAD MAP

  const selectedConversationRef = useRef(null);

  const userType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem("ownerId");
  const employeeId = localStorage.getItem("employeeId");

  const userId = userType === "owner" ? ownerId : employeeId;

  console.log("🔍 ChatProvider initialized:", { userType, userId });

  // Sync ref
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // =============================
  // LOAD CONVERSATIONS + SOCKET
  // =============================
  useEffect(() => {
    if (!userId) return;

    socketService.connect();

    const loadConversations = async () => {
      try {
        const res = await chatAPI.getConversations(userId);
        const convs = res.conversations || [];

        setConversations(convs);

        // Init unread map
        const initUnread = {};
        convs.forEach((c) => {
          initUnread[c.id] = false;
        });
        setUnreadMap(initUnread);
      } catch (err) {
        console.error("❌ Load conversations error:", err);
      }
    };

    loadConversations();

    // =================
    // NEW MESSAGE
    // =================
    const handleNewMessage = (message) => {
      console.log("📩 New message:", message);

      const currentConv = selectedConversationRef.current;
      const isCurrentConversation =
        currentConv && currentConv.id === message.conversationId;

      // Update lastMessage
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage:  { ...message }  }
            : conv,
        ),
      );

      // 🔴 MARK UNREAD
      if (!isCurrentConversation) {
        setUnreadMap((prev) => ({
          ...prev,
          [message.conversationId]: true,
        }));
      }
    };

    socketService.registerListener("new-message", handleNewMessage);

    return () => {
      socketService.removeListener("new-message");
    };
  }, [userId]);

  // =================
  // NOTIFICATION
  // =================
  useEffect(() => {
    const handleNotification = (data) => {
      console.log("🔔 SOCKET NOTIFICATION:", data);

      const currentConv = selectedConversationRef.current;
      const isCurrentConversation =
        currentConv && currentConv.id === data.conversationId;

      if (!isCurrentConversation) {
        notificationService.playSound();
        notificationService.showToast(`Tin nhắn mới: ${data.message}`);

        // 🔴 MARK UNREAD
        setUnreadMap((prev) => ({
          ...prev,
          [data.conversationId]: true,
        }));
      }
    };

    socketService.registerListener("notification", handleNotification);

    return () => {
      socketService.removeListener("notification");
    };
  }, []);

  // =================
  // SELECT CONVERSATION
  // =================
  const selectConversation = (conv) => {
    console.log("🎯 Selecting conversation:", conv.id);

    setSelectedConversation(conv);
    localStorage.setItem("selectedConversation", JSON.stringify(conv));

    // ✅ CLEAR UNREAD
    setUnreadMap((prev) => ({
      ...prev,
      [conv.id]: false,
    }));
  };

  // =================
  // RESTORE SELECTED
  // =================
  useEffect(() => {
    const saved = localStorage.getItem("selectedConversation");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedConversation(parsed);

        setUnreadMap((prev) => ({
          ...prev,
          [parsed.id]: false,
        }));
      } catch (err) {
        localStorage.removeItem("selectedConversation");
      }
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedConversation,
        selectConversation,
        userId,
        userType,
        setConversations,
        unreadMap, // 👈 EXPORT
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};
