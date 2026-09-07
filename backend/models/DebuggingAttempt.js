const mongoose = require("mongoose");

const debuggingAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DebuggingProblem",
      required: true,
    },

    language: {
      type: String,
      enum: ["Java", "Python", "C", "C++"],
      required: true,
    },

    fixedCode: {
      type: String,
      required: true,
    },

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

    executionTimeMs: {
      type: Number,
      min: 0,
      default: 0,
    },

    errorMessage: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DebuggingAttempt",
  debuggingAttemptSchema
);