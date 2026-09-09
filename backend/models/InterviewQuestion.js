const mongoose = require("mongoose");

const interviewQuestionSchema =
  new mongoose.Schema(
    {
      question: {
        type: String,
        required: true,
        trim: true,
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

      category: {
        type: String,
        trim: true,
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

      expectedKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      sampleAnswer: {
        type: String,
        trim: true,
      },

      evaluationPoints: [
        {
          type: String,
          trim: true,
        },
      ],

      maxScore: {
        type: Number,
        default: 10,
        min: 1,
      },

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "InterviewQuestion",
  interviewQuestionSchema
);