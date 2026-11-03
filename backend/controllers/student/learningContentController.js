
const mongoose = require("mongoose");

const LearningTopic = require("../../models/LearningTopic");
const LearningLesson = require("../../models/LearningLesson");
const LearningVideo = require("../../models/LearningVideo");
const LearningQuiz = require("../../models/LearningQuiz");
const LearningResource = require("../../models/LearningResource");
const LearningExercise = require("../../models/LearningExercise");
const LearningActivityProgress = require("../../models/LearningActivityProgress");

// ==========================================
// GET ALL LEARNING CONTENT FOR A TOPIC
// ==========================================

const getLearningContent = async (req, res) => {
  try {
    const { topicId } = req.params;

    if (!mongoose.isValidObjectId(topicId)) {
      return res.status(400).json({
        message: "Invalid topic ID",
      });
    }

    const topic = await LearningTopic.findOne({
      _id: topicId,
      isActive: true,
    });

    if (!topic) {
      return res.status(404).json({
        message: "Learning topic not found",
      });
    }

    const [
      lessons,
      videos,
      quizzes,
      exercises,
      resources,
    ] = await Promise.all([
      LearningLesson.find({
        topic: topicId,
        isActive: true,
      }).sort({ order: 1 }),

      LearningVideo.find({
        topic: topicId,
        isActive: true,
      }).sort({ order: 1 }),

      LearningQuiz.find({
        topic: topicId,
        isActive: true,
      })
        .sort({ order: 1 })
        .select("-correctAnswer"),

      LearningExercise.find({
        topic: topicId,
        isActive: true,
      }).sort({ order: 1 }),

      LearningResource.find({
        topic: topicId,
        isActive: true,
      }).sort({ order: 1 }),
    ]);

    return res.status(200).json({
      message: "Learning content fetched successfully",
      topic,
      lessons,
      videos,
      quizzes,
      exercises,
      resources,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch learning content",
      error: error.message,
    });
  }
};

// ==========================================
// SUBMIT AND EVALUATE LEARNING MCQS
// ==========================================

const submitLearningQuiz = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { answers } = req.body;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.isValidObjectId(topicId)) {
      return res.status(400).json({
        message: "Invalid topic ID",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    const topic = await LearningTopic.findOne({
      _id: topicId,
      isActive: true,
    });

    if (!topic) {
      return res.status(404).json({
        message: "Learning topic not found",
      });
    }

    const quizzes = await LearningQuiz.find({
      topic: topicId,
      isActive: true,
    })
      .select("+correctAnswer")
      .sort({ order: 1 });

    if (!quizzes.length) {
      return res.status(400).json({
        message: "No MCQs available for this topic",
      });
    }

    const quizIds = new Set(
      quizzes.map((quiz) => String(quiz._id))
    );

    const submittedAnswers = new Map();

    for (const answer of answers) {
      if (
        !answer ||
        !mongoose.isValidObjectId(answer.quizId) ||
        !quizIds.has(String(answer.quizId)) ||
        !Number.isInteger(answer.selectedAnswer) ||
        answer.selectedAnswer < 0 ||
        answer.selectedAnswer > 3 ||
        submittedAnswers.has(String(answer.quizId))
      ) {
        return res.status(400).json({
          message: "Invalid or duplicate quiz answer",
        });
      }

      submittedAnswers.set(
        String(answer.quizId),
        answer.selectedAnswer
      );
    }

    if (submittedAnswers.size !== quizzes.length) {
      return res.status(400).json({
        message: "Please answer every question before submitting",
      });
    }

    let correctCount = 0;

    const results = quizzes.map((quiz) => {
      const selectedAnswer = submittedAnswers.get(
        String(quiz._id)
      );

      const isCorrect =
        selectedAnswer === quiz.correctAnswer;

      if (isCorrect) {
        correctCount += 1;
      }

      return {
        quizId: quiz._id,
        question: quiz.question,
        selectedAnswer,
        correctAnswer: quiz.correctAnswer,
        isCorrect,
        explanation: quiz.explanation || "",
      };
    });

    const totalQuestions = quizzes.length;

    const score = Math.round(
      (correctCount / totalQuestions) * 100
    );

    // Store individual quiz activity results.
    // Only submitted and evaluated questions are marked complete.

    const now = new Date();

    await LearningActivityProgress.bulkWrite(
      results.map((result) => ({
        updateOne: {
          filter: {
            user: userId,
            activityType: "Quiz",
            activityId: result.quizId,
          },
          update: {
            $set: {
              topic: topic._id,
              status: "Completed",
              score: result.isCorrect ? 100 : 0,
              completedAt: now,
              lastAccessedAt: now,
            },
            $setOnInsert: {
              user: userId,
              activityType: "Quiz",
              activityId: result.quizId,
            },
          },
          upsert: true,
        },
      }))
    );

    return res.status(200).json({
      message: "Quiz evaluated successfully",
      topicId: topic._id,
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: totalQuestions - correctCount,
      score,
      results,
    });
  } catch (error) {
    console.error(
      "Learning quiz evaluation error:",
      error
    );

    return res.status(500).json({
      message: "Failed to evaluate learning quiz",
    });
  }
};

module.exports = {
  getLearningContent,
  submitLearningQuiz,
};
