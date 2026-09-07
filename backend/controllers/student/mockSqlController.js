const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");
const SqlProblem = require("../../models/SqlProblem");
const SqlAttempt = require("../../models/SqlAttempt");

const {
  executeSql,
} = require("../../services/sqlExecutionService");

// ==============================
// NORMALIZE SQL RESULT
// ==============================
const normalizeRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
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
  actualRows,
  expectedRows
) => {
  const actual =
    normalizeRows(actualRows);

  const expected =
    normalizeRows(expectedRows);

  return (
    JSON.stringify(actual) ===
    JSON.stringify(expected)
  );
};

// ==============================
// FIND SQL PROBLEM FOR MOCK
// ==============================
const findMockSqlProblem = async (
  mockTest
) => {
  let problem = null;

  // Prefer company-specific SQL problem
  if (mockTest.companyName) {
    problem =
      await SqlProblem.findOne({
        isActive: true,
        companyTags:
          mockTest.companyName,
      });
  }

  // Fallback to any active SQL problem
  if (!problem) {
    problem =
      await SqlProblem.findOne({
        isActive: true,
      });
  }

  return problem;
};

// ==============================
// GET CURRENT MOCK SQL PROBLEM
// ==============================
const getCurrentMockSqlProblem =
  async (req, res) => {
    try {
      // ==============================
      // ACTIVE MOCK ATTEMPT
      // ==============================
      const mockAttempt =
        await MockAttempt.findOne({
          _id: req.params.attemptId,
          user: req.user.id,
          status: "In Progress",
        });

      if (!mockAttempt) {
        return res.status(404).json({
          message:
            "Active mock placement attempt not found",
        });
      }

      // ==============================
      // MOCK TEST
      // ==============================
      const mockTest =
        await MockTest.findById(
          mockAttempt.mockTest
        );

      if (!mockTest) {
        return res.status(404).json({
          message:
            "Mock placement test not found",
        });
      }

      // ==============================
      // CURRENT ROUND
      // ==============================
      const currentRound =
        mockAttempt.roundResults[
          mockAttempt.currentRoundIndex
        ];

      if (!currentRound) {
        return res.status(400).json({
          message:
            "Current mock round not found",
        });
      }

      if (
        currentRound.roundType !==
        "SQL"
      ) {
        return res.status(400).json({
          message:
            "Current mock placement round is not an SQL round",
        });
      }

      // ==============================
      // ROUND CONFIG
      // ==============================
      const roundConfig =
        mockTest.rounds.find(
          (round) =>
            round.order ===
            currentRound.order
        );

      if (!roundConfig) {
        return res.status(400).json({
          message:
            "Mock SQL round configuration not found",
        });
      }

      // ==============================
      // SQL PROBLEM
      // ==============================
      const problem =
        await findMockSqlProblem(
          mockTest
        );

      if (!problem) {
        return res.status(404).json({
          message:
            "No active SQL problem is available for this mock round",
        });
      }

      // ==============================
      // SAFE RESPONSE
      // ==============================
      res.status(200).json({
        message:
          "Current mock SQL problem fetched successfully",

        round: {
          roundName:
            currentRound.roundName,

          roundType:
            currentRound.roundType,

          order:
            currentRound.order,

          durationMinutes:
            roundConfig.durationMinutes,

          totalMarks:
            currentRound.totalMarks,
        },

        problem: {
          _id:
            problem._id,

          title:
            problem.title,

          description:
            problem.description,

          difficulty:
            problem.difficulty,

          category:
            problem.category,

          // Safe table structure and data
          tables:
            problem.tables,

          marks:
            currentRound.totalMarks,

          timeLimitSeconds:
            problem.timeLimitSeconds,

          skillsCovered:
            problem.skillsCovered,

          companyTags:
            problem.companyTags,
        },
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch current mock SQL problem",
        error: error.message,
      });
    }
  };

// ==============================
// SUBMIT MOCK SQL ATTEMPT
// ==============================
const submitMockSqlAttempt =
  async (req, res) => {
    try {
      const {
        problemId,
        query,
      } = req.body;

      // ==============================
      // BASIC VALIDATION
      // ==============================
      if (
        !problemId ||
        !query ||
        String(query).trim() === ""
      ) {
        return res.status(400).json({
          message:
            "Problem ID and SQL query are required",
        });
      }

      // ==============================
      // ACTIVE MOCK ATTEMPT
      // ==============================
      const mockAttempt =
        await MockAttempt.findOne({
          _id: req.params.attemptId,
          user: req.user.id,
          status: "In Progress",
        });

      if (!mockAttempt) {
        return res.status(404).json({
          message:
            "Active mock placement attempt not found",
        });
      }

      // ==============================
      // MOCK TEST
      // ==============================
      const mockTest =
        await MockTest.findById(
          mockAttempt.mockTest
        );

      if (!mockTest) {
        return res.status(404).json({
          message:
            "Mock placement test not found",
        });
      }

      // ==============================
      // CURRENT ROUND
      // ==============================
      const currentRound =
        mockAttempt.roundResults[
          mockAttempt.currentRoundIndex
        ];

      if (!currentRound) {
        return res.status(400).json({
          message:
            "Current mock round not found",
        });
      }

      if (
        currentRound.roundType !==
        "SQL"
      ) {
        return res.status(400).json({
          message:
            "Current mock placement round is not an SQL round",
        });
      }

      if (currentRound.completedAt) {
        return res.status(400).json({
          message:
            "Current SQL round is already completed",
        });
      }

      // ==============================
      // ASSIGNED SQL PROBLEM
      // ==============================
      const assignedProblem =
        await findMockSqlProblem(
          mockTest
        );

      if (!assignedProblem) {
        return res.status(404).json({
          message:
            "No SQL problem is available for this mock round",
        });
      }

      if (
        assignedProblem._id.toString() !==
        problemId.toString()
      ) {
        return res.status(400).json({
          message:
            "This SQL problem is not assigned to the current mock round",
        });
      }

      const problem =
        assignedProblem;

      // ==============================
      // EXECUTE STUDENT QUERY
      // ==============================
      const executionResult =
        await executeSql({
          tables:
            problem.tables,

          query:
            String(query).trim(),
        });

      // ==============================
      // HANDLE EXECUTION FAILURE
      // ==============================
      if (
        !executionResult.success
      ) {
        const sqlAttempt =
          await SqlAttempt.create({
            user:
              req.user.id,

            problem:
              problem._id,

            mockAttempt:
              mockAttempt._id,

            mockTest:
              mockTest._id,

            mockRoundName:
              currentRound.roundName,

            isMockAttempt: true,

            submittedQuery:
              query,

            status:
              executionResult.status ===
              "Query Error"
                ? "Query Error"
                : "Execution Error",

            marksAwarded: 0,

            totalMarks:
              currentRound.totalMarks,

            scorePercentage: 0,

            executionTimeMs:
              executionResult.executionTimeMs ||
              0,

            errorMessage:
              executionResult.errorMessage ||
              "",
          });

        return res.status(400).json({
          message:
            executionResult.errorMessage ||
            "SQL query execution failed",

          attempt: {
            attemptId:
              sqlAttempt._id,

            status:
              sqlAttempt.status,

            marksAwarded: 0,

            totalMarks:
              currentRound.totalMarks,

            scorePercentage: 0,

            executionTimeMs:
              sqlAttempt.executionTimeMs,

            errorMessage:
              sqlAttempt.errorMessage,
          },
        });
      }

      // ==============================
      // ACTUAL RESULT
      // ==============================
      const actualRows =
        executionResult.result || [];

      // ==============================
      // EXPECTED RESULT
      // ==============================
      const expectedRows =
        problem.expectedResult || [];

      // ==============================
      // COMPARE RESULTS
      // ==============================
      const isCorrect =
        compareResults(
          actualRows,
          expectedRows
        );

      const scorePercentage =
        isCorrect ? 100 : 0;

      const marksAwarded =
        isCorrect
          ? currentRound.totalMarks
          : 0;

      const status =
        isCorrect
          ? "Correct"
          : "Wrong Answer";

      // ==============================
      // SAVE SQL ATTEMPT
      // ==============================
      const sqlAttempt =
        await SqlAttempt.create({
          user:
            req.user.id,

          problem:
            problem._id,

          mockAttempt:
            mockAttempt._id,

          mockTest:
            mockTest._id,

          mockRoundName:
            currentRound.roundName,

          isMockAttempt: true,

          submittedQuery:
            query,

          status,

          marksAwarded,

          totalMarks:
            currentRound.totalMarks,

          scorePercentage,

          executionTimeMs:
            executionResult.executionTimeMs ||
            0,

          errorMessage: "",
        });

      // ==============================
      // SAFE RESPONSE
      // ==============================
      res.status(201).json({
        message:
          "Mock SQL attempt evaluated successfully",

        round: {
          roundName:
            currentRound.roundName,

          roundType:
            currentRound.roundType,

          totalMarks:
            currentRound.totalMarks,
        },

        attempt: {
          attemptId:
            sqlAttempt._id,

          problemId:
            problem._id,

          title:
            problem.title,

          status:
            sqlAttempt.status,

          marksAwarded:
            sqlAttempt.marksAwarded,

          totalMarks:
            sqlAttempt.totalMarks,

          scorePercentage:
            sqlAttempt.scorePercentage,

          executionTimeMs:
            sqlAttempt.executionTimeMs,

          submittedAt:
            sqlAttempt.submittedAt,
        },

        result:
          actualRows,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit mock SQL attempt",
        error: error.message,
      });
    }
  };

module.exports = {
  getCurrentMockSqlProblem,
  submitMockSqlAttempt,
};