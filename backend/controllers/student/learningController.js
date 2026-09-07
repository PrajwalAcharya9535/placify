const LearningTopic = require("../../models/LearningTopic");

// ==============================
// GET ALL LEARNING TOPICS
// ==============================
const getLearningTopics = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const topics = await LearningTopic.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Learning topics fetched successfully",
      totalTopics: topics.length,
      topics,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch learning topics",
      error: error.message,
    });
  }
};

// ==============================
// GET SINGLE LEARNING TOPIC
// ==============================
const getLearningTopicById = async (req, res) => {
  try {
    const topic = await LearningTopic.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!topic) {
      return res.status(404).json({
        message: "Learning topic not found",
      });
    }

    res.status(200).json({
      message: "Learning topic fetched successfully",
      topic,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch learning topic",
      error: error.message,
    });
  }
};

module.exports = {
  getLearningTopics,
  getLearningTopicById,
};