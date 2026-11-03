const mongoose = require("mongoose");

const learningExerciseSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Coding", "SQL", "Debugging", "Written"],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    instructions: {
      type: String,
      default: "",
    },

    practiceProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

learningExerciseSchema.index({ topic: 1, order: 1 });

module.exports = mongoose.model(
  "LearningExercise",
  learningExerciseSchema
);