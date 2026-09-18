const mongoose = require("mongoose");

const interviewQuestionSchema =
  new mongoose.Schema(
    {
      question: {
        type: String,
        required: true,
        trim: true,
      },

      interviewType: {
        type: String,
        enum: [
          "Technical",
          "HR",
          "Behavioral",
          "Communication",
        ],
        required: true,
      },

      // Determines how the student
      // answers this interview question.
      questionMode: {
        type: String,
        enum: [
          "Theory",
          "Coding",
          "SQL",
        ],
        default: "Theory",
      },

      // Used only when questionMode = Coding
      codingProblem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CodingProblem",
        default: null,
      },

      // Used only when questionMode = SQL
      sqlProblem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SqlProblem",
        default: null,
      },

      category: {
        type: String,
        trim: true,
      },

      targetRole: {
        type: String,
        trim: true,
      },

      targetCompany: {
        type: String,
        trim: true,
      },

      difficulty: {
        type: String,
        enum: [
          "Easy",
          "Medium",
          "Hard",
        ],
        default: "Medium",
      },

      expectedKeywords: [
        {
          type: String,
          trim: true,
        },
      ],

      sampleAnswer: {
        type: String,
        trim: true,
      },

      evaluationPoints: [
        {
          type: String,
          trim: true,
        },
      ],

      maxScore: {
        type: Number,
        default: 10,
        min: 1,
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

// ==============================
// QUESTION MODE VALIDATION
// ==============================
interviewQuestionSchema.pre(
  "validate",
  function () {
    // Coding and SQL questions are
    // allowed only in Technical interviews.
    if (
      ["Coding", "SQL"].includes(
        this.questionMode
      ) &&
      this.interviewType !== "Technical"
    ) {
      throw new Error(
        "Coding and SQL question modes are allowed only for Technical interviews"
      );
    }

    // Coding questions must reference
    // an existing CodingProblem.
    if (
      this.questionMode === "Coding" &&
      !this.codingProblem
    ) {
      throw new Error(
        "Coding problem is required for Coding interview questions"
      );
    }

    // SQL questions must reference
    // an existing SqlProblem.
    if (
      this.questionMode === "SQL" &&
      !this.sqlProblem
    ) {
      throw new Error(
        "SQL problem is required for SQL interview questions"
      );
    }

    // Theory questions must not contain
    // Coding or SQL problem references.
    if (
      this.questionMode === "Theory"
    ) {
      this.codingProblem = null;
      this.sqlProblem = null;
    }

    // Coding questions must not contain
    // an SQL problem reference.
    if (
      this.questionMode === "Coding"
    ) {
      this.sqlProblem = null;
    }

    // SQL questions must not contain
    // a Coding problem reference.
    if (
      this.questionMode === "SQL"
    ) {
      this.codingProblem = null;
    }
  }
);

interviewQuestionSchema.index({
  interviewType: 1,
  difficulty: 1,
  questionMode: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "InterviewQuestion",
  interviewQuestionSchema
);