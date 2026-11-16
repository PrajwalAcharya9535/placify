
const mongoose = require("mongoose");
const CodingProblem = require("../../models/CodingProblem");

// ==============================
// VALIDATION
// ==============================

const validateCodingProblem = (data) => {
  if (
    !data.title?.trim() ||
    !data.description?.trim() ||
    !data.category?.trim()
  ) {
    return "Title, description and category are required";
  }

  if (
    !Array.isArray(data.supportedLanguages) ||
    data.supportedLanguages.length === 0
  ) {
    return "At least one supported language is required";
  }

  const allowedLanguages = [
    "Java",
    "JavaScript",
    "Python",
    "C",
    "C++",
  ];

  if (
    data.supportedLanguages.some(
      (language) => !allowedLanguages.includes(language)
    )
  ) {
    return "Unsupported programming language";
  }

  if (
    !Array.isArray(data.testCases) ||
    data.testCases.length === 0
  ) {
    return "At least one test case is required";
  }

  if (
    data.testCases.some(
      (testCase) =>
        !testCase ||
        typeof testCase.expectedOutput !== "string"
    )
  ) {
    return "Every test case must have a valid expectedOutput";
  }

  return null;
};

// ==============================
// CREATE CODING PROBLEM
// ==============================

const createCodingProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty = "Easy",
      category,
      supportedLanguages = [],
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      testCases = [],
      marks = 10,
      timeLimitSeconds = 5,
      skillsCovered = [],
      companyTags = [],
      isActive = true,
    } = req.body;

    const payload = {
      title,
      description,
      difficulty,
      category,
      supportedLanguages,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      testCases,
      marks,
      timeLimitSeconds,
      skillsCovered,
      companyTags,
      isActive,
    };

    const validationError = validateCodingProblem(payload);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const codingProblem = await CodingProblem.create(payload);

    return res.status(201).json({
      success: true,
      message: "Coding problem created successfully",
      codingProblem,
    });
  } catch (error) {
    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      message: "Failed to create coding problem",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL CODING PROBLEMS
// ==============================

const getAllCodingProblems = async (req, res) => {
  try {
    const { difficulty, category, isActive, search } = req.query;

    const filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (search) {
      filter.title = {
        $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const codingProblems = await CodingProblem.find(filter)
      .select("-testCases")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalProblems: codingProblems.length,
      codingProblems,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch coding problems",
      error: error.message,
    });
  }
};

// ==============================
// GET SINGLE CODING PROBLEM
// ==============================

const getCodingProblemById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid coding problem ID",
      });
    }

    const codingProblem = await CodingProblem.findById(
      req.params.id
    );

    if (!codingProblem) {
      return res.status(404).json({
        message: "Coding problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      codingProblem,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch coding problem",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE CODING PROBLEM
// ==============================

const updateCodingProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid coding problem ID",
      });
    }

    const codingProblem = await CodingProblem.findById(
      req.params.id
    );

    if (!codingProblem) {
      return res.status(404).json({
        message: "Coding problem not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "difficulty",
      "category",
      "supportedLanguages",
      "inputFormat",
      "outputFormat",
      "constraints",
      "sampleInput",
      "sampleOutput",
      "testCases",
      "marks",
      "timeLimitSeconds",
      "skillsCovered",
      "companyTags",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        codingProblem[field] = req.body[field];
      }
    }

    const validationError = validateCodingProblem(
      codingProblem.toObject()
    );

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    await codingProblem.save();

    return res.status(200).json({
      success: true,
      message: "Coding problem updated successfully",
      codingProblem,
    });
  } catch (error) {
    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      message: "Failed to update coding problem",
      error: error.message,
    });
  }
};

// ==============================
// DEACTIVATE CODING PROBLEM
// ==============================

const deactivateCodingProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid coding problem ID",
      });
    }

    const codingProblem = await CodingProblem.findById(
      req.params.id
    );

    if (!codingProblem) {
      return res.status(404).json({
        message: "Coding problem not found",
      });
    }

    codingProblem.isActive = false;
    await codingProblem.save();

    return res.status(200).json({
      success: true,
      message: "Coding problem deactivated successfully",
      codingProblem,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to deactivate coding problem",
      error: error.message,
    });
  }
};

module.exports = {
  createCodingProblem,
  getAllCodingProblems,
  getCodingProblemById,
  updateCodingProblem,
  deactivateCodingProblem,
};
