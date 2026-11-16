
const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "Practice Session",
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
        "Mixed",

        // Frontend MCQ categories
        "Programming",
        "DSA",
        "Technical Subject",
      ],
      default: "Mixed",
    },

    difficulty: {
      type: String,
      enum: [
        "Easy",
        "Medium",
        "Hard",
        "Mixed",

        // Frontend difficulty labels
        "Beginner",
        "Intermediate",
        "Advanced",
      ],
      default: "Mixed",
    },

    questionType: {
      type: String,
      enum: [
        "MCQ",
        "Coding",
        "SQL",
        "Debugging",
        "Mixed",
      ],
      default: "MCQ",
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PracticeQuestion",
      },
    ],

    totalQuestions: {
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

    incorrectAnswers: {
      type: Number,
      min: 0,
      default: 0,
    },

    marksObtained: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    durationSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    timeSpentSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Completed",
        "Expired",
      ],
      default: "Not Started",
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PracticeSession",
  practiceSessionSchema
);
