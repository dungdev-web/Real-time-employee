import React from "react";
import { useChat } from "../../context/ChatContext";
import Chat from "../../components/Chat";
import "../../css/MessagesPage.scss";

function EmployeeMessage() {
  const { selectedConversation } = useChat();

  const employeeId = localStorage.getItem("employeeId");
  
  // ✅ FIX: Get ownerId from selectedConversation
  const ownerId = selectedConversation?.otherUserId;
  const ownerName =  "Manager";

  console.log("🔍 EmployeeMessage Debug:", {
    employeeId,
    ownerId,
    selectedConversation
  });

  if (!selectedConversation) {
    return (
      <div className="messages-page">
        <div className="no-conversation-selected">
          <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>No conversation selected</h2>
          <p>Select a conversation from the list to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Validate IDs before rendering Chat
  if (!employeeId || !ownerId) {
    console.error("❌ Missing IDs:", { employeeId, ownerId });
    return (
      <div className="error-state">
        <p>Error: Missing user information. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <Chat
      conversationId={selectedConversation.id}
      currentUserId={employeeId}
      currentUserType="employee"
      otherUserId={ownerId}
      otherUserName={ownerName}
    />
  );
}

export default EmployeeMessage;