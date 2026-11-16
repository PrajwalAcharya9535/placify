
const mongoose = require("mongoose");
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

    return res.status(201).json({
      message: "Learning topic created successfully",
      topic,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create learning topic",
      error: error.message,
    });
  }
};

// ==============================
// GET ALL LEARNING TOPICS
// ==============================

const getAllLearningTopics = async (req, res) => {
  try {
    const filter = {};

    const { category, difficulty, search, isActive } = req.query;

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    const topics = await LearningTopic.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Learning topics fetched successfully",
      totalTopics: topics.length,
      topics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch learning topics",
      error: error.message,
    });
  }
};

// ==============================
// GET LEARNING TOPIC BY ID
// ==============================

const getLearningTopicById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid learning topic ID",
      });
    }

    const topic = await LearningTopic.findById(id).lean();

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Learning topic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Learning topic fetched successfully",
      topic,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch learning topic",
      error: error.message,
    });
  }
};

// ==============================
// UPDATE LEARNING TOPIC
// ==============================

const updateLearningTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid learning topic ID",
      });
    }

    const topic = await LearningTopic.findById(id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Learning topic not found",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "description",
      "difficulty",
      "content",
      "estimatedMinutes",
      "skillsCovered",
      "isActive",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.title !== undefined) {
      if (
        typeof updates.title !== "string" ||
        !updates.title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      updates.title = updates.title.trim();
    }

    if (updates.category !== undefined) {
      if (
        !LearningTopic.schema.path("category").enumValues.includes(
          updates.category
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid learning category",
        });
      }
    }

    const finalTitle = updates.title ?? topic.title;
    const finalCategory = updates.category ?? topic.category;

    const duplicate = await LearningTopic.findOne({
      _id: { $ne: topic._id },
      title: finalTitle,
      category: finalCategory,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Learning topic already exists",
      });
    }

    Object.assign(topic, updates);

    await topic.save();

    return res.status(200).json({
      success: true,
      message: "Learning topic updated successfully",
      topic,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid learning topic data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update learning topic",
      error: error.message,
    });
  }
};

// ==============================
// DEACTIVATE LEARNING TOPIC
// ==============================

const deactivateLearningTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid learning topic ID",
      });
    }

    const topic = await LearningTopic.findById(id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Learning topic not found",
      });
    }

    if (!topic.isActive) {
      return res.status(200).json({
        success: true,
        message: "Learning topic is already inactive",
        topic,
      });
    }

    topic.isActive = false;

    await topic.save();

    return res.status(200).json({
      success: true,
      message: "Learning topic deactivated successfully",
      topic,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate learning topic",
      error: error.message,
    });
  }
};

// ==============================
// EXPORT CONTROLLERS
// ==============================

module.exports = {
  createLearningTopic,
  getAllLearningTopics,
  getLearningTopicById,
  updateLearningTopic,
  deactivateLearningTopic,
};
