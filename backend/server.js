const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const socketAuthMiddleware = require("./socket/socketAuthMiddleware");
const gdSocketHandler = require("./socket/gdSocketHandler");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// HTTP SERVER
// ==============================

const server = http.createServer(app);

// ==============================
// SOCKET.IO SERVER
// ==============================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ==============================
// SOCKET.IO AUTHENTICATION
// ==============================

io.use(socketAuthMiddleware);

// ==============================
// EXPRESS MIDDLEWARE
// ==============================

app.use(express.json());

// ==============================
// ROUTES
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

// ==============================
// SOCKET.IO CONNECTION
// ==============================

io.on("connection", (socket) => {
  console.log(
    "Authenticated socket connected:",
    socket.id,
    socket.user?.id
  );

  // ==============================
  // GD REALTIME EVENTS
  // ==============================

  gdSocketHandler(io, socket);

  // ==============================
  // DISCONNECT
  // ==============================

  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
  });
});

// ==============================
// MONGODB CONNECTION
// ==============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log(
      "MongoDB Connection Error:",
      error.message
    );
  });

// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
  res.send("Placify Backend is Running");
});

// ==============================
// START SERVER
// ==============================

server.listen(PORT, () => {
  console.log(
    `Placify backend running on port ${PORT}`
  );
});