const SqlProblem = require("../../models/SqlProblem");
const SqlAttempt = require("../../models/SqlAttempt");

const {
  executeSql,
} = require("../../services/sqlExecutionService");

// ==============================
// NORMALIZE SQL RESULT
// ==============================
const normalizeResult = (result) => {
  if (!Array.isArray(result)) {
    return [];
  }

  return result.map((row) => {
    const normalizedRow = {};

    Object.keys(row)
      .sort()
      .forEach((key) => {
        normalizedRow[key] = row[key];
      });

    return normalizedRow;
  });
};

// ==============================
// COMPARE SQL RESULTS
// ==============================
const compareResults = (
  actualResult,
  expectedResult
) => {
  const actual = normalizeResult(actualResult);
  const expected = normalizeResult(expectedResult);

  return (
    JSON.stringify(actual) ===
    JSON.stringify(expected)
  );
};

// ==============================
// GET ALL SQL PROBLEMS
// ==============================
const getSqlProblems = async (req, res) => {
  try {
    const {
      difficulty,
      category,
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

    const problems = await SqlProblem.find(filter)
      .select(
        "title description difficulty category marks timeLimitSeconds skillsCovered companyTags createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "SQL problems fetched successfully",
      totalProblems: problems.length,
      problems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch SQL problems",
      error: error.message,
    });
  }
};

// ==============================
// GET SQL PROBLEM BY ID
// ==============================
const getSqlProblemById = async (req, res) => {
  try {
    const problem = await SqlProblem.findOne({
      _id: req.params.id,
      isActive: true,
    }).select("-expectedResult");

    if (!problem) {
      return res.status(404).json({
        message: "SQL problem not found",
      });
    }

    res.status(200).json({
      message: "SQL problem fetched successfully",
      problem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch SQL problem",
      error: error.message,
    });
  }
};

// ==============================
// SUBMIT SQL ATTEMPT
// ==============================
const submitSqlAttempt = async (req, res) => {
  try {
    const {
      problemId,
      submittedQuery,
    } = req.body;

    if (!problemId || !submittedQuery) {
      return res.status(400).json({
        message:
          "Problem ID and SQL query are required",
      });
    }

    const problem = await SqlProblem.findOne({
      _id: problemId,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        message: "SQL problem not found",
      });
    }

    const executionResult = await executeSql({
      tables: problem.tables,
      query: submittedQuery,
    });

    // Query failed to execute
    if (!executionResult.success) {
      const attempt = await SqlAttempt.create({
        user: req.user.id,
        problem: problem._id,
        submittedQuery,

        status:
          executionResult.status === "Query Error"
            ? "Query Error"
            : "Execution Error",

        marksAwarded: 0,
        totalMarks: problem.marks,
        scorePercentage: 0,

        executionTimeMs:
          executionResult.executionTimeMs || 0,

        errorMessage:
          executionResult.errorMessage || "",
      });

      return res.status(201).json({
        message:
          "SQL attempt evaluated successfully",

        attempt: {
          attemptId: attempt._id,
          problemId: problem._id,
          title: problem.title,

          status: attempt.status,

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

        result: [],
      });
    }

    // Compare student's result
    // with expected server-side result
    const isCorrect = compareResults(
      executionResult.result,
      problem.expectedResult
    );

    const status = isCorrect
      ? "Correct"
      : "Wrong Answer";

    const marksAwarded = isCorrect
      ? problem.marks
      : 0;

    const scorePercentage = isCorrect
      ? 100
      : 0;

    const attempt = await SqlAttempt.create({
      user: req.user.id,
      problem: problem._id,
      submittedQuery,
      status,
      marksAwarded,
      totalMarks: problem.marks,
      scorePercentage,
      executionTimeMs:
        executionResult.executionTimeMs,
      errorMessage: "",
    });

    res.status(201).json({
      message:
        "SQL attempt evaluated successfully",

      attempt: {
        attemptId: attempt._id,
        problemId: problem._id,
        title: problem.title,

        status: attempt.status,

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

      result: executionResult.result,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to submit SQL attempt",
      error: error.message,
    });
  }
};

// ==============================
// GET SQL ATTEMPT HISTORY
// ==============================
const getSqlHistory = async (req, res) => {
  try {
    const attempts = await SqlAttempt.find({
      user: req.user.id,
    })
      .populate(
        "problem",
        "title difficulty category marks"
      )
      .sort({ submittedAt: -1 });

    const totalAttempts = attempts.length;

    const correctAttempts = attempts.filter(
      (attempt) => attempt.status === "Correct"
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
        "SQL attempt history fetched successfully",

      summary: {
        totalAttempts,
        correctAttempts,
        averageScore,
      },

      attempts,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch SQL attempt history",
      error: error.message,
    });
  }
};

module.exports = {
  getSqlProblems,
  getSqlProblemById,
  submitSqlAttempt,
  getSqlHistory,
};