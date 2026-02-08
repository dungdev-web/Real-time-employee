const express = require("express");
const router = express.Router();

const {
  getConversations,
  getMessages,
} = require("../controllers/chatController");

// sidebar (QUERY PARAM)
router.get("/conversations", getConversations);

// message history
router.get("/messages/:conversationId", getMessages);

module.exports = router;
