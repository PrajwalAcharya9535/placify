const CodingProblem = require("../../models/CodingProblem");
const CodingAttempt = require("../../models/CodingAttempt");

const {
  executeCode,
} = require("../../services/codeExecutionService");

// ==============================
// NORMALIZE PROGRAM OUTPUT
// ==============================
const normalizeOutput = (output) => {
  return String(output || "")
    .replace(/\r\n/g, "\n")
    .trim();
};

// ==============================
// GET ALL CODING PROBLEMS
// ==============================
const getCodingProblems = async (req, res) => {
  try {
    const {
      difficulty,
      category,
      language,
      search,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (category) {
      filter.category = category;
    }

    if (language) {
      filter.supportedLanguages = language;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const problems = await CodingProblem.find(filter)
      .select(
        "title description difficulty category supportedLanguages sampleInput sampleOutput marks timeLimitSeconds skillsCovered companyTags createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Coding problems fetched successfully",
      totalProblems: problems.length,
      problems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch coding problems",
      error: error.message,
    });
  }
};

// ==============================
// GET CODING PROBLEM BY ID
// ==============================
const getCodingProblemById = async (req, res) => {
  try {
    const problem = await CodingProblem.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Coding problem not found",
      });
    }

    const publicTestCases = problem.testCases
      .filter((testCase) => !testCase.isHidden)
      .map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
      }));

    res.status(200).json({
      message: "Coding problem fetched successfully",

      problem: {
        _id: problem._id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category,
        supportedLanguages: problem.supportedLanguages,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        sampleInput: problem.sampleInput,
        sampleOutput: problem.sampleOutput,
        testCases: publicTestCases,
        marks: problem.marks,
        timeLimitSeconds: problem.timeLimitSeconds,
        skillsCovered: problem.skillsCovered,
        companyTags: problem.companyTags,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch coding problem",
      error: error.message,
    });
  }
};

// ==============================
// SUBMIT CODING ATTEMPT
// REAL CODE EXECUTION
// ==============================
const submitCodingAttempt = async (req, res) => {
  try {
    const {
      problemId,
      language,
      sourceCode,
    } = req.body;

    // ==============================
    // VALIDATION
    // ==============================
    if (!problemId || !language || !sourceCode) {
      return res.status(400).json({
        message:
          "Problem ID, language and source code are required",
      });
    }

    const problem = await CodingProblem.findOne({
      _id: problemId,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Coding problem not found",
      });
    }

    if (
      !problem.supportedLanguages.includes(language)
    ) {
      return res.status(400).json({
        message:
          "Selected language is not supported for this problem",
      });
    }

    if (
      !problem.testCases ||
      problem.testCases.length === 0
    ) {
      return res.status(400).json({
        message:
          "No test cases are configured for this problem",
      });
    }

    // ==============================
    // EXECUTE ALL TEST CASES
    // ==============================
    let passedTestCases = 0;
    let failedTestCases = 0;
    let totalExecutionTimeMs = 0;

    let finalStatus = "Accepted";
    let finalErrorMessage = "";

    const publicResults = [];

    for (const testCase of problem.testCases) {
      const executionResult = await executeCode({
        language,
        sourceCode,
        input: testCase.input || "",
        timeLimitSeconds:
          problem.timeLimitSeconds || 5,
      });

      totalExecutionTimeMs +=
        executionResult.executionTimeMs || 0;

      // ==============================
      // HANDLE EXECUTION ERROR
      // ==============================
      if (
        executionResult.status !== "Accepted"
      ) {
        failedTestCases++;

        if (finalStatus === "Accepted") {
          finalStatus = executionResult.status;
          finalErrorMessage =
            executionResult.errorMessage || "";
        }

        // Only expose public test case results
        if (!testCase.isHidden) {
          publicResults.push({
            input: testCase.input,
            expectedOutput:
              testCase.expectedOutput,
            actualOutput:
              executionResult.output || "",
            passed: false,
            status: executionResult.status,
            errorMessage:
              executionResult.errorMessage || "",
          });
        }

        continue;
      }

      // ==============================
      // COMPARE OUTPUT
      // ==============================
      const actualOutput = normalizeOutput(
        executionResult.output
      );

      const expectedOutput = normalizeOutput(
        testCase.expectedOutput
      );

      const passed =
        actualOutput === expectedOutput;

      if (passed) {
        passedTestCases++;
      } else {
        failedTestCases++;

        if (finalStatus === "Accepted") {
          finalStatus = "Wrong Answer";
        }
      }

      // Hidden test case details are NEVER returned
      if (!testCase.isHidden) {
        publicResults.push({
          input: testCase.input,
          expectedOutput:
            testCase.expectedOutput,
          actualOutput:
            executionResult.output || "",
          passed,
          status: passed
            ? "Accepted"
            : "Wrong Answer",
          errorMessage: "",
        });
      }
    }

    // ==============================
    // CALCULATE SCORE
    // ==============================
    const totalTestCases =
      problem.testCases.length;

    const scorePercentage =
      totalTestCases > 0
        ? Math.round(
            (passedTestCases /
              totalTestCases) *
              100
          )
        : 0;

    const marksAwarded =
      totalTestCases > 0
        ? Math.round(
            (problem.marks *
              passedTestCases) /
              totalTestCases
          )
        : 0;

    // If every test passed
    if (
      passedTestCases === totalTestCases
    ) {
      finalStatus = "Accepted";
      finalErrorMessage = "";
    } else if (
      finalStatus === "Accepted"
    ) {
      finalStatus = "Wrong Answer";
    }

    // ==============================
    // SAVE CODING ATTEMPT
    // ==============================
    const attempt = await CodingAttempt.create({
      user: req.user.id,
      problem: problem._id,
      language,
      sourceCode,

      status: finalStatus,

      totalTestCases,

      passedTestCases,
      failedTestCases,

      marksAwarded,
      totalMarks: problem.marks,

      scorePercentage,

      executionTimeMs:
        totalExecutionTimeMs,

      errorMessage:
        finalErrorMessage,
    });

    // ==============================
    // RESPONSE
    // ==============================
    res.status(201).json({
      message:
        "Coding attempt evaluated successfully",

      attempt: {
        attemptId: attempt._id,

        problemId: problem._id,

        title: problem.title,

        language:
          attempt.language,

        status:
          attempt.status,

        totalTestCases:
          attempt.totalTestCases,

        passedTestCases:
          attempt.passedTestCases,

        failedTestCases:
          attempt.failedTestCases,

        marksAwarded:
          attempt.marksAwarded,

        totalMarks:
          attempt.totalMarks,

        scorePercentage:
          attempt.scorePercentage,

        executionTimeMs:
          attempt.executionTimeMs,

        errorMessage:
          attempt.errorMessage,

        submittedAt:
          attempt.submittedAt,
      },

      // Only public test cases
      testResults: publicResults,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to submit coding attempt",
      error: error.message,
    });
  }
};

// ==============================
// GET CODING ATTEMPT HISTORY
// ==============================
const getCodingHistory = async (req, res) => {
  try {
    const attempts = await CodingAttempt.find({
      user: req.user.id,
    })
      .populate(
        "problem",
        "title difficulty category marks"
      )
      .select("-sourceCode")
      .sort({ submittedAt: -1 });

    const totalAttempts = attempts.length;

    const acceptedAttempts = attempts.filter(
      (attempt) =>
        attempt.status === "Accepted"
    ).length;

    const averageScore =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce(
              (total, attempt) =>
                total +
                (attempt.scorePercentage || 0),
              0
            ) / totalAttempts
          )
        : 0;

    res.status(200).json({
      message:
        "Coding attempt history fetched successfully",

      summary: {
        totalAttempts,
        acceptedAttempts,
        averageScore,
      },

      attempts,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch coding attempt history",
      error: error.message,
    });
  }
};

module.exports = {
  getCodingProblems,
  getCodingProblemById,
  submitCodingAttempt,
  getCodingHistory,
};