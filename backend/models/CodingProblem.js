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

const codingProblemSchema = new mongoose.Schema(
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
      trim: true,
      required: true,
    },

    supportedLanguages: [
      {
        type: String,
        enum: ["Java", "JavaScript", "Python", "C", "C++"],
      },
    ],

    inputFormat: {
      type: String,
      trim: true,
    },

    outputFormat: {
      type: String,
      trim: true,
    },

    constraints: {
      type: String,
      trim: true,
    },

    sampleInput: {
      type: String,
      default: "",
    },

    sampleOutput: {
      type: String,
      default: "",
    },

    testCases: [testCaseSchema],

    // =====================================
    // DEMO SOLUTIONS (JAVA + PYTHON)
    // =====================================

    demoSolutions: {
      Java: {
        type: String,
        default: "",
      },

      Python: {
        type: String,
        default: "",
      },
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

    skillsCovered: [
      {
        type: String,
        trim: true,
      },
    ],

    companyTags: [
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
  { timestamps: true }
);

module.exports = mongoose.model(
  "CodingProblem",
  codingProblemSchema
);