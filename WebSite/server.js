// ============================================================
// server.js  -  Projnet application entry point
// ============================================================
// Starts the Express HTTP server and the Socket.io WebSocket
// server for real-time group chat.
//
// Key decisions reflected here:
//  - express-socket.io-session shares the same Express session
//    store with Socket.io, so socket handlers can read
//    socket.handshake.session.userId without any extra auth step.
//  - Messages are persisted to the database inside the socket
//    handler before being broadcast.
//  - socket.to(room).emit() is used instead of io.to(room).emit()
//    so the broadcast excludes the sender; the sender's own
//    message is already shown by the optimistic UI in chat.js.
//  - All protected HTTP routes are guarded by requireAuth.
//  - Static files are served from WebSite/public/, so the
//    browser accesses HTML pages at /index.html, /dashboard.html
//    etc., and assets at /css/style.css, /js/main.js etc.
// ============================================================

require("dotenv").config();

const express        = require("express");
const http           = require("http");
const path           = require("path");
const session        = require("express-session");
const { Server }     = require("socket.io");
const sharedsession  = require("express-socket.io-session");

const db = require("./db");

// Route modules
const authRoutes     = require("./routes/auth");
const taskRoutes     = require("./routes/tasks");
const groupRoutes    = require("./routes/groups");
const messageRoutes  = require("./routes/messages");
const userRoutes     = require("./routes/users");

// Middleware
const requireAuth    = require("./middleware/requireAuth");

// -------------------------------------------------------
// App and server setup
// -------------------------------------------------------
const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer);

const PORT = process.env.PORT || 3000;

// -------------------------------------------------------
// Session configuration
// Declared as a variable so it can be shared with Socket.io
// -------------------------------------------------------
const sessionMiddleware = session({
  secret:            process.env.SESSION_SECRET || "dev_secret_change_me",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   false,          // Set true in production behind HTTPS
    maxAge:   1000 * 60 * 60 * 4,  // 4 hours
  },
});

// -------------------------------------------------------
// Global Express middleware
// -------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Serve everything inside WebSite/public/ as static files.
// /index.html      -> public/index.html
// /css/style.css   -> public/css/style.css
// /js/main.js      -> public/js/main.js
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
// HTTP Routes
// -------------------------------------------------------

// Auth routes are public (no session required)
app.use("/auth", authRoutes);

// All other routes require an active login session
app.use("/tasks",    requireAuth, taskRoutes);
app.use("/groups",   requireAuth, groupRoutes);
app.use("/messages", requireAuth, messageRoutes);
app.use("/users",    requireAuth, userRoutes);

// Root URL serves the login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------------------------------------
// Share the Express session with Socket.io
// This gives socket handlers access to socket.handshake.session
// -------------------------------------------------------
io.use(sharedsession(sessionMiddleware, { autoSave: true }));

// -------------------------------------------------------
// Socket.io - Real-Time Chat
// -------------------------------------------------------
io.on("connection", (socket) => {
  const session = socket.handshake.session;

  // Reject socket connections from unauthenticated clients
  if (!session || !session.userId) {
    socket.disconnect(true);
    return;
  }

  const userId   = session.userId;
  const username = session.username;

  // Client joins a group chat room
  socket.on("joinRoom", (groupId) => {
    // Leave any previously joined room first
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
    rooms.forEach((r) => socket.leave(r));

    socket.join(`group_${groupId}`);
  });

  // Client sends a message
  socket.on("sendMessage", async (data) => {
    // data = { groupId, content }
    const { groupId, content } = data;

    if (!groupId || !content || !content.trim()) return;

    const trimmed = content.trim();

    try {
      // Persist to database before broadcasting
      const [result] = await db.query(
        "INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)",
        [groupId, userId, trimmed]
      );

      const messagePayload = {
        id:         result.insertId,
        senderName: username,
        content:    trimmed,
        sentAt:     new Date().toISOString(),
      };

      // Broadcast to everyone in the room EXCEPT the sender.
      // The sender already sees their message via optimistic UI in chat.js.
      socket.to(`group_${groupId}`).emit("receiveMessage", messagePayload);

    } catch (err) {
      console.error("[Socket] Error saving message:", err.message);
      socket.emit("messageError", { error: "Message could not be saved." });
    }
  });

  socket.on("disconnect", () => {
    // Cleanup is automatic when socket disconnects
  });
});

// -------------------------------------------------------
// Start server
// -------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`[Server] Projnet running at http://localhost:${PORT}`);
});
