const InterviewQuestion = require(
  "../../models/InterviewQuestion"
);

const CodingProblem = require(
  "../../models/CodingProblem"
);

const SqlProblem = require(
  "../../models/SqlProblem"
);

// ==============================
// CREATE INTERVIEW QUESTION
// ==============================
const createInterviewQuestion = async (
  req,
  res
) => {
  try {
    const {
      question,
      interviewType,
      questionMode,
      codingProblem,
      sqlProblem,
      category,
      targetRole,
      targetCompany,
      difficulty,
      expectedKeywords,
      sampleAnswer,
      evaluationPoints,
      maxScore,
    } = req.body;

    // ==============================
    // BASIC VALIDATION
    // ==============================
    if (!question || !interviewType) {
      return res.status(400).json({
        success: false,
        message:
          "Question and interview type are required",
      });
    }

    const allowedInterviewTypes = [
      "Technical",
      "HR",
      "Behavioral",
      "Communication",
    ];

    if (
      !allowedInterviewTypes.includes(
        interviewType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid interview type",
      });
    }

    const allowedDifficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

    if (
      difficulty &&
      !allowedDifficulties.includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid difficulty level",
      });
    }

    // ==============================
    // QUESTION MODE VALIDATION
    // ==============================
    const selectedQuestionMode =
      questionMode || "Theory";

    const allowedQuestionModes = [
      "Theory",
      "Coding",
      "SQL",
    ];

    if (
      !allowedQuestionModes.includes(
        selectedQuestionMode
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid question mode",
      });
    }

    // Coding and SQL are only allowed
    // for Technical interviews.
    if (
      ["Coding", "SQL"].includes(
        selectedQuestionMode
      ) &&
      interviewType !== "Technical"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coding and SQL questions are allowed only for Technical interviews",
      });
    }

    let validatedCodingProblem = null;
    let validatedSqlProblem = null;

    // ==============================
    // CODING PROBLEM VALIDATION
    // ==============================
    if (
      selectedQuestionMode === "Coding"
    ) {
      if (!codingProblem) {
        return res.status(400).json({
          success: false,
          message:
            "Coding problem is required for Coding interview questions",
        });
      }

      const existingCodingProblem =
        await CodingProblem.findOne({
          _id: codingProblem,
          isActive: true,
        });

      if (!existingCodingProblem) {
        return res.status(404).json({
          success: false,
          message:
            "Active coding problem not found",
        });
      }

      validatedCodingProblem =
        existingCodingProblem._id;
    }

    // ==============================
    // SQL PROBLEM VALIDATION
    // ==============================
    if (
      selectedQuestionMode === "SQL"
    ) {
      if (!sqlProblem) {
        return res.status(400).json({
          success: false,
          message:
            "SQL problem is required for SQL interview questions",
        });
      }

      const existingSqlProblem =
        await SqlProblem.findOne({
          _id: sqlProblem,
          isActive: true,
        });

      if (!existingSqlProblem) {
        return res.status(404).json({
          success: false,
          message:
            "Active SQL problem not found",
        });
      }

      validatedSqlProblem =
        existingSqlProblem._id;
    }

    // ==============================
    // MAX SCORE VALIDATION
    // ==============================
    const parsedMaxScore =
      maxScore !== undefined
        ? Number(maxScore)
        : 10;

    if (
      !Number.isFinite(parsedMaxScore) ||
      parsedMaxScore < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Max score must be a number greater than or equal to 1",
      });
    }

    // ==============================
    // CREATE QUESTION
    // ==============================
    const interviewQuestion =
      await InterviewQuestion.create({
        question: question.trim(),

        interviewType,

        questionMode:
          selectedQuestionMode,

        codingProblem:
          validatedCodingProblem,

        sqlProblem:
          validatedSqlProblem,

        category:
          category || null,

        targetRole:
          targetRole || null,

        targetCompany:
          targetCompany || null,

        difficulty:
          difficulty || "Medium",

        expectedKeywords:
          Array.isArray(expectedKeywords)
            ? expectedKeywords
            : [],

        sampleAnswer:
          sampleAnswer || null,

        evaluationPoints:
          Array.isArray(evaluationPoints)
            ? evaluationPoints
            : [],

        maxScore:
          parsedMaxScore,

        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message:
        "Interview question created successfully",
      question: interviewQuestion,
    });
  } catch (error) {
    // Invalid MongoDB ObjectId
    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid problem ID",
      });
    }

    // Mongoose schema validation
    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create interview question",
      error: error.message,
    });
  }
};

module.exports = {
  createInterviewQuestion,
};