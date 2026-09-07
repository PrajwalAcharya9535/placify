const mongoose = require("mongoose");

// ==============================
// MOCK ROUND SCHEMA
// ==============================
const mockRoundSchema = new mongoose.Schema(
  {
    roundName: {
      type: String,
      required: true,
      trim: true,
    },

    roundType: {
      type: String,
      enum: [
        "Aptitude",
        "Reasoning",
        "Verbal",
        "Technical",
        "Coding",
        "SQL",
      ],
      required: true,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    passingPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },

    numberOfQuestions: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

// ==============================
// MOCK TEST SCHEMA
// ==============================
const mockTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    rounds: {
      type: [mockRoundSchema],
      default: [],
    },

    totalDurationMinutes: {
      type: Number,
      min: 1,
      required: true,
    },

    totalMarks: {
      type: Number,
      min: 1,
      required: true,
    },

    passingPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },

    instructions: {
      type: [String],
      default: [],
    },

    // ==============================
    // PROCTORING CONFIGURATION
    // ==============================
    proctoringEnabled: {
      type: Boolean,
      default: true,
    },

    requireFullscreen: {
      type: Boolean,
      default: true,
    },

    requireCamera: {
      type: Boolean,
      default: true,
    },

    maxTabSwitches: {
      type: Number,
      min: 0,
      default: 3,
    },

    autoSubmitOnViolation: {
      type: Boolean,
      default: true,
    },

    // ==============================
    // AVAILABILITY
    // ==============================
    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    maxAttempts: {
      type: Number,
      min: 1,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MockTest",
  mockTestSchema
);