const {
  buildPersonalizedRoadmap,
} = require("../../services/roadmapService");

// ==========================================
// GET PERSONALIZED ROADMAP
// ==========================================

const getPersonalizedRoadmap = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const roadmap =
      await buildPersonalizedRoadmap(
        userId
      );

    return res.status(200).json({
      success: true,

      message:
        "Personalized roadmap generated successfully",

      roadmap,
    });
  } catch (error) {
    console.error(
      "Personalized Roadmap Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate personalized roadmap",

      error: error.message,
    });
  }
};

module.exports = {
  getPersonalizedRoadmap,
};