// ============================================================
// controllers/groupController.js
// ============================================================
// NOTE: "groups" is a reserved word in MySQL 8+.
// All references to the groups table are wrapped in backticks.
// require("../db") resolves to WebSite/db.js  ✓
// ============================================================

const db = require("../db");

// -------------------------------------------------------
// GET /groups
// Returns all groups the current user belongs to.
// -------------------------------------------------------
async function getGroups(req, res) {
  const userId = req.session.userId;

  try {
    const [groups] = await db.query(
      `SELECT g.id, g.name, g.created_at
       FROM \`groups\` g
       INNER JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = ?
       ORDER BY g.created_at ASC`,
      [userId]
    );
    return res.status(200).json(groups);
  } catch (err) {
    console.error("[Groups] getGroups error:", err.message);
    return res.status(500).json({ error: "Could not retrieve groups." });
  }
}

// -------------------------------------------------------
// POST /groups
// Creates a new group and adds the creator as its first member.
// -------------------------------------------------------
async function createGroup(req, res) {
  const userId = req.session.userId;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Group name is required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO `groups` (name) VALUES (?)",
      [name.trim()]
    );
    const groupId = result.insertId;

    // Automatically add the creator as a member
    await db.query(
      "INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)",
      [userId, groupId]
    );

    return res.status(201).json({ id: groupId, name: name.trim() });
  } catch (err) {
    console.error("[Groups] createGroup error:", err.message);
    return res.status(500).json({ error: "Could not create group." });
  }
}

// -------------------------------------------------------
// POST /groups/:id/members
// Adds another registered user to the group by email.
// -------------------------------------------------------
async function addMember(req, res) {
  const groupId = parseInt(req.params.id, 10);
  const { email } = req.body;

  if (!email || email.trim().length === 0) {
    return res.status(400).json({ error: "Member email is required." });
  }

  try {
    // Look up the target user
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "No Projnet account found for that email." });
    }

    const memberId = users[0].id;

    // Prevent duplicate membership
    const [existing] = await db.query(
      "SELECT id FROM user_groups WHERE user_id = ? AND group_id = ?",
      [memberId, groupId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "That user is already a member of this group." });
    }

    await db.query(
      "INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)",
      [memberId, groupId]
    );

    return res.status(200).json({ message: "Member added successfully." });
  } catch (err) {
    console.error("[Groups] addMember error:", err.message);
    return res.status(500).json({ error: "Could not add member." });
  }
}

module.exports = { getGroups, createGroup, addMember };
