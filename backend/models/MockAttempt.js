
const mongoose = require("mongoose");

// ==========================================
// ROUND RESULT SCHEMA
// ==========================================
const roundResultSchema = new mongoose.Schema(
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
        "Communication",
        "Interview",
      ],
      required: true,
    },

    sectionKey: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    score: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    // ======================================
    // ROUND PRACTICE STATE
    // ======================================
    status: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Completed",
        "Auto Submitted",
        "Skipped",
      ],
      default: "Not Started",
    },

    durationMinutes: {
      type: Number,
      min: 1,
      default: null,
    },

    numberOfQuestions: {
      type: Number,
      min: 0,
      default: 0,
    },

    attemptedQuestions: {
      type: Number,
      min: 0,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      min: 0,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    timeSpentSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    feedback: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// PROCTORING VIOLATION SCHEMA
// ==========================================
const proctoringViolationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Tab Switch",
        "Fullscreen Exit",
        "Camera Disabled",
        "Face Not Detected",
        "Multiple Faces",
        "Copy Attempt",
        "Paste Attempt",
        "Suspicious Activity",
        "Other",
      ],
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    roundName: {
      type: String,
      default: "",
      trim: true,
    },

    occurredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// MOCK ATTEMPT SCHEMA
// ==========================================
const mockAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mockTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTest",
      required: true,
    },

    // ======================================
    // PRACTICE MODE
    // ======================================
    practiceMode: {
      type: String,
      enum: ["Full", "Demo"],
      default: "Full",
    },

    status: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Completed",
        "Auto Submitted",
        "Disqualified",
      ],
      default: "Not Started",
    },

    currentRoundIndex: {
      type: Number,
      min: 0,
      default: 0,
    },



    // ======================================
    // QUESTION ASSIGNMENT LOCKS
    // ======================================
    assignmentLocks: {
      type: Map,
      of: Date,
      default: {},
    },


    roundResults: {
      type: [roundResultSchema],
      default: [],
    },

    // ======================================
    // SCORING
    // ======================================
    totalScore: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    overallPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    result: {
      type: String,
      enum: [
        "Pending",
        "Passed",
        "Failed",
        "Disqualified",
      ],
      default: "Pending",
    },

    // ======================================
    // OPTIONAL PRACTICE PROCTORING
    // ======================================
    proctoringEnabled: {
      type: Boolean,
      default: false,
    },

    proctoringViolations: {
      type: [proctoringViolationSchema],
      default: [],
    },

    violationCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ======================================
    // ATTEMPT TIMESTAMPS
    // ======================================
    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================
mockAttemptSchema.index({
  user: 1,
  mockTest: 1,
});

mockAttemptSchema.index({
  user: 1,
  status: 1,
});

// ==========================================
// EXPORT
// ==========================================
module.exports = mongoose.model(
  "MockAttempt",
  mockAttemptSchema
);
