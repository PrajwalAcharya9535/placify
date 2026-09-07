const PracticeQuestion = require("../../models/PracticeQuestion");
const PracticeSession = require("../../models/PracticeSession");
const PracticeAttempt = require("../../models/PracticeAttempt");

// ==============================
// START PRACTICE SESSION
// ==============================
const startPracticeSession = async (req, res) => {
  try {
    const {
      title = "Practice Session",
      category = "Mixed",
      difficulty = "Mixed",
      questionType = "MCQ",
      numberOfQuestions = 10,
      durationSeconds = 600,
    } = req.body;

    const questionLimit = Number(numberOfQuestions);
    const duration = Number(durationSeconds);

    if (
      !Number.isInteger(questionLimit) ||
      questionLimit < 1 ||
      questionLimit > 50
    ) {
      return res.status(400).json({
        message: "Number of questions must be between 1 and 50",
      });
    }

    if (!Number.isFinite(duration) || duration < 60) {
      return res.status(400).json({
        message: "Duration must be at least 60 seconds",
      });
    }

    const filter = {
      isActive: true,
    };

    if (category !== "Mixed") {
      filter.category = category;
    }

    if (difficulty !== "Mixed") {
      filter.difficulty = difficulty;
    }

    if (questionType !== "Mixed") {
      filter.questionType = questionType;
    }

    const questions = await PracticeQuestion.aggregate([
      {
        $match: filter,
      },
      {
        $sample: {
          size: questionLimit,
        },
      },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        message:
          "No practice questions found for the selected criteria",
      });
    }

    const totalMarks = questions.reduce(
      (total, question) =>
        total + (question.marks || 0),
      0
    );

    const session = await PracticeSession.create({
      user: req.user.id,
      title,
      category,
      difficulty,
      questionType,
      questions: questions.map(
        (question) => question._id
      ),
      totalQuestions: questions.length,
      totalMarks,
      durationSeconds: duration,
      status: "In Progress",
      startedAt: new Date(),
    });

    const safeQuestions = questions.map(
      (question) => ({
        _id: question._id,
        questionText: question.questionText,
        category: question.category,
        subCategory: question.subCategory,
        difficulty: question.difficulty,
        questionType: question.questionType,
        options: question.options,
        marks: question.marks,
        timeLimitSeconds:
          question.timeLimitSeconds,
        skillsCovered:
          question.skillsCovered,
      })
    );

    res.status(201).json({
      message:
        "Practice session started successfully",

      session: {
        sessionId: session._id,
        title: session.title,
        category: session.category,
        difficulty: session.difficulty,
        questionType:
          session.questionType,
        totalQuestions:
          session.totalQuestions,
        totalMarks:
          session.totalMarks,
        durationSeconds:
          session.durationSeconds,
        status:
          session.status,
        startedAt:
          session.startedAt,
        questions:
          safeQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to start practice session",
      error: error.message,
    });
  }
};

// ==============================
// COMPLETE PRACTICE SESSION
// ==============================
const completePracticeSession = async (req, res) => {
  try {
    const {
      sessionId,
      answers,
      timeSpentSeconds = 0,
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID is required",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    const session = await PracticeSession.findOne({
      _id: sessionId,
      user: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        message: "Practice session not found",
      });
    }

    if (session.status === "Completed") {
      return res.status(400).json({
        message:
          "Practice session is already completed",
      });
    }

    if (session.status !== "In Progress") {
      return res.status(400).json({
        message:
          "Practice session is not active",
      });
    }

    const questions =
      await PracticeQuestion.find({
        _id: {
          $in: session.questions,
        },
        isActive: true,
      });

    const questionMap = new Map();

    questions.forEach((question) => {
      questionMap.set(
        String(question._id),
        question
      );
    });

    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let marksObtained = 0;

    const resultDetails = [];
    const attemptsToSave = [];

    for (const answerItem of answers) {
      const {
        questionId,
        answer,
        timeTakenSeconds = 0,
      } = answerItem;

      const question = questionMap.get(
        String(questionId)
      );

      if (!question) {
        continue;
      }

      if (question.questionType !== "MCQ") {
        continue;
      }

      attemptedQuestions++;

      const submittedAnswer =
        answer === undefined ||
        answer === null
          ? ""
          : String(answer).trim();

      const correctAnswer = String(
        question.correctAnswer || ""
      ).trim();

      const isCorrect =
        submittedAnswer.toLowerCase() ===
        correctAnswer.toLowerCase();

      const marksAwarded = isCorrect
        ? question.marks
        : 0;

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      marksObtained += marksAwarded;

      attemptsToSave.push({
        user: req.user.id,
        question: question._id,
        submittedAnswer,
        isCorrect,
        marksAwarded,
        totalMarks: question.marks,
        timeTakenSeconds:
          Number(timeTakenSeconds) || 0,
        category: question.category,
        subCategory:
          question.subCategory,
        difficulty:
          question.difficulty,
        questionType:
          question.questionType,
      });

      resultDetails.push({
        questionId:
          question._id,
        submittedAnswer,
        isCorrect,
        marksAwarded,
        totalMarks:
          question.marks,
        correctAnswer:
          question.correctAnswer,
        explanation:
          question.explanation || "",
      });
    }

    if (attemptsToSave.length > 0) {
      await PracticeAttempt.insertMany(
        attemptsToSave
      );
    }

    const accuracy =
      attemptedQuestions > 0
        ? Math.round(
            (correctAnswers /
              attemptedQuestions) *
              100
          )
        : 0;

    const actualTimeSpent =
      Math.max(
        0,
        Number(timeSpentSeconds) || 0
      );

    session.attemptedQuestions =
      attemptedQuestions;

    session.correctAnswers =
      correctAnswers;

    session.incorrectAnswers =
      incorrectAnswers;

    session.marksObtained =
      marksObtained;

    session.accuracy =
      accuracy;

    session.timeSpentSeconds =
      actualTimeSpent;

    session.status =
      "Completed";

    session.completedAt =
      new Date();

    await session.save();

    res.status(200).json({
      message:
        "Practice session completed successfully",

      result: {
        sessionId:
          session._id,

        totalQuestions:
          session.totalQuestions,

        attemptedQuestions:
          session.attemptedQuestions,

        correctAnswers:
          session.correctAnswers,

        incorrectAnswers:
          session.incorrectAnswers,

        marksObtained:
          session.marksObtained,

        totalMarks:
          session.totalMarks,

        accuracy:
          session.accuracy,

        durationSeconds:
          session.durationSeconds,

        timeSpentSeconds:
          session.timeSpentSeconds,

        status:
          session.status,

        completedAt:
          session.completedAt,

        answers:
          resultDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to complete practice session",
      error: error.message,
    });
  }
};

// ==============================
// GET PRACTICE SESSION HISTORY
// ==============================
const getPracticeSessions = async (req, res) => {
  try {
    const sessions = await PracticeSession.find({
      user: req.user.id,
    })
      .select(
        "title category difficulty questionType totalQuestions attemptedQuestions correctAnswers incorrectAnswers marksObtained totalMarks accuracy durationSeconds timeSpentSeconds status startedAt completedAt"
      )
      .sort({ createdAt: -1 });

    const completedSessions =
      sessions.filter(
        (session) =>
          session.status === "Completed"
      ).length;

    const inProgressSessions =
      sessions.filter(
        (session) =>
          session.status === "In Progress"
      ).length;

    const averageAccuracy =
      completedSessions > 0
        ? Math.round(
            sessions
              .filter(
                (session) =>
                  session.status === "Completed"
              )
              .reduce(
                (total, session) =>
                  total + (session.accuracy || 0),
                0
              ) / completedSessions
          )
        : 0;

    res.status(200).json({
      message:
        "Practice session history fetched successfully",

      summary: {
        totalSessions:
          sessions.length,

        completedSessions,

        inProgressSessions,

        averageAccuracy,
      },

      sessions,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch practice session history",
      error: error.message,
    });
  }
};

module.exports = {
  startPracticeSession,
  completePracticeSession,
  getPracticeSessions,
};