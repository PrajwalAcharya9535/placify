const mongoose = require("mongoose");

// ==============================
// NOTIFICATION SCHEMA
// MODULE 11
// ==============================

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "General",
        "Opportunity",
        "Application",
        "Interview",
        "Group Discussion",
        "Mock Placement",
        "Deadline",
        "Calendar",
        "Placement",
      ],
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    relatedEntityType: {
      type: String,
      enum: [
        "PlacementOpportunity",
        "PlacementApplication",
        "InterviewSession",
        "GDSession",
        "MockTest",
        "CalendarEvent",
        null,
      ],
      default: null,
    },

    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Newest notifications for one student
notificationSchema.index({
  user: 1,
  createdAt: -1,
});

// Unread notifications for one student
notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);