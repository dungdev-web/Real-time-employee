import React, { createContext, useContext, useEffect, useState } from "react";
import { chatAPI } from "../services/api";
import socketService from "../lib/socket";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  const userType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem("ownerId");
  const employeeId = localStorage.getItem("employeeId");

  const userId = userType === "owner" ? ownerId : employeeId;

  console.log("🔍 ChatProvider initialized:", { userType, userId });

  // ✅ LOAD CONVERSATIONS WITH NAMES
  useEffect(() => {
    const socket = socketService.connect();

    const loadConversations = async () => {
      try {
        console.log("📡 Loading conversations for userId:", userId);
        
        const res = await chatAPI.getConversations(userId);
        console.log("📨 Conversations response:", res);
        
        // ✅ Conversations now include otherUserName from backend
        const convs = res.conversations || [];
        
        console.log("✅ Loaded conversations with names:");
        convs.forEach(conv => {
          console.log(`   - ${conv.id}`);
          console.log(`     ${conv.otherUserId} (${conv.otherUserName})`);
        });
        
        setConversations(convs);
      } catch (err) {
        console.error("❌ Load conversations error:", err);
      }
    };

    if (userId) {
      loadConversations();
    }

    // Socket listeners
    const handleNewMessage = (message) => {
      console.log("📩 New message in ChatContext:", message);
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    };

    socketService.registerListener("new-message", handleNewMessage);

    return () => {
      socketService.removeListener("new-message");
    };
  }, [userId]);

  // ✅ SELECT CONVERSATION
  const selectConversation = (conv) => {
    console.log("🎯 Selecting conversation:", conv);
    console.log("   Other user:", conv.otherUserId);
    console.log("   Other name:", conv.otherUserName);
    
    setSelectedConversation(conv);
    localStorage.setItem("selectedConversation", JSON.stringify(conv));
  };

  // ✅ Restore selected conversation on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedConversation");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("🔄 Restoring conversation:", parsed);
        setSelectedConversation(parsed);
      } catch (err) {
        console.error("Failed to parse saved conversation:", err);
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