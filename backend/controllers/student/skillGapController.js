const Skill = require("../../models/Skill");
const StudentGoal = require("../../models/StudentGoal");
const Resume = require("../../models/Resume");
const PracticeAttempt = require("../../models/PracticeAttempt");
const MockAttempt = require("../../models/MockAttempt");

const analyzeSkillGap = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      skills,
      goal,
      resume,
      practiceAttempts,
      mockAttempts,
    ] = await Promise.all([
      Skill.find({ user: userId }),
      StudentGoal.findOne({ user: userId }),
      Resume.findOne({ user: userId }),
      PracticeAttempt.find({ user: userId }),
      MockAttempt.find({ user: userId }),
    ]);

    const currentSkills = skills.map((skill) =>
      skill.name.toLowerCase()
    );

    const missingSkills = [];
    const weakAreas = [];
    const priorityAreas = [];
    const recommendations = [];

    // 1. Resume ATS missing skills
    if (
      resume &&
      resume.analysisStatus === "Analyzed" &&
      Array.isArray(resume.missingSkills)
    ) {
      resume.missingSkills.forEach((skill) => {
        const alreadyExists = missingSkills.some(
          (item) =>
            item.toLowerCase() === skill.toLowerCase()
        );

        if (!alreadyExists) {
          missingSkills.push(skill);
        }
      });
    }

    // 2. Placement goal preferred skill gaps
    if (
      goal &&
      Array.isArray(goal.preferredSkills)
    ) {
      goal.preferredSkills.forEach(
        (requiredSkill) => {
          const alreadyOwned =
            currentSkills.includes(
              requiredSkill.toLowerCase()
            );

          const alreadyMissing =
            missingSkills.some(
              (item) =>
                item.toLowerCase() ===
                requiredSkill.toLowerCase()
            );

          if (!alreadyOwned && !alreadyMissing) {
            missingSkills.push(requiredSkill);
          }
        }
      );
    }

    // 3. Practice performance analysis
    const categoryStats = {};

    practiceAttempts.forEach((attempt) => {
      const category =
        attempt.category || "General";

      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          correct: 0,
        };
      }

      categoryStats[category].total += 1;

      if (attempt.isCorrect) {
        categoryStats[category].correct += 1;
      }
    });

    Object.entries(categoryStats).forEach(
      ([category, stats]) => {
        const accuracy =
          stats.total === 0
            ? 0
            : Math.round(
                (stats.correct / stats.total) *
                  100
              );

        if (accuracy < 60) {
          weakAreas.push(
            `${category} practice performance (${accuracy}% accuracy)`
          );

          priorityAreas.push(category);
        }
      }
    );

    // 4. Mock placement performance analysis
    if (mockAttempts.length > 0) {
      const completedMocks =
        mockAttempts.filter(
          (attempt) =>
            attempt.status === "Completed" ||
            attempt.completedAt
        );

      if (completedMocks.length > 0) {
        const scores = completedMocks.map(
          (attempt) => {
            if (
              typeof attempt.percentage ===
              "number"
            ) {
              return attempt.percentage;
            }

            if (
              typeof attempt.score === "number"
            ) {
              return attempt.score;
            }

            return 0;
          }
        );

        const totalScore = scores.reduce(
          (sum, score) => sum + score,
          0
        );

        const averageMockScore =
          totalScore / scores.length;

        if (averageMockScore < 60) {
          weakAreas.push(
            `Mock placement performance (${Math.round(
              averageMockScore
            )}%)`
          );

          priorityAreas.push(
            "Mock Placement Preparation"
          );
        }
      }
    }

    // 5. Generate recommendations from missing skills
    missingSkills.forEach((skill) => {
      recommendations.push(
        `Learn and practice ${skill} based on your placement goal and resume analysis.`
      );
    });

    // 6. Generate recommendations from weak areas
    weakAreas.forEach((area) => {
      recommendations.push(
        `Improve ${area} through targeted learning and practice.`
      );
    });

    // 7. Missing placement goal
    if (!goal) {
      recommendations.push(
        "Set a placement goal or target role to receive more accurate skill-gap recommendations."
      );
    }

    // 8. Missing or unanalyzed resume
    if (!resume) {
      recommendations.push(
        "Upload and analyze your resume to identify ATS-based missing skills."
      );
    } else if (
      resume.analysisStatus !== "Analyzed"
    ) {
      recommendations.push(
        "Run ATS analysis on your resume to identify missing skills."
      );
    }

    // Remove duplicate values
    const uniqueMissingSkills = [
      ...new Set(missingSkills),
    ];

    const uniqueWeakAreas = [
      ...new Set(weakAreas),
    ];

    const uniquePriorityAreas = [
      ...new Set(priorityAreas),
    ];

    const uniqueRecommendations = [
      ...new Set(recommendations),
    ];

    return res.status(200).json({
      success: true,
      skillGap: {
        targetRole:
          goal?.targetRole || null,

        currentSkills: skills.map(
          (skill) => skill.name
        ),

        preferredSkills:
          goal?.preferredSkills || [],

        missingSkills:
          uniqueMissingSkills,

        weakAreas:
          uniqueWeakAreas,

        priorityAreas:
          uniquePriorityAreas,

        recommendations:
          uniqueRecommendations,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to analyze skill gap",
      error: error.message,
    });
  }
};

module.exports = {
  analyzeSkillGap,
};