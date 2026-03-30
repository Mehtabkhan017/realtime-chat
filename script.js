// ─────────────────────────────────────────────
//  script.js  –  LiveChat Client
// ─────────────────────────────────────────────

// ── DOM References ────────────────────────────
const modalOverlay  = document.getElementById("modal-overlay");
const usernameInput = document.getElementById("username-input");
const joinBtn       = document.getElementById("join-btn");

const app           = document.getElementById("app");
const messagesDiv   = document.getElementById("messages");
const msgInput      = document.getElementById("msg-input");
const sendBtn       = document.getElementById("send-btn");
const userListEl    = document.getElementById("user-list");
const onlineCount   = document.getElementById("online-count");

// ── State ─────────────────────────────────────
let myUsername = "";
let mySocketId = "";

// ── Connect to Socket.io server ───────────────
// Connect lazily — only after joining
let socket;

// ── Join Flow ─────────────────────────────────
function joinChat() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.focus();
    usernameInput.style.borderColor = "#f87171"; // red flash
    setTimeout(() => (usernameInput.style.borderColor = ""), 1000);
    return;
  }

  myUsername = name;

  // Connect to the server (same host/port)
  socket = io();

  // Save our own socket ID when we connect
  socket.on("connect", () => {
    mySocketId = socket.id;
    // Register username with server
    socket.emit("set_username", myUsername);
  });

  // Hide modal, show app
  modalOverlay.classList.add("hidden");
  app.classList.remove("hidden");

  // Focus the message input
  msgInput.focus();

  // ── Socket Event Listeners ─────────────────

  // Incoming chat message
  socket.on("receive_message", (data) => {
    const isMine = data.socketId === mySocketId;
    appendMessage(data.sender, data.text, data.time, isMine);
  });

  // System notification (join / leave)
  socket.on("system_message", (data) => {
    appendSystemMessage(data.text, data.time);
  });

  // Updated online user list
  socket.on("user_list", (users) => {
    renderUserList(users);
  });
}

// Allow pressing Enter to join
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") joinChat();
});
joinBtn.addEventListener("click", joinChat);

// ── Send a Message ────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !socket) return;

  socket.emit("send_message", text);
  msgInput.value = "";
  msgInput.focus();
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) sendMessage();
});

// ── Render a Chat Bubble ──────────────────────
function appendMessage(sender, text, time, isMine) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg-wrapper ${isMine ? "sent" : "recv"}`;

  // Sender name (hide for own messages or show "You")
  const senderEl = document.createElement("div");
  senderEl.className = "msg-sender";
  senderEl.textContent = isMine ? "You" : sender;

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  // Timestamp
  const timeEl = document.createElement("div");
  timeEl.className = "msg-time";
  timeEl.textContent = time;

  wrapper.appendChild(senderEl);
  wrapper.appendChild(bubble);
  wrapper.appendChild(timeEl);
  messagesDiv.appendChild(wrapper);

  scrollToBottom();
}

// ── Render a System Message ───────────────────
function appendSystemMessage(text) {
  const el = document.createElement("div");
  el.className = "sys-msg";
  el.textContent = text;
  messagesDiv.appendChild(el);
  scrollToBottom();
}

// ── Render Online User List ───────────────────
function renderUserList(users) {
  userListEl.innerHTML = "";
  users.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    if (name === myUsername) {
      li.style.color = "var(--accent)";
      li.title = "You";
    }
    userListEl.appendChild(li);
  });

  // Update online count in header
  onlineCount.textContent = `${users.length} online`;
}

// ── Auto-scroll to Bottom ─────────────────────
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
