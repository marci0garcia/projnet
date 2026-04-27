// ============================================================
// controllers/authController.js
// ============================================================
// require("../db") resolves to WebSite/db.js  ✓
// ============================================================

const bcrypt = require("bcrypt");
const db     = require("../db");
const { isNonEmpty, isValidEmail, isValidPassword } = require("../middleware/validate");

const SALT_ROUNDS = 12;

// -------------------------------------------------------
// POST /auth/register
// -------------------------------------------------------
async function register(req, res) {
  const { username, email, password } = req.body;

  if (!isNonEmpty(username)) {
    return res.status(400).json({ error: "Username is required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "A valid email address is required." });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username.trim(), email.trim(), passwordHash]
    );

    req.session.userId   = result.insertId;
    req.session.username = username.trim();

    return res.status(201).json({ message: "Account created.", userId: result.insertId });
  } catch (err) {
    console.error("[Auth] register error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}

// -------------------------------------------------------
// POST /auth/login
// -------------------------------------------------------
async function login(req, res) {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isNonEmpty(password)) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, username, password_hash FROM users WHERE email = ?",
      [email.trim()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    req.session.userId   = user.id;
    req.session.username = user.username;

    return res.status(200).json({ message: "Login successful." });
  } catch (err) {
    console.error("[Auth] login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}

// -------------------------------------------------------
// POST /auth/logout
// -------------------------------------------------------
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out." });
  });
}

module.exports = { register, login, logout };
