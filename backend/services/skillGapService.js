const Skill = require("../models/Skill");
const StudentGoal = require("../models/StudentGoal");
const Resume = require("../models/Resume");
const PracticeAttempt = require("../models/PracticeAttempt");
const MockAttempt = require("../models/MockAttempt");
const CodingAttempt = require("../models/CodingAttempt");
const SqlAttempt = require("../models/SqlAttempt");
const InterviewSession = require("../models/InterviewSession");
const AIInterviewSession = require("../models/AIInterviewSession");
const GDSession = require("../models/GDSession");

// ==========================================
// BUILD SKILL GAP
// ==========================================

const buildSkillGap = async (userId) => {
  const [
    skills,
    goal,
    resume,
    practiceAttempts,
    mockAttempts,
    codingAttempts,
   sqlAttempts,
interviewSessions,
aiInterviewSessions,
gdSessions,
  ] = await Promise.all([
    Skill.find({
      user: userId,
    }),

    StudentGoal.findOne({
      user: userId,
    }),

    Resume.findOne({
      user: userId,
    }),

    PracticeAttempt.find({
      user: userId,
    }),

    MockAttempt.find({
      user: userId,
    }),

    CodingAttempt.find({
      user: userId,
    }),

    SqlAttempt.find({
      user: userId,
    }),

    InterviewSession.find({
      user: userId,
      status: "Completed",
    }).sort({
      completedAt: -1,
    }),


    AIInterviewSession.find({
  user: userId,
  status: "Completed",
}).sort({
  completedAt: -1,
}),

    GDSession.find({
      status: "Completed",
      "participants.user": userId,
    }).sort({
      completedAt: -1,
    }),
  ]);

  // ==========================================
  // CURRENT SKILLS
  // ==========================================

  const currentSkills = skills.map((skill) =>
    skill.name.toLowerCase()
  );

  const missingSkills = [];
  const weakAreas = [];
  const strongAreas = [];
  const priorityAreas = [];
  const recommendations = [];

  // ==========================================
  // STRONG AREAS
  // ==========================================

  skills.forEach((skill) => {
    const isStrongLevel =
      skill.level === "Advanced";

    const isStrongScore =
      typeof skill.score === "number" &&
      skill.score >= 75;

    if (isStrongLevel || isStrongScore) {
      strongAreas.push(skill.name);
    }
  });

  // ==========================================
  // 1. RESUME ATS MISSING SKILLS
  // ==========================================

  if (
    resume &&
    resume.analysisStatus === "Analyzed" &&
    Array.isArray(resume.missingSkills)
  ) {
    resume.missingSkills.forEach((skill) => {
      const alreadyExists = missingSkills.some(
        (item) =>
          item.toLowerCase() ===
          skill.toLowerCase()
      );

      if (!alreadyExists) {
        missingSkills.push(skill);
      }
    });
  }

  // ==========================================
  // 2. PLACEMENT GOAL SKILL GAPS
  // ==========================================

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

        if (
          !alreadyOwned &&
          !alreadyMissing
        ) {
          missingSkills.push(requiredSkill);
        }
      }
    );
  }

  // ==========================================
  // 3. PRACTICE PERFORMANCE
  // ==========================================

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

  // ==========================================
  // 4. MOCK PLACEMENT PERFORMANCE
  // ==========================================

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

  // ==========================================
  // 5. CODING PERFORMANCE
  // ==========================================

  if (codingAttempts.length > 0) {
    const codingScores =
      codingAttempts.map((attempt) =>
        typeof attempt.scorePercentage ===
        "number"
          ? attempt.scorePercentage
          : 0
      );

    const totalCodingScore =
      codingScores.reduce(
        (sum, score) => sum + score,
        0
      );

    const averageCodingScore =
      totalCodingScore /
      codingScores.length;

    if (averageCodingScore < 60) {
      weakAreas.push(
        `Coding performance (${Math.round(
          averageCodingScore
        )}% average)`
      );

      priorityAreas.push("Coding");
    }
  }

  // ==========================================
  // 6. SQL PERFORMANCE
  // ==========================================

  if (sqlAttempts.length > 0) {
    const sqlScores =
      sqlAttempts.map((attempt) =>
        typeof attempt.scorePercentage ===
        "number"
          ? attempt.scorePercentage
          : 0
      );

    const totalSqlScore =
      sqlScores.reduce(
        (sum, score) => sum + score,
        0
      );

    const averageSqlScore =
      totalSqlScore / sqlScores.length;

    if (averageSqlScore < 60) {
      weakAreas.push(
        `SQL performance (${Math.round(
          averageSqlScore
        )}% average)`
      );

      priorityAreas.push("SQL");
    }
  }

  // ==========================================
  // 7. INTERVIEW PERFORMANCE
  // ==========================================

  if (interviewSessions.length > 0) {
    const latestInterview =
      interviewSessions[0];

    if (
      latestInterview.overallScore < 60
    ) {
      weakAreas.push(
        `Interview performance (${Math.round(
          latestInterview.overallScore
        )}% score)`
      );

      priorityAreas.push(
        "Interview Preparation"
      );
    }

    if (
      latestInterview.technicalScore < 60
    ) {
      weakAreas.push(
        `Technical interview performance (${Math.round(
          latestInterview.technicalScore
        )}% score)`
      );

      priorityAreas.push(
        "Technical Interview"
      );
    }

    if (
      latestInterview.communicationScore <
      60
    ) {
      weakAreas.push(
        `Interview communication (${Math.round(
          latestInterview.communicationScore
        )}% score)`
      );

      priorityAreas.push(
        "Communication"
      );
    }

    if (
      latestInterview.confidenceScore < 60
    ) {
      weakAreas.push(
        `Interview confidence (${Math.round(
          latestInterview.confidenceScore
        )}% score)`
      );

      priorityAreas.push(
        "Interview Confidence"
      );
    }

    if (
      Array.isArray(
        latestInterview.weakAreas
      )
    ) {
      latestInterview.weakAreas.forEach(
        (area) => {
          if (area?.trim()) {
            weakAreas.push(area.trim());
          }
        }
      );
    }
  }

  // ==========================================
// 8. ADAPTIVE AI INTERVIEW PERFORMANCE
// ==========================================

if (aiInterviewSessions.length > 0) {
  const latestAIInterview =
    aiInterviewSessions[0];

  // ----------------------------------------
  // OVERALL INTERVIEW PERFORMANCE
  // ----------------------------------------

  if (
    typeof latestAIInterview.overallScore ===
      "number" &&
    latestAIInterview.overallScore < 60
  ) {
    weakAreas.push(
      `Adaptive AI interview performance (${Math.round(
        latestAIInterview.overallScore
      )}% score)`
    );

    priorityAreas.push(
      "Interview Preparation"
    );
  }

  // ----------------------------------------
  // TECHNICAL
  // ----------------------------------------

  if (
    typeof latestAIInterview.technicalScore ===
      "number" &&
    latestAIInterview.technicalScore < 60
  ) {
    weakAreas.push(
      `AI interview technical performance (${Math.round(
        latestAIInterview.technicalScore
      )}% score)`
    );

    priorityAreas.push(
      "Technical Interview"
    );
  }

  // ----------------------------------------
  // COMMUNICATION
  // ----------------------------------------

  if (
    typeof latestAIInterview.communicationScore ===
      "number" &&
    latestAIInterview.communicationScore < 60
  ) {
    weakAreas.push(
      `AI interview communication (${Math.round(
        latestAIInterview.communicationScore
      )}% score)`
    );

    priorityAreas.push(
      "Communication"
    );
  }

  // ----------------------------------------
  // RELEVANCE
  // ----------------------------------------

  if (
    typeof latestAIInterview.relevanceScore ===
      "number" &&
    latestAIInterview.relevanceScore < 60
  ) {
    weakAreas.push(
      `Interview answer relevance (${Math.round(
        latestAIInterview.relevanceScore
      )}% score)`
    );

    priorityAreas.push(
      "Interview Answer Relevance"
    );
  }

  // ----------------------------------------
  // COMPLETENESS
  // ----------------------------------------

  if (
    typeof latestAIInterview.completenessScore ===
      "number" &&
    latestAIInterview.completenessScore < 60
  ) {
    weakAreas.push(
      `Interview answer completeness (${Math.round(
        latestAIInterview.completenessScore
      )}% score)`
    );

    priorityAreas.push(
      "Interview Answer Completeness"
    );
  }

  // ----------------------------------------
  // ANSWER STRUCTURE
  // ----------------------------------------

  if (
    typeof latestAIInterview.answerStructureScore ===
      "number" &&
    latestAIInterview.answerStructureScore < 60
  ) {
    weakAreas.push(
      `Interview answer structure (${Math.round(
        latestAIInterview.answerStructureScore
      )}% score)`
    );

    priorityAreas.push(
      "Interview Answer Structure"
    );
  }

  // ----------------------------------------
  // RESUME / PROJECT EXPLANATION
  // ----------------------------------------

  if (
    typeof latestAIInterview.resumeKnowledgeScore ===
      "number" &&
    latestAIInterview.resumeKnowledgeScore < 60
  ) {
    weakAreas.push(
      `Resume and project explanation (${Math.round(
        latestAIInterview.resumeKnowledgeScore
      )}% score)`
    );

    priorityAreas.push(
      "Resume & Project Explanation"
    );
  }

  // ----------------------------------------
  // ROLE READINESS
  // ----------------------------------------

  if (
    typeof latestAIInterview.roleReadinessScore ===
      "number" &&
    latestAIInterview.roleReadinessScore < 60
  ) {
    weakAreas.push(
      `Interview role readiness (${Math.round(
        latestAIInterview.roleReadinessScore
      )}% score)`
    );

    priorityAreas.push(
      "Role Readiness"
    );
  }

  // ----------------------------------------
  // AI-DETECTED WEAK AREAS
  // ----------------------------------------

  if (
    Array.isArray(
      latestAIInterview.weakAreas
    )
  ) {
    latestAIInterview.weakAreas.forEach(
      (area) => {
        if (area?.trim()) {
          weakAreas.push(
            area.trim()
          );
        }
      }
    );
  }

  // ----------------------------------------
  // AI-DETECTED STRONG AREAS
  // ----------------------------------------

  if (
    Array.isArray(
      latestAIInterview.strengths
    )
  ) {
    latestAIInterview.strengths.forEach(
      (area) => {
        if (area?.trim()) {
          strongAreas.push(
            area.trim()
          );
        }
      }
    );
  }

  // ----------------------------------------
  // INTERVIEW RECOMMENDATIONS
  // ----------------------------------------

  if (
    Array.isArray(
      latestAIInterview.recommendations
    )
  ) {
    latestAIInterview.recommendations.forEach(
      (recommendation) => {
        if (recommendation?.trim()) {
          recommendations.push(
            recommendation.trim()
          );
        }
      }
    );
  }
}

 // 9. GROUP DISCUSSION PERFORMANCE

  if (gdSessions.length > 0) {
    // Sessions are sorted newest first.
    const latestGdSession =
      gdSessions[0];

    const participant =
      latestGdSession.participants.find(
        (item) =>
          item.user.toString() ===
          userId.toString()
      );

    if (participant) {
      if (
        participant.overallScore < 60
      ) {
        weakAreas.push(
          `GD performance (${Math.round(
            participant.overallScore
          )}% score)`
        );

        priorityAreas.push(
          "Group Discussion"
        );
      }

      if (
        participant.communicationScore <
        60
      ) {
        weakAreas.push(
          `GD communication (${Math.round(
            participant.communicationScore
          )}% score)`
        );

        priorityAreas.push(
          "Communication"
        );
      }

      if (
        participant.relevanceScore < 60
      ) {
        weakAreas.push(
          `GD relevance (${Math.round(
            participant.relevanceScore
          )}% score)`
        );

        priorityAreas.push(
          "GD Relevance"
        );
      }

      if (
        participant.structureScore < 60
      ) {
        weakAreas.push(
          `GD response structure (${Math.round(
            participant.structureScore
          )}% score)`
        );

        priorityAreas.push(
          "GD Response Structure"
        );
      }

      if (
        participant.participationScore <
        60
      ) {
        weakAreas.push(
          `GD participation (${Math.round(
            participant.participationScore
          )}% score)`
        );

        priorityAreas.push(
          "GD Participation"
        );
      }

      if (
        Array.isArray(
          participant.weakAreas
        )
      ) {
        participant.weakAreas.forEach(
          (area) => {
            if (area?.trim()) {
              weakAreas.push(
                area.trim()
              );
            }
          }
        );
      }
    }
  }

  // ==========================================
  // RECOMMENDATIONS — MISSING SKILLS
  // ==========================================

  missingSkills.forEach((skill) => {
    recommendations.push(
      `Learn and practice ${skill} based on your placement goal and resume analysis.`
    );
  });

  // ==========================================
  // RECOMMENDATIONS — WEAK AREAS
  // ==========================================

  weakAreas.forEach((area) => {
    recommendations.push(
      `Improve ${area} through targeted learning and practice.`
    );
  });

  // ==========================================
  // MISSING PLACEMENT GOAL
  // ==========================================

  if (!goal) {
    recommendations.push(
      "Set a placement goal or target role to receive more accurate skill-gap recommendations."
    );
  }

  // ==========================================
  // MISSING / UNANALYZED RESUME
  // ==========================================

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

  // ==========================================
  // REMOVE DUPLICATES
  // ==========================================

  const uniqueMissingSkills = [
    ...new Set(missingSkills),
  ];

  const uniqueWeakAreas = [
    ...new Set(weakAreas),
  ];

  const uniqueStrongAreas = [
    ...new Set(strongAreas),
  ];

  const uniquePriorityAreas = [
    ...new Set(priorityAreas),
  ];

  const uniqueRecommendations = [
    ...new Set(recommendations),
  ];

  // ==========================================
  // FINAL SKILL GAP OBJECT
  // ==========================================

  return {
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

    strongAreas:
      uniqueStrongAreas,

    priorityAreas:
      uniquePriorityAreas,

    recommendations:
      uniqueRecommendations,
  };
};

module.exports = {
  buildSkillGap,
};