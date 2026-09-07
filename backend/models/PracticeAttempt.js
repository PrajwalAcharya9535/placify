const mongoose = require("mongoose");

const practiceAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PracticeQuestion",
      required: true,
    },

    submittedAnswer: {
      type: String,
      trim: true,
    },

    isCorrect: {
      type: Boolean,
      required: true,
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

    timeTakenSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    category: {
      type: String,
      trim: true,
    },

    subCategory: {
      type: String,
      trim: true,
    },

    difficulty: {
      type: String,
      trim: true,
    },

    questionType: {
      type: String,
      trim: true,
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PracticeAttempt",
  practiceAttemptSchema
);