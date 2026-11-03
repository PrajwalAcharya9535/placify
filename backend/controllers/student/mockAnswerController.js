
const mongoose = require("mongoose");

const MockQuestionAttempt = require("../../models/MockQuestionAttempt");
const PracticeQuestion = require("../../models/PracticeQuestion");
const MockAttempt = require("../../models/MockAttempt");

// ==========================================
// SUBMIT MOCK MCQ ANSWER
// ==========================================
const submitMockAnswer = async (req, res) => {
  try {
    const { answer } = req.body;

    // ======================================
    // VALIDATE ANSWER
    // ======================================
    if (
      answer === undefined ||
      answer === null ||
      String(answer).trim() === ""
    ) {
      return res.status(400).json({
        message: "Answer is required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.mockQuestionAttemptId
      )
    ) {
      return res.status(400).json({
        message: "Invalid mock question attempt ID",
      });
    }

    // ======================================
    // FIND QUESTION ATTEMPT
    // ======================================
    const questionAttempt =
      await MockQuestionAttempt.findOne({
        _id: req.params.mockQuestionAttemptId,
        user: req.user.id,
      });

    if (!questionAttempt) {
      return res.status(404).json({
        message: "Mock question attempt not found",
      });
    }

    if (questionAttempt.answered) {
      return res.status(400).json({
        message: "This mock question has already been answered",
      });
    }

    // ======================================
    // VERIFY ACTIVE MOCK ATTEMPT
    // ======================================
    const mockAttempt = await MockAttempt.findOne({
      _id: questionAttempt.mockAttempt,
      user: req.user.id,
      status: "In Progress",
    });

    if (!mockAttempt) {
      return res.status(400).json({
        message: "Mock placement attempt is not active",
      });
    }

    const currentRound =
      mockAttempt.roundResults[
        mockAttempt.currentRoundIndex
      ];

    if (!currentRound) {
      return res.status(400).json({
        message: "Current mock round not found",
      });
    }

    // ======================================
    // VERIFY QUESTION BELONGS TO ROUND
    // ======================================
    if (
      currentRound.roundName !== questionAttempt.roundName ||
      currentRound.roundType !== questionAttempt.roundType
    ) {
      return res.status(400).json({
        message: "This question does not belong to the current mock round",
      });
    }

    if (currentRound.completedAt) {
      return res.status(400).json({
        message: "This mock round is already completed",
      });
    }

    // ======================================
    // CHECK ROUND DEADLINE
    // ======================================
    const now = new Date();

    if (
      currentRound.expiresAt &&
      now >= new Date(currentRound.expiresAt)
    ) {
      return res.status(409).json({
        message: "Time is over for this round. Please submit the round.",
        roundExpired: true,
        expiresAt: currentRound.expiresAt,
      });
    }

    // ======================================
    // GET ORIGINAL PRACTICE QUESTION
    // ======================================
    const question = await PracticeQuestion.findById(
      questionAttempt.question
    );

    if (!question) {
      return res.status(404).json({
        message: "Practice question not found",
      });
    }

    // ======================================
    // SERVER-SIDE ANSWER EVALUATION
    // ======================================
    const submittedAnswer = String(answer).trim();
    const correctAnswer = String(
      question.correctAnswer || ""
    ).trim();

    const isCorrect =
      submittedAnswer === correctAnswer;

    const marksAwarded = isCorrect
      ? questionAttempt.totalMarks
      : 0;

    // ======================================
    // ATOMIC ANSWER SUBMISSION
    // ======================================
    const updatedAttempt =
      await MockQuestionAttempt.findOneAndUpdate(
        {
          _id: questionAttempt._id,
          user: req.user.id,
          answered: false,
        },
        {
          $set: {
            submittedAnswer,
            isCorrect,
            marksAwarded,
            answered: true,
            answeredAt: now,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedAttempt) {
      return res.status(409).json({
        message: "This question has already been submitted",
      });
    }

    // ======================================
    // SUCCESS RESPONSE
    // ======================================
    return res.status(200).json({
      message: "Mock answer submitted successfully",

      result: {
        mockQuestionAttemptId:
          updatedAttempt._id,

        answered:
          updatedAttempt.answered,

        isCorrect:
          updatedAttempt.isCorrect,

        marksAwarded:
          updatedAttempt.marksAwarded,

        totalMarks:
          updatedAttempt.totalMarks,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit mock answer",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  submitMockAnswer,
};
