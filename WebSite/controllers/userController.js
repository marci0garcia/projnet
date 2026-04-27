// ============================================================
// controllers/userController.js
// ============================================================
// require("../db") resolves to WebSite/db.js  ✓
// ============================================================

const bcrypt = require("bcrypt");
const db     = require("../db");
const { isNonEmpty, isValidEmail, isValidPassword } = require("../middleware/validate");

const SALT_ROUNDS = 12;

// -------------------------------------------------------
// GET /users/profile
// -------------------------------------------------------
async function getProfile(req, res) {
  const userId = req.session.userId;

  try {
    const [rows] = await db.query(
      "SELECT id, username, email, bio FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[Users] getProfile error:", err.message);
    return res.status(500).json({ error: "Could not retrieve profile." });
  }
}

// -------------------------------------------------------
// PUT /users/profile
// -------------------------------------------------------
async function updateProfile(req, res) {
  const userId = req.session.userId;
  const { username, email, bio } = req.body;

  if (!isNonEmpty(username)) {
    return res.status(400).json({ error: "Username is required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  try {
    // Ensure the new email is not taken by a different account
    const [conflict] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email.trim(), userId]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ error: "That email is already used by another account." });
    }

    await db.query(
      "UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?",
      [username.trim(), email.trim(), bio || null, userId]
    );

    // Keep session username in sync
    req.session.username = username.trim();

    return res.status(200).json({ message: "Profile updated." });
  } catch (err) {
    console.error("[Users] updateProfile error:", err.message);
    return res.status(500).json({ error: "Could not update profile." });
  }
}

// -------------------------------------------------------
// PUT /users/password
// -------------------------------------------------------
async function changePassword(req, res) {
  const userId = req.session.userId;
  const { currentPassword, newPassword } = req.body;

  if (!isNonEmpty(currentPassword) || !isNonEmpty(newPassword)) {
    return res.status(400).json({ error: "Both current and new passwords are required." });
  }
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    const [rows] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newHash, userId]
    );

    return res.status(200).json({ message: "Password changed." });
  } catch (err) {
    console.error("[Users] changePassword error:", err.message);
    return res.status(500).json({ error: "Could not change password." });
  }
}

module.exports = { getProfile, updateProfile, changePassword };
