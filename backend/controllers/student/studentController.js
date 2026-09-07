const StudentProfile = require("../../models/StudentProfile");
const Skill = require("../../models/Skill");
const StudentGoal = require("../../models/StudentGoal");
const Readiness = require("../../models/Readiness");
const LearningProgress = require("../../models/LearningProgress");
const PracticeAttempt = require("../../models/PracticeAttempt");
const User = require("../../models/User");

// ==============================
// STUDENT DASHBOARD
// ==============================
const getStudentDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role"
    );

    const profile = await StudentProfile.findOne({
      user: req.user.id,
    });

    const skills = await Skill.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    const goal = await StudentGoal.findOne({
      user: req.user.id,
    });

    const readiness = await Readiness.findOne({
      user: req.user.id,
    });

    const learningProgress = await LearningProgress.find({
      user: req.user.id,
    }).populate(
      "topic",
      "title category difficulty estimatedMinutes skillsCovered"
    );

    const practiceAttempts = await PracticeAttempt.find({
      user: req.user.id,
    });

    // ==============================
    // LEARNING SUMMARY
    // ==============================

    const completedTopics = learningProgress.filter(
      (item) => item.status === "Completed"
    ).length;

    const inProgressTopics = learningProgress.filter(
      (item) => item.status === "In Progress"
    ).length;

    const totalLearningTopicsStarted = learningProgress.length;

    const averageLearningProgress =
      learningProgress.length > 0
        ? Math.round(
            learningProgress.reduce(
              (total, item) =>
                total + item.progressPercentage,
              0
            ) / learningProgress.length
          )
        : 0;

    // ==============================
    // PRACTICE SUMMARY
    // ==============================

    const totalPracticeAttempts =
      practiceAttempts.length;

    const correctPracticeAttempts =
      practiceAttempts.filter(
        (attempt) => attempt.isCorrect
      ).length;

    const incorrectPracticeAttempts =
      totalPracticeAttempts -
      correctPracticeAttempts;

    const practiceAccuracy =
      totalPracticeAttempts > 0
        ? Math.round(
            (correctPracticeAttempts /
              totalPracticeAttempts) *
              100
          )
        : 0;

    const totalPracticeTime =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.timeTakenSeconds || 0),
        0
      );

    const averagePracticeTime =
      totalPracticeAttempts > 0
        ? Math.round(
            totalPracticeTime /
              totalPracticeAttempts
          )
        : 0;

    const practiceMarksObtained =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.marksAwarded || 0),
        0
      );

    const practiceTotalMarks =
      practiceAttempts.reduce(
        (total, attempt) =>
          total +
          (attempt.totalMarks || 0),
        0
      );

    // ==============================
    // CATEGORY PERFORMANCE
    // ==============================

    const categoryMap = {};

    practiceAttempts.forEach((attempt) => {
      const category =
        attempt.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = {
          totalAttempts: 0,
          correctAttempts: 0,
        };
      }

      categoryMap[category].totalAttempts++;

      if (attempt.isCorrect) {
        categoryMap[category]
          .correctAttempts++;
      }
    });

    const categoryPerformance =
      Object.entries(categoryMap).map(
        ([category, data]) => ({
          category,
          totalAttempts: data.totalAttempts,

          accuracy:
            data.totalAttempts > 0
              ? Math.round(
                  (data.correctAttempts /
                    data.totalAttempts) *
                    100
                )
              : 0,
        })
      );

    const practiceWeakAreas =
      categoryPerformance
        .filter(
          (item) =>
            item.totalAttempts >= 1 &&
            item.accuracy < 60
        )
        .map((item) => item.category);

    const practiceStrengths =
      categoryPerformance
        .filter(
          (item) =>
            item.totalAttempts >= 1 &&
            item.accuracy >= 80
        )
        .map((item) => item.category);

    // ==============================
    // DASHBOARD RESPONSE
    // ==============================

    res.status(200).json({
      message:
        "Student dashboard fetched successfully",

      student: user,

      profile: profile || null,

      skills,

      goal: goal || null,

      readiness: readiness || null,

      learning: {
        progress: learningProgress,
        totalStarted:
          totalLearningTopicsStarted,
        completedTopics,
        inProgressTopics,
        averageProgress:
          averageLearningProgress,
      },

      practice: {
        totalAttempts:
          totalPracticeAttempts,

        correctAttempts:
          correctPracticeAttempts,

        incorrectAttempts:
          incorrectPracticeAttempts,

        accuracy:
          practiceAccuracy,

        marksObtained:
          practiceMarksObtained,

        totalMarks:
          practiceTotalMarks,

        averageTimeSeconds:
          averagePracticeTime,

        categoryPerformance,

        weakAreas:
          practiceWeakAreas,

        strengths:
          practiceStrengths,
      },

      summary: {
        totalSkills:
          skills.length,

        profileCompleted:
          !!profile,

        goalSet:
          !!goal,

        readinessCalculated:
          !!readiness,

        overallReadinessScore:
          readiness
            ? readiness.overallScore
            : 0,

        learningTopicsStarted:
          totalLearningTopicsStarted,

        learningTopicsCompleted:
          completedTopics,

        learningTopicsInProgress:
          inProgressTopics,

        averageLearningProgress:
          averageLearningProgress,

        practiceAttempts:
          totalPracticeAttempts,

        practiceAccuracy:
          practiceAccuracy,

        practiceAverageTimeSeconds:
          averagePracticeTime,

        practiceWeakAreas:
          practiceWeakAreas,

        practiceStrengths:
          practiceStrengths,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load student dashboard",
      error: error.message,
    });
  }
};

// ==============================
// CREATE / UPDATE STUDENT PROFILE
// ==============================
const saveStudentProfile = async (req, res) => {
  try {
    const {
      phone,
      course,
      college,
      graduationYear,
      cgpa,
      skills,
      location,
      bio,
    } = req.body;

    const profile =
      await StudentProfile.findOneAndUpdate(
        { user: req.user.id },
        {
          user: req.user.id,
          phone,
          course,
          college,
          graduationYear,
          cgpa,
          skills,
          location,
          bio,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      message:
        "Student profile saved successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to save student profile",
      error: error.message,
    });
  }
};

// ==============================
// GET STUDENT PROFILE
// ==============================
const getStudentProfile = async (req, res) => {
  try {
    const profile =
      await StudentProfile.findOne({
        user: req.user.id,
      }).populate(
        "user",
        "name email role"
      );

    if (!profile) {
      return res.status(404).json({
        message:
          "Student profile not found",
      });
    }

    res.status(200).json({
      message:
        "Student profile fetched successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch student profile",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentDashboard,
  saveStudentProfile,
  getStudentProfile,
};