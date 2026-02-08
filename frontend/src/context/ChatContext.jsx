import React, { createContext, useContext, useEffect, useState } from "react";
import { chatAPI } from "../services/api";
import socketService from "../lib/socket";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [employeesMap, setEmployeesMap] = useState(new Map()); // Store employee details
  
  const userType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem("ownerId");
  const employeeId = localStorage.getItem("employeeId");

  const userId = userType === "owner" ? ownerId : employeeId;

  console.log("🔍 ChatProvider initialized:", { userType, userId, ownerId, employeeId });

  // ✅ LOAD CONVERSATIONS
  useEffect(() => {
    const socket = socketService.connect();

    const loadConversations = async () => {
      try {
        console.log("📡 Loading conversations for userId:", userId);
        
        const res = await chatAPI.getConversations(userId);
        console.log("📨 Conversations response:", res);
        
        const convs = res.conversations || [];
        
        // ✅ For owner: Load employee details to get names
        if (userType === "owner") {
          const employeeDetailsPromises = convs.map(async (conv) => {
            try {
              // Assuming you have an API to get employee by ID
              // If not, you'll need to add this endpoint
              const empId = conv.otherUserId;
              
              // Store employee ID for now (you can enhance this to fetch names)
              return { id: empId, name: empId }; // TODO: Replace with actual API call
            } catch (err) {
              console.error("Failed to load employee:", err);
              return { id: conv.otherUserId, name: conv.otherUserId };
            }
          });
          
          const employeeDetails = await Promise.all(employeeDetailsPromises);
          const empMap = new Map();
          employeeDetails.forEach(emp => {
            empMap.set(emp.id, emp.name);
          });
          setEmployeesMap(empMap);
        }
        
        setConversations(convs);
        console.log("✅ Loaded conversations:", convs.length);
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
  }, [userId, userType]);

  // ✅ SELECT CONVERSATION
  const selectConversation = (conv) => {
    console.log("🎯 Selecting conversation:", conv);
    
    // ✅ Add employee name if available
    const enrichedConv = {
      ...conv,
      otherUserName: employeesMap.get(conv.otherUserId) || conv.otherUserId
    };
    
    setSelectedConversation(enrichedConv);
    localStorage.setItem("selectedConversation", JSON.stringify(enrichedConv));
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