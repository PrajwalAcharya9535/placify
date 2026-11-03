const mongoose = require("mongoose");

const learningQuizSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningTopic",
      required: true,
      index: true,
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningLesson",
      default: null,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          options.length === 4 &&
          options.every((option) => option.trim().length > 0),
        message: "Exactly four non-empty options are required",
      },
    },

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      select: false,
    },

    explanation: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    order: {
      type: Number,
      min: 1,
      default: 1,
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

learningQuizSchema.index({ topic: 1, order: 1 });

module.exports = mongoose.model(
  "LearningQuiz",
  learningQuizSchema
);