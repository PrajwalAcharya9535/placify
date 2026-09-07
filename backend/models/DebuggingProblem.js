const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },

    expectedOutput: {
      type: String,
      required: true,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const debuggingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,
      enum: ["Java", "Python", "C", "C++"],
      required: true,
    },

    buggyCode: {
      type: String,
      required: true,
    },

    bugDescription: {
      type: String,
      default: "",
    },

    expectedFixedCode: {
      type: String,
      default: "",
    },

    inputFormat: {
      type: String,
      default: "",
    },

    outputFormat: {
      type: String,
      default: "",
    },

    constraints: {
      type: String,
      default: "",
    },

    testCases: {
      type: [testCaseSchema],
      default: [],
    },

    marks: {
      type: Number,
      min: 1,
      default: 10,
    },

    timeLimitSeconds: {
      type: Number,
      min: 1,
      default: 5,
    },

    skillsCovered: {
      type: [String],
      default: [],
    },

    companyTags: {
      type: [String],
      default: [],
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

module.exports = mongoose.model(
  "DebuggingProblem",
  debuggingProblemSchema
);