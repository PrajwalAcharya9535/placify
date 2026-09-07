const LearningTopic = require("../../models/LearningTopic");

// ==============================
// CREATE LEARNING TOPIC
// ==============================
const createLearningTopic = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      difficulty,
      content,
      estimatedMinutes,
      skillsCovered,
      isActive,
    } = req.body;

    if (!title || !category || !description || !content) {
      return res.status(400).json({
        message:
          "Title, category, description and content are required",
      });
    }

    const existingTopic = await LearningTopic.findOne({
      title: title.trim(),
      category,
    });

    if (existingTopic) {
      return res.status(400).json({
        message: "Learning topic already exists",
      });
    }

    const topic = await LearningTopic.create({
      title,
      category,
      description,
      difficulty,
      content,
      estimatedMinutes,
      skillsCovered,
      isActive,
    });

    res.status(201).json({
      message: "Learning topic created successfully",
      topic,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create learning topic",
      error: error.message,
    });
  }
};

module.exports = {
  createLearningTopic,
};