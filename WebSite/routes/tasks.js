// ============================================================
// routes/tasks.js
// Paths: GET/POST /tasks    GET/PUT/DELETE /tasks/:id
// All routes are guarded by requireAuth in server.js
// ============================================================

const express        = require("express");
const router         = express.Router();
const taskController = require("../controllers/taskController");

router.get("/",      taskController.getTasks);
router.post("/",     taskController.createTask);
router.get("/:id",   taskController.getTaskById);
router.put("/:id",   taskController.updateTask);
router.delete("/:id",taskController.deleteTask);

module.exports = router;