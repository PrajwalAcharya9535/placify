const mongoose = require("mongoose");

const interviewAnswerSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewSession",
        required: true,
      },

      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        required: true,
      },

      answerText: {
        type: String,
        required: true,
        trim: true,
      },

      answerType: {
        type: String,
        enum: ["Text", "Voice"],
        default: "Text",
      },

      transcript: {
        type: String,
        trim: true,
      },

      score: {
        type: Number,
        default: 0,
        min: 0,
      },

      matchedKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      missingKeywords: [
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

      weakAreas: [
        {
          type: String,
          trim: true,
        },
      ],

      feedback: [
        {
          type: String,
          trim: true,
        },
      ],

      communicationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      relevanceScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      completenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      answeredAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// One answer per question in one interview session
interviewAnswerSchema.index(
  {
    user: 1,
    session: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "InterviewAnswer",
  interviewAnswerSchema
);