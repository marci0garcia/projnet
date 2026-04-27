// ============================================================
// controllers/taskController.js
// ============================================================
// require("../db") resolves to WebSite/db.js  ✓
// ============================================================

const db = require("../db");

const VALID_STATUSES   = ["To Do", "In Progress", "Completed", "Overdue"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

// -------------------------------------------------------
// GET /tasks
// Optional query params: status, priority, search
// Returns tasks belonging to the logged-in user only.
// -------------------------------------------------------
async function getTasks(req, res) {
  const userId = req.session.userId;
  const { status, priority, search } = req.query;

  let sql    = "SELECT * FROM tasks WHERE user_id = ?";
  const params = [userId];

  if (status && VALID_STATUSES.includes(status)) {
    sql += " AND status = ?";
    params.push(status);
  }

  if (priority && VALID_PRIORITIES.includes(priority)) {
    sql += " AND priority = ?";
    params.push(priority);
  }

  if (search && search.trim().length > 0) {
    sql += " AND (title LIKE ? OR description LIKE ?)";
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  sql += " ORDER BY created_at DESC";

  try {
    const [tasks] = await db.query(sql, params);
    return res.status(200).json(tasks);
  } catch (err) {
    console.error("[Tasks] getTasks error:", err.message);
    return res.status(500).json({ error: "Could not retrieve tasks." });
  }
}

// -------------------------------------------------------
// POST /tasks
// -------------------------------------------------------
async function createTask(req, res) {
  const userId = req.session.userId;
  const { title, description, deadline, priority, status } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const safeStatus   = VALID_STATUSES.includes(status)     ? status   : "To Do";
  const safePriority = VALID_PRIORITIES.includes(priority)  ? priority : "Low";
  // Handle deadline formatting - strip time part if present
let safeDeadline = null;
if (deadline && deadline.trim() !== "") {
  let dateStr = deadline.trim();
  if (dateStr.includes("T")) {
    dateStr = dateStr.split("T")[0];
  }
  safeDeadline = dateStr;
}

  try {
    const [result] = await db.query(
      `INSERT INTO tasks (user_id, title, description, deadline, priority, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title.trim(), description || null, safeDeadline, safePriority, safeStatus]
    );

    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[Tasks] createTask error:", err.message);
    return res.status(500).json({ error: "Could not create task." });
  }
}

// -------------------------------------------------------
// PUT /tasks/:id
// -------------------------------------------------------
async function updateTask(req, res) {
  const userId = req.session.userId;
  const taskId = parseInt(req.params.id, 10);
  const { title, description, deadline, priority, status } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Task title is required." });
  }

  try {
    // Ownership check - users can only edit their own tasks
    const [owned] = await db.query(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId]
    );
    if (owned.length === 0) {
      return res.status(404).json({ error: "Task not found or access denied." });
    }

    const safeStatus   = VALID_STATUSES.includes(status)    ? status   : "To Do";
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : "Low";
    const safeDeadline = deadline && deadline.trim() !== ""  ? deadline : null;

    await db.query(
      `UPDATE tasks
       SET title = ?, description = ?, deadline = ?, priority = ?, status = ?
       WHERE id = ?`,
      [title.trim(), description || null, safeDeadline, safePriority, safeStatus, taskId]
    );

    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[Tasks] updateTask error:", err.message);
    return res.status(500).json({ error: "Could not update task." });
  }
}

// -------------------------------------------------------
// DELETE /tasks/:id
// -------------------------------------------------------
async function deleteTask(req, res) {
  const userId = req.session.userId;
  const taskId = parseInt(req.params.id, 10);

  try {
    const [owned] = await db.query(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId]
    );
    if (owned.length === 0) {
      return res.status(404).json({ error: "Task not found or access denied." });
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [taskId]);
    return res.status(200).json({ message: "Task deleted." });
  } catch (err) {
    console.error("[Tasks] deleteTask error:", err.message);
    return res.status(500).json({ error: "Could not delete task." });
  }
}

// -------------------------------------------------------
// GET /tasks/:id
// Fetch a single task by ID (with ownership check)
// -------------------------------------------------------
async function getTaskById(req, res) {
  const userId = req.session.userId;
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Task not found or access denied." });
    }
    
    return res.status(200).json(rows[0]);
  } catch (err) {
    console.error("[Tasks] getTaskById error:", err.message);
    return res.status(500).json({ error: "Could not retrieve task." });
  }
}

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
