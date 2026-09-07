const SqlProblem = require("../../models/SqlProblem");

// ==============================
// CREATE SQL PROBLEM
// ==============================
const createSqlProblem = async (req, res) => {
  try {
    const {
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
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !expectedQuery
    ) {
      return res.status(400).json({
        message:
          "Title, description, category and expected query are required",
      });
    }

    if (!tables || tables.length === 0) {
      return res.status(400).json({
        message:
          "At least one SQL table is required",
      });
    }

    for (const table of tables) {
      if (!table.tableName) {
        return res.status(400).json({
          message:
            "Each SQL table must have a table name",
        });
      }

      if (
        !table.columns ||
        table.columns.length === 0
      ) {
        return res.status(400).json({
          message:
            `Table ${table.tableName} must have at least one column`,
        });
      }
    }

    const sqlProblem =
      await SqlProblem.create({
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
      });

    res.status(201).json({
      message:
        "SQL problem created successfully",
      sqlProblem,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to create SQL problem",
      error: error.message,
    });
  }
};

module.exports = {
  createSqlProblem,
};