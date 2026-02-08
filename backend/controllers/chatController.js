const { getDatabase } = require("../config/firebase");

/**
 * GET /api/chat/conversations?userId=xxx
 * Lấy danh sách conversation cho sidebar
 */
const getConversations = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    console.log("📡 getConversations for userId:", userId);

    const db = getDatabase();
    const snapshot = await db.ref("messages").once("value");
    const data = snapshot.val() || {};

    console.log("📦 Total conversations in DB:", Object.keys(data).length);

    const conversations = Object.entries(data)
      .filter(([conversationId]) => {
        // ✅ Check if userId is in the conversation ID
        const isMatch = conversationId.includes(userId);
        console.log(`   Checking ${conversationId}: ${isMatch}`);
        return isMatch;
      })
      .map(([conversationId, messages]) => {
        const msgList = Object.values(messages || []);

        if (msgList.length === 0) {
          console.log(`   ⚠️ No messages in ${conversationId}`);
          return null;
        }

        const lastMessage = msgList.sort(
          (a, b) => b.timestamp - a.timestamp
        )[0];

        // ✅ CRITICAL FIX: Proper parsing of conversation ID
        console.log(`   📋 Parsing conversation: ${conversationId}`);
        
        // Split by underscore
        const parts = conversationId.split("_");
        console.log(`      Parts: [${parts.join(", ")}]`);
        
        let otherUserId;
        
        // ✅ Handle different ID formats
        if (parts.length === 2) {
          // Simple case: "id1_id2"
          otherUserId = parts[0] === userId ? parts[1] : parts[0];
        } else if (parts.length >= 3) {
          // Employee ID case: "phoneNumber_emp_timestamp_hash"
          // Need to reconstruct the full employee ID
          
          // Check if first part is userId (phone number)
          if (parts[0] === userId) {
            // User is first, other user is the rest
            otherUserId = parts.slice(1).join("_");
          } else {
            // User is in the rest, first part is other user
            const possibleEmployeeId = parts.slice(1).join("_");
            if (possibleEmployeeId.includes(userId)) {
              // userId is the employee ID
              otherUserId = parts[0];
            } else {
              // userId is first part
              otherUserId = possibleEmployeeId;
            }
          }
        } else {
          console.error(`   ❌ Unexpected conversation ID format: ${conversationId}`);
          otherUserId = conversationId.replace(userId, "").replace("_", "");
        }

        console.log(`      ✅ Extracted otherUserId: ${otherUserId}`);

        return {
          id: conversationId,
          otherUserId, // ✅ Full ID
          lastMessage,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

    console.log(`✅ Returning ${conversations.length} conversations`);
    conversations.forEach(conv => {
      console.log(`   - ${conv.id} (other: ${conv.otherUserId})`);
    });

    res.json({
      success: true,
      conversations,
    });
  } catch (err) {
    console.error("❌ getConversations error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/chat/messages/:conversationId
 * Lấy lịch sử tin nhắn
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: "conversationId is required",
      });
    }

    console.log("📨 getMessages for conversation:", conversationId);

    const db = getDatabase();
    const snapshot = await db
      .ref(`messages/${conversationId}`)
      .once("value");

    const messages = snapshot.val() || {};
    const messageArray = Object.values(messages).sort(
      (a, b) => a.timestamp - b.timestamp
    );

    console.log(`✅ Returning ${messageArray.length} messages`);

    res.json({
      success: true,
      messages: messageArray,
    });
  } catch (err) {
    console.error("❌ getMessages error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
};