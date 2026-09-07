const CodingProblem = require("../../models/CodingProblem");

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

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Title, description and category are required",
      });
    }

    if (
      !Array.isArray(supportedLanguages) ||
      supportedLanguages.length === 0
    ) {
      return res.status(400).json({
        message: "At least one supported language is required",
      });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        message: "At least one test case is required",
      });
    }

    const invalidTestCase = testCases.some(
      (testCase) =>
        testCase.expectedOutput === undefined ||
        testCase.expectedOutput === null
    );

    if (invalidTestCase) {
      return res.status(400).json({
        message: "Every test case must have expectedOutput",
      });
    }

    const codingProblem = await CodingProblem.create({
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
    });

    res.status(201).json({
      message: "Coding problem created successfully",
      codingProblem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create coding problem",
      error: error.message,
    });
  }
};

module.exports = {
  createCodingProblem,
};