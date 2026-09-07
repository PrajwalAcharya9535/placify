const mongoose = require("mongoose");

const sqlAttemptSchema = new mongoose.Schema(
  {
    // ==============================
    // USER
    // ==============================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==============================
    // SQL PROBLEM
    // ==============================
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SqlProblem",
      required: true,
    },

    // ==============================
    // MOCK PLACEMENT CONNECTION
    // Optional for normal SQL Lab
    // ==============================
    mockAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockAttempt",
      default: null,
    },

    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      default: null,
    },

    mockRoundName: {
      type: String,
      default: "",
      trim: true,
    },

    isMockAttempt: {
      type: Boolean,
      default: false,
    },

    // ==============================
    // SUBMITTED SQL QUERY
    // ==============================
    submittedQuery: {
      type: String,
      required: true,
      trim: true,
    },

    // ==============================
    // RESULT STATUS
    // ==============================
    status: {
      type: String,
      enum: [
        "Correct",
        "Wrong Answer",
        "Query Error",
        "Execution Error",
      ],
      default: "Execution Error",
    },

    // ==============================
    // SCORE
    // ==============================
    marksAwarded: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    scorePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // EXECUTION DETAILS
    // ==============================
    executionTimeMs: {
      type: Number,
      min: 0,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    // ==============================
    // SUBMISSION TIME
    // ==============================
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// INDEXES
// ==============================

// Normal SQL Lab history
sqlAttemptSchema.index({
  user: 1,
  submittedAt: -1,
});

// Mock Placement SQL attempts
sqlAttemptSchema.index({
  user: 1,
  mockAttempt: 1,
  mockRoundName: 1,
});

// ==============================
// MODEL
// ==============================
module.exports = mongoose.model(
  "SqlAttempt",
  sqlAttemptSchema
);