const Skill = require("../../models/Skill");

// ==============================
// ADD SKILL
// ==============================
const addSkill = async (req, res) => {
  try {
    const { name, category, level } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: "Skill name and category are required",
      });
    }

    const existingSkill = await Skill.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (existingSkill) {
      return res.status(400).json({
        message: "Skill already exists",
      });
    }

    const skill = await Skill.create({
      user: req.user.id,
      name,
      category,
      level,
    });

    res.status(201).json({
      message: "Skill added successfully",
      skill,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add skill",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL STUDENT SKILLS
// ==============================
const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Skills fetched successfully",
      skills,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch skills",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE SKILL
// ==============================
const updateSkill = async (req, res) => {
  try {
    const { name, category, level } = req.body;

    const skill = await Skill.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    if (name) skill.name = name.trim();
    if (category) skill.category = category;
    if (level) skill.level = level;

    await skill.save();

    res.status(200).json({
      message: "Skill updated successfully",
      skill,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update skill",
      error: error.message,
    });
  }
};

// ==============================
// DELETE SKILL
// ==============================
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    res.status(200).json({
      message: "Skill deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete skill",
      error: error.message,
    });
  }
};

module.exports = {
  addSkill,
  getSkills,
  updateSkill,
  deleteSkill,
};