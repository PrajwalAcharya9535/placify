const MockTest = require("../../models/MockTest");

// ==============================
// CREATE MOCK TEST
// ==============================
const createMockTest = async (req, res) => {
  try {
    const {
      title,
      description,
      companyName,
      difficulty,
      rounds,
      totalDurationMinutes,
      totalMarks,
      passingPercentage,
      instructions,
      proctoringEnabled,
      requireFullscreen,
      requireCamera,
      maxTabSwitches,
      autoSubmitOnViolation,
      startDate,
      endDate,
      maxAttempts,
      isActive,
    } = req.body;

    // ==============================
    // REQUIRED FIELDS
    // ==============================
    if (
      !title ||
      !description ||
      !companyName ||
      !totalDurationMinutes ||
      !totalMarks
    ) {
      return res.status(400).json({
        message:
          "Title, description, company name, total duration and total marks are required",
      });
    }

    // ==============================
    // VALIDATE ROUNDS
    // ==============================
    if (
      !Array.isArray(rounds) ||
      rounds.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one mock placement round is required",
      });
    }

    const validRoundTypes = [
      "Aptitude",
      "Reasoning",
      "Verbal",
      "Technical",
      "Coding",
      "SQL",
    ];

    for (const round of rounds) {
      if (
        !round.roundName ||
        !round.roundType ||
        !round.order ||
        !round.durationMinutes ||
        !round.totalMarks
      ) {
        return res.status(400).json({
          message:
            "Each round must contain roundName, roundType, order, durationMinutes and totalMarks",
        });
      }

      if (
        !validRoundTypes.includes(
          round.roundType
        )
      ) {
        return res.status(400).json({
          message: `Invalid round type: ${round.roundType}`,
        });
      }
    }

    // ==============================
    // UNIQUE ROUND ORDER
    // ==============================
    const roundOrders = rounds.map(
      (round) => round.order
    );

    if (
      new Set(roundOrders).size !==
      roundOrders.length
    ) {
      return res.status(400).json({
        message:
          "Each mock round must have a unique order",
      });
    }

    // ==============================
    // VALIDATE DATES
    // ==============================
    if (
      startDate &&
      endDate &&
      new Date(startDate) >=
        new Date(endDate)
    ) {
      return res.status(400).json({
        message:
          "End date must be after start date",
      });
    }

    // ==============================
    // CREATE MOCK TEST
    // ==============================
    const mockTest =
      await MockTest.create({
        title,
        description,
        companyName,
        difficulty,
        rounds,
        totalDurationMinutes,
        totalMarks,
        passingPercentage,
        instructions,
        proctoringEnabled,
        requireFullscreen,
        requireCamera,
        maxTabSwitches,
        autoSubmitOnViolation,
        startDate,
        endDate,
        maxAttempts,
        isActive,
        createdBy: req.user.id,
      });

    res.status(201).json({
      message:
        "Mock placement test created successfully",
      mockTest,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to create mock placement test",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL MOCK TESTS
// ==============================
const getMockTests = async (
  req,
  res
) => {
  try {
    const mockTests =
      await MockTest.find()
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      message:
        "Mock placement tests fetched successfully",
      totalMockTests:
        mockTests.length,
      mockTests,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch mock placement tests",
      error: error.message,
    });
  }
};

// ==============================
// GET MOCK TEST BY ID
// ==============================
const getMockTestById = async (
  req,
  res
) => {
  try {
    const mockTest =
      await MockTest.findById(
        req.params.id
      );

    if (!mockTest) {
      return res.status(404).json({
        message:
          "Mock placement test not found",
      });
    }

    res.status(200).json({
      message:
        "Mock placement test fetched successfully",
      mockTest,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch mock placement test",
      error: error.message,
    });
  }
};

module.exports = {
  createMockTest,
  getMockTests,
  getMockTestById,
};