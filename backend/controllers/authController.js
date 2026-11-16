
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  sendRegistrationOtpEmail,
} = require("../services/emailService");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const normalizeEmail = (email) =>
  typeof email === "string"
    ? email.trim().toLowerCase()
    : "";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) =>
  crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");

// ========================================
// SEND REGISTRATION OTP
// ========================================

const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !isValidEmail(email) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        message:
          "Valid name, email and password (minimum 6 characters) are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const now = new Date();

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (
      pending &&
      now.getTime() -
        new Date(pending.lastOtpSentAt).getTime() <
        OTP_COOLDOWN_MS
    ) {
      return res.status(429).json({
        message:
          "Please wait 60 seconds before requesting another OTP",
      });
    }

    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 10);

    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(
      now.getTime() + OTP_EXPIRY_MS
    );

    await sendRegistrationOtpEmail(email, otp);

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        $set: {
          name: name.trim(),
          email,
          passwordHash,
          otpHash,
          otpExpiresAt,
          otpAttempts: 0,
          lastOtpSentAt: now,
          expiresAt: otpExpiresAt,
        },
      },
      {
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      message: "OTP sent successfully",
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    });
  } catch (error) {
    console.error("Send registration OTP error:", error);

    return res.status(500).json({
      message: "Failed to send registration OTP",
    });
  }
};

// ========================================
// VERIFY OTP AND CREATE STUDENT ACCOUNT
// ========================================

const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    if (!isValidEmail(email) || !/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        message: "Valid email and 6-digit OTP are required",
      });
    }

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (!pending) {
      return res.status(400).json({
        message: "OTP not found or expired",
      });
    }

    if (pending.otpExpiresAt <= new Date()) {
      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      return res.status(400).json({
        message: "OTP expired. Request a new OTP",
      });
    }

    if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message:
          "Maximum OTP attempts reached. Request a new OTP",
      });
    }

    const submittedHash = hashOtp(otp);

    const expected = Buffer.from(
      pending.otpHash,
      "hex"
    );

    const received = Buffer.from(
      submittedHash,
      "hex"
    );

    const validOtp =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    if (!validOtp) {
      await PendingRegistration.updateOne(
        {
          _id: pending._id,
          otpAttempts: { $lt: MAX_OTP_ATTEMPTS },
        },
        {
          $inc: { otpAttempts: 1 },
        }
      );

      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      role: "student",
    });

    await PendingRegistration.deleteOne({
      _id: pending._id,
    });

    return res.status(201).json({
      message: "Email verified. Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    console.error("Verify registration OTP error:", error);

    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

// ========================================
// LEGACY REGISTRATION ENDPOINT
// ========================================

// Prevent bypassing email verification.
const registerUser = async (req, res) => {
  return res.status(403).json({
    message:
      "Email verification is required. Use /register/send-otp and /register/verify-otp",
  });
};

// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
};
