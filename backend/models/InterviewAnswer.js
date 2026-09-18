const mongoose = require("mongoose");

const interviewAnswerSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewSession",
        required: true,
      },

      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewQuestion",
        required: true,
      },

      // ==============================
      // ANSWER TYPE
      // ==============================
      answerType: {
        type: String,
        enum: [
          "Text",
          "Voice",
          "Coding",
          "SQL",
        ],
        default: "Text",
      },

      // ==============================
      // THEORY / VOICE ANSWER
      // ==============================
      answerText: {
        type: String,
        default: "",
        trim: true,
      },

      transcript: {
        type: String,
        default: "",
        trim: true,
      },

      // ==============================
      // CODING ANSWER
      // ==============================
      language: {
        type: String,
        enum: [
          "Java",
          "JavaScript",
          "Python",
          "C",
          "C++",
          null,
        ],
        default: null,
      },

      sourceCode: {
        type: String,
        default: "",
      },

      codingProblem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CodingProblem",
        default: null,
      },

      totalTestCases: {
        type: Number,
        default: 0,
        min: 0,
      },

      passedTestCases: {
        type: Number,
        default: 0,
        min: 0,
      },

      failedTestCases: {
        type: Number,
        default: 0,
        min: 0,
      },

      // ==============================
      // SQL ANSWER
      // ==============================
      submittedQuery: {
        type: String,
        default: "",
        trim: true,
      },

      sqlProblem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SqlProblem",
        default: null,
      },

      // ==============================
      // EXECUTION RESULT
      // ==============================
      executionStatus: {
        type: String,
        default: "",
        trim: true,
      },

      executionTimeMs: {
        type: Number,
        default: 0,
        min: 0,
      },

      errorMessage: {
        type: String,
        default: "",
      },

      // ==============================
      // COMMON SCORE
      // ==============================
      score: {
        type: Number,
        default: 0,
        min: 0,
      },

      scorePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      // ==============================
      // THEORY EVALUATION
      // ==============================
      matchedKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      missingKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      strengths: [
        {
          type: String,
          trim: true,
        },
      ],

      weakAreas: [
        {
          type: String,
          trim: true,
        },
      ],

      feedback: [
        {
          type: String,
          trim: true,
        },
      ],

      communicationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      relevanceScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      completenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      answeredAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// ==============================
// ANSWER MODE VALIDATION
// ==============================
interviewAnswerSchema.pre(
  "validate",
  function () {
    if (
      ["Text", "Voice"].includes(
        this.answerType
      ) &&
      !this.answerText?.trim()
    ) {
      throw new Error(
        "Answer text is required for Text and Voice interview answers"
      );
    }

    if (
      this.answerType === "Coding"
    ) {
      if (!this.codingProblem) {
        throw new Error(
          "Coding problem is required for Coding interview answers"
        );
      }

      if (!this.language) {
        throw new Error(
          "Programming language is required for Coding interview answers"
        );
      }

      if (!this.sourceCode?.trim()) {
        throw new Error(
          "Source code is required for Coding interview answers"
        );
      }
    }

    if (
      this.answerType === "SQL"
    ) {
      if (!this.sqlProblem) {
        throw new Error(
          "SQL problem is required for SQL interview answers"
        );
      }

      if (
        !this.submittedQuery?.trim()
      ) {
        throw new Error(
          "SQL query is required for SQL interview answers"
        );
      }
    }
  }
);

// One answer per question in one interview session
interviewAnswerSchema.index(
  {
    user: 1,
    session: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "InterviewAnswer",
  interviewAnswerSchema
);