const mongoose = require("mongoose");

const learningActivityProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningTopic",
      required: true,
    },

    activityType: {
      type: String,
      enum: ["Lesson", "Video", "Quiz", "Exercise"],
      required: true,
    },

    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed"],
      default: "In Progress",
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

learningActivityProgressSchema.index(
  { user: 1, activityType: 1, activityId: 1 },
  { unique: true }
);

learningActivityProgressSchema.index({
  user: 1,
  topic: 1,
});

module.exports = mongoose.model(
  "LearningActivityProgress",
  learningActivityProgressSchema
);