
const express = require("express");

const {
  registerUser,
  loginUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==============================
// REGISTRATION OTP
// ==============================

// Send registration OTP
router.post(
  "/register/send-otp",
  sendRegistrationOtp
);

// Verify OTP and complete registration
router.post(
  "/register/verify-otp",
  verifyRegistrationOtp
);

// ==============================
// REGISTER USER
// ==============================

router.post("/register", registerUser);

// ==============================
// LOGIN USER
// ==============================

router.post("/login", loginUser);

// ==============================
// PROTECTED ROUTE
// ==============================

router.get("/protected", protect, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

// ==============================
// ADMIN-ONLY ROUTE
// ==============================

router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      message: "Admin access granted",
      user: req.user,
    });
  }
);

module.exports = router;
