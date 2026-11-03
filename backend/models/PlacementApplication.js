
const mongoose = require("mongoose");

const STAGES = [
  "Interested",
  "Applied",
  "Assessment",
  "Shortlisted",
  "Technical",
  "HR",
  "Selected",
  "Rejected",
  "Offer",
  "Placed",
];

const placementApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Regular placement opportunity
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlacementOpportunity",
      default: undefined,
    },

    // Telegram placement opportunity
    telegramAnnouncement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TelegramAnnouncement",
      default: undefined,
    },

    currentStage: {
      type: String,
      enum: STAGES,
      default: "Interested",
    },

    appliedAt: {
      type: Date,
      default: null,
    },

    nextRoundDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    stageHistory: [
      {
        stage: {
          type: String,
          enum: STAGES,
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },

        note: {
          type: String,
          trim: true,
          maxlength: 1000,
          default: "",
        },
      },
    ],

    offerDetails: {
      package: {
        type: Number,
        min: 0,
        default: 0,
      },

      joiningDate: {
        type: Date,
        default: null,
      },

      offerLetterUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// VALIDATE APPLICATION SOURCE
// ========================================

// FIX: Mongoose validation middleware
// no longer uses the next() callback.

placementApplicationSchema.pre(
  "validate",
  function () {
    const hasOpportunity =
      Boolean(this.opportunity);

    const hasTelegram =
      Boolean(this.telegramAnnouncement);

    if (hasOpportunity === hasTelegram) {
      throw new Error(
        "Exactly one application source is required"
      );
    }
  }
);

// ========================================
// PREVENT DUPLICATE REGULAR APPLICATIONS
// ========================================

placementApplicationSchema.index(
  {
    student: 1,
    opportunity: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      opportunity: { $type: "objectId" },
    },
  }
);

// ========================================
// PREVENT DUPLICATE TELEGRAM APPLICATIONS
// ========================================

placementApplicationSchema.index(
  {
    student: 1,
    telegramAnnouncement: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      telegramAnnouncement: { $type: "objectId" },
    },
  }
);

// ========================================
// DASHBOARD AND TRACKER QUERIES
// ========================================

placementApplicationSchema.index({
  student: 1,
  currentStage: 1,
  updatedAt: -1,
});

// ========================================
// EXPORT MODEL
// ========================================

module.exports = mongoose.model(
  "PlacementApplication",
  placementApplicationSchema
);
