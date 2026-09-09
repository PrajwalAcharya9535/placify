const GDTopic = require("../../models/GDTopic");

// ==============================
// CREATE GD TOPIC
// ==============================
const createGDTopic = async (req, res) => {
  try {
    const {
      topic,
      description,
      category,
      difficulty,
      targetRole,
      targetCompany,
      expectedKeywords,
      evaluationPoints,
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: "GD topic is required",
      });
    }

    if (
      difficulty &&
      !["Easy", "Medium", "Hard"].includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        message:
          "Difficulty must be Easy, Medium or Hard",
      });
    }

    const gdTopic = await GDTopic.create({
      topic,
      description:
        description || "",
      category:
        category || "General",
      difficulty:
        difficulty || "Medium",
      targetRole:
        targetRole || "",
      targetCompany:
        targetCompany || "",
      expectedKeywords:
        Array.isArray(
          expectedKeywords
        )
          ? expectedKeywords
          : [],
      evaluationPoints:
        Array.isArray(
          evaluationPoints
        )
          ? evaluationPoints
          : [],
      isActive: true,
    });

    res.status(201).json({
      message:
        "GD topic created successfully",
      gdTopic,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to create GD topic",
      error: error.message,
    });
  }
};

module.exports = {
  createGDTopic,
};