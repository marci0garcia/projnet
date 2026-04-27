// ============================================================
// chat.js  -  Projnet real-time chat (Socket.io client)
// ============================================================
// Loaded on group.html after main.js and socket.io.js.
// Exposes:  initChat(userId, username)
//           loadGroups()           -- called by group.html inline script
//           currentGroupId         -- read by group.html invite handler
//
// Duplicate-message fix:
//   The sender appends their own message immediately (optimistic UI)
//   when they click Send. The server uses socket.to(room) which
//   excludes the sender when broadcasting, so the sender never
//   receives their own message back via "receiveMessage". This
//   means each message appears exactly once for everyone.
// ============================================================

let socket        = null;
let currentUserId = null;
let currentUserName = null;

// Exposed so group.html inline script can read it
var currentGroupId = null;  // var (not let/const) so it is accessible globally


// -------------------------------------------------------
// initChat  -  called by group.html after fetching profile
// -------------------------------------------------------
function initChat(userId, userName) {
  currentUserId   = userId;
  currentUserName = userName;

  socket = io();

  socket.on("connect", () => {
    console.log("[Chat] Socket connected:", socket.id);
  });

  // Incoming message from another group member (not the sender)
  socket.on("receiveMessage", (data) => {
    appendMessage(data.senderName, data.content, data.sentAt);
    scrollToBottom();
  });

  // Server-side error saving a message
  socket.on("messageError", (data) => {
    console.error("[Chat] Message error:", data.error);
  });

  socket.on("disconnect", () => {
    console.log("[Chat] Socket disconnected.");
  });

  // Wire up the Send button and Enter key
  const sendBtn  = document.getElementById("chatSendBtn");
  const input    = document.getElementById("chatInput");

  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Load initial group list
  loadGroups();
}


// -------------------------------------------------------
// loadGroups  -  fetch group list and render sidebar
// -------------------------------------------------------
async function loadGroups() {
  try {
    const res    = await fetch("/groups");
    if (res.status === 401) { window.location.href = "/index.html"; return; }
    if (!res.ok) throw new Error("Could not load groups.");
    const groups = await res.json();
    renderGroupList(groups);
  } catch (err) {
    console.error("[Chat] loadGroups:", err.message);
  }
}

function renderGroupList(groups) {
  const list = document.getElementById("groupList");
  if (!list) return;

  list.innerHTML = "";

  if (groups.length === 0) {
    list.innerHTML = '<p style="font-size:0.85rem; color:var(--color-text-muted);">No groups yet.</p>';
    return;
  }

  groups.forEach((group) => {
    const item       = document.createElement("div");
    item.className   = "group-item";
    item.textContent = group.name;
    item.dataset.groupId = group.id;
    item.addEventListener("click", () => joinGroup(group.id, group.name));
    list.appendChild(item);
  });

  // Auto-join the first group on page load
  if (groups.length > 0) {
    joinGroup(groups[0].id, groups[0].name);
  }
}


// -------------------------------------------------------
// joinGroup  -  switch to a different group chat room
// -------------------------------------------------------
function joinGroup(groupId, groupName) {
  if (currentGroupId === groupId) return;  // already in this room

  currentGroupId = groupId;

  // Update sidebar highlight
  document.querySelectorAll(".group-item").forEach((el) => {
    el.classList.toggle("active", parseInt(el.dataset.groupId, 10) === groupId);
  });

  // Update header name
  const header = document.getElementById("chatGroupName");
  if (header) header.textContent = groupName;

  // Enable input controls
  const input   = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const invite  = document.getElementById("inviteBtn");
  if (input)   input.disabled   = false;
  if (sendBtn) sendBtn.disabled = false;
  if (invite)  invite.disabled  = false;

  // Clear previous messages
  const msgArea = document.getElementById("chatMessages");
  if (msgArea) msgArea.innerHTML = "";

  // Tell the server to join this Socket.io room
  if (socket) socket.emit("joinRoom", groupId);

  // Load history from database
  loadMessageHistory(groupId);
}


// -------------------------------------------------------
// loadMessageHistory  -  fetch saved messages via HTTP
// -------------------------------------------------------
async function loadMessageHistory(groupId) {
  try {
    const res      = await fetch(`/messages/${groupId}`);
    if (res.status === 401) { window.location.href = "/index.html"; return; }
    if (!res.ok) throw new Error("Could not load messages.");
    const messages = await res.json();

    messages.forEach((msg) => {
      appendMessage(msg.senderName, msg.content, msg.sentAt);
    });
    scrollToBottom();
  } catch (err) {
    console.error("[Chat] loadMessageHistory:", err.message);
  }
}


// -------------------------------------------------------
// sendMessage  -  called on Send click or Enter key
// -------------------------------------------------------
function sendMessage() {
  const input = document.getElementById("chatInput");
  if (!input || !input.value.trim() || !currentGroupId || !socket) return;

  const content = input.value.trim();
  input.value   = "";

  // Emit to server. The server persists to DB and broadcasts
  // to everyone in the room EXCEPT this socket.
  socket.emit("sendMessage", {
    groupId: currentGroupId,
    content: content,
  });

  // Optimistic UI: show the sender's own message immediately.
  // The server does NOT echo it back to the sender, so this
  // is the only place the sender sees their own message.
  appendMessage(currentUserName, content, new Date().toISOString());
  scrollToBottom();
}


// -------------------------------------------------------
// appendMessage  -  create and insert a message bubble
// -------------------------------------------------------
function appendMessage(senderName, content, timestamp) {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  // Remove the placeholder text if present
  const placeholder = container.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();

  const time = new Date(timestamp).toLocaleTimeString(undefined, {
    hour:   "2-digit",
    minute: "2-digit",
  });

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.innerHTML = `
    <div class="msg-sender">${escChat(senderName)}</div>
    <div class="msg-content">${escChat(content)}</div>
    <div class="msg-time">${time}</div>
  `;

  container.appendChild(bubble);
}


// -------------------------------------------------------
// Utilities
// -------------------------------------------------------
function scrollToBottom() {
  const el = document.getElementById("chatMessages");
  if (el) el.scrollTop = el.scrollHeight;
}

function escChat(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}
