const MockAttempt = require("../../models/MockAttempt");
const MockTest = require("../../models/MockTest");
const PracticeQuestion = require("../../models/PracticeQuestion");
const MockQuestionAttempt = require("../../models/MockQuestionAttempt");

// ==============================
// GET CURRENT MOCK ROUND QUESTIONS
// ==============================
const getCurrentMockRoundQuestions = async (req, res) => {
  try {
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

    // ==============================
    // CURRENT ROUND
    // ==============================
    const currentRound =
      mockAttempt.roundResults[
        mockAttempt.currentRoundIndex
      ];

    if (!currentRound) {
      return res.status(400).json({
        message: "Current mock round not found",
      });
    }

    const mcqRoundTypes = [
      "Aptitude",
      "Reasoning",
      "Verbal",
      "Technical",
    ];

    if (
      !mcqRoundTypes.includes(
        currentRound.roundType
      )
    ) {
      return res.status(400).json({
        message:
          "Current round is not an MCQ round",
      });
    }

    // ==============================
    // ROUND CONFIGURATION
    // ==============================
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

    // ==============================
    // CHECK ALREADY ASSIGNED QUESTIONS
    // ==============================
    let assignedQuestions =
      await MockQuestionAttempt.find({
        mockAttempt: mockAttempt._id,
        roundName: currentRound.roundName,
      }).populate({
        path: "question",
        select:
          "questionText category subcategory difficulty questionType options marks time skills",
      });

    // ==============================
    // ASSIGN QUESTIONS ON FIRST LOAD
    // ==============================
    if (assignedQuestions.length === 0) {
      const availableQuestions =
        await PracticeQuestion.find({
          category: currentRound.roundType,
          questionType: "MCQ",
          isActive: true,
        }).select("_id");

      if (
        availableQuestions.length <
        roundConfig.numberOfQuestions
      ) {
        return res.status(400).json({
          message:
            "Not enough active questions available for this mock round",
          required:
            roundConfig.numberOfQuestions,
          available:
            availableQuestions.length,
        });
      }

      // Randomize available questions
      const shuffled = [
        ...availableQuestions,
      ].sort(() => Math.random() - 0.5);

      const selectedQuestions =
        shuffled.slice(
          0,
          roundConfig.numberOfQuestions
        );

      const marksPerQuestion =
        roundConfig.numberOfQuestions > 0
          ? roundConfig.totalMarks /
            roundConfig.numberOfQuestions
          : 0;

      const questionAttempts =
        selectedQuestions.map(
          (item) => ({
            user: req.user.id,
            mockAttempt:
              mockAttempt._id,
            mockTest: mockTest._id,
            roundName:
              currentRound.roundName,
            roundType:
              currentRound.roundType,
            question: item._id,
            submittedAnswer: "",
            isCorrect: false,
            marksAwarded: 0,
            totalMarks:
              marksPerQuestion,
            answered: false,
            answeredAt: null,
          })
        );

      await MockQuestionAttempt.insertMany(
        questionAttempts
      );

      assignedQuestions =
        await MockQuestionAttempt.find({
          mockAttempt: mockAttempt._id,
          roundName:
            currentRound.roundName,
        }).populate({
          path: "question",
          select:
            "questionText category subcategory difficulty questionType options marks time skills",
        });
    }

    // ==============================
    // SAFE RESPONSE
    // ==============================
    const questions =
      assignedQuestions.map(
        (attempt) => ({
          mockQuestionAttemptId:
            attempt._id,

          questionId:
            attempt.question?._id,

          questionText:
            attempt.question
              ?.questionText,

          category:
            attempt.question?.category,

          subcategory:
            attempt.question
              ?.subcategory,

          difficulty:
            attempt.question
              ?.difficulty,

          questionType:
            attempt.question
              ?.questionType,

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

    res.status(200).json({
      message:
        "Current mock round questions fetched successfully",

      round: {
        roundName:
          currentRound.roundName,
        roundType:
          currentRound.roundType,
        order: currentRound.order,
        durationMinutes:
          roundConfig.durationMinutes,
        totalMarks:
          currentRound.totalMarks,
        numberOfQuestions:
          questions.length,
      },

      questions,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch mock round questions",
      error: error.message,
    });
  }
};

module.exports = {
  getCurrentMockRoundQuestions,
};