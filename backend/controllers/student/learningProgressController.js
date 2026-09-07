const LearningProgress = require("../../models/LearningProgress");
const LearningTopic = require("../../models/LearningTopic");

// ==============================
// UPDATE LEARNING PROGRESS
// ==============================
const updateLearningProgress = async (req, res) => {
  try {
    const { topicId, progressPercentage } = req.body;

    if (!topicId) {
      return res.status(400).json({
        message: "Topic ID is required",
      });
    }

    const topic = await LearningTopic.findOne({
      _id: topicId,
      isActive: true,
    });

    if (!topic) {
      return res.status(404).json({
        message: "Learning topic not found",
      });
    }

    const percentage = Number(progressPercentage);

    if (
      Number.isNaN(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return res.status(400).json({
        message: "Progress percentage must be between 0 and 100",
      });
    }

    let progress = await LearningProgress.findOne({
      user: req.user.id,
      topic: topicId,
    });

    if (!progress) {
      progress = new LearningProgress({
        user: req.user.id,
        topic: topicId,
        startedAt: new Date(),
      });
    }

    progress.progressPercentage = percentage;
    progress.lastAccessedAt = new Date();

    if (percentage === 0) {
      progress.status = "Not Started";
      progress.completedAt = undefined;
    } else if (percentage < 100) {
      progress.status = "In Progress";

      if (!progress.startedAt) {
        progress.startedAt = new Date();
      }

      progress.completedAt = undefined;
    } else {
      progress.status = "Completed";

      if (!progress.startedAt) {
        progress.startedAt = new Date();
      }

      progress.completedAt = new Date();
    }

    await progress.save();

    res.status(200).json({
      message: "Learning progress updated successfully",
      progress,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update learning progress",
      error: error.message,
    });
  }
};

// ==============================
// GET STUDENT LEARNING PROGRESS
// ==============================
const getLearningProgress = async (req, res) => {
  try {
    const progress = await LearningProgress.find({
      user: req.user.id,
    })
      .populate(
        "topic",
        "title category difficulty estimatedMinutes skillsCovered"
      )
      .sort({ updatedAt: -1 });

    const completedTopics = progress.filter(
      (item) => item.status === "Completed"
    ).length;

    const inProgressTopics = progress.filter(
      (item) => item.status === "In Progress"
    ).length;

    res.status(200).json({
      message: "Learning progress fetched successfully",
      summary: {
        totalStarted: progress.length,
        completedTopics,
        inProgressTopics,
      },
      progress,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch learning progress",
      error: error.message,
    });
  }
};

module.exports = {
  updateLearningProgress,
  getLearningProgress,
};