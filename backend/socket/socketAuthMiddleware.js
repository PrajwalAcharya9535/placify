const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==============================
// SOCKET AUTHENTICATION MIDDLEWARE
// ==============================

const socketAuthMiddleware = async (
  socket,
  next
) => {
  try {
    // ==============================
    // GET TOKEN
    // ==============================

    let token =
      socket.handshake.auth?.token;

    // Also support Authorization header
    if (
      !token &&
      socket.handshake.headers
        ?.authorization
    ) {
      const authorization =
        socket.handshake.headers
          .authorization;

      if (
        authorization.startsWith(
          "Bearer "
        )
      ) {
        token =
          authorization.split(" ")[1];
      }
    }

    if (!token) {
      return next(
        new Error(
          "Authentication required"
        )
      );
    }

    // Remove Bearer prefix if frontend
    // accidentally sends full Bearer token
    if (token.startsWith("Bearer ")) {
      token = token.substring(7);
    }

    // ==============================
    // VERIFY JWT
    // ==============================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return next(
        new Error(
          "Invalid authentication token"
        )
      );
    }

    // ==============================
    // FIND USER
    // ==============================

    const user = await User.findById(
      userId
    ).select("-password");

    if (!user) {
      return next(
        new Error(
          "User not found"
        )
      );
    }

    // ==============================
    // ONLY STUDENTS CAN JOIN GD SOCKET
    // ==============================

    if (user.role !== "student") {
      return next(
        new Error(
          "Only students can access GD realtime rooms"
        )
      );
    }

    // ==============================
    // ATTACH VERIFIED USER TO SOCKET
    // ==============================

    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error(
      "Socket authentication error:",
      error.message
    );

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return next(
        new Error(
          "Authentication token expired"
        )
      );
    }

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return next(
        new Error(
          "Invalid authentication token"
        )
      );
    }

    return next(
      new Error(
        "Socket authentication failed"
      )
    );
  }
};

module.exports =
  socketAuthMiddleware;