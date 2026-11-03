const mongoose = require("mongoose");

const learningVideoSchema = new mongoose.Schema(
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

    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (url) =>
          /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)[A-Za-z0-9_-]{11}(?:[?&][^\s]*)?$/.test(url),
        message: "Invalid YouTube URL",
      },
    },

    description: {
      type: String,
      default: "",
    },

    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
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

learningVideoSchema.index({ topic: 1, order: 1 });

module.exports = mongoose.model(
  "LearningVideo",
  learningVideoSchema
);