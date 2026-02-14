const { getDatabase } = require("../config/firebase");

/**
 * Helper function to get user name from database
 */
const getUserName = async (userId, db) => {
  try {
    // Check if it's an employee (starts with 'emp_')
    if (userId.startsWith("emp_")) {
      const employeeSnapshot = await db
        .ref(`employees/${userId}`)
        .once("value");
      const employee = employeeSnapshot.val();

      if (employee && employee.name) {
        return employee.name;
      }

      return "Employee"; // Fallback
    }
    // Otherwise it's an owner (phone number format)
    else {
      const ownerSnapshot = await db.ref(`owners/${userId}`).once("value");
      const owner = ownerSnapshot.val();

      if (owner) {
        return owner.name || owner.phoneNumber || "Manager";
      }

      // If no name found, try to find owner by phone
      const ownersSnapshot = await db.ref("owners").once("value");
      const owners = ownersSnapshot.val() || {};

      for (const [ownerId, ownerData] of Object.entries(owners)) {
        if (ownerData.phone === userId || ownerData.email === userId) {
          return ownerData.name || "Manager";
        }
      }

      return "Manager"; // Fallback
    }
  } catch (error) {
    console.error(`   ❌ Error getting name for ${userId}:`, error);
    return userId.startsWith("emp_") ? "Employee" : "Manager";
  }
};

/**
 * GET /api/chat/conversations?userId=xxx
 * Lấy danh sách conversation cho sidebar với tên người dùng
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
    const db = getDatabase();
    const snapshot = await db.ref("messages").once("value");
    const data = snapshot.val() || {};
    console.log("dât", data);

    const conversationsWithoutNames = Object.entries(data)
      .filter(([conversationId]) => {
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
          (a, b) => b.timestamp - a.timestamp,
        )[0];

        console.log(`   📋 Parsing conversation: ${conversationId}`);

        const parts = conversationId.split("_");
        let otherUserId;

        if (parts.length === 2) {
          otherUserId = parts[0] === userId ? parts[1] : parts[0];
        } else if (parts.length >= 3) {
          if (parts[0] === userId) {
            otherUserId = parts.slice(1).join("_");
          } else {
            const possibleEmployeeId = parts.slice(1).join("_");
            if (possibleEmployeeId.includes(userId)) {
              otherUserId = parts[0];
            } else {
              otherUserId = possibleEmployeeId;
            }
          }
        } else {
          console.error(
            `   ❌ Unexpected conversation ID format: ${conversationId}`,
          );
          otherUserId = conversationId.replace(userId, "").replace("_", "");
        }

        console.log(`      ✅ Extracted otherUserId: ${otherUserId}`);

        return {
          id: conversationId,
          otherUserId,
          lastMessage,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

    // ✅ Now fetch names for all users
    console.log(
      `🔍 Fetching names for ${conversationsWithoutNames.length} conversations...`,
    );

    const conversationsWithNames = await Promise.all(
      conversationsWithoutNames.map(async (conv) => {
        const otherUserName = await getUserName(conv.otherUserId, db);

        console.log(`   👤 ${conv.otherUserId} → ${otherUserName}`);

        return {
          ...conv,
          otherUserName, // ✅ Added user name
        };
      }),
    );

    console.log(
      `✅ Returning ${conversationsWithNames.length} conversations with names`,
    );
    conversationsWithNames.forEach((conv) => {
      console.log(`   - ${conv.id}`);
      console.log(`     Other: ${conv.otherUserId} (${conv.otherUserName})`);
    });

    res.json({
      success: true,
      conversations: conversationsWithNames,
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
    const snapshot = await db.ref(`messages/${conversationId}`).once("value");

    const messages = snapshot.val() || {};
    const messageArray = Object.values(messages).sort(
      (a, b) => a.timestamp - b.timestamp,
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
