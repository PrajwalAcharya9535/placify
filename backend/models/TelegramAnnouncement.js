
const mongoose = require("mongoose");

// ========================================
// ADDITIONAL COMPANY DETAIL SCHEMA
// ========================================

const additionalDetailSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    _id: false,
  }
);

// ========================================
// TELEGRAM ANNOUNCEMENT SCHEMA
// ========================================

const telegramAnnouncementSchema = new mongoose.Schema(
  {
    // Telegram message identity
    chatId: {
      type: String,
      required: true,
      trim: true,
    },

    messageId: {
      type: Number,
      required: true,
    },

    chatTitle: {
      type: String,
      default: "",
      trim: true,
    },

    messageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Original Telegram announcement
    messageText: {
      type: String,
      default: "",
    },

    // Telegram image or document references
    attachments: [
      {
        fileId: {
          type: String,
          default: "",
        },

        fileType: {
          type: String,
          enum: ["photo", "document"],
          required: true,
        },

        fileName: {
          type: String,
          default: "",
        },
      },
    ],

    // ========================================
    // COMMON PLACEMENT INFORMATION
    // ========================================

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    jobRole: {
      type: String,
      default: "",
      trim: true,
    },

    salary: {
      type: String,
      default: "",
      trim: true,
    },

    stipend: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    eligibility: {
      type: String,
      default: "",
    },

    graduationBatch: {
      type: String,
      default: "",
      trim: true,
    },

    jobType: {
      type: String,
      default: "",
      trim: true,
    },

    workMode: {
      type: String,
      default: "",
      trim: true,
    },

    minimumCGPA: {
      type: String,
      default: "",
      trim: true,
    },

    selectionProcess: {
      type: String,
      default: "",
    },

    // ========================================
    // APPLICATION INFORMATION
    // ========================================

    applicationUrl: {
      type: String,
      default: "",
      trim: true,
    },

    registrationDeadline: {
      type: Date,
      default: null,
    },

    deadlineTimeConfirmed: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DYNAMIC ADDITIONAL DETAILS
    // ========================================

    // Only store details actually present
    // in the original Telegram message.
    additionalDetails: {
      type: [additionalDetailSchema],
      default: [],
    },

    // ========================================
    // TELEGRAM ANNOUNCEMENT TYPE
    // ========================================

    announcementType: {
      type: String,
      enum: [
        "New Opportunity",
        "Deadline Updated",
        "Interview Rescheduled",
        "Drive Cancelled",
        "General Update",
      ],
      default: "General Update",
    },

    // Optional structured opportunity link
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementOpportunity",
      default: null,
    },

    // ========================================
    // EXTRACTION / REVIEW STATUS
    // ========================================

    processingStatus: {
      type: String,
      enum: [
        "Pending",
        "Processed",
        "Needs Review",
        "Failed",
      ],
      default: "Pending",
    },

    // When Telegram originally posted it
    telegramDate: {
      type: Date,
      default: null,
    },

    // When PLACIFY received it
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// DATABASE INDEXES
// ========================================

// Prevent duplicate Telegram messages
telegramAnnouncementSchema.index(
  {
    chatId: 1,
    messageId: 1,
  },
  {
    unique: true,
  }
);

// Fetch latest announcements
telegramAnnouncementSchema.index({
  receivedAt: -1,
});

// Find registration deadlines
telegramAnnouncementSchema.index({
  registrationDeadline: 1,
  deadlineTimeConfirmed: 1,
});

// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
  "TelegramAnnouncement",
  telegramAnnouncementSchema
);
