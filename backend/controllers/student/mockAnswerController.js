const MockQuestionAttempt = require("../../models/MockQuestionAttempt");
const PracticeQuestion = require("../../models/PracticeQuestion");
const MockAttempt = require("../../models/MockAttempt");

// ==============================
// SUBMIT MOCK MCQ ANSWER
// ==============================
const submitMockAnswer = async (req, res) => {
  try {
    const { answer } = req.body;

    if (
      answer === undefined ||
      answer === null ||
      String(answer).trim() === ""
    ) {
      return res.status(400).json({
        message: "Answer is required",
      });
    }

    const questionAttempt =
      await MockQuestionAttempt.findOne({
        _id: req.params.mockQuestionAttemptId,
        user: req.user.id,
      });

    if (!questionAttempt) {
      return res.status(404).json({
        message:
          "Mock question attempt not found",
      });
    }

    if (questionAttempt.answered) {
      return res.status(400).json({
        message:
          "This mock question has already been answered",
      });
    }

    const mockAttempt =
      await MockAttempt.findOne({
        _id: questionAttempt.mockAttempt,
        user: req.user.id,
        status: "In Progress",
      });

    if (!mockAttempt) {
      return res.status(400).json({
        message:
          "Mock placement attempt is not active",
      });
    }

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
      currentRound.roundName !==
      questionAttempt.roundName
    ) {
      return res.status(400).json({
        message:
          "This question does not belong to the current mock round",
      });
    }

    const question =
      await PracticeQuestion.findById(
        questionAttempt.question
      );

    if (!question) {
      return res.status(404).json({
        message:
          "Practice question not found",
      });
    }

    const submittedAnswer =
      String(answer).trim();

    const correctAnswer =
      String(question.correctAnswer).trim();

    const isCorrect =
      submittedAnswer === correctAnswer;

    questionAttempt.submittedAnswer =
      submittedAnswer;

    questionAttempt.isCorrect =
      isCorrect;

    questionAttempt.marksAwarded =
      isCorrect
        ? questionAttempt.totalMarks
        : 0;

    questionAttempt.answered = true;
    questionAttempt.answeredAt =
      new Date();

    await questionAttempt.save();

    res.status(200).json({
      message:
        "Mock answer submitted successfully",

      result: {
        mockQuestionAttemptId:
          questionAttempt._id,

        answered:
          questionAttempt.answered,

        isCorrect,

        marksAwarded:
          questionAttempt.marksAwarded,

        totalMarks:
          questionAttempt.totalMarks,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to submit mock answer",
      error: error.message,
    });
  }
};

module.exports = {
  submitMockAnswer,
};