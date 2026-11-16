
const mongoose = require("mongoose");
const DebuggingProblem = require("../../models/DebuggingProblem");

// ==============================
// VALIDATION
// ==============================

const validateDebuggingProblem = (data) => {
  const requiredFields = [
    "title",
    "description",
    "category",
    "language",
    "buggyCode",
  ];

  for (const field of requiredFields) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  if (
    !Array.isArray(data.testCases) ||
    data.testCases.length === 0
  ) {
    return "At least one debugging test case is required";
  }

  for (const testCase of data.testCases) {
    if (
      !testCase ||
      typeof testCase.expectedOutput !== "string" ||
      !testCase.expectedOutput.trim()
    ) {
      return "Every test case requires an expected output";
    }
  }

  return null;
};

// ==============================
// CREATE DEBUGGING PROBLEM
// ==============================

const createDebuggingProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty = "Easy",
      category,
      language,
      buggyCode,
      bugDescription = "",
      expectedFixedCode = "",
      inputFormat = "",
      outputFormat = "",
      constraints = "",
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
      language,
      buggyCode,
      bugDescription,
      expectedFixedCode,
      inputFormat,
      outputFormat,
      constraints,
      testCases,
      marks,
      timeLimitSeconds,
      skillsCovered,
      companyTags,
      isActive,
    };

    const validationError = validateDebuggingProblem(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const debuggingProblem = await DebuggingProblem.create(payload);

    return res.status(201).json({
      success: true,
      message: "Debugging problem created successfully",
      debuggingProblem,
    });
  } catch (error) {
    return res
      .status(error.name === "ValidationError" ? 400 : 500)
      .json({
        success: false,
        message: "Failed to create debugging problem",
        error: error.message,
      });
  }
};

// ==============================
// GET ALL DEBUGGING PROBLEMS
// ==============================

const getAllDebuggingProblems = async (req, res) => {
  try {
    const {
      difficulty,
      category,
      language,
      isActive,
      search,
    } = req.query;

    const filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (language) filter.language = language;

    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (typeof search === "string" && search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.title = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const debuggingProblems = await DebuggingProblem.find(filter)
      .select("-expectedFixedCode -testCases")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalProblems: debuggingProblems.length,
      debuggingProblems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch debugging problems",
      error: error.message,
    });
  }
};

// ==============================
// GET DEBUGGING PROBLEM BY ID
// ==============================

const getDebuggingProblemById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid debugging problem ID",
      });
    }

    const debuggingProblem = await DebuggingProblem.findById(
      req.params.id
    );

    if (!debuggingProblem) {
      return res.status(404).json({
        success: false,
        message: "Debugging problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      debuggingProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch debugging problem",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE DEBUGGING PROBLEM
// ==============================

const updateDebuggingProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid debugging problem ID",
      });
    }

    const debuggingProblem = await DebuggingProblem.findById(
      req.params.id
    );

    if (!debuggingProblem) {
      return res.status(404).json({
        success: false,
        message: "Debugging problem not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "difficulty",
      "category",
      "language",
      "buggyCode",
      "bugDescription",
      "expectedFixedCode",
      "inputFormat",
      "outputFormat",
      "constraints",
      "testCases",
      "marks",
      "timeLimitSeconds",
      "skillsCovered",
      "companyTags",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        debuggingProblem[field] = req.body[field];
      }
    }

    const validationError = validateDebuggingProblem(
      debuggingProblem.toObject()
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    await debuggingProblem.save();

    return res.status(200).json({
      success: true,
      message: "Debugging problem updated successfully",
      debuggingProblem,
    });
  } catch (error) {
    return res
      .status(error.name === "ValidationError" ? 400 : 500)
      .json({
        success: false,
        message: "Failed to update debugging problem",
        error: error.message,
      });
  }
};

// ==============================
// DEACTIVATE DEBUGGING PROBLEM
// ==============================

const deactivateDebuggingProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid debugging problem ID",
      });
    }

    const debuggingProblem = await DebuggingProblem.findById(
      req.params.id
    );

    if (!debuggingProblem) {
      return res.status(404).json({
        success: false,
        message: "Debugging problem not found",
      });
    }

    debuggingProblem.isActive = false;
    await debuggingProblem.save();

    return res.status(200).json({
      success: true,
      message: "Debugging problem deactivated successfully",
      debuggingProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate debugging problem",
      error: error.message,
    });
  }
};

module.exports = {
  createDebuggingProblem,
  getAllDebuggingProblems,
  getDebuggingProblemById,
  updateDebuggingProblem,
  deactivateDebuggingProblem,
};
