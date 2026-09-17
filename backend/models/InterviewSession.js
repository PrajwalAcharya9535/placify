const mongoose = require("mongoose");

const interviewSessionSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      interviewType: {
        type: String,
        enum: [
          "Technical",
          "HR",
          "Behavioral",
          "Communication",
        ],
        required: true,
      },

      targetRole: {
        type: String,
        trim: true,
      },

      targetCompany: {
        type: String,
        trim: true,
      },

      difficulty: {
        type: String,
        enum: [
          "Easy",
          "Medium",
          "Hard",
        ],
        default: "Medium",
      },

      status: {
        type: String,
        enum: [
          "Started",
          "In Progress",
          "Completed",
        ],
        default: "Started",
      },

      // Exact questions assigned to this interview session
      assignedQuestions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InterviewQuestion",
        },
      ],

      totalQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      answeredQuestions: {
        type: Number,
        default: 0,
        min: 0,
      },

      overallScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      technicalScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      communicationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      confidenceScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      strengths: [
        {
          type: String,
          trim: true,
        },
      ],

      weakAreas: [
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

      startedAt: {
        type: Date,
        default: Date.now,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

interviewSessionSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);