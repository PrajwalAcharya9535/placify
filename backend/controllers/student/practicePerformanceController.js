const PracticeAttempt = require("../../models/PracticeAttempt");

// ==============================
// GET PRACTICE PERFORMANCE
// ==============================
const getPracticePerformance = async (req, res) => {
  try {
    const attempts = await PracticeAttempt.find({
      user: req.user.id,
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        message: "No practice attempts found",
        overall: {
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          accuracy: 0,
          marksObtained: 0,
          totalMarks: 0,
          averageTimeSeconds: 0,
        },
        categoryPerformance: [],
        weakAreas: [],
        strengths: [],
      });
    }

    // ==============================
    // OVERALL PERFORMANCE
    // ==============================

    const totalAttempts = attempts.length;

    const correctAttempts = attempts.filter(
      (attempt) => attempt.isCorrect
    ).length;

    const incorrectAttempts =
      totalAttempts - correctAttempts;

    const marksObtained = attempts.reduce(
      (sum, attempt) =>
        sum + (attempt.marksAwarded || 0),
      0
    );

    const totalMarks = attempts.reduce(
      (sum, attempt) =>
        sum + (attempt.totalMarks || 0),
      0
    );

    const totalTime = attempts.reduce(
      (sum, attempt) =>
        sum + (attempt.timeTakenSeconds || 0),
      0
    );

    const accuracy = Math.round(
      (correctAttempts / totalAttempts) * 100
    );

    const averageTimeSeconds = Math.round(
      totalTime / totalAttempts
    );

    // ==============================
    // CATEGORY PERFORMANCE
    // ==============================

    const categoryMap = {};

    attempts.forEach((attempt) => {
      const category =
        attempt.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          totalAttempts: 0,
          correctAttempts: 0,
          incorrectAttempts: 0,
          marksObtained: 0,
          totalMarks: 0,
          totalTimeSeconds: 0,
        };
      }

      categoryMap[category].totalAttempts++;

      if (attempt.isCorrect) {
        categoryMap[category].correctAttempts++;
      } else {
        categoryMap[category].incorrectAttempts++;
      }

      categoryMap[category].marksObtained +=
        attempt.marksAwarded || 0;

      categoryMap[category].totalMarks +=
        attempt.totalMarks || 0;

      categoryMap[category].totalTimeSeconds +=
        attempt.timeTakenSeconds || 0;
    });

    const categoryPerformance =
      Object.values(categoryMap).map(
        (category) => {
          const categoryAccuracy =
            category.totalAttempts > 0
              ? Math.round(
                  (category.correctAttempts /
                    category.totalAttempts) *
                    100
                )
              : 0;

          const averageTime =
            category.totalAttempts > 0
              ? Math.round(
                  category.totalTimeSeconds /
                    category.totalAttempts
                )
              : 0;

          return {
            category: category.category,

            totalAttempts:
              category.totalAttempts,

            correctAttempts:
              category.correctAttempts,

            incorrectAttempts:
              category.incorrectAttempts,

            marksObtained:
              category.marksObtained,

            totalMarks:
              category.totalMarks,

            accuracy: categoryAccuracy,

            averageTimeSeconds: averageTime,
          };
        }
      );

    // ==============================
    // IDENTIFY WEAK AREAS
    // ==============================

    const weakAreas = categoryPerformance
      .filter(
        (category) =>
          category.totalAttempts >= 1 &&
          category.accuracy < 60
      )
      .map((category) => category.category);

    // ==============================
    // IDENTIFY STRENGTHS
    // ==============================

    const strengths = categoryPerformance
      .filter(
        (category) =>
          category.totalAttempts >= 1 &&
          category.accuracy >= 80
      )
      .map((category) => category.category);

    res.status(200).json({
      message:
        "Practice performance fetched successfully",

      overall: {
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        accuracy,
        marksObtained,
        totalMarks,
        averageTimeSeconds,
      },

      categoryPerformance,

      weakAreas,

      strengths,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch practice performance",
      error: error.message,
    });
  }
};

module.exports = {
  getPracticePerformance,
};