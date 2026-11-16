
const mongoose = require("mongoose");
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

    if (!questionText || !category || !questionType) {
      return res.status(400).json({
        message:
          "Question text, category and question type are required",
      });
    }

    if (questionType === "MCQ") {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          message: "MCQ questions must have at least 2 options",
        });
      }

      if (!correctAnswer || !options.includes(correctAnswer)) {
        return res.status(400).json({
          message: "Correct answer must be one of the MCQ options",
        });
      }
    }

    const question = await PracticeQuestion.create({
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

    return res.status(201).json({
      message: "Practice question created successfully",
      question,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create practice question",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL PRACTICE QUESTIONS
// ==============================

const getAllPracticeQuestions = async (req, res) => {
  try {
    const { category, difficulty, questionType, isActive, search } =
      req.query;

    const filter = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (questionType) filter.questionType = questionType;

    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (search) {
      filter.questionText = {
        $regex: search,
        $options: "i",
      };
    }

    const questions = await PracticeQuestion.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch practice questions",
      error: error.message,
    });
  }
};

// ==============================
// GET SINGLE PRACTICE QUESTION
// ==============================

const getPracticeQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid practice question ID",
      });
    }

    const question = await PracticeQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Practice question not found",
      });
    }

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch practice question",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE PRACTICE QUESTION
// ==============================

const updatePracticeQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid practice question ID",
      });
    }

    const question = await PracticeQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Practice question not found",
      });
    }

    const allowedFields = [
      "questionText",
      "category",
      "subCategory",
      "difficulty",
      "questionType",
      "options",
      "correctAnswer",
      "explanation",
      "marks",
      "timeLimitSeconds",
      "skillsCovered",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    }

    if (question.questionType === "MCQ") {
      if (
        !Array.isArray(question.options) ||
        question.options.length < 2
      ) {
        return res.status(400).json({
          message: "MCQ questions must have at least 2 options",
        });
      }

      if (
        !question.correctAnswer ||
        !question.options.includes(question.correctAnswer)
      ) {
        return res.status(400).json({
          message: "Correct answer must be one of the MCQ options",
        });
      }
    }

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Practice question updated successfully",
      question,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid practice question data",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update practice question",
      error: error.message,
    });
  }
};

// ==============================
// DEACTIVATE PRACTICE QUESTION
// ==============================

const deactivatePracticeQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid practice question ID",
      });
    }

    const question = await PracticeQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Practice question not found",
      });
    }

    question.isActive = false;
    await question.save();

    return res.status(200).json({
      success: true,
      message: "Practice question deactivated successfully",
      question,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to deactivate practice question",
      error: error.message,
    });
  }
};

module.exports = {
  createPracticeQuestion,
  getAllPracticeQuestions,
  getPracticeQuestionById,
  updatePracticeQuestion,
  deactivatePracticeQuestion,
};
