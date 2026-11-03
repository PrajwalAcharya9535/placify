
const mongoose = require("mongoose");

const User = require("../models/User");

const Notification = require(
  "../models/Notification"
);

// ========================================
// BUILD TELEGRAM NOTIFICATION CONTENT
// ========================================

const buildNotificationContent = (
  announcement
) => {
  const company =
    announcement.companyName?.trim() ||
    "Placement Opportunity";

  const role =
    announcement.jobRole?.trim() || "";

  const type = announcement.announcementType;

  let title = `New Placement Alert: ${company}`;

  if (type === "Deadline Updated") {
    title = `Deadline Updated: ${company}`;
  } else if (
    type === "Interview Rescheduled"
  ) {
    title = `Interview Rescheduled: ${company}`;
  } else if (
    type === "Drive Cancelled"
  ) {
    title = `Placement Drive Cancelled: ${company}`;
  }

  const messageParts = [];

  if (role) {
    messageParts.push(role);
  }

  if (announcement.eligibility) {
    messageParts.push(
      `Eligibility: ${announcement.eligibility}`
    );
  }

  if (announcement.registrationDeadline) {
    messageParts.push(
      `Registration deadline: ${new Date(
        announcement.registrationDeadline
      ).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`
    );
  }

  if (messageParts.length === 0) {
    messageParts.push(
      announcement.messageText?.slice(
        0,
        250
      ) || "New placement announcement received."
    );
  }

  return {
    title,
    message: messageParts.join(" | "),
  };
};

// ========================================
// NOTIFY STUDENTS ABOUT ANNOUNCEMENT
// ========================================

const notifyStudentsAboutTelegramAnnouncement =
  async (announcement) => {
    if (
      !announcement ||
      !mongoose.Types.ObjectId.isValid(
        announcement._id
      )
    ) {
      throw new Error(
        "Valid Telegram announcement is required"
      );
    }

    const { title, message } =
      buildNotificationContent(announcement);

    let createdCount = 0;
    let skippedCount = 0;

    // Only students registered in PLACIFY.
    const students = User.find({
      role: "student",
    })
      .select("_id")
      .lean()
      .cursor();

    for await (const student of students) {
      const filter = {
        user: student._id,
        type: "Opportunity",
        "metadata.source": "Telegram",
        "metadata.announcementId":
          String(announcement._id),
      };

      const existing =
        await Notification.exists(filter);

      if (existing) {
        skippedCount++;
        continue;
      }

      const notification =
        await Notification.create({
          user: student._id,

          title,

          message,

          type: "Opportunity",

          priority:
            announcement.announcementType ===
            "Drive Cancelled"
              ? "High"
              : "Medium",

          isRead: false,

          readAt: null,

          relatedEntityType: null,

          relatedEntityId: null,

          actionUrl:
            "/opportunities",

          metadata: {
            source: "Telegram",

            announcementId: String(
              announcement._id
            ),

            chatId:
              announcement.chatId,

            messageId:
              announcement.messageId,

            announcementType:
              announcement.announcementType,
          },
        });

      createdCount++;

      // Emit to the student's authenticated
      // Socket.IO room if connected.
      const io = global.placifySocketIO;

      if (io) {
        io.to(
          `user:${String(student._id)}`
        ).emit(
          "notification:new",
          notification
        );
      }
    }

    return {
      success: true,
      createdCount,
      skippedCount,
    };
  };

// ========================================
// EXPORTS
// ========================================

module.exports = {
  notifyStudentsAboutTelegramAnnouncement,
};
