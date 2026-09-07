const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
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
    // RESUME FILE INFORMATION
    // ==============================
    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    // ==============================
    // EXTRACTED RESUME TEXT
    // ==============================
    extractedText: {
      type: String,
      default: "",
    },

    // ==============================
    // EXTRACTED INFORMATION
    // ==============================
    extractedSkills: {
      type: [String],
      default: [],
    },

    education: {
      type: [String],
      default: [],
    },

    experience: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    certifications: {
      type: [String],
      default: [],
    },

    // ==============================
    // ATS ANALYSIS
    // ==============================
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    keywordScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    skillMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // ATS FEEDBACK
    // ==============================
    matchedKeywords: {
      type: [String],
      default: [],
    },

    missingKeywords: {
      type: [String],
      default: [],
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    suggestions: {
      type: [String],
      default: [],
    },

    // ==============================
    // TARGET JOB
    // ==============================
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },

    targetCompany: {
      type: String,
      default: "",
      trim: true,
    },

    jobDescription: {
      type: String,
      default: "",
    },

    // ==============================
    // ANALYSIS STATUS
    // ==============================
    analysisStatus: {
      type: String,
      enum: [
        "Not Analyzed",
        "Analyzed",
        "Failed",
      ],
      default: "Not Analyzed",
    },

    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==============================
// INDEX
// ==============================
resumeSchema.index({
  user: 1,
  updatedAt: -1,
});

module.exports = mongoose.model(
  "Resume",
  resumeSchema
);