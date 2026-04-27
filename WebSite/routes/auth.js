// ============================================================
// routes/auth.js
// Paths: /auth/register   /auth/login   /auth/logout
// ============================================================

const express        = require("express");
const router         = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login",    authController.login);
router.post("/logout",   authController.logout);

module.exports = router;
