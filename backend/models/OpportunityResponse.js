
const mongoose = require("mongoose");

// ========================================
// STUDENT OPPORTUNITY RESPONSE SCHEMA
// ========================================

const opportunityResponseSchema =
  new mongoose.Schema(
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // Telegram announcement
      announcement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TelegramAnnouncement",
        required: true,
      },

      // Student's decision
      status: {
        type: String,
        enum: [
          "Pending",
          "Interested",
          "Application Opened",
          "Applied",
          "Not Interested",
        ],
        default: "Pending",
      },

      // When student opened registration link
      applicationOpenedAt: {
        type: Date,
        default: null,
      },

      // When student confirmed applying
      appliedAt: {
        type: Date,
        default: null,
      },

      // One-hour deadline reminder
      reminderSentAt: {
        type: Date,
        default: null,
      },

      // Student can disable reminders
      reminderEnabled: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

// One response per student per announcement
opportunityResponseSchema.index(
  {
    student: 1,
    announcement: 1,
  },
  {
    unique: true,
  }
);

// Find student responses by status
opportunityResponseSchema.index({
  student: 1,
  status: 1,
});

// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
  "OpportunityResponse",
  opportunityResponseSchema
);
