// ===== ADD THIS TO OwnerMessage.jsx =====

import React, { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import Chat from "../../components/Chat";
import "../../css/MessagesPage.scss";

function OwnerMessage() {
  const { selectedConversation } = useChat();

  const ownerId = localStorage.getItem("ownerId");
  const employeeId = selectedConversation?.otherUserId;

  // ✅ CRITICAL DEBUG LOGGING
  useEffect(() => {
    console.log("🔍 OwnerMessage DEBUG:");
    console.log("   selectedConversation:", JSON.stringify(selectedConversation, null, 2));
    console.log("   ownerId:", ownerId);
    console.log("   employeeId:", employeeId);
    console.log("   employeeId type:", typeof employeeId);
    console.log("   employeeId length:", employeeId?.length);
  }, [selectedConversation, ownerId, employeeId]);

  if (!selectedConversation) {
    return (
      <div className="empty-chat-state">
        <div className="empty-state-content">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>No conversation selected</h2>
          <p>Select a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  if (!ownerId || !employeeId) {
    console.error("❌ Missing IDs:", { ownerId, employeeId });
    return (
      <div className="error-state">
        <p>Error: Missing user information</p>
        <pre>{JSON.stringify({ ownerId, employeeId, selectedConversation }, null, 2)}</pre>
      </div>
    );
  }

  // ✅ EXTRA VALIDATION: Check if employeeId looks correct
  if (!employeeId.startsWith('emp_')) {
    console.error("❌ Invalid employeeId format:", employeeId);
    console.error("   Expected: emp_XXXXXXXXXX_XXXXXXXX");
    console.error("   Got:", employeeId);
    
    // Try to extract from conversation ID
    const conversationId = selectedConversation?.id;
    if (conversationId) {
      const [id1, id2] = conversationId.split('_');
      const correctEmployeeId = id1.startsWith('emp_') ? id1 : id2;
      
      console.log("🔧 Attempting to fix employeeId:");
      console.log("   Conversation ID:", conversationId);
      console.log("   Extracted:", correctEmployeeId);
      
      return (
        <div className="error-state">
          <h3>⚠️ Invalid Employee ID</h3>
          <p>Expected format: emp_XXXXXXXXXX_XXXXXXXX</p>
          <p>Received: {employeeId}</p>
          <p>Conversation ID: {conversationId}</p>
          <p>Trying to use: {correctEmployeeId}</p>
          <button onClick={() => window.location.reload()}>Refresh and try again</button>
        </div>
      );
    }
  }

  return (
    <Chat
      conversationId={selectedConversation.id}
      currentUserId={ownerId}
      currentUserType="owner"
      otherUserId={employeeId}
      otherUserName={selectedConversation.otherUserName || employeeId}
    />
  );
}

export default OwnerMessage;