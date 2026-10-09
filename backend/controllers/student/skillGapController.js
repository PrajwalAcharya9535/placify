const {
  buildSkillGap,
} = require("../../services/skillGapService");

const analyzeSkillGap = async (req, res) => {
  try {
    const userId = req.user.id;

    const skillGap = await buildSkillGap(userId);

    return res.status(200).json({
      success: true,
      skillGap,
    });
  } catch (error) {
    console.error(
      "Skill Gap Analysis Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to analyze skill gap",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeSkillGap,
};