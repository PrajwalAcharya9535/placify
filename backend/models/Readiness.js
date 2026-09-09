const mongoose = require("mongoose");

const readinessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ==============================
    // OVERALL READINESS
    // ==============================
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // PROFILE / SKILLS / GOALS
    // ==============================
    skillScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    profileScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    goalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // RESUME / ATS
    // ==============================
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // PRACTICE ENVIRONMENT
    // ==============================
    practiceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    codingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    sqlScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    debuggingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // MOCK PLACEMENT
    // ==============================
    mockScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // INTERVIEW PREPARATION
    // ==============================
    interviewScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ==============================
    // ANALYSIS
    // ==============================
    weakAreas: [
      {
        type: String,
        trim: true,
      },
    ],

    strengths: [
      {
        type: String,
        trim: true,
      },
    ],

    recommendations: [
      {
        type: String,
        trim: true,
      },
    ],

    // ==============================
    // READINESS LEVEL
    // ==============================
    readinessLevel: {
      type: String,
      enum: [
        "Not Ready",
        "Beginner",
        "Developing",
        "Placement Ready",
        "Highly Ready",
      ],
      default: "Not Ready",
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Readiness",
  readinessSchema
);