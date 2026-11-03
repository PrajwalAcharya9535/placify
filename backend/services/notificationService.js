
const Notification = require(
  "../models/Notification"
);

// ========================================
// CREATE NOTIFICATION
// REUSABLE SERVICE - MODULE 11
// ========================================

const createNotification = async ({
  user,
  title,
  message,
  type = "General",
  priority = "Medium",
  relatedEntityType = null,
  relatedEntityId = null,
  actionUrl = null,
  scheduledFor = null,
  expiresAt = null,
  metadata = {},
}) => {
  try {
    if (!user) {
      throw new Error(
        "Notification user is required"
      );
    }

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      throw new Error(
        "Notification title is required"
      );
    }

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      throw new Error(
        "Notification message is required"
      );
    }

    // ----------------------------------------
    // SAVE NOTIFICATION
    // ----------------------------------------

    const notification =
      await Notification.create({
        user,

        title: title.trim(),

        message: message.trim(),

        type,

        priority,

        isRead: false,

        readAt: null,

        relatedEntityType,

        relatedEntityId,

        actionUrl,

        scheduledFor,

        expiresAt,

        metadata,
      });

    // ----------------------------------------
    // REAL-TIME SOCKET NOTIFICATION
    // ----------------------------------------

    try {
      const io =
        global.placifySocketIO;

      if (io) {
        io.to(`user:${String(user)}`).emit(
          "notification:new",
          notification
        );
      }
    } catch (socketError) {
      console.error(
        "Notification socket emit error:",
        socketError
      );
    }

    return notification;
  } catch (error) {
    console.error(
      "Create notification service error:",
      error
    );

    throw error;
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createNotification,
};
