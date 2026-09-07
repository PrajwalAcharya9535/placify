const DebuggingProblem = require("../../models/DebuggingProblem");
const DebuggingAttempt = require("../../models/DebuggingAttempt");

const {
  executeCode,
} = require("../../services/codeExecutionService");

// ==============================
// GET ALL DEBUGGING PROBLEMS
// ==============================
const getDebuggingProblems = async (req, res) => {
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
      filter.language = language;
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

    const problems = await DebuggingProblem.find(filter)
      .select(
        "title description difficulty category language marks timeLimitSeconds skillsCovered companyTags createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Debugging problems fetched successfully",
      totalProblems: problems.length,
      problems,
    });
  } catch (error) {
    res.status(500).json({
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
    const problem = await DebuggingProblem.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Debugging problem not found",
      });
    }

    const publicTestCases = problem.testCases
      .filter((testCase) => !testCase.isHidden)
      .map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
      }));

    res.status(200).json({
      message: "Debugging problem fetched successfully",

      problem: {
        _id: problem._id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category,
        language: problem.language,

        buggyCode: problem.buggyCode,

        bugDescription: problem.bugDescription,

        inputFormat: problem.inputFormat,

        outputFormat: problem.outputFormat,

        constraints: problem.constraints,

        testCases: publicTestCases,

        marks: problem.marks,

        timeLimitSeconds: problem.timeLimitSeconds,

        skillsCovered: problem.skillsCovered,

        companyTags: problem.companyTags,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch debugging problem",
      error: error.message,
    });
  }
};

// ==============================
// SUBMIT DEBUGGING ATTEMPT
// ==============================
const submitDebuggingAttempt = async (req, res) => {
  try {
    const {
      problemId,
      fixedCode,
    } = req.body;

    if (!problemId || !fixedCode) {
      return res.status(400).json({
        message: "Problem ID and fixed code are required",
      });
    }

    const problem = await DebuggingProblem.findOne({
      _id: problemId,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Debugging problem not found",
      });
    }

    const testCases = problem.testCases || [];

    if (testCases.length === 0) {
      return res.status(400).json({
        message: "No test cases available for this debugging problem",
      });
    }

    let passedTestCases = 0;
    let failedTestCases = 0;

    let finalStatus = "Accepted";
    let errorMessage = "";

    let totalExecutionTimeMs = 0;

    for (const testCase of testCases) {
      const executionResult = await executeCode({
        language: problem.language,
        sourceCode: fixedCode,
        input: testCase.input || "",
        timeLimitSeconds: problem.timeLimitSeconds,
      });

      totalExecutionTimeMs +=
        executionResult.executionTimeMs || 0;

      if (!executionResult.success) {
        finalStatus =
          executionResult.status || "Execution Error";

        errorMessage =
          executionResult.errorMessage || "";

        failedTestCases =
          testCases.length - passedTestCases;

        break;
      }

      const actualOutput = String(
        executionResult.output || ""
      ).trim();

      const expectedOutput = String(
        testCase.expectedOutput || ""
      ).trim();

      if (actualOutput === expectedOutput) {
        passedTestCases++;
      } else {
        failedTestCases++;
        finalStatus = "Wrong Answer";
      }
    }

    const totalTestCases = testCases.length;

    if (passedTestCases === totalTestCases) {
      finalStatus = "Accepted";
      failedTestCases = 0;
    }

    const scorePercentage =
      totalTestCases > 0
        ? Math.round(
            (passedTestCases / totalTestCases) * 100
          )
        : 0;

    const marksAwarded =
      finalStatus === "Accepted"
        ? problem.marks
        : 0;

    const attempt =
      await DebuggingAttempt.create({
        user: req.user.id,
        problem: problem._id,

        language: problem.language,

        fixedCode,

        status: finalStatus,

        totalTestCases,
        passedTestCases,
        failedTestCases,

        marksAwarded,
        totalMarks: problem.marks,

        scorePercentage,

        executionTimeMs: totalExecutionTimeMs,

        errorMessage,
      });

    res.status(201).json({
      message: "Debugging attempt evaluated successfully",

      attempt: {
        _id: attempt._id,

        problemId: problem._id,

        status: attempt.status,

        totalTestCases: attempt.totalTestCases,

        passedTestCases: attempt.passedTestCases,

        failedTestCases: attempt.failedTestCases,

        marksAwarded: attempt.marksAwarded,

        totalMarks: attempt.totalMarks,

        scorePercentage: attempt.scorePercentage,

        executionTimeMs: attempt.executionTimeMs,

        errorMessage: attempt.errorMessage,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit debugging attempt",
      error: error.message,
    });
  }
};

// ==============================
// GET DEBUGGING ATTEMPT HISTORY
// ==============================
const getDebuggingHistory = async (req, res) => {
  try {
    const attempts = await DebuggingAttempt.find({
      user: req.user.id,
    })
      .populate(
        "problem",
        "title difficulty category language marks"
      )
      .select("-fixedCode")
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
        "Debugging attempt history fetched successfully",

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
        "Failed to fetch debugging attempt history",
      error: error.message,
    });
  }
};

module.exports = {
  getDebuggingProblems,
  getDebuggingProblemById,
  submitDebuggingAttempt,
  getDebuggingHistory,
};