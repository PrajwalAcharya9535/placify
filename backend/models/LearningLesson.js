const mongoose = require("mongoose");

const learningLessonSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningTopic",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    examples: [
      {
        title: String,
        explanation: String,
        code: String,
        language: String,
      },
    ],

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    estimatedMinutes: {
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

learningLessonSchema.index(
  { topic: 1, order: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "LearningLesson",
  learningLessonSchema
);