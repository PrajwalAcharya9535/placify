
const mongoose = require("mongoose");

const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");
const PracticeQuestion = require("../../models/PracticeQuestion");
const MockQuestionAttempt = require("../../models/MockQuestionAttempt");

// ==========================================
// CONSTANTS
// ==========================================

const MCQ_ROUND_TYPES = [
  "Aptitude",
  "Reasoning",
  "Verbal",
  "Technical",
];

const QUESTION_SELECT =
  "questionText category subcategory difficulty questionType options marks time skills";

// Assignment locks expire after five minutes.
// An expired lock can be recovered by a new request.
const ASSIGNMENT_LOCK_MS = 5 * 60 * 1000;

// ==========================================
// BASIC HELPERS
// ==========================================

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const getQuestionCount = (round, config, mode) => {
  if (
    Number.isInteger(round.numberOfQuestions) &&
    round.numberOfQuestions > 0
  ) {
    return round.numberOfQuestions;
  }

  if (
    mode === "Demo" &&
    Number.isInteger(config.demoNumberOfQuestions) &&
    config.demoNumberOfQuestions > 0
  ) {
    return config.demoNumberOfQuestions;
  }

  return config.numberOfQuestions;
};

const getDurationMinutes = (round, config, mode) => {
  if (
    Number.isFinite(round.durationMinutes) &&
    round.durationMinutes > 0
  ) {
    return round.durationMinutes;
  }

  if (
    mode === "Demo" &&
    Number.isFinite(config.demoDurationMinutes) &&
    config.demoDurationMinutes > 0
  ) {
    return config.demoDurationMinutes;
  }

  return config.durationMinutes;
};

const getRoundExpiry = (round, durationMinutes) => {
  if (round.expiresAt) {
    return new Date(round.expiresAt);
  }

  if (!round.startedAt) {
    return null;
  }

  return new Date(
    new Date(round.startedAt).getTime() +
      durationMinutes * 60 * 1000
  );
};

const getRemainingSeconds = (expiresAt) => {
  if (!expiresAt) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / 1000
    )
  );
};

// ==========================================
// FETCH ASSIGNED QUESTIONS
// ==========================================

const getAssignedQuestions = async (
  mockAttemptId,
  roundName
) => {
  return MockQuestionAttempt.find({
    mockAttempt: mockAttemptId,
    roundName,
  })
    .sort({ _id: 1 })
    .populate({
      path: "question",
      select: QUESTION_SELECT,
    });
};

// ==========================================
// GET ASSIGNMENT LOCK PATH
// ==========================================

const getAssignmentLockPath = (roundOrder) => {
  return `assignmentLocks.questionAssignment_${roundOrder}`;
};

// ==========================================
// ACQUIRE ROUND ASSIGNMENT LOCK
// ==========================================

const acquireAssignmentLock = async (
  mockAttempt,
  currentRound
) => {
  const lockPath = getAssignmentLockPath(
    currentRound.order
  );

  const now = new Date();

  const expiredBefore = new Date(
    now.getTime() - ASSIGNMENT_LOCK_MS
  );

  const lockedAttempt =
    await MockAttempt.findOneAndUpdate(
      {
        _id: mockAttempt._id,
        user: mockAttempt.user,
        status: "In Progress",
        currentRoundIndex:
          mockAttempt.currentRoundIndex,

        $or: [
          {
            [lockPath]: {
              $exists: false,
            },
          },
          {
            [lockPath]: {
              $lte: expiredBefore,
            },
          },
        ],
      },
      {
        $set: {
          [lockPath]: now,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!lockedAttempt) {
    return null;
  }

  return {
    lockPath,
    lockTime: now,
  };
};

// ==========================================
// RELEASE ROUND ASSIGNMENT LOCK
// ==========================================

const releaseAssignmentLock = async (
  mockAttemptId,
  lock
) => {
  if (!lock) {
    return;
  }

  // Only the request owning this lock may
  // release it. An older request cannot
  // remove a newer recovered lock.
  await MockAttempt.updateOne(
    {
      _id: mockAttemptId,
      [lock.lockPath]: lock.lockTime,
    },
    {
      $unset: {
        [lock.lockPath]: "",
      },
    }
  );
};

// ==========================================
// GET EXISTING QUESTION RECORDS
// ==========================================

const getExistingQuestionRecords = async (
  mockAttemptId,
  roundName
) => {
  return MockQuestionAttempt.find({
    mockAttempt: mockAttemptId,
    roundName,
  }).select(
    "_id question answered submittedAnswer marksAwarded"
  );
};

// ==========================================
// COMPLETE OR RECOVER ASSIGNMENT
// ==========================================

const ensureRoundQuestionsAssigned = async ({
  mockAttempt,
  mockTest,
  currentRound,
  requiredQuestionCount,
}) => {
  const existingBeforeLock =
    await getExistingQuestionRecords(
      mockAttempt._id,
      currentRound.roundName
    );

  if (
    existingBeforeLock.length ===
    requiredQuestionCount
  ) {
    return {
      ready: true,
      message: "Questions already assigned",
    };
  }

  if (
    existingBeforeLock.length >
    requiredQuestionCount
  ) {
    return {
      ready: false,
      statusCode: 409,
      message:
        "Existing question count exceeds the configured round count. Manual review is required.",
    };
  }

  // ======================================
  // ACQUIRE EXCLUSIVE ASSIGNMENT LOCK
  // ======================================

  const lock = await acquireAssignmentLock(
    mockAttempt,
    currentRound
  );

  if (!lock) {
    return {
      ready: false,
      statusCode: 409,
      message:
        "Question assignment is in progress. Please retry shortly.",
    };
  }

  try {
    // ====================================
    // RECHECK ACTIVE ROUND AFTER LOCK
    // ====================================

    const latestAttempt =
      await MockAttempt.findOne({
        _id: mockAttempt._id,
        user: mockAttempt.user,
        status: "In Progress",
        currentRoundIndex:
          mockAttempt.currentRoundIndex,
      });

    if (!latestAttempt) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "The mock attempt is no longer active.",
      };
    }

    const latestRound =
      latestAttempt.roundResults[
        latestAttempt.currentRoundIndex
      ];

    if (
      !latestRound ||
      latestRound.completedAt
    ) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "The mock round has already ended.",
      };
    }

    const durationMinutes =
      latestRound.durationMinutes;

    const expiresAt = getRoundExpiry(
      latestRound,
      durationMinutes
    );

    if (
      expiresAt &&
      Date.now() >= expiresAt.getTime()
    ) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "Time is over for this mock round.",
      };
    }

    // ====================================
    // RECHECK EXISTING QUESTIONS
    // ====================================

    const existingQuestions =
      await getExistingQuestionRecords(
        mockAttempt._id,
        currentRound.roundName
      );

    if (
      existingQuestions.length ===
      requiredQuestionCount
    ) {
      return {
        ready: true,
        message: "Questions already assigned",
      };
    }

    if (
      existingQuestions.length >
      requiredQuestionCount
    ) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "Question assignment count mismatch.",
      };
    }

    // ====================================
    // PRESERVE EXISTING ASSIGNMENTS
    // ====================================

    const existingQuestionIds =
      existingQuestions.map(
        (item) => item.question
      );

    const remainingCount =
      requiredQuestionCount -
      existingQuestions.length;

    // ====================================
    // COUNT AVAILABLE QUESTIONS
    // ====================================

    const questionFilter = {
      category: currentRound.roundType,
      questionType: "MCQ",
      isActive: true,
    };

    const availableCount =
      await PracticeQuestion.countDocuments({
        ...questionFilter,

        _id: {
          $nin: existingQuestionIds,
        },
      });

    if (availableCount < remainingCount) {
      return {
        ready: false,
        statusCode: 400,
        message:
          "Not enough active questions available for this mock round",
        required: remainingCount,
        available: availableCount,
      };
    }

    // ====================================
    // SELECT ONLY MISSING QUESTIONS
    // ====================================

    const selectedQuestions =
      await PracticeQuestion.aggregate([
        {
          $match: {
            ...questionFilter,

            _id: {
              $nin: existingQuestionIds,
            },
          },
        },
        {
          $sample: {
            size: remainingCount,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

    if (
      selectedQuestions.length !== remainingCount
    ) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "Unable to select the required number of questions.",
      };
    }

    // ====================================
    // CALCULATE MARKS
    // ====================================

    const marksPerQuestion =
      currentRound.totalMarks /
      requiredQuestionCount;

    // ====================================
    // PREPARE QUESTION ATTEMPTS
    // ====================================

    const questionAttempts =
      selectedQuestions.map((item) => ({
        user: mockAttempt.user,
        mockAttempt: mockAttempt._id,
        mockTest: mockTest._id,

        roundName:
          currentRound.roundName,

        roundType:
          currentRound.roundType,

        question: item._id,

        submittedAnswer: "",
        isCorrect: false,
        marksAwarded: 0,
        totalMarks: marksPerQuestion,
        answered: false,
        answeredAt: null,
      }));

    // ====================================
    // INSERT MISSING QUESTIONS
    // ====================================

    if (questionAttempts.length > 0) {
      await MockQuestionAttempt.insertMany(
        questionAttempts,
        {
          ordered: true,
        }
      );
    }

    // ====================================
    // VERIFY FINAL ASSIGNMENT
    // ====================================

    const finalQuestions =
      await getExistingQuestionRecords(
        mockAttempt._id,
        currentRound.roundName
      );

    if (
      finalQuestions.length !==
      requiredQuestionCount
    ) {
      return {
        ready: false,
        statusCode: 409,
        message:
          "Question assignment is incomplete. Please retry.",
      };
    }

    return {
      ready: true,
      message:
        "Mock round questions assigned successfully",
    };
  } finally {
    await releaseAssignmentLock(
      mockAttempt._id,
      lock
    );
  }
};

// ==========================================
// GET CURRENT MOCK ROUND QUESTIONS
// ==========================================

const getCurrentMockRoundQuestions = async (
  req,
  res
) => {
  try {
    // ======================================
    // VALIDATE ATTEMPT ID
    // ======================================

    if (!isValidId(req.params.attemptId)) {
      return res.status(400).json({
        message: "Invalid mock attempt ID",
      });
    }

    // ======================================
    // FIND ACTIVE MOCK ATTEMPT
    // ======================================

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

    // ======================================
    // FIND MOCK TEST
    // ======================================

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

    // ======================================
    // GET CURRENT ROUND
    // ======================================

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
      !MCQ_ROUND_TYPES.includes(
        currentRound.roundType
      )
    ) {
      return res.status(400).json({
        message:
          "Current round is not an MCQ round",
      });
    }

    if (
      currentRound.completedAt ||
      [
        "Completed",
        "Auto Submitted",
        "Skipped",
      ].includes(currentRound.status)
    ) {
      return res.status(409).json({
        message:
          "This mock round has already ended",
      });
    }

    // ======================================
    // FIND ROUND CONFIGURATION
    // ======================================

    const roundConfig =
      mockTest.rounds.find(
        (round) =>
          round.order === currentRound.order
      );

    if (!roundConfig) {
      return res.status(400).json({
        message:
          "Mock round configuration not found",
      });
    }

    // ======================================
    // FULL / DEMO MODE
    // ======================================

    const practiceMode =
      mockAttempt.practiceMode || "Full";

    const requiredQuestionCount =
      getQuestionCount(
        currentRound,
        roundConfig,
        practiceMode
      );

    const durationMinutes =
      getDurationMinutes(
        currentRound,
        roundConfig,
        practiceMode
      );

    if (
      !Number.isInteger(
        requiredQuestionCount
      ) ||
      requiredQuestionCount <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid question count for this mock round",
      });
    }

    if (
      !Number.isFinite(
        durationMinutes
      ) ||
      durationMinutes <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid mock round duration",
      });
    }

    // ======================================
    // SERVER-CONTROLLED TIMER
    // ======================================

    const expiresAt =
      getRoundExpiry(
        currentRound,
        durationMinutes
      );

    const remainingSeconds =
      getRemainingSeconds(
        expiresAt
      );

    if (
      remainingSeconds !== null &&
      remainingSeconds <= 0
    ) {
      return res.status(409).json({
        message:
          "Time is over for this mock round. Please submit the round.",
        roundExpired: true,
        expiresAt,
        remainingSeconds: 0,
      });
    }

    // ======================================
    // ENSURE QUESTIONS ARE ASSIGNED
    // ======================================

    const assignment =
      await ensureRoundQuestionsAssigned({
        mockAttempt,
        mockTest,
        currentRound,
        requiredQuestionCount,
      });

    if (!assignment.ready) {
      return res
        .status(
          assignment.statusCode || 409
        )
        .json({
          message: assignment.message,
          required: assignment.required,
          available: assignment.available,
        });
    }

    // ======================================
    // FETCH ASSIGNED QUESTIONS
    // ======================================

    const assignedQuestions =
      await getAssignedQuestions(
        mockAttempt._id,
        currentRound.roundName
      );

    if (
      assignedQuestions.length !==
      requiredQuestionCount
    ) {
      return res.status(409).json({
        message:
          "Question assignment count mismatch. Please retry.",
        required:
          requiredQuestionCount,
        assigned:
          assignedQuestions.length,
      });
    }

    // ======================================
    // SAFE QUESTION RESPONSE
    // ======================================

    const questions =
      assignedQuestions.map(
        (attempt) => ({
          mockQuestionAttemptId:
            attempt._id,

          questionId:
            attempt.question?._id,

          questionText:
            attempt.question?.questionText,

          category:
            attempt.question?.category,

          subcategory:
            attempt.question?.subcategory,

          difficulty:
            attempt.question?.difficulty,

          questionType:
            attempt.question?.questionType,

          options:
            attempt.question?.options,

          marks:
            attempt.totalMarks,

          answered:
            attempt.answered,

          submittedAnswer:
            attempt.answered
              ? attempt.submittedAnswer
              : "",
        })
      );

    // ======================================
    // SUCCESS RESPONSE
    // ======================================

    return res.status(200).json({
      message:
        "Current mock round questions fetched successfully",

      practiceMode,

      round: {
        roundName:
          currentRound.roundName,

        roundType:
          currentRound.roundType,

        order:
          currentRound.order,

        durationMinutes,

        totalMarks:
          currentRound.totalMarks,

        numberOfQuestions:
          questions.length,

        startedAt:
          currentRound.startedAt,

        expiresAt,

        remainingSeconds:
          getRemainingSeconds(expiresAt),
      },

      questions,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch mock round questions",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  getCurrentMockRoundQuestions,
};
