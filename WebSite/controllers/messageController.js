// ============================================================
// controllers/messageController.js
// ============================================================
// Only handles reading message history via HTTP GET.
// Writing messages is done inside the Socket.io handler in
// server.js so that the DB write and broadcast happen together.
// require("../db") resolves to WebSite/db.js  ✓
// ============================================================

const db = require("../db");

// -------------------------------------------------------
// GET /messages/:groupId
// Returns up to 200 messages in ascending time order so
// the oldest appear at the top of the chat view.
// Only accessible to members of the requested group.
// -------------------------------------------------------
async function getMessages(req, res) {
  const userId  = req.session.userId;
  const groupId = parseInt(req.params.groupId, 10);

  if (isNaN(groupId)) {
    return res.status(400).json({ error: "Invalid group ID." });
  }

  try {
    // Membership check before returning any messages
    const [membership] = await db.query(
      "SELECT id FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, groupId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ error: "You are not a member of this group." });
    }

    const [messages] = await db.query(
      `SELECT m.id, m.content, m.sent_at AS sentAt, u.username AS senderName
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.group_id = ?
       ORDER BY m.sent_at ASC
       LIMIT 200`,
      [groupId]
    );

    return res.status(200).json(messages);
  } catch (err) {
    console.error("[Messages] getMessages error:", err.message);
    return res.status(500).json({ error: "Could not retrieve messages." });
  }
}

module.exports = { getMessages };
