const PracticeQuestion = require("../../models/PracticeQuestion");
const PracticeAttempt = require("../../models/PracticeAttempt");

// ==============================
// GET PRACTICE QUESTIONS
// ==============================
const getPracticeQuestions = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      difficulty,
      questionType,
      limit = 10,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (questionType) {
      filter.questionType = questionType;
    }

    const questions = await PracticeQuestion.find(filter)
      .select("-correctAnswer -explanation")
      .limit(Number(limit));

    res.status(200).json({
      message: "Practice questions fetched successfully",
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch practice questions",
      error: error.message,
    });
  }
};

// ==============================
// SUBMIT PRACTICE ANSWER
// ==============================
const submitPracticeAnswer = async (req, res) => {
  try {
    const {
      questionId,
      answer,
      timeTakenSeconds = 0,
    } = req.body;

    if (!questionId || answer === undefined) {
      return res.status(400).json({
        message: "Question ID and answer are required",
      });
    }

    const question = await PracticeQuestion.findOne({
      _id: questionId,
      isActive: true,
    });

    if (!question) {
      return res.status(404).json({
        message: "Practice question not found",
      });
    }

    if (question.questionType !== "MCQ") {
      return res.status(400).json({
        message:
          "This submission method currently supports MCQ questions only",
      });
    }

    const submittedAnswer = String(answer).trim();

    const correctAnswer = String(
      question.correctAnswer
    ).trim();

    const isCorrect =
      submittedAnswer.toLowerCase() ===
      correctAnswer.toLowerCase();

    const marksAwarded = isCorrect
      ? question.marks
      : 0;

    const attempt = await PracticeAttempt.create({
      user: req.user.id,
      question: question._id,
      submittedAnswer,
      isCorrect,
      marksAwarded,
      totalMarks: question.marks,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      category: question.category,
      subCategory: question.subCategory,
      difficulty: question.difficulty,
      questionType: question.questionType,
    });

    res.status(200).json({
      message: "Practice answer evaluated successfully",

      result: {
        attemptId: attempt._id,
        questionId: question._id,
        submittedAnswer,
        isCorrect,
        marksAwarded,
        totalMarks: question.marks,
        timeTakenSeconds: attempt.timeTakenSeconds,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to evaluate practice answer",
      error: error.message,
    });
  }
};

// ==============================
// GET PRACTICE HISTORY
// ==============================
const getPracticeHistory = async (req, res) => {
  try {
    const attempts = await PracticeAttempt.find({
      user: req.user.id,
    })
      .populate(
        "question",
        "questionText category subCategory difficulty questionType"
      )
      .sort({ attemptedAt: -1 });

    const totalAttempts = attempts.length;

    const correctAttempts = attempts.filter(
      (attempt) => attempt.isCorrect
    ).length;

    const incorrectAttempts =
      totalAttempts - correctAttempts;

    const totalMarks = attempts.reduce(
      (sum, attempt) => sum + attempt.totalMarks,
      0
    );

    const marksObtained = attempts.reduce(
      (sum, attempt) => sum + attempt.marksAwarded,
      0
    );

    const accuracy =
      totalAttempts > 0
        ? Math.round(
            (correctAttempts / totalAttempts) * 100
          )
        : 0;

    res.status(200).json({
      message: "Practice history fetched successfully",

      summary: {
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        marksObtained,
        totalMarks,
        accuracy,
      },

      attempts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch practice history",
      error: error.message,
    });
  }
};

module.exports = {
  getPracticeQuestions,
  submitPracticeAnswer,
  getPracticeHistory,
};