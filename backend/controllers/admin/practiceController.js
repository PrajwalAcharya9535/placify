const PracticeQuestion = require("../../models/PracticeQuestion");

// ==============================
// CREATE PRACTICE QUESTION
// ==============================
const createPracticeQuestion = async (req, res) => {
  try {
    const {
      questionText,
      category,
      subCategory,
      difficulty,
      questionType,
      options,
      correctAnswer,
      explanation,
      marks,
      timeLimitSeconds,
      skillsCovered,
      isActive,
    } = req.body;

    // Required fields
    if (
      !questionText ||
      !category ||
      !questionType
    ) {
      return res.status(400).json({
        message:
          "Question text, category and question type are required",
      });
    }

    // MCQ validation
    if (questionType === "MCQ") {
      if (
        !options ||
        !Array.isArray(options) ||
        options.length < 2
      ) {
        return res.status(400).json({
          message:
            "MCQ questions must have at least 2 options",
        });
      }

      if (!correctAnswer) {
        return res.status(400).json({
          message:
            "Correct answer is required for MCQ questions",
        });
      }

      if (!options.includes(correctAnswer)) {
        return res.status(400).json({
          message:
            "Correct answer must be one of the MCQ options",
        });
      }
    }

    const question =
      await PracticeQuestion.create({
        questionText,
        category,
        subCategory,
        difficulty,
        questionType,
        options,
        correctAnswer,
        explanation,
        marks,
        timeLimitSeconds,
        skillsCovered,
        isActive,
      });

    res.status(201).json({
      message:
        "Practice question created successfully",
      question,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to create practice question",
      error: error.message,
    });
  }
};

module.exports = {
  createPracticeQuestion,
};