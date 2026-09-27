const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
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

// Allow Placify React frontend to access REST APIs
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
//
// Only generated improved resumes are
// publicly served for frontend preview.
//
// Original uploaded student resumes remain
// private and are NOT exposed through
// /uploads/resumes.
//
// Generated resumes can be accessed through:
//
// http://localhost:5000/uploads/generated-resumes/file.pdf
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