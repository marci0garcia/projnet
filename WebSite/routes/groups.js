// ============================================================
// routes/groups.js
// Paths: GET/POST /groups    POST /groups/:id/members
// ============================================================

const express         = require("express");
const router          = express.Router();
const groupController = require("../controllers/groupController");

router.get("/",              groupController.getGroups);
router.post("/",             groupController.createGroup);
router.post("/:id/members",  groupController.addMember);

module.exports = router;
