// ─────────────────────────────────────────────
//  server.js  –  Real-time Chat Server
// ─────────────────────────────────────────────

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Fallback route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Keep track of connected users: { socketId -> username }
const users = {};

// ── Socket.io Events ──────────────────────────
io.on("connection", (socket) => {

  // 1. A new user sets their username
  socket.on("set_username", (username) => {
    users[socket.id] = username;

    // Tell everyone this user joined
    io.emit("system_message", {
      text: `${username} joined the chat 👋`,
      time: getTime()
    });

    // Send the updated user list to all clients
    io.emit("user_list", Object.values(users));

    console.log(`✅  ${username} connected (${socket.id})`);
  });

  // 2. A user sends a chat message
  socket.on("send_message", (message) => {
    const username = users[socket.id] || "Anonymous";

    // Broadcast the message to ALL connected clients
    io.emit("receive_message", {
      sender: username,
      text: message,
      time: getTime(),
      socketId: socket.id
    });
  });

  // 3. A user disconnects
  socket.on("disconnect", () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];

      // Notify everyone the user left
      io.emit("system_message", {
        text: `${username} left the chat 👋`,
        time: getTime()
      });

      // Update user list
      io.emit("user_list", Object.values(users));

      console.log(`❌  ${username} disconnected (${socket.id})`);
    }
  });
});

// ── Helper: current time string ───────────────
function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ── Start the server ──────────────────────────
server.listen(PORT, () => {
  console.log(`🚀  Chat server running at http://localhost:${PORT}`);
});
