const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// ==============================
// ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

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
app.listen(PORT, () => {
  console.log(
    `Placify backend running on port ${PORT}`
  );
});