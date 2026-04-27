// ============================================================
// routes/messages.js
// Path: GET /messages/:groupId
// Message saves happen inside the Socket.io handler in server.js
// (not through HTTP) because the real-time broadcast and the
// database write need to happen in the same transaction.
// ============================================================

const express            = require("express");
const router             = express.Router();
const messageController  = require("../controllers/messageController");

router.get("/:groupId", messageController.getMessages);

module.exports = router;
