const mongoose = require("mongoose");

const mockQuestionAttemptSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      mockAttempt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MockAttempt",
        required: true,
      },

      mockTest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MockTest",
        required: true,
      },

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
        ],
        required: true,
      },

      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PracticeQuestion",
        required: true,
      },

      submittedAnswer: {
        type: String,
        default: "",
        trim: true,
      },

      isCorrect: {
        type: Boolean,
        default: false,
      },

      marksAwarded: {
        type: Number,
        min: 0,
        default: 0,
      },

      totalMarks: {
        type: Number,
        min: 0,
        default: 0,
      },

      answered: {
        type: Boolean,
        default: false,
      },

      answeredAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

mockQuestionAttemptSchema.index({
  mockAttempt: 1,
  roundName: 1,
  question: 1,
});

module.exports = mongoose.model(
  "MockQuestionAttempt",
  mockQuestionAttemptSchema
);