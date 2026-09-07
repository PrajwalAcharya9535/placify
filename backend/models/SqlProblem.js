const mongoose = require("mongoose");

// ==============================
// SQL TABLE SCHEMA
// ==============================
const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dataType: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const tableSchema = new mongoose.Schema(
  {
    tableName: {
      type: String,
      required: true,
      trim: true,
    },

    columns: [columnSchema],

    sampleData: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { _id: false }
);

// ==============================
// SQL PROBLEM SCHEMA
// ==============================
const sqlProblemSchema = new mongoose.Schema(
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

    tables: {
      type: [tableSchema],
      default: [],
    },

    expectedQuery: {
      type: String,
      required: true,
      trim: true,
    },

    expectedResult: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    explanation: {
      type: String,
      default: "",
      trim: true,
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
  "SqlProblem",
  sqlProblemSchema
);