const MockAttempt = require("../../models/MockAttempt");

// ==============================
// GET STUDENT MOCK HISTORY
// ==============================
const getMockHistory = async (req, res) => {
  try {
    const attempts = await MockAttempt.find({
      user: req.user.id,
    })
      .populate(
        "mockTest",
        "title companyName difficulty totalMarks passingPercentage"
      )
      .sort({
        createdAt: -1,
      });

    // ==============================
    // SUMMARY
    // ==============================
    const completedAttempts =
      attempts.filter(
        (attempt) =>
          attempt.status === "Completed" ||
          attempt.status === "Auto Submitted"
      );

    const passedAttempts =
      completedAttempts.filter(
        (attempt) =>
          attempt.result === "Passed"
      );

    const failedAttempts =
      completedAttempts.filter(
        (attempt) =>
          attempt.result === "Failed"
      );

    const averageScore =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce(
              (total, attempt) =>
                total +
                attempt.overallPercentage,
              0
            ) / completedAttempts.length
          )
        : 0;

    // ==============================
    // BEST SCORE
    // ==============================
    const bestScore =
      completedAttempts.length > 0
        ? Math.max(
            ...completedAttempts.map(
              (attempt) =>
                attempt.overallPercentage
            )
          )
        : 0;

    res.status(200).json({
      message:
        "Mock placement history fetched successfully",

      summary: {
        totalAttempts: attempts.length,
        completedAttempts:
          completedAttempts.length,
        passedAttempts:
          passedAttempts.length,
        failedAttempts:
          failedAttempts.length,
        averageScore,
        bestScore,
      },

      attempts,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch mock placement history",
      error: error.message,
    });
  }
};

module.exports = {
  getMockHistory,
};