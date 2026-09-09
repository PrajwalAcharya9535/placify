const mongoose = require("mongoose");

const gdQueueSchema = new mongoose.Schema(
  {
    // ==============================
    // STUDENT
    // ==============================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ==============================
    // MATCHMAKING PREFERENCES
    // ==============================
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    targetRole: {
      type: String,
      trim: true,
      default: "",
    },

    targetCompany: {
      type: String,
      trim: true,
      default: "",
    },

    // ==============================
    // QUEUE STATUS
    // ==============================
    status: {
      type: String,
      enum: [
        "Waiting",
        "Matched",
        "Cancelled",
      ],
      default: "Waiting",
    },

    // ==============================
    // MATCHED GD SESSION
    // ==============================
    matchedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GDSession",
      default: null,
    },

    // ==============================
    // TIMING
    // ==============================
    joinedQueueAt: {
      type: Date,
      default: Date.now,
    },

    matchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// INDEXES
// ==============================

gdQueueSchema.index({
  status: 1,
  difficulty: 1,
  joinedQueueAt: 1,
});

// ==============================
// MODEL
// ==============================

module.exports = mongoose.model(
  "GDQueue",
  gdQueueSchema
);