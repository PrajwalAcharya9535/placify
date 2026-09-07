const DebuggingProblem = require("../../models/DebuggingProblem");

// ==============================
// CREATE DEBUGGING PROBLEM
// ==============================
const createDebuggingProblem = async (req, res) => {
  try {
    const {
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
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !language ||
      !buggyCode
    ) {
      return res.status(400).json({
        message:
          "Title, description, category, language and buggy code are required",
      });
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({
        message:
          "At least one debugging test case is required",
      });
    }

    const debuggingProblem =
      await DebuggingProblem.create({
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
      });

    res.status(201).json({
      message:
        "Debugging problem created successfully",
      debuggingProblem,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to create debugging problem",
      error: error.message,
    });
  }
};

module.exports = {
  createDebuggingProblem,
};