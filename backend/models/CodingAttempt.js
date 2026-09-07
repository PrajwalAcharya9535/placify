const mongoose = require("mongoose");

const codingAttemptSchema = new mongoose.Schema(
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
    // CODING PROBLEM
    // ==============================
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingProblem",
      required: true,
    },

    // ==============================
    // MOCK PLACEMENT CONNECTION
    // Optional for normal Coding Lab
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
    // LANGUAGE
    // ==============================
    language: {
      type: String,
      enum: [
        "Java",
        "JavaScript",
        "Python",
        "C",
        "C++",
      ],
      required: true,
    },

    // ==============================
    // SOURCE CODE
    // ==============================
    sourceCode: {
      type: String,
      required: true,
    },

    // ==============================
    // EXECUTION STATUS
    // ==============================
    status: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Compilation Error",
        "Runtime Error",
        "Time Limit Exceeded",
        "Execution Error",
      ],
      default: "Execution Error",
    },

    // ==============================
    // TEST CASE RESULTS
    // ==============================
    totalTestCases: {
      type: Number,
      min: 0,
      default: 0,
    },

    passedTestCases: {
      type: Number,
      min: 0,
      default: 0,
    },

    failedTestCases: {
      type: Number,
      min: 0,
      default: 0,
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

// Normal Coding Lab history
codingAttemptSchema.index({
  user: 1,
  submittedAt: -1,
});

// Mock Placement Coding attempts
codingAttemptSchema.index({
  user: 1,
  mockAttempt: 1,
  mockRoundName: 1,
});

// ==============================
// MODEL
// ==============================
module.exports = mongoose.model(
  "CodingAttempt",
  codingAttemptSchema
);