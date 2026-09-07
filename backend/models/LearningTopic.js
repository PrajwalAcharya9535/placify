const mongoose = require("mongoose");

const learningTopicSchema = new mongoose.Schema(
  {
    title: {
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
        "Programming",
        "SQL",
        "DSA",
        "Technical Subject",
        "Communication",
        "Interview",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    content: {
      type: String,
      required: true,
    },

    estimatedMinutes: {
      type: Number,
      min: 1,
      default: 15,
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
  "LearningTopic",
  learningTopicSchema
);