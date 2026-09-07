const StudentGoal = require("../../models/StudentGoal");

// ==============================
// SAVE / UPDATE STUDENT GOAL
// ==============================
const saveStudentGoal = async (req, res) => {
  try {
    const {
      targetRole,
      targetCompanies,
      preferredSkills,
      preferredLocation,
      targetPackage,
      preparationGoal,
    } = req.body;

    const goal = await StudentGoal.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        targetRole,
        targetCompanies,
        preferredSkills,
        preferredLocation,
        targetPackage,
        preparationGoal,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Student goal saved successfully",
      goal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save student goal",
      error: error.message,
    });
  }
};

// ==============================
// GET STUDENT GOAL
// ==============================
const getStudentGoal = async (req, res) => {
  try {
    const goal = await StudentGoal.findOne({
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Student goal not found",
      });
    }

    res.status(200).json({
      message: "Student goal fetched successfully",
      goal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student goal",
      error: error.message,
    });
  }
};

module.exports = {
  saveStudentGoal,
  getStudentGoal,
};