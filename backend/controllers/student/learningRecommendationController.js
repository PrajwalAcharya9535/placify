const LearningTopic = require("../../models/LearningTopic");
const Skill = require("../../models/Skill");
const StudentGoal = require("../../models/StudentGoal");
const Readiness = require("../../models/Readiness");
const LearningProgress = require("../../models/LearningProgress");

// ==============================
// GET LEARNING RECOMMENDATIONS
// ==============================
const getLearningRecommendations = async (req, res) => {
  try {
    // Get student's connected Placify data
    const skills = await Skill.find({
      user: req.user.id,
    });

    const goal = await StudentGoal.findOne({
      user: req.user.id,
    });

    const readiness = await Readiness.findOne({
      user: req.user.id,
    });

    const progress = await LearningProgress.find({
      user: req.user.id,
    });

    // Topics already completed
    const completedTopicIds = progress
      .filter((item) => item.status === "Completed")
      .map((item) => item.topic.toString());

    // Build recommendation keywords
    const keywords = new Set();

    // Add student's existing skills
    skills.forEach((skill) => {
      if (skill.name) {
        keywords.add(skill.name.toLowerCase());
      }
    });

    // Add preferred skills from placement goal
    if (goal && goal.preferredSkills) {
      goal.preferredSkills.forEach((skill) => {
        keywords.add(skill.toLowerCase());
      });
    }

    // Add weak areas from readiness
    if (readiness && readiness.weakAreas) {
      readiness.weakAreas.forEach((area) => {
        keywords.add(area.toLowerCase());
      });
    }

    const topics = await LearningTopic.find({
      isActive: true,
    });

    const recommendations = topics
      .filter(
        (topic) =>
          !completedTopicIds.includes(topic._id.toString())
      )
      .map((topic) => {
        let matchScore = 0;
        const reasons = [];

        const title = topic.title.toLowerCase();

        const coveredSkills = (topic.skillsCovered || []).map(
          (skill) => skill.toLowerCase()
        );

        keywords.forEach((keyword) => {
          if (
            title.includes(keyword) ||
            coveredSkills.includes(keyword)
          ) {
            matchScore += 20;
          }
        });

        // Goal skill matching
        if (goal && goal.preferredSkills) {
          goal.preferredSkills.forEach((skill) => {
            const skillName = skill.toLowerCase();

            if (
              title.includes(skillName) ||
              coveredSkills.includes(skillName)
            ) {
              if (!reasons.includes("Matches your placement goals")) {
                reasons.push(
                  "Matches your placement goals"
                );
              }

              matchScore += 15;
            }
          });
        }

        // Weak-area matching
        if (readiness && readiness.weakAreas) {
          readiness.weakAreas.forEach((area) => {
            const weakArea = area.toLowerCase();

            if (
              title.includes(weakArea) ||
              coveredSkills.includes(weakArea)
            ) {
              if (!reasons.includes("Helps improve a weak area")) {
                reasons.push(
                  "Helps improve a weak area"
                );
              }

              matchScore += 25;
            }
          });
        }

        // Existing skill improvement
        skills.forEach((skill) => {
          const skillName = skill.name.toLowerCase();

          if (
            title.includes(skillName) ||
            coveredSkills.includes(skillName)
          ) {
            if (
              !reasons.includes(
                "Helps strengthen your existing skills"
              )
            ) {
              reasons.push(
                "Helps strengthen your existing skills"
              );
            }
          }
        });

        return {
          topic,
          matchScore: Math.min(matchScore, 100),
          reasons,
        };
      })
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      message:
        "Learning recommendations fetched successfully",

      totalRecommendations: recommendations.length,

      recommendations,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch learning recommendations",
      error: error.message,
    });
  }
};

module.exports = {
  getLearningRecommendations,
};