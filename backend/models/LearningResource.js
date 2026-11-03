const mongoose = require("mongoose");

const learningResourceSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: ["Documentation", "Article", "PDF", "Website"],
      required: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => {
          try {
            const url = new URL(value);
            return ["https:", "http:"].includes(url.protocol);
          } catch {
            return false;
          }
        },
        message: "A valid HTTP or HTTPS URL is required",
      },
    },

    description: {
      type: String,
      default: "",
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

learningResourceSchema.index({ topic: 1, order: 1 });

module.exports = mongoose.model(
  "LearningResource",
  learningResourceSchema
);