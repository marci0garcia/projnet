// ============================================================
// routes/users.js
// Paths: GET/PUT /users/profile    PUT /users/password
// ============================================================

const express        = require("express");
const router         = express.Router();
const userController = require("../controllers/userController");

router.get("/profile",   userController.getProfile);
router.put("/profile",   userController.updateProfile);
router.put("/password",  userController.changePassword);

module.exports = router;
