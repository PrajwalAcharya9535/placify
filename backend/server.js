
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("node:dns");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const socketAuthMiddleware = require("./socket/socketAuthMiddleware");
const gdSocketHandler = require("./socket/gdSocketHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// HTTP SERVER
// ==============================

const server = http.createServer(app);

// ==============================
// SOCKET.IO
// ==============================

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ==============================
// MAKE SOCKET.IO AVAILABLE
// TO EXPRESS CONTROLLERS
// ==============================

app.set("io", io);

// ==============================
// MAKE SOCKET.IO AVAILABLE
// TO NOTIFICATION SERVICE
// ==============================

global.placifySocketIO = io;

// ==============================
// SOCKET.IO AUTHENTICATION
// ==============================

io.use(socketAuthMiddleware);

// ==============================
// EXPRESS MIDDLEWARE
// ==============================

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

// ==============================
// GENERATED RESUME FILES
// ==============================

app.use(
  "/uploads/generated-resumes",
  express.static(
    path.join(
      __dirname,
      "uploads",
      "generated-resumes"
    )
  )
);

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

  if (socket.user?.id) {
    const userRoom = `user:${socket.user.id}`;

    socket.join(userRoom);

    console.log(
      "Socket joined private user room:",
      userRoom
    );
  }

  gdSocketHandler(io, socket);

  io.on;

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
