const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");
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
// FIND CODING PROBLEM FOR MOCK
// ==============================
const findMockCodingProblem = async (
  mockTest
) => {
  let problem = null;

  // Prefer company-specific problem
  if (mockTest.companyName) {
    problem =
      await CodingProblem.findOne({
        isActive: true,
        companyTags:
          mockTest.companyName,
      });
  }

  // Fallback to any active problem
  if (!problem) {
    problem =
      await CodingProblem.findOne({
        isActive: true,
      });
  }

  return problem;
};

// ==============================
// GET CURRENT MOCK CODING PROBLEM
// ==============================
const getCurrentMockCodingProblem =
  async (req, res) => {
    try {
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
        "Coding"
      ) {
        return res.status(400).json({
          message:
            "Current mock placement round is not a Coding round",
        });
      }

      // ==============================
      // ROUND CONFIGURATION
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
            "Mock coding round configuration not found",
        });
      }

      // ==============================
      // CODING PROBLEM
      // ==============================
      const problem =
        await findMockCodingProblem(
          mockTest
        );

      if (!problem) {
        return res.status(404).json({
          message:
            "No active coding problem is available for this mock round",
        });
      }

      // ==============================
      // PUBLIC TEST CASES ONLY
      // ==============================
      const publicTestCases =
        problem.testCases
          ?.filter(
            (testCase) =>
              !testCase.isHidden
          )
          .map((testCase) => ({
            input: testCase.input,
            expectedOutput:
              testCase.expectedOutput,
          })) || [];

      // ==============================
      // SAFE RESPONSE
      // ==============================
      res.status(200).json({
        message:
          "Current mock coding problem fetched successfully",

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
          _id: problem._id,

          title: problem.title,

          description:
            problem.description,

          difficulty:
            problem.difficulty,

          category:
            problem.category,

          supportedLanguages:
            problem.supportedLanguages,

          inputFormat:
            problem.inputFormat,

          outputFormat:
            problem.outputFormat,

          constraints:
            problem.constraints,

          sampleInput:
            problem.sampleInput,

          sampleOutput:
            problem.sampleOutput,

          testCases:
            publicTestCases,

          // Mock round marks
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
          "Failed to fetch current mock coding problem",
        error: error.message,
      });
    }
  };

// ==============================
// SUBMIT MOCK CODING ATTEMPT
// ==============================
const submitMockCodingAttempt =
  async (req, res) => {
    try {
      const {
        problemId,
        language,
        sourceCode,
      } = req.body;

      // ==============================
      // BASIC VALIDATION
      // ==============================
      if (
        !problemId ||
        !language ||
        !sourceCode ||
        String(sourceCode).trim() === ""
      ) {
        return res.status(400).json({
          message:
            "Problem ID, language and source code are required",
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
        "Coding"
      ) {
        return res.status(400).json({
          message:
            "Current mock placement round is not a Coding round",
        });
      }

      if (currentRound.completedAt) {
        return res.status(400).json({
          message:
            "Current Coding round is already completed",
        });
      }

      // ==============================
      // ROUND CONFIGURATION
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
            "Mock coding round configuration not found",
        });
      }

      // ==============================
      // ASSIGNED CODING PROBLEM
      // ==============================
      const assignedProblem =
        await findMockCodingProblem(
          mockTest
        );

      if (!assignedProblem) {
        return res.status(404).json({
          message:
            "No coding problem is available for this mock round",
        });
      }

      // Prevent student from submitting
      // a different CodingProblem ID.
      if (
        assignedProblem._id.toString() !==
        problemId.toString()
      ) {
        return res.status(400).json({
          message:
            "This coding problem is not assigned to the current mock round",
        });
      }

      const problem =
        assignedProblem;

      // ==============================
      // LANGUAGE VALIDATION
      // ==============================
      if (
        !problem.supportedLanguages.includes(
          language
        )
      ) {
        return res.status(400).json({
          message:
            "Selected language is not supported for this coding problem",
        });
      }

      // ==============================
      // TEST CASE VALIDATION
      // ==============================
      if (
        !problem.testCases ||
        problem.testCases.length === 0
      ) {
        return res.status(400).json({
          message:
            "No test cases are configured for this coding problem",
        });
      }

      // ==============================
      // EXECUTE ALL TEST CASES
      // ==============================
      let passedTestCases = 0;
      let failedTestCases = 0;
      let totalExecutionTimeMs = 0;

      let finalStatus =
        "Accepted";

      let finalErrorMessage = "";

      const publicResults = [];

      for (
        const testCase of
        problem.testCases
      ) {
        const executionResult =
          await executeCode({
            language,

            sourceCode,

            input:
              testCase.input || "",

            timeLimitSeconds:
              problem.timeLimitSeconds ||
              5,
          });

        totalExecutionTimeMs +=
          executionResult.executionTimeMs ||
          0;

        // ==============================
        // EXECUTION ERROR
        // ==============================
        if (
          executionResult.status !==
          "Accepted"
        ) {
          failedTestCases++;

          if (
            finalStatus ===
            "Accepted"
          ) {
            finalStatus =
              executionResult.status;

            finalErrorMessage =
              executionResult.errorMessage ||
              "";
          }

          // Do not expose hidden tests
          if (!testCase.isHidden) {
            publicResults.push({
              input:
                testCase.input,

              expectedOutput:
                testCase.expectedOutput,

              actualOutput:
                executionResult.output ||
                "",

              passed: false,

              status:
                executionResult.status,

              errorMessage:
                executionResult.errorMessage ||
                "",
            });
          }

          continue;
        }

        // ==============================
        // COMPARE OUTPUT
        // ==============================
        const actualOutput =
          normalizeOutput(
            executionResult.output
          );

        const expectedOutput =
          normalizeOutput(
            testCase.expectedOutput
          );

        const passed =
          actualOutput ===
          expectedOutput;

        if (passed) {
          passedTestCases++;
        } else {
          failedTestCases++;

          if (
            finalStatus ===
            "Accepted"
          ) {
            finalStatus =
              "Wrong Answer";
          }
        }

        // ==============================
        // PUBLIC TEST RESULT ONLY
        // ==============================
        if (!testCase.isHidden) {
          publicResults.push({
            input:
              testCase.input,

            expectedOutput:
              testCase.expectedOutput,

            actualOutput:
              executionResult.output ||
              "",

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

      /*
        IMPORTANT:

        Normal CodingProblem = 10 marks
        Mock Coding Round   = 20 marks

        Therefore we scale using the
        current mock round marks.
      */
      const marksAwarded =
        totalTestCases > 0
          ? Math.round(
              (currentRound.totalMarks *
                passedTestCases) /
                totalTestCases
            )
          : 0;

      // ==============================
      // FINAL STATUS
      // ==============================
      if (
        passedTestCases ===
        totalTestCases
      ) {
        finalStatus =
          "Accepted";

        finalErrorMessage = "";
      } else if (
        finalStatus ===
        "Accepted"
      ) {
        finalStatus =
          "Wrong Answer";
      }

      // ==============================
      // SAVE CODING ATTEMPT
      // ==============================
      const codingAttempt =
        await CodingAttempt.create({
          user: req.user.id,

          problem:
            problem._id,

          // Mock connection
          mockAttempt:
            mockAttempt._id,

          mockTest:
            mockTest._id,

          mockRoundName:
            currentRound.roundName,

          isMockAttempt: true,

          language,

          sourceCode,

          status:
            finalStatus,

          totalTestCases,

          passedTestCases,

          failedTestCases,

          marksAwarded,

          // Store MOCK round marks
          totalMarks:
            currentRound.totalMarks,

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
          "Mock coding attempt evaluated successfully",

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
            codingAttempt._id,

          problemId:
            problem._id,

          title:
            problem.title,

          language:
            codingAttempt.language,

          status:
            codingAttempt.status,

          totalTestCases:
            codingAttempt.totalTestCases,

          passedTestCases:
            codingAttempt.passedTestCases,

          failedTestCases:
            codingAttempt.failedTestCases,

          marksAwarded:
            codingAttempt.marksAwarded,

          totalMarks:
            codingAttempt.totalMarks,

          scorePercentage:
            codingAttempt.scorePercentage,

          executionTimeMs:
            codingAttempt.executionTimeMs,

          errorMessage:
            codingAttempt.errorMessage,

          submittedAt:
            codingAttempt.submittedAt,
        },

        // Hidden tests are never returned
        testResults:
          publicResults,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit mock coding attempt",
        error: error.message,
      });
    }
  };

module.exports = {
  getCurrentMockCodingProblem,
  submitMockCodingAttempt,
};