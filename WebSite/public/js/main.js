// ============================================================
// main.js  -  Projnet client-side board logic
// ============================================================
// Responsibilities:
//  - Dark mode toggle (persisted in localStorage)
//  - Modal open / close helpers (used by dashboard.html and group.html)
//  - Task board: load, render, create, update, delete
//  - One-click status actions (Start, Complete, Reopen)
//  - Automatic Overdue detection based on deadline
//  - Filtering and search
//  - Global auth redirect (redirects to /index.html on 401)
// ============================================================


// -------------------------------------------------------
// Auth guard helper
// Every fetch that touches a protected endpoint runs
// through this wrapper. If the server returns 401 the
// user is sent back to the login page automatically.
// -------------------------------------------------------
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = "/index.html";
    throw new Error("Unauthorized");
  }
  return res;
}


// -------------------------------------------------------
// Dark Mode
// -------------------------------------------------------
function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  const saved  = localStorage.getItem("projnetDarkMode") === "true";

  if (saved) document.body.classList.add("dark-mode");
  if (toggle) {
    toggle.checked = saved;
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark-mode", toggle.checked);
      localStorage.setItem("projnetDarkMode", toggle.checked);
    });
  }
}


// -------------------------------------------------------
// Modal helpers
// Modals use the CSS .hidden class for visibility so there
// is no conflict with the flexbox display on .modal-overlay.
// -------------------------------------------------------
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

// Click the dark backdrop to dismiss
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.add("hidden");
  }
});


// -------------------------------------------------------
// Spinner and global error banner
// -------------------------------------------------------
function showSpinner(show) {
  const el = document.getElementById("loadingSpinner");
  if (!el) return;
  if (show) el.classList.remove("hidden");
  else      el.classList.add("hidden");
}

function showGlobalError(msg) {
  const el = document.getElementById("globalError");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 6000);
}


// -------------------------------------------------------
// Escape helper to prevent XSS when inserting user content
// -------------------------------------------------------
function esc(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function fmtDate(dateStr) {
  if (!dateStr) return "No deadline";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Check if a deadline is overdue (compared to today, at midnight)
function isOverdue(deadlineStr, status) {
  if (!deadlineStr) return false;
  if (status === "Completed") return false;  // Completed tasks are never overdue
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);
  
  return deadlineDate < today;
}


// -------------------------------------------------------
// Task Board
// -------------------------------------------------------

// Column IDs match the status strings returned by the server.
const STATUSES = ["To Do", "In Progress", "Completed", "Overdue"];

// Status transition logic
function getNextStatus(currentStatus, action) {
  switch (action) {
    case "start":
      if (currentStatus === "To Do") return "In Progress";
      if (currentStatus === "Overdue") return "In Progress";
      return currentStatus;
    case "complete":
      if (currentStatus === "In Progress") return "Completed";
      if (currentStatus === "To Do") return "Completed";
      return currentStatus;
    case "reopen":
      if (currentStatus === "Completed") return "In Progress";
      return currentStatus;
    default:
      return currentStatus;
  }
}

async function quickUpdateStatus(taskId, currentStatus, action) {
  const newStatus = getNextStatus(currentStatus, action);
  
  if (newStatus === currentStatus) return;
  
  try {
    const getRes = await apiFetch(`/tasks/${taskId}`);
    if (!getRes.ok) throw new Error("Could not fetch task details.");
    const task = await getRes.json();
    
    // Format deadline correctly - extract just YYYY-MM-DD if it exists
    let formattedDeadline = "";
    if (task.deadline) {
      if (task.deadline.includes("T")) {
        formattedDeadline = task.deadline.split("T")[0];
      } else {
        formattedDeadline = task.deadline;
      }
    }
    
    const updateRes = await apiFetch(`/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description || "",
        deadline: formattedDeadline,
        priority: task.priority || "Low",
        status: newStatus
      }),
    });
    
    const data = await updateRes.json();
    if (!updateRes.ok) throw new Error(data.error || "Could not update task status.");
    loadTasks(currentFilter());
  } catch (err) {
    if (err.message !== "Unauthorized") showGlobalError(err.message);
  }
}
function buildTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  if (isOverdue(task.deadline, task.status)) {
    card.classList.add("task-overdue");
  }
  card.dataset.taskId = task.id;

  // Format deadline with overdue indicator
  let deadlineHtml = `<span>${fmtDate(task.deadline)}</span>`;
  if (isOverdue(task.deadline, task.status)) {
    deadlineHtml = `<span class="overdue-label">⚠️ Overdue: ${fmtDate(task.deadline)}</span>`;
  }

  // Build action buttons based on current status
  let actionButtons = "";
  if (task.status === "To Do" || task.status === "Overdue") {
    actionButtons = `
      <button class="btn-status btn-start" data-action="start">▶ Start</button>
      <button class="btn-status btn-complete" data-action="complete">✓ Complete</button>
    `;
  } else if (task.status === "In Progress") {
    actionButtons = `
      <button class="btn-status btn-complete" data-action="complete">✓ Complete</button>
    `;
  } else if (task.status === "Completed") {
    actionButtons = `
      <button class="btn-status btn-reopen" data-action="reopen">↩ Reopen</button>
    `;
  }

  card.innerHTML = `
    <div class="task-title">${esc(task.title)}</div>
    <div class="task-meta">
      <span class="priority-badge priority-${esc(task.priority)}">${esc(task.priority)}</span>
      ${deadlineHtml}
    </div>
    <div class="task-actions">
      ${actionButtons}
      <button class="btn-status btn-edit" data-action="edit">✎ Edit</button>
    </div>
  `;

  // Attach event listeners to buttons
  const startBtn = card.querySelector('[data-action="start"]');
  const completeBtn = card.querySelector('[data-action="complete"]');
  const reopenBtn = card.querySelector('[data-action="reopen"]');
  const editBtn = card.querySelector('[data-action="edit"]');
  
  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      quickUpdateStatus(task.id, task.status, "start");
    });
  }
  if (completeBtn) {
    completeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      quickUpdateStatus(task.id, task.status, "complete");
    });
  }
  if (reopenBtn) {
    reopenBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      quickUpdateStatus(task.id, task.status, "reopen");
    });
  }
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(task);
    });
  }
  
  // Click on the card body (not buttons) also opens edit modal
  card.addEventListener("click", (e) => {
    if (!e.target.closest(".btn-status")) {
      openEditModal(task);
    }
  });
  
  return card;
}

function renderBoard(tasks) {
  // Clear each column's task cards
  STATUSES.forEach((status) => {
    const col = document.getElementById(`col-${status}`);
    if (col) col.innerHTML = "";
  });

  tasks.forEach((task) => {
    // Determine which column this task belongs in
    let displayStatus = task.status;
    
    // Overdue tasks go to Overdue column (unless completed)
    if (isOverdue(task.deadline, task.status) && task.status !== "Completed") {
      displayStatus = "Overdue";
    }
    
    const col = document.getElementById(`col-${displayStatus}`);
    if (!col) return;

    const card = buildTaskCard(task);
    col.appendChild(card);
  });
}

async function loadTasks(filter = {}) {
  showSpinner(true);
  try {
    const params = new URLSearchParams(filter);
    const res    = await apiFetch(`/tasks?${params.toString()}`);
    if (!res.ok)  throw new Error("Failed to load tasks.");
    let tasks  = await res.json();
    
    // Auto-mark overdue tasks (server-side status update)
    // This ensures the database status stays in sync
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let needsUpdate = false;
    
    for (const task of tasks) {
      if (task.status !== "Completed" && task.deadline) {
        const deadlineDate = new Date(task.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        if (deadlineDate < today && task.status !== "Overdue") {
          // Update task status to Overdue in database
          await apiFetch(`/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Overdue" }),
          }).catch(() => {}); // silent fail - will catch on next refresh
          task.status = "Overdue";
          needsUpdate = true;
        }
      }
    }
    
    // If we updated any tasks, reload to get fresh data
    if (needsUpdate) {
      const res2 = await apiFetch(`/tasks?${params.toString()}`);
      tasks = await res2.json();
    }
    
    renderBoard(tasks);
  } catch (err) {
    if (err.message !== "Unauthorized") showGlobalError(err.message);
  } finally {
    showSpinner(false);
  }
}

function openEditModal(task) {
  document.getElementById("editTaskId").value    = task.id;
  document.getElementById("editTitle").value     = task.title;
  document.getElementById("editDesc").value      = task.description || "";
  document.getElementById("editDeadline").value  = task.deadline ? task.deadline.substring(0, 10) : "";
  document.getElementById("editPriority").value  = task.priority || "Low";
  document.getElementById("editStatus").value    = task.status   || "To Do";
  openModal("editTaskModal");
}

async function createTask(body) {
  const errEl = document.getElementById("newTaskError");
  errEl.classList.add("hidden");
  try {
    const res  = await apiFetch("/tasks", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not create task.");
    closeModal("newTaskModal");
    document.getElementById("newTaskForm").reset();
    loadTasks(currentFilter());
  } catch (err) {
    if (err.message === "Unauthorized") return;
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
}

async function updateTask(taskId, body) {
  const errEl = document.getElementById("editTaskError");
  errEl.classList.add("hidden");
  try {
    const res  = await apiFetch(`/tasks/${taskId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update task.");
    closeModal("editTaskModal");
    loadTasks(currentFilter());
  } catch (err) {
    if (err.message === "Unauthorized") return;
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  }
}

async function deleteTask(taskId) {
  if (!window.confirm("Delete this task? This cannot be undone.")) return;
  try {
    const res  = await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not delete task.");
    closeModal("editTaskModal");
    loadTasks(currentFilter());
  } catch (err) {
    if (err.message === "Unauthorized") return;
    showGlobalError(err.message);
  }
}

function currentFilter() {
  const filter = {};
  const status   = document.getElementById("filterStatus");
  const priority = document.getElementById("filterPriority");
  const search   = document.getElementById("searchInput");
  if (status   && status.value)         filter.status   = status.value;
  if (priority && priority.value)       filter.priority = priority.value;
  if (search   && search.value.trim())  filter.search   = search.value.trim();
  return filter;
}

function initFilters() {
  ["filterStatus", "filterPriority"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => loadTasks(currentFilter()));
  });
  const search = document.getElementById("searchInput");
  if (search) search.addEventListener("input", () => loadTasks(currentFilter()));
}


// -------------------------------------------------------
// DOMContentLoaded - wire up everything
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();

  // Board page setup
  if (document.getElementById("col-To Do")) {
    loadTasks();
    initFilters();

    // New task form
    document.getElementById("newTaskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      createTask({
        title:       document.getElementById("newTitle").value.trim(),
        description: document.getElementById("newDesc").value.trim(),
        deadline:    document.getElementById("newDeadline").value,
        priority:    document.getElementById("newPriority").value,
        status:      "To Do",
      });
    });

    // Edit task form
    document.getElementById("editTaskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const taskId = document.getElementById("editTaskId").value;
      updateTask(taskId, {
        title:       document.getElementById("editTitle").value.trim(),
        description: document.getElementById("editDesc").value.trim(),
        deadline:    document.getElementById("editDeadline").value,
        priority:    document.getElementById("editPriority").value,
        status:      document.getElementById("editStatus").value,
      });
    });

    // Delete button inside edit modal
    document.getElementById("deleteTaskBtn").addEventListener("click", () => {
      const taskId = document.getElementById("editTaskId").value;
      deleteTask(taskId);
    });
  }

  // Logout button (present on all protected pages)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/auth/logout", { method: "POST" });
      window.location.href = "/index.html";
    });
  }
});