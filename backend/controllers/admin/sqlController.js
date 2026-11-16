
const mongoose = require("mongoose");
const SqlProblem = require("../../models/SqlProblem");

// ==============================
// VALIDATE SQL PROBLEM
// ==============================

const validateSqlProblem = (data) => {
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.description !== "string" ||
    !data.description.trim() ||
    typeof data.category !== "string" ||
    !data.category.trim() ||
    typeof data.expectedQuery !== "string" ||
    !data.expectedQuery.trim()
  ) {
    return "Title, description, category and expected query are required";
  }

  if (!Array.isArray(data.tables) || data.tables.length === 0) {
    return "At least one SQL table is required";
  }

  for (const table of data.tables) {
    if (
      !table ||
      typeof table.tableName !== "string" ||
      !table.tableName.trim()
    ) {
      return "Each SQL table must have a table name";
    }

    if (!Array.isArray(table.columns) || table.columns.length === 0) {
      return `Table ${table.tableName} must have at least one column`;
    }

    for (const column of table.columns) {
      if (
        !column ||
        typeof column.name !== "string" ||
        !column.name.trim() ||
        typeof column.dataType !== "string" ||
        !column.dataType.trim()
      ) {
        return `Table ${table.tableName} has an invalid column`;
      }
    }
  }

  return null;
};

// ==============================
// CREATE SQL PROBLEM
// ==============================

const createSqlProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty = "Easy",
      category,
      tables = [],
      expectedQuery,
      expectedResult = [],
      explanation = "",
      marks = 10,
      timeLimitSeconds = 5,
      skillsCovered = [],
      companyTags = [],
      isActive = true,
    } = req.body;

    const payload = {
      title,
      description,
      difficulty,
      category,
      tables,
      expectedQuery,
      expectedResult,
      explanation,
      marks,
      timeLimitSeconds,
      skillsCovered,
      companyTags,
      isActive,
    };

    const validationError = validateSqlProblem(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const sqlProblem = await SqlProblem.create(payload);

    return res.status(201).json({
      success: true,
      message: "SQL problem created successfully",
      sqlProblem,
    });
  } catch (error) {
    return res
      .status(error.name === "ValidationError" ? 400 : 500)
      .json({
        success: false,
        message: "Failed to create SQL problem",
        error: error.message,
      });
  }
};

// ==============================
// GET ALL SQL PROBLEMS
// ==============================

const getAllSqlProblems = async (req, res) => {
  try {
    const { difficulty, category, isActive, search } = req.query;

    const filter = {};

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (search && typeof search === "string") {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.title = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const sqlProblems = await SqlProblem.find(filter)
      .select("-expectedQuery -expectedResult -tables.sampleData")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalProblems: sqlProblems.length,
      sqlProblems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch SQL problems",
      error: error.message,
    });
  }
};

// ==============================
// GET SQL PROBLEM BY ID
// ==============================

const getSqlProblemById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SQL problem ID",
      });
    }

    const sqlProblem = await SqlProblem.findById(req.params.id);

    if (!sqlProblem) {
      return res.status(404).json({
        success: false,
        message: "SQL problem not found",
      });
    }

    return res.status(200).json({
      success: true,
      sqlProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch SQL problem",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE SQL PROBLEM
// ==============================

const updateSqlProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SQL problem ID",
      });
    }

    const sqlProblem = await SqlProblem.findById(req.params.id);

    if (!sqlProblem) {
      return res.status(404).json({
        success: false,
        message: "SQL problem not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "difficulty",
      "category",
      "tables",
      "expectedQuery",
      "expectedResult",
      "explanation",
      "marks",
      "timeLimitSeconds",
      "skillsCovered",
      "companyTags",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sqlProblem[field] = req.body[field];
      }
    }

    const validationError = validateSqlProblem(
      sqlProblem.toObject()
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    await sqlProblem.save();

    return res.status(200).json({
      success: true,
      message: "SQL problem updated successfully",
      sqlProblem,
    });
  } catch (error) {
    return res
      .status(error.name === "ValidationError" ? 400 : 500)
      .json({
        success: false,
        message: "Failed to update SQL problem",
        error: error.message,
      });
  }
};

// ==============================
// DEACTIVATE SQL PROBLEM
// ==============================

const deactivateSqlProblem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SQL problem ID",
      });
    }

    const sqlProblem = await SqlProblem.findById(req.params.id);

    if (!sqlProblem) {
      return res.status(404).json({
        success: false,
        message: "SQL problem not found",
      });
    }

    sqlProblem.isActive = false;
    await sqlProblem.save();

    return res.status(200).json({
      success: true,
      message: "SQL problem deactivated successfully",
      sqlProblem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate SQL problem",
      error: error.message,
    });
  }
};

module.exports = {
  createSqlProblem,
  getAllSqlProblems,
  getSqlProblemById,
  updateSqlProblem,
  deactivateSqlProblem,
};
