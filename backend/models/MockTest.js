
const mongoose = require("mongoose");

// ==========================================
// MOCK ROUND SCHEMA
// ==========================================
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
        "Communication",
        "Interview",
      ],
      required: true,
    },

    // More specific assessment category
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

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    // Optional shortened duration for demo
    demoDurationMinutes: {
      type: Number,
      min: 1,
      default: null,
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

    demoNumberOfQuestions: {
      type: Number,
      min: 0,
      default: null,
    },

    instructions: {
      type: [String],
      default: [],
    },

    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// ==========================================
// MOCK TEST SCHEMA
// ==========================================
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

    hiringTrack: {
      type: String,
      trim: true,
      default: "General Graduate Hiring",
    },

    targetRole: {
      type: String,
      trim: true,
      default: "",
    },

    // Identifies which published pattern is used
    patternYear: {
      type: Number,
      default: null,
    },

    patternSourceUrl: {
      type: String,
      trim: true,
      default: "",
    },

    patternVerifiedAt: {
      type: Date,
      default: null,
    },

    patternStatus: {
      type: String,
      enum: ["Draft", "Verified", "Archived"],
      default: "Draft",
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

    // ======================================
    // PRACTICE CONFIGURATION
    // ======================================
    practiceEnabled: {
      type: Boolean,
      default: true,
    },

    allowRoundPractice: {
      type: Boolean,
      default: true,
    },

    allowFullSimulation: {
      type: Boolean,
      default: true,
    },

    allowDemoMode: {
      type: Boolean,
      default: true,
    },

    allowRetry: {
      type: Boolean,
      default: true,
    },

    showSolutionsAfterSubmission: {
      type: Boolean,
      default: true,
    },

    // ======================================
    // AI INTERVIEW
    // ======================================
    aiInterviewEnabled: {
      type: Boolean,
      default: true,
    },

    interviewQuestionCount: {
      type: Number,
      min: 1,
      default: 5,
    },

    // ======================================
    // PROCTORING CONFIGURATION
    // ======================================
    proctoringEnabled: {
      type: Boolean,
      default: true,
    },

    // Practice mode should not require
    // fullscreen or camera by default.
    requireFullscreen: {
      type: Boolean,
      default: false,
    },

    requireCamera: {
      type: Boolean,
      default: false,
    },

    maxTabSwitches: {
      type: Number,
      min: 0,
      default: 3,
    },

    // Keep this field for compatibility,
    // but default to warnings only.
    autoSubmitOnViolation: {
      type: Boolean,
      default: false,
    },

    proctoringMode: {
      type: String,
      enum: ["Off", "Warning", "Strict"],
      default: "Warning",
    },

    // ======================================
    // AVAILABILITY
    // ======================================
    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // Null means unlimited attempts.
    maxAttempts: {
      type: Number,
      min: 1,
      default: null,
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

// ==========================================
// INDEXES
// ==========================================
mockTestSchema.index({
  companyName: 1,
  isActive: 1,
});

mockTestSchema.index({
  companyName: 1,
  hiringTrack: 1,
});

// ==========================================
// EXPORT
// ==========================================
module.exports = mongoose.model(
  "MockTest",
  mockTestSchema
);
