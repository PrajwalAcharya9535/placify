
const mongoose = require("mongoose");

const InterviewQuestion = require("../../models/InterviewQuestion");
const CodingProblem = require("../../models/CodingProblem");
const SqlProblem = require("../../models/SqlProblem");

const ALLOWED_FIELDS = [
  "question",
  "interviewType",
  "questionMode",
  "codingProblem",
  "sqlProblem",
  "category",
  "targetRole",
  "targetCompany",
  "difficulty",
  "expectedKeywords",
  "sampleAnswer",
  "evaluationPoints",
  "maxScore",
  "isActive",
];

const INTERVIEW_TYPES = [
  "Technical",
  "HR",
  "Behavioral",
  "Communication",
];

const QUESTION_MODES = ["Theory", "Coding", "SQL"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const pickAllowedFields = (body = {}) => {
  const result = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }

  return result;
};

const sendError = (res, error, message) => {
  const isValidationError = [
    "ValidationError",
    "CastError",
  ].includes(error.name);

  return res.status(isValidationError ? 400 : 500).json({
    success: false,
    message: isValidationError ? error.message : message,
    error: error.message,
  });
};

// ==============================
// VALIDATE QUESTION DATA
// ==============================

const validateQuestionData = async (data) => {
  if (
    typeof data.question !== "string" ||
    !data.question.trim()
  ) {
    return "Question is required";
  }

  if (!INTERVIEW_TYPES.includes(data.interviewType)) {
    return "Invalid interview type";
  }

  if (!QUESTION_MODES.includes(data.questionMode)) {
    return "Invalid question mode";
  }

  if (!DIFFICULTIES.includes(data.difficulty)) {
    return "Invalid difficulty level";
  }

  if (
    ["Coding", "SQL"].includes(data.questionMode) &&
    data.interviewType !== "Technical"
  ) {
    return "Coding and SQL questions are allowed only for Technical interviews";
  }

  const score = Number(data.maxScore);

  if (!Number.isFinite(score) || score < 1) {
    return "Max score must be at least 1";
  }

  data.maxScore = score;

  for (const field of [
    "expectedKeywords",
    "evaluationPoints",
  ]) {
    if (!Array.isArray(data[field])) {
      return `${field} must be an array`;
    }

    if (
      data[field].some(
        (item) => typeof item !== "string"
      )
    ) {
      return `${field} must contain only strings`;
    }
  }

  if (data.questionMode === "Theory") {
    data.codingProblem = null;
    data.sqlProblem = null;
  }

  if (data.questionMode === "Coding") {
    if (
      !mongoose.isValidObjectId(data.codingProblem)
    ) {
      return "Valid coding problem ID is required";
    }

    const exists = await CodingProblem.exists({
      _id: data.codingProblem,
      isActive: true,
    });

    if (!exists) {
      return "Active coding problem not found";
    }

    data.sqlProblem = null;
  }

  if (data.questionMode === "SQL") {
    if (!mongoose.isValidObjectId(data.sqlProblem)) {
      return "Valid SQL problem ID is required";
    }

    const exists = await SqlProblem.exists({
      _id: data.sqlProblem,
      isActive: true,
    });

    if (!exists) {
      return "Active SQL problem not found";
    }

    data.codingProblem = null;
  }

  return null;
};

// ==============================
// CREATE INTERVIEW QUESTION
// ==============================

const createInterviewQuestion = async (req, res) => {
  try {
    const data = {
      questionMode: "Theory",
      difficulty: "Medium",
      expectedKeywords: [],
      evaluationPoints: [],
      maxScore: 10,
      isActive: true,
      ...pickAllowedFields(req.body),
    };

    const error = await validateQuestionData(data);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const question = await InterviewQuestion.create(data);

    return res.status(201).json({
      success: true,
      message: "Interview question created successfully",
      question,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to create interview question"
    );
  }
};

// ==============================
// LIST INTERVIEW QUESTIONS
// ==============================

const getAllInterviewQuestions = async (req, res) => {
  try {
    const {
      search,
      interviewType,
      questionMode,
      difficulty,
      category,
      isActive,
    } = req.query;

    const filter = {};

    if (interviewType) {
      if (!INTERVIEW_TYPES.includes(interviewType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid interview type",
        });
      }

      filter.interviewType = interviewType;
    }

    if (questionMode) {
      if (!QUESTION_MODES.includes(questionMode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid question mode",
        });
      }

      filter.questionMode = questionMode;
    }

    if (difficulty) {
      if (!DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: "Invalid difficulty",
        });
      }

      filter.difficulty = difficulty;
    }

    if (category) filter.category = category;

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      filter.isActive = isActive === "true";
    }

    if (typeof search === "string" && search.trim()) {
      const escaped = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.question = {
        $regex: escaped,
        $options: "i",
      };
    }

    const questions = await InterviewQuestion.find(filter)
      .select("-sampleAnswer -expectedKeywords -evaluationPoints")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch interview questions"
    );
  }
};

// ==============================
// GET INTERVIEW QUESTION BY ID
// ==============================

const getInterviewQuestionById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview question ID",
      });
    }

    const question = await InterviewQuestion.findById(
      req.params.id
    )
      .populate("codingProblem", "title difficulty language isActive")
      .populate("sqlProblem", "title difficulty category isActive");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to fetch interview question"
    );
  }
};

// ==============================
// UPDATE INTERVIEW QUESTION
// ==============================

const updateInterviewQuestion = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview question ID",
      });
    }

    const question = await InterviewQuestion.findById(
      req.params.id
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    const updates = pickAllowedFields(req.body);

    const data = {
      ...question.toObject(),
      ...updates,
    };

    const error = await validateQuestionData(data);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    for (const field of ALLOWED_FIELDS) {
      if (data[field] !== undefined) {
        question[field] = data[field];
      }
    }

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Interview question updated successfully",
      question,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to update interview question"
    );
  }
};

// ==============================
// DEACTIVATE INTERVIEW QUESTION
// ==============================

const deactivateInterviewQuestion = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview question ID",
      });
    }

    const question = await InterviewQuestion.findById(
      req.params.id
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    question.isActive = false;
    await question.save();

    return res.status(200).json({
      success: true,
      message: "Interview question deactivated successfully",
      question,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      "Failed to deactivate interview question"
    );
  }
};

module.exports = {
  createInterviewQuestion,
  getAllInterviewQuestions,
  getInterviewQuestionById,
  updateInterviewQuestion,
  deactivateInterviewQuestion,
};
