
const mongoose = require("mongoose");

const MockTest = require("../../models/MockTest");
const MockAttempt = require("../../models/MockAttempt");
const MockQuestionAttempt = require("../../models/MockQuestionAttempt");
const CodingAttempt = require("../../models/CodingAttempt");
const SqlAttempt = require("../../models/SqlAttempt");

// ==========================================
// HELPERS
// ==========================================

const MCQ_TYPES = [
  "Aptitude",
  "Reasoning",
  "Verbal",
  "Technical",
];

const SUPPORTED_TYPES = [
  ...MCQ_TYPES,
  "Coding",
  "SQL",
];

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// Development/testing mode: unlimited mock attempts.
// Restore the original maxAttempts check for production.
const isUnlimited = (mockTest) =>
  process.env.NODE_ENV !== "production" ||
  mockTest.maxAttempts == null;

const getAttemptInfo = (mockTest, attemptsUsed, activeAttempt) => {
  const unlimited = isUnlimited(mockTest);

  const attemptsRemaining = unlimited
    ? null
    : Math.max(mockTest.maxAttempts - attemptsUsed, 0);

 return {
  maxAttempts: unlimited ? null : mockTest.maxAttempts,
  unlimitedAttempts: unlimited,
    attemptsUsed,
    attemptsRemaining,
    canAttempt:
      !activeAttempt &&
      (unlimited || attemptsRemaining > 0),
    hasActiveAttempt: Boolean(activeAttempt),
    activeAttempt: activeAttempt || null,
    currentRound: activeAttempt
      ? activeAttempt.roundResults[
          activeAttempt.currentRoundIndex
        ] || null
      : null,
  };
};

const getRoundDuration = (round, mode) => {
  if (
    mode === "Demo" &&
    round.demoDurationMinutes != null
  ) {
    return round.demoDurationMinutes;
  }

  return round.durationMinutes;
};

const getRoundQuestionCount = (round, mode) => {
  if (
    mode === "Demo" &&
    round.demoNumberOfQuestions != null
  ) {
    return round.demoNumberOfQuestions;
  }

  return round.numberOfQuestions;
};

const calculatePercentage = (score, total) => {
  if (!total || total <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, Math.round((score / total) * 100))
  );
};

const createRoundResult = (round, mode) => ({
  roundName: round.roundName,
  roundType: round.roundType,
  sectionKey: round.sectionKey || "",
  order: round.order,

  score: 0,
  totalMarks: round.totalMarks,
  percentage: 0,
  passed: false,

  status: "Not Started",

  durationMinutes: getRoundDuration(round, mode),
  numberOfQuestions: getRoundQuestionCount(round, mode),

  attemptedQuestions: 0,
  correctAnswers: 0,

  startedAt: null,
  expiresAt: null,
  completedAt: null,
  timeSpentSeconds: 0,
  feedback: "",
});

const activateRound = (round, now) => {
  round.status = "In Progress";
  round.startedAt = now;

  round.expiresAt = new Date(
    now.getTime() + round.durationMinutes * 60 * 1000
  );
};

const isExpired = (round) =>
  Boolean(
    round.expiresAt &&
    Date.now() >= new Date(round.expiresAt).getTime()
  );

// ==========================================
// GET AVAILABLE MOCK TESTS
// ==========================================

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
      companyName: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Available mock placement tests fetched successfully",
      totalMockTests: mockTests.length,
      mockTests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch available mock placement tests",
      error: error.message,
    });
  }
};

// ==========================================
// GET MOCK TEST DETAILS
// ==========================================

const getMockTestDetails = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mock test ID",
      });
    }

    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!mockTest) {
      return res.status(404).json({
        message: "Mock placement test not found",
      });
    }

    const [attemptsUsed, activeAttempt] = await Promise.all([
      MockAttempt.countDocuments({
        user: req.user.id,
        mockTest: mockTest._id,
      }),

      MockAttempt.findOne({
        user: req.user.id,
        mockTest: mockTest._id,
        status: "In Progress",
      }),
    ]);

    return res.status(200).json({
      message: "Mock placement test details fetched successfully",
      mockTest,
      attemptInfo: getAttemptInfo(
        mockTest,
        attemptsUsed,
        activeAttempt
      ),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch mock placement test details",
      error: error.message,
    });
  }
};

// ==========================================
// START MOCK ATTEMPT
// ==========================================

const startMockAttempt = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid mock test ID",
      });
    }

    const mode = req.body?.practiceMode || "Full";

    if (!["Full", "Demo"].includes(mode)) {
      return res.status(400).json({
        message: "Practice mode must be Full or Demo",
      });
    }

    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!mockTest) {
      return res.status(404).json({
        message: "Mock placement test not found",
      });
    }

    if (
      mode === "Full" &&
      mockTest.allowFullSimulation === false
    ) {
      return res.status(400).json({
        message: "Full simulation is unavailable",
      });
    }

    if (
      mode === "Demo" &&
      mockTest.allowDemoMode === false
    ) {
      return res.status(400).json({
        message: "Demo mode is unavailable",
      });
    }

    const now = new Date();

    if (mockTest.startDate && now < mockTest.startDate) {
      return res.status(400).json({
        message: "This mock test has not started yet",
      });
    }

    if (mockTest.endDate && now > mockTest.endDate) {
      return res.status(400).json({
        message: "This mock test has ended",
      });
    }

    const activeAttempt = await MockAttempt.findOne({
      user: req.user.id,
      mockTest: mockTest._id,
      status: "In Progress",
    });

    if (activeAttempt) {
      return res.status(409).json({
        message: "Resume your existing mock attempt",
        attempt: activeAttempt,
      });
    }

    const attemptsUsed = await MockAttempt.countDocuments({
      user: req.user.id,
      mockTest: mockTest._id,
    });

    if (
      !isUnlimited(mockTest) &&
      attemptsUsed >= mockTest.maxAttempts
    ) {
      return res.status(400).json({
        message: "Maximum mock placement attempts reached",
      });
    }

    const orderedRounds = [...mockTest.rounds].sort(
      (a, b) => a.order - b.order
    );

    if (!orderedRounds.length) {
      return res.status(400).json({
        message: "No assessment rounds configured",
      });
    }

    // Interview and Communication evaluation
    // will be integrated with existing services next.
    const unsupportedRound = orderedRounds.find(
      (round) => !SUPPORTED_TYPES.includes(round.roundType)
    );

    if (unsupportedRound) {
      return res.status(400).json({
        message:
          `${unsupportedRound.roundType} assessment integration ` +
          "is not available yet",
      });
    }

    const invalidRound = orderedRounds.find(
      (round) =>
        !Number.isFinite(getRoundDuration(round, mode)) ||
        getRoundDuration(round, mode) < 1 ||
        !Number.isInteger(getRoundQuestionCount(round, mode)) ||
        getRoundQuestionCount(round, mode) < 0
    );

    if (invalidRound) {
      return res.status(400).json({
        message: `Invalid duration or question count in ${invalidRound.roundName}`,
      });
    }

    const roundResults = orderedRounds.map((round) =>
      createRoundResult(round, mode)
    );

    activateRound(roundResults[0], now);

    const totalMarks = roundResults.reduce(
      (sum, round) => sum + round.totalMarks,
      0
    );

    const mockAttempt = await MockAttempt.create({
      user: req.user.id,
      mockTest: mockTest._id,

      practiceMode: mode,
      status: "In Progress",
      currentRoundIndex: 0,
      roundResults,

      totalScore: 0,
      totalMarks,
      overallPercentage: 0,
      result: "Pending",

      proctoringEnabled:
        Boolean(mockTest.proctoringEnabled) &&
        req.body?.proctoringEnabled === true,

      proctoringViolations: [],
      violationCount: 0,

      startedAt: now,
      completedAt: null,
      submittedAt: null,
    });

    return res.status(201).json({
      message: "Mock placement attempt started successfully",
      mockAttempt,
      currentRound: mockAttempt.roundResults[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to start mock placement attempt",
      error: error.message,
    });
  }
};

// ==========================================
// EVALUATE CURRENT ROUND
// ==========================================

const evaluateRound = async (
  mockAttempt,
  mockTest,
  currentRound,
  configuredRound
) => {
  const roundType = currentRound.roundType;

  let score = 0;
  let attemptedQuestions = 0;
  let correctAnswers = 0;

  if (MCQ_TYPES.includes(roundType)) {
    const questions = await MockQuestionAttempt.find({
      user: mockAttempt.user,
      mockAttempt: mockAttempt._id,
      roundName: currentRound.roundName,
    });


    // ======================================
    // SAFE QUESTION COUNT VALIDATION
    // ======================================
    // During a timed assessment, the student
    // may leave questions unanswered.
    //
    // If the timer expires before assignment
    // finishes, allow the round to close using
    // the questions already saved.
    //
    // Never award marks for missing questions.

    const expectedQuestionCount =
      Number(currentRound.numberOfQuestions || 0);

    const assignedQuestionCount = questions.length;

    if (assignedQuestionCount > expectedQuestionCount) {
      const error = new Error(
        "More questions were assigned than configured"
      );

      error.statusCode = 400;
      throw error;
    }

    if (
      assignedQuestionCount < expectedQuestionCount &&
      !isExpired(currentRound)
    ) {
      const error = new Error(
        "Question assignment is still incomplete. Please retry."
      );

      error.statusCode = 409;
      throw error;
    }


    attemptedQuestions = questions.filter(
      (question) => question.answered
    ).length;

    score = questions.reduce(
      (sum, question) =>
        sum + Number(question.marksAwarded || 0),
      0
    );

    correctAnswers = questions.filter(
      (question) =>
        question.answered &&
        question.isCorrect === true
    ).length;
  } else if (roundType === "Coding") {
    const codingAttempt = await CodingAttempt.findOne({
      user: mockAttempt.user,
      mockAttempt: mockAttempt._id,
      mockTest: mockTest._id,
      mockRoundName: currentRound.roundName,
      isMockAttempt: true,
    }).sort({
      scorePercentage: -1,
      submittedAt: -1,
    });

    if (codingAttempt) {
      attemptedQuestions = 1;

      score =
        (Number(codingAttempt.scorePercentage || 0) / 100) *
        currentRound.totalMarks;
    }
  } else if (roundType === "SQL") {
    const sqlAttempt = await SqlAttempt.findOne({
      user: mockAttempt.user,
      mockAttempt: mockAttempt._id,
      mockTest: mockTest._id,
      mockRoundName: currentRound.roundName,
      isMockAttempt: true,
    }).sort({
      scorePercentage: -1,
      submittedAt: -1,
    });

    if (sqlAttempt) {
      attemptedQuestions = 1;

      score =
        (Number(sqlAttempt.scorePercentage || 0) / 100) *
        currentRound.totalMarks;
    }
  } else {
    const error = new Error(
      `Evaluation for ${roundType} is not integrated yet`
    );
    error.statusCode = 400;
    throw error;
  }

  score = Math.round(score * 100) / 100;

  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > currentRound.totalMarks
  ) {
    const error = new Error("Invalid assessment score");
    error.statusCode = 400;
    throw error;
  }

  return {
    score,
    attemptedQuestions,
    correctAnswers,
    percentage: calculatePercentage(
      score,
      currentRound.totalMarks
    ),
    passed:
      calculatePercentage(
        score,
        currentRound.totalMarks
      ) >= configuredRound.passingPercentage,
  };
};

// ==========================================
// COMPLETE CURRENT MOCK ROUND
// ==========================================

const completeMockRound = async (req, res) => {
  try {
    if (!isValidId(req.params.attemptId)) {
      return res.status(400).json({
        message: "Invalid mock attempt ID",
      });
    }

    const mockAttempt = await MockAttempt.findOne({
      _id: req.params.attemptId,
      user: req.user.id,
      status: "In Progress",
    });

    if (!mockAttempt) {
      return res.status(404).json({
        message: "Active mock placement attempt not found",
      });
    }

    const mockTest = await MockTest.findById(
      mockAttempt.mockTest
    );

    if (!mockTest) {
      return res.status(404).json({
        message: "Mock placement test not found",
      });
    }

    const currentRoundIndex =
      mockAttempt.currentRoundIndex;

    const currentRound =
      mockAttempt.roundResults[currentRoundIndex];

    if (!currentRound) {
      return res.status(400).json({
        message: "Current mock round not found",
      });
    }

    if (currentRound.completedAt) {
      return res.status(409).json({
        message: "This round is already completed",
      });
    }

    const configuredRound = mockTest.rounds.find(
      (round) => round.order === currentRound.order
    );

    if (!configuredRound) {
      return res.status(400).json({
        message: "Mock round configuration not found",
      });
    }

    const now = new Date();
    const expired = isExpired(currentRound);

    // For practice, an expired round can still
    // be evaluated using saved submissions.
    const evaluation = await evaluateRound(
      mockAttempt,
      mockTest,
      currentRound,
      configuredRound
    );

    currentRound.score = evaluation.score;
    currentRound.percentage = evaluation.percentage;
    currentRound.passed = evaluation.passed;

    currentRound.attemptedQuestions =
      evaluation.attemptedQuestions;

    currentRound.correctAnswers =
      evaluation.correctAnswers;

    currentRound.status = expired
      ? "Auto Submitted"
      : "Completed";

    currentRound.completedAt = now;

    if (currentRound.startedAt) {
      const effectiveEnd = expired && currentRound.expiresAt
        ? new Date(currentRound.expiresAt)
        : now;

      currentRound.timeSpentSeconds = Math.max(
        0,
        Math.floor(
          (effectiveEnd -
            new Date(currentRound.startedAt)) / 1000
        )
      );
    }

    mockAttempt.totalScore =
      mockAttempt.roundResults.reduce(
        (sum, round) => sum + Number(round.score || 0),
        0
      );

    mockAttempt.overallPercentage = calculatePercentage(
      mockAttempt.totalScore,
      mockAttempt.totalMarks
    );

    const nextRoundIndex = currentRoundIndex + 1;

    // ======================================
    // NEXT ROUND
    // ======================================
    if (
      nextRoundIndex <
      mockAttempt.roundResults.length
    ) {
      mockAttempt.currentRoundIndex = nextRoundIndex;

      const nextRound =
        mockAttempt.roundResults[nextRoundIndex];

      if (!nextRound.startedAt) {
        activateRound(nextRound, now);
      }

      await mockAttempt.save();

      return res.status(200).json({
        message: "Mock round completed successfully",
        completedRound: currentRound,
        nextRound,
        mockAttempt,
      });
    }

    // ======================================
    // FINAL RESULT
    // ======================================
    mockAttempt.status = "Completed";
    mockAttempt.completedAt = now;
    mockAttempt.submittedAt = now;

    const allRoundsPassed =
      mockAttempt.roundResults.every(
        (round) => round.passed
      );

    const overallPassed =
      mockAttempt.overallPercentage >=
      mockTest.passingPercentage;

    mockAttempt.result =
      allRoundsPassed && overallPassed
        ? "Passed"
        : "Failed";

    await mockAttempt.save();

    return res.status(200).json({
      message: "Mock placement practice completed successfully",
      mockAttempt,
      result: {
        totalScore: mockAttempt.totalScore,
        totalMarks: mockAttempt.totalMarks,
        overallPercentage:
          mockAttempt.overallPercentage,
        status: mockAttempt.status,
        result: mockAttempt.result,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: "Failed to complete mock placement round",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getAvailableMockTests,
  getMockTestDetails,
  startMockAttempt,
  completeMockRound,
};
