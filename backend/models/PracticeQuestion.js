const mongoose = require("mongoose");

const practiceQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Aptitude",
        "Reasoning",
        "Verbal",
        "Technical",
        "Coding",
        "SQL",
        "Debugging",
      ],
      required: true,
    },

    subCategory: {
      type: String,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    questionType: {
      type: String,
      enum: [
        "MCQ",
        "Coding",
        "SQL",
        "Debugging",
      ],
      required: true,
    },

    options: [
      {
        type: String,
        trim: true,
      },
    ],

    correctAnswer: {
      type: String,
      trim: true,
    },

    explanation: {
      type: String,
      trim: true,
    },

    marks: {
      type: Number,
      min: 1,
      default: 1,
    },

    timeLimitSeconds: {
      type: Number,
      min: 10,
      default: 60,
    },

    skillsCovered: [
      {
        type: String,
        trim: true,
      },
    ],

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
  "PracticeQuestion",
  practiceQuestionSchema
);