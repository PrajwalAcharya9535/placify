const mongoose = require("mongoose");

const gdTopicSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    targetRole: {
      type: String,
      trim: true,
      default: "",
    },

    targetCompany: {
      type: String,
      trim: true,
      default: "",
    },

    expectedKeywords: [
      {
        type: String,
        trim: true,
      },
    ],

    evaluationPoints: [
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
  "GDTopic",
  gdTopicSchema
);