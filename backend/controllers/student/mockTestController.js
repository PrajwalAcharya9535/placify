const MockTest = require("../../models/MockTest");
const MockAttempt = require("../../models/MockAttempt");
const MockQuestionAttempt = require("../../models/MockQuestionAttempt");
const CodingAttempt = require("../../models/CodingAttempt");
const SqlAttempt = require("../../models/SqlAttempt");

// ==============================
// GET AVAILABLE MOCK TESTS
// ==============================
const getAvailableMockTests = async (req, res) => {
  try {
    const now = new Date();

    const mockTests = await MockTest.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message:
        "Available mock placement tests fetched successfully",
      totalMockTests: mockTests.length,
      mockTests,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch available mock placement tests",
      error: error.message,
    });
  }
};

// ==============================
// GET MOCK TEST DETAILS
// ==============================
const getMockTestDetails = async (req, res) => {
  try {
    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!mockTest) {
      return res.status(404).json({
        message:
          "Mock placement test not found",
      });
    }

    // ==============================
    // COUNT ALL ATTEMPTS
    // ==============================
    const attemptsUsed =
      await MockAttempt.countDocuments({
        user: req.user.id,
        mockTest: mockTest._id,
      });

    const attemptsRemaining = Math.max(
      mockTest.maxAttempts - attemptsUsed,
      0
    );

    // ==============================
    // FIND ACTIVE ATTEMPT
    // ==============================
    const activeAttempt =
      await MockAttempt.findOne({
        user: req.user.id,
        mockTest: mockTest._id,
        status: "In Progress",
      });

    // ==============================
    // CURRENT ACTIVE ROUND
    // ==============================
    let currentRound = null;

    if (activeAttempt) {
      currentRound =
        activeAttempt.roundResults[
          activeAttempt.currentRoundIndex
        ] || null;
    }

    // ==============================
    // RESPONSE
    // ==============================
    res.status(200).json({
      message:
        "Mock placement test details fetched successfully",

      mockTest,

      attemptInfo: {
        maxAttempts:
          mockTest.maxAttempts,

        attemptsUsed,

        attemptsRemaining,

        canAttempt:
          !activeAttempt &&
          attemptsRemaining > 0,

        hasActiveAttempt:
          Boolean(activeAttempt),

        activeAttempt:
          activeAttempt || null,

        currentRound,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch mock placement test details",
      error: error.message,
    });
  }
};

// ==============================
// START MOCK ATTEMPT
// ==============================
const startMockAttempt = async (req, res) => {
  try {
    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!mockTest) {
      return res.status(404).json({
        message:
          "Mock placement test not found",
      });
    }

    const now = new Date();

    // ==============================
    // CHECK MOCK AVAILABILITY
    // ==============================
    if (
      mockTest.startDate &&
      now < mockTest.startDate
    ) {
      return res.status(400).json({
        message:
          "This mock placement test has not started yet",
      });
    }

    if (
      mockTest.endDate &&
      now > mockTest.endDate
    ) {
      return res.status(400).json({
        message:
          "This mock placement test has ended",
      });
    }

    // ==============================
    // PREVENT DUPLICATE ACTIVE ATTEMPT
    // ==============================
    const activeAttempt =
      await MockAttempt.findOne({
        user: req.user.id,
        mockTest: mockTest._id,
        status: "In Progress",
      });

    if (activeAttempt) {
      return res.status(400).json({
        message:
          "You already have an active attempt for this mock test",
        attempt: activeAttempt,
      });
    }

    // ==============================
    // CHECK MAX ATTEMPTS
    // ==============================
    const attemptsUsed =
      await MockAttempt.countDocuments({
        user: req.user.id,
        mockTest: mockTest._id,
      });

    if (
      attemptsUsed >=
      mockTest.maxAttempts
    ) {
      return res.status(400).json({
        message:
          "Maximum mock placement attempts reached",
      });
    }

    // ==============================
    // PREPARE ROUND RESULTS
    // ==============================
    const orderedRounds = [
      ...mockTest.rounds,
    ].sort(
      (a, b) =>
        a.order - b.order
    );

    const roundResults =
      orderedRounds.map(
        (round) => ({
          roundName:
            round.roundName,

          roundType:
            round.roundType,

          order:
            round.order,

          score: 0,

          totalMarks:
            round.totalMarks,

          percentage: 0,

          passed: false,

          startedAt: null,

          completedAt: null,
        })
      );

    if (
      roundResults.length === 0
    ) {
      return res.status(400).json({
        message:
          "This mock placement test has no configured rounds",
      });
    }

    // Start first round
    roundResults[0].startedAt =
      now;

    // ==============================
    // CREATE ATTEMPT
    // ==============================
    const mockAttempt =
      await MockAttempt.create({
        user:
          req.user.id,

        mockTest:
          mockTest._id,

        status:
          "In Progress",

        currentRoundIndex: 0,

        roundResults,

        totalScore: 0,

        totalMarks:
          mockTest.totalMarks,

        overallPercentage: 0,

        result:
          "Pending",

        proctoringViolations: [],

        violationCount: 0,

        startedAt:
          now,

        completedAt: null,

        submittedAt: null,
      });

    res.status(201).json({
      message:
        "Mock placement attempt started successfully",

      mockAttempt,

      currentRound:
        mockAttempt.roundResults[0],
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to start mock placement attempt",
      error: error.message,
    });
  }
};

// ==============================
// COMPLETE CURRENT MOCK ROUND
// ==============================
const completeMockRound = async (req, res) => {
  try {
    // ==============================
    // ACTIVE MOCK ATTEMPT
    // ==============================
    const mockAttempt =
      await MockAttempt.findOne({
        _id:
          req.params.attemptId,

        user:
          req.user.id,

        status:
          "In Progress",
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
    const currentRoundIndex =
      mockAttempt.currentRoundIndex;

    const currentRoundResult =
      mockAttempt.roundResults[
        currentRoundIndex
      ];

    if (!currentRoundResult) {
      return res.status(400).json({
        message:
          "Current mock round not found",
      });
    }

    if (
      currentRoundResult.completedAt
    ) {
      return res.status(400).json({
        message:
          "Current round is already completed",
      });
    }

    // ==============================
    // ROUND CONFIGURATION
    // ==============================
    const matchingRound =
      mockTest.rounds.find(
        (round) =>
          round.order ===
          currentRoundResult.order
      );

    if (!matchingRound) {
      return res.status(400).json({
        message:
          "Mock round configuration not found",
      });
    }

    const mcqRoundTypes = [
      "Aptitude",
      "Reasoning",
      "Verbal",
      "Technical",
    ];

    let numericScore = 0;

    // ==============================
    // SERVER-SIDE MCQ SCORING
    // ==============================
    if (
      mcqRoundTypes.includes(
        currentRoundResult.roundType
      )
    ) {
      const questionAttempts =
        await MockQuestionAttempt.find({
          user:
            req.user.id,

          mockAttempt:
            mockAttempt._id,

          roundName:
            currentRoundResult.roundName,
        });

      if (
        questionAttempts.length === 0
      ) {
        return res.status(400).json({
          message:
            "No questions have been assigned for this round",
        });
      }

      if (
        questionAttempts.length !==
        matchingRound.numberOfQuestions
      ) {
        return res.status(400).json({
          message:
            "Assigned question count does not match the mock round configuration",

          required:
            matchingRound.numberOfQuestions,

          assigned:
            questionAttempts.length,
        });
      }

      const unansweredQuestions =
        questionAttempts.filter(
          (attempt) =>
            !attempt.answered
        );

      if (
        unansweredQuestions.length > 0
      ) {
        return res.status(400).json({
          message:
            "Answer all questions before completing this mock round",

          totalQuestions:
            questionAttempts.length,

          answeredQuestions:
            questionAttempts.length -
            unansweredQuestions.length,

          unansweredQuestions:
            unansweredQuestions.length,
        });
      }

      // Calculate MCQ marks
      numericScore =
        questionAttempts.reduce(
          (total, attempt) =>
            total +
            Number(
              attempt.marksAwarded ||
                0
            ),
          0
        );
    }

    // ==============================
    // SERVER-SIDE CODING SCORING
    // ==============================
    else if (
      currentRoundResult.roundType ===
      "Coding"
    ) {
      /*
        Find best Judge0-backed
        CodingAttempt from this
        specific mock round.

        Highest score wins.

        If same score:
        latest submission wins.
      */

      const codingAttempt =
        await CodingAttempt.findOne({
          user:
            req.user.id,

          mockAttempt:
            mockAttempt._id,

          mockTest:
            mockTest._id,

          mockRoundName:
            currentRoundResult.roundName,

          isMockAttempt: true,
        }).sort({
          scorePercentage: -1,
          submittedAt: -1,
        });

      if (!codingAttempt) {
        return res.status(400).json({
          message:
            "Submit your coding solution before completing the Coding round",
        });
      }

      /*
        Scale CodingAttempt percentage
        to current Mock Round marks.

        Example:

        Coding Attempt = 100%
        Mock round = 20 marks

        100% → 20/20
      */

      numericScore =
        Math.round(
          (Number(
            codingAttempt.scorePercentage ||
              0
          ) /
            100) *
            currentRoundResult.totalMarks *
            100
        ) / 100;
    }

    // ==============================
    // SERVER-SIDE SQL SCORING
    // ==============================
    else if (
      currentRoundResult.roundType ===
      "SQL"
    ) {
      /*
        Find best AlaSQL-backed
        SqlAttempt from this
        specific mock round.

        Highest score wins.

        If same score:
        latest submission wins.
      */

      const sqlAttempt =
        await SqlAttempt.findOne({
          user:
            req.user.id,

          mockAttempt:
            mockAttempt._id,

          mockTest:
            mockTest._id,

          mockRoundName:
            currentRoundResult.roundName,

          isMockAttempt: true,
        }).sort({
          scorePercentage: -1,
          submittedAt: -1,
        });

      if (!sqlAttempt) {
        return res.status(400).json({
          message:
            "Submit your SQL solution before completing the SQL round",
        });
      }

      /*
        Scale SQL attempt percentage
        to current Mock Round marks.

        Example:

        SQL Attempt = 100%
        SQL round = 20 marks

        100% → 20/20
      */

      numericScore =
        Math.round(
          (Number(
            sqlAttempt.scorePercentage ||
              0
          ) /
            100) *
            currentRoundResult.totalMarks *
            100
        ) / 100;
    }

    // ==============================
    // UNSUPPORTED ROUND
    // ==============================
    else {
      return res.status(400).json({
        message:
          "Unsupported mock round type",
      });
    }

    // ==============================
    // SCORE VALIDATION
    // ==============================
    if (
      numericScore < 0 ||
      numericScore >
        currentRoundResult.totalMarks
    ) {
      return res.status(400).json({
        message: `Score must be between 0 and ${currentRoundResult.totalMarks}`,
      });
    }

    // ==============================
    // CALCULATE ROUND PERCENTAGE
    // ==============================
    const percentage =
      currentRoundResult.totalMarks >
      0
        ? Math.round(
            (numericScore /
              currentRoundResult.totalMarks) *
              100
          )
        : 0;

    // ==============================
    // ROUND PASS / FAIL
    // ==============================
    const passed =
      percentage >=
      matchingRound.passingPercentage;

    const now = new Date();

    // ==============================
    // COMPLETE CURRENT ROUND
    // ==============================
    currentRoundResult.score =
      numericScore;

    currentRoundResult.percentage =
      percentage;

    currentRoundResult.passed =
      passed;

    currentRoundResult.completedAt =
      now;

    // ==============================
    // UPDATE TOTAL SCORE
    // ==============================
    mockAttempt.totalScore =
      mockAttempt.roundResults.reduce(
        (total, round) =>
          total +
          Number(
            round.score || 0
          ),
        0
      );

    // ==============================
    // OVERALL PERCENTAGE
    // ==============================
    mockAttempt.overallPercentage =
      mockAttempt.totalMarks > 0
        ? Math.round(
            (mockAttempt.totalScore /
              mockAttempt.totalMarks) *
              100
          )
        : 0;

    const nextRoundIndex =
      currentRoundIndex + 1;

    // ==============================
    // MOVE TO NEXT ROUND
    // ==============================
    if (
      nextRoundIndex <
      mockAttempt.roundResults.length
    ) {
      mockAttempt.currentRoundIndex =
        nextRoundIndex;

      if (
        !mockAttempt.roundResults[
          nextRoundIndex
        ].startedAt
      ) {
        mockAttempt.roundResults[
          nextRoundIndex
        ].startedAt = now;
      }

      await mockAttempt.save();

      return res.status(200).json({
        message:
          "Mock round completed successfully",

        completedRound:
          currentRoundResult,

        nextRound:
          mockAttempt.roundResults[
            nextRoundIndex
          ],

        mockAttempt,
      });
    }

    // ==============================
    // FINAL MOCK COMPLETION
    // ==============================
    mockAttempt.status =
      "Completed";

    mockAttempt.completedAt =
      now;

    mockAttempt.submittedAt =
      now;

    // ==============================
    // CHECK ALL ROUNDS
    // ==============================
    const allRoundsPassed =
      mockAttempt.roundResults.every(
        (round) =>
          round.passed
      );

    // ==============================
    // CHECK OVERALL PASS
    // ==============================
    const overallPassed =
      mockAttempt.overallPercentage >=
      mockTest.passingPercentage;

    // ==============================
    // FINAL RESULT
    // ==============================
    mockAttempt.result =
      allRoundsPassed &&
      overallPassed
        ? "Passed"
        : "Failed";

    await mockAttempt.save();

    // ==============================
    // FINAL RESPONSE
    // ==============================
    res.status(200).json({
      message:
        "Mock placement test completed successfully",

      mockAttempt,

      result: {
        totalScore:
          mockAttempt.totalScore,

        totalMarks:
          mockAttempt.totalMarks,

        overallPercentage:
          mockAttempt.overallPercentage,

        status:
          mockAttempt.status,

        result:
          mockAttempt.result,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to complete mock placement round",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableMockTests,
  getMockTestDetails,
  startMockAttempt,
  completeMockRound,
};